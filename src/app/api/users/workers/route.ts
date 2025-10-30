import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import bcrypt from 'bcryptjs'
import { z } from 'zod'
import { FormValidator } from '@/utils/form-validation'
import { generateTempPassword } from '@/utils/password-generator'
import { sendWelcomeEmail } from '@/lib/email'

// Comprehensive validation schema for worker creation
const createWorkerSchema = z.object({
  // Personal Information
  name: z.string()
    .min(2, 'Name must be at least 2 characters')
    .max(100, 'Name must be less than 100 characters')
    .regex(/^[a-zA-Z\s]+$/, 'Name can only contain letters and spaces'),
  email: z.string()
    .email('Please enter a valid email address')
    .toLowerCase()
    .transform(val => val.trim()),
  phone: z.string()
    .refine(val => FormValidator.validatePhoneNumber(val) === null, {
      message: 'Phone number must be in format +92-XXX-XXXXXXX'
    }),
  cnic: z.string()
    .refine(val => FormValidator.validateCNIC(val) === null, {
      message: 'CNIC must be in format 42101-1234567-8'
    }),
  // Address Information
  address: z.string()
    .min(10, 'Address must be at least 10 characters')
    .max(500, 'Address must be less than 500 characters'),
  city: z.string()
    .min(2, 'City must be at least 2 characters')
    .max(50, 'City must be less than 50 characters'),
  province: z.string()
    .min(2, 'Province must be at least 2 characters')
    .max(50, 'Province must be less than 50 characters'),
  // Shop Assignment
  shopId: z.string()
    .min(1, 'Shop selection is required'),
  // Worker Specific - removed position as it's not in the schema
  // Password
  password: z.string()
    .min(6, 'Password must be at least 6 characters')
    .max(100, 'Password must be less than 100 characters')
    .optional()
})

// Error response helper
function createErrorResponse(message: string, details?: any, status: number = 400) {
  return NextResponse.json({
    error: message,
    details,
    code: 'VALIDATION_ERROR',
    timestamp: new Date().toISOString()
  }, { status })
}

// GET /api/users/workers - Get workers with optional shop filtering
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    // Only Super Admin and Shop Owners can access this endpoint
    if (!session?.user || !['SUPER_ADMIN', 'SHOP_OWNER'].includes(session.user.role)) {
      return NextResponse.json({ error: 'Access denied.' }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const search = searchParams.get('search')
    const shopId = searchParams.get('shopId')

    const skip = (page - 1) * limit

    // Build search filter
    let whereClause: any = {
      role: 'SHOP_WORKER',
      status: 'ACTIVE'
    }

    // If shop owner, only show their workers
    if (session.user.role === 'SHOP_OWNER') {
      const ownerShops = await prisma.shop.findMany({
        where: { ownerId: session.user.id },
        select: { id: true }
      })
      const shopIds = ownerShops.map(shop => shop.id)
      whereClause.workerShops = {
        some: {
          shopId: { in: shopIds }
        }
      }
    }

    // Filter by specific shop if provided
    if (shopId) {
      whereClause.workerShops = {
        some: {
          shopId: shopId
        }
      }
    }

    if (search) {
      whereClause.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
        { city: { contains: search, mode: 'insensitive' } }
      ]
    }

    const [workers, totalCount] = await Promise.all([
      prisma.user.findMany({
        where: whereClause,
        select: {
          id: true,
          email: true,
          name: true,
          phone: true,
          cnic: true,
          address: true,
          city: true,
          province: true,
          status: true,
          emailVerified: true,
          createdAt: true,
          workerShops: {
            select: {
              shop: {
                select: {
                  id: true,
                  name: true,
                  city: true
                }
              },
              isActive: true,
              joinedAt: true
            }
          }
        },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' }
      }),
      prisma.user.count({ where: whereClause })
    ])

    return NextResponse.json({
      workers,
      pagination: {
        page,
        limit,
        total: totalCount,
        pages: Math.ceil(totalCount / limit)
      }
    })

  } catch (error) {
    console.error('Failed to fetch workers:', error)
    return NextResponse.json(
      { error: 'Failed to fetch workers' },
      { status: 500 }
    )
  }
}

// POST /api/users/workers - Create a new worker
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    // Only Super Admin and Shop Owners can create workers
    if (!session?.user || !['SUPER_ADMIN', 'SHOP_OWNER'].includes(session.user.role)) {
      return createErrorResponse('Forbidden - Only Super Admin or Shop Owner can create workers', null, 403)
    }

    const body = await request.json()
    
    // Comprehensive validation with Zod
    const validationResult = createWorkerSchema.safeParse(body)
    if (!validationResult.success) {
      const fieldErrors = validationResult.error.issues.map(err => ({
        field: err.path.join('.'),
        message: err.message,
        code: err.code
      }))
      return createErrorResponse('Validation failed', fieldErrors, 400)
    }

    const validatedData = validationResult.data

    // Verify shop exists and user has permission to add workers to it
    const shop = await prisma.shop.findUnique({
      where: { id: validatedData.shopId },
      include: { owner: true }
    })

    if (!shop) {
      return createErrorResponse('Shop not found', {
        field: 'shopId',
        message: 'The selected shop does not exist'
      }, 404)
    }

    // If shop owner, verify they own the shop
    if (session.user.role === 'SHOP_OWNER' && shop.ownerId !== session.user.id) {
      return createErrorResponse('Access denied', {
        field: 'shopId',
        message: 'You can only add workers to your own shops'
      }, 403)
    }

    // Check for existing user with same email or CNIC
    const [existingEmail, existingCNIC] = await Promise.all([
      prisma.user.findUnique({
        where: { email: validatedData.email }
      }),
      prisma.user.findFirst({
        where: { cnic: validatedData.cnic }
      })
    ])

    if (existingEmail) {
      return createErrorResponse('Email already exists', {
        field: 'email',
        message: 'A user with this email address already exists'
      }, 409)
    }
    if (existingCNIC) {
      return createErrorResponse('CNIC already exists', {
        field: 'cnic', 
        message: 'A user with this CNIC already exists'
      }, 409)
    }

    // Use provided password or generate a secure temporary one
    const password = validatedData.password || generateTempPassword()
    
    // Hash password with secure salt rounds
    const hashedPassword = await bcrypt.hash(password, 12)

    // Create the worker with validated data using a transaction
    const result = await prisma.$transaction(async (tx) => {
      // First create the user
      const newUser = await tx.user.create({
        data: {
          name: validatedData.name,
          email: validatedData.email,
          phone: validatedData.phone,
          cnic: validatedData.cnic,
          address: validatedData.address,
          city: validatedData.city,
          province: validatedData.province,
          role: 'SHOP_WORKER',
          status: 'ACTIVE',
          emailVerified: null, // Will be set when email is verified
          password: hashedPassword,
          createdAt: new Date(),
          updatedAt: new Date()
        }
      })

      // Then create the shop worker relationship
      await tx.shopWorker.create({
        data: {
          shopId: validatedData.shopId,
          userId: newUser.id,
          permissions: {},
          isActive: true,
          joinedAt: new Date()
        }
      })

      // Return the user with shop information
      return await tx.user.findUnique({
        where: { id: newUser.id },
        select: {
          id: true,
          name: true,
          email: true,
          phone: true,
          cnic: true,
          address: true,
          city: true,
          province: true,
          status: true,
          createdAt: true,
          workerShops: {
            select: {
              shop: {
                select: {
                  id: true,
                  name: true,
                  city: true
                }
              }
            }
          }
        }
      })
    })

    const newWorker = result

    // 📧 Send welcome email with credentials (async, don't wait)
    if (newWorker) {
      sendWelcomeEmail({
        name: newWorker.name,
        email: newWorker.email,
        password: password,
        role: 'SHOP_WORKER',
        businessName: newWorker.workerShops?.[0]?.shop?.name
      }).catch(err => {
        console.error('Failed to send welcome email:', err)
        // Don't fail the request if email fails
      })
    }

    // Return worker data with the plain password for credential display
    return NextResponse.json({
      ...newWorker,
      tempPassword: password // Include for credential display
    }, { status: 201 })

  } catch (error) {
    console.error('Failed to create worker:', error)
    
    // Handle Prisma unique constraint violations
    if (error instanceof Error && error.message.includes('Unique constraint')) {
      if (error.message.includes('email')) {
        return createErrorResponse('Email already exists', {
          field: 'email',
          message: 'A user with this email address already exists'
        }, 409)
      }
      if (error.message.includes('cnic')) {
        return createErrorResponse('CNIC already exists', {
          field: 'cnic',
          message: 'A user with this CNIC already exists'
        }, 409)
      }
    }

    return createErrorResponse('Internal server error', {
      message: 'Failed to create worker. Please try again.'
    }, 500)
  }
}
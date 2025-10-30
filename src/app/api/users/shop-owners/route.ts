import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import bcrypt from 'bcryptjs'
import { z } from 'zod'
import { FormValidator } from '@/utils/form-validation'
import { generateTempPassword } from '@/utils/password-generator'
import { sendWelcomeEmail } from '@/lib/email'

// Comprehensive validation schema for shop owner creation
const createShopOwnerSchema = z.object({
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
  // Business Information (Optional)
  businessName: z.string()
    .max(200, 'Business name must be less than 200 characters')
    .optional(),
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

// GET /api/users/shop-owners - Get eligible shop owners for assignment
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    // Only Super Admin can access this endpoint
    if (!session?.user || session.user.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'Access denied. Super Admin required.' }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const search = searchParams.get('search')
    const includeShopCounts = searchParams.get('includeShopCounts') === 'true'

    const skip = (page - 1) * limit

    // Build search filter
    let whereClause: any = {
      role: 'SHOP_OWNER',
      status: 'ACTIVE'
    }

    if (search) {
      whereClause.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
        { businessName: { contains: search, mode: 'insensitive' } },
        { city: { contains: search, mode: 'insensitive' } }
      ]
    }

    const [shopOwners, totalCount] = await Promise.all([
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
          businessName: true,
          businessRegNo: true,
          status: true,
          emailVerified: true,
          createdAt: true,
          ...(includeShopCounts && {
            _count: {
              select: {
                ownedShops: {
                  where: {
                    status: { in: ['ACTIVE', 'INACTIVE'] }
                  }
                }
              }
            },
            ownedShops: {
              select: {
                id: true,
                name: true,
                code: true,
                city: true,
                status: true,
                createdAt: true
              },
              orderBy: { createdAt: 'desc' }
            }
          })
        },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' }
      }),
      prisma.user.count({ where: whereClause })
    ])

    return NextResponse.json({
      shopOwners,
      pagination: {
        page,
        limit,
        total: totalCount,
        pages: Math.ceil(totalCount / limit)
      }
    })

  } catch (error) {
    console.error('Failed to fetch shop owners:', error)
    return NextResponse.json(
      { error: 'Failed to fetch shop owners' },
      { status: 500 }
    )
  }
}

// POST /api/users/shop-owners - Create a new shop owner
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    // Only Super Admin can create shop owners
    if (!session?.user || session.user.role !== 'SUPER_ADMIN') {
      return createErrorResponse('Forbidden - Only Super Admin can create shop owners', null, 403)
    }

    const body = await request.json()
    
    // Comprehensive validation with Zod
    const validationResult = createShopOwnerSchema.safeParse(body)
    if (!validationResult.success) {
      const fieldErrors = validationResult.error.issues.map(err => ({
        field: err.path.join('.'),
        message: err.message,
        code: err.code
      }))
      return createErrorResponse('Validation failed', fieldErrors, 400)
    }

    const validatedData = validationResult.data

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

    // Create the shop owner with validated data
    const newShopOwner = await prisma.user.create({
      data: {
        name: validatedData.name,
        email: validatedData.email,
        phone: validatedData.phone,
        cnic: validatedData.cnic,
        address: validatedData.address,
        city: validatedData.city,
        province: validatedData.province,
        businessName: validatedData.businessName || null,
        role: 'SHOP_OWNER',
        status: 'ACTIVE',
        emailVerified: null, // Will be set when email is verified
        password: hashedPassword,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        cnic: true,
        address: true,
        city: true,
        province: true,
        businessName: true,
        status: true,
        createdAt: true
      }
    })

    // 📧 Send welcome email with credentials (async, don't wait)
    sendWelcomeEmail({
      name: newShopOwner.name,
      email: newShopOwner.email,
      password: password,
      role: 'SHOP_OWNER',
      businessName: newShopOwner.businessName || undefined
    }).catch(err => {
      console.error('Failed to send welcome email:', err)
      // Don't fail the request if email fails
    })

    return NextResponse.json(newShopOwner, { status: 201 })

  } catch (error) {
    console.error('Failed to create shop owner:', error)
    
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
      message: 'Failed to create shop owner. Please try again.'
    }, 500)
  }
}

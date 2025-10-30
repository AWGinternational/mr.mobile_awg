import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { createAuditLog } from '@/lib/audit'
import { AuditAction } from '@/types'
import { z } from 'zod'

// Validation schema for shop creation
const createShopSchema = z.object({
  name: z.string().min(3, 'Shop name must be at least 3 characters'),
  address: z.string().min(10, 'Address must be at least 10 characters'),
  city: z.string().min(2, 'City is required'),
  province: z.string().min(2, 'Province is required'),
  postalCode: z.string().min(1, 'Postal code is required').regex(/^\d{4,6}$/, 'Postal code must be 4-6 digits'),
  phone: z.string().min(10, 'Phone number is required').regex(/^(\+92|0)?[-\s]?\d{2,3}[-\s]?\d{7,8}$/, 'Invalid Pakistani phone format'),
  email: z.string().email('Invalid email address'),
  licenseNumber: z.string().optional().or(z.literal('')),
  gstNumber: z.string().optional().or(z.literal('')),
  ownerId: z.string().min(1, 'Owner is required'),
  settings: z.object({
    currency: z.string().default('PKR'),
    timezone: z.string().default('Asia/Karachi'),
    gstRate: z.number().min(0).max(100).default(17),
    maxWorkers: z.number().min(1).max(10).default(2),
    businessHours: z.object({
      open: z.string().regex(/^\d{2}:\d{2}$/, 'Time format must be HH:MM'),
      close: z.string().regex(/^\d{2}:\d{2}$/, 'Time format must be HH:MM'),
      days: z.array(z.string()).min(1, 'At least one business day required')
    })
  }).optional()
})

// GET /api/shops - List shops (with role-based filtering)
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const status = searchParams.get('status')
    const city = searchParams.get('city')
    const province = searchParams.get('province')

    const skip = (page - 1) * limit

    // Build filter based on user role
    let whereClause: any = {}

    if (session.user.role === 'SHOP_OWNER') {
      // Shop owners can only see their own shops
      whereClause.ownerId = session.user.id
    } else if (session.user.role === 'SHOP_WORKER') {
      // Workers can only see shops they're assigned to
      const workerShops = await prisma.shopWorker.findMany({
        where: { userId: session.user.id, isActive: true },
        select: { shopId: true }
      })
      whereClause.id = { in: workerShops.map(ws => ws.shopId) }
    }
    // Super admins can see all shops (no additional filter)

    // Apply additional filters
    if (status) whereClause.status = status
    if (city) whereClause.city = { contains: city, mode: 'insensitive' }
    if (province) whereClause.province = { contains: province, mode: 'insensitive' }

    const [shops, totalCount] = await Promise.all([
      prisma.shop.findMany({
        where: whereClause,
        include: {
          owner: {
            select: {
              id: true,
              name: true,
              email: true,
              businessName: true
            }
          },
          workers: {
            where: { isActive: true },
            include: {
              user: {
                select: {
                  id: true,
                  name: true,
                  email: true
                }
              }
            }
          },
          _count: {
            select: {
              workers: {
                where: { isActive: true }
              }
            }
          }
        },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' }
      }),
      prisma.shop.count({ where: whereClause })
    ])

    return NextResponse.json({
      shops,
      pagination: {
        page,
        limit,
        total: totalCount,
        pages: Math.ceil(totalCount / limit)
      }
    })

  } catch (error) {
    console.error('Failed to fetch shops:', error)
    return NextResponse.json(
      { error: 'Failed to fetch shops' },
      { status: 500 }
    )
  }
}

// POST /api/shops - Create new shop (Super Admin only)
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user || session.user.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'Access denied. Super Admin required.' }, { status: 403 })
    }

    const body = await request.json()
    const validatedData = createShopSchema.parse(body)

    // Check if owner exists and has SHOP_OWNER role
    const owner = await prisma.user.findFirst({
      where: {
        id: validatedData.ownerId,
        role: 'SHOP_OWNER',
        status: 'ACTIVE'
      }
    })

    if (!owner) {
      return NextResponse.json(
        { 
          success: false,
          error: 'Owner not found or not eligible',
          message: 'The selected owner is not valid or not active'
        },
        { status: 400 }
      )
    }

    // Generate shop code
    const ownerShopsCount = await prisma.shop.count({
      where: { ownerId: validatedData.ownerId }
    })
    
    const cityCode = validatedData.city.substring(0, 3).toUpperCase()
    const businessCode = owner.businessName 
      ? owner.businessName.split(' ').map(word => word[0]).join('').substring(0, 3).toUpperCase()
      : 'SHP'
    const shopCode = `${businessCode}-${cityCode}-${String(ownerShopsCount + 1).padStart(3, '0')}`

    // Create database URL (for multi-tenant architecture)
    const dbName = shopCode.toLowerCase().replace(/-/g, '_')
    const databaseUrl = `postgresql://apple@localhost:5432/${dbName}`

    // Create the shop
    const shop = await prisma.shop.create({
      data: {
        ...validatedData,
        code: shopCode,
        databaseUrl,
        databaseName: dbName,
        status: 'ACTIVE'
      },
      include: {
        owner: {
          select: {
            id: true,
            name: true,
            email: true,
            businessName: true
          }
        }
      }
    })

    // Create audit log
    await createAuditLog({
      userId: session.user.id,
      action: AuditAction.CREATE,
      tableName: 'shops',
      recordId: shop.id,
      newValues: {
        shopName: shop.name,
        shopCode: shop.code,
        ownerId: shop.ownerId,
        city: shop.city
      }
    })

    return NextResponse.json({ 
      success: true, 
      shop,
      message: 'Shop created successfully' 
    }, { status: 201 })

  } catch (error) {
    if (error instanceof z.ZodError) {
      console.error('Validation errors:', error.issues)
      const fieldErrors: Record<string, string> = {}
      error.issues.forEach(issue => {
        const field = issue.path.join('.')
        fieldErrors[field] = issue.message
      })
      return NextResponse.json(
        { 
          success: false,
          error: 'Validation failed', 
          message: 'Please check the form fields',
          errors: fieldErrors,
          details: error.issues
        },
        { status: 400 }
      )
    }

    console.error('Failed to create shop:', error)
    return NextResponse.json(
      { 
        success: false,
        error: 'Failed to create shop', 
        message: error instanceof Error ? error.message : 'Unknown error' 
      },
      { status: 500 }
    )
  }
}

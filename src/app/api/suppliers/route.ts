import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { UserRole } from '@/types'

// GET /api/suppliers - Get all suppliers
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Only SUPER_ADMIN, SHOP_OWNER, and SHOP_WORKER can view suppliers
    if (![UserRole.SUPER_ADMIN, UserRole.SHOP_OWNER, UserRole.SHOP_WORKER].includes(session.user.role as UserRole)) {
      return NextResponse.json(
        { success: false, error: 'Insufficient permissions' },
        { status: 403 }
      )
    }

    // Get shop ID from user
    let shopId: string | undefined

    if (session.user.role === UserRole.SHOP_OWNER) {
      const user = await prisma.user.findUnique({
        where: { id: session.user.id },
        include: { ownedShops: { where: { status: 'ACTIVE' }, take: 1 } }
      })
      shopId = user?.ownedShops[0]?.id
    } else if (session.user.role === UserRole.SHOP_WORKER) {
      const user = await prisma.user.findUnique({
        where: { id: session.user.id },
        include: { workerShops: { where: { isActive: true }, take: 1 } }
      })
      shopId = user?.workerShops[0]?.shopId
    }

    if (!shopId && (session.user.role === UserRole.SHOP_OWNER || session.user.role === UserRole.SHOP_WORKER)) {
      return NextResponse.json(
        { success: false, error: 'No active shop found' },
        { status: 404 }
      )
    }

    // Parse query parameters
    const { searchParams } = new URL(request.url)
    const search = searchParams.get('search') || ''
    const status = searchParams.get('status') || 'ALL'
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const skip = (page - 1) * limit

    // Build where clause
    const where: any = {}
    
    if (shopId) {
      where.shopId = shopId
    }

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { contactPerson: { contains: search, mode: 'insensitive' } },
        { phone: { contains: search } },
        { email: { contains: search, mode: 'insensitive' } },
        { city: { contains: search, mode: 'insensitive' } }
      ]
    }

    if (status && status !== 'ALL') {
      where.status = status
    }

    // Fetch suppliers with related data
    const [suppliers, totalCount] = await Promise.all([
      prisma.supplier.findMany({
        where,
        include: {
          _count: {
            select: {
              purchases: true,
              inventoryItems: true
            }
          }
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit
      }),
      prisma.supplier.count({ where })
    ])

    // Calculate totals for each supplier
    const suppliersWithTotals = await Promise.all(
      suppliers.map(async (supplier) => {
        const purchaseStats = await prisma.purchase.aggregate({
          where: { supplierId: supplier.id },
          _sum: {
            totalAmount: true,
            paidAmount: true
          }
        })

        return {
          ...supplier,
          totalOrders: supplier._count.purchases,
          totalInventoryItems: supplier._count.inventoryItems,
          totalPurchaseAmount: Number(purchaseStats._sum.totalAmount || 0),
          totalPaid: Number(purchaseStats._sum.paidAmount || 0),
          totalDue: Number(purchaseStats._sum.totalAmount || 0) - Number(purchaseStats._sum.paidAmount || 0)
        }
      })
    )

    return NextResponse.json({
      success: true,
      data: {
        suppliers: suppliersWithTotals,
        pagination: {
          page,
          limit,
          totalCount,
          totalPages: Math.ceil(totalCount / limit)
        }
      }
    })
  } catch (error) {
    console.error('Get suppliers error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch suppliers' },
      { status: 500 }
    )
  }
}

// POST /api/suppliers - Create new supplier
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Only SUPER_ADMIN and SHOP_OWNER can create suppliers
    if (![UserRole.SUPER_ADMIN, UserRole.SHOP_OWNER].includes(session.user.role as UserRole)) {
      return NextResponse.json(
        { success: false, error: 'Insufficient permissions' },
        { status: 403 }
      )
    }

    // Get shop ID
    let shopId: string | undefined

    if (session.user.role === UserRole.SHOP_OWNER) {
      const user = await prisma.user.findUnique({
        where: { id: session.user.id },
        include: { ownedShops: { where: { status: 'ACTIVE' }, take: 1 } }
      })
      shopId = user?.ownedShops[0]?.id
    }

    if (!shopId && session.user.role === UserRole.SHOP_OWNER) {
      return NextResponse.json(
        { success: false, error: 'No active shop found' },
        { status: 404 }
      )
    }

    const body = await request.json()
    const {
      name,
      contactPerson,
      email,
      phone,
      address,
      city,
      province,
      gstNumber,
      creditLimit,
      creditDays,
      status = 'ACTIVE'
    } = body

    // Validation
    if (!name || !contactPerson || !phone || !address || !city || !province) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Check for duplicate phone in same shop
    if (shopId) {
      const existingSupplier = await prisma.supplier.findFirst({
        where: {
          phone,
          shopId
        }
      })

      if (existingSupplier) {
        return NextResponse.json(
          { success: false, error: 'Supplier with this phone number already exists' },
          { status: 409 }
        )
      }
    }

    // Create supplier
    const supplier = await prisma.supplier.create({
      data: {
        name,
        contactPerson,
        email,
        phone,
        address,
        city,
        province,
        gstNumber,
        creditLimit: creditLimit ? parseFloat(creditLimit) : null,
        creditDays: creditDays ? parseInt(creditDays) : 30,
        status,
        shopId: shopId!
      }
    })

    return NextResponse.json({
      success: true,
      data: { supplier },
      message: 'Supplier created successfully'
    }, { status: 201 })
  } catch (error) {
    console.error('Create supplier error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to create supplier' },
      { status: 500 }
    )
  }
}


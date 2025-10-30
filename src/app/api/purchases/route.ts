import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { UserRole } from '@/types'

// GET /api/purchases - Get all purchases
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
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

    // Parse query parameters
    const { searchParams } = new URL(request.url)
    const search = searchParams.get('search') || ''
    const supplierId = searchParams.get('supplierId') || ''
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
      where.invoiceNumber = { contains: search, mode: 'insensitive' }
    }

    if (supplierId) {
      where.supplierId = supplierId
    }

    if (status && status !== 'ALL') {
      where.status = status
    }

    // Fetch purchases
    const [purchases, totalCount] = await Promise.all([
      prisma.purchase.findMany({
        where,
        include: {
          supplier: {
            select: {
              id: true,
              name: true,
              contactPerson: true,
              phone: true
            }
          },
          items: {
            select: {
              id: true,
              productId: true,
              quantity: true,
              unitCost: true,
              totalCost: true
            }
          },
          _count: {
            select: {
              items: true
            }
          }
        },
        orderBy: { purchaseDate: 'desc' },
        skip,
        take: limit
      }),
      prisma.purchase.count({ where })
    ])

    return NextResponse.json({
      success: true,
      data: {
        purchases,
        pagination: {
          page,
          limit,
          totalCount,
          totalPages: Math.ceil(totalCount / limit)
        }
      }
    })
  } catch (error) {
    console.error('Get purchases error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch purchases' },
      { status: 500 }
    )
  }
}

// POST /api/purchases - Create new purchase
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Only SUPER_ADMIN and SHOP_OWNER can create purchases
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
      invoiceNumber,
      supplierId,
      items,
      paidAmount = 0,
      dueDate,
      notes,
      status = 'DRAFT'
    } = body

    // Validation
    if (!invoiceNumber || !supplierId || !items || items.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Check for duplicate invoice number
    const existingPurchase = await prisma.purchase.findUnique({
      where: { invoiceNumber }
    })

    if (existingPurchase) {
      return NextResponse.json(
        { success: false, error: 'Purchase with this invoice number already exists' },
        { status: 409 }
      )
    }

    // Calculate total amount
    const totalAmount = items.reduce((sum: number, item: any) => {
      return sum + (parseFloat(item.unitCost) * parseInt(item.quantity))
    }, 0)

    const paidAmountNum = parseFloat(paidAmount)
    const dueAmount = totalAmount - paidAmountNum

    // Create purchase with items
    const purchase = await prisma.purchase.create({
      data: {
        invoiceNumber,
        supplierId,
        shopId: shopId!,
        totalAmount,
        paidAmount: paidAmountNum,
        dueAmount,
        dueDate: dueDate ? new Date(dueDate) : null,
        notes,
        status,
        items: {
          create: items.map((item: any) => ({
            productId: item.productId,
            quantity: parseInt(item.quantity),
            receivedQty: 0,
            unitCost: parseFloat(item.unitCost),
            totalCost: parseFloat(item.unitCost) * parseInt(item.quantity)
          }))
        }
      },
      include: {
        items: true,
        supplier: true
      }
    })

    return NextResponse.json({
      success: true,
      data: { purchase },
      message: 'Purchase created successfully'
    }, { status: 201 })
  } catch (error) {
    console.error('Create purchase error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to create purchase' },
      { status: 500 }
    )
  }
}


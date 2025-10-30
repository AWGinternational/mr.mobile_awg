import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { UserRole } from '@/types'

// GET /api/purchases/[id] - Get single purchase
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const params = await context.params
    const { id } = await params

    const purchase = await prisma.purchase.findUnique({
      where: { id },
      include: {
        supplier: {
          select: {
            id: true,
            name: true,
            contactPerson: true,
            phone: true,
            email: true
          }
        },
        items: true
      }
    })
    
    // Get products separately since PurchaseItem doesn't have product relation yet
    let itemsWithProducts: any[] = []
    if (purchase?.items) {
      itemsWithProducts = await Promise.all(
        purchase.items.map(async (item) => {
          const product = await prisma.product.findUnique({
            where: { id: item.productId },
            select: {
              id: true,
              name: true,
              model: true,
              sku: true
            }
          })
          return {
            ...item,
            product
          }
        })
      )
    }

    if (!purchase) {
      return NextResponse.json(
        { success: false, error: 'Purchase not found' },
        { status: 404 }
      )
    }

    // Verify shop access for non-admin
    if (session.user.role === UserRole.SHOP_OWNER) {
      const user = await prisma.user.findUnique({
        where: { id: session.user.id },
        include: { ownedShops: true }
      })
      
      const hasAccess = user?.ownedShops.some(shop => shop.id === purchase.shopId)
      
      if (!hasAccess) {
        return NextResponse.json(
          { success: false, error: 'Access denied' },
          { status: 403 }
        )
      }
    }

    // Calculate due amount
    const dueAmount = Number(purchase.totalAmount) - Number(purchase.paidAmount)

    return NextResponse.json({
      success: true,
      data: {
        ...purchase,
        items: itemsWithProducts,
        totalAmount: Number(purchase.totalAmount),
        paidAmount: Number(purchase.paidAmount),
        dueAmount
      }
    })
  } catch (error) {
    console.error('Get purchase error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch purchase' },
      { status: 500 }
    )
  }
}

// PATCH /api/purchases/[id] - Update purchase (mainly for status changes)
export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const params = await context.params
    const { id } = await params
    const body = await request.json()
    const { status } = body

    if (!status) {
      return NextResponse.json(
        { success: false, error: 'Status is required' },
        { status: 400 }
      )
    }

    // Get purchase
    const purchase = await prisma.purchase.findUnique({
      where: { id }
    })

    if (!purchase) {
      return NextResponse.json(
        { success: false, error: 'Purchase not found' },
        { status: 404 }
      )
    }

    // Verify shop access
    if (session.user.role !== UserRole.SUPER_ADMIN) {
      let shopId: string | undefined

      if (session.user.role === UserRole.SHOP_OWNER) {
        const user = await prisma.user.findUnique({
          where: { id: session.user.id },
          include: { ownedShops: { where: { status: 'ACTIVE' }, take: 1 } }
        })
        shopId = user?.ownedShops[0]?.id
      }

      if (shopId && purchase.shopId !== shopId) {
        return NextResponse.json(
          { success: false, error: 'Access denied to this purchase' },
          { status: 403 }
        )
      }
    }

    // Validate status transition
    if (status === 'COMPLETED') {
      if (purchase.status !== 'RECEIVED') {
        return NextResponse.json(
          { success: false, error: 'Purchase must be received before completion' },
          { status: 400 }
        )
      }
      const dueAmount = Number(purchase.totalAmount) - Number(purchase.paidAmount)
      if (dueAmount > 0) {
        return NextResponse.json(
          { success: false, error: 'Purchase must be fully paid before completion' },
          { status: 400 }
        )
      }
    }

    // Update purchase status
    const updatedPurchase = await prisma.purchase.update({
      where: { id },
      data: { status }
    })

    return NextResponse.json({
      success: true,
      data: updatedPurchase,
      message: 'Purchase status updated successfully'
    })

  } catch (error) {
    console.error('Update purchase error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to update purchase' },
      { status: 500 }
    )
  }
}

// DELETE /api/purchases/[id] - Delete purchase
export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const params = await context.params
    const { id } = await params
    
    if (![UserRole.SUPER_ADMIN, UserRole.SHOP_OWNER].includes(session.user.role as UserRole)) {
      return NextResponse.json(
        { success: false, error: 'Insufficient permissions' },
        { status: 403 }
      )
    }

    // Check if purchase exists
    const purchase = await prisma.purchase.findUnique({
      where: { id }
    })

    if (!purchase) {
      return NextResponse.json(
        { success: false, error: 'Purchase not found' },
        { status: 404 }
      )
    }

    // Verify shop access for non-admin
    if (session.user.role === UserRole.SHOP_OWNER) {
      const user = await prisma.user.findUnique({
        where: { id: session.user.id },
        include: { ownedShops: true }
      })
      
      const hasAccess = user?.ownedShops.some(shop => shop.id === purchase.shopId)
      
      if (!hasAccess) {
        return NextResponse.json(
          { success: false, error: 'Access denied' },
          { status: 403 }
        )
      }
    }

    // Delete purchase (will cascade delete items)
    await prisma.purchase.delete({
      where: { id }
    })

    return NextResponse.json({
      success: true,
      message: 'Purchase deleted successfully'
    })
  } catch (error) {
    console.error('Delete purchase error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to delete purchase' },
      { status: 500 }
    )
  }
}


import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { UserRole } from '@/types'

// GET /api/suppliers/[id] - Get single supplier
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { id } = await params

    const supplier = await prisma.supplier.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            purchases: true,
            inventoryItems: true
          }
        },
        purchases: {
          take: 10,
          orderBy: { createdAt: 'desc' },
          select: {
            id: true,
            invoiceNumber: true,
            totalAmount: true,
            paidAmount: true,
            dueAmount: true,
            status: true,
            purchaseDate: true
          }
        }
      }
    })

    if (!supplier) {
      return NextResponse.json(
        { success: false, error: 'Supplier not found' },
        { status: 404 }
      )
    }

    // Verify shop access for non-admin
    if (session.user.role === UserRole.SHOP_OWNER) {
      const user = await prisma.user.findUnique({
        where: { id: session.user.id },
        include: { ownedShops: true }
      })
      
      const hasAccess = user?.ownedShops.some(shop => shop.id === supplier.shopId)
      
      if (!hasAccess) {
        return NextResponse.json(
          { success: false, error: 'Access denied' },
          { status: 403 }
        )
      }
    }

    // Calculate stats
    const purchaseStats = await prisma.purchase.aggregate({
      where: { supplierId: id },
      _sum: {
        totalAmount: true,
        paidAmount: true,
        dueAmount: true
      }
    })

    const supplierWithStats = {
      ...supplier,
      totalPurchaseAmount: purchaseStats._sum.totalAmount || 0,
      totalPaid: purchaseStats._sum.paidAmount || 0,
      totalDue: purchaseStats._sum.dueAmount || 0
    }

    return NextResponse.json({
      success: true,
      data: { supplier: supplierWithStats }
    })
  } catch (error) {
    console.error('Get supplier error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch supplier' },
      { status: 500 }
    )
  }
}

// PUT /api/suppliers/[id] - Update supplier
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Only SUPER_ADMIN and SHOP_OWNER can update suppliers
    if (![UserRole.SUPER_ADMIN, UserRole.SHOP_OWNER].includes(session.user.role as UserRole)) {
      return NextResponse.json(
        { success: false, error: 'Insufficient permissions' },
        { status: 403 }
      )
    }

    const { id } = await params
    const body = await request.json()

    // Check if supplier exists
    const existingSupplier = await prisma.supplier.findUnique({
      where: { id }
    })

    if (!existingSupplier) {
      return NextResponse.json(
        { success: false, error: 'Supplier not found' },
        { status: 404 }
      )
    }

    // Verify shop access for non-admin
    if (session.user.role === UserRole.SHOP_OWNER) {
      const user = await prisma.user.findUnique({
        where: { id: session.user.id },
        include: { ownedShops: true }
      })
      
      const hasAccess = user?.ownedShops.some(shop => shop.id === existingSupplier.shopId)
      
      if (!hasAccess) {
        return NextResponse.json(
          { success: false, error: 'Access denied' },
          { status: 403 }
        )
      }
    }

    // Check for duplicate phone if phone is being updated
    if (body.phone && body.phone !== existingSupplier.phone) {
      const duplicatePhone = await prisma.supplier.findFirst({
        where: {
          phone: body.phone,
          shopId: existingSupplier.shopId,
          id: { not: id }
        }
      })

      if (duplicatePhone) {
        return NextResponse.json(
          { success: false, error: 'Supplier with this phone number already exists' },
          { status: 409 }
        )
      }
    }

    // Update supplier
    const updateData: any = {}
    
    if (body.name) updateData.name = body.name
    if (body.contactPerson) updateData.contactPerson = body.contactPerson
    if (body.email !== undefined) updateData.email = body.email
    if (body.phone) updateData.phone = body.phone
    if (body.address) updateData.address = body.address
    if (body.city) updateData.city = body.city
    if (body.province) updateData.province = body.province
    if (body.gstNumber !== undefined) updateData.gstNumber = body.gstNumber
    if (body.creditLimit !== undefined) updateData.creditLimit = body.creditLimit ? parseFloat(body.creditLimit) : null
    if (body.creditDays !== undefined) updateData.creditDays = body.creditDays ? parseInt(body.creditDays) : 30
    if (body.status) updateData.status = body.status

    const supplier = await prisma.supplier.update({
      where: { id },
      data: updateData
    })

    return NextResponse.json({
      success: true,
      data: { supplier },
      message: 'Supplier updated successfully'
    })
  } catch (error) {
    console.error('Update supplier error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to update supplier' },
      { status: 500 }
    )
  }
}

// DELETE /api/suppliers/[id] - Delete supplier
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Only SUPER_ADMIN and SHOP_OWNER can delete suppliers
    if (![UserRole.SUPER_ADMIN, UserRole.SHOP_OWNER].includes(session.user.role as UserRole)) {
      return NextResponse.json(
        { success: false, error: 'Insufficient permissions' },
        { status: 403 }
      )
    }

    const { id } = await params

    // Check if supplier exists
    const supplier = await prisma.supplier.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            purchases: true,
            inventoryItems: true
          }
        }
      }
    })

    if (!supplier) {
      return NextResponse.json(
        { success: false, error: 'Supplier not found' },
        { status: 404 }
      )
    }

    // Verify shop access for non-admin
    if (session.user.role === UserRole.SHOP_OWNER) {
      const user = await prisma.user.findUnique({
        where: { id: session.user.id },
        include: { ownedShops: true }
      })
      
      const hasAccess = user?.ownedShops.some(shop => shop.id === supplier.shopId)
      
      if (!hasAccess) {
        return NextResponse.json(
          { success: false, error: 'Access denied' },
          { status: 403 }
        )
      }
    }

    // Check if supplier has related records
    if (supplier._count.purchases > 0 || supplier._count.inventoryItems > 0) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Cannot delete supplier with existing purchases or inventory items. Set status to INACTIVE instead.' 
        },
        { status: 409 }
      )
    }

    // Delete supplier
    await prisma.supplier.delete({
      where: { id }
    })

    return NextResponse.json({
      success: true,
      message: 'Supplier deleted successfully'
    })
  } catch (error) {
    console.error('Delete supplier error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to delete supplier' },
      { status: 500 }
    )
  }
}


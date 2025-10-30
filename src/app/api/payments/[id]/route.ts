import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { UserRole } from '@/types'

// GET /api/payments/[id] - Get single payment
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

    const payment = await prisma.payment.findUnique({
      where: { id },
      include: {
        sale: {
          include: {
            customer: true,
            items: {
              include: {
                product: {
                  select: {
                    id: true,
                    name: true,
                    sku: true
                  }
                }
              }
            }
          }
        }
      }
    })

    if (!payment) {
      return NextResponse.json(
        { success: false, error: 'Payment not found' },
        { status: 404 }
      )
    }

    // Verify shop access for non-admin
    if (session.user.role !== UserRole.SUPER_ADMIN) {
      const user = await prisma.user.findUnique({
        where: { id: session.user.id },
        include: { 
          ownedShops: true,
          workerShops: { include: { shop: true } }
        }
      })
      
      const hasAccess = user?.ownedShops.some(shop => shop.id === payment.sale.shopId) ||
                       user?.workerShops.some(ws => ws.shop.id === payment.sale.shopId)
      
      if (!hasAccess) {
        return NextResponse.json(
          { success: false, error: 'Access denied' },
          { status: 403 }
        )
      }
    }

    return NextResponse.json({
      success: true,
      data: { payment }
    })
  } catch (error) {
    console.error('Get payment error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch payment' },
      { status: 500 }
    )
  }
}

// PUT /api/payments/[id] - Update payment (mainly status updates)
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

    // Only SUPER_ADMIN and SHOP_OWNER can update payments
    if (![UserRole.SUPER_ADMIN, UserRole.SHOP_OWNER].includes(session.user.role as UserRole)) {
      return NextResponse.json(
        { success: false, error: 'Insufficient permissions' },
        { status: 403 }
      )
    }

    const { id } = await params
    const body = await request.json()

    // Check if payment exists
    const existingPayment = await prisma.payment.findUnique({
      where: { id },
      include: { sale: true }
    })

    if (!existingPayment) {
      return NextResponse.json(
        { success: false, error: 'Payment not found' },
        { status: 404 }
      )
    }

    // Verify shop access for non-admin
    if (session.user.role !== UserRole.SUPER_ADMIN) {
      const user = await prisma.user.findUnique({
        where: { id: session.user.id },
        include: { ownedShops: true }
      })
      
      const hasAccess = user?.ownedShops.some(shop => shop.id === existingPayment.sale.shopId)
      
      if (!hasAccess) {
        return NextResponse.json(
          { success: false, error: 'Access denied' },
          { status: 403 }
        )
      }
    }

    // Update payment
    const updateData: any = {}
    
    if (body.status) updateData.status = body.status
    if (body.transactionId !== undefined) updateData.transactionId = body.transactionId
    if (body.reference !== undefined) updateData.reference = body.reference
    if (body.notes !== undefined) updateData.notes = body.notes

    const payment = await prisma.payment.update({
      where: { id },
      data: updateData,
      include: {
        sale: true
      }
    })

    // If payment status changed to FAILED or REFUNDED, update sale accordingly
    if (body.status === 'FAILED' || body.status === 'REFUNDED') {
      const allPayments = await prisma.payment.findMany({
        where: { 
          saleId: payment.saleId,
          status: 'COMPLETED'
        }
      })
      
      const totalPaid = allPayments.reduce((sum, p) => sum + parseFloat(p.amount.toString()), 0)
      
      await prisma.sale.update({
        where: { id: payment.saleId },
        data: {
          paidAmount: totalPaid,
          paymentStatus: totalPaid >= parseFloat(payment.sale.totalAmount.toString()) ? 'COMPLETED' : 
                        totalPaid > 0 ? 'PENDING' : 'PENDING'
        }
      })
    }

    return NextResponse.json({
      success: true,
      data: { payment },
      message: 'Payment updated successfully'
    })
  } catch (error) {
    console.error('Update payment error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to update payment' },
      { status: 500 }
    )
  }
}

// DELETE /api/payments/[id] - Delete/void payment
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

    // Only SUPER_ADMIN and SHOP_OWNER can delete payments
    if (![UserRole.SUPER_ADMIN, UserRole.SHOP_OWNER].includes(session.user.role as UserRole)) {
      return NextResponse.json(
        { success: false, error: 'Insufficient permissions' },
        { status: 403 }
      )
    }

    const { id } = await params

    // Check if payment exists
    const payment = await prisma.payment.findUnique({
      where: { id },
      include: { sale: true }
    })

    if (!payment) {
      return NextResponse.json(
        { success: false, error: 'Payment not found' },
        { status: 404 }
      )
    }

    // Verify shop access for non-admin
    if (session.user.role !== UserRole.SUPER_ADMIN) {
      const user = await prisma.user.findUnique({
        where: { id: session.user.id },
        include: { ownedShops: true }
      })
      
      const hasAccess = user?.ownedShops.some(shop => shop.id === payment.sale.shopId)
      
      if (!hasAccess) {
        return NextResponse.json(
          { success: false, error: 'Access denied' },
          { status: 403 }
        )
      }
    }

    // Delete payment
    await prisma.payment.delete({
      where: { id }
    })

    // Recalculate sale payment status
    const remainingPayments = await prisma.payment.findMany({
      where: { 
        saleId: payment.saleId,
        status: 'COMPLETED'
      }
    })
    
    const totalPaid = remainingPayments.reduce((sum, p) => sum + parseFloat(p.amount.toString()), 0)
    
    await prisma.sale.update({
      where: { id: payment.saleId },
      data: {
        paidAmount: totalPaid,
        paymentStatus: totalPaid >= parseFloat(payment.sale.totalAmount.toString()) ? 'COMPLETED' : 
                      totalPaid > 0 ? 'PENDING' : 'PENDING'
      }
    })

    return NextResponse.json({
      success: true,
      message: 'Payment deleted successfully'
    })
  } catch (error) {
    console.error('Delete payment error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to delete payment' },
      { status: 500 }
    )
  }
}


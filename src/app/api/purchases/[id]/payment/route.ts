import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { UserRole } from '@/types'

// POST /api/purchases/[id]/payment - Record payment for purchase
export async function POST(
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

    // Only SUPER_ADMIN and SHOP_OWNER can record payments
    if (![UserRole.SUPER_ADMIN, UserRole.SHOP_OWNER].includes(session.user.role as UserRole)) {
      return NextResponse.json(
        { success: false, error: 'Insufficient permissions' },
        { status: 403 }
      )
    }

    const params = await context.params
    const purchaseId = params.id
    const body = await request.json()
    const { amount, method = 'CASH' } = body

    if (!amount || amount <= 0) {
      return NextResponse.json(
        { success: false, error: 'Invalid payment amount' },
        { status: 400 }
      )
    }

    // Get purchase
    const purchase = await prisma.purchase.findUnique({
      where: { id: purchaseId }
    })

    if (!purchase) {
      return NextResponse.json(
        { success: false, error: 'Purchase not found' },
        { status: 404 }
      )
    }

    // Verify shop access
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

    // Calculate due amount
    const currentPaid = Number(purchase.paidAmount)
    const totalAmount = Number(purchase.totalAmount)
    const currentDue = totalAmount - currentPaid
    const paymentAmount = Number(amount)

    if (paymentAmount > currentDue) {
      return NextResponse.json(
        { success: false, error: `Payment amount cannot exceed due amount of ${currentDue}` },
        { status: 400 }
      )
    }

    // Update purchase with new payment
    const newPaidAmount = currentPaid + paymentAmount
    const newDueAmount = totalAmount - newPaidAmount

    await prisma.purchase.update({
      where: { id: purchaseId },
      data: {
        paidAmount: newPaidAmount,
        dueAmount: newDueAmount
      }
    })

    return NextResponse.json({
      success: true,
      data: {
        paidAmount: newPaidAmount,
        dueAmount: newDueAmount,
        paymentAmount
      },
      message: 'Payment recorded successfully'
    })

  } catch (error) {
    console.error('Record payment error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to record payment' },
      { status: 500 }
    )
  }
}

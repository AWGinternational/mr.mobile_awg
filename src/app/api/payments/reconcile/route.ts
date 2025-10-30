import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { UserRole } from '@/types'

// POST /api/payments/reconcile - Reconcile payments for a specific date
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Only SUPER_ADMIN and SHOP_OWNER can reconcile payments
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
    const { date } = body

    if (!date) {
      return NextResponse.json(
        { success: false, error: 'Date is required' },
        { status: 400 }
      )
    }

    const startDate = new Date(date)
    startDate.setHours(0, 0, 0, 0)
    
    const endDate = new Date(date)
    endDate.setHours(23, 59, 59, 999)

    // Get all payments for the date
    const payments = await prisma.payment.findMany({
      where: {
        sale: shopId ? { shopId } : {},
        paymentDate: {
          gte: startDate,
          lte: endDate
        }
      },
      include: {
        sale: {
          select: {
            id: true,
            invoiceNumber: true,
            totalAmount: true
          }
        }
      }
    })

    // Group by payment method
    const methodSummary = payments.reduce((acc: any, payment) => {
      const method = payment.method
      if (!acc[method]) {
        acc[method] = {
          count: 0,
          total: 0,
          completed: 0,
          pending: 0,
          failed: 0,
          refunded: 0
        }
      }
      
      acc[method].count++
      acc[method].total += parseFloat(payment.amount.toString())
      
      switch (payment.status) {
        case 'COMPLETED':
          acc[method].completed += parseFloat(payment.amount.toString())
          break
        case 'PENDING':
          acc[method].pending += parseFloat(payment.amount.toString())
          break
        case 'FAILED':
          acc[method].failed += parseFloat(payment.amount.toString())
          break
        case 'REFUNDED':
          acc[method].refunded += parseFloat(payment.amount.toString())
          break
      }
      
      return acc
    }, {})

    // Calculate totals
    const totalAmount = payments.reduce((sum, p) => sum + parseFloat(p.amount.toString()), 0)
    const completedAmount = payments
      .filter(p => p.status === 'COMPLETED')
      .reduce((sum, p) => sum + parseFloat(p.amount.toString()), 0)
    const pendingAmount = payments
      .filter(p => p.status === 'PENDING')
      .reduce((sum, p) => sum + parseFloat(p.amount.toString()), 0)

    // Get discrepancies (sales with mismatched payment amounts)
    const salesWithPayments = await prisma.sale.findMany({
      where: {
        shopId: shopId || undefined,
        saleDate: {
          gte: startDate,
          lte: endDate
        }
      },
      include: {
        payments: true
      }
    })

    const discrepancies = salesWithPayments
      .map(sale => {
        const totalPaid = sale.payments
          .filter(p => p.status === 'COMPLETED')
          .reduce((sum, p) => sum + parseFloat(p.amount.toString()), 0)
        const saleTotal = parseFloat(sale.totalAmount.toString())
        const difference = saleTotal - totalPaid
        
        return {
          saleId: sale.id,
          invoiceNumber: sale.invoiceNumber,
          saleTotal,
          totalPaid,
          difference,
          hasDiscrepancy: Math.abs(difference) > 0.01 // Accounting for floating point
        }
      })
      .filter(item => item.hasDiscrepancy)

    return NextResponse.json({
      success: true,
      data: {
        date,
        summary: {
          totalPayments: payments.length,
          totalAmount,
          completedAmount,
          pendingAmount,
          methodSummary
        },
        discrepancies,
        payments: payments.map(p => ({
          id: p.id,
          saleInvoice: p.sale.invoiceNumber,
          amount: p.amount,
          method: p.method,
          status: p.status,
          paymentDate: p.paymentDate,
          transactionId: p.transactionId
        }))
      }
    })
  } catch (error) {
    console.error('Reconcile payments error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to reconcile payments' },
      { status: 500 }
    )
  }
}


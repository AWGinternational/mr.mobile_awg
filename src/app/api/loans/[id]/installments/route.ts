import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { UserRole } from '@/types'

// GET /api/loans/[id]/installments - Get all installments for a loan
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

    const { id: loanId } = await params

    // Check if loan exists
    const loan = await prisma.loan.findUnique({
      where: { id: loanId },
      include: {
        customer: true,
        installments: {
          orderBy: { installmentNo: 'asc' }
        }
      }
    })

    if (!loan) {
      return NextResponse.json(
        { success: false, error: 'Loan not found' },
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
      
      const hasAccess = user?.ownedShops.some(shop => shop.id === loan.customer.shopId) ||
                       user?.workerShops.some(ws => ws.shop.id === loan.customer.shopId)
      
      if (!hasAccess) {
        return NextResponse.json(
          { success: false, error: 'Access denied' },
          { status: 403 }
        )
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        loanId: loan.id,
        loanNumber: loan.loanNumber,
        customer: loan.customer,
        installments: loan.installments,
        summary: {
          totalInstallments: loan.totalInstallments,
          paidInstallments: loan.paidInstallments,
          remainingInstallments: loan.totalInstallments - loan.paidInstallments,
          totalAmount: loan.totalAmount,
          paidAmount: loan.paidAmount,
          remainingAmount: loan.remainingAmount
        }
      }
    })
  } catch (error) {
    console.error('Get installments error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch installments' },
      { status: 500 }
    )
  }
}

// POST /api/loans/[id]/installments - Record installment payment
export async function POST(
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

    // Workers can also record installment payments
    if (![UserRole.SUPER_ADMIN, UserRole.SHOP_OWNER, UserRole.SHOP_WORKER].includes(session.user.role as UserRole)) {
      return NextResponse.json(
        { success: false, error: 'Insufficient permissions' },
        { status: 403 }
      )
    }

    const { id: loanId } = await params
    const body = await request.json()
    const { installmentId, paidAmount, paymentDate } = body

    // Validation
    if (!installmentId || !paidAmount) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Get loan and installment
    const loan = await prisma.loan.findUnique({
      where: { id: loanId },
      include: {
        customer: true,
        installments: true
      }
    })

    if (!loan) {
      return NextResponse.json(
        { success: false, error: 'Loan not found' },
        { status: 404 }
      )
    }

    // Verify shop access
    if (session.user.role !== UserRole.SUPER_ADMIN) {
      const user = await prisma.user.findUnique({
        where: { id: session.user.id },
        include: { 
          ownedShops: true,
          workerShops: { include: { shop: true } }
        }
      })
      
      const hasAccess = user?.ownedShops.some(shop => shop.id === loan.customer.shopId) ||
                       user?.workerShops.some(ws => ws.shop.id === loan.customer.shopId)
      
      if (!hasAccess) {
        return NextResponse.json(
          { success: false, error: 'Access denied' },
          { status: 403 }
        )
      }
    }

    // Get the installment
    const installment = loan.installments.find(i => i.id === installmentId)
    
    if (!installment) {
      return NextResponse.json(
        { success: false, error: 'Installment not found' },
        { status: 404 }
      )
    }

    // Check if already paid
    if (installment.status === 'PAID') {
      return NextResponse.json(
        { success: false, error: 'Installment already paid' },
        { status: 409 }
      )
    }

    const paidAmt = parseFloat(paidAmount)
    const installmentAmt = parseFloat(installment.amount.toString())

    // Update installment
    const updatedInstallment = await prisma.loanInstallment.update({
      where: { id: installmentId },
      data: {
        paidAmount: paidAmt,
        paidDate: paymentDate ? new Date(paymentDate) : new Date(),
        status: paidAmt >= installmentAmt ? 'PAID' : 'PARTIAL'
      }
    })

    // Update loan totals
    const newPaidAmount = parseFloat(loan.paidAmount.toString()) + paidAmt
    const newRemainingAmount = parseFloat(loan.totalAmount.toString()) - newPaidAmount
    
    // Count paid installments
    const paidInstallments = loan.installments.filter(
      i => i.status === 'PAID' || (i.id === installmentId && paidAmt >= installmentAmt)
    ).length + (paidAmt >= installmentAmt ? 1 : 0)

    // Find next due date (first unpaid installment)
    const nextUnpaidInstallment = loan.installments.find(
      i => i.status === 'PENDING' && i.installmentNo > installment.installmentNo
    )

    // Determine loan status
    let loanStatus = loan.status
    if (paidInstallments >= loan.totalInstallments) {
      loanStatus = 'COMPLETED'
    }

    // Update loan
    await prisma.loan.update({
      where: { id: loanId },
      data: {
        paidAmount: newPaidAmount,
        remainingAmount: newRemainingAmount,
        paidInstallments,
        status: loanStatus,
        nextDueDate: nextUnpaidInstallment?.dueDate || null
      }
    })

    return NextResponse.json({
      success: true,
      data: { installment: updatedInstallment },
      message: 'Installment payment recorded successfully'
    })
  } catch (error) {
    console.error('Record installment payment error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to record payment' },
      { status: 500 }
    )
  }
}


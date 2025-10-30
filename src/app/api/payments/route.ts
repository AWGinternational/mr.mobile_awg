import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { UserRole } from '@/types'

// GET /api/payments - Get all payments
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

    if (session.user.role === UserRole.SHOP_OWNER || session.user.role === UserRole.SHOP_WORKER) {
      const user = await prisma.user.findUnique({
        where: { id: session.user.id },
        include: { 
          ownedShops: { where: { status: 'ACTIVE' }, take: 1 },
          workerShops: { where: { isActive: true }, take: 1, include: { shop: true } }
        }
      })
      
      if (session.user.role === UserRole.SHOP_OWNER) {
        shopId = user?.ownedShops[0]?.id
      } else if (session.user.role === UserRole.SHOP_WORKER) {
        shopId = user?.workerShops[0]?.shop?.id
      }
    }

    if (!shopId && session.user.role !== UserRole.SUPER_ADMIN) {
      return NextResponse.json(
        { success: false, error: 'No active shop found' },
        { status: 404 }
      )
    }

    // Parse query parameters
    const { searchParams } = new URL(request.url)
    const search = searchParams.get('search') || ''
    const method = searchParams.get('method') || 'ALL'
    const status = searchParams.get('status') || 'ALL'
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const skip = (page - 1) * limit

    // Build where clause for sales
    const salesWhere: any = {}
    
    if (shopId) {
      salesWhere.shopId = shopId
    }

    if (startDate && endDate) {
      salesWhere.saleDate = {
        gte: new Date(startDate),
        lte: new Date(endDate)
      }
    }

    // Build where clause for payments
    const paymentsWhere: any = {}
    
    if (method && method !== 'ALL') {
      paymentsWhere.method = method
    }

    if (status && status !== 'ALL') {
      paymentsWhere.status = status
    }

    // Fetch sale payments
    const [salePayments, salePaymentCount] = await Promise.all([
      prisma.payment.findMany({
        where: {
          ...paymentsWhere,
          sale: salesWhere
        },
        include: {
          sale: {
            select: {
              id: true,
              invoiceNumber: true,
              customer: {
                select: {
                  id: true,
                  name: true,
                  phone: true
                }
              },
              totalAmount: true,
              saleDate: true
            }
          }
        },
        orderBy: { paymentDate: 'desc' },
        take: limit
      }),
      prisma.payment.count({
        where: {
          ...paymentsWhere,
          sale: salesWhere
        }
      })
    ])

    // Fetch loan installment payments
    const loanInstallmentsWhere: any = {
      status: { in: ['PAID', 'PARTIAL'] },
      paidDate: { not: null }
    }

    if (shopId) {
      loanInstallmentsWhere.loan = {
        customer: { shopId }
      }
    }

    if (startDate && endDate) {
      loanInstallmentsWhere.paidDate = {
        gte: new Date(startDate),
        lte: new Date(endDate)
      }
    }

    const [loanPayments, loanPaymentCount] = await Promise.all([
      prisma.loanInstallment.findMany({
        where: loanInstallmentsWhere,
        include: {
          loan: {
            include: {
              customer: {
                select: {
                  id: true,
                  name: true,
                  phone: true
                }
              }
            }
          }
        },
        orderBy: { paidDate: 'desc' },
        take: limit
      }),
      prisma.loanInstallment.count({
        where: loanInstallmentsWhere
      })
    ])

    // Combine and format payments
    const payments = [
      ...salePayments.map(p => ({
        id: p.id,
        amount: p.amount,
        method: p.method,
        status: p.status,
        transactionId: p.transactionId,
        reference: p.reference,
        notes: p.notes,
        paymentDate: p.paymentDate,
        type: 'SALE' as const,
        sale: p.sale
      })),
      ...loanPayments.map(p => ({
        id: p.id,
        amount: p.paidAmount || 0,
        method: 'LOAN_PAYMENT' as const,
        status: p.status === 'PAID' ? 'COMPLETED' : 'PENDING',
        transactionId: null,
        reference: p.loan.loanNumber,
        notes: `Installment #${p.installmentNo}`,
        paymentDate: p.paidDate || p.createdAt,
        type: 'LOAN' as const,
        loan: {
          id: p.loan.id,
          loanNumber: p.loan.loanNumber,
          customer: p.loan.customer,
          totalAmount: p.loan.totalAmount,
          installmentNo: p.installmentNo
        }
      }))
    ].sort((a, b) => new Date(b.paymentDate).getTime() - new Date(a.paymentDate).getTime()).slice(0, limit)

    const totalCount = salePaymentCount + loanPaymentCount

    // Calculate statistics for sale payments
    const saleStats = await prisma.payment.aggregate({
      where: {
        ...paymentsWhere,
        sale: salesWhere
      },
      _sum: {
        amount: true
      },
      _count: {
        id: true
      }
    })

    // Calculate statistics for loan payments
    const loanStats = await prisma.loanInstallment.aggregate({
      where: loanInstallmentsWhere,
      _sum: {
        paidAmount: true
      },
      _count: {
        id: true
      }
    })

    // Get payment method breakdown
    const methodBreakdown = await prisma.payment.groupBy({
      by: ['method'],
      where: {
        sale: salesWhere,
        status: 'COMPLETED'
      },
      _sum: {
        amount: true
      },
      _count: {
        id: true
      }
    })

    // Get payment status breakdown
    const statusBreakdown = await prisma.payment.groupBy({
      by: ['status'],
      where: {
        sale: salesWhere
      },
      _count: {
        id: true
      }
    })

    // Combined statistics
    const totalAmount = (Number(saleStats._sum.amount) || 0) + (Number(loanStats._sum.paidAmount) || 0)
    const totalPayments = (saleStats._count.id || 0) + (loanStats._count.id || 0)

    return NextResponse.json({
      success: true,
      data: {
        payments,
        pagination: {
          page,
          limit,
          totalCount,
          totalPages: Math.ceil(totalCount / limit)
        },
        stats: {
          totalAmount,
          totalPayments,
          salePayments: saleStats._count.id || 0,
          loanPayments: loanStats._count.id || 0,
          saleAmount: Number(saleStats._sum.amount) || 0,
          loanAmount: Number(loanStats._sum.paidAmount) || 0,
          methodBreakdown,
          statusBreakdown
        }
      }
    })
  } catch (error) {
    console.error('Get payments error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch payments' },
      { status: 500 }
    )
  }
}

// POST /api/payments - Create new payment (for existing sale)
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const {
      saleId,
      amount,
      method,
      transactionId,
      reference,
      notes
    } = body

    // Validation
    if (!saleId || !amount || !method) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Check if sale exists and get shop access
    const sale = await prisma.sale.findUnique({
      where: { id: saleId },
      include: {
        payments: true
      }
    })

    if (!sale) {
      return NextResponse.json(
        { success: false, error: 'Sale not found' },
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
      
      const hasAccess = user?.ownedShops.some(shop => shop.id === sale.shopId) ||
                       user?.workerShops.some(ws => ws.shop.id === sale.shopId)
      
      if (!hasAccess) {
        return NextResponse.json(
          { success: false, error: 'Access denied' },
          { status: 403 }
        )
      }
    }

    // Calculate total paid so far
    const totalPaid = sale.payments.reduce((sum, p) => sum + parseFloat(p.amount.toString()), 0)
    const newTotal = totalPaid + parseFloat(amount)
    const saleTotal = parseFloat(sale.totalAmount.toString())

    // Check if payment exceeds remaining amount
    if (newTotal > saleTotal) {
      return NextResponse.json(
        { success: false, error: `Payment amount exceeds remaining balance. Remaining: ${saleTotal - totalPaid}` },
        { status: 400 }
      )
    }

    // Create payment
    const payment = await prisma.payment.create({
      data: {
        saleId,
        amount: parseFloat(amount),
        method,
        status: 'COMPLETED',
        transactionId,
        reference,
        notes
      }
    })

    // Update sale payment status
    const updatedPaidAmount = newTotal
    const paymentStatus = updatedPaidAmount >= saleTotal ? 'COMPLETED' : 
                         updatedPaidAmount > 0 ? 'PENDING' : 'PENDING'

    await prisma.sale.update({
      where: { id: saleId },
      data: {
        paidAmount: updatedPaidAmount,
        paymentStatus
      }
    })

    return NextResponse.json({
      success: true,
      data: { payment },
      message: 'Payment recorded successfully'
    }, { status: 201 })
  } catch (error) {
    console.error('Create payment error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to create payment' },
      { status: 500 }
    )
  }
}


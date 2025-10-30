import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { UserRole } from '@/types'

// GET /api/loans/overdue - Get all overdue loans
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

    const today = new Date()

    // Build where clause
    const where: any = {
      status: 'ACTIVE',
      nextDueDate: {
        lt: today
      }
    }

    if (shopId) {
      where.customer = { shopId }
    }

    // Fetch overdue loans
    const overdueLoans = await prisma.loan.findMany({
      where,
      include: {
        customer: {
          select: {
            id: true,
            name: true,
            phone: true,
            email: true,
            cnic: true
          }
        },
        installments: {
          where: {
            status: 'PENDING',
            dueDate: {
              lt: today
            }
          },
          orderBy: { dueDate: 'asc' }
        }
      },
      orderBy: { nextDueDate: 'asc' }
    })

    // Calculate overdue amounts
    const loansWithOverdueInfo = overdueLoans.map(loan => {
      const overdueInstallments = loan.installments
      const totalOverdueAmount = overdueInstallments.reduce(
        (sum, inst) => sum + parseFloat(inst.amount.toString()), 
        0
      )
      
      const daysPastDue = loan.nextDueDate 
        ? Math.floor((today.getTime() - new Date(loan.nextDueDate).getTime()) / (1000 * 60 * 60 * 24))
        : 0

      return {
        ...loan,
        overdueInstallments,
        totalOverdueAmount,
        daysPastDue,
        severity: daysPastDue > 60 ? 'HIGH' : daysPastDue > 30 ? 'MEDIUM' : 'LOW'
      }
    })

    // Sort by severity
    const sortedLoans = loansWithOverdueInfo.sort((a, b) => {
      const severityOrder = { HIGH: 3, MEDIUM: 2, LOW: 1 }
      return severityOrder[b.severity as 'HIGH' | 'MEDIUM' | 'LOW'] - severityOrder[a.severity as 'HIGH' | 'MEDIUM' | 'LOW']
    })

    // Calculate totals
    const totalOverdueAmount = loansWithOverdueInfo.reduce(
      (sum, loan) => sum + loan.totalOverdueAmount, 
      0
    )

    return NextResponse.json({
      success: true,
      data: {
        overdueLoans: sortedLoans,
        summary: {
          totalOverdueLoans: overdueLoans.length,
          totalOverdueAmount,
          highSeverity: loansWithOverdueInfo.filter(l => l.severity === 'HIGH').length,
          mediumSeverity: loansWithOverdueInfo.filter(l => l.severity === 'MEDIUM').length,
          lowSeverity: loansWithOverdueInfo.filter(l => l.severity === 'LOW').length
        }
      }
    })
  } catch (error) {
    console.error('Get overdue loans error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch overdue loans' },
      { status: 500 }
    )
  }
}

// POST /api/loans/overdue - Send reminder notifications for overdue loans
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Only SUPER_ADMIN and SHOP_OWNER can send reminders
    if (![UserRole.SUPER_ADMIN, UserRole.SHOP_OWNER].includes(session.user.role as UserRole)) {
      return NextResponse.json(
        { success: false, error: 'Insufficient permissions' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const { loanIds, message } = body

    if (!loanIds || !Array.isArray(loanIds) || loanIds.length === 0) {
      return NextResponse.json(
        { success: false, error: 'No loan IDs provided' },
        { status: 400 }
      )
    }

    // Get loans with customer info
    const loans = await prisma.loan.findMany({
      where: {
        id: { in: loanIds }
      },
      include: {
        customer: true
      }
    })

    // TODO: Implement SMS/Email notification service
    // For now, we'll just return success
    // In production, you would integrate with:
    // - SMS provider (Twilio, Africa's Talking, etc.)
    // - WhatsApp Business API
    // - Email service

    const remindersSent = loans.map(loan => ({
      loanId: loan.id,
      customerId: loan.customer.id,
      customerName: loan.customer.name,
      customerPhone: loan.customer.phone,
      status: 'QUEUED' // Would be 'SENT' when actual SMS service is integrated
    }))

    return NextResponse.json({
      success: true,
      data: {
        remindersSent,
        totalSent: remindersSent.length
      },
      message: `Reminders queued for ${remindersSent.length} customers`
    })
  } catch (error) {
    console.error('Send reminders error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to send reminders' },
      { status: 500 }
    )
  }
}


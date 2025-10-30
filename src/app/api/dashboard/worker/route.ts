import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { startOfDay, endOfDay, startOfWeek, endOfWeek, startOfMonth, endOfMonth, subDays } from 'date-fns'

/**
 * Worker Dashboard API
 * GET /api/dashboard/worker
 * 
 * Returns real-time worker performance data:
 * - Today's sales and commission
 * - Recent transactions by this worker
 * - Pending approval requests
 * - Performance metrics (week/month)
 * - Shift information
 */

export async function GET(request: NextRequest) {
  try {
    // 1. Authentication Check
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized - Please log in' },
        { status: 401 }
      )
    }

    // 2. Verify user is a worker
    if (session.user.role !== 'SHOP_WORKER') {
      return NextResponse.json(
        { error: 'Access denied - This endpoint is for workers only' },
        { status: 403 }
      )
    }

    // 3. Get worker's shop ID
    const workerRecord = await prisma.shopWorker.findFirst({
      where: {
        userId: session.user.id,
        isActive: true,
      },
      include: {
        shop: {
          select: {
            id: true,
            name: true,
            address: true,
            city: true,
          },
        },
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
          },
        },
      },
    })

    if (!workerRecord) {
      return NextResponse.json(
        { error: 'Worker record not found' },
        { status: 404 }
      )
    }

    const shopId = workerRecord.shopId
    const workerId = session.user.id

    // 4. Date ranges for queries
    const now = new Date()
    const todayStart = startOfDay(now)
    const todayEnd = endOfDay(now)
    const weekStart = startOfWeek(now)
    const weekEnd = endOfWeek(now)
    const monthStart = startOfMonth(now)
    const monthEnd = endOfMonth(now)

    // 5. Get today's sales by this worker
    const todaySales = await prisma.sale.findMany({
      where: {
        shopId,
        sellerId: workerId,
        saleDate: {
          gte: todayStart,
          lte: todayEnd,
        },
      },
      select: {
        id: true,
        totalAmount: true,
        status: true,
      },
    })

    // Calculate today's metrics
    const todayTotal = todaySales.reduce(
      (sum, sale) => sum + Number(sale.totalAmount),
      0
    )
    const todayTransactions = todaySales.length

    // 6. Get weekly sales
    const weeklySales = await prisma.sale.findMany({
      where: {
        shopId,
        sellerId: workerId,
        saleDate: {
          gte: weekStart,
          lte: weekEnd,
        },
      },
      select: {
        totalAmount: true,
      },
    })

    const weeklyTotal = weeklySales.reduce(
      (sum, sale) => sum + Number(sale.totalAmount),
      0
    )

    // 7. Get monthly sales
    const monthlySales = await prisma.sale.findMany({
      where: {
        shopId,
        sellerId: workerId,
        saleDate: {
          gte: monthStart,
          lte: monthEnd,
        },
      },
      select: {
        totalAmount: true,
      },
    })

    const monthlyTotal = monthlySales.reduce(
      (sum, sale) => sum + Number(sale.totalAmount),
      0
    )

    // 8. Get shop settings for commission rate
    const shop = await prisma.shop.findUnique({
      where: { id: shopId },
      select: { settings: true },
    })

    const shopSettings = (shop?.settings as any) || {}
    const commissionRate = shopSettings.commissionRate || 3.0 // Default 3%

    // Calculate commission
    const todayCommission = (todayTotal * commissionRate) / 100
    const weeklyCommission = (weeklyTotal * commissionRate) / 100
    const monthlyCommission = (monthlyTotal * commissionRate) / 100

    // 9. Get recent transactions (last 10)
    const recentTransactions = await prisma.sale.findMany({
      where: {
        shopId,
        sellerId: workerId,
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: 10,
      select: {
        id: true,
        invoiceNumber: true,
        totalAmount: true,
        paymentMethod: true,
        status: true,
        saleDate: true,
        customer: {
          select: {
            name: true,
          },
        },
        items: {
          select: {
            product: {
              select: {
                name: true,
              },
            },
            quantity: true,
          },
        },
      },
    })

    // 10. Get pending approval requests by this worker
    const pendingApprovals = await prisma.approvalRequest.findMany({
      where: {
        workerId,
        shopId,
        status: 'PENDING',
      },
      orderBy: {
        createdAt: 'desc',
      },
      select: {
        id: true,
        type: true,
        tableName: true,
        recordId: true,
        requestData: true,
        reason: true,
        status: true,
        createdAt: true,
      },
    })

    // 11. Get sales trend (last 7 days)
    const last7Days = Array.from({ length: 7 }, (_, i) => {
      const date = subDays(now, 6 - i)
      return {
        date: startOfDay(date),
        label: date.toLocaleDateString('en-US', { weekday: 'short' }),
      }
    })

    const salesTrend = await Promise.all(
      last7Days.map(async ({ date, label }) => {
        const dayEnd = endOfDay(date)
        const sales = await prisma.sale.findMany({
          where: {
            shopId,
            sellerId: workerId,
            saleDate: {
              gte: date,
              lte: dayEnd,
            },
          },
          select: {
            totalAmount: true,
          },
        })

        const total = sales.reduce(
          (sum, sale) => sum + Number(sale.totalAmount),
          0
        )

        return {
          day: label,
          sales: total,
          count: sales.length,
        }
      })
    )

    // 12. Build response
    const response = {
      worker: {
        id: workerRecord.user.id,
        name: workerRecord.user.name,
        email: workerRecord.user.email,
        phone: workerRecord.user.phone,
        workerId: workerRecord.id,
        joinedAt: workerRecord.joinedAt,
      },
      shop: {
        id: workerRecord.shop.id,
        name: workerRecord.shop.name,
        address: workerRecord.shop.address,
        city: workerRecord.shop.city,
      },
      todayMetrics: {
        sales: todayTotal,
        transactions: todayTransactions,
        commission: todayCommission,
        commissionRate,
      },
      weeklyMetrics: {
        sales: weeklyTotal,
        transactions: weeklySales.length,
        commission: weeklyCommission,
      },
      monthlyMetrics: {
        sales: monthlyTotal,
        transactions: monthlySales.length,
        commission: monthlyCommission,
      },
      recentTransactions: recentTransactions.map(sale => ({
        id: sale.id,
        invoiceNumber: sale.invoiceNumber,
        amount: Number(sale.totalAmount),
        paymentMethod: sale.paymentMethod,
        status: sale.status,
        date: sale.saleDate,
        customer: sale.customer?.name || 'Walk-in Customer',
        items: sale.items.map(item => ({
          product: item.product.name,
          quantity: item.quantity,
        })),
      })),
      pendingApprovals: pendingApprovals.map(approval => ({
        id: approval.id,
        type: approval.type,
        itemName: (approval.requestData as any)?.name || approval.recordId,
        reason: approval.reason,
        status: approval.status,
        requestedAt: approval.createdAt,
      })),
      salesTrend,
      shiftInfo: {
        start: todayStart.toISOString(),
        end: todayEnd.toISOString(),
        hoursWorked: 0, // TODO: Implement shift tracking
      },
    }

    return NextResponse.json(response, { status: 200 })
  } catch (error) {
    console.error('❌ Worker Dashboard API Error:', error)
    return NextResponse.json(
      {
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}

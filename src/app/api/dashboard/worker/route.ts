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

    // 5-8. Parallel fetch: today's sales, weekly sales, monthly sales, shop settings
    const [todaySales, weeklySales, monthlySales, shopForSettings] = await Promise.all([
      // Today's sales
      prisma.sale.findMany({
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
      }),
      // Weekly sales
      prisma.sale.findMany({
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
      }),
      // Monthly sales
      prisma.sale.findMany({
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
      }),
      // Shop settings for commission rate
      prisma.shop.findUnique({
        where: { id: shopId },
        select: { settings: true },
      })
    ])

    // Calculate today's metrics
    const todayTotal = todaySales.reduce(
      (sum, sale) => sum + Number(sale.totalAmount),
      0
    )
    const todayTransactions = todaySales.length

    const weeklyTotal = weeklySales.reduce(
      (sum, sale) => sum + Number(sale.totalAmount),
      0
    )

    const monthlyTotal = monthlySales.reduce(
      (sum, sale) => sum + Number(sale.totalAmount),
      0
    )

    const shopSettings = (shopForSettings?.settings as any) || {}
    const commissionRate = shopSettings.commissionRate || 3.0 // Default 3%

    // Calculate commission
    const todayCommission = (todayTotal * commissionRate) / 100
    const weeklyCommission = (weeklyTotal * commissionRate) / 100
    const monthlyCommission = (monthlyTotal * commissionRate) / 100

    // 9-11. Parallel fetch: recent transactions, pending approvals, and week sales trend
    const sevenDaysAgo = subDays(startOfDay(now), 6)
    
    const [recentTransactions, pendingApprovals, allWeekSales] = await Promise.all([
      // Recent transactions (last 10)
      prisma.sale.findMany({
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
      }),
      // Pending approval requests
      prisma.approvalRequest.findMany({
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
      }),
      // Sales trend (last 7 days) - OPTIMIZED: Single query instead of 7
      prisma.sale.findMany({
        where: {
          shopId,
          sellerId: workerId,
          saleDate: {
            gte: sevenDaysAgo,
            lte: endOfDay(now)
          }
        },
        select: {
          totalAmount: true,
          saleDate: true
        }
      })
    ])

    // Group sales by day in memory
    const salesByDay = new Map<string, { total: number; count: number }>()
    allWeekSales.forEach(sale => {
      const dayKey = startOfDay(sale.saleDate).toISOString()
      const current = salesByDay.get(dayKey) || { total: 0, count: 0 }
      salesByDay.set(dayKey, {
        total: current.total + Number(sale.totalAmount),
        count: current.count + 1
      })
    })

    // Build the trend array for last 7 days
    const salesTrend = Array.from({ length: 7 }, (_, i) => {
      const date = subDays(now, 6 - i)
      const dayKey = startOfDay(date).toISOString()
      const dayLabel = date.toLocaleDateString('en-US', { weekday: 'short' })
      const dayData = salesByDay.get(dayKey) || { total: 0, count: 0 }
      return {
        day: dayLabel,
        sales: dayData.total,
        count: dayData.count
      }
    })

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

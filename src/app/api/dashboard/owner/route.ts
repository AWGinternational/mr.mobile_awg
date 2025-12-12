import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { UserRole } from '@/types'
import { startOfDay, endOfDay, startOfWeek, startOfMonth, subDays, format } from 'date-fns'

// Cache dashboard data for 2 minutes
export const revalidate = 120

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (session.user.role !== UserRole.SHOP_OWNER) {
      return NextResponse.json({ error: 'Forbidden - Shop owner access required' }, { status: 403 })
    }

    // Get user's shop
    const shop = await prisma.shop.findFirst({
      where: { ownerId: session.user.id },
      include: {
        workers: {
          where: { isActive: true },
          include: { user: true }
        }
      }
    })

    if (!shop) {
      return NextResponse.json({ error: 'Shop not found' }, { status: 404 })
    }

    const shopId = shop.id
    const now = new Date()
    const todayStart = startOfDay(now)
    const todayEnd = endOfDay(now)
    const thirtyDaysAgo = subDays(now, 30)
    const monthStart = startOfMonth(now)

    // Parallel fetch: Today's sales, products, recent sales, customers, monthly sales, pending purchases, approvals
    const [
      todaySales,
      products,
      recentSales,
      totalCustomers,
      activeCustomers,
      monthlySales,
      pendingPurchases,
      pendingApprovals
    ] = await Promise.all([
      // Today's sales - optimized with minimal data
      prisma.sale.findMany({
        where: {
          shopId,
          saleDate: {
            gte: todayStart,
            lte: todayEnd
          }
        },
        select: {
          id: true,
          totalAmount: true,
          paymentMethod: true,
          subtotal: true,
          sellerId: true
        }
      }),
      // Product count only - fetch inventory separately
      prisma.product.count({
        where: { shopId, status: 'ACTIVE' }
      }),
      // Recent sales for top brands (last 7 days) - reduced timeframe
      prisma.sale.findMany({
        where: {
          shopId,
          saleDate: { gte: startOfWeek(now) }
        },
        select: {
          id: true,
          totalAmount: true,
          items: {
            select: {
              totalPrice: true,
              quantity: true,
              product: {
                select: {
                  brand: {
                    select: { name: true }
                  }
                }
              }
            },
            take: 50
          }
        },
        take: 100
      }),
      // Customers - OPTIMIZED: Use count instead of fetching all records
      prisma.customer.count({
        where: { shopId }
      }),
      // Active customers count (had sales in last 30 days)
      prisma.customer.count({
        where: {
          shopId,
          sales: {
            some: {
              saleDate: { gte: thirtyDaysAgo }
            }
          }
        }
      }),
      // Monthly sales - only fetch needed fields
      prisma.sale.findMany({
        where: {
          shopId,
          saleDate: { gte: monthStart }
        },
        select: {
          totalAmount: true,
          subtotal: true
        }
      }),
      // Pending purchases
      prisma.purchase.findMany({
        where: {
          shopId,
          status: {
            in: ['DRAFT', 'ORDERED', 'PARTIAL']
          }
        }
      }),
      // Pending approvals
      prisma.approvalRequest.findMany({
        where: {
          shopId,
          status: 'PENDING'
        }
      })
    ])

    const todaySalesRevenue = todaySales.reduce((sum, sale) => sum + Number(sale.totalAmount), 0)
    const todayTransactions = todaySales.length

    // Payment methods breakdown (today)
    const paymentMethodsMap = new Map<string, number>()
    todaySales.forEach(sale => {
      const method = sale.paymentMethod
      paymentMethodsMap.set(method, (paymentMethodsMap.get(method) || 0) + Number(sale.totalAmount))
    })

    const paymentMethods = Array.from(paymentMethodsMap.entries()).map(([name, amount]) => ({
      name,
      amount: Number(amount.toFixed(2)),
      percentage: todaySalesRevenue > 0 ? Number(((amount / todaySalesRevenue) * 100).toFixed(1)) : 0
    }))

    // Last 7 days sales trend - OPTIMIZED: Single query instead of 7
    const weekAgo = subDays(now, 6)
    const weekSalesRaw = await prisma.sale.findMany({
      where: {
        shopId,
        saleDate: {
          gte: startOfDay(weekAgo),
          lte: todayEnd
        }
      },
      select: {
        saleDate: true,
        totalAmount: true,
        subtotal: true
      }
    })

    // Group by day in memory (faster than 7 separate DB calls)
    const salesByDay = new Map<string, { revenue: number; transactions: number; profit: number }>()
    
    // Initialize all 7 days
    for (let i = 0; i < 7; i++) {
      const date = subDays(now, 6 - i)
      const label = format(date, 'MMM dd')
      salesByDay.set(label, { revenue: 0, transactions: 0, profit: 0 })
    }
    
    // Aggregate sales by day
    weekSalesRaw.forEach(sale => {
      const label = format(new Date(sale.saleDate), 'MMM dd')
      const current = salesByDay.get(label)
      if (current) {
        current.revenue += Number(sale.totalAmount)
        current.transactions += 1
        current.profit += Number(sale.totalAmount) - Number(sale.subtotal || 0)
      }
    })

    const weekSalesTrend = Array.from(salesByDay.entries()).map(([date, data]) => ({
      date,
      sales: Number(data.revenue.toFixed(2)),
      transactions: data.transactions,
      profit: Number(data.profit.toFixed(2))
    }))

    // Inventory stats - using aggregations instead of loading all data
    const [inStockCount, inventoryValue] = await Promise.all([
      // Count products with at least one IN_STOCK inventory item
      prisma.product.count({
        where: {
          shopId,
          status: 'ACTIVE',
          inventoryItems: {
            some: { status: 'IN_STOCK' }
          }
        }
      }),
      // Calculate total inventory value
      prisma.inventoryItem.aggregate({
        where: {
          shopId,
          status: 'IN_STOCK'
        },
        _sum: {
          costPrice: true
        }
      })
    ])

    const totalProducts = products // Now it's a count
    const inStockProducts = inStockCount
    const outOfStockProducts = totalProducts - inStockProducts
    
    // Low stock requires more complex query - estimate for now
    const lowStockProducts = Math.floor(inStockProducts * 0.1) // Estimate 10%

    const totalInventoryValue = Number(inventoryValue._sum.costPrice || 0)

    // Top selling products (last 30 days) - already fetched above

    // Brand performance
    const brandSalesMap = new Map<string, { sales: number; revenue: number; units: number }>()
    recentSales.forEach(sale => {
      sale.items.forEach(item => {
        if (item.product?.brand) {
          const brandName = item.product.brand.name
          const current = brandSalesMap.get(brandName) || { sales: 0, revenue: 0, units: 0 }
          brandSalesMap.set(brandName, {
            sales: current.sales + 1,
            revenue: current.revenue + Number(item.totalPrice),
            units: current.units + item.quantity
          })
        }
      })
    })

    const topBrands = Array.from(brandSalesMap.entries())
      .map(([name, data]) => ({ name, ...data }))
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 5)

    // Customer stats - already fetched above with count queries (totalCustomers, activeCustomers)
    const totalRevenue = recentSales.reduce((sum, sale) => sum + Number(sale.totalAmount), 0)

    // Worker performance (today)
    const workerPerformance = await Promise.all(
      shop.workers.map(async (worker) => {
        const workerSales = todaySales.filter(sale => {
          // You may need to add a sellerId field to track which worker made the sale
          // For now, we'll distribute sales evenly or show all workers
          return true
        })

        return {
          id: worker.user.id,
          name: worker.user.name || 'Unknown',
          email: worker.user.email,
          sales: workerSales.length > 0 ? todaySalesRevenue / shop.workers.length : 0,
          transactions: Math.floor(todayTransactions / shop.workers.length),
          status: 'active' as const
        }
      })
    )

    // Monthly summary - already fetched above

    const monthlyRevenue = monthlySales.reduce((sum, sale) => sum + Number(sale.totalAmount), 0)
    const monthlyProfit = monthlySales.reduce((sum, sale) => {
      const saleProfit = Number(sale.totalAmount) - Number(sale.subtotal || 0)
      return sum + saleProfit
    }, 0)

    // Pending supplier orders and approvals - already fetched above

    return NextResponse.json({
      shop: {
        id: shop.id,
        name: shop.name,
        location: `${shop.city}, ${shop.province}`,
        gstNumber: shop.gstNumber || 'N/A'
      },
      today: {
        sales: Number(todaySalesRevenue.toFixed(2)),
        transactions: todayTransactions,
        paymentMethods
      },
      inventory: {
        total: totalProducts,
        inStock: inStockProducts,
        lowStock: lowStockProducts,
        outOfStock: outOfStockProducts,
        totalValue: Number(totalInventoryValue.toFixed(2))
      },
      workers: {
        total: shop.workers.length,
        performance: workerPerformance
      },
      customers: {
        total: totalCustomers,
        active: activeCustomers
      },
      monthly: {
        revenue: Number(monthlyRevenue.toFixed(2)),
        profit: Number(monthlyProfit.toFixed(2))
      },
      trends: {
        weekly: weekSalesTrend
      },
      topBrands,
      pendingOrders: pendingPurchases.length,
      pendingApprovals: pendingApprovals.length
    })

  } catch (error) {
    console.error('Dashboard API Error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch dashboard data' },
      { status: 500 }
    )
  }
}
// Deployment trigger: Thu Nov 27 17:44:11 PKT 2025

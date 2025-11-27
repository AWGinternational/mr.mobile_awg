import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { UserRole } from '@/types'
import { startOfDay, endOfDay, startOfWeek, startOfMonth, subDays, format } from 'date-fns'

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

    // Today's sales
    const todaySales = await prisma.sale.findMany({
      where: {
        shopId,
        saleDate: {
          gte: todayStart,
          lte: todayEnd
        }
      },
      include: {
        items: true,
        customer: true
      }
    })

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
      percentage: Number(((amount / todaySalesRevenue) * 100).toFixed(1))
    }))

    // Last 7 days sales trend
    const last7Days = Array.from({ length: 7 }, (_, i) => {
      const date = subDays(now, 6 - i)
      return {
        date: startOfDay(date),
        dateEnd: endOfDay(date),
        label: format(date, 'MMM dd')
      }
    })

    const weekSalesTrend = await Promise.all(
      last7Days.map(async ({ date, dateEnd, label }) => {
        const sales = await prisma.sale.findMany({
          where: {
            shopId,
            saleDate: {
              gte: date,
              lte: dateEnd
            }
          }
        })
        
        const revenue = sales.reduce((sum, sale) => sum + Number(sale.totalAmount), 0)
        const profit = sales.reduce((sum, sale) => {
          const saleProfit = Number(sale.totalAmount) - Number(sale.subtotal || 0)
          return sum + saleProfit
        }, 0)

        return {
          date: label,
          sales: Number(revenue.toFixed(2)),
          transactions: sales.length,
          profit: Number(profit.toFixed(2))
        }
      })
    )

    // Inventory stats
    const products = await prisma.product.findMany({
      where: { shopId, status: 'ACTIVE' },
      include: {
        inventoryItems: true
      }
    })

    const totalProducts = products.length
    const inStockProducts = products.filter(p => {
      const availableCount = p.inventoryItems.filter(i => i.status === 'IN_STOCK').length
      return availableCount > 0
    }).length

    const lowStockProducts = products.filter(p => {
      const availableCount = p.inventoryItems.filter(i => i.status === 'IN_STOCK').length
      return availableCount > 0 && availableCount <= (p.lowStockThreshold || 5)
    }).length

    const outOfStockProducts = totalProducts - inStockProducts

    const totalInventoryValue = products.reduce((sum, product) => {
      const availableCount = product.inventoryItems.filter(i => i.status === 'IN_STOCK').length
      return sum + (Number(product.costPrice) * availableCount)
    }, 0)

    // Top selling products (last 30 days)
    const thirtyDaysAgo = subDays(now, 30)
    const recentSales = await prisma.sale.findMany({
      where: {
        shopId,
        saleDate: { gte: thirtyDaysAgo }
      },
      include: {
        items: {
          include: {
            product: {
              include: {
                brand: true,
                category: true
              }
            }
          }
        }
      }
    })

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

    // Customer stats
    const customers = await prisma.customer.findMany({
      where: { shopId },
      include: {
        sales: {
          where: {
            saleDate: { gte: thirtyDaysAgo }
          }
        }
      }
    })

    const activeCustomers = customers.filter(c => c.sales.length > 0).length
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

    // Monthly summary
    const monthStart = startOfMonth(now)
    const monthlySales = await prisma.sale.findMany({
      where: {
        shopId,
        saleDate: { gte: monthStart }
      }
    })

    const monthlyRevenue = monthlySales.reduce((sum, sale) => sum + Number(sale.totalAmount), 0)
    const monthlyProfit = monthlySales.reduce((sum, sale) => {
      const saleProfit = Number(sale.totalAmount) - Number(sale.subtotal || 0)
      return sum + saleProfit
    }, 0)

    // Pending supplier orders (DRAFT or ORDERED status)
    const pendingPurchases = await prisma.purchase.findMany({
      where: {
        shopId,
        status: {
          in: ['DRAFT', 'ORDERED', 'PARTIAL']
        }
      }
    })

    // Pending approval requests from workers
    const pendingApprovals = await prisma.approvalRequest.findMany({
      where: {
        shopId,
        status: 'PENDING'
      }
    })

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
        total: customers.length,
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

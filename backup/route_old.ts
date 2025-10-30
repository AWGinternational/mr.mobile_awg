// POS Sales Reports API - Generate sales reports and analytics
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { z } from 'zod'

const ReportQuerySchema = z.object({
  shopId: z.string(),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
  reportType: z.enum(['daily', 'weekly', 'monthly', 'custom']).default('daily'),
  groupBy: z.enum(['day', 'week', 'month', 'product', 'category', 'payment']).optional(),
})

// GET /api/pos/reports - Get sales reports
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const queryData = {
      shopId: searchParams.get('shopId'),
      startDate: searchParams.get('startDate'),
      endDate: searchParams.get('endDate'),
      reportType: searchParams.get('reportType') || 'daily',
      groupBy: searchParams.get('groupBy'),
    }

    const validatedQuery = ReportQuerySchema.parse(queryData)

    // Verify user has access to the shop
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: { 
        ownedShops: true,
        workerShops: { include: { shop: true } }
      }
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Check shop access
    let hasAccess = false
    if (user.role === 'SUPER_ADMIN') {
      hasAccess = true
    } else if (user.role === 'SHOP_OWNER') {
      hasAccess = user.ownedShops.some(shop => shop.id === validatedQuery.shopId)
    } else if (user.role === 'SHOP_WORKER') {
      hasAccess = user.workerShops.some(ws => ws.shop.id === validatedQuery.shopId && ws.isActive)
    }

    if (!hasAccess) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    // Set date range based on report type
    let startDate: Date
    let endDate: Date = new Date()

    if (validatedQuery.startDate && validatedQuery.endDate) {
      startDate = new Date(validatedQuery.startDate)
      endDate = new Date(validatedQuery.endDate)
    } else {
      switch (validatedQuery.reportType) {
        case 'daily':
          startDate = new Date()
          startDate.setHours(0, 0, 0, 0)
          endDate.setHours(23, 59, 59, 999)
          break
        case 'weekly':
          startDate = new Date()
          startDate.setDate(startDate.getDate() - 7)
          break
        case 'monthly':
          startDate = new Date()
          startDate.setMonth(startDate.getMonth() - 1)
          break
        default:
          startDate = new Date()
          startDate.setHours(0, 0, 0, 0)
      }
    }

    // Get sales data
    const sales = await prisma.sale.findMany({
      where: {
        saleDate: {
          gte: startDate,
          lte: endDate
        },
        status: 'COMPLETED'
      },
      include: {
        customer: {
          select: { id: true, name: true, phone: true }
        },
        items: {
          include: {
            product: {
              include: {
                category: true,
                brand: true
              }
            }
          }
        },
        payments: true
      },
      orderBy: { saleDate: 'desc' }
    })

    // Calculate summary statistics
    const totalSales = sales.length
    const totalRevenue = sales.reduce((sum, sale) => sum + Number(sale.totalAmount), 0)
    const totalProfit = sales.reduce((sum, sale) => {
      const profit = sale.items.reduce((itemSum, item) => {
        const costPrice = Number(item.product.costPrice) * item.quantity
        const sellingPrice = Number(item.totalPrice)
        return itemSum + (sellingPrice - costPrice)
      }, 0)
      return sum + profit
    }, 0)

    const averageOrderValue = totalSales > 0 ? totalRevenue / totalSales : 0
    const totalDiscount = sales.reduce((sum, sale) => sum + Number(sale.discountAmount), 0)
    const totalTax = sales.reduce((sum, sale) => sum + Number(sale.taxAmount), 0)

    // Payment method breakdown
    const paymentMethods = sales.reduce((acc: Record<string, { count: number, amount: number }>, sale) => {
      const method = sale.paymentMethod
      if (!acc[method]) {
        acc[method] = { count: 0, amount: 0 }
      }
      acc[method].count++
      acc[method].amount += Number(sale.totalAmount)
      return acc
    }, {})

    // Top selling products
    const productSales = sales.flatMap(sale => sale.items).reduce((acc: Record<string, {
      product: any,
      quantity: number,
      revenue: number
    }>, item) => {
      const productId = item.productId
      if (!acc[productId]) {
        acc[productId] = {
          product: item.product,
          quantity: 0,
          revenue: 0
        }
      }
      acc[productId].quantity += item.quantity
      acc[productId].revenue += Number(item.totalPrice)
      return acc
    }, {})

    const topProducts = Object.values(productSales)
      .sort((a, b) => b.quantity - a.quantity)
      .slice(0, 10)

    // Category breakdown
    const categoryBreakdown = sales.flatMap(sale => sale.items).reduce((acc: Record<string, {
      category: string,
      quantity: number,
      revenue: number
    }>, item) => {
      const categoryName = item.product.category.name
      if (!acc[categoryName]) {
        acc[categoryName] = {
          category: categoryName,
          quantity: 0,
          revenue: 0
        }
      }
      acc[categoryName].quantity += item.quantity
      acc[categoryName].revenue += Number(item.totalPrice)
      return acc
    }, {})

    // Daily sales trend (for charts)
    const dailySales = sales.reduce((acc: Record<string, { date: string, sales: number, revenue: number }>, sale) => {
      const dateKey = sale.saleDate.toISOString().split('T')[0]
      if (!acc[dateKey]) {
        acc[dateKey] = {
          date: dateKey,
          sales: 0,
          revenue: 0
        }
      }
      acc[dateKey].sales++
      acc[dateKey].revenue += Number(sale.totalAmount)
      return acc
    }, {})

    const reportData = {
      period: {
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
        reportType: validatedQuery.reportType
      },
      summary: {
        totalSales,
        totalRevenue,
        totalProfit,
        averageOrderValue,
        totalDiscount,
        totalTax,
        profitMargin: totalRevenue > 0 ? (totalProfit / totalRevenue) * 100 : 0
      },
      paymentMethods,
      topProducts,
      categoryBreakdown: Object.values(categoryBreakdown),
      dailyTrend: Object.values(dailySales).sort((a, b) => a.date.localeCompare(b.date)),
      recentSales: sales.slice(0, 20).map(sale => ({
        id: sale.id,
        invoiceNumber: sale.invoiceNumber,
        customer: sale.customer?.name || 'Walk-in Customer',
        totalAmount: Number(sale.totalAmount),
        paymentMethod: sale.paymentMethod,
        saleDate: sale.saleDate,
        itemCount: sale.items.length
      }))
    }

    return NextResponse.json({
      success: true,
      report: reportData
    })

  } catch (error) {
    console.error('Sales report error:', error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid query parameters', details: error.issues },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: 'Failed to generate sales report' },
      { status: 500 }
    )
  }
}

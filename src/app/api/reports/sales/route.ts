import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const period = searchParams.get('period') || '30days'
    const shopId = searchParams.get('shopId')

    // Get user's shop ID
    let userShopId: string | undefined = session.user.shops?.[0]?.id
    
    if (!userShopId && session.user.role === 'SHOP_WORKER') {
      const worker = await prisma.shopWorker.findFirst({
        where: { 
          userId: session.user.id,
          isActive: true 
        }
      })
      userShopId = worker?.shopId
    }

    // Use provided shopId or user's shop
    const targetShopId = shopId || userShopId

    if (!targetShopId) {
      return NextResponse.json({ error: 'No shop assigned' }, { status: 400 })
    }

    // Calculate date range
    const now = new Date()
    let startDate: Date

    switch (period) {
      case '7days':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
        break
      case '30days':
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
        break
      case '90days':
        startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000)
        break
      case 'year':
        startDate = new Date(now.getFullYear(), 0, 1)
        break
      default:
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
    }

    // Get sales data
    const sales = await prisma.sale.findMany({
      where: {
        shopId: targetShopId,
        saleDate: {
          gte: startDate,
          lte: now
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
              select: { id: true, name: true, sellingPrice: true }
            }
          }
        }
      },
      orderBy: { saleDate: 'desc' }
    })

    // Calculate metrics
    const totalSales = sales.length
    const totalRevenue = sales.reduce((sum, sale) => sum + Number(sale.totalAmount), 0)
    const totalTax = sales.reduce((sum, sale) => sum + Number(sale.taxAmount), 0)
    const totalDiscount = sales.reduce((sum, sale) => sum + Number(sale.discountAmount), 0)

    // Calculate profit (simplified - using 15% margin assumption)
    const totalProfit = totalRevenue * 0.15

    // Daily breakdown for the last 7 days
    const dailyData = []
    for (let i = 6; i >= 0; i--) {
      const date = new Date(now.getTime() - i * 24 * 60 * 60 * 1000)
      const dayStart = new Date(date.getFullYear(), date.getMonth(), date.getDate())
      const dayEnd = new Date(dayStart.getTime() + 24 * 60 * 60 * 1000)
      
      const daySales = sales.filter(sale => {
        const saleDate = new Date(sale.saleDate)
        return saleDate >= dayStart && saleDate < dayEnd
      })

      const dayRevenue = daySales.reduce((sum, sale) => sum + Number(sale.totalAmount), 0)
      
      dailyData.push({
        date: dayStart.toISOString().split('T')[0],
        dateFormatted: dayStart.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        sales: daySales.length,
        revenue: dayRevenue
      })
    }

    // Previous period for growth calculation
    const previousPeriodStart = new Date(startDate.getTime() - (now.getTime() - startDate.getTime()))
    const previousSales = await prisma.sale.count({
      where: {
        shopId: targetShopId,
        saleDate: {
          gte: previousPeriodStart,
          lt: startDate
        },
        status: 'COMPLETED'
      }
    })

    const previousRevenue = await prisma.sale.aggregate({
      where: {
        shopId: targetShopId,
        saleDate: {
          gte: previousPeriodStart,
          lt: startDate
        },
        status: 'COMPLETED'
      },
      _sum: { totalAmount: true }
    })

    const previousRevenueAmount = Number(previousRevenue._sum.totalAmount || 0)
    const salesGrowth = previousSales > 0 ? ((totalSales - previousSales) / previousSales) * 100 : 0
    const revenueGrowth = previousRevenueAmount > 0 ? ((totalRevenue - previousRevenueAmount) / previousRevenueAmount) * 100 : 0

    return NextResponse.json({
      success: true,
      data: {
        period,
        metrics: {
          totalSales,
          totalRevenue,
          totalTax,
          totalDiscount,
          totalProfit,
          salesGrowth: Math.round(salesGrowth * 10) / 10,
          revenueGrowth: Math.round(revenueGrowth * 10) / 10
        },
        dailyData,
        recentSales: sales.slice(0, 10).map(sale => ({
          id: sale.id,
          invoiceNumber: sale.invoiceNumber,
          customerName: sale.customer?.name || 'Walk-in Customer',
          totalAmount: Number(sale.totalAmount),
          paymentMethod: sale.paymentMethod,
          saleDate: sale.saleDate,
          itemsCount: sale.items.length
        }))
      }
    })

  } catch (error) {
    console.error('Sales report error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

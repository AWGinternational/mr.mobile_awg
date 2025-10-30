import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'

// GET /api/admin/stats - Get system-wide statistics (admin only)
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user || session.user.role !== 'SUPER_ADMIN') {
      return NextResponse.json(
        { success: false, message: 'Admin access required' },
        { status: 403 }
      )
    }

    const { searchParams } = new URL(request.url)
    const period = parseInt(searchParams.get('period') || '30') // days

    const startDate = new Date()
    startDate.setDate(startDate.getDate() - period)

    // Get comprehensive system statistics
    const [
      totalShops,
      activeShops,
      totalUsers,
      totalProducts,
      totalSales,
      totalRevenue,
      previousPeriodSales,
      previousPeriodRevenue
    ] = await Promise.all([
      // Total shops
      prisma.shop.count(),
      // Active shops
      prisma.shop.count({
        where: { status: 'ACTIVE' }
      }),
      // Total users
      prisma.user.count(),
      // Total products
      prisma.product.count(),
      // Total sales in current period
      prisma.sale.count({
        where: {
          createdAt: { gte: startDate }
        }
      }),
      // Total revenue in current period
      prisma.sale.aggregate({
        where: {
          createdAt: { gte: startDate }
        },
        _sum: { totalAmount: true }
      }),
      // Previous period sales for growth calculation
      prisma.sale.count({
        where: {
          createdAt: {
            gte: new Date(startDate.getTime() - (period * 24 * 60 * 60 * 1000)),
            lt: startDate
          }
        }
      }),
      // Previous period revenue for growth calculation
      prisma.sale.aggregate({
        where: {
          createdAt: {
            gte: new Date(startDate.getTime() - (period * 24 * 60 * 60 * 1000)),
            lt: startDate
          }
        },
        _sum: { totalAmount: true }
      })
    ])

    // Calculate growth percentages
    const currentRevenue = Number(totalRevenue._sum.totalAmount || 0)
    const previousRevenue = Number(previousPeriodRevenue._sum.totalAmount || 0)
    const revenueGrowth = previousRevenue > 0 
      ? ((currentRevenue - previousRevenue) / previousRevenue) * 100 
      : 0

    const salesGrowth = previousPeriodSales > 0 
      ? ((totalSales - previousPeriodSales) / previousPeriodSales) * 100 
      : 0

    return NextResponse.json({
      success: true,
      stats: {
        totalShops,
        activeShops,
        totalRevenue: currentRevenue,
        totalSales,
        totalProducts,
        totalUsers,
        revenueGrowth,
        salesGrowth
      }
    })

  } catch (error) {
    console.error('Failed to fetch admin stats:', error)
    return NextResponse.json(
      { success: false, message: 'Failed to fetch statistics' },
      { status: 500 }
    )
  }
}
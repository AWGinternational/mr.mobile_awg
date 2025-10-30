// POS Dashboard API - Real-time dashboard data for POS system (Multi-tenant)
import { NextRequest, NextResponse } from 'next/server'
import { getSimpleShopContext } from '@/lib/shop-context-simple'
import { prisma } from '@/lib/db'
import { z } from 'zod'

const DashboardQuerySchema = z.object({
  timeframe: z.enum(['today', 'week', 'month']).default('today'),
})

// GET /api/pos/dashboard - Get real-time POS dashboard data
export async function GET(request: NextRequest) {
  try {
    const context = await getSimpleShopContext(request)
    const { searchParams } = new URL(request.url)
    const queryData = {
      timeframe: searchParams.get('timeframe') || 'today',
    }
    const validatedQuery = DashboardQuerySchema.parse(queryData)

    // Set date range based on timeframe
    let startDate: Date
    const endDate = new Date()
    switch (validatedQuery.timeframe) {
      case 'today':
        startDate = new Date()
        startDate.setHours(0, 0, 0, 0)
        break
      case 'week':
        startDate = new Date()
        startDate.setDate(startDate.getDate() - 7)
        break
      case 'month':
        startDate = new Date()
        startDate.setMonth(startDate.getMonth() - 1)
        break
      default:
        startDate = new Date()
        startDate.setHours(0, 0, 0, 0)
    }

    // Return basic dashboard data for now
    const dashboardData = {
      summary: {
        timeframe: validatedQuery.timeframe,
        totalRevenue: 0,
        totalProfit: 0,
        profitMargin: 0,
        totalTransactions: 0,
        averageOrderValue: 0,
        totalProducts: 0,
        lowStockCount: 0,
        pendingSales: 0,
        inventoryValue: 0,
        inventoryItems: 0
      },
      sales: {
        recent: [],
        paymentMethods: [],
        hourlySales: []
      },
      inventory: {
        lowStockItems: [],
        topSelling: []
      },
      customers: {
        recent: [],
        totalCount: 0
      },
      activity: []
    }

    return NextResponse.json({
      success: true,
      dashboard: dashboardData,
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    console.error('Dashboard data error:', error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid query parameters', details: error.issues },
        { status: 400 }
      )
    }
    
    // Handle shop context errors
    if (error instanceof Error && error.message.includes('Unauthorized')) {
      return NextResponse.json(
        { error: error.message },
        { status: 401 }
      )
    }
    
    return NextResponse.json(
      { error: 'Failed to fetch dashboard data' },
      { status: 500 }
    )
  }
}

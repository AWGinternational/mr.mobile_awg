'use client'
import { useState, useEffect } from 'react'
import { BarChart3, TrendingUp, TrendingDown, DollarSign, Package, ShoppingCart, Users, Calendar } from 'lucide-react'

interface ShopAnalytics {
  id: string
  name: string
  totalRevenue: number
  totalSales: number
  totalProducts: number
  activeProducts: number
  totalWorkers: number
  revenueGrowth: number
  salesGrowth: number
  averageOrderValue: number
  topProducts: Array<{
    id: string
    name: string
    totalSold: number
    revenue: number
  }>
  salesByDay: Array<{
    date: string
    sales: number
    revenue: number
  }>
}

interface SystemStats {
  totalShops: number
  activeShops: number
  totalRevenue: number
  totalSales: number
  totalProducts: number
  totalUsers: number
  revenueGrowth: number
  salesGrowth: number
}

export default function ShopAnalytics() {
  const [systemStats, setSystemStats] = useState<SystemStats | null>(null)
  const [shopAnalytics, setShopAnalytics] = useState<ShopAnalytics[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedPeriod, setSelectedPeriod] = useState('30')
  const [sortBy, setSortBy] = useState<'revenue' | 'sales' | 'growth'>('revenue')

  const fetchSystemStats = async () => {
    try {
      const response = await fetch(`/api/admin/stats?period=${selectedPeriod}`)
      if (response.ok) {
        const data = await response.json()
        if (data.success) {
          setSystemStats(data.stats)
        }
      }
    } catch (err) {
      console.error('Error fetching system stats:', err)
    }
  }

  const fetchShopAnalytics = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/shops`)
      if (!response.ok) {
        throw new Error('Failed to fetch shops')
      }
      const data = await response.json()
      if (data.success) {
        // Fetch detailed analytics for each shop
        const analyticsPromises = data.shops.map(async (shop: any) => {
          try {
            const statsResponse = await fetch(`/api/shops/${shop.id}/stats?period=${selectedPeriod}`)
            if (statsResponse.ok) {
              const statsData = await statsResponse.json()
              if (statsData.success) {
                return {
                  id: shop.id,
                  name: shop.name,
                  totalRevenue: statsData.stats.overview.totalRevenue,
                  totalSales: statsData.stats.overview.totalSales,
                  totalProducts: statsData.stats.overview.totalProducts,
                  activeProducts: statsData.stats.overview.activeProducts,
                  totalWorkers: shop._count.workers,
                  revenueGrowth: Math.random() * 20 - 10, // Mock growth data
                  salesGrowth: Math.random() * 20 - 10, // Mock growth data
                  averageOrderValue: statsData.stats.overview.totalRevenue / (statsData.stats.overview.totalSales || 1),
                  topProducts: statsData.stats.topProducts.slice(0, 3).map((tp: any) => ({
                    id: tp.product.id,
                    name: tp.product.name,
                    totalSold: tp.totalQuantity,
                    revenue: tp.totalQuantity * tp.product.price
                  })),
                  salesByDay: statsData.stats.salesByDay || []
                }
              }
            }
            return null
          } catch (err) {
            console.error(`Error fetching stats for shop ${shop.id}:`, err)
            return null
          }
        })
        const analytics = await Promise.all(analyticsPromises)
        setShopAnalytics(analytics.filter(Boolean) as ShopAnalytics[])
      }
    } catch (err) {
      setError('Failed to fetch shop analytics')
      console.error('Error fetching shop analytics:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchSystemStats()
    fetchShopAnalytics()
  }, [selectedPeriod])

  const sortedShops = [...shopAnalytics].sort((a, b) => {
    switch (sortBy) {
      case 'revenue':
        return b.totalRevenue - a.totalRevenue
      case 'sales':
        return b.totalSales - a.totalSales
      case 'growth':
        return b.revenueGrowth - a.revenueGrowth
      default:
        return 0
    }
  })

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900">Shop Analytics</h2>
        <div className="flex gap-4">
          <select
            value={selectedPeriod}
            onChange={(e) => setSelectedPeriod(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="7">Last 7 days</option>
            <option value="30">Last 30 days</option>
            <option value="90">Last 90 days</option>
            <option value="365">Last year</option>
          </select>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as 'revenue' | 'sales' | 'growth')}
            className="px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="revenue">Sort by Revenue</option>
            <option value="sales">Sort by Sales</option>
            <option value="growth">Sort by Growth</option>
          </select>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md">
          {error}
        </div>
      )}

      {/* System Overview */}
      {systemStats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Revenue</p>
                <p className="text-2xl font-bold text-gray-900">PKR {systemStats.totalRevenue.toFixed(2)}</p>
                <div className="flex items-center mt-1">
                  {systemStats.revenueGrowth >= 0 ? (
                    <TrendingUp className="h-4 w-4 text-green-500 mr-1" />
                  ) : (
                    <TrendingDown className="h-4 w-4 text-red-500 mr-1" />
                  )}
                  <span className={`text-sm ${systemStats.revenueGrowth >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {Math.abs(systemStats.revenueGrowth).toFixed(1)}%
                  </span>
                </div>
              </div>
              <DollarSign className="h-8 w-8 text-green-600" />
            </div>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Sales</p>
                <p className="text-2xl font-bold text-gray-900">{systemStats.totalSales}</p>
                <div className="flex items-center mt-1">
                  {systemStats.salesGrowth >= 0 ? (
                    <TrendingUp className="h-4 w-4 text-green-500 mr-1" />
                  ) : (
                    <TrendingDown className="h-4 w-4 text-red-500 mr-1" />
                  )}
                  <span className={`text-sm ${systemStats.salesGrowth >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {Math.abs(systemStats.salesGrowth).toFixed(1)}%
                  </span>
                </div>
              </div>
              <ShoppingCart className="h-8 w-8 text-blue-600" />
            </div>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Active Shops</p>
                <p className="text-2xl font-bold text-gray-900">{systemStats.activeShops}</p>
                <p className="text-sm text-gray-500">of {systemStats.totalShops} total</p>
              </div>
              <BarChart3 className="h-8 w-8 text-purple-600" />
            </div>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Products</p>
                <p className="text-2xl font-bold text-gray-900">{systemStats.totalProducts}</p>
                <p className="text-sm text-gray-500">{systemStats.totalUsers} users</p>
              </div>
              <Package className="h-8 w-8 text-orange-600" />
            </div>
          </div>
        </div>
      )}

      {/* Shop Performance Comparison */}
      <div className="bg-white rounded-lg shadow-sm border">
        <div className="p-6 border-b">
          <h3 className="text-lg font-semibold text-gray-900">Shop Performance Comparison</h3>
          <p className="text-sm text-gray-600">Compare performance metrics across all shops</p>
        </div>
        <div className="p-6">
          <div className="space-y-4">
            {sortedShops.map((shop, index) => (
              <div key={shop.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-4">
                  <div className="flex items-center justify-center w-8 h-8 bg-blue-100 text-blue-800 rounded-full text-sm font-semibold">
                    {index + 1}
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-900">{shop.name}</h4>
                    <div className="flex items-center gap-4 text-sm text-gray-500">
                      <span>{shop.totalProducts} products</span>
                      <span>{shop.totalWorkers} workers</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-6">
                  <div className="text-right">
                    <div className="font-semibold text-gray-900">PKR {shop.totalRevenue.toFixed(2)}</div>
                    <div className="text-sm text-gray-500">Revenue</div>
                  </div>
                  <div className="text-right">
                    <div className="font-semibold text-gray-900">{shop.totalSales}</div>
                    <div className="text-sm text-gray-500">Sales</div>
                  </div>
                  <div className="text-right">
                    <div className="font-semibold text-gray-900">PKR {shop.averageOrderValue.toFixed(2)}</div>
                    <div className="text-sm text-gray-500">Avg Order</div>
                  </div>
                  <div className="text-right">
                    <div className={`flex items-center font-semibold ${
                      shop.revenueGrowth >= 0 ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {shop.revenueGrowth >= 0 ? (
                        <TrendingUp className="h-4 w-4 mr-1" />
                      ) : (
                        <TrendingDown className="h-4 w-4 mr-1" />
                      )}
                      {Math.abs(shop.revenueGrowth).toFixed(1)}%
                    </div>
                    <div className="text-sm text-gray-500">Growth</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Top Performing Products Across All Shops */}
      <div className="bg-white rounded-lg shadow-sm border">
        <div className="p-6 border-b">
          <h3 className="text-lg font-semibold text-gray-900">Top Products Across All Shops</h3>
          <p className="text-sm text-gray-600">Best performing products system-wide</p>
        </div>
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {sortedShops.slice(0, 3).map((shop) => (
              <div key={shop.id} className="space-y-3">
                <h4 className="font-medium text-gray-900">{shop.name}</h4>
                {shop.topProducts.map((product, index) => (
                  <div key={product.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-md">
                    <div>
                      <div className="font-medium text-gray-900">{product.name}</div>
                      <div className="text-sm text-gray-500">{product.totalSold} sold</div>
                    </div>
                    <div className="text-right">
                      <div className="font-semibold text-gray-900">PKR {product.revenue.toFixed(2)}</div>
                    </div>
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
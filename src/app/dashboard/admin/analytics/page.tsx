'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/use-auth'
import { useNotify } from '@/hooks/use-notifications'
import { ProtectedRoute } from '@/components/auth/protected-route'
import { UserRole } from '@/types'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  BarChart3,
  ArrowLeft,
  LogOut,
  TrendingUp,
  TrendingDown,
  DollarSign,
  ShoppingCart,
  Users,
  Building2,
  Package,
  Download,
  Calendar,
  ArrowUp,
  ArrowDown,
  Minus
} from 'lucide-react'
import { formatUserRole } from '@/utils/user-formatting'

interface AnalyticsData {
  sales: {
    today: number
    yesterday: number
    thisWeek: number
    lastWeek: number
    thisMonth: number
    lastMonth: number
    total: number
  }
  revenue: {
    today: number
    thisWeek: number
    thisMonth: number
    total: number
  }
  shops: {
    total: number
    active: number
    inactive: number
  }
  products: {
    total: number
    inStock: number
    lowStock: number
    outOfStock: number
  }
}

export default function SystemAnalyticsPage() {
  const router = useRouter()
  const { user: currentUser, logout } = useAuth()
  const { success, error: showError } = useNotify()

  // State
  const [loading, setLoading] = useState(true)
  const [dateRange, setDateRange] = useState('30days')
  const [analytics, setAnalytics] = useState<AnalyticsData>({
    sales: {
      today: 15,
      yesterday: 12,
      thisWeek: 87,
      lastWeek: 76,
      thisMonth: 342,
      lastMonth: 298,
      total: 1547
    },
    revenue: {
      today: 2450000,
      thisWeek: 12750000,
      thisMonth: 48900000,
      total: 234500000
    },
    shops: {
      total: 12,
      active: 11,
      inactive: 1
    },
    products: {
      total: 458,
      inStock: 387,
      lowStock: 45,
      outOfStock: 26
    }
  })

  const handleLogout = async () => {
    try {
      await logout()
      router.push('/login')
    } catch (error) {
      console.error('Logout error:', error)
    }
  }

  const handleBack = () => {
    router.push('/dashboard/admin')
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-PK', {
      style: 'currency',
      currency: 'PKR',
      minimumFractionDigits: 0
    }).format(amount)
  }

  const calculateGrowth = (current: number, previous: number) => {
    if (previous === 0) return 0
    return ((current - previous) / previous) * 100
  }

  const salesGrowth = calculateGrowth(analytics.sales.thisWeek, analytics.sales.lastWeek)
  const revenueGrowth = calculateGrowth(analytics.sales.thisMonth, analytics.sales.lastMonth)

  const getTrendIcon = (value: number) => {
    if (value > 0) return <ArrowUp className="h-4 w-4" />
    if (value < 0) return <ArrowDown className="h-4 w-4" />
    return <Minus className="h-4 w-4" />
  }

  const getTrendColor = (value: number) => {
    if (value > 0) return 'text-green-600'
    if (value < 0) return 'text-red-600'
    return 'text-gray-600'
  }

  useEffect(() => {
    // Simulated data fetch
    setTimeout(() => setLoading(false), 500)
  }, [])

  return (
    <ProtectedRoute allowedRoles={[UserRole.SUPER_ADMIN]}>
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-purple-50 to-indigo-100">
        {/* Header */}
        <div className="bg-gradient-to-r from-purple-600 via-indigo-600 to-blue-700 text-white">
          <div className="px-8 py-12">
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-4">
                <button
                  onClick={handleBack}
                  className="p-3 bg-white/10 hover:bg-white/20 rounded-xl transition-all duration-200"
                  title="Back to Dashboard"
                >
                  <ArrowLeft className="h-5 w-5 text-white" />
                </button>
                <div>
                  <h1 className="text-4xl font-bold mb-2">
                    📊 System Analytics
                  </h1>
                  <p className="text-purple-100 text-lg">Global sales, performance, and business intelligence</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="px-8 py-8 space-y-8">
          {/* Date Range Selector */}
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Performance Dashboard</h2>
              <p className="text-gray-600">Real-time business metrics and insights</p>
            </div>
            <div className="flex items-center gap-4">
              <Select value={dateRange} onValueChange={setDateRange}>
                <SelectTrigger className="w-48">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="7days">Last 7 days</SelectItem>
                  <SelectItem value="30days">Last 30 days</SelectItem>
                  <SelectItem value="90days">Last 90 days</SelectItem>
                  <SelectItem value="year">This year</SelectItem>
                </SelectContent>
              </Select>
              <Button variant="outline" className="gap-2">
                <Download className="h-4 w-4" />
                Export Report
              </Button>
            </div>
          </div>

          {/* Key Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card className="bg-gradient-to-br from-blue-500 to-blue-600 text-white">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-3 bg-white/20 rounded-xl">
                    <DollarSign className="h-6 w-6" />
                  </div>
                  <div className={`flex items-center gap-1 ${getTrendColor(revenueGrowth)}`}>
                    {getTrendIcon(revenueGrowth)}
                    <span className="text-sm font-medium">{Math.abs(revenueGrowth).toFixed(1)}%</span>
                  </div>
                </div>
                <div>
                  <p className="text-blue-100 text-sm mb-1">Total Revenue</p>
                  <p className="text-2xl font-bold">{formatCurrency(analytics.revenue.total)}</p>
                  <p className="text-blue-100 text-xs mt-1">This month: {formatCurrency(analytics.revenue.thisMonth)}</p>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-green-500 to-green-600 text-white">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-3 bg-white/20 rounded-xl">
                    <ShoppingCart className="h-6 w-6" />
                  </div>
                  <div className={`flex items-center gap-1 ${getTrendColor(salesGrowth)}`}>
                    {getTrendIcon(salesGrowth)}
                    <span className="text-sm font-medium">{Math.abs(salesGrowth).toFixed(1)}%</span>
                  </div>
                </div>
                <div>
                  <p className="text-green-100 text-sm mb-1">Total Sales</p>
                  <p className="text-2xl font-bold">{analytics.sales.total}</p>
                  <p className="text-green-100 text-xs mt-1">This month: {analytics.sales.thisMonth} sales</p>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-purple-500 to-purple-600 text-white">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-3 bg-white/20 rounded-xl">
                    <Building2 className="h-6 w-6" />
                  </div>
                </div>
                <div>
                  <p className="text-purple-100 text-sm mb-1">Active Shops</p>
                  <p className="text-2xl font-bold">{analytics.shops.active}</p>
                  <p className="text-purple-100 text-xs mt-1">of {analytics.shops.total} total shops</p>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-orange-500 to-orange-600 text-white">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-3 bg-white/20 rounded-xl">
                    <Package className="h-6 w-6" />
                  </div>
                </div>
                <div>
                  <p className="text-orange-100 text-sm mb-1">Products</p>
                  <p className="text-2xl font-bold">{analytics.products.total}</p>
                  <p className="text-orange-100 text-xs mt-1">Low stock: {analytics.products.lowStock} items</p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Analytics Tabs */}
          <Tabs defaultValue="sales" className="w-full">
            <TabsList className="grid w-full grid-cols-2 lg:grid-cols-4">
              <TabsTrigger value="sales">Sales Analysis</TabsTrigger>
              <TabsTrigger value="revenue">Revenue</TabsTrigger>
              <TabsTrigger value="shops">Shop Performance</TabsTrigger>
              <TabsTrigger value="products">Product Insights</TabsTrigger>
            </TabsList>

            {/* Sales Analysis Tab */}
            <TabsContent value="sales" className="space-y-6">
              <Card>
                <CardContent className="p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-6">Sales Trends</h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                    <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm text-green-700">Today</span>
                        <span className={`text-xs flex items-center gap-1 ${getTrendColor(analytics.sales.today - analytics.sales.yesterday)}`}>
                          {getTrendIcon(analytics.sales.today - analytics.sales.yesterday)}
                          {Math.abs(((analytics.sales.today - analytics.sales.yesterday) / analytics.sales.yesterday * 100) || 0).toFixed(0)}%
                        </span>
                      </div>
                      <p className="text-2xl font-bold text-green-900">{analytics.sales.today}</p>
                      <p className="text-xs text-green-600 mt-1">vs yesterday: {analytics.sales.yesterday}</p>
                    </div>

                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm text-blue-700">This Week</span>
                        <span className={`text-xs flex items-center gap-1 ${getTrendColor(salesGrowth)}`}>
                          {getTrendIcon(salesGrowth)}
                          {Math.abs(salesGrowth).toFixed(0)}%
                        </span>
                      </div>
                      <p className="text-2xl font-bold text-blue-900">{analytics.sales.thisWeek}</p>
                      <p className="text-xs text-blue-600 mt-1">vs last week: {analytics.sales.lastWeek}</p>
                    </div>

                    <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm text-purple-700">This Month</span>
                        <span className={`text-xs flex items-center gap-1 ${getTrendColor(revenueGrowth)}`}>
                          {getTrendIcon(revenueGrowth)}
                          {Math.abs(revenueGrowth).toFixed(0)}%
                        </span>
                      </div>
                      <p className="text-2xl font-bold text-purple-900">{analytics.sales.thisMonth}</p>
                      <p className="text-xs text-purple-600 mt-1">vs last month: {analytics.sales.lastMonth}</p>
                    </div>
                  </div>

                  {/* Simple Bar Chart Representation */}
                  <div className="space-y-4">
                    <h4 className="font-semibold text-gray-900">Sales by Day of Week</h4>
                    {[
                      { day: 'Monday', sales: 65, revenue: 8500000 },
                      { day: 'Tuesday', sales: 58, revenue: 7200000 },
                      { day: 'Wednesday', sales: 72, revenue: 9800000 },
                      { day: 'Thursday', sales: 61, revenue: 8100000 },
                      { day: 'Friday', sales: 89, revenue: 12400000 },
                      { day: 'Saturday', sales: 94, revenue: 13900000 },
                      { day: 'Sunday', sales: 43, revenue: 5600000 }
                    ].map((item) => (
                      <div key={item.day} className="space-y-1">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-gray-700 font-medium w-24">{item.day}</span>
                          <span className="text-gray-900 font-semibold">{item.sales} sales</span>
                          <span className="text-gray-600">{formatCurrency(item.revenue)}</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div
                            className="bg-gradient-to-r from-green-500 to-emerald-600 h-2 rounded-full transition-all duration-500"
                            style={{ width: `${(item.sales / 100) * 100}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Revenue Tab */}
            <TabsContent value="revenue" className="space-y-6">
              <Card>
                <CardContent className="p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-6">Revenue Breakdown</h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <h4 className="font-semibold text-gray-900">Revenue by Payment Method</h4>
                      {[
                        { method: 'Cash', amount: 15600000, percentage: 32 },
                        { method: 'Card', amount: 12400000, percentage: 25 },
                        { method: 'EasyPaisa', amount: 10800000, percentage: 22 },
                        { method: 'JazzCash', amount: 9700000, percentage: 21 }
                      ].map((item) => (
                        <div key={item.method} className="space-y-2">
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-gray-700 font-medium">{item.method}</span>
                            <div className="flex items-center gap-3">
                              <span className="text-gray-900 font-semibold">{formatCurrency(item.amount)}</span>
                              <span className="text-gray-600 text-xs">{item.percentage}%</span>
                            </div>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div
                              className="bg-gradient-to-r from-blue-500 to-purple-600 h-2 rounded-full"
                              style={{ width: `${item.percentage}%` }}
                            />
                          </div>
                        </div>
                      ))}
                    </div>

                    <div className="space-y-4">
                      <h4 className="font-semibold text-gray-900">Top Performing Shops</h4>
                      {[
                        { shop: 'Ali Mobile Center', revenue: 12500000, growth: 15 },
                        { shop: 'Tech Hub Karachi', revenue: 10800000, growth: 12 },
                        { shop: 'Smart Phones Plus', revenue: 9200000, growth: 8 },
                        { shop: 'Mobile World', revenue: 7600000, growth: -3 }
                      ].map((item, index) => (
                        <div key={item.shop} className="bg-white border border-gray-200 rounded-lg p-4">
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-2">
                              <span className="w-6 h-6 bg-purple-100 text-purple-700 rounded-full flex items-center justify-center text-xs font-bold">
                                {index + 1}
                              </span>
                              <span className="font-medium text-gray-900">{item.shop}</span>
                            </div>
                            <Badge className={item.growth >= 0 ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}>
                              {item.growth >= 0 ? '+' : ''}{item.growth}%
                            </Badge>
                          </div>
                          <p className="text-sm text-gray-600">{formatCurrency(item.revenue)}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Shop Performance Tab */}
            <TabsContent value="shops" className="space-y-6">
              <Card>
                <CardContent className="p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-6">Shop Performance Metrics</h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                      <Building2 className="h-8 w-8 text-blue-600 mb-2" />
                      <p className="text-sm text-blue-700">Total Shops</p>
                      <p className="text-2xl font-bold text-blue-900">{analytics.shops.total}</p>
                    </div>
                    <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                      <TrendingUp className="h-8 w-8 text-green-600 mb-2" />
                      <p className="text-sm text-green-700">Active</p>
                      <p className="text-2xl font-bold text-green-900">{analytics.shops.active}</p>
                    </div>
                    <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                      <TrendingDown className="h-8 w-8 text-red-600 mb-2" />
                      <p className="text-sm text-red-700">Inactive</p>
                      <p className="text-2xl font-bold text-red-900">{analytics.shops.inactive}</p>
                    </div>
                  </div>

                  <div className="bg-gradient-to-r from-purple-50 to-blue-50 border border-purple-200 rounded-lg p-6">
                    <h4 className="font-semibold text-gray-900 mb-4">Regional Distribution</h4>
                    {[
                      { region: 'Sindh', shops: 5, percentage: 42 },
                      { region: 'Punjab', shops: 4, percentage: 33 },
                      { region: 'KPK', shops: 2, percentage: 17 },
                      { region: 'Islamabad', shops: 1, percentage: 8 }
                    ].map((item) => (
                      <div key={item.region} className="mb-3 last:mb-0">
                        <div className="flex items-center justify-between text-sm mb-1">
                          <span className="text-gray-700 font-medium">{item.region}</span>
                          <span className="text-gray-900">{item.shops} shops ({item.percentage}%)</span>
                        </div>
                        <div className="w-full bg-white rounded-full h-2">
                          <div
                            className="bg-gradient-to-r from-purple-500 to-blue-600 h-2 rounded-full"
                            style={{ width: `${item.percentage}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Product Insights Tab */}
            <TabsContent value="products" className="space-y-6">
              <Card>
                <CardContent className="p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-6">Inventory Overview</h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                      <Package className="h-8 w-8 text-blue-600 mb-2" />
                      <p className="text-sm text-blue-700">Total Products</p>
                      <p className="text-2xl font-bold text-blue-900">{analytics.products.total}</p>
                    </div>
                    <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                      <TrendingUp className="h-8 w-8 text-green-600 mb-2" />
                      <p className="text-sm text-green-700">In Stock</p>
                      <p className="text-2xl font-bold text-green-900">{analytics.products.inStock}</p>
                    </div>
                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                      <TrendingDown className="h-8 w-8 text-yellow-600 mb-2" />
                      <p className="text-sm text-yellow-700">Low Stock</p>
                      <p className="text-2xl font-bold text-yellow-900">{analytics.products.lowStock}</p>
                    </div>
                    <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                      <Package className="h-8 w-8 text-red-600 mb-2" />
                      <p className="text-sm text-red-700">Out of Stock</p>
                      <p className="text-2xl font-bold text-red-900">{analytics.products.outOfStock}</p>
                    </div>
                  </div>

                  <div className="bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 rounded-lg p-6">
                    <h4 className="font-semibold text-gray-900 mb-4">Top Selling Products</h4>
                    {[
                      { product: 'iPhone 15 Pro Max', sales: 45, revenue: 18900000 },
                      { product: 'Samsung Galaxy S24 Ultra', sales: 38, revenue: 15200000 },
                      { product: 'Xiaomi 14', sales: 52, revenue: 10400000 },
                      { product: 'OnePlus 12', sales: 31, revenue: 9300000 }
                    ].map((item, index) => (
                      <div key={item.product} className="mb-3 last:mb-0 bg-white rounded-lg p-4">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <span className="w-6 h-6 bg-blue-100 text-blue-700 rounded-full flex items-center justify-center text-xs font-bold">
                              {index + 1}
                            </span>
                            <span className="font-medium text-gray-900">{item.product}</span>
                          </div>
                          <Badge className="bg-purple-100 text-purple-800">{item.sales} sold</Badge>
                        </div>
                        <p className="text-sm text-gray-600 ml-8">{formatCurrency(item.revenue)}</p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </ProtectedRoute>
  )
}


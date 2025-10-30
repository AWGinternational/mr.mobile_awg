'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/use-auth'
import { ProtectedRoute } from '@/components/auth/protected-route'
import { UserRole } from '@/types'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { BusinessSidebar } from '@/components/layout/BusinessSidebar'
import { TopNavigation } from '@/components/layout/TopNavigation'
import { Loader2 } from 'lucide-react'
import {
  BarChart3,
  ArrowLeft,
  LogOut,
  Download,
  TrendingUp,
  DollarSign,
  ShoppingCart,
  Calendar,
  ArrowUp,
  ArrowDown,
  Receipt
} from 'lucide-react'
import { formatUserRole } from '@/utils/user-formatting'

interface SalesData {
  period: string
  metrics: {
    totalSales: number
    totalRevenue: number
    totalTax: number
    totalDiscount: number
    totalProfit: number
    salesGrowth: number
    revenueGrowth: number
  }
  dailyData: Array<{
    date: string
    dateFormatted: string
    sales: number
    revenue: number
  }>
  recentSales: Array<{
    id: string
    invoiceNumber: string
    customerName: string
    totalAmount: number
    paymentMethod: string
    saleDate: string
    itemsCount: number
  }>
}

export default function SalesReportsPage() {
  const router = useRouter()
  const { user: currentUser, logout } = useAuth()
  const [dateRange, setDateRange] = useState('30days')
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [salesData, setSalesData] = useState<SalesData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Fetch sales data
  const fetchSalesData = async () => {
    try {
      setLoading(true)
      setError(null)
      
      const response = await fetch(`/api/reports/sales?period=${dateRange}`)
      if (!response.ok) {
        throw new Error('Failed to fetch sales data')
      }
      
      const data = await response.json()
      if (data.success) {
        setSalesData(data.data)
      } else {
        throw new Error(data.error || 'Failed to fetch sales data')
      }
    } catch (error) {
      console.error('Error fetching sales data:', error)
      setError(error instanceof Error ? error.message : 'Failed to fetch sales data')
    } finally {
      setLoading(false)
    }
  }

  // Fetch data when component mounts or date range changes
  useEffect(() => {
    fetchSalesData()
  }, [dateRange])

  const handleLogout = async () => {
    try {
      await logout()
      router.push('/login')
    } catch (error) {
      console.error('Logout error:', error)
    }
  }

  const handleBack = () => {
    if (currentUser?.role === UserRole.SUPER_ADMIN) {
      router.push('/dashboard/admin')
    } else if (currentUser?.role === UserRole.SHOP_OWNER) {
      router.push('/dashboard/owner')
    } else {
      router.push('/dashboard/worker')
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-PK', { style: 'currency', currency: 'PKR', minimumFractionDigits: 0 }).format(amount)
  }

  return (
    <ProtectedRoute allowedRoles={[UserRole.SUPER_ADMIN, UserRole.SHOP_OWNER, UserRole.SHOP_WORKER]}>
      <div className="flex min-h-screen">
        <BusinessSidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
        <div className={`flex-1 min-h-screen bg-gradient-to-br from-slate-50 via-purple-50 to-pink-100 ${sidebarOpen ? 'lg:ml-20' : 'lg:ml-64'} transition-all duration-300`}>
        <TopNavigation onMenuClick={() => setSidebarOpen(!sidebarOpen)} />
        <div className="bg-gradient-to-r from-purple-600 via-pink-600 to-rose-700 text-white">
          <div className="px-8 py-12">
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-4">
                <button onClick={handleBack} className="p-3 bg-white/10 hover:bg-white/20 rounded-xl transition-all duration-200">
                  <ArrowLeft className="h-5 w-5 text-white" />
                </button>
                <div>
                  <h1 className="text-4xl font-bold mb-2">📊 Sales Reports</h1>
                  <p className="text-purple-100 text-lg">Analytics and performance tracking</p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <Button onClick={() => {}} className="flex items-center gap-2 bg-white/20 hover:bg-white/30 border-0">
                  <Download className="h-5 w-5" />
                  Export Report
                </Button>
              </div>
            </div>
          </div>
        </div>

        <div className="px-8 py-8 space-y-8">
          {/* Date Range Selector */}
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-bold text-gray-900">Sales Performance</h2>
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
          </div>

          {/* Loading State */}
          {loading && (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
              <span className="ml-2 text-gray-500">Loading sales data...</span>
            </div>
          )}

          {/* Error State */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <p className="text-red-700">{error}</p>
              <Button 
                onClick={fetchSalesData} 
                variant="outline" 
                size="sm" 
                className="mt-2 border-red-300 text-red-700 hover:bg-red-50"
              >
                Retry
              </Button>
            </div>
          )}

          {/* Key Metrics */}
          {salesData && !loading && !error && (
            <>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card className="bg-gradient-to-br from-blue-500 to-blue-600 text-white">
                  <CardContent className="p-6">
                    <DollarSign className="h-10 w-10 mb-3 text-blue-100" />
                    <p className="text-blue-100 text-sm mb-1">Total Revenue</p>
                    <p className="text-3xl font-bold mb-2">{formatCurrency(salesData.metrics.totalRevenue)}</p>
                    <div className="flex items-center gap-1 text-sm">
                      {salesData.metrics.revenueGrowth >= 0 ? (
                        <ArrowUp className="h-4 w-4" />
                      ) : (
                        <ArrowDown className="h-4 w-4" />
                      )}
                      <span>{Math.abs(salesData.metrics.revenueGrowth)}% vs previous period</span>
                    </div>
                  </CardContent>
                </Card>
                <Card className="bg-gradient-to-br from-green-500 to-green-600 text-white">
                  <CardContent className="p-6">
                    <ShoppingCart className="h-10 w-10 mb-3 text-green-100" />
                    <p className="text-green-100 text-sm mb-1">Total Sales</p>
                    <p className="text-3xl font-bold mb-2">{salesData.metrics.totalSales}</p>
                    <div className="flex items-center gap-1 text-sm">
                      {salesData.metrics.salesGrowth >= 0 ? (
                        <ArrowUp className="h-4 w-4" />
                      ) : (
                        <ArrowDown className="h-4 w-4" />
                      )}
                      <span>{Math.abs(salesData.metrics.salesGrowth)}% vs previous period</span>
                    </div>
                  </CardContent>
                </Card>
                <Card className="bg-gradient-to-br from-purple-500 to-purple-600 text-white">
                  <CardContent className="p-6">
                    <TrendingUp className="h-10 w-10 mb-3 text-purple-100" />
                    <p className="text-purple-100 text-sm mb-1">Profit</p>
                    <p className="text-3xl font-bold mb-2">{formatCurrency(salesData.metrics.totalProfit)}</p>
                    <p className="text-sm">{((salesData.metrics.totalProfit / salesData.metrics.totalRevenue) * 100).toFixed(1)}% margin</p>
                  </CardContent>
                </Card>
              </div>

              {/* Sales Chart */}
              <Card>
                <CardContent className="p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-6">Daily Sales Trend (Last 7 Days)</h3>
                  <div className="space-y-3">
                    {salesData.dailyData.map((day) => {
                      const maxSales = Math.max(...salesData.dailyData.map(d => d.sales))
                      const percentage = maxSales > 0 ? (day.sales / maxSales) * 100 : 0
                      
                      return (
                        <div key={day.date} className="flex items-center gap-4">
                          <span className="text-sm text-gray-600 w-20">{day.dateFormatted}</span>
                          <div className="flex-1">
                            <div className="w-full bg-gray-200 rounded-full h-8 flex items-center">
                              <div
                                className="bg-gradient-to-r from-purple-500 to-pink-600 h-8 rounded-full flex items-center justify-end px-3"
                                style={{ width: `${percentage}%` }}
                              >
                                <span className="text-white text-xs font-medium">{day.sales} sales</span>
                              </div>
                            </div>
                          </div>
                          <span className="text-sm font-semibold text-gray-900 w-32 text-right">{formatCurrency(day.revenue)}</span>
                        </div>
                      )
                    })}
                  </div>
                </CardContent>
              </Card>

              {/* Recent Sales */}
              <Card>
                <CardContent className="p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-6">Recent Sales</h3>
                  <div className="space-y-4">
                    {salesData.recentSales.length === 0 ? (
                      <p className="text-gray-500 text-center py-8">No sales found for the selected period</p>
                    ) : (
                      salesData.recentSales.map((sale) => (
                        <div key={sale.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                          <div className="flex items-center gap-4">
                            <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                              <Receipt className="h-5 w-5 text-blue-600" />
                            </div>
                            <div>
                              <p className="font-medium text-gray-900">{sale.invoiceNumber}</p>
                              <p className="text-sm text-gray-500">{sale.customerName} • {sale.itemsCount} items</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="font-semibold text-gray-900">{formatCurrency(sale.totalAmount)}</p>
                            <p className="text-sm text-gray-500">{sale.paymentMethod} • {new Date(sale.saleDate).toLocaleDateString()}</p>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </CardContent>
              </Card>
            </>
          )}
        </div>
        </div>
      </div>
    </ProtectedRoute>
  )
}


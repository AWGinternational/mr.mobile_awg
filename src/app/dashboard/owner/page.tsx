'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useQuery } from '@tanstack/react-query'
import { ProtectedRoute } from '@/components/auth/protected-route'
import { UserRole } from '@/types'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { BusinessSidebar } from '@/components/layout/BusinessSidebar'
import { TopNavigation } from '@/components/layout/TopNavigation'
import { 
  Store,
  Users,
  Package,
  ShoppingCart,
  BarChart3,
  DollarSign,
  TrendingUp,
  AlertTriangle,
  Settings,
  Smartphone,
  UserCheck,
  CreditCard,
  Truck,
  RefreshCw,
  ArrowRight,
  Loader2,
  ClipboardCheck
} from 'lucide-react'
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts'

interface DashboardData {
  shop: {
    id: string
    name: string
    location: string
    gstNumber: string
  }
  today: {
    sales: number
    transactions: number
    paymentMethods: Array<{
      name: string
      amount: number
      percentage: number
    }>
  }
  inventory: {
    total: number
    inStock: number
    lowStock: number
    outOfStock: number
    totalValue: number
  }
  workers: {
    total: number
    performance: Array<{
      id: string
      name: string
      email: string
      sales: number
      transactions: number
      status: string
    }>
  }
  customers: {
    total: number
    active: number
  }
  monthly: {
    revenue: number
    profit: number
  }
  trends: {
    weekly: Array<{
      date: string
      sales: number
      transactions: number
      profit: number
    }>
  }
  topBrands: Array<{
    name: string
    sales: number
    revenue: number
    units: number
  }>
  pendingOrders: number
  pendingApprovals: number
}

const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899']

export default function ShopOwnerDashboard() {
  const router = useRouter()
  const [sidebarOpen, setSidebarOpen] = useState(false)

  // Use React Query for caching and automatic refetching
  const { data: dashboardData, isLoading: loading, error, refetch } = useQuery<DashboardData>({
    queryKey: ['dashboard', 'owner'],
    queryFn: async () => {
      const response = await fetch('/api/dashboard/owner')
      
      if (!response.ok) {
        throw new Error('Failed to fetch dashboard data')
      }
      
      return response.json()
    },
    staleTime: 5 * 60 * 1000, // 5 minutes - data is fresh for 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes - keep in cache for 10 minutes
    retry: 1, // Retry once on failure
  })

  const fetchDashboardData = () => {
    refetch()
  }

  const errorMessage = error instanceof Error ? error.message : error ? String(error) : 'Failed to load dashboard'

  const handleModuleClick = (moduleName: string) => {
    const routes: { [key: string]: string } = {
      'POS System': '/dashboard/pos',
      'Product Management': '/products',
      'Inventory Control': '/inventory',
      'Customer Management': '/customers',
      'Sales Reports': '/reports',
      'Supplier Relations': '/suppliers',
      'Payment Processing': '/payments',
      'Daily Closing': '/daily-closing',
      'Loan Management': '/loans',
      'Shop Settings': '/settings'
    }
    
    const route = routes[moduleName]
    if (route) {
      router.push(route)
    }
  }

  const ownerModules = [
    {
      name: 'POS System',
      icon: ShoppingCart,
      description: 'Direct sales processing',
      stats: `${dashboardData?.today.transactions || 0} today`,
      color: 'bg-green-500',
      urgency: false
    },
    {
      name: 'Product Management',
      icon: Smartphone,
      description: 'Product catalog',
      stats: `${dashboardData?.inventory.total || 0} products`,
      color: 'bg-blue-500',
      urgency: false
    },
    {
      name: 'Inventory Control',
      icon: Package,
      description: 'Stock management',
      stats: `${dashboardData?.inventory.lowStock || 0} low stock`,
      color: 'bg-orange-500',
      urgency: (dashboardData?.inventory.lowStock || 0) > 5
    },
    {
      name: 'Customer Management',
      icon: Users,
      description: 'Customer database',
      stats: `${dashboardData?.customers.total || 0} customers`,
      color: 'bg-teal-500',
      urgency: false
    },
    {
      name: 'Sales Reports',
      icon: BarChart3,
      description: 'Sales analytics',
      stats: 'Live reports',
      color: 'bg-purple-500',
      urgency: false
    },
    {
      name: 'Daily Closing',
      icon: DollarSign,
      description: 'Cash reconciliation',
      stats: `PKR ${((dashboardData?.today.sales || 0) / 1000).toFixed(1)}K`,
      color: 'bg-green-600',
      urgency: false
    },
    {
      name: 'Payment Processing',
      icon: CreditCard,
      description: 'Payment tracking',
      stats: 'All payments',
      color: 'bg-indigo-500',
      urgency: false
    },
    {
      name: 'Supplier Relations',
      icon: Truck,
      description: 'Supplier orders',
      stats: `${dashboardData?.pendingOrders || 0} pending`,
      color: 'bg-amber-500',
      urgency: (dashboardData?.pendingOrders || 0) > 2
    },
    {
      name: 'Loan Management',
      icon: CreditCard,
      description: 'Installment plans',
      stats: 'Active loans',
      color: 'bg-yellow-600',
      urgency: false
    },
    {
      name: 'Shop Settings',
      icon: Settings,
      description: 'Shop configuration',
      stats: 'Configure',
      color: 'bg-gray-500',
      urgency: false
    }
  ]

    // Only show error screen if there's an actual error AND not currently loading
    if (error && !loading && !dashboardData) {
    return (
      <ProtectedRoute allowedRoles={[UserRole.SHOP_OWNER]}>
        <div className="flex min-h-screen items-center justify-center bg-gray-50 dark:bg-gray-900">
          <Card className="w-full max-w-md">
            <CardContent className="flex flex-col items-center justify-center p-8">
              <AlertTriangle className="h-8 w-8 text-red-600 mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Failed to Load</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 text-center mt-2 mb-4">
                {errorMessage || 'Unable to fetch dashboard data'}
              </p>
              <Button onClick={fetchDashboardData}>
                <RefreshCw className="h-4 w-4 mr-2" />
                Try Again
              </Button>
            </CardContent>
          </Card>
        </div>
      </ProtectedRoute>
    )
  }

  return (
    <ProtectedRoute allowedRoles={[UserRole.SHOP_OWNER]}>
      <div className="flex min-h-screen bg-gray-50 dark:bg-gray-900">
        <BusinessSidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
        
                <div className={`flex-1 flex flex-col min-h-screen ${sidebarOpen ? 'lg:ml-20' : 'lg:ml-64'} transition-all duration-300`}>
          <TopNavigation onMenuClick={() => setSidebarOpen(!sidebarOpen)} />
          
          {/* Loading State */}
          {loading && (
            <div className="flex-1 flex items-center justify-center">
              <Card className="w-full max-w-md mx-4">
                <CardContent className="flex flex-col items-center justify-center p-8">
                  <Loader2 className="h-12 w-12 animate-spin text-blue-600 mb-4" />
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Loading Dashboard</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400 text-center mt-2">
                    Fetching your shop&apos;s latest data...
                  </p>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Error State */}
          {!loading && error && (
            <div className="flex-1 flex items-center justify-center">
              <Card className="w-full max-w-md mx-4 border-red-200 dark:border-red-800">
                <CardContent className="flex flex-col items-center justify-center p-8">
                  <div className="bg-red-100 dark:bg-red-900/20 p-4 rounded-full mb-4">
                    <AlertTriangle className="h-12 w-12 text-red-600 dark:text-red-400" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Failed to Load Dashboard</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400 text-center mt-2">
                    {errorMessage || 'Unable to fetch dashboard data'}
                  </p>
                  <Button
                    onClick={fetchDashboardData}
                    className="mt-6 bg-blue-600 hover:bg-blue-700"
                  >
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Try Again
                  </Button>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Dashboard Content */}
          {!loading && !error && dashboardData && (
            <>
          {/* Dashboard Header */}
          <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-lg">
            <div className="px-4 sm:px-6 lg:px-8 py-4 sm:py-5 lg:py-6">
              <div className="flex justify-between items-center gap-3">
                <div className="flex items-center gap-2.5 sm:gap-3 lg:gap-4 min-w-0 flex-1">
                  <div className="bg-white/20 p-2 sm:p-2.5 lg:p-3 rounded-xl backdrop-blur-sm flex-shrink-0">
                    <Store className="h-5 w-5 sm:h-6 sm:w-6 lg:h-8 lg:w-8 text-white" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <h1 className="text-lg sm:text-xl lg:text-2xl font-bold mb-0.5 sm:mb-1 truncate">{dashboardData.shop.name}</h1>
                    <p className="text-blue-100 text-xs sm:text-sm flex items-center gap-2 sm:gap-3 lg:gap-4">
                      <span className="truncate">📍 {dashboardData.shop.location}</span>
                    </p>
                  </div>
                </div>
                <Button
                  onClick={fetchDashboardData}
                  variant="outline"
                  size="sm"
                  className="bg-white/10 hover:bg-white/20 active:bg-white/30 text-white border-white/30 h-8 sm:h-9 lg:h-10 px-2 sm:px-3 lg:px-4 flex-shrink-0 touch-manipulation"
                >
                  <RefreshCw className="h-3 w-3 sm:h-3.5 sm:w-3.5 lg:h-4 lg:w-4 mr-1 sm:mr-1.5 lg:mr-2" />
                  <span className="hidden sm:inline text-xs sm:text-sm">Refresh</span>
                </Button>
              </div>
            </div>
          </div>

          <div className="flex-1 px-4 sm:px-6 lg:px-8 py-4 sm:py-6 lg:py-8 space-y-4 sm:space-y-6 lg:space-y-8">
            {/* Quick Stats - 2 cards per row */}
            <div className="grid grid-cols-2 gap-2 sm:gap-3 lg:gap-4">
              <Card className="bg-gradient-to-br from-green-500 to-green-600 text-white shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-300 cursor-pointer">
                <CardContent className="p-2.5 sm:p-3 lg:p-4">
                  <div className="flex flex-col">
                    <div className="flex items-center justify-between mb-1.5">
                      <p className="text-green-100 text-xs font-medium">Today&apos;s Sales</p>
                      <div className="bg-white/20 p-1.5 sm:p-2 rounded-lg backdrop-blur-sm flex-shrink-0">
                        <DollarSign className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
                      </div>
                    </div>
                    <p className="text-xl sm:text-2xl lg:text-3xl font-bold tracking-tight mb-1">
                      PKR {(dashboardData.today.sales / 1000).toFixed(1)}K
                    </p>
                    <p className="text-green-200 text-xs flex items-center">
                      <TrendingUp className="h-3 w-3 mr-1 flex-shrink-0" />
                      <span className="truncate">{dashboardData.today.transactions} transactions</span>
                    </p>
                  </div>
                </CardContent>
              </Card>
              
              <Card className="bg-gradient-to-br from-blue-500 to-blue-600 text-white shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-300 cursor-pointer">
                <CardContent className="p-2.5 sm:p-3 lg:p-4">
                  <div className="flex flex-col">
                    <div className="flex items-center justify-between mb-1.5">
                      <p className="text-blue-100 text-xs font-medium">Monthly Revenue</p>
                      <div className="bg-white/20 p-1.5 sm:p-2 rounded-lg backdrop-blur-sm flex-shrink-0">
                        <BarChart3 className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
                      </div>
                    </div>
                    <p className="text-xl sm:text-2xl lg:text-3xl font-bold tracking-tight mb-1">
                      PKR {(dashboardData.monthly.revenue / 1000).toFixed(0)}K
                    </p>
                    <p className="text-blue-200 text-xs flex items-center">
                      <TrendingUp className="h-3 w-3 mr-1 flex-shrink-0" />
                      <span className="truncate">Profit: PKR {(dashboardData.monthly.profit / 1000).toFixed(1)}K</span>
                    </p>
                  </div>
                </CardContent>
              </Card>
              
              <Card className="bg-gradient-to-br from-orange-500 to-orange-600 text-white shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-300 cursor-pointer">
                <CardContent className="p-2.5 sm:p-3 lg:p-4">
                  <div className="flex flex-col">
                    <div className="flex items-center justify-between mb-1.5">
                      <p className="text-orange-100 text-xs font-medium">Inventory</p>
                      <div className="bg-white/20 p-1.5 sm:p-2 rounded-lg backdrop-blur-sm flex-shrink-0">
                        <Package className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
                      </div>
                    </div>
                    <p className="text-xl sm:text-2xl lg:text-3xl font-bold tracking-tight mb-1">
                      {dashboardData.inventory.inStock}
                    </p>
                    <p className="text-orange-200 text-xs flex items-center">
                      <AlertTriangle className="h-3 w-3 mr-1 flex-shrink-0" />
                      <span className="truncate">{dashboardData.inventory.lowStock} low stock</span>
                    </p>
                  </div>
                </CardContent>
              </Card>
              
              <Card className="bg-gradient-to-br from-purple-500 to-purple-600 text-white shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-300 cursor-pointer">
                <CardContent className="p-2.5 sm:p-3 lg:p-4">
                  <div className="flex flex-col">
                    <div className="flex items-center justify-between mb-1.5">
                      <p className="text-purple-100 text-xs font-medium">Customers</p>
                      <div className="bg-white/20 p-1.5 sm:p-2 rounded-lg backdrop-blur-sm flex-shrink-0">
                        <Users className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
                      </div>
                    </div>
                    <p className="text-xl sm:text-2xl lg:text-3xl font-bold tracking-tight mb-1">
                      {dashboardData.customers.active}
                    </p>
                    <p className="text-purple-200 text-xs flex items-center">
                      <Users className="h-3 w-3 mr-1 flex-shrink-0" />
                      <span className="truncate">{dashboardData.customers.total} total</span>
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Quick Actions Section */}
            <Card className="shadow-lg">
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-3">
                  {ownerModules.slice(0, 6).map((module, index) => (
                    <button
                      key={index}
                      onClick={() => handleModuleClick(module.name)}
                      className={`p-4 rounded-lg border-2 hover:border-blue-500 dark:hover:border-blue-400 transition-all group ${
                        module.urgency ? 'border-orange-300 bg-orange-50 dark:border-orange-500 dark:bg-orange-900/20' : 'border-gray-200 dark:border-gray-700'
                      }`}
                    >
                      <div className={`p-2 rounded-lg ${module.color} w-fit mb-2 group-hover:scale-110 transition-transform`}>
                        <module.icon className="h-5 w-5 text-white" />
                      </div>
                      <p className="text-sm font-semibold text-gray-900 dark:text-white">{module.name}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">{module.stats}</p>
                    </button>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="shadow-lg">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="h-5 w-5 text-blue-600" />
                    7-Day Sales Trend
                  </CardTitle>
                  <CardDescription>Daily revenue and profit</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <AreaChart data={dashboardData.trends.weekly}>
                      <defs>
                        <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.8}/>
                          <stop offset="95%" stopColor="#3B82F6" stopOpacity={0.1}/>
                        </linearGradient>
                        <linearGradient id="colorProfit" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#10B981" stopOpacity={0.8}/>
                          <stop offset="95%" stopColor="#10B981" stopOpacity={0.1}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                      <XAxis dataKey="date" stroke="#6B7280" style={{ fontSize: '12px' }} />
                      <YAxis stroke="#6B7280" style={{ fontSize: '12px' }} />
                      <Tooltip />
                      <Legend />
                      <Area 
                        type="monotone" 
                        dataKey="sales" 
                        stroke="#3B82F6" 
                        fillOpacity={1} 
                        fill="url(#colorSales)" 
                        name="Sales (PKR)"
                      />
                      <Area 
                        type="monotone" 
                        dataKey="profit" 
                        stroke="#10B981" 
                        fillOpacity={1} 
                        fill="url(#colorProfit)" 
                        name="Profit (PKR)"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <Card className="shadow-lg">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <CreditCard className="h-5 w-5 text-green-600" />
                    Payment Methods
                  </CardTitle>
                  <CardDescription>Today&apos;s distribution</CardDescription>
                </CardHeader>
                <CardContent>
                  {dashboardData.today.paymentMethods.length > 0 ? (
                    <ResponsiveContainer width="100%" height={300}>
                      <PieChart>
                        <Pie
                          data={dashboardData.today.paymentMethods}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          label={({ name, percentage }) => `${name} ${percentage}%`}
                          outerRadius={100}
                          dataKey="amount"
                        >
                          {dashboardData.today.paymentMethods.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip formatter={(value: number) => `PKR ${value.toFixed(2)}`} />
                      </PieChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="h-[300px] flex items-center justify-center">
                      <div className="text-center text-gray-500 dark:text-gray-400">
                        <CreditCard className="h-12 w-12 mx-auto mb-2 text-gray-300 dark:text-gray-600" />
                        <p>No transactions today</p>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Top Brands */}
            {dashboardData.topBrands.length > 0 && (
              <Card className="shadow-lg">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Smartphone className="h-5 w-5 text-purple-600" />
                    Top Brands (Last 30 Days)
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={dashboardData.topBrands}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                      <XAxis dataKey="name" stroke="#6B7280" style={{ fontSize: '12px' }} />
                      <YAxis stroke="#6B7280" style={{ fontSize: '12px' }} />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="revenue" fill="#8B5CF6" name="Revenue" radius={[8, 8, 0, 0]} />
                      <Bar dataKey="units" fill="#3B82F6" name="Units" radius={[8, 8, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            )}

            {/* Worker Performance */}
            <Card className="shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <UserCheck className="h-5 w-5 text-blue-600" />
                  Worker Performance
                </CardTitle>
              </CardHeader>
              <CardContent>
                {dashboardData.workers.performance.length > 0 ? (
                  <div className="space-y-4">
                    {dashboardData.workers.performance.map((worker) => (
                      <div key={worker.id} className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center">
                            <UserCheck className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                          </div>
                          <div>
                            <p className="font-semibold text-gray-900 dark:text-white">{worker.name}</p>
                            <p className="text-sm text-gray-500 dark:text-gray-400">{worker.email}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-gray-900 dark:text-white">PKR {(worker.sales / 1000).toFixed(1)}K</p>
                          <p className="text-sm text-gray-500 dark:text-gray-400">{worker.transactions} sales</p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12 text-gray-500 dark:text-gray-400">
                    <Users className="h-12 w-12 mx-auto mb-2 text-gray-300 dark:text-gray-600" />
                    <p>No workers assigned</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* All Modules with enhanced styling */}
            <div>
              <h3 className="text-2xl font-bold mb-6 text-gray-900 dark:text-white">Shop Management Modules</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
                {ownerModules.map((module, index) => (
                  <Card 
                    key={index} 
                    className={`hover:shadow-2xl transform hover:-translate-y-2 transition-all duration-300 cursor-pointer group relative overflow-hidden ${
                      module.urgency ? 'ring-2 ring-orange-400 shadow-lg' : 'hover:ring-2 hover:ring-blue-400'
                    }`}
                    onClick={() => handleModuleClick(module.name)}
                  >
                    {module.urgency && (
                      <div className="absolute top-0 right-0 bg-orange-500 text-white text-xs font-bold px-3 py-1 rounded-bl-lg">
                        Attention
                      </div>
                    )}
                    <CardHeader className="flex flex-row items-center space-y-0 pb-3">
                      <div className={`p-3 rounded-xl ${module.color} text-white group-hover:scale-110 group-hover:rotate-3 transition-all duration-300 shadow-md`}>
                        <module.icon className="h-5 w-5" />
                      </div>
                      <div className="ml-4 flex-1">
                        <CardTitle className="text-sm font-bold text-gray-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">{module.name}</CardTitle>
                        <p className="text-xs text-gray-600 dark:text-gray-400 font-medium mt-1">{module.stats}</p>
                      </div>
                      <ArrowRight className="h-4 w-4 text-gray-400 dark:text-gray-500 group-hover:text-blue-600 dark:group-hover:text-blue-400 group-hover:translate-x-1 transition-all" />
                    </CardHeader>
                    <CardContent className="pt-0">
                      <CardDescription className="text-xs text-gray-500 dark:text-gray-400">{module.description}</CardDescription>
                    </CardContent>
                    <div className="absolute inset-0 bg-gradient-to-r from-blue-400/0 to-blue-400/0 group-hover:from-blue-400/5 group-hover:to-transparent transition-all duration-300 pointer-events-none" />
                  </Card>
                ))}
              </div>
            </div>
          </div>
          </>
          )}
        </div>
      </div>
    </ProtectedRoute>
  )
}

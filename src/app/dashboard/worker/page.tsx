'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/use-auth'
import { useShiftStatus } from '@/hooks/use-shift-status'
import { ProtectedRoute } from '@/components/auth/protected-route'
import { UserRole } from '@/types'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { BusinessSidebar } from '@/components/layout/BusinessSidebar'
import { TopNavigation } from '@/components/layout/TopNavigation'
import { 
  ShoppingCart,
  Package,
  Users,
  Clock,
  CheckCircle,
  AlertCircle,
  Smartphone,
  Scan,
  CreditCard,
  FileText,
  TrendingUp,
  Eye,
  Edit,
  Plus,
  Minus,
  RotateCcw,
  DollarSign,
  Loader2,
  LogIn,
  LogOut,
  BarChart3
} from 'lucide-react'
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer
} from 'recharts'

// Types for API response
interface WorkerDashboardData {
  worker: {
    id: string
    name: string
    email: string
    phone?: string
    workerId: string
    joinedAt: string
  }
  shop: {
    id: string
    name: string
    address: string
    city: string
  }
  todayMetrics: {
    sales: number
    transactions: number
    commission: number
    commissionRate: number
  }
  weeklyMetrics: {
    sales: number
    transactions: number
    commission: number
  }
  monthlyMetrics: {
    sales: number
    transactions: number
    commission: number
  }
  recentTransactions: Array<{
    id: string
    invoiceNumber: string
    amount: number
    paymentMethod: string
    status: string
    date: string
    customer: string
    items: Array<{ product: string; quantity: number }>
  }>
  pendingApprovals: Array<{
    id: string
    type: string
    itemName: string
    reason?: string
    status: string
    requestedAt: string
  }>
  salesTrend: Array<{
    day: string
    sales: number
    count: number
  }>
  shiftInfo: {
    start: string
    end: string
    hoursWorked: number
  }
}

function WorkerDashboardContent() {
  const router = useRouter()
  const { logout } = useAuth()
  const { shiftActive, shiftStartTime, startShift, endShift } = useShiftStatus()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [data, setData] = useState<WorkerDashboardData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Fetch worker dashboard data
  useEffect(() => {
    async function fetchDashboardData() {
      try {
        setLoading(true)
        const response = await fetch('/api/dashboard/worker')
        
        if (!response.ok) {
          throw new Error('Failed to fetch dashboard data')
        }
        
        const result = await response.json()
        setData(result)
        setError(null)
      } catch (err) {
        console.error('Dashboard fetch error:', err)
        setError(err instanceof Error ? err.message : 'Unknown error')
      } finally {
        setLoading(false)
      }
    }

    fetchDashboardData()
  }, [])

  const handleLogout = async () => {
    try {
      await logout()
    } catch (error) {
      console.error('Logout error:', error)
      router.push('/login')
    }
  }

  const quickActions = [
    {
      name: 'New Sale',
      icon: ShoppingCart,
      description: 'Process customer transaction',
      color: 'bg-green-500',
      primary: true,
      onClick: () => router.push('/dashboard/pos')
    },
    {
      name: 'Check Stock',
      icon: Package,
      description: 'View product availability',
      color: 'bg-blue-500',
      primary: false,
      onClick: () => router.push('/dashboard/inventory')
    },
    {
      name: 'Scan Product',
      icon: Scan,
      description: 'Barcode scanner',
      color: 'bg-purple-500',
      primary: false,
      onClick: () => router.push('/dashboard/pos')
    },
    {
      name: 'Customer Info',
      icon: Users,
      description: 'View customer details',
      color: 'bg-orange-500',
      primary: false,
      onClick: () => router.push('/dashboard/customers')
    },
  ]

  // Show loading state
  if (loading) {
    return (
      <div className="flex h-screen">
        <BusinessSidebar 
          isOpen={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
        />
        
        <div className="flex-1 flex flex-col">
          <TopNavigation onMenuClick={() => setSidebarOpen(!sidebarOpen)} />
          
          <main className="flex-1 p-6 bg-gray-50 overflow-auto">
            <div className="flex items-center justify-center h-96">
              <div className="text-center">
                <Loader2 className="h-12 w-12 animate-spin text-blue-500 mx-auto mb-4" />
                <p className="text-gray-600">Loading your dashboard...</p>
              </div>
            </div>
          </main>
        </div>
      </div>
    )
  }

  // Show error state only if there's an actual error AND not loading
  if (error && !loading && !data) {
    return (
      <div className="flex h-screen">
        <BusinessSidebar 
          isOpen={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
        />
        
        <div className="flex-1 flex flex-col">
          <TopNavigation onMenuClick={() => setSidebarOpen(!sidebarOpen)} />
          
          <main className="flex-1 p-6 bg-gray-50 dark:bg-gray-900 overflow-auto">
            <Card className="border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20">
              <CardContent className="pt-6">
                <div className="text-center">
                  <AlertCircle className="h-12 w-12 text-red-500 dark:text-red-400 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-red-800 dark:text-red-300 mb-2">
                    Error Loading Dashboard
                  </h3>
                  <p className="text-red-600 dark:text-red-400 mb-4">{error || 'Unknown error occurred'}</p>
                  <Button onClick={() => window.location.reload()}>
                    Retry
                  </Button>
                </div>
              </CardContent>
            </Card>
          </main>
        </div>
      </div>
    )
  }

  // Don't render if data is not loaded yet
  if (!data) {
    return null
  }

  return (
    <div className="flex min-h-screen bg-gray-50 dark:bg-gray-900">
      <BusinessSidebar 
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />
      
      {/* Main Content Area */}
      <div className={`flex-1 flex flex-col min-h-screen transition-all duration-300 ${sidebarOpen ? 'lg:ml-20' : 'lg:ml-64'}`}>
        {/* Top Navigation */}
        <TopNavigation onMenuClick={() => setSidebarOpen(!sidebarOpen)} />
        
        {/* Page Content */}
        <main className="flex-1 p-6 bg-gray-50 overflow-auto">
          <div className="max-w-7xl mx-auto space-y-6">
            {/* Shift Management Banner - REQUIRED TO START */}
            {!shiftActive ? (
              <Card className="border-2 border-red-300 bg-gradient-to-r from-red-50 to-orange-50 shadow-lg">
                <CardContent className="pt-6 pb-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="bg-red-500 p-4 rounded-full">
                        <AlertCircle className="h-8 w-8 text-white" />
                      </div>
                      <div>
                        <h2 className="text-2xl font-bold text-red-900">
                          ⚠️ Shift Not Started
                        </h2>
                        <p className="text-red-700 mt-1">
                          You must start your shift to access POS, sales, and other features
                        </p>
                        <p className="text-sm text-red-600 mt-1">
                          📍 {data.shop.name} - {data.shop.city}
                        </p>
                      </div>
                    </div>
                    <Button 
                      onClick={startShift}
                      size="lg"
                      className="bg-green-600 hover:bg-green-700 text-white px-8 py-6 text-lg font-bold shadow-lg hover:shadow-xl transform hover:scale-105 transition-all"
                    >
                      <LogIn className="h-6 w-6 mr-2" />
                      Start My Shift
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <Card className="border-2 border-green-500 bg-gradient-to-r from-green-50 to-emerald-50 shadow-lg">
                <CardContent className="pt-6 pb-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="bg-green-500 p-4 rounded-full animate-pulse">
                        <CheckCircle className="h-8 w-8 text-white" />
                      </div>
                      <div>
                        <h2 className="text-2xl font-bold text-green-900">
                          ✅ Shift Active - Welcome, {data.worker.name.split(' ')[0]}!
                        </h2>
                        <div className="flex items-center gap-6 mt-1 text-sm text-green-700">
                          <span>
                            <Clock className="inline h-4 w-4 mr-1" />
                            Started: {new Date(shiftStartTime!).toLocaleTimeString('en-US', { 
                              hour: '2-digit', 
                              minute: '2-digit' 
                            })}
                          </span>
                          <span className="font-bold text-green-800">
                            ⏱️ Duration: {Math.floor((Date.now() - new Date(shiftStartTime!).getTime()) / (1000 * 60))} min
                          </span>
                          <span>
                            <Smartphone className="inline h-4 w-4 mr-1" />
                            {data.shop.name}
                          </span>
                        </div>
                      </div>
                    </div>
                    <Button 
                      onClick={endShift}
                      variant="destructive"
                      size="lg"
                      className="px-8 py-6 text-lg font-bold shadow-lg hover:shadow-xl transform hover:scale-105 transition-all"
                    >
                      <LogOut className="h-6 w-6 mr-2" />
                      End Shift
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Blocked Content Warning - Show when shift not active */}
            {!shiftActive && (
              <Card className="border-yellow-300 bg-yellow-50">
                <CardContent className="pt-6 pb-6">
                  <div className="flex items-center gap-3">
                    <AlertCircle className="h-6 w-6 text-yellow-600" />
                    <div>
                      <p className="font-semibold text-yellow-900">
                        🔒 All Features Locked
                      </p>
                      <p className="text-sm text-yellow-700 mt-1">
                        Point of Sale, Mobile Services (EasyPaisa/JazzCash), Inventory Updates, Customer Management, and Product Creation are disabled until you start your shift.
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Performance Cards */}
            <div className={`grid grid-cols-1 md:grid-cols-3 gap-4 ${!shiftActive ? 'opacity-50 pointer-events-none' : ''}`}>
              {/* Today's Sales */}
              <Card>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm font-medium text-gray-600">
                      Today's Sales
                    </CardTitle>
                    <DollarSign className="h-5 w-5 text-green-600" />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-gray-900">
                    PKR {data.todayMetrics.sales.toLocaleString()}
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    {data.todayMetrics.transactions} transactions today
                  </p>
                </CardContent>
              </Card>

              {/* Today's Transactions */}
              <Card>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm font-medium text-gray-600">
                      Transactions
                    </CardTitle>
                    <ShoppingCart className="h-5 w-5 text-blue-600" />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-gray-900">
                    {data.todayMetrics.transactions}
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    Today's completed sales
                  </p>
                </CardContent>
              </Card>

              {/* Pending Approvals */}
              <Card>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm font-medium text-gray-600">
                      Pending Approvals
                    </CardTitle>
                    <Clock className="h-5 w-5 text-orange-600" />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-gray-900">
                    {data.pendingApprovals.length}
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    Awaiting owner review
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Quick Actions */}
            <Card className={!shiftActive ? 'opacity-50' : ''}>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>Quick Actions</span>
                  {!shiftActive && (
                    <span className="text-xs font-normal text-red-600 bg-red-100 px-3 py-1 rounded-full">
                      🔒 Locked - Start shift first
                    </span>
                  )}
                </CardTitle>
                <CardDescription>Common tasks and shortcuts</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {quickActions.map((action) => (
                    <Button
                      key={action.name}
                      onClick={shiftActive ? action.onClick : undefined}
                      variant={action.primary ? 'default' : 'outline'}
                      disabled={!shiftActive}
                      className={`h-auto flex-col p-4 ${action.primary ? action.color + ' hover:opacity-90' : ''} ${!shiftActive ? 'cursor-not-allowed' : ''}`}
                    >
                      <action.icon className="h-6 w-6 mb-2" />
                      <span className="font-medium">{action.name}</span>
                      <span className="text-xs opacity-80 mt-1">{action.description}</span>
                    </Button>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Sales Trend Chart */}
            <Card className={!shiftActive ? 'opacity-50' : ''}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5 text-blue-600" />
                  7-Day Sales Trend
                </CardTitle>
                <CardDescription>Your daily performance this week</CardDescription>
              </CardHeader>
              <CardContent>
                {data.salesTrend && data.salesTrend.length > 0 ? (
                  <ResponsiveContainer width="100%" height={300}>
                    <AreaChart data={data.salesTrend}>
                      <defs>
                        <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.8}/>
                          <stop offset="95%" stopColor="#3B82F6" stopOpacity={0.1}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                      <XAxis 
                        dataKey="day" 
                        stroke="#6B7280" 
                        style={{ fontSize: '12px' }}
                      />
                      <YAxis 
                        stroke="#6B7280" 
                        style={{ fontSize: '12px' }}
                      />
                      <Tooltip 
                        formatter={(value: number) => `PKR ${value.toLocaleString()}`}
                        labelStyle={{ color: '#1F2937' }}
                      />
                      <Area 
                        type="monotone" 
                        dataKey="sales" 
                        stroke="#3B82F6" 
                        fillOpacity={1} 
                        fill="url(#colorSales)" 
                        name="Sales"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-[300px] flex items-center justify-center">
                    <div className="text-center text-gray-500">
                      <BarChart3 className="h-12 w-12 mx-auto mb-2 text-gray-300" />
                      <p>No sales data available</p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            <div className={`grid grid-cols-1 lg:grid-cols-2 gap-6 ${!shiftActive ? 'opacity-50' : ''}`}>
              {/* Recent Transactions */}
              <Card>
                <CardHeader>
                  <CardTitle>Recent Transactions</CardTitle>
                  <CardDescription>Your latest sales</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {data.recentTransactions.length === 0 ? (
                      <p className="text-center text-gray-500 py-8">
                        No transactions yet today
                      </p>
                    ) : (
                      data.recentTransactions.map((txn) => (
                        <div key={txn.id} className="flex items-start justify-between p-3 bg-gray-50 rounded-lg">
                          <div className="flex-1">
                            <p className="font-medium text-sm">{txn.invoiceNumber}</p>
                            <p className="text-xs text-gray-600">{txn.customer}</p>
                            <p className="text-xs text-gray-500 mt-1">
                              {txn.items.map(item => `${item.product} (${item.quantity})`).join(', ')}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="font-semibold text-sm">PKR {txn.amount.toLocaleString()}</p>
                            <span className={`inline-block px-2 py-0.5 text-xs rounded-full mt-1 ${
                              txn.status === 'COMPLETED' 
                                ? 'bg-green-100 text-green-800'
                                : 'bg-yellow-100 text-yellow-800'
                            }`}>
                              {txn.status}
                            </span>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Pending Approval Requests */}
              <Card>
                <CardHeader>
                  <CardTitle>Pending Approvals</CardTitle>
                  <CardDescription>Requests awaiting owner approval</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {data.pendingApprovals.length === 0 ? (
                      <p className="text-center text-gray-500 py-8">
                        <CheckCircle className="h-12 w-12 mx-auto mb-2 text-green-500" />
                        No pending approvals
                      </p>
                    ) : (
                      data.pendingApprovals.map((approval) => (
                        <div key={approval.id} className="p-3 border border-orange-200 bg-orange-50 rounded-lg">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <p className="font-medium text-sm text-orange-900">{approval.type}</p>
                              <p className="text-xs text-orange-700 mt-1">{approval.itemName}</p>
                              {approval.reason && (
                                <p className="text-xs text-orange-600 mt-1 italic">{approval.reason}</p>
                              )}
                            </div>
                            <span className="inline-block px-2 py-1 text-xs rounded-full bg-orange-200 text-orange-800">
                              Pending
                            </span>
                          </div>
                          <p className="text-xs text-orange-600 mt-2">
                            Requested {new Date(approval.requestedAt).toLocaleDateString()}
                          </p>
                        </div>
                      ))
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}

export default function WorkerDashboard() {
  return (
    <ProtectedRoute allowedRoles={[UserRole.SHOP_WORKER]}>
      <WorkerDashboardContent />
    </ProtectedRoute>
  )
}

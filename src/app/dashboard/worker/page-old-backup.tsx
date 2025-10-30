'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/use-auth'
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
  DollarSign
} from 'lucide-react'

export default function WorkerDashboard() {
  const router = useRouter()
  const { logout } = useAuth()
  const [pendingRequests, setPendingRequests] = useState(3)
  const [sidebarOpen, setSidebarOpen] = useState(false)

  const handleLogout = async () => {
    try {
      await logout()
    } catch (error) {
      console.error('Logout error:', error)
      // Fallback to manual redirect if logout fails
      router.push('/login')
    }
  }

  // Mock data for worker
  const workerData = {
    workerName: 'Ahmad Ali',
    workerID: 'EMP-001',
    shopName: 'Mobile Plaza Karachi',
    shopLocation: 'Saddar, Karachi',
    todaySales: 45000,
    todayTransactions: 18,
    shiftStart: '9:00 AM',
    shiftEnd: '6:00 PM',
    currentTime: new Date().toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit' 
    }),
    salesTarget: 60000,
    salesProgress: 75,
    commission: 1350, // 3% commission on today's sales
    attendanceStreak: 45 // days
  }

  const recentTransactions = [
    { id: 'TXN001', item: 'iPhone 15 Pro', customer: 'Sara Khan', amount: 380000, time: '2:30 PM', status: 'completed' },
    { id: 'TXN002', item: 'Samsung Galaxy S24', customer: 'Hassan Ali', amount: 280000, time: '1:45 PM', status: 'completed' },
    { id: 'TXN003', item: 'Xiaomi 14 Pro', customer: 'Fatima Sheikh', amount: 120000, time: '12:15 PM', status: 'pending' },
  ]

  const pendingApprovals = [
    { id: 1, type: 'Price Update', item: 'iPhone 15 Pro Max - PKR 420,000', reason: 'Market rate change', status: 'pending' },
    { id: 2, type: 'Stock Adjustment', item: 'Samsung Galaxy S24 - Damaged unit', reason: 'Customer return damage', status: 'pending' },
    { id: 3, type: 'Customer Return', item: 'Xiaomi 14 - Full refund', reason: 'Customer not satisfied', status: 'pending' },
  ]

  const quickActions = [
    {
      name: 'New Sale',
      icon: ShoppingCart,
      description: 'Process customer transaction',
      color: 'bg-green-500',
      primary: true
    },
    {
      name: 'Check Stock',
      icon: Package,
      description: 'View product availability',
      color: 'bg-blue-500',
      primary: false
    },
    {
      name: 'Scan Product',
      icon: Scan,
      description: 'Barcode scanner',
      color: 'bg-purple-500',
      primary: false
    },
    {
      name: 'Customer Info',
      icon: Users,
      description: 'Search customer records',
      color: 'bg-orange-500',
      primary: false
    }
  ]

  const restrictedActions = [
    {
      name: 'Add Product',
      icon: Plus,
      description: 'Add new product to inventory',
      status: 'Request approval needed',
      color: 'bg-gray-400'
    },
    {
      name: 'Edit Prices',
      icon: Edit,
      description: 'Modify product pricing',
      status: 'Owner approval required',
      color: 'bg-gray-400'
    },
    {
      name: 'Delete Items',
      icon: Minus,
      description: 'Remove products from system',
      status: 'Restricted access',
      color: 'bg-gray-400'
    },
    {
      name: 'Refunds',
      icon: RotateCcw,
      description: 'Process customer refunds',
      status: 'Manager approval needed',
      color: 'bg-gray-400'
    }
  ]

  return (
    <ProtectedRoute allowedRoles={[UserRole.SHOP_WORKER]}>
      <div className="flex min-h-screen bg-gray-50 dark:bg-gray-900">
        {/* Sidebar */}
        <BusinessSidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
        
        {/* Main Content */}
        <div className={`flex-1 flex flex-col min-h-screen ${sidebarOpen ? 'lg:ml-20' : 'lg:ml-64'} transition-all duration-300`}>
          <div className="max-w-6xl mx-auto px-4 py-8 w-full">
          {/* Top Navigation */}
          <TopNavigation onMenuClick={() => setSidebarOpen(!sidebarOpen)} />
          
          <div className="flex-1 bg-gradient-to-br from-slate-50 via-green-50 to-emerald-100 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
        {/* Worker Header */}
      <header className="bg-gradient-to-r from-green-600 to-green-700 text-white shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <div className="bg-white/20 p-2 rounded-lg">
                <Smartphone className="h-6 w-6 text-white" />
              </div>
              <div className="ml-3">
                <h1 className="text-xl font-bold">{workerData.workerName}</h1>
                <p className="text-green-100 text-sm">{workerData.shopName} • ID: {workerData.workerID}</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <div className="text-right">
                <p className="text-green-100 text-xs">Current Time</p>
                <p className="font-semibold">{workerData.currentTime}</p>
              </div>
              <div className="text-right">
                <p className="text-green-100 text-xs">Shift Started</p>
                <p className="font-semibold">{workerData.shiftStart}</p>
              </div>
              <Button onClick={handleLogout} variant="outline" className="text-green-600 border-white hover:bg-white/10">
                End Shift
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          
          {/* Performance Summary */}
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Today&apos;s Performance</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card className="bg-gradient-to-br from-green-500 to-green-600 text-white">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-green-100 text-sm">Sales Made</p>
                      <p className="text-3xl font-bold">PKR {(workerData.todaySales / 1000).toFixed(1)}K</p>
                      <div className="mt-2 bg-white/20 rounded-full h-2">
                        <div 
                          className="bg-white rounded-full h-2" 
                          style={{ width: `${workerData.salesProgress}%` }}
                        ></div>
                      </div>
                      <p className="text-green-200 text-xs mt-1">
                        {workerData.salesProgress}% of target (PKR {(workerData.salesTarget / 1000).toFixed(0)}K)
                      </p>
                    </div>
                    <TrendingUp className="h-8 w-8 text-green-200" />
                  </div>
                </CardContent>
              </Card>
              
              <Card className="bg-gradient-to-br from-blue-500 to-blue-600 text-white">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-blue-100 text-sm">Transactions</p>
                      <p className="text-3xl font-bold">{workerData.todayTransactions}</p>
                      <p className="text-blue-200 text-xs flex items-center mt-1">
                        <CheckCircle className="h-3 w-3 mr-1" />
                        {workerData.todayTransactions - 1} completed, 1 pending
                      </p>
                    </div>
                    <ShoppingCart className="h-8 w-8 text-blue-200" />
                  </div>
                </CardContent>
              </Card>
              
              <Card className="bg-gradient-to-br from-yellow-500 to-yellow-600 text-white">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-yellow-100 text-sm">Pending Approvals</p>
                      <p className="text-3xl font-bold">{pendingRequests}</p>
                      <p className="text-yellow-200 text-xs flex items-center mt-1">
                        <Clock className="h-3 w-3 mr-1" />
                        Awaiting owner approval
                      </p>
                    </div>
                    <AlertCircle className="h-8 w-8 text-yellow-200" />
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-purple-500 to-purple-600 text-white">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-purple-100 text-sm">Today's Commission</p>
                      <p className="text-3xl font-bold">PKR {workerData.commission}</p>
                      <p className="text-purple-200 text-xs flex items-center mt-1">
                        <TrendingUp className="h-3 w-3 mr-1" />
                        3% on sales made
                      </p>
                    </div>
                    <DollarSign className="h-8 w-8 text-purple-200" />
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="mb-8">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {quickActions.map((action, index) => (
                <Card key={index} className={`hover:shadow-lg transition-all duration-200 cursor-pointer group ${
                  action.primary ? 'ring-2 ring-green-300 bg-green-50' : ''
                }`}>
                  <CardContent className="p-6">
                    <div className="flex items-center mb-3">
                      <div className={`p-3 rounded-lg ${action.color} text-white group-hover:scale-110 transition-transform`}>
                        <action.icon className="h-6 w-6" />
                      </div>
                      <div className="ml-3">
                        <p className="font-semibold text-gray-900">{action.name}</p>
                      </div>
                    </div>
                    <p className="text-sm text-gray-600 mb-3">{action.description}</p>
                    <Button className={`w-full ${action.primary ? '' : 'variant-outline'}`}>
                      {action.primary ? 'Start Now' : 'Open'}
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          {/* Recent Transactions & Restricted Actions */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            
            {/* Recent Transactions */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <FileText className="h-5 w-5 mr-2 text-blue-600" />
                  Recent Transactions
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {recentTransactions.map((transaction) => (
                    <div key={transaction.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center">
                        <div className={`p-2 rounded-full mr-3 ${
                          transaction.status === 'completed' ? 'bg-green-100' : 'bg-yellow-100'
                        }`}>
                          {transaction.status === 'completed' ? (
                            <CheckCircle className="h-4 w-4 text-green-600" />
                          ) : (
                            <Clock className="h-4 w-4 text-yellow-600" />
                          )}
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">{transaction.item}</p>
                          <p className="text-sm text-gray-500">{transaction.customer} • {transaction.time}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold text-gray-900">PKR {(transaction.amount / 1000).toFixed(0)}K</p>
                        <span className={`inline-flex px-2 py-1 text-xs rounded-full ${
                          transaction.status === 'completed' 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-yellow-100 text-yellow-800'
                        }`}>
                          {transaction.status}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
                <Button variant="outline" className="w-full mt-4">
                  <Eye className="h-4 w-4 mr-2" />
                  View All Transactions
                </Button>
              </CardContent>
            </Card>

            {/* Restricted Actions */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <AlertCircle className="h-5 w-5 mr-2 text-orange-600" />
                  Restricted Actions
                </CardTitle>
                <CardDescription>
                  These actions require owner approval
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {restrictedActions.map((action, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg opacity-75">
                      <div className="flex items-center">
                        <div className={`p-2 rounded-lg ${action.color} text-white`}>
                          <action.icon className="h-4 w-4" />
                        </div>
                        <div className="ml-3">
                          <p className="font-medium text-gray-700">{action.name}</p>
                          <p className="text-xs text-gray-500">{action.description}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-orange-600 font-medium">{action.status}</p>
                      </div>
                    </div>
                  ))}
                </div>
                <Button variant="outline" className="w-full mt-4" disabled>
                  Request Access
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Pending Approvals */}
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center">
                  <Clock className="h-5 w-5 mr-2 text-yellow-600" />
                  My Pending Approval Requests
                </div>
                <span className="bg-yellow-100 text-yellow-800 text-xs px-2 py-1 rounded-full">
                  {pendingApprovals.length} pending
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {pendingApprovals.map((approval) => (
                  <div key={approval.id} className="flex items-start justify-between p-4 rounded-lg border border-yellow-200 bg-yellow-50">
                    <div className="flex-1">
                      <div className="flex items-center mb-2">
                        <Clock className="h-4 w-4 text-yellow-600 mr-2" />
                        <span className="text-sm font-medium text-yellow-800">{approval.type}</span>
                      </div>
                      <p className="text-gray-900 font-medium">{approval.item}</p>
                      <p className="text-sm text-gray-600 mt-1">Reason: {approval.reason}</p>
                    </div>
                    <div className="ml-4">
                      <span className="inline-flex px-3 py-1 text-xs font-medium rounded-full bg-yellow-100 text-yellow-800">
                        {approval.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Development Notice */}
          <div className="p-4 bg-green-50 rounded-lg border border-green-200">
            <p className="text-green-800 text-sm">
              <strong>Worker Development Status:</strong> This dashboard provides essential tools for daily operations while maintaining proper approval workflows. 
              Advanced POS features, inventory management, and customer service tools are being developed with owner oversight controls.
            </p>
          </div>
        </div>
      </main>
          </div>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  )
}

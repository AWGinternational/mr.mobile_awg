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
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { BusinessSidebar } from '@/components/layout/BusinessSidebar'
import { TopNavigation } from '@/components/layout/TopNavigation'
import {
  CreditCard,
  ArrowLeft,
  LogOut,
  Search,
  Banknote,
  Smartphone,
  Building2,
  CheckCircle,
  Clock,
  XCircle,
  Loader2,
  Eye
} from 'lucide-react'
import { formatUserRole } from '@/utils/user-formatting'

interface Payment {
  id: string
  amount: number
  method: string
  status: string
  transactionId?: string
  reference?: string
  notes?: string
  paymentDate: string
  type: 'SALE' | 'LOAN'
  sale?: {
    id: string
    invoiceNumber: string
    customer?: {
      id: string
      name: string
      phone: string
    }
    totalAmount: number
    saleDate: string
  }
  loan?: {
    id: string
    loanNumber: string
    customer: {
      id: string
      name: string
      phone: string
    }
    totalAmount: number
    installmentNo: number
  }
}

export default function PaymentProcessingPage() {
  const router = useRouter()
  const { user: currentUser, logout } = useAuth()
  const { success, error: showError } = useNotify()
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('ALL')
  const [methodFilter, setMethodFilter] = useState('ALL')
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [payments, setPayments] = useState<Payment[]>([])
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState({
    totalAmount: 0,
    totalPayments: 0,
    salePayments: 0,
    loanPayments: 0,
    saleAmount: 0,
    loanAmount: 0,
    methodBreakdown: [] as any[],
    statusBreakdown: [] as any[]
  })

  useEffect(() => {
    fetchPayments()
  }, [statusFilter, methodFilter])

  const fetchPayments = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams()
      if (statusFilter && statusFilter !== 'ALL') params.append('status', statusFilter)
      if (methodFilter && methodFilter !== 'ALL') params.append('method', methodFilter)
      
      const response = await fetch(`/api/payments?${params}`)
      const data = await response.json()
      
      if (data.success) {
        setPayments(data.data.payments)
        setStats(data.data.stats)
      } else {
        showError(data.error || 'Failed to fetch payments')
      }
    } catch (error) {
      console.error('Fetch payments error:', error)
      showError('Failed to fetch payments')
    } finally {
      setLoading(false)
    }
  }

  const handleLogout = async () => {
    try {
      await logout()
      router.push('/login')
    } catch (error) {
      console.error('Logout error:', error)
    }
  }

  const handleBack = () => {
    if (currentUser?.role === UserRole.SUPER_ADMIN) router.push('/dashboard/admin')
    else if (currentUser?.role === UserRole.SHOP_OWNER) router.push('/dashboard/owner')
    else router.push('/dashboard/worker')
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-PK', { style: 'currency', currency: 'PKR', minimumFractionDigits: 0 }).format(amount)
  }

  const getCashTotal = () => {
    const cashBreakdown = stats.methodBreakdown.find((m: any) => m.method === 'CASH')
    return cashBreakdown?._sum?.amount || 0
  }

  const getDigitalTotal = () => {
    return stats.methodBreakdown
      .filter((m: any) => m.method !== 'CASH')
      .reduce((sum: number, m: any) => sum + (m._sum?.amount || 0), 0)
  }

  const getPendingCount = () => {
    const pendingBreakdown = stats.statusBreakdown.find((s: any) => s.status === 'PENDING')
    return pendingBreakdown?._count?.id || 0
  }

  const getPaymentIcon = (method: string) => {
    switch (method) {
      case 'CASH': return <Banknote className="h-5 w-5 text-green-600" />
      case 'CARD': return <CreditCard className="h-5 w-5 text-blue-600" />
      case 'EASYPAISA': return <Smartphone className="h-5 w-5 text-purple-600" />
      case 'JAZZCASH': return <Smartphone className="h-5 w-5 text-orange-600" />
      case 'BANK_TRANSFER': return <Building2 className="h-5 w-5 text-indigo-600" />
      case 'INSTALLMENT': return <CreditCard className="h-5 w-5 text-pink-600" />
      case 'LOAN_PAYMENT': return <CreditCard className="h-5 w-5 text-yellow-600" />
      default: return <CreditCard className="h-5 w-5" />
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'COMPLETED': return { color: 'bg-green-100 text-green-800', icon: <CheckCircle className="h-4 w-4" /> }
      case 'PENDING': return { color: 'bg-yellow-100 text-yellow-800', icon: <Clock className="h-4 w-4" /> }
      case 'FAILED': return { color: 'bg-red-100 text-red-800', icon: <XCircle className="h-4 w-4" /> }
      case 'REFUNDED': return { color: 'bg-orange-100 text-orange-800', icon: <XCircle className="h-4 w-4" /> }
      default: return { color: 'bg-gray-100 text-gray-800', icon: <Clock className="h-4 w-4" /> }
    }
  }

  return (
    <ProtectedRoute allowedRoles={[UserRole.SUPER_ADMIN, UserRole.SHOP_OWNER, UserRole.SHOP_WORKER]}>
      <div className="flex min-h-screen">
        <BusinessSidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
        <div className={`flex-1 min-h-screen bg-gradient-to-br from-slate-50 via-indigo-50 to-purple-100 dark:from-gray-900 dark:via-gray-900 dark:to-gray-900 ${sidebarOpen ? 'lg:ml-20' : 'lg:ml-64'} transition-all duration-300`}>
          <TopNavigation onMenuClick={() => setSidebarOpen(!sidebarOpen)} />
        <div className="bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-700 text-white">
          <div className="px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-3 sm:gap-4">
                <button onClick={handleBack} className="p-2 sm:p-3 bg-white/10 hover:bg-white/20 rounded-xl transition-all duration-200 flex-shrink-0">
                  <ArrowLeft className="h-5 w-5 text-white" />
                </button>
                <div className="min-w-0">
                  <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold mb-1 sm:mb-2 flex items-center gap-2 flex-wrap"><span>💳</span><span>Payment Processing</span></h1>
                  <p className="text-indigo-100 text-sm sm:text-base lg:text-lg">Track payments and transactions</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="px-4 sm:px-6 lg:px-8 py-4 sm:py-6 lg:py-8 space-y-4 sm:space-y-6 lg:space-y-8 overflow-x-hidden">
          {/* Filters */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
            <div className="relative sm:col-span-2 lg:col-span-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400 dark:text-gray-500" />
              <Input
                type="text"
                placeholder="Search payments..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 w-full"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All Status</SelectItem>
                <SelectItem value="COMPLETED">Completed</SelectItem>
                <SelectItem value="PENDING">Pending</SelectItem>
                <SelectItem value="FAILED">Failed</SelectItem>
                <SelectItem value="REFUNDED">Refunded</SelectItem>
              </SelectContent>
            </Select>
            <Select value={methodFilter} onValueChange={setMethodFilter}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Filter by method" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All Methods</SelectItem>
                <SelectItem value="CASH">Cash</SelectItem>
                <SelectItem value="CARD">Card</SelectItem>
                <SelectItem value="EASYPAISA">EasyPaisa</SelectItem>
                <SelectItem value="JAZZCASH">JazzCash</SelectItem>
                <SelectItem value="BANK_TRANSFER">Bank Transfer</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Statistics */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4 lg:gap-6">
            <Card className="bg-gradient-to-br from-purple-500 to-purple-600 text-white col-span-2 sm:col-span-1">
              <CardContent className="p-4 sm:p-6">
                <CreditCard className="h-6 w-6 sm:h-8 sm:w-8 mb-2 text-purple-100" />
                <p className="text-purple-100 text-xs sm:text-sm">Total Amount</p>
                <p className="text-lg sm:text-xl lg:text-2xl font-bold truncate">{formatCurrency(stats.totalAmount || 0)}</p>
              </CardContent>
            </Card>
            <Card className="bg-gradient-to-br from-indigo-500 to-indigo-600 text-white">
              <CardContent className="p-4 sm:p-6">
                <CreditCard className="h-6 w-6 sm:h-8 sm:w-8 mb-2 text-indigo-100" />
                <p className="text-indigo-100 text-xs sm:text-sm">Sale Payments</p>
                <p className="text-lg sm:text-xl lg:text-2xl font-bold truncate">{formatCurrency(stats.saleAmount || 0)}</p>
                <p className="text-xs text-indigo-100 mt-1">{stats.salePayments || 0} transactions</p>
              </CardContent>
            </Card>
            <Card className="bg-gradient-to-br from-yellow-500 to-yellow-600 text-white">
              <CardContent className="p-4 sm:p-6">
                <CreditCard className="h-6 w-6 sm:h-8 sm:w-8 mb-2 text-yellow-100" />
                <p className="text-yellow-100 text-xs sm:text-sm">Loan Payments</p>
                <p className="text-lg sm:text-xl lg:text-2xl font-bold truncate">{formatCurrency(stats.loanAmount || 0)}</p>
                <p className="text-xs text-yellow-100 mt-1">{stats.loanPayments || 0} installments</p>
              </CardContent>
            </Card>
            <Card className="bg-gradient-to-br from-green-500 to-green-600 text-white">
              <CardContent className="p-4 sm:p-6">
                <Banknote className="h-6 w-6 sm:h-8 sm:w-8 mb-2 text-green-100" />
                <p className="text-green-100 text-xs sm:text-sm">Cash Payments</p>
                <p className="text-lg sm:text-xl lg:text-2xl font-bold truncate">{formatCurrency(getCashTotal())}</p>
              </CardContent>
            </Card>
            <Card className="bg-gradient-to-br from-red-500 to-red-600 text-white">
              <CardContent className="p-4 sm:p-6">
                <Clock className="h-6 w-6 sm:h-8 sm:w-8 mb-2 text-red-100" />
                <p className="text-red-100 text-xs sm:text-sm">Pending</p>
                <p className="text-2xl sm:text-3xl font-bold">{getPendingCount()}</p>
              </CardContent>
            </Card>
          </div>

          {/* Payments List */}
          <Card>
            <CardContent className="p-6">
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">Recent Payments</h3>
              
              {loading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-gray-400 dark:text-gray-500" />
                  <span className="ml-2 text-gray-500 dark:text-gray-400">Loading payments...</span>
                </div>
              ) : payments.length === 0 ? (
                <div className="text-center py-12">
                  <CreditCard className="h-16 w-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
                  <p className="text-gray-500 dark:text-gray-400">No payments found</p>
                  <p className="text-sm text-gray-400 dark:text-gray-500 mt-2">Payments are automatically created when sales are completed</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {payments.map((payment) => {
                    const badge = getStatusBadge(payment.status)
                    const isLoanPayment = payment.type === 'LOAN'
                    const customerName = isLoanPayment 
                      ? payment.loan?.customer.name || 'Customer'
                      : payment.sale?.customer?.name || 'Walk-in Customer'
                    const paymentTime = new Date(payment.paymentDate).toLocaleTimeString('en-US', { 
                      hour: '2-digit', 
                      minute: '2-digit' 
                    })
                    
                    return (
                      <div key={payment.id} className={`border rounded-lg p-3 sm:p-4 hover:shadow-md transition-shadow ${isLoanPayment ? 'border-yellow-200 bg-yellow-50 dark:border-yellow-700 dark:bg-yellow-900/20' : 'border-gray-200 dark:border-gray-700'}`}>
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
                          <div className="flex items-center gap-3 sm:gap-4 flex-1 min-w-0">
                            <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-full flex items-center justify-center flex-shrink-0 ${isLoanPayment ? 'bg-yellow-100 dark:bg-yellow-900/30' : 'bg-indigo-100 dark:bg-indigo-900/30'}`}>
                              {getPaymentIcon(payment.method)}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 flex-wrap">
                                <h4 className="font-semibold text-gray-900 dark:text-white text-sm sm:text-base truncate">{customerName}</h4>
                                {isLoanPayment && (
                                  <Badge className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300 text-xs flex-shrink-0">Loan</Badge>
                                )}
                              </div>
                              <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 truncate">
                                {isLoanPayment 
                                  ? `Loan: ${payment.loan?.loanNumber} - #${payment.loan?.installmentNo}`
                                  : `Invoice: ${payment.sale?.invoiceNumber}`
                                }
                              </p>
                              <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                                {isLoanPayment ? 'Loan' : payment.method} • {paymentTime}
                                {payment.transactionId && ` • ${payment.transactionId}`}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center justify-between sm:flex-col sm:items-end gap-2 sm:gap-1 pl-13 sm:pl-0">
                            <p className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white">{formatCurrency(Number(payment.amount))}</p>
                            <div className="flex items-center gap-2 sm:flex-col sm:items-end">
                              <Badge className={`${badge.color} text-xs`}>
                                <span className="flex items-center gap-1">
                                  {badge.icon}
                                  <span className="hidden sm:inline">{payment.status}</span>
                                </span>
                              </Badge>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => isLoanPayment 
                                  ? router.push(`/loans?loan=${payment.loan?.loanNumber}`)
                                  : router.push(`/sales?invoice=${payment.sale?.invoiceNumber}`)
                                }
                                className="text-xs h-7 px-2"
                              >
                                <Eye className="h-3 w-3 sm:mr-1" />
                                <span className="hidden sm:inline">{isLoanPayment ? 'View Loan' : 'View Sale'}</span>
                              </Button>
                            </div>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
        </div>
      </div>
    </ProtectedRoute>
  )
}


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
import { Label } from '@/components/ui/label'
import { BusinessSidebar } from '@/components/layout/BusinessSidebar'
import { TopNavigation } from '@/components/layout/TopNavigation'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import {
  CreditCard,
  ArrowLeft,
  LogOut,
  Search,
  Plus,
  Calendar,
  DollarSign,
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  Clock,
  X,
  Loader2,
  Eye,
  Receipt,
  Edit,
  Trash2
} from 'lucide-react'
import { formatUserRole } from '@/utils/user-formatting'

interface Customer {
  id: string
  name: string
  phone: string
  email?: string
  cnic?: string
}

interface Installment {
  id: string
  installmentNo: number
  amount: number
  dueDate: string
  paidDate?: string
  paidAmount?: number
  status: string
}

interface Loan {
  id: string
  loanNumber: string
  customerId: string
  customer: Customer
  principalAmount: number
  interestRate: number
  totalAmount: number
  paidAmount: number
  remainingAmount: number
  installmentAmount: number
  totalInstallments: number
  paidInstallments: number
  status: string
  startDate: string
  endDate: string
  nextDueDate?: string
  installments?: Installment[]
}

export default function LoanManagementPage() {
  const router = useRouter()
  const { user: currentUser, logout } = useAuth()
  const { success, error: showError } = useNotify()
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('ALL')
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [showEditDialog, setShowEditDialog] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [showInstallmentDialog, setShowInstallmentDialog] = useState(false)
  const [showDetailsDialog, setShowDetailsDialog] = useState(false)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [loans, setLoans] = useState<Loan[]>([])
  const [customers, setCustomers] = useState<Customer[]>([])
  const [selectedLoan, setSelectedLoan] = useState<Loan | null>(null)
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState(false)
  const [currentShopId, setCurrentShopId] = useState<string | null>(null)
  const [stats, setStats] = useState({
    totalLoans: 0,
    totalAmount: 0,
    totalPaid: 0,
    totalRemaining: 0,
    overdueCount: 0
  })
  const [loanForm, setLoanForm] = useState({
    customerId: '',
    loanNumber: '',
    principalAmount: '',
    interestRate: '0',
    totalInstallments: '6',
    startDate: new Date().toISOString().split('T')[0]
  })
  const [installmentForm, setInstallmentForm] = useState({
    installmentId: '',
    paidAmount: '',
    paymentDate: new Date().toISOString().split('T')[0]
  })

  // Fetch user's shop first
  useEffect(() => {
    const fetchUserShop = async () => {
      if (!currentUser) return
      
      try {
        if (currentUser.role === UserRole.SHOP_OWNER) {
          const response = await fetch(`/api/shops?ownerId=${currentUser.id}`)
          const data = await response.json()
          if (data.shops && data.shops.length > 0) {
            setCurrentShopId(data.shops[0].id)
          }
        } else if (currentUser.role === UserRole.SHOP_WORKER) {
          const response = await fetch(`/api/users/${currentUser.id}/shops`)
          const data = await response.json()
          if (data.success && data.shops && data.shops.length > 0) {
            setCurrentShopId(data.shops[0].id)
          }
        }
      } catch (error) {
        console.error('Error fetching user shop:', error)
      }
    }
    
    fetchUserShop()
  }, [currentUser])

  // Fetch loans and customers when shopId is available
  useEffect(() => {
    if (currentShopId) {
      fetchLoans()
      fetchCustomers()
    }
  }, [currentShopId, statusFilter, searchTerm])

  const fetchLoans = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams()
      if (statusFilter && statusFilter !== 'ALL') params.append('status', statusFilter)
      if (searchTerm) params.append('search', searchTerm)
      params.append('_t', Date.now().toString()) // Cache-busting
      
      const response = await fetch(`/api/loans?${params}`, {
        cache: 'no-store',
        headers: {
          'Cache-Control': 'no-cache'
        }
      })
      const data = await response.json()
      
      if (data.success) {
        setLoans(data.data.loans)
        setStats(data.data.stats)
      } else {
        showError(data.error || 'Failed to fetch loans')
      }
    } catch (error) {
      console.error('Fetch loans error:', error)
      showError('Failed to fetch loans')
    } finally {
      setLoading(false)
    }
  }

  const fetchCustomers = async () => {
    if (!currentShopId) {
      console.log('No shopId available yet')
      return
    }
    
    try {
      const params = new URLSearchParams()
      params.append('shopId', currentShopId)
      params.append('_t', Date.now().toString()) // Cache-busting
      
      const response = await fetch(`/api/customers?${params}`, {
        cache: 'no-store',
        headers: {
          'Cache-Control': 'no-cache'
        }
      })
      const data = await response.json()
      
      if (response.ok && data.customers) {
        setCustomers(data.customers || [])
      } else {
        console.error('Failed to fetch customers:', data.error)
      }
    } catch (error) {
      console.error('Fetch customers error:', error)
    }
  }

  const handleCreateLoan = async () => {
    try {
      setActionLoading(true)
      const response = await fetch('/api/loans', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(loanForm)
      })
      
      const data = await response.json()
      
      if (data.success) {
        success('Loan created successfully')
        setShowCreateDialog(false)
        resetLoanForm()
        fetchLoans()
      } else {
        showError(data.error || 'Failed to create loan')
      }
    } catch (error) {
      console.error('Create loan error:', error)
      showError('Failed to create loan')
    } finally {
      setActionLoading(false)
    }
  }

  const handleRecordPayment = async () => {
    if (!selectedLoan) return
    
    try {
      setActionLoading(true)
      const response = await fetch(`/api/loans/${selectedLoan.id}/installments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(installmentForm)
      })
      
      const data = await response.json()
      
      if (data.success) {
        success('Payment recorded successfully')
        setShowInstallmentDialog(false)
        setSelectedLoan(null)
        resetInstallmentForm()
        fetchLoans()
      } else {
        showError(data.error || 'Failed to record payment')
      }
    } catch (error) {
      console.error('Record payment error:', error)
      showError('Failed to record payment')
    } finally {
      setActionLoading(false)
    }
  }

  const handleEditLoan = (loan: Loan) => {
    setSelectedLoan(loan)
    setLoanForm({
      customerId: loan.customerId,
      loanNumber: loan.loanNumber,
      principalAmount: loan.principalAmount.toString(),
      interestRate: loan.interestRate.toString(),
      totalInstallments: loan.totalInstallments.toString(),
      startDate: new Date(loan.startDate).toISOString().split('T')[0]
    })
    setShowEditDialog(true)
  }

  const handleUpdateLoan = async () => {
    if (!selectedLoan) return
    
    try {
      setActionLoading(true)
      const response = await fetch(`/api/loans/${selectedLoan.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: loanForm.customerId // We can extend this to update status
        })
      })
      
      const data = await response.json()
      
      if (data.success) {
        success('Loan updated successfully')
        setShowEditDialog(false)
        setSelectedLoan(null)
        resetLoanForm()
        fetchLoans()
      } else {
        showError(data.error || 'Failed to update loan')
      }
    } catch (error) {
      console.error('Update loan error:', error)
      showError('Failed to update loan')
    } finally {
      setActionLoading(false)
    }
  }

  const handleDeleteLoan = (loan: Loan) => {
    setSelectedLoan(loan)
    setShowDeleteDialog(true)
  }

  const handleDeleteConfirm = async () => {
    if (!selectedLoan) return
    
    try {
      setActionLoading(true)
      const response = await fetch(`/api/loans/${selectedLoan.id}`, {
        method: 'DELETE'
      })
      
      const data = await response.json()
      
      if (data.success) {
        success('Loan deleted successfully')
        setShowDeleteDialog(false)
        setSelectedLoan(null)
        fetchLoans()
      } else {
        showError(data.error || 'Failed to delete loan')
      }
    } catch (error) {
      console.error('Delete loan error:', error)
      showError('Failed to delete loan')
    } finally {
      setActionLoading(false)
    }
  }

  const openPaymentDialog = async (loan: Loan) => {
    setSelectedLoan(loan)
    
    // If installments not loaded, fetch them
    if (!loan.installments || loan.installments.length === 0) {
      try {
        const response = await fetch(`/api/loans/${loan.id}/installments`)
        const data = await response.json()
        
        if (data.success) {
          setSelectedLoan({
            ...loan,
            installments: data.data.installments
          })
        }
      } catch (error) {
        console.error('Fetch installments error:', error)
      }
    }
    
    setShowInstallmentDialog(true)
  }

  const resetLoanForm = () => {
    setLoanForm({
      customerId: '',
      loanNumber: '',
      principalAmount: '',
      interestRate: '0',
      totalInstallments: '6',
      startDate: new Date().toISOString().split('T')[0]
    })
  }

  const resetInstallmentForm = () => {
    setInstallmentForm({
      installmentId: '',
      paidAmount: '',
      paymentDate: new Date().toISOString().split('T')[0]
    })
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

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'ACTIVE': return { color: 'bg-green-100 text-green-800', icon: <CheckCircle className="h-4 w-4" /> }
      case 'COMPLETED': return { color: 'bg-blue-100 text-blue-800', icon: <CheckCircle className="h-4 w-4" /> }
      case 'DEFAULTED': return { color: 'bg-red-100 text-red-800', icon: <AlertTriangle className="h-4 w-4" /> }
      case 'SUSPENDED': return { color: 'bg-orange-100 text-orange-800', icon: <AlertTriangle className="h-4 w-4" /> }
      default: return { color: 'bg-gray-100 text-gray-800', icon: <Clock className="h-4 w-4" /> }
    }
  }

  return (
    <ProtectedRoute allowedRoles={[UserRole.SUPER_ADMIN, UserRole.SHOP_OWNER, UserRole.SHOP_WORKER]}>
      <div className="flex min-h-screen">
        <BusinessSidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
        <div className={`flex-1 min-h-screen bg-gradient-to-br from-slate-50 via-yellow-50 to-amber-100 dark:from-gray-900 dark:via-gray-900 dark:to-gray-900 ${sidebarOpen ? 'lg:ml-20' : 'lg:ml-64'} transition-all duration-300`}>
          <TopNavigation onMenuClick={() => setSidebarOpen(!sidebarOpen)} />
        <div className="bg-gradient-to-r from-yellow-600 via-amber-600 to-orange-700 text-white">
          <div className="px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
            <div className="flex flex-col gap-4 sm:gap-0 sm:flex-row sm:justify-between sm:items-center">
              <div className="flex items-center gap-3 sm:gap-4">
                <button onClick={handleBack} className="p-2 sm:p-3 bg-white/10 hover:bg-white/20 rounded-xl transition-all duration-200 flex-shrink-0">
                  <ArrowLeft className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
                </button>
                <div className="min-w-0">
                  <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold mb-1 sm:mb-2 truncate">💳 Loan Management</h1>
                  <p className="text-yellow-100 text-sm sm:text-base lg:text-lg truncate">Customer installment plans and credit tracking</p>
                </div>
              </div>
              <div className="flex items-center gap-3 sm:gap-4">
                <button onClick={() => setShowCreateDialog(true)} className="flex items-center gap-2 px-4 sm:px-6 py-2.5 sm:py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-semibold shadow-lg transition-all duration-200 text-sm sm:text-base">
                  <Plus className="h-4 w-4 sm:h-5 sm:w-5 flex-shrink-0" />
                  <span className="hidden sm:inline">New Loan</span>
                  <span className="sm:hidden">New</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="px-4 sm:px-6 lg:px-8 py-4 sm:py-6 lg:py-8 space-y-6 sm:space-y-8">
          {/* Filters */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 sm:h-5 sm:w-5 text-gray-400 dark:text-gray-500" />
              <Input
                type="text"
                placeholder="Search by customer name, phone, or loan number..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9 sm:pl-10 h-10 sm:h-11 text-sm sm:text-base"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="h-10 sm:h-11 text-sm sm:text-base">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All Status</SelectItem>
                <SelectItem value="ACTIVE">Active</SelectItem>
                <SelectItem value="COMPLETED">Completed</SelectItem>
                <SelectItem value="DEFAULTED">Defaulted</SelectItem>
                <SelectItem value="SUSPENDED">Suspended</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Statistics */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4">
            <Card className="bg-gradient-to-br from-yellow-500 to-yellow-600 text-white">
              <CardContent className="p-4 sm:p-6">
                <CreditCard className="h-6 w-6 sm:h-8 sm:w-8 mb-2 text-yellow-100" />
                <p className="text-yellow-100 text-xs sm:text-sm">Total Loans</p>
                <p className="text-2xl sm:text-3xl font-bold">{stats.totalLoans || 0}</p>
              </CardContent>
            </Card>
            <Card className="bg-gradient-to-br from-blue-500 to-blue-600 text-white">
              <CardContent className="p-4 sm:p-6">
                <DollarSign className="h-6 w-6 sm:h-8 sm:w-8 mb-2 text-blue-100" />
                <p className="text-blue-100 text-xs sm:text-sm">Total Lent</p>
                <p className="text-lg sm:text-xl font-bold truncate">{formatCurrency(Number(stats.totalAmount) || 0)}</p>
              </CardContent>
            </Card>
            <Card className="bg-gradient-to-br from-green-500 to-green-600 text-white">
              <CardContent className="p-4 sm:p-6">
                <TrendingUp className="h-6 w-6 sm:h-8 sm:w-8 mb-2 text-green-100" />
                <p className="text-green-100 text-xs sm:text-sm">Collected</p>
                <p className="text-lg sm:text-xl font-bold truncate">{formatCurrency(Number(stats.totalPaid) || 0)}</p>
              </CardContent>
            </Card>
            <Card className="bg-gradient-to-br from-orange-500 to-orange-600 text-white">
              <CardContent className="p-4 sm:p-6">
                <AlertTriangle className="h-6 w-6 sm:h-8 sm:w-8 mb-2 text-orange-100" />
                <p className="text-orange-100 text-xs sm:text-sm">Outstanding</p>
                <p className="text-lg sm:text-xl font-bold truncate">{formatCurrency(Number(stats.totalRemaining) || 0)}</p>
              </CardContent>
            </Card>
            <Card className="bg-gradient-to-br from-red-500 to-red-600 text-white">
              <CardContent className="p-4 sm:p-6">
                <AlertTriangle className="h-6 w-6 sm:h-8 sm:w-8 mb-2 text-red-100" />
                <p className="text-red-100 text-xs sm:text-sm">Overdue</p>
                <p className="text-2xl sm:text-3xl font-bold">{stats.overdueCount || 0}</p>
              </CardContent>
            </Card>
          </div>

          {/* Loans List */}
          <Card>
            <CardContent className="p-4 sm:p-6">
              <h3 className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-white mb-4 sm:mb-6">Loan Portfolio</h3>
              
              {loading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="h-6 w-6 sm:h-8 sm:w-8 animate-spin text-gray-400 dark:text-gray-500" />
                  <span className="ml-2 text-sm sm:text-base text-gray-500 dark:text-gray-400">Loading loans...</span>
                </div>
              ) : loans.length === 0 ? (
                <div className="text-center py-12">
                  <CreditCard className="h-12 w-12 sm:h-16 sm:w-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
                  <p className="text-sm sm:text-base text-gray-500 dark:text-gray-400">No loans found</p>
                  <Button onClick={() => setShowCreateDialog(true)} className="mt-4" size="sm">
                    <Plus className="h-4 w-4 mr-2" />
                    Create First Loan
                  </Button>
                </div>
              ) : (
                <div className="space-y-3">
                  {loans.map((loan) => {
                    const badge = getStatusBadge(loan.status)
                    const progress = (loan.paidInstallments / loan.totalInstallments) * 100
                    const isOverdue = loan.nextDueDate && new Date(loan.nextDueDate) < new Date()
                    
                    return (
                      <div key={loan.id} className={`border rounded-lg p-3 sm:p-4 hover:shadow-md transition-shadow ${isOverdue ? 'border-red-300 bg-red-50/50 dark:border-red-700 dark:bg-red-900/20' : 'border-gray-200 dark:border-gray-700'}`}>
                        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2 sm:gap-0 mb-3">
                          <div className="flex-1 min-w-0">
                            <div className="flex flex-wrap items-center gap-2 mb-1">
                              <h4 className="font-semibold text-gray-900 dark:text-white truncate">{loan.customer.name}</h4>
                              <Badge className={badge.color}>
                                <span className="flex items-center gap-1 text-xs">{badge.icon} {loan.status}</span>
                              </Badge>
                              {isOverdue && (
                                <Badge className="bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300 text-xs">
                                  <AlertTriangle className="h-3 w-3 mr-1" />
                                  Overdue
                                </Badge>
                              )}
                            </div>
                            <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">Loan #{loan.loanNumber}</p>
                            <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">{loan.customer.phone}</p>
                          </div>
                          <div className="text-left sm:text-right">
                            <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">Total Amount</p>
                            <p className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white">{formatCurrency(Number(loan.totalAmount))}</p>
                          </div>
                        </div>
                        
                        <div className="grid grid-cols-3 gap-2 sm:gap-4 mb-3">
                          <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-2 sm:p-3">
                            <p className="text-xs text-blue-700 dark:text-blue-400">Principal</p>
                            <p className="text-xs sm:text-sm font-bold text-blue-900 dark:text-blue-300 truncate">{formatCurrency(Number(loan.principalAmount))}</p>
                          </div>
                          <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-2 sm:p-3">
                            <p className="text-xs text-green-700 dark:text-green-400">Monthly</p>
                            <p className="text-xs sm:text-sm font-bold text-green-900 dark:text-green-300 truncate">{formatCurrency(Number(loan.installmentAmount))}</p>
                          </div>
                          <div className="bg-orange-50 dark:bg-orange-900/20 rounded-lg p-2 sm:p-3">
                            <p className="text-xs text-orange-700 dark:text-orange-400">Remaining</p>
                            <p className="text-xs sm:text-sm font-bold text-orange-900 dark:text-orange-300 truncate">{formatCurrency(Number(loan.remainingAmount))}</p>
                          </div>
                        </div>

                        <div className="mb-2">
                          <div className="flex justify-between text-xs sm:text-sm text-gray-600 dark:text-gray-400 mb-1">
                            <span>Payment Progress</span>
                            <span>{loan.paidInstallments}/{loan.totalInstallments} installments</span>
                          </div>
                          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                            <div
                              className="bg-gradient-to-r from-green-500 to-emerald-600 h-2 rounded-full"
                              style={{ width: `${progress}%` }}
                            />
                          </div>
                        </div>

                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-0 mt-3">
                          <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">
                            {loan.nextDueDate ? (
                              <>Next due: <span className={`font-medium ${isOverdue ? 'text-red-600 dark:text-red-400' : 'text-gray-900 dark:text-white'}`}>
                                {new Date(loan.nextDueDate).toLocaleDateString('en-PK')}
                              </span></>
                            ) : (
                              <span className="text-green-600 dark:text-green-400 font-medium">Fully Paid</span>
                            )}
                          </p>
                          <div className="flex gap-2">
                            <Button 
                              size="sm" 
                              variant="outline"
                              onClick={() => {
                                setSelectedLoan(loan)
                                setShowDetailsDialog(true)
                              }}
                              className="text-xs sm:text-sm"
                            >
                              <Eye className="h-3 w-3 sm:h-4 sm:w-4 sm:mr-1" />
                              <span className="hidden sm:inline">Details</span>
                            </Button>
                            {loan.status === 'ACTIVE' && (
                              <>
                                <Button 
                                  size="sm" 
                                  className="bg-green-600 hover:bg-green-700 text-xs sm:text-sm"
                                  onClick={() => openPaymentDialog(loan)}
                                >
                                  <Receipt className="h-3 w-3 sm:h-4 sm:w-4 sm:mr-1" />
                                  <span className="hidden sm:inline">Record Payment</span>
                                  <span className="sm:hidden">Pay</span>
                                </Button>
                                <Button 
                                  size="sm" 
                                  variant="outline"
                                  onClick={() => handleEditLoan(loan)}
                                  className="text-xs sm:text-sm"
                                >
                                  <Edit className="h-3 w-3 sm:h-4 sm:w-4 sm:mr-1" />
                                  <span className="hidden sm:inline">Edit</span>
                                </Button>
                              </>
                            )}
                            {loan.paidAmount === 0 && (
                              <Button 
                                size="sm" 
                                variant="destructive"
                                onClick={() => handleDeleteLoan(loan)}
                                className="text-xs sm:text-sm"
                              >
                                <Trash2 className="h-3 w-3 sm:h-4 sm:w-4 sm:mr-1" />
                                <span className="hidden sm:inline">Delete</span>
                              </Button>
                            )}
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

      {/* Create Loan Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Create New Loan</DialogTitle>
            <DialogDescription>
              Create a new loan for a customer with installment plan.
            </DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <Label>Customer *</Label>
              <Select value={loanForm.customerId} onValueChange={(value) => setLoanForm({...loanForm, customerId: value})}>
                <SelectTrigger>
                  <SelectValue placeholder="Select customer" />
                </SelectTrigger>
                <SelectContent>
                  {customers.map(customer => (
                    <SelectItem key={customer.id} value={customer.id}>
                      {customer.name} - {customer.phone}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Loan Number *</Label>
              <Input
                value={loanForm.loanNumber}
                onChange={(e) => setLoanForm({...loanForm, loanNumber: e.target.value})}
                placeholder="LOAN-001"
              />
            </div>
            <div>
              <Label>Principal Amount (PKR) *</Label>
              <Input
                type="number"
                value={loanForm.principalAmount}
                onChange={(e) => setLoanForm({...loanForm, principalAmount: e.target.value})}
                placeholder="300000"
              />
            </div>
            <div>
              <Label>Interest Rate (%)</Label>
              <Input
                type="number"
                step="0.1"
                value={loanForm.interestRate}
                onChange={(e) => setLoanForm({...loanForm, interestRate: e.target.value})}
                placeholder="0"
              />
            </div>
            <div>
              <Label>Number of Installments *</Label>
              <Select value={loanForm.totalInstallments} onValueChange={(value) => setLoanForm({...loanForm, totalInstallments: value})}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="3">3 months</SelectItem>
                  <SelectItem value="6">6 months</SelectItem>
                  <SelectItem value="9">9 months</SelectItem>
                  <SelectItem value="12">12 months</SelectItem>
                  <SelectItem value="18">18 months</SelectItem>
                  <SelectItem value="24">24 months</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="col-span-2">
              <Label>Start Date</Label>
              <Input
                type="date"
                value={loanForm.startDate}
                onChange={(e) => setLoanForm({...loanForm, startDate: e.target.value})}
              />
            </div>
            {loanForm.principalAmount && loanForm.totalInstallments && (
              <div className="col-span-2 bg-blue-50 p-4 rounded-lg">
                <p className="text-sm font-medium text-blue-900 mb-2">Loan Summary:</p>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <p className="text-blue-700">Principal: <span className="font-bold">{formatCurrency(Number(loanForm.principalAmount))}</span></p>
                  <p className="text-blue-700">Interest ({loanForm.interestRate}%): <span className="font-bold">{formatCurrency(Number(loanForm.principalAmount) * Number(loanForm.interestRate) / 100)}</span></p>
                  <p className="text-blue-700">Total Amount: <span className="font-bold">{formatCurrency(Number(loanForm.principalAmount) * (1 + Number(loanForm.interestRate) / 100))}</span></p>
                  <p className="text-blue-700">Monthly: <span className="font-bold">{formatCurrency((Number(loanForm.principalAmount) * (1 + Number(loanForm.interestRate) / 100)) / Number(loanForm.totalInstallments))}</span></p>
                </div>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setShowCreateDialog(false); resetLoanForm(); }}>
              Cancel
            </Button>
            <Button onClick={handleCreateLoan} disabled={actionLoading}>
              {actionLoading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
              Create Loan
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Record Installment Payment Dialog */}
      <Dialog open={showInstallmentDialog} onOpenChange={setShowInstallmentDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Record Installment Payment</DialogTitle>
            <DialogDescription>
              Record a payment for a pending loan installment.
            </DialogDescription>
          </DialogHeader>
          
          {selectedLoan && (
            <div className="space-y-4">
              <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                <p className="text-sm text-gray-600 dark:text-gray-400">Loan Number: <span className="font-semibold text-gray-900 dark:text-white">{selectedLoan.loanNumber}</span></p>
                <p className="text-sm text-gray-600 dark:text-gray-400">Customer: <span className="font-semibold text-gray-900 dark:text-white">{selectedLoan.customer.name}</span></p>
                <p className="text-sm text-gray-600 dark:text-gray-400">Remaining: <span className="font-semibold text-gray-900 dark:text-white">{formatCurrency(Number(selectedLoan.remainingAmount))}</span></p>
              </div>

              <div>
                <Label>Select Installment *</Label>
                <Select 
                  value={installmentForm.installmentId} 
                  onValueChange={(value) => {
                    const installment = selectedLoan.installments?.find(i => i.id === value)
                    setInstallmentForm({
                      ...installmentForm, 
                      installmentId: value,
                      paidAmount: installment?.amount.toString() || ''
                    })
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select installment to pay" />
                  </SelectTrigger>
                  <SelectContent>
                    {selectedLoan.installments?.filter(i => i.status !== 'PAID').map(installment => (
                      <SelectItem key={installment.id} value={installment.id}>
                        Installment #{installment.installmentNo} - {formatCurrency(Number(installment.amount))} 
                        {' '}(Due: {new Date(installment.dueDate).toLocaleDateString('en-PK')})
                        {installment.status === 'PARTIAL' && ' - Partially Paid'}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Payment Amount (PKR) *</Label>
                <Input
                  type="number"
                  value={installmentForm.paidAmount}
                  onChange={(e) => setInstallmentForm({...installmentForm, paidAmount: e.target.value})}
                  placeholder="50000"
                />
              </div>

              <div>
                <Label>Payment Date</Label>
                <Input
                  type="date"
                  value={installmentForm.paymentDate}
                  onChange={(e) => setInstallmentForm({...installmentForm, paymentDate: e.target.value})}
                />
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => { setShowInstallmentDialog(false); setSelectedLoan(null); resetInstallmentForm(); }}>
              Cancel
            </Button>
            <Button onClick={handleRecordPayment} disabled={actionLoading}>
              {actionLoading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
              Record Payment
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Loan Details Dialog */}
      <Dialog open={showDetailsDialog} onOpenChange={setShowDetailsDialog}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Loan Details</DialogTitle>
            <DialogDescription>
              View complete loan information and payment history.
            </DialogDescription>
          </DialogHeader>
          
          {selectedLoan && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Loan Number</p>
                  <p className="font-semibold text-gray-900 dark:text-white">{selectedLoan.loanNumber}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Status</p>
                  <Badge className={getStatusBadge(selectedLoan.status).color}>
                    {selectedLoan.status}
                  </Badge>
                </div>
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Customer</p>
                  <p className="font-semibold text-gray-900 dark:text-white">{selectedLoan.customer.name}</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">{selectedLoan.customer.phone}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">CNIC</p>
                  <p className="font-semibold text-gray-900 dark:text-white">{selectedLoan.customer.cnic || 'N/A'}</p>
                </div>
              </div>

              <div className="grid grid-cols-4 gap-4 bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                <div>
                  <p className="text-xs text-gray-600 dark:text-gray-400">Principal</p>
                  <p className="font-bold text-gray-900 dark:text-white">{formatCurrency(Number(selectedLoan.principalAmount))}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-600 dark:text-gray-400">Interest Rate</p>
                  <p className="font-bold text-gray-900 dark:text-white">{selectedLoan.interestRate}%</p>
                </div>
                <div>
                  <p className="text-xs text-gray-600 dark:text-gray-400">Total Amount</p>
                  <p className="font-bold text-gray-900 dark:text-white">{formatCurrency(Number(selectedLoan.totalAmount))}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-600 dark:text-gray-400">Monthly</p>
                  <p className="font-bold text-gray-900 dark:text-white">{formatCurrency(Number(selectedLoan.installmentAmount))}</p>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="bg-green-50 p-3 rounded-lg">
                  <p className="text-xs text-green-700">Paid</p>
                  <p className="text-lg font-bold text-green-900">{formatCurrency(Number(selectedLoan.paidAmount))}</p>
                </div>
                <div className="bg-orange-50 p-3 rounded-lg">
                  <p className="text-xs text-orange-700">Remaining</p>
                  <p className="text-lg font-bold text-orange-900">{formatCurrency(Number(selectedLoan.remainingAmount))}</p>
                </div>
                <div className="bg-blue-50 p-3 rounded-lg">
                  <p className="text-xs text-blue-700">Progress</p>
                  <p className="text-lg font-bold text-blue-900">{selectedLoan.paidInstallments}/{selectedLoan.totalInstallments}</p>
                </div>
              </div>

              {selectedLoan.installments && selectedLoan.installments.length > 0 && (
                <div>
                  <h4 className="font-semibold text-gray-900 dark:text-white mb-3">Installment Schedule</h4>
                  <div className="space-y-2">
                    {selectedLoan.installments.map((installment) => (
                      <div key={installment.id} className={`flex items-center justify-between p-3 rounded-lg ${
                        installment.status === 'PAID' ? 'bg-green-50 border border-green-200 dark:bg-green-900/20 dark:border-green-700' :
                        installment.status === 'PARTIAL' ? 'bg-yellow-50 border border-yellow-200 dark:bg-yellow-900/20 dark:border-yellow-700' :
                        'bg-gray-50 border border-gray-200 dark:bg-gray-700 dark:border-gray-600'
                      }`}>
                        <div className="flex items-center gap-3">
                          {installment.status === 'PAID' ? (
                            <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400" />
                          ) : installment.status === 'PARTIAL' ? (
                            <Clock className="h-5 w-5 text-yellow-600 dark:text-yellow-400" />
                          ) : (
                            <Clock className="h-5 w-5 text-gray-400 dark:text-gray-500" />
                          )}
                          <div>
                            <p className="font-medium text-gray-900 dark:text-white">Installment #{installment.installmentNo}</p>
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                              Due: {new Date(installment.dueDate).toLocaleDateString('en-PK')}
                              {installment.paidDate && ` • Paid: ${new Date(installment.paidDate).toLocaleDateString('en-PK')}`}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-gray-900 dark:text-white">{formatCurrency(Number(installment.amount))}</p>
                          {installment.paidAmount && (
                            <p className="text-sm text-green-600 dark:text-green-400">Paid: {formatCurrency(Number(installment.paidAmount))}</p>
                          )}
                          <Badge className={
                            installment.status === 'PAID' ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300' :
                            installment.status === 'PARTIAL' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300' :
                            'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
                          }>
                            {installment.status}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => { setShowDetailsDialog(false); setSelectedLoan(null); }}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Loan Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit Loan Status</DialogTitle>
            <DialogDescription>
              Update loan status or suspend the loan.
            </DialogDescription>
          </DialogHeader>
          {selectedLoan && (
            <div className="space-y-4">
              <div className="bg-gray-50 p-4 rounded-lg">
                <p className="text-sm text-gray-600">Loan Number: <span className="font-semibold text-gray-900">{selectedLoan.loanNumber}</span></p>
                <p className="text-sm text-gray-600">Customer: <span className="font-semibold text-gray-900">{selectedLoan.customer.name}</span></p>
                <p className="text-sm text-gray-600">Total: <span className="font-semibold text-gray-900">{formatCurrency(Number(selectedLoan.totalAmount))}</span></p>
              </div>
              <div>
                <Label>Loan Status</Label>
                <Select value={loanForm.customerId} onValueChange={(value) => setLoanForm({...loanForm, customerId: value})}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ACTIVE">Active</SelectItem>
                    <SelectItem value="SUSPENDED">Suspended</SelectItem>
                    <SelectItem value="COMPLETED">Completed</SelectItem>
                    <SelectItem value="DEFAULTED">Defaulted</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-sm text-gray-500 mt-1">
                  Note: Only status can be updated. Contact support for other changes.
                </p>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => { setShowEditDialog(false); setSelectedLoan(null); resetLoanForm(); }}>
              Cancel
            </Button>
            <Button onClick={handleUpdateLoan} disabled={actionLoading}>
              {actionLoading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
              Update Status
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Loan Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Loan</DialogTitle>
            <DialogDescription>
              This action cannot be undone. Only loans with no payments can be deleted.
            </DialogDescription>
          </DialogHeader>
          {selectedLoan && (
            <div className="space-y-4">
              <div className="bg-red-50 border border-red-200 p-4 rounded-lg">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="h-5 w-5 text-red-600 mt-0.5" />
                  <div>
                    <p className="font-semibold text-red-900">Are you sure you want to delete this loan?</p>
                    <p className="text-sm text-red-700 mt-1">
                      Loan #{selectedLoan.loanNumber} for {selectedLoan.customer.name}
                    </p>
                    <p className="text-sm text-red-700">
                      Amount: {formatCurrency(Number(selectedLoan.totalAmount))}
                    </p>
                  </div>
                </div>
              </div>
              {Number(selectedLoan.paidAmount) > 0 && (
                <div className="bg-yellow-50 border border-yellow-200 p-3 rounded-lg">
                  <p className="text-sm text-yellow-800">
                    ⚠️ This loan has payments recorded and cannot be deleted. You can suspend it instead.
                  </p>
                </div>
              )}
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => { setShowDeleteDialog(false); setSelectedLoan(null); }}>
              Cancel
            </Button>
            <Button 
              variant="destructive" 
              onClick={handleDeleteConfirm} 
              disabled={actionLoading || (selectedLoan ? Number(selectedLoan.paidAmount) > 0 : true)}
            >
              {actionLoading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
              Delete Loan
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </ProtectedRoute>
  )
}


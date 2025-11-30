'use client'

import React, { useState, useEffect, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useAuth } from '@/hooks/use-auth'
import { ProtectedRoute } from '@/components/auth/protected-route'
import { UserRole } from '@/types'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { BusinessSidebar } from '@/components/layout/BusinessSidebar'
import { TopNavigation } from '@/components/layout/TopNavigation'
import { Loader2, Search, Filter, Receipt, User, Calendar, DollarSign, Edit, Trash2, Clock, TrendingUp, TrendingDown, CreditCard } from 'lucide-react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog'
import { Textarea } from '@/components/ui/textarea'
import { ApprovalRequestDialog } from '@/components/approvals/ApprovalRequestDialog'
import { useNotify } from '@/hooks/use-notifications'

interface Sale {
  id: string
  invoiceNumber: string
  customerName: string
  customerPhone?: string
  subtotal: number
  taxAmount: number
  discountAmount: number
  totalAmount: number
  costAmount: number
  profitAmount: number
  paymentMethod: string
  status: string
  saleDate: string
  notes?: string
  itemsCount: number
  items: Array<{
    id: string
    productName: string
    productSku: string
    quantity: number
    unitPrice: number
    totalPrice: number
  }>
}

interface SalesSummary {
  totalSales: number
  totalCost: number
  totalProfit: number
  transactionCount: number
}

export default function SalesTransactionsPage() {
  const router = useRouter()
  const { user: currentUser } = useAuth()
  const { success, error: showError } = useNotify()
  const queryClient = useQueryClient()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [page, setPage] = useState(1)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('ALL')
  const [dateFilter, setDateFilter] = useState('ALL_TIME')
  
  // Edit/Delete states
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [selectedSale, setSelectedSale] = useState<Sale | null>(null)
  const [editForm, setEditForm] = useState({
    status: '',
    notes: ''
  })
  const [actionLoading, setActionLoading] = useState(false)
  
  // Approval states
  const [approvalDialogOpen, setApprovalDialogOpen] = useState(false)
  const [approvalAction, setApprovalAction] = useState<'UPDATE' | 'DELETE'>('UPDATE')
  
  // Check if user is a worker
  const isWorker = currentUser?.role === UserRole.SHOP_WORKER

  // Build query params
  const salesQueryParams = useMemo(() => {
    const params = new URLSearchParams({
      page: page.toString(),
      limit: '20'
    })
    
    if (searchTerm) params.append('search', searchTerm)
    if (statusFilter && statusFilter !== 'ALL') params.append('status', statusFilter)
    if (dateFilter && dateFilter !== 'ALL_TIME') {
      const today = new Date()
      let startDate: Date
      
      switch (dateFilter) {
        case 'today':
          startDate = new Date(today.getFullYear(), today.getMonth(), today.getDate())
          break
        case 'week':
          startDate = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000)
          break
        case 'month':
          startDate = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000)
          break
        default:
          startDate = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000)
      }
      
      params.append('startDate', startDate.toISOString())
      params.append('endDate', today.toISOString())
    }
    
    return params.toString()
  }, [page, searchTerm, statusFilter, dateFilter])

  // Fetch sales with React Query
  const {
    data: salesData,
    isLoading: loading,
    error: salesError,
    refetch
  } = useQuery({
    queryKey: ['sales', page, searchTerm, statusFilter, dateFilter],
    queryFn: async () => {
      const response = await fetch(`/api/sales?${salesQueryParams}`)
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to fetch sales data')
      }
      const data = await response.json()
      if (!data.success) {
        throw new Error(data.error || 'Failed to fetch sales data')
      }
      return data.data
    },
    staleTime: 2 * 60 * 1000, // 2 minutes - sales data changes frequently
    gcTime: 5 * 60 * 1000, // 5 minutes
    retry: 1,
  })

  // Extract data from query
  const sales = salesData?.sales || []
  const summary: SalesSummary = salesData?.summary || { totalSales: 0, totalCost: 0, totalProfit: 0, transactionCount: 0 }
  const pagination = salesData?.pagination
  const totalPages = pagination?.totalPages || 1
  const error = salesError instanceof Error ? salesError.message : null

  // Reset to page 1 when filters change
  useEffect(() => {
    setPage(1)
  }, [searchTerm, statusFilter, dateFilter])

  // Handle errors
  useEffect(() => {
    if (salesError) {
      showError('Failed to fetch sales data')
    }
  }, [salesError, showError])

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-PK', { 
      style: 'currency', 
      currency: 'PKR', 
      minimumFractionDigits: 0 
    }).format(amount)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'COMPLETED':
        return <Badge className="bg-green-100 text-green-800">Completed</Badge>
      case 'PENDING':
        return <Badge className="bg-yellow-100 text-yellow-800">Pending</Badge>
      case 'CANCELLED':
        return <Badge className="bg-red-100 text-red-800">Cancelled</Badge>
      case 'RETURNED':
        return <Badge className="bg-orange-100 text-orange-800">Returned</Badge>
      default:
        return <Badge className="bg-gray-100 text-gray-800">{status}</Badge>
    }
  }

  const getPaymentMethodBadge = (method: string) => {
    switch (method.toLowerCase()) {
      case 'cash':
        return <Badge variant="outline" className="border-green-300 text-green-700">Cash</Badge>
      case 'card':
        return <Badge variant="outline" className="border-blue-300 text-blue-700">Card</Badge>
      case 'easypaisa':
        return <Badge variant="outline" className="border-purple-300 text-purple-700">EasyPaisa</Badge>
      case 'jazzcash':
        return <Badge variant="outline" className="border-orange-300 text-orange-700">JazzCash</Badge>
      default:
        return <Badge variant="outline">{method}</Badge>
    }
  }

  const handleEditSale = (sale: Sale) => {
    setSelectedSale(sale)
    setEditForm({
      status: sale.status,
      notes: sale.notes || ''
    })
    
    // If worker, show approval dialog instead of direct edit
    if (isWorker) {
      setApprovalAction('UPDATE')
      setApprovalDialogOpen(true)
    } else {
      setEditDialogOpen(true)
    }
  }

  const handleDeleteSale = (sale: Sale) => {
    setSelectedSale(sale)
    
    // If worker, show approval dialog instead of direct delete
    if (isWorker) {
      setApprovalAction('DELETE')
      setApprovalDialogOpen(true)
    } else {
      setDeleteDialogOpen(true)
    }
  }
  
  const handleApprovalSubmit = async (reason: string) => {
    if (!selectedSale) return
    
    try {
      const response = await fetch('/api/approvals/request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: approvalAction,
          tableName: 'Sale',
          recordId: selectedSale.id,
          requestData: approvalAction === 'UPDATE' ? editForm : {
            invoiceNumber: selectedSale.invoiceNumber,
            customerName: selectedSale.customerName,
            totalAmount: selectedSale.totalAmount,
            items: selectedSale.items,
          },
          reason: reason,
        }),
      })

      const result = await response.json()

      if (response.ok && result.success) {
        success('Approval request submitted successfully. Your request is pending owner review.')
        // Invalidate sales query to refetch (in case approval auto-approves)
        queryClient.invalidateQueries({ queryKey: ['sales'] })
        setApprovalDialogOpen(false)
        setSelectedSale(null)
        setEditForm({ status: '', notes: '' })
      } else {
        showError(result.error || 'Failed to submit approval request')
      }
    } catch (error) {
      console.error('Error submitting approval request:', error)
      showError('Failed to submit approval request')
    }
  }

  const handleUpdateSale = async () => {
    if (!selectedSale) return

    try {
      setActionLoading(true)
      const response = await fetch(`/api/sales/${selectedSale.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(editForm),
      })

      const result = await response.json()

      if (response.ok && result.success) {
        // Invalidate sales query to refetch
        queryClient.invalidateQueries({ queryKey: ['sales'] })
        setEditDialogOpen(false)
        setSelectedSale(null)
        setEditForm({ status: '', notes: '' })
        success('Sale updated successfully')
      } else {
        showError(result.error || 'Failed to update sale')
      }
    } catch (error) {
      console.error('Update sale error:', error)
      showError('Failed to update sale')
    } finally {
      setActionLoading(false)
    }
  }

  const handleDeleteSaleConfirm = async () => {
    if (!selectedSale) return

    try {
      setActionLoading(true)
      const response = await fetch(`/api/sales/${selectedSale.id}`, {
        method: 'DELETE',
      })

      const result = await response.json()

      if (response.ok && result.success) {
        // Invalidate sales query to refetch
        queryClient.invalidateQueries({ queryKey: ['sales'] })
        setDeleteDialogOpen(false)
        setSelectedSale(null)
        success('Sale deleted successfully')
      } else {
        showError(result.error || 'Failed to delete sale')
      }
    } catch (error) {
      console.error('Delete sale error:', error)
      showError('Failed to delete sale')
    } finally {
      setActionLoading(false)
    }
  }

  return (
    <ProtectedRoute allowedRoles={[UserRole.SUPER_ADMIN, UserRole.SHOP_OWNER, UserRole.SHOP_WORKER]}>
      <div className="flex min-h-screen bg-gray-50 dark:bg-gray-900">
        <BusinessSidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
        
        <div className={`flex-1 flex flex-col min-h-screen transition-all duration-300 ${sidebarOpen ? 'lg:ml-20' : 'lg:ml-64'}`}>
          <TopNavigation onMenuClick={() => setSidebarOpen(!sidebarOpen)} />
          
          <div className="flex-1 bg-gray-50 dark:bg-gray-900">
            {/* Header */}
            <div className="bg-gradient-to-r from-green-600 to-green-700 text-white">
              <div className="px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                  <div className="min-w-0 flex-1">
                    <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold mb-1 sm:mb-2 truncate">Sales Transactions</h1>
                    <p className="text-green-100 text-sm sm:text-base">View and manage all sales transactions</p>
                  </div>
                  <Button 
                    onClick={() => router.push('/dashboard/pos')} 
                    className="bg-white text-green-600 hover:bg-green-50 w-full sm:w-auto h-9 sm:h-10 text-sm sm:text-base"
                  >
                    <Receipt className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-2" />
                    New Sale
                  </Button>
                </div>
              </div>
            </div>

            {/* Content */}
            <div className="px-4 sm:px-6 lg:px-8 py-4 sm:py-6 lg:py-8 space-y-4 sm:space-y-6">
              {/* Filters */}
              <Card>
                <CardContent className="p-4 sm:p-6">
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                    <div className="relative sm:col-span-2 lg:col-span-1">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-3.5 w-3.5 sm:h-4 sm:w-4 text-gray-400 dark:text-gray-500" />
                      <Input
                        placeholder="Search by invoice..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-9 sm:pl-10 h-9 sm:h-10 text-sm sm:text-base"
                      />
                    </div>
                    <Select value={statusFilter} onValueChange={setStatusFilter}>
                      <SelectTrigger className="h-9 sm:h-10 text-sm sm:text-base">
                        <SelectValue placeholder="Filter by status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="ALL">All Status</SelectItem>
                        <SelectItem value="COMPLETED">Completed</SelectItem>
                        <SelectItem value="PENDING">Pending</SelectItem>
                        <SelectItem value="CANCELLED">Cancelled</SelectItem>
                        <SelectItem value="RETURNED">Returned</SelectItem>
                      </SelectContent>
                    </Select>
                    <Select value={dateFilter} onValueChange={setDateFilter}>
                      <SelectTrigger className="h-9 sm:h-10 text-sm sm:text-base">
                        <SelectValue placeholder="Filter by date" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="ALL_TIME">All Time</SelectItem>
                        <SelectItem value="today">Today</SelectItem>
                        <SelectItem value="week">Last 7 days</SelectItem>
                        <SelectItem value="month">Last 30 days</SelectItem>
                      </SelectContent>
                    </Select>
                    <Button variant="outline" onClick={() => refetch()} disabled={loading} className="h-9 sm:h-10 text-sm sm:text-base">
                      <Filter className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-2" />
                      Refresh
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Summary Stats Cards */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                {/* Total Sales */}
                <Card className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 border-green-200 dark:border-green-700">
                  <CardContent className="p-3 sm:p-4">
                    <div className="flex flex-col">
                      <div className="flex items-start justify-between">
                        <p className="text-xs sm:text-sm font-medium text-green-600 dark:text-green-400">Total Sales</p>
                        <div className="w-8 h-8 sm:w-10 sm:h-10 bg-green-500/20 rounded-full flex items-center justify-center shrink-0">
                          <DollarSign className="h-4 w-4 sm:h-5 sm:w-5 text-green-600 dark:text-green-400" />
                        </div>
                      </div>
                      <p className="text-sm sm:text-xl lg:text-2xl font-bold text-green-700 dark:text-green-300 mt-1 break-all">
                        {loading ? '...' : formatCurrency(summary.totalSales)}
                      </p>
                      <p className="text-xs text-green-600/70 dark:text-green-400/70 mt-0.5">
                        {summary.transactionCount} transactions
                      </p>
                    </div>
                  </CardContent>
                </Card>

                {/* Total Cost */}
                <Card className="bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-900/20 dark:to-orange-800/20 border-orange-200 dark:border-orange-700">
                  <CardContent className="p-3 sm:p-4">
                    <div className="flex flex-col">
                      <div className="flex items-start justify-between">
                        <p className="text-xs sm:text-sm font-medium text-orange-600 dark:text-orange-400">Total Cost</p>
                        <div className="w-8 h-8 sm:w-10 sm:h-10 bg-orange-500/20 rounded-full flex items-center justify-center shrink-0">
                          <TrendingDown className="h-4 w-4 sm:h-5 sm:w-5 text-orange-600 dark:text-orange-400" />
                        </div>
                      </div>
                      <p className="text-sm sm:text-xl lg:text-2xl font-bold text-orange-700 dark:text-orange-300 mt-1 break-all">
                        {loading ? '...' : formatCurrency(summary.totalCost)}
                      </p>
                      <p className="text-xs text-orange-600/70 dark:text-orange-400/70 mt-0.5">
                        Cost of goods sold
                      </p>
                    </div>
                  </CardContent>
                </Card>

                {/* Total Profit */}
                <Card className={`bg-gradient-to-br ${summary.totalProfit >= 0 ? 'from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 border-blue-200 dark:border-blue-700' : 'from-red-50 to-red-100 dark:from-red-900/20 dark:to-red-800/20 border-red-200 dark:border-red-700'}`}>
                  <CardContent className="p-3 sm:p-4">
                    <div className="flex flex-col">
                      <div className="flex items-start justify-between">
                        <p className={`text-xs sm:text-sm font-medium ${summary.totalProfit >= 0 ? 'text-blue-600 dark:text-blue-400' : 'text-red-600 dark:text-red-400'}`}>Total Profit</p>
                        <div className={`w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center shrink-0 ${summary.totalProfit >= 0 ? 'bg-blue-500/20' : 'bg-red-500/20'}`}>
                          <TrendingUp className={`h-4 w-4 sm:h-5 sm:w-5 ${summary.totalProfit >= 0 ? 'text-blue-600 dark:text-blue-400' : 'text-red-600 dark:text-red-400'}`} />
                        </div>
                      </div>
                      <p className={`text-sm sm:text-xl lg:text-2xl font-bold mt-1 break-all ${summary.totalProfit >= 0 ? 'text-blue-700 dark:text-blue-300' : 'text-red-700 dark:text-red-300'}`}>
                        {loading ? '...' : formatCurrency(summary.totalProfit)}
                      </p>
                      <p className={`text-xs mt-0.5 ${summary.totalProfit >= 0 ? 'text-blue-600/70 dark:text-blue-400/70' : 'text-red-600/70 dark:text-red-400/70'}`}>
                        {summary.totalSales > 0 ? `${((summary.totalProfit / summary.totalSales) * 100).toFixed(1)}% margin` : '0% margin'}
                      </p>
                    </div>
                  </CardContent>
                </Card>

                {/* Transactions Count */}
                <Card className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20 border-purple-200 dark:border-purple-700">
                  <CardContent className="p-3 sm:p-4">
                    <div className="flex flex-col">
                      <div className="flex items-start justify-between">
                        <p className="text-xs sm:text-sm font-medium text-purple-600 dark:text-purple-400">Transactions</p>
                        <div className="w-8 h-8 sm:w-10 sm:h-10 bg-purple-500/20 rounded-full flex items-center justify-center shrink-0">
                          <Receipt className="h-4 w-4 sm:h-5 sm:w-5 text-purple-600 dark:text-purple-400" />
                        </div>
                      </div>
                      <p className="text-sm sm:text-xl lg:text-2xl font-bold text-purple-700 dark:text-purple-300 mt-1">
                        {loading ? '...' : summary.transactionCount}
                      </p>
                      <p className="text-xs text-purple-600/70 dark:text-purple-400/70 mt-0.5 break-all">
                        {summary.transactionCount > 0 ? `Avg ${formatCurrency(summary.totalSales / summary.transactionCount)}` : 'No sales'}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Sales List */}
              <Card>
                <CardHeader className="p-4 sm:p-6">
                  <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                    <Receipt className="h-4 w-4 sm:h-5 sm:w-5" />
                    Sales Transactions
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-4 sm:p-6 pt-0 sm:pt-0">
                  {loading ? (
                    <div className="flex items-center justify-center py-8 sm:py-12">
                      <Loader2 className="h-6 w-6 sm:h-8 sm:w-8 animate-spin text-gray-400 dark:text-gray-500" />
                      <span className="ml-2 text-sm sm:text-base text-gray-500 dark:text-gray-400">Loading sales...</span>
                    </div>
                  ) : error ? (
                    <div className="text-center py-8 sm:py-12">
                      <p className="text-sm sm:text-base text-red-600 dark:text-red-400 mb-4">{error}</p>
                      <Button onClick={() => refetch()} variant="outline" className="h-9 sm:h-10">Retry</Button>
                    </div>
                  ) : sales.length === 0 ? (
                    <div className="text-center py-8 sm:py-12">
                      <Receipt className="h-10 w-10 sm:h-12 sm:w-12 mx-auto text-gray-400 dark:text-gray-500 mb-4" />
                      <p className="text-sm sm:text-base text-gray-500 dark:text-gray-400">No sales transactions found</p>
                    </div>
                  ) : (
                    <div className="space-y-3 sm:space-y-4">
                      {sales.map((sale: Sale) => (
                        <div key={sale.id} className="border dark:border-gray-700 rounded-lg p-3 sm:p-4 lg:p-6 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                          <div className="flex flex-col sm:flex-row justify-between items-start gap-3 sm:gap-4 mb-3 sm:mb-4">
                            <div className="flex items-center gap-3 sm:gap-4 w-full sm:w-auto">
                              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center shrink-0">
                                <Receipt className="h-5 w-5 sm:h-6 sm:w-6 text-blue-600 dark:text-blue-400" />
                              </div>
                              <div className="min-w-0 flex-1">
                                <h3 className="text-sm sm:text-base font-semibold text-gray-900 dark:text-white truncate">{sale.invoiceNumber}</h3>
                                <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2 mt-1">
                                  <div className="flex items-center gap-1 sm:gap-2">
                                    <User className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-gray-400 dark:text-gray-500 shrink-0" />
                                    <span className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 truncate">{sale.customerName}</span>
                                  </div>
                                  {sale.customerPhone && (
                                    <span className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 hidden sm:inline">• {sale.customerPhone}</span>
                                  )}
                                </div>
                              </div>
                            </div>
                            <div className="w-full sm:w-auto sm:text-right flex flex-col sm:items-end gap-2 sm:gap-1">
                              <p className="text-lg sm:text-xl lg:text-2xl font-bold text-green-600 dark:text-green-500">{formatCurrency(sale.totalAmount)}</p>
                              <div className="flex items-center gap-1.5 sm:gap-2">
                                {getStatusBadge(sale.status)}
                                {getPaymentMethodBadge(sale.paymentMethod)}
                              </div>
                              <div className="flex items-center gap-2 mt-1 sm:mt-2">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleEditSale(sale)}
                                  className="h-7 sm:h-8 px-2 sm:px-3 text-xs sm:text-sm"
                                >
                                  <Edit className="h-3 w-3 mr-1" />
                                  <span className="hidden sm:inline">Edit</span>
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleDeleteSale(sale)}
                                  className="h-7 sm:h-8 px-2 sm:px-3 text-xs sm:text-sm text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20"
                                >
                                  <Trash2 className="h-3 w-3 mr-1" />
                                  <span className="hidden sm:inline">Delete</span>
                                </Button>
                              </div>
                            </div>
                          </div>
                          
                          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 text-xs sm:text-sm mt-3 sm:mt-4">
                            <div className="flex items-center gap-1.5 sm:gap-2 text-gray-600 dark:text-gray-400">
                              <Calendar className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-gray-400 dark:text-gray-500 shrink-0" />
                              <span>{formatDate(sale.saleDate)}</span>
                            </div>
                            <div className="flex items-center gap-1.5 sm:gap-2 text-gray-600 dark:text-gray-400">
                              <DollarSign className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-gray-400 dark:text-gray-500 shrink-0" />
                              <span className="truncate">Subtotal: {formatCurrency(sale.subtotal)}</span>
                            </div>
                            <div className="flex items-center gap-1.5 sm:gap-2">
                              <span className="text-gray-400 shrink-0">Tax:</span>
                              <span className="truncate">{formatCurrency(sale.taxAmount)}</span>
                            </div>
                            <div className="flex items-center gap-1.5 sm:gap-2">
                              <span className="text-gray-400 shrink-0">Items:</span>
                              <span>{sale.itemsCount}</span>
                            </div>
                          </div>

                          {/* Sale Items */}
                          <div className="mt-3 sm:mt-4 pt-3 sm:pt-4 border-t dark:border-gray-700">
                            <h4 className="text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Items Sold:</h4>
                            <div className="space-y-2">
                              {sale.items.map((item: Sale['items'][0]) => (
                                <div key={item.id} className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-1 sm:gap-2 text-xs sm:text-sm bg-gray-50 dark:bg-gray-800 p-2 rounded">
                                  <div className="min-w-0 flex-1">
                                    <span className="font-medium truncate">{item.productName}</span>
                                    <span className="text-gray-500 dark:text-gray-400 ml-2">({item.productSku})</span>
                                  </div>
                                  <div className="flex items-center gap-2 sm:gap-4 text-right shrink-0">
                                    <span className="text-gray-600 dark:text-gray-400 text-xs sm:text-sm">Qty: {item.quantity}</span>
                                    <span className="font-medium">{formatCurrency(item.totalPrice)}</span>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Pagination */}
                  {totalPages > 1 && (
                    <div className="flex justify-center items-center gap-2 mt-4 sm:mt-6">
                      <Button 
                        variant="outline" 
                        onClick={() => setPage(page - 1)} 
                        disabled={page === 1 || loading}
                        className="h-8 sm:h-10 px-3 sm:px-4 text-xs sm:text-sm"
                      >
                        Previous
                      </Button>
                      <span className="px-2 sm:px-4 py-2 text-xs sm:text-sm text-gray-600 dark:text-gray-400">
                        Page {page} of {totalPages}
                      </span>
                      <Button 
                        variant="outline" 
                        onClick={() => setPage(page + 1)} 
                        disabled={page === totalPages || loading}
                        className="h-8 sm:h-10 px-3 sm:px-4 text-xs sm:text-sm"
                      >
                        Next
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>

        {/* Edit Sale Dialog */}
        <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Sale</DialogTitle>
            <DialogDescription>
              Update the status and notes for {selectedSale?.invoiceNumber}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">Status</label>
              <Select value={editForm.status} onValueChange={(value) => setEditForm({...editForm, status: value})}>
                <SelectTrigger>
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="PENDING">Pending</SelectItem>
                  <SelectItem value="COMPLETED">Completed</SelectItem>
                  <SelectItem value="CANCELLED">Cancelled</SelectItem>
                  <SelectItem value="RETURNED">Returned</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <label className="text-sm font-medium">Notes</label>
              <Textarea
                value={editForm.notes}
                onChange={(e) => setEditForm({...editForm, notes: e.target.value})}
                placeholder="Add any notes about this sale..."
                rows={3}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setEditDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleUpdateSale} disabled={actionLoading}>
              {actionLoading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
              Update Sale
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Sale Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Sale</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete sale {selectedSale?.invoiceNumber}? This action cannot be undone.
              <br />
              <span className="text-red-600 font-medium">
                This will restore the inventory items back to stock.
              </span>
            </DialogDescription>
          </DialogHeader>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
              Cancel
            </Button>
            <Button 
              variant="destructive" 
              onClick={handleDeleteSaleConfirm} 
              disabled={actionLoading}
            >
              {actionLoading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
              Delete Sale
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Approval Request Dialog (for workers) */}
      {selectedSale && (
        <ApprovalRequestDialog
          open={approvalDialogOpen}
          onOpenChange={setApprovalDialogOpen}
          requestType={approvalAction}
          tableName="Sale"
          recordData={
            approvalAction === 'UPDATE'
              ? editForm
              : {
                  invoiceNumber: selectedSale.invoiceNumber,
                  customerName: selectedSale.customerName,
                  totalAmount: selectedSale.totalAmount,
                  items: selectedSale.items,
                }
          }
          onSubmit={handleApprovalSubmit}
        />
      )}
    </ProtectedRoute>
  )
}

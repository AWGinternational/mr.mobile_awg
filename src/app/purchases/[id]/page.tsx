'use client'

// Opt out of static generation due to useSearchParams
export const dynamic = 'force-dynamic'

import React, { useState, useEffect } from 'react'
import { useRouter, useParams, useSearchParams } from 'next/navigation'
import { useAuth } from '@/hooks/use-auth'
import { useNotify } from '@/hooks/use-notifications'
import { ProtectedRoute } from '@/components/auth/protected-route'
import { TopNavigation } from '@/components/layout/TopNavigation'
import { BusinessSidebar } from '@/components/layout/BusinessSidebar'
import { UserRole, PurchaseStatus } from '@/types'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  ArrowLeft,
  Package,
  DollarSign,
  CheckCircle,
  XCircle,
  Clock,
  Loader2,
  Edit,
  Trash2,
  Download,
  Printer,
  X,
  FileText
} from 'lucide-react'

interface PurchaseItem {
  id: string
  product: {
    id: string
    name: string
    model: string
    sku: string
  }
  quantity: number
  receivedQty: number
  unitCost: number
  totalCost: number
}

interface Purchase {
  id: string
  invoiceNumber: string
  supplier: {
    id: string
    name: string
    contactPerson: string
    phone: string
  }
  totalAmount: number
  paidAmount: number
  dueAmount: number
  status: PurchaseStatus
  orderDate: string
  receivedDate: string | null
  dueDate: string | null
  notes: string | null
  items: PurchaseItem[]
}

const STATUS_OPTIONS = [
  { value: 'DRAFT', label: 'Draft', color: 'bg-gray-500' },
  { value: 'ORDERED', label: 'Ordered', color: 'bg-blue-500' },
  { value: 'PARTIAL', label: 'Partially Received', color: 'bg-yellow-500' },
  { value: 'RECEIVED', label: 'Received', color: 'bg-purple-500' },
  { value: 'COMPLETED', label: 'Completed', color: 'bg-green-500' },
  { value: 'CANCELLED', label: 'Cancelled', color: 'bg-red-500' },
]

export default function PurchaseDetailsPageContent() {
  const router = useRouter()
  const params = useParams()
  const searchParams = useSearchParams()
  const { success, error: showError } = useNotify()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [loading, setLoading] = useState(true)
  const [purchase, setPurchase] = useState<Purchase | null>(null)
  const [updating, setUpdating] = useState(false)
  const [deleting, setDeleting] = useState(false)
  
  // Payment form
  const [showPaymentForm, setShowPaymentForm] = useState(false)
  const [paymentAmount, setPaymentAmount] = useState('')
  const [paymentMethod, setPaymentMethod] = useState('CASH')
  
  // Invoice preview
  const [showInvoicePreview, setShowInvoicePreview] = useState(false)

  useEffect(() => {
    if (params.id) {
      fetchPurchaseDetails()
    }
  }, [params.id])

  // Refetch when returning from receive page
  useEffect(() => {
    const refresh = searchParams.get('refresh')
    if (refresh === 'true' && params.id) {
      fetchPurchaseDetails()
    }
  }, [searchParams])

  const fetchPurchaseDetails = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/purchases/${params.id}`)
      const data = await response.json()

      if (data.success) {
        setPurchase(data.data)
      } else {
        showError('Failed to load purchase details')
      }
    } catch (error) {
      console.error('Error fetching purchase:', error)
      showError('Failed to load purchase details')
    } finally {
      setLoading(false)
    }
  }

  const handleStatusChange = async (newStatus: PurchaseStatus) => {
    if (!purchase) return

    try {
      setUpdating(true)
      const response = await fetch(`/api/purchases/${purchase.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      })

      const data = await response.json()

      if (data.success) {
        success('Purchase status updated')
        fetchPurchaseDetails()
      } else {
        showError(data.error || 'Failed to update status')
      }
    } catch (error) {
      showError('Failed to update status')
    } finally {
      setUpdating(false)
    }
  }

  const handleAddPayment = async () => {
    if (!purchase || !paymentAmount) return

    const amount = parseFloat(paymentAmount)
    if (amount <= 0 || amount > purchase.dueAmount) {
      showError(`Payment must be between 1 and ${purchase.dueAmount}`)
      return
    }

    try {
      setUpdating(true)
      const response = await fetch(`/api/purchases/${purchase.id}/payment`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount,
          method: paymentMethod
        })
      })

      const data = await response.json()

      if (data.success) {
        success('Payment recorded successfully')
        setShowPaymentForm(false)
        setPaymentAmount('')
        fetchPurchaseDetails()
      } else {
        showError(data.error || 'Failed to record payment')
      }
    } catch (error) {
      showError('Failed to record payment')
    } finally {
      setUpdating(false)
    }
  }

  const handleMarkCompleted = async () => {
    if (!purchase) return

    if (purchase.dueAmount > 0) {
      showError('Cannot mark as completed. Please clear all dues first.')
      return
    }

    if (purchase.status !== 'RECEIVED') {
      showError('Please receive all stock before marking as completed')
      return
    }

    await handleStatusChange('COMPLETED' as PurchaseStatus)
  }

  const handleDownloadInvoice = () => {
    setShowInvoicePreview(true)
  }

  const handlePrintInvoice = () => {
    const printContent = document.getElementById('invoice-print-content')
    if (printContent) {
      const printWindow = window.open('', '_blank')
      if (printWindow) {
        printWindow.document.write(`
          <html>
            <head>
              <title>Purchase Order - ${purchase?.invoiceNumber}</title>
              <style>
                body { font-family: Arial, sans-serif; margin: 0; padding: 20px; }
                @media print {
                  body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
                  @page { margin: 1cm; size: A4; }
                }
              </style>
            </head>
            <body>${printContent.innerHTML}</body>
          </html>
        `)
        printWindow.document.close()
        printWindow.print()
      }
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-PK', {
      style: 'currency',
      currency: 'PKR',
      minimumFractionDigits: 0
    }).format(amount)
  }

  const formatDateForInvoice = (date: string | null) => {
    if (!date) return 'N/A'
    return new Date(date).toLocaleDateString('en-PK', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  const handleDeletePurchase = async () => {
    if (!purchase) return

    const confirmed = confirm(
      `Are you sure you want to delete purchase order ${purchase.invoiceNumber}?\n\nThis action cannot be undone.`
    )

    if (!confirmed) return

    try {
      setDeleting(true)
      const response = await fetch(`/api/purchases/${purchase.id}`, {
        method: 'DELETE'
      })

      const data = await response.json()

      if (data.success) {
        success('Purchase order deleted successfully')
        router.push('/purchases')
      } else {
        showError(data.error || 'Failed to delete purchase order')
      }
    } catch (error) {
      console.error('Delete purchase error:', error)
      showError('Failed to delete purchase order')
    } finally {
      setDeleting(false)
    }
  }

  const formatDate = (date: string | null) => {
    if (!date) return 'N/A'
    return new Date(date).toLocaleDateString('en-PK', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  const getStatusBadge = (status: PurchaseStatus) => {
    const statusConfig = STATUS_OPTIONS.find(s => s.value === status)
    return (
      <Badge className={`${statusConfig?.color || 'bg-gray-500'} text-white`}>
        {statusConfig?.label || status}
      </Badge>
    )
  }

  if (loading) {
    return (
      <ProtectedRoute allowedRoles={[UserRole.SUPER_ADMIN, UserRole.SHOP_OWNER, UserRole.SHOP_WORKER]}>
        <div className="flex min-h-screen bg-gray-50 dark:bg-gray-900">
          <BusinessSidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
          <div className={`flex-1 flex items-center justify-center ${sidebarOpen ? 'lg:ml-20' : 'lg:ml-64'}`}>
            <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
          </div>
        </div>
      </ProtectedRoute>
    )
  }

  if (!purchase) {
    return (
      <ProtectedRoute allowedRoles={[UserRole.SUPER_ADMIN, UserRole.SHOP_OWNER, UserRole.SHOP_WORKER]}>
        <div className="flex min-h-screen bg-gray-50 dark:bg-gray-900">
          <BusinessSidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
          <div className={`flex-1 flex items-center justify-center ${sidebarOpen ? 'lg:ml-20' : 'lg:ml-64'}`}>
            <div className="text-center">
              <p className="text-gray-500">Purchase not found</p>
              <Button onClick={() => router.push('/purchases')} className="mt-4">
                Back to Purchases
              </Button>
            </div>
          </div>
        </div>
      </ProtectedRoute>
    )
  }

  return (
    <ProtectedRoute allowedRoles={[UserRole.SUPER_ADMIN, UserRole.SHOP_OWNER, UserRole.SHOP_WORKER]}>
      <div className="flex min-h-screen bg-gradient-to-br from-slate-50 via-gray-50 to-blue-50 dark:from-gray-900 dark:via-gray-900 dark:to-gray-900">
        <BusinessSidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
        <div className={`flex-1 ${sidebarOpen ? 'lg:ml-20' : 'lg:ml-64'} transition-all duration-300`}>
          <div className="max-w-6xl mx-auto px-3 sm:px-4 lg:px-6 py-4 sm:py-6 lg:py-8 w-full">
            <TopNavigation onMenuClick={() => setSidebarOpen(!sidebarOpen)} />

            {/* Header - Compact */}
            <div className="relative overflow-hidden mb-4 sm:mb-6">
              <div className="absolute inset-0 bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-700 rounded-xl sm:rounded-2xl"></div>
              <div className="relative px-4 sm:px-6 py-4 sm:py-5">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <button
                      onClick={() => router.push('/purchases')}
                      className="p-2 sm:p-2.5 bg-white/20 hover:bg-white/30 active:scale-95 rounded-lg sm:rounded-xl transition-all shrink-0"
                    >
                      <ArrowLeft className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
                    </button>
                    <div className="min-w-0 flex-1">
                      <h1 className="text-base sm:text-xl lg:text-2xl font-bold text-white truncate">{purchase.invoiceNumber}</h1>
                      <p className="text-blue-100 text-xs sm:text-sm mt-0.5">Purchase Order Details</p>
                    </div>
                  </div>
                  <div className="shrink-0">
                    {getStatusBadge(purchase.status)}
                  </div>
                </div>
              </div>
            </div>

            {/* Mobile Financial Summary - Shown First on Mobile */}
            <div className="lg:hidden mb-4">
              <Card className="border-0 shadow-md">
                <CardContent className="p-4">
                  <div className="grid grid-cols-3 gap-3 text-center">
                    <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3">
                      <p className="text-[10px] text-gray-500 uppercase">Total</p>
                      <p className="text-sm font-bold text-gray-900 dark:text-white">{formatCurrency(purchase.totalAmount)}</p>
                    </div>
                    <div className="bg-emerald-50 dark:bg-emerald-900/20 rounded-lg p-3">
                      <p className="text-[10px] text-emerald-600 uppercase">Paid</p>
                      <p className="text-sm font-bold text-emerald-700 dark:text-emerald-400">{formatCurrency(purchase.paidAmount)}</p>
                    </div>
                    <div className="bg-red-50 dark:bg-red-900/20 rounded-lg p-3">
                      <p className="text-[10px] text-red-600 uppercase">Due</p>
                      <p className="text-sm font-bold text-red-600 dark:text-red-400">{formatCurrency(purchase.dueAmount)}</p>
                    </div>
                  </div>
                  
                  {/* Payment Progress */}
                  <div className="mt-3">
                    <div className="flex justify-between text-xs text-gray-500 mb-1">
                      <span>Payment</span>
                      <span>{Math.round((purchase.paidAmount / purchase.totalAmount) * 100)}%</span>
                    </div>
                    <div className="bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                      <div
                        className="bg-emerald-500 h-2 rounded-full transition-all"
                        style={{ width: `${(purchase.paidAmount / purchase.totalAmount) * 100}%` }}
                      />
                    </div>
                  </div>

                  {/* Quick Actions on Mobile */}
                  <div className="flex gap-2 mt-3">
                    {purchase.dueAmount > 0 && purchase.status !== 'CANCELLED' && (
                      <Button
                        size="sm"
                        className="flex-1 h-9 text-xs"
                        onClick={() => setShowPaymentForm(true)}
                      >
                        <DollarSign className="h-3.5 w-3.5 mr-1" />
                        Add Payment
                      </Button>
                    )}
                    {purchase.status === 'ORDERED' && (
                      <Button
                        size="sm"
                        variant="outline"
                        className="flex-1 h-9 text-xs"
                        onClick={() => router.push(`/purchases/${purchase.id}/receive`)}
                      >
                        <Package className="h-3.5 w-3.5 mr-1" />
                        Receive Stock
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
              {/* Main Content */}
              <div className="lg:col-span-2 space-y-4 sm:space-y-6">
                {/* Supplier Info - Compact */}
                <Card className="border-0 shadow-md">
                  <CardHeader className="pb-2 sm:pb-4">
                    <CardTitle className="text-sm sm:text-base flex items-center gap-2">
                      <div className="w-7 h-7 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                        <span className="text-sm">🏢</span>
                      </div>
                      Supplier
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="grid grid-cols-2 gap-3 sm:gap-4">
                      <div>
                        <p className="text-[10px] sm:text-xs text-gray-500">Name</p>
                        <p className="font-semibold text-sm text-gray-900 dark:text-white">{purchase.supplier.name}</p>
                      </div>
                      <div>
                        <p className="text-[10px] sm:text-xs text-gray-500">Contact</p>
                        <p className="font-semibold text-sm text-gray-900 dark:text-white">{purchase.supplier.contactPerson}</p>
                      </div>
                      <div>
                        <p className="text-[10px] sm:text-xs text-gray-500">Phone</p>
                        <p className="font-semibold text-sm text-gray-900 dark:text-white">{purchase.supplier.phone}</p>
                      </div>
                      <div>
                        <p className="text-[10px] sm:text-xs text-gray-500">Order Date</p>
                        <p className="font-semibold text-sm text-gray-900 dark:text-white">{formatDate(purchase.orderDate)}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Purchase Items - Improved Mobile */}
                <Card className="border-0 shadow-md">
                  <CardHeader className="pb-2 sm:pb-4">
                    <CardTitle className="text-sm sm:text-base flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-lg bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
                          <span className="text-sm">📦</span>
                        </div>
                        Order Items
                      </div>
                      <span className="text-xs font-normal text-gray-500 bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded-full">
                        {purchase.items.length} items
                      </span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="space-y-2 sm:space-y-3">
                      {purchase.items.map((item, index) => {
                        const receivedPercentage = (item.receivedQty / item.quantity) * 100
                        const isFullyReceived = item.receivedQty >= item.quantity
                        const isPending = item.receivedQty === 0
                        
                        return (
                          <div 
                            key={item.id} 
                            className={`border rounded-xl p-3 sm:p-4 transition-all ${
                              isFullyReceived 
                                ? 'bg-emerald-50/50 dark:bg-emerald-900/10 border-emerald-200 dark:border-emerald-800' 
                                : isPending 
                                ? 'bg-gray-50/50 dark:bg-gray-800/50 border-gray-200 dark:border-gray-700'
                                : 'bg-blue-50/50 dark:bg-blue-900/10 border-blue-200 dark:border-blue-800'
                            }`}
                          >
                            <div className="flex justify-between items-start gap-3 mb-2">
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 flex-wrap mb-1">
                                  <p className="font-semibold text-sm text-gray-900 dark:text-white truncate">{item.product.name}</p>
                                  {isFullyReceived && (
                                    <Badge className="bg-emerald-500 text-white text-[10px] px-1.5 py-0">
                                      <CheckCircle className="h-2.5 w-2.5 mr-0.5" />
                                      Complete
                                    </Badge>
                                  )}
                                  {!isFullyReceived && !isPending && (
                                    <Badge className="bg-blue-500 text-white text-[10px] px-1.5 py-0">Partial</Badge>
                                  )}
                                  {isPending && (
                                    <Badge className="bg-gray-500 text-white text-[10px] px-1.5 py-0">Pending</Badge>
                                  )}
                                </div>
                                <p className="text-xs text-gray-600 dark:text-gray-400">
                                  {item.product.model} • {item.product.sku}
                                </p>
                              </div>
                              <div className="text-right shrink-0">
                                <p className="font-bold text-sm sm:text-base text-gray-900 dark:text-white">
                                  {formatCurrency(item.totalCost)}
                                </p>
                                <p className="text-[10px] sm:text-xs text-gray-500">
                                  {formatCurrency(item.unitCost)} × {item.quantity}
                                </p>
                              </div>
                            </div>
                            
                            {/* Progress Section */}
                            <div className="space-y-1.5">
                              <div className="flex items-center justify-between text-xs">
                                <span className="text-gray-600 dark:text-gray-400">Received</span>
                                <span className={`font-medium ${
                                  isFullyReceived ? 'text-emerald-600' : isPending ? 'text-gray-500' : 'text-blue-600'
                                }`}>
                                  {item.receivedQty}/{item.quantity} ({Math.round(receivedPercentage)}%)
                                </span>
                              </div>
                              <div className="relative bg-gray-200 dark:bg-gray-700 rounded-full h-1.5 overflow-hidden">
                                <div
                                  className={`h-1.5 rounded-full transition-all duration-500 ${
                                    isFullyReceived ? 'bg-emerald-500' : 'bg-blue-500'
                                  }`}
                                  style={{ width: `${receivedPercentage}%` }}
                                />
                              </div>
                            </div>
                          </div>
                        )
                      })}
                    </div>

                    {purchase.status === 'ORDERED' && (
                      <Button
                        className="w-full mt-4 h-10 sm:h-11"
                        onClick={() => router.push(`/purchases/${purchase.id}/receive`)}
                      >
                        <Package className="h-4 w-4 mr-2" />
                        Receive Stock
                      </Button>
                    )}
                  </CardContent>
                </Card>

                {/* Notes */}
                {purchase.notes && (
                  <Card className="border-0 shadow-md">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm sm:text-base">Notes</CardTitle>
                    </CardHeader>
                    <CardContent className="pt-0">
                      <p className="text-sm text-gray-700 dark:text-gray-300">{purchase.notes}</p>
                    </CardContent>
                  </Card>
                )}
              </div>

              {/* Sidebar - Desktop Only */}
              <div className="hidden lg:block space-y-6">
                {/* Financial Summary */}
                <Card className="border-0 shadow-md">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <div className="w-6 h-6 rounded-lg bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                        <span className="text-xs">💰</span>
                      </div>
                      Financial Summary
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <p className="text-sm text-gray-500">Total Amount</p>
                      <p className="text-2xl font-bold">{formatCurrency(purchase.totalAmount)}</p>
                    </div>
                    <div className="flex justify-between items-center pt-3 border-t">
                      <span className="text-sm text-gray-600">Paid</span>
                      <span className="font-semibold text-green-600">
                        {formatCurrency(purchase.paidAmount)}
                      </span>
                    </div>
                    <div className="flex justify-between items-center pb-3 border-b">
                      <span className="text-sm text-gray-600">Due</span>
                      <span className="font-semibold text-red-600">
                        {formatCurrency(purchase.dueAmount)}
                      </span>
                    </div>

                    {/* Payment Progress */}
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span>Payment Progress</span>
                        <span>{Math.round((purchase.paidAmount / purchase.totalAmount) * 100)}%</span>
                      </div>
                      <div className="bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-green-600 h-2 rounded-full transition-all"
                          style={{ width: `${(purchase.paidAmount / purchase.totalAmount) * 100}%` }}
                        />
                      </div>
                    </div>

                    {/* Add Payment Button */}
                    {purchase.dueAmount > 0 && purchase.status !== 'CANCELLED' && (
                      <>
                        {!showPaymentForm ? (
                          <Button
                            className="w-full"
                            variant="outline"
                            onClick={() => setShowPaymentForm(true)}
                          >
                            <DollarSign className="h-4 w-4 mr-2" />
                            Record Payment
                          </Button>
                        ) : (
                          <div className="space-y-3">
                            <div className="space-y-2">
                              <Label>Payment Amount</Label>
                              <Input
                                type="number"
                                value={paymentAmount}
                                onChange={(e) => setPaymentAmount(e.target.value)}
                                placeholder={`Max: ${purchase.dueAmount}`}
                                max={purchase.dueAmount}
                              />
                            </div>
                            <div className="space-y-2">
                              <Label>Payment Method</Label>
                              <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                                <SelectTrigger>
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="CASH">Cash</SelectItem>
                                  <SelectItem value="BANK_TRANSFER">Bank Transfer</SelectItem>
                                  <SelectItem value="CHEQUE">Cheque</SelectItem>
                                  <SelectItem value="EASYPAISA">EasyPaisa</SelectItem>
                                  <SelectItem value="JAZZCASH">JazzCash</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                            <div className="flex gap-2">
                              <Button
                                className="flex-1"
                                onClick={handleAddPayment}
                                disabled={updating}
                              >
                                {updating ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Add Payment'}
                              </Button>
                              <Button
                                variant="outline"
                                onClick={() => {
                                  setShowPaymentForm(false)
                                  setPaymentAmount('')
                                }}
                              >
                                Cancel
                              </Button>
                            </div>
                          </div>
                        )}
                      </>
                    )}
                  </CardContent>
                </Card>

                {/* Status Management */}
                <Card className="border-0 shadow-md">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm">Status Management</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3 pt-0">
                    <div className="space-y-2">
                      <Label className="text-xs">Change Status</Label>
                      <Select
                        value={purchase.status}
                        onValueChange={(value) => handleStatusChange(value as PurchaseStatus)}
                        disabled={updating}
                      >
                        <SelectTrigger className="h-9 text-sm">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {STATUS_OPTIONS.map((option) => (
                            <SelectItem key={option.value} value={option.value}>
                              {option.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    {purchase.status === 'RECEIVED' && purchase.dueAmount === 0 && (
                      <Button
                        className="w-full h-9 text-sm"
                        onClick={handleMarkCompleted}
                        disabled={updating}
                      >
                        <CheckCircle className="h-4 w-4 mr-2" />
                        Mark as Completed
                      </Button>
                    )}

                    {purchase.status === 'RECEIVED' && purchase.dueAmount > 0 && (
                      <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-2.5">
                        <p className="text-xs text-yellow-800 dark:text-yellow-200">
                          ⚠️ Clear all dues to complete
                        </p>
                      </div>
                    )}

                    {purchase.status === 'COMPLETED' && (
                      <div className="bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 rounded-lg p-2.5">
                        <p className="text-xs text-emerald-800 dark:text-emerald-200">
                          ✅ Order completed!
                        </p>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Quick Actions */}
                <Card className="border-0 shadow-md">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm">Actions</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2 pt-0">
                    <Button 
                      variant="outline" 
                      className="w-full justify-start h-9 text-sm hover:bg-blue-50"
                      onClick={handleDownloadInvoice}
                    >
                      <Download className="h-4 w-4 mr-2" />
                      Download Invoice
                    </Button>
                    <Button 
                      variant="outline" 
                      className="w-full justify-start h-9 text-sm text-red-600 hover:text-red-700 hover:bg-red-50"
                      onClick={handleDeletePurchase}
                      disabled={deleting || purchase.status === 'COMPLETED'}
                    >
                      {deleting ? (
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      ) : (
                        <Trash2 className="h-4 w-4 mr-2" />
                      )}
                      {deleting ? 'Deleting...' : 'Delete'}
                    </Button>
                    {purchase.status === 'COMPLETED' && (
                      <p className="text-[10px] text-gray-500">
                        ℹ️ Completed orders can't be deleted
                      </p>
                    )}
                  </CardContent>
                </Card>
              </div>
            </div>

            {/* Mobile Bottom Actions */}
            <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 p-3 safe-area-pb">
              <div className="flex gap-2">
                <Button 
                  variant="outline" 
                  size="sm"
                  className="flex-1 h-10"
                  onClick={handleDownloadInvoice}
                >
                  <Download className="h-4 w-4 mr-1.5" />
                  Invoice
                </Button>
                {purchase.status !== 'COMPLETED' && (
                  <Button 
                    variant="outline" 
                    size="sm"
                    className="h-10 text-red-600"
                    onClick={handleDeletePurchase}
                    disabled={deleting}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </div>
            
            {/* Spacer for mobile bottom bar */}
            <div className="lg:hidden h-20"></div>
          </div>
        </div>
      </div>

      {/* Invoice Preview Dialog */}
      <Dialog open={showInvoicePreview} onOpenChange={setShowInvoicePreview}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto p-0">
          <DialogHeader className="sticky top-0 bg-white dark:bg-gray-900 z-10 px-4 sm:px-6 py-4 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <DialogTitle className="flex items-center gap-2 text-base sm:text-lg">
                <FileText className="h-5 w-5 text-blue-600" />
                Purchase Order Invoice
              </DialogTitle>
              <div className="flex items-center gap-2">
                <Button
                  onClick={handlePrintInvoice}
                  size="sm"
                  className="bg-blue-600 hover:bg-blue-700 text-white text-xs sm:text-sm"
                >
                  <Printer className="h-4 w-4 mr-1.5" />
                  Print / PDF
                </Button>
              </div>
            </div>
          </DialogHeader>
          
          {/* Invoice Content */}
          <div id="invoice-print-content" className="p-4 sm:p-6 lg:p-8 bg-white">
            {/* Header */}
            <div className="border-b-4 border-blue-600 pb-4 sm:pb-6 mb-4 sm:mb-6">
              <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
                <div>
                  <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 mb-1 sm:mb-2">PURCHASE ORDER</h1>
                  <p className="text-lg sm:text-xl text-gray-600">#{purchase?.invoiceNumber}</p>
                </div>
                <div className="text-left sm:text-right">
                  <h2 className="text-xl sm:text-2xl font-bold text-blue-600 mb-1 sm:mb-2">Mr. Mobile</h2>
                  <p className="text-xs sm:text-sm text-gray-600">Mobile Shop Management</p>
                  <p className="text-xs sm:text-sm text-gray-600">Pakistan</p>
                </div>
              </div>
            </div>

            {/* Details Section */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-8 mb-6 sm:mb-8">
              {/* Supplier Info */}
              <div className="bg-gray-50 p-3 sm:p-4 rounded-lg">
                <h3 className="text-sm sm:text-base font-semibold text-gray-900 mb-2 sm:mb-3 border-b border-gray-300 pb-2">
                  SUPPLIER INFORMATION
                </h3>
                <div className="space-y-1.5 sm:space-y-2 text-xs sm:text-sm">
                  <div>
                    <span className="text-gray-600">Name:</span>
                    <p className="font-semibold text-gray-900">{purchase?.supplier?.name}</p>
                  </div>
                  <div>
                    <span className="text-gray-600">Contact:</span>
                    <p className="font-semibold text-gray-900">{purchase?.supplier?.contactPerson}</p>
                  </div>
                  <div>
                    <span className="text-gray-600">Phone:</span>
                    <p className="font-semibold text-gray-900">{purchase?.supplier?.phone}</p>
                  </div>
                </div>
              </div>

              {/* Order Info */}
              <div className="bg-gray-50 p-3 sm:p-4 rounded-lg">
                <h3 className="text-sm sm:text-base font-semibold text-gray-900 mb-2 sm:mb-3 border-b border-gray-300 pb-2">
                  ORDER INFORMATION
                </h3>
                <div className="space-y-1.5 sm:space-y-2 text-xs sm:text-sm">
                  <div>
                    <span className="text-gray-600">Order Date:</span>
                    <p className="font-semibold text-gray-900">{formatDateForInvoice(purchase?.orderDate || null)}</p>
                  </div>
                  {purchase?.receivedDate && (
                    <div>
                      <span className="text-gray-600">Received:</span>
                      <p className="font-semibold text-gray-900">{formatDateForInvoice(purchase.receivedDate)}</p>
                    </div>
                  )}
                  <div>
                    <span className="text-gray-600">Status:</span>
                    <p className="font-semibold text-gray-900 uppercase">{purchase?.status}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Items Table */}
            <div className="mb-6 sm:mb-8 overflow-x-auto">
              <h3 className="text-sm sm:text-base font-semibold text-gray-900 mb-3 sm:mb-4">ORDER ITEMS</h3>
              <table className="w-full border-collapse border border-gray-300 text-xs sm:text-sm">
                <thead>
                  <tr className="bg-gray-100">
                    <th className="border border-gray-300 px-2 sm:px-4 py-2 sm:py-3 text-left font-semibold text-gray-900">#</th>
                    <th className="border border-gray-300 px-2 sm:px-4 py-2 sm:py-3 text-left font-semibold text-gray-900">Product</th>
                    <th className="border border-gray-300 px-2 sm:px-4 py-2 sm:py-3 text-center font-semibold text-gray-900">Qty</th>
                    <th className="border border-gray-300 px-2 sm:px-4 py-2 sm:py-3 text-center font-semibold text-gray-900 hidden sm:table-cell">Recv</th>
                    <th className="border border-gray-300 px-2 sm:px-4 py-2 sm:py-3 text-right font-semibold text-gray-900 hidden sm:table-cell">Unit</th>
                    <th className="border border-gray-300 px-2 sm:px-4 py-2 sm:py-3 text-right font-semibold text-gray-900">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {purchase?.items?.map((item, index) => (
                    <tr key={item.id} className="hover:bg-gray-50">
                      <td className="border border-gray-300 px-2 sm:px-4 py-2 sm:py-3 text-gray-900">{index + 1}</td>
                      <td className="border border-gray-300 px-2 sm:px-4 py-2 sm:py-3">
                        <p className="font-semibold text-gray-900 text-xs sm:text-sm">{item.product.name}</p>
                        <p className="text-[10px] sm:text-xs text-gray-600">{item.product.model} • {item.product.sku}</p>
                      </td>
                      <td className="border border-gray-300 px-2 sm:px-4 py-2 sm:py-3 text-center font-semibold">{item.quantity}</td>
                      <td className="border border-gray-300 px-2 sm:px-4 py-2 sm:py-3 text-center hidden sm:table-cell">
                        <span className={item.receivedQty >= item.quantity ? 'text-green-600 font-semibold' : 'text-orange-600'}>
                          {item.receivedQty}
                        </span>
                      </td>
                      <td className="border border-gray-300 px-2 sm:px-4 py-2 sm:py-3 text-right hidden sm:table-cell">{formatCurrency(item.unitCost)}</td>
                      <td className="border border-gray-300 px-2 sm:px-4 py-2 sm:py-3 text-right font-semibold">{formatCurrency(item.totalCost)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Financial Summary */}
            <div className="flex justify-end mb-6 sm:mb-8">
              <div className="w-full sm:w-72 space-y-2 sm:space-y-3">
                <div className="flex justify-between items-center py-2 border-b border-gray-200">
                  <span className="text-xs sm:text-sm text-gray-600">Subtotal:</span>
                  <span className="font-semibold text-gray-900 text-sm sm:text-base">{formatCurrency(purchase?.totalAmount || 0)}</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-gray-200">
                  <span className="text-xs sm:text-sm text-gray-600">Paid:</span>
                  <span className="font-semibold text-green-600 text-sm sm:text-base">{formatCurrency(purchase?.paidAmount || 0)}</span>
                </div>
                <div className="flex justify-between items-center py-2 sm:py-3 bg-gray-100 px-3 sm:px-4 rounded-lg border-2 border-gray-300">
                  <span className="font-semibold text-gray-900 text-xs sm:text-sm">Due:</span>
                  <span className="font-bold text-red-600 text-base sm:text-lg">{formatCurrency(purchase?.dueAmount || 0)}</span>
                </div>
              </div>
            </div>

            {/* Notes */}
            {purchase?.notes && (
              <div className="mb-6 sm:mb-8 border-t border-gray-300 pt-4 sm:pt-6">
                <h3 className="text-sm sm:text-base font-semibold text-gray-900 mb-2">NOTES</h3>
                <p className="text-xs sm:text-sm text-gray-700 whitespace-pre-wrap">{purchase.notes}</p>
              </div>
            )}

            {/* Footer */}
            <div className="border-t-2 border-gray-300 pt-4 sm:pt-6 mt-6 sm:mt-8">
              <div className="grid grid-cols-2 gap-4 sm:gap-8">
                <div>
                  <p className="text-xs sm:text-sm font-semibold text-gray-900 mb-1 sm:mb-2">Authorized By:</p>
                  <div className="border-b border-gray-400 w-32 sm:w-48 mt-8 sm:mt-12"></div>
                  <p className="text-[10px] sm:text-xs text-gray-600 mt-1">Signature & Stamp</p>
                </div>
                <div>
                  <p className="text-xs sm:text-sm font-semibold text-gray-900 mb-1 sm:mb-2">Received By:</p>
                  <div className="border-b border-gray-400 w-32 sm:w-48 mt-8 sm:mt-12"></div>
                  <p className="text-[10px] sm:text-xs text-gray-600 mt-1">Signature & Date</p>
                </div>
              </div>
            </div>

            {/* Print Info */}
            <div className="mt-6 sm:mt-8 text-center text-[10px] sm:text-xs text-gray-500 border-t border-gray-200 pt-3 sm:pt-4">
              <p>This is a computer-generated document. No signature is required.</p>
              <p>Generated on: {new Date().toLocaleString('en-PK')}</p>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </ProtectedRoute>
  )
}

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
  Download
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

  const handleDownloadInvoice = async () => {
    try {
      // Open invoice in new window for printing
      const invoiceWindow = window.open(`/purchases/${purchase?.id}/invoice`, '_blank')
      if (!invoiceWindow) {
        showError('Please allow pop-ups to download invoice')
      }
    } catch (error) {
      showError('Failed to open invoice')
    }
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

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-PK', {
      style: 'currency',
      currency: 'PKR',
      minimumFractionDigits: 0
    }).format(amount)
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
      <div className="flex min-h-screen bg-gray-50 dark:bg-gray-900">
        <BusinessSidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
        <div className={`flex-1 ${sidebarOpen ? 'lg:ml-20' : 'lg:ml-64'} transition-all duration-300`}>
          <div className="max-w-7xl mx-auto px-4 py-8 w-full">
            <TopNavigation onMenuClick={() => setSidebarOpen(!sidebarOpen)} />

            {/* Header */}
            <div className="bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-700 text-white rounded-xl mb-6">
              <div className="px-8 py-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <button
                      onClick={() => router.push('/purchases')}
                      className="p-2 bg-white/10 hover:bg-white/20 rounded-lg transition-all"
                    >
                      <ArrowLeft className="h-5 w-5" />
                    </button>
                    <div>
                      <h1 className="text-3xl font-bold">{purchase.invoiceNumber}</h1>
                      <p className="text-blue-100 mt-1">Purchase Order Details</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    {getStatusBadge(purchase.status)}
                  </div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Main Content */}
              <div className="lg:col-span-2 space-y-6">
                {/* Supplier Info */}
                <Card>
                  <CardHeader>
                    <CardTitle>Supplier Information</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm text-gray-500">Supplier Name</p>
                        <p className="font-semibold">{purchase.supplier.name}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Contact Person</p>
                        <p className="font-semibold">{purchase.supplier.contactPerson}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Phone</p>
                        <p className="font-semibold">{purchase.supplier.phone}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Order Date</p>
                        <p className="font-semibold">{formatDate(purchase.orderDate)}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Purchase Items */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                      <span>Order Items</span>
                      <span className="text-sm font-normal text-gray-500">
                        {purchase.items.length} item{purchase.items.length !== 1 ? 's' : ''}
                      </span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {purchase.items.map((item, index) => {
                        const receivedPercentage = (item.receivedQty / item.quantity) * 100
                        const isFullyReceived = item.receivedQty >= item.quantity
                        const isPending = item.receivedQty === 0
                        
                        return (
                          <div 
                            key={item.id} 
                            className={`border rounded-lg p-4 transition-all ${
                              isFullyReceived 
                                ? 'bg-green-50 border-green-200' 
                                : isPending 
                                ? 'bg-gray-50 border-gray-200'
                                : 'bg-blue-50 border-blue-200'
                            }`}
                          >
                            <div className="flex justify-between items-start mb-3">
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-1">
                                  <p className="font-semibold text-gray-900">{item.product.name}</p>
                                  {isFullyReceived && (
                                    <Badge className="bg-green-500 text-white text-xs">
                                      <CheckCircle className="h-3 w-3 mr-1" />
                                      Complete
                                    </Badge>
                                  )}
                                  {!isFullyReceived && !isPending && (
                                    <Badge className="bg-blue-500 text-white text-xs">
                                      Partial
                                    </Badge>
                                  )}
                                  {isPending && (
                                    <Badge className="bg-gray-500 text-white text-xs">
                                      Pending
                                    </Badge>
                                  )}
                                </div>
                                <p className="text-sm text-gray-600">
                                  {item.product.model} • SKU: {item.product.sku}
                                </p>
                              </div>
                              <div className="text-right">
                                <p className="font-semibold text-lg text-gray-900">
                                  {formatCurrency(item.totalCost)}
                                </p>
                                <p className="text-sm text-gray-600">
                                  {formatCurrency(item.unitCost)} × {item.quantity}
                                </p>
                              </div>
                            </div>
                            
                            {/* Progress Section */}
                            <div className="space-y-2">
                              <div className="flex items-center justify-between text-sm">
                                <span className="text-gray-600 font-medium">Receiving Progress</span>
                                <span className={`font-semibold ${
                                  isFullyReceived 
                                    ? 'text-green-600' 
                                    : isPending 
                                    ? 'text-gray-500'
                                    : 'text-blue-600'
                                }`}>
                                  {item.receivedQty}/{item.quantity} units ({Math.round(receivedPercentage)}%)
                                </span>
                              </div>
                              <div className="relative bg-gray-200 rounded-full h-2.5 overflow-hidden">
                                <div
                                  className={`h-2.5 rounded-full transition-all duration-500 ${
                                    isFullyReceived 
                                      ? 'bg-green-500' 
                                      : 'bg-blue-500'
                                  }`}
                                  style={{ width: `${receivedPercentage}%` }}
                                />
                              </div>
                              {item.quantity - item.receivedQty > 0 && (
                                <p className="text-xs text-orange-600 font-medium">
                                  ⏳ Pending: {item.quantity - item.receivedQty} units remaining
                                </p>
                              )}
                            </div>
                          </div>
                        )
                      })}
                    </div>

                    {purchase.status === 'ORDERED' && (
                      <Button
                        className="w-full mt-4"
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
                  <Card>
                    <CardHeader>
                      <CardTitle>Notes</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-gray-700">{purchase.notes}</p>
                    </CardContent>
                  </Card>
                )}
              </div>

              {/* Sidebar */}
              <div className="space-y-6">
                {/* Financial Summary */}
                <Card>
                  <CardHeader>
                    <CardTitle>Financial Summary</CardTitle>
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
                <Card>
                  <CardHeader>
                    <CardTitle>Status Management</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="space-y-2">
                      <Label>Change Status</Label>
                      <Select
                        value={purchase.status}
                        onValueChange={(value) => handleStatusChange(value as PurchaseStatus)}
                        disabled={updating}
                      >
                        <SelectTrigger>
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
                        className="w-full"
                        onClick={handleMarkCompleted}
                        disabled={updating}
                      >
                        <CheckCircle className="h-4 w-4 mr-2" />
                        Mark as Completed
                      </Button>
                    )}

                    {purchase.status === 'RECEIVED' && purchase.dueAmount > 0 && (
                      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                        <p className="text-sm text-yellow-800">
                          ⚠️ Clear all dues to mark as completed
                        </p>
                      </div>
                    )}

                    {purchase.status === 'COMPLETED' && (
                      <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                        <p className="text-sm text-green-800">
                          ✅ Purchase order completed!
                        </p>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Quick Actions */}
                <Card>
                  <CardHeader>
                    <CardTitle>Actions</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <Button 
                      variant="outline" 
                      className="w-full justify-start hover:bg-blue-50"
                      onClick={handleDownloadInvoice}
                    >
                      <Download className="h-4 w-4 mr-2" />
                      Download Invoice
                    </Button>
                    <Button 
                      variant="outline" 
                      className="w-full justify-start text-red-600 hover:text-red-700 hover:bg-red-50"
                      onClick={handleDeletePurchase}
                      disabled={deleting || purchase.status === 'COMPLETED'}
                    >
                      {deleting ? (
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      ) : (
                        <Trash2 className="h-4 w-4 mr-2" />
                      )}
                      {deleting ? 'Deleting...' : 'Delete Purchase'}
                    </Button>
                    {purchase.status === 'COMPLETED' && (
                      <p className="text-xs text-gray-500 mt-2">
                        ℹ️ Completed purchases cannot be deleted
                      </p>
                    )}
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  )
}

'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/use-auth'
import { useNotify } from '@/hooks/use-notifications'
import { ProtectedRoute } from '@/components/auth/protected-route'
import { TopNavigation } from '@/components/layout/TopNavigation'
import { BusinessSidebar } from '@/components/layout/BusinessSidebar'
import { UserRole, PurchaseStatus } from '@/types'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import {
  ShoppingCart,
  Search,
  ArrowLeft,
  Plus,
  FileText,
  DollarSign,
  Package,
  CheckCircle,
  Clock,
  XCircle,
  AlertCircle,
  Eye,
  RefreshCw,
  TrendingUp
} from 'lucide-react'
import { formatUserRole } from '@/utils/user-formatting'

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
  purchaseDate: string
  receivedDate?: string
  notes?: string
  _count: {
    items: number
  }
}

export default function PurchaseManagementPage() {
  const router = useRouter()
  const { user: currentUser } = useAuth()
  const { success, error: showError } = useNotify()

  const [purchases, setPurchases] = useState<Purchase[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('ALL')
  const [sidebarOpen, setSidebarOpen] = useState(false)

  // Get current shop ID
  const [currentShopId, setCurrentShopId] = useState<string | null>(null)

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
          if (data.shops && data.shops.length > 0) {
            setCurrentShopId(data.shops[0].id)
          }
        }
      } catch (error) {
        console.error('Error fetching user shop:', error)
      }
    }
    
    fetchUserShop()
  }, [currentUser])

  const fetchPurchases = async () => {
    if (!currentShopId) return
    
    try {
      setLoading(true)
      const params = new URLSearchParams({ limit: '50' })
      if (searchTerm) params.append('search', searchTerm)
      if (statusFilter !== 'ALL') params.append('status', statusFilter)

      const response = await fetch(`/api/purchases?${params}`)
      if (!response.ok) throw new Error('Failed to fetch purchases')
      
      const data = await response.json()
      setPurchases(data.data?.purchases || [])
    } catch (error) {
      console.error('Error fetching purchases:', error)
      showError('Failed to load purchases')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (currentShopId) {
      fetchPurchases()
    }
  }, [currentShopId, searchTerm, statusFilter])

  const handleBack = () => {
    if (currentUser?.role === UserRole.SUPER_ADMIN) {
      router.push('/dashboard/admin')
    } else if (currentUser?.role === UserRole.SHOP_OWNER) {
      router.push('/dashboard/owner')
    } else {
      router.push('/dashboard/worker')
    }
  }

  const getStatusBadge = (status: PurchaseStatus) => {
    const statusConfig = {
      DRAFT: { color: 'bg-gray-100 text-gray-800', icon: <FileText className="h-4 w-4" /> },
      ORDERED: { color: 'bg-blue-100 text-blue-800', icon: <Clock className="h-4 w-4" /> },
      PARTIAL: { color: 'bg-yellow-100 text-yellow-800', icon: <AlertCircle className="h-4 w-4" /> },
      RECEIVED: { color: 'bg-green-100 text-green-800', icon: <CheckCircle className="h-4 w-4" /> },
      COMPLETED: { color: 'bg-emerald-100 text-emerald-800', icon: <CheckCircle className="h-4 w-4" /> },
      CANCELLED: { color: 'bg-red-100 text-red-800', icon: <XCircle className="h-4 w-4" /> }
    }
    return statusConfig[status] || statusConfig.DRAFT
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-PK', { 
      style: 'currency', 
      currency: 'PKR', 
      minimumFractionDigits: 0 
    }).format(amount)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-PK', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  // Calculate statistics
  const stats = {
    total: purchases.length,
    totalValue: purchases.reduce((sum, p) => sum + Number(p.totalAmount), 0),
    totalPaid: purchases.reduce((sum, p) => sum + Number(p.paidAmount), 0),
    totalDue: purchases.reduce((sum, p) => sum + Number(p.dueAmount), 0),
    draft: purchases.filter(p => p.status === 'DRAFT').length,
    ordered: purchases.filter(p => p.status === 'ORDERED').length,
    received: purchases.filter(p => p.status === 'RECEIVED' || p.status === 'COMPLETED').length
  }

  return (
    <ProtectedRoute allowedRoles={[UserRole.SUPER_ADMIN, UserRole.SHOP_OWNER, UserRole.SHOP_WORKER]}>
      <div className="flex min-h-screen bg-gray-50 dark:bg-gray-900">
        <BusinessSidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
        <div className={`flex-1 flex flex-col min-h-screen ${sidebarOpen ? 'lg:ml-20' : 'lg:ml-64'} transition-all duration-300`}>
          <div className="max-w-7xl mx-auto px-4 py-8 w-full">
            {/* Top Navigation */}
            <TopNavigation onMenuClick={() => setSidebarOpen(!sidebarOpen)} />

            {/* Main Content */}
            <div className="flex-1 bg-gray-50 dark:bg-gray-900">
              {/* Header */}
              <div className="bg-gradient-to-r from-orange-600 to-orange-700 text-white">
                <div className="px-8 py-12">
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-4">
                      <button 
                        onClick={handleBack} 
                        className="p-3 bg-white/10 hover:bg-white/20 rounded-xl transition-all duration-200"
                      >
                        <ArrowLeft className="h-5 w-5 text-white" />
                      </button>
                      <div>
                        <h1 className="text-4xl font-bold mb-2">🛒 Purchase Management</h1>
                        <p className="text-orange-100 text-lg">Track orders, suppliers, and inventory purchases</p>
                      </div>
                    </div>
                    <div className="flex gap-3">
                      <Button
                        onClick={fetchPurchases}
                        variant="ghost"
                        className="bg-white/10 hover:bg-white/20 text-white"
                      >
                        <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                        Refresh
                      </Button>
                      {[UserRole.SUPER_ADMIN, UserRole.SHOP_OWNER].includes(currentUser?.role as UserRole) && (
                        <Button
                          onClick={() => router.push('/purchases/new')}
                          className="bg-white text-blue-600 hover:bg-blue-50"
                        >
                          <Plus className="h-4 w-4 mr-2" />
                          New Purchase Order
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              <div className="px-8 py-8 space-y-8">
                {/* Statistics */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <Card className="bg-gradient-to-br from-orange-500 to-orange-600 text-white shadow-lg">
                    <CardContent className="p-6">
                      <ShoppingCart className="h-8 w-8 mb-2 text-white opacity-90" />
                      <p className="text-white opacity-90 text-sm">Total Purchases</p>
                      <p className="text-3xl font-bold">{stats.total}</p>
                      <p className="text-xs text-white opacity-80 mt-1">
                        {formatCurrency(stats.totalValue)}
                      </p>
                    </CardContent>
                  </Card>
                  
                  <Card className="bg-gradient-to-br from-green-500 to-green-600 text-white shadow-lg">
                    <CardContent className="p-6">
                      <CheckCircle className="h-8 w-8 mb-2 text-white opacity-90" />
                      <p className="text-white opacity-90 text-sm">Amount Paid</p>
                      <p className="text-2xl font-bold">{formatCurrency(stats.totalPaid)}</p>
                    </CardContent>
                  </Card>

                  <Card className="bg-gradient-to-br from-red-500 to-red-600 text-white shadow-lg">
                    <CardContent className="p-6">
                      <AlertCircle className="h-8 w-8 mb-2 text-white opacity-90" />
                      <p className="text-white opacity-90 text-sm">Amount Due</p>
                      <p className="text-2xl font-bold">{formatCurrency(stats.totalDue)}</p>
                    </CardContent>
                  </Card>

                  <Card className="bg-gradient-to-br from-blue-500 to-blue-600 text-white shadow-lg">
                    <CardContent className="p-6">
                      <Package className="h-8 w-8 mb-2 text-white opacity-90" />
                      <p className="text-white opacity-90 text-sm">Status Overview</p>
                      <div className="text-sm mt-2 space-y-1">
                        <p>Draft: {stats.draft} • Ordered: {stats.ordered}</p>
                        <p>Received: {stats.received}</p>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Filters */}
                <Card>
                  <CardContent className="p-6">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="relative col-span-2">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <Input
                          type="text"
                          placeholder="Search by invoice number..."
                          value={searchTerm}
                          onChange={(e) => setSearchTerm(e.target.value)}
                          className="pl-10"
                        />
                      </div>
                      <Select value={statusFilter} onValueChange={setStatusFilter}>
                        <SelectTrigger>
                          <SelectValue placeholder="Filter by status" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="ALL">All Status</SelectItem>
                          <SelectItem value="DRAFT">Draft</SelectItem>
                          <SelectItem value="ORDERED">Ordered</SelectItem>
                          <SelectItem value="PARTIAL">Partially Received</SelectItem>
                          <SelectItem value="RECEIVED">Received</SelectItem>
                          <SelectItem value="COMPLETED">Completed</SelectItem>
                          <SelectItem value="CANCELLED">Cancelled</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </CardContent>
                </Card>

                {/* Purchase List */}
                <Card>
                  <CardContent className="p-6">
                    <h3 className="text-xl font-semibold text-gray-900 mb-6">Purchase Orders</h3>
                    
                    {loading ? (
                      <div className="flex justify-center py-12">
                        <RefreshCw className="h-8 w-8 animate-spin text-gray-400" />
                      </div>
                    ) : purchases.length === 0 ? (
                      <div className="text-center py-12">
                        <ShoppingCart className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                        <p className="text-gray-500 text-lg">No purchases found</p>
                        <p className="text-gray-400 text-sm mt-2">Create your first purchase order to get started</p>
                        {[UserRole.SUPER_ADMIN, UserRole.SHOP_OWNER].includes(currentUser?.role as UserRole) && (
                          <Button
                            onClick={() => router.push('/purchases/new')}
                            className="mt-4"
                          >
                            <Plus className="h-4 w-4 mr-2" />
                            Create Purchase Order
                          </Button>
                        )}
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {purchases.map((purchase) => {
                          const badge = getStatusBadge(purchase.status)
                          const paymentPercentage = (Number(purchase.paidAmount) / Number(purchase.totalAmount)) * 100

                          return (
                            <div 
                              key={purchase.id} 
                              className="border border-gray-200 rounded-lg p-5 hover:shadow-md transition-shadow cursor-pointer"
                              onClick={() => router.push(`/purchases/${purchase.id}`)}
                            >
                              <div className="flex items-start justify-between">
                                <div className="flex-1">
                                  <div className="flex items-center gap-3 mb-2">
                                    <h4 className="font-semibold text-lg text-gray-900">
                                      {purchase.invoiceNumber}
                                    </h4>
                                    <Badge className={badge.color}>
                                      <span className="flex items-center gap-1">
                                        {badge.icon}
                                        {purchase.status}
                                      </span>
                                    </Badge>
                                  </div>
                                  
                                  <div className="grid grid-cols-2 gap-4 mt-3">
                                    <div>
                                      <p className="text-sm text-gray-600">Supplier</p>
                                      <p className="font-medium text-gray-900">{purchase.supplier.name}</p>
                                      <p className="text-xs text-gray-500">{purchase.supplier.phone}</p>
                                    </div>
                                    
                                    <div>
                                      <p className="text-sm text-gray-600">Purchase Date</p>
                                      <p className="font-medium text-gray-900">{formatDate(purchase.purchaseDate)}</p>
                                      {purchase.receivedDate && (
                                        <p className="text-xs text-gray-500">
                                          Received: {formatDate(purchase.receivedDate)}
                                        </p>
                                      )}
                                    </div>
                                  </div>

                                  {/* Payment Progress */}
                                  <div className="mt-4">
                                    <div className="flex justify-between text-sm text-gray-600 mb-1">
                                      <span>Payment Progress</span>
                                      <span>{paymentPercentage.toFixed(0)}%</span>
                                    </div>
                                    <div className="w-full bg-gray-200 rounded-full h-2">
                                      <div 
                                        className="bg-green-500 h-2 rounded-full transition-all" 
                                        style={{ width: `${paymentPercentage}%` }}
                                      />
                                    </div>
                                  </div>
                                </div>

                                <div className="text-right ml-6">
                                  <p className="text-sm text-gray-600">Total Amount</p>
                                  <p className="text-2xl font-bold text-gray-900">
                                    {formatCurrency(Number(purchase.totalAmount))}
                                  </p>
                                  
                                  <div className="mt-2 space-y-1">
                                    <p className="text-xs text-green-600">
                                      Paid: {formatCurrency(Number(purchase.paidAmount))}
                                    </p>
                                    {Number(purchase.dueAmount) > 0 && (
                                      <p className="text-xs text-red-600">
                                        Due: {formatCurrency(Number(purchase.dueAmount))}
                                      </p>
                                    )}
                                  </div>

                                  <p className="text-xs text-gray-500 mt-2">
                                    {purchase._count.items} items
                                  </p>

                                  <Button
                                    size="sm"
                                    variant="outline"
                                    className="mt-3 gap-1"
                                    onClick={(e) => {
                                      e.stopPropagation()
                                      router.push(`/purchases/${purchase.id}`)
                                    }}
                                  >
                                    <Eye className="h-4 w-4" />
                                    View Details
                                  </Button>
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
        </div>
      </div>
    </ProtectedRoute>
  )
}

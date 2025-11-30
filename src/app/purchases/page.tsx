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
      <div className="flex min-h-screen bg-gradient-to-br from-slate-50 via-gray-50 to-orange-50/30 dark:from-gray-900 dark:via-gray-900 dark:to-gray-900">
        <BusinessSidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
        <div className={`flex-1 flex flex-col min-h-screen ${sidebarOpen ? 'lg:ml-20' : 'lg:ml-64'} transition-all duration-300`}>
          <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-6 py-4 sm:py-6 lg:py-8 w-full">
            {/* Top Navigation */}
            <TopNavigation onMenuClick={() => setSidebarOpen(!sidebarOpen)} />

            {/* Main Content */}
            <div className="flex-1 space-y-4 sm:space-y-6">
              {/* Header - Compact on Mobile */}
              <div className="relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-orange-500 via-orange-600 to-red-600 rounded-xl sm:rounded-2xl"></div>
                <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmZmZmYiIGZpbGwtb3BhY2l0eT0iMC4wNSI+PHBhdGggZD0iTTM2IDM0djItSDI0di0yaDEyek0zNiAzMHYySDI0di0yaDEyek0zNiAyNnYySDI0di0yaDEyeiIvPjwvZz48L2c+PC9zdmc+')] opacity-30"></div>
                <div className="relative px-4 sm:px-6 py-4 sm:py-5">
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      <button 
                        onClick={handleBack} 
                        className="p-2 sm:p-2.5 bg-white/20 hover:bg-white/30 active:scale-95 rounded-lg sm:rounded-xl transition-all shrink-0 backdrop-blur-sm"
                      >
                        <ArrowLeft className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
                      </button>
                      <div className="min-w-0 flex-1">
                        <h1 className="text-lg sm:text-xl lg:text-2xl font-bold text-white flex items-center gap-2">
                          <span className="hidden sm:inline">🛒</span> Purchase Management
                        </h1>
                        <p className="text-orange-100 text-xs sm:text-sm mt-0.5 truncate">Track orders & suppliers</p>
                      </div>
                    </div>
                    <div className="flex gap-2 shrink-0">
                      <Button
                        onClick={fetchPurchases}
                        variant="ghost"
                        size="icon"
                        className="bg-white/10 hover:bg-white/20 text-white h-9 w-9 sm:h-10 sm:w-10"
                      >
                        <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                      </Button>
                      {[UserRole.SUPER_ADMIN, UserRole.SHOP_OWNER].includes(currentUser?.role as UserRole) && (
                        <Button
                          onClick={() => router.push('/purchases/new')}
                          className="bg-white text-orange-600 hover:bg-orange-50 h-9 sm:h-10 px-3 sm:px-4 text-xs sm:text-sm"
                        >
                          <Plus className="h-4 w-4 sm:mr-1.5" />
                          <span className="hidden sm:inline">New Order</span>
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Statistics - 4 Column Grid, 2 on Mobile */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3">
                <Card className="bg-gradient-to-br from-orange-500 to-orange-600 text-white shadow-md border-0">
                  <CardContent className="p-3 sm:p-4">
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="text-white/80 text-[10px] sm:text-xs uppercase tracking-wide">Total Orders</p>
                        <p className="text-xl sm:text-2xl font-bold mt-0.5">{stats.total}</p>
                        <p className="text-[10px] sm:text-xs text-white/70 mt-1 truncate">{formatCurrency(stats.totalValue)}</p>
                      </div>
                      <ShoppingCart className="h-5 w-5 sm:h-6 sm:w-6 text-white/80 shrink-0" />
                    </div>
                  </CardContent>
                </Card>
                
                <Card className="bg-gradient-to-br from-emerald-500 to-green-600 text-white shadow-md border-0">
                  <CardContent className="p-3 sm:p-4">
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="text-white/80 text-[10px] sm:text-xs uppercase tracking-wide">Paid</p>
                        <p className="text-base sm:text-xl font-bold mt-0.5 truncate">{formatCurrency(stats.totalPaid)}</p>
                      </div>
                      <CheckCircle className="h-5 w-5 sm:h-6 sm:w-6 text-white/80 shrink-0" />
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-gradient-to-br from-red-500 to-rose-600 text-white shadow-md border-0">
                  <CardContent className="p-3 sm:p-4">
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="text-white/80 text-[10px] sm:text-xs uppercase tracking-wide">Due</p>
                        <p className="text-base sm:text-xl font-bold mt-0.5 truncate">{formatCurrency(stats.totalDue)}</p>
                      </div>
                      <AlertCircle className="h-5 w-5 sm:h-6 sm:w-6 text-white/80 shrink-0" />
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-gradient-to-br from-blue-500 to-indigo-600 text-white shadow-md border-0">
                  <CardContent className="p-3 sm:p-4">
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="text-white/80 text-[10px] sm:text-xs uppercase tracking-wide">Status</p>
                        <div className="text-[10px] sm:text-xs mt-1 space-y-0.5">
                          <p>📝 {stats.draft} Draft</p>
                          <p>📦 {stats.ordered} Ordered • ✅ {stats.received} Done</p>
                        </div>
                      </div>
                      <Package className="h-5 w-5 sm:h-6 sm:w-6 text-white/80 shrink-0" />
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Filters */}
              <Card className="shadow-sm border-0 bg-white dark:bg-gray-800">
                <CardContent className="p-3 sm:p-4">
                  <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
                    <div className="relative flex-1">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <Input
                        type="text"
                        placeholder="Search invoices..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-9 h-9 sm:h-10 text-sm"
                      />
                    </div>
                    <Select value={statusFilter} onValueChange={setStatusFilter}>
                      <SelectTrigger className="w-full sm:w-[140px] h-9 sm:h-10 text-sm">
                        <SelectValue placeholder="Status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="ALL">All Status</SelectItem>
                        <SelectItem value="DRAFT">Draft</SelectItem>
                        <SelectItem value="ORDERED">Ordered</SelectItem>
                        <SelectItem value="PARTIAL">Partial</SelectItem>
                        <SelectItem value="RECEIVED">Received</SelectItem>
                        <SelectItem value="COMPLETED">Completed</SelectItem>
                        <SelectItem value="CANCELLED">Cancelled</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </CardContent>
              </Card>

              {/* Purchase List */}
              <Card className="shadow-sm border-0 bg-white dark:bg-gray-800">
                <CardContent className="p-3 sm:p-4">
                  <div className="flex items-center justify-between mb-3 sm:mb-4">
                    <h3 className="text-sm sm:text-base font-semibold text-gray-900 dark:text-white">Purchase Orders</h3>
                    <span className="text-xs text-gray-500 bg-gray-100 dark:bg-gray-700 px-2 py-0.5 rounded-full">{purchases.length}</span>
                  </div>
                    
                    {loading ? (
                      <div className="flex justify-center py-8 sm:py-12">
                        <RefreshCw className="h-6 w-6 sm:h-8 sm:w-8 animate-spin text-gray-400" />
                      </div>
                    ) : purchases.length === 0 ? (
                      <div className="text-center py-8 sm:py-12">
                        <ShoppingCart className="h-10 w-10 sm:h-14 sm:w-14 text-gray-300 mx-auto mb-3" />
                        <p className="text-gray-500 text-sm sm:text-base">No purchases found</p>
                        <p className="text-gray-400 text-xs sm:text-sm mt-1">Create your first order</p>
                        {[UserRole.SUPER_ADMIN, UserRole.SHOP_OWNER].includes(currentUser?.role as UserRole) && (
                          <Button
                            onClick={() => router.push('/purchases/new')}
                            className="mt-3 h-9 text-sm"
                          >
                            <Plus className="h-4 w-4 mr-1.5" />
                            Create Order
                          </Button>
                        )}
                      </div>
                    ) : (
                      <div className="space-y-2 sm:space-y-3">
                        {purchases.map((purchase) => {
                          const badge = getStatusBadge(purchase.status)
                          const paymentPercentage = (Number(purchase.paidAmount) / Number(purchase.totalAmount)) * 100

                          return (
                            <div 
                              key={purchase.id} 
                              className="border border-gray-200 dark:border-gray-700 rounded-xl p-3 sm:p-4 hover:shadow-md hover:border-orange-200 dark:hover:border-orange-800 transition-all cursor-pointer active:scale-[0.99] bg-gradient-to-br from-white to-gray-50/50 dark:from-gray-800 dark:to-gray-800"
                              onClick={() => router.push(`/purchases/${purchase.id}`)}
                            >
                              {/* Mobile Layout */}
                              <div className="sm:hidden space-y-3">
                                <div className="flex items-start justify-between">
                                  <div className="min-w-0 flex-1">
                                    <div className="flex items-center gap-2 flex-wrap">
                                      <h4 className="font-semibold text-sm text-gray-900 dark:text-white">{purchase.invoiceNumber}</h4>
                                      <Badge className={`${badge.color} text-[10px] px-1.5 py-0`}>
                                        {purchase.status}
                                      </Badge>
                                    </div>
                                    <p className="text-xs text-gray-600 dark:text-gray-400 mt-0.5">{purchase.supplier.name}</p>
                                  </div>
                                  <div className="text-right shrink-0">
                                    <p className="text-sm font-bold text-gray-900 dark:text-white">{formatCurrency(Number(purchase.totalAmount))}</p>
                                    <p className="text-[10px] text-gray-500">{formatDate(purchase.purchaseDate)}</p>
                                  </div>
                                </div>
                                
                                <div className="flex items-center justify-between gap-3">
                                  <div className="flex-1">
                                    <div className="flex justify-between text-[10px] text-gray-500 mb-1">
                                      <span>Payment</span>
                                      <span className="font-medium">{paymentPercentage.toFixed(0)}%</span>
                                    </div>
                                    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1.5">
                                      <div 
                                        className="bg-emerald-500 h-1.5 rounded-full transition-all" 
                                        style={{ width: `${Math.min(paymentPercentage, 100)}%` }}
                                      />
                                    </div>
                                  </div>
                                  <div className="flex gap-2 text-[10px] shrink-0">
                                    <span className="text-emerald-600">✓ {formatCurrency(Number(purchase.paidAmount))}</span>
                                    {Number(purchase.dueAmount) > 0 && (
                                      <span className="text-red-500">• {formatCurrency(Number(purchase.dueAmount))} due</span>
                                    )}
                                  </div>
                                </div>
                              </div>

                              {/* Desktop Layout */}
                              <div className="hidden sm:flex items-start justify-between gap-4">
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-2 sm:gap-3 mb-2">
                                    <h4 className="font-semibold text-base text-gray-900 dark:text-white truncate">
                                      {purchase.invoiceNumber}
                                    </h4>
                                    <Badge className={`${badge.color} text-xs`}>
                                      <span className="flex items-center gap-1">
                                        {badge.icon}
                                        <span>{purchase.status}</span>
                                      </span>
                                    </Badge>
                                  </div>
                                  
                                  <div className="grid grid-cols-2 gap-3 mt-2">
                                    <div>
                                      <p className="text-xs text-gray-600 dark:text-gray-400">Supplier</p>
                                      <p className="font-medium text-gray-900 dark:text-white text-sm truncate">{purchase.supplier.name}</p>
                                      <p className="text-xs text-gray-500 dark:text-gray-400">{purchase.supplier.phone}</p>
                                    </div>
                                    
                                    <div>
                                      <p className="text-xs text-gray-600 dark:text-gray-400">Date</p>
                                      <p className="font-medium text-gray-900 dark:text-white text-sm">{formatDate(purchase.purchaseDate)}</p>
                                      {purchase.receivedDate && (
                                        <p className="text-xs text-gray-500 dark:text-gray-400">Rcvd: {formatDate(purchase.receivedDate)}</p>
                                      )}
                                    </div>
                                  </div>

                                  <div className="mt-3">
                                    <div className="flex justify-between text-xs text-gray-600 dark:text-gray-400 mb-1">
                                      <span>Payment</span>
                                      <span>{paymentPercentage.toFixed(0)}%</span>
                                    </div>
                                    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1.5">
                                      <div 
                                        className="bg-emerald-500 h-1.5 rounded-full transition-all" 
                                        style={{ width: `${Math.min(paymentPercentage, 100)}%` }}
                                      />
                                    </div>
                                  </div>
                                </div>

                                <div className="flex flex-col items-end justify-between gap-2 ml-4">
                                  <div className="text-right">
                                    <p className="text-xs text-gray-600 dark:text-gray-400">Total</p>
                                    <p className="text-xl font-bold text-gray-900 dark:text-white">
                                      {formatCurrency(Number(purchase.totalAmount))}
                                    </p>
                                    
                                    <div className="mt-1 space-y-0.5">
                                      <p className="text-xs text-emerald-600">
                                        Paid: {formatCurrency(Number(purchase.paidAmount))}
                                      </p>
                                      {Number(purchase.dueAmount) > 0 && (
                                        <p className="text-xs text-red-600">
                                          Due: {formatCurrency(Number(purchase.dueAmount))}
                                        </p>
                                      )}
                                    </div>

                                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                      {purchase._count.items} items
                                    </p>
                                  </div>

                                  <Button
                                    size="sm"
                                    variant="outline"
                                    className="gap-1.5 text-xs h-8 px-3 mt-2"
                                    onClick={(e) => {
                                      e.stopPropagation()
                                      router.push(`/purchases/${purchase.id}`)
                                    }}
                                  >
                                    <Eye className="h-3.5 w-3.5" />
                                    View
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
    </ProtectedRoute>
  )
}

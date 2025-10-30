'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/use-auth'
import { useNotify } from '@/hooks/use-notifications'
import { ProtectedRoute } from '@/components/auth/protected-route'
import { ShiftGuard } from '@/components/auth/shift-guard'
import { TopNavigation } from '@/components/layout/TopNavigation'
import { UserRole } from '@/types'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { BusinessSidebar } from '@/components/layout/BusinessSidebar'
import {
  Package,
  Search,
  ArrowLeft,
  Plus,
  Minus,
  AlertTriangle,
  TrendingUp,
  TrendingDown,
  BarChart,
  RefreshCw
} from 'lucide-react'

interface InventoryItem {
  id: string
  productId: string
  productName: string
  sku: string
  model: string
  currentStock: number
  lowStockThreshold: number
  reorderPoint: number
  status: string
  category: string
  brand: string
  costPrice: number
  sellingPrice: number
  lastRestocked: string
}

function InventoryManagementPage() {
  const router = useRouter()
  const { user: currentUser } = useAuth()
  const { success, error: showError } = useNotify()

  // Check if user is owner (can perform all actions)
  const isOwner = currentUser?.role === UserRole.SHOP_OWNER || currentUser?.role === UserRole.SUPER_ADMIN
  const isWorker = currentUser?.role === UserRole.SHOP_WORKER

  const [inventory, setInventory] = useState<InventoryItem[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [showAdjustDialog, setShowAdjustDialog] = useState(false)
  const [selectedItem, setSelectedItem] = useState<InventoryItem | null>(null)
  const [adjustmentType, setAdjustmentType] = useState<'add' | 'remove'>('add')
  const [adjustmentQty, setAdjustmentQty] = useState('')
  const [adjustmentReason, setAdjustmentReason] = useState('')
  const [sidebarOpen, setSidebarOpen] = useState(false)

  // Get current shop ID from user
  const [currentShopId, setCurrentShopId] = useState<string | null>(null)

  // Fetch user's shop
  useEffect(() => {
    const fetchUserShop = async () => {
      if (!currentUser) return
      
      try {
        // For shop owners, get their owned shop
        if (currentUser.role === UserRole.SHOP_OWNER) {
          const response = await fetch(`/api/shops?ownerId=${currentUser.id}`)
          const data = await response.json()
          if (data.shops && data.shops.length > 0) {
            setCurrentShopId(data.shops[0].id)
          }
        } 
        // For shop workers, get their assigned shop from ShopWorker table
        else if (currentUser.role === UserRole.SHOP_WORKER) {
          // Workers should use the shop worker API endpoint
          const response = await fetch(`/api/shop-workers/me`)
          const data = await response.json()
          if (data.shopId) {
            setCurrentShopId(data.shopId)
          } else {
            showError('No shop assigned to this worker')
          }
        }
      } catch (error) {
        console.error('Error fetching user shop:', error)
        showError('Failed to fetch shop information')
      }
    }
    
    fetchUserShop()
  }, [currentUser])

  const fetchInventory = async () => {
    if (!currentShopId) {
      return
    }
    
    try {
      setLoading(true)
      const response = await fetch(`/api/inventory?shopId=${currentShopId}`)
      if (!response.ok) throw new Error('Failed to fetch inventory')
      
      const data = await response.json()
      setInventory(data.inventory || [])
    } catch (error) {
      console.error('Error fetching inventory:', error)
      showError('Failed to load inventory')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (currentShopId) {
      fetchInventory()
    }
  }, [currentShopId])

  const handleBack = () => {
    if (currentUser?.role === UserRole.SUPER_ADMIN) {
      router.push('/dashboard/admin')
    } else if (currentUser?.role === UserRole.SHOP_OWNER) {
      router.push('/dashboard/owner')
    } else {
      router.push('/dashboard/worker')
    }
  }

  const handleStockAdjustment = async () => {
    if (!selectedItem || !adjustmentQty) return

    try {
      if (adjustmentType === 'add') {
        // Add stock
        const response = await fetch('/api/inventory', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            shopId: currentShopId,
            productId: selectedItem.productId,
            quantity: parseInt(adjustmentQty),
            costPrice: selectedItem.costPrice,
            reason: adjustmentReason
          })
        })

        if (!response.ok) throw new Error('Failed to add stock')
        success(`Added ${adjustmentQty} units to stock`)
      } else {
        // Remove stock
        const response = await fetch('/api/inventory', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            shopId: currentShopId,
            productId: selectedItem.productId,
            quantity: parseInt(adjustmentQty),
            reason: adjustmentReason
          })
        })

        if (!response.ok) throw new Error('Failed to remove stock')
        success(`Removed ${adjustmentQty} units from stock`)
      }

      // Refresh inventory
      await fetchInventory()
      
      // Close dialog
      setShowAdjustDialog(false)
      setSelectedItem(null)
      setAdjustmentQty('')
      setAdjustmentReason('')
    } catch (error) {
      console.error('Error adjusting stock:', error)
      showError('Failed to adjust stock')
    }
  }

  const filteredInventory = inventory.filter(item => {
    const matchesSearch = !searchTerm || 
      item.productName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.sku.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = statusFilter === 'all' || item.status === statusFilter
    return matchesSearch && matchesStatus
  })

  const stats = {
    total: inventory.length,
    inStock: inventory.filter(i => i.status === 'IN_STOCK').length,
    lowStock: inventory.filter(i => i.status === 'LOW_STOCK').length,
    outOfStock: inventory.filter(i => i.status === 'OUT_OF_STOCK').length,
    totalValue: inventory.reduce((sum, i) => sum + (i.currentStock * i.sellingPrice), 0)
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'IN_STOCK': return { color: 'bg-green-100 text-green-800', icon: <TrendingUp className="h-4 w-4" /> }
      case 'LOW_STOCK': return { color: 'bg-yellow-100 text-yellow-800', icon: <AlertTriangle className="h-4 w-4" /> }
      case 'OUT_OF_STOCK': return { color: 'bg-red-100 text-red-800', icon: <TrendingDown className="h-4 w-4" /> }
      default: return { color: 'bg-gray-100 text-gray-800', icon: <Package className="h-4 w-4" /> }
    }
  }

  return (
    <ProtectedRoute allowedRoles={[UserRole.SUPER_ADMIN, UserRole.SHOP_OWNER, UserRole.SHOP_WORKER]}>
      <div className="flex min-h-screen bg-gray-50 dark:bg-gray-900">
        <BusinessSidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
        
        {/* Main Content Area */}
        <div className={`flex-1 flex flex-col min-h-screen transition-all duration-300 ${sidebarOpen ? 'lg:ml-20' : 'lg:ml-64'}`}>
          {/* Top Navigation */}
          <TopNavigation onMenuClick={() => setSidebarOpen(!sidebarOpen)} />

          {/* Page Content */}
          <div className="flex-1 bg-gray-50 dark:bg-gray-900">
            <div className="bg-gradient-to-r from-orange-600 to-orange-700 text-white">
              <div className="px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                  <div className="flex items-center gap-3 sm:gap-4 w-full sm:w-auto">
                    <button onClick={handleBack} className="p-2 sm:p-3 bg-white/10 hover:bg-white/20 rounded-xl transition-all duration-200 shrink-0">
                      <ArrowLeft className="h-5 w-5 text-white" />
                    </button>
                    <div className="min-w-0 flex-1">
                      <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold mb-1 sm:mb-2 truncate">📦 Inventory Management</h1>
                      <p className="text-orange-100 text-sm sm:text-base lg:text-lg">Real-time stock control</p>
                    </div>
                  </div>
                  <Button
                    onClick={fetchInventory}
                    variant="ghost"
                    className="bg-white/10 hover:bg-white/20 text-white w-full sm:w-auto"
                  >
                    <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                    Refresh
                  </Button>
                </div>
              </div>
            </div>

            <div className="px-4 sm:px-6 lg:px-8 py-4 sm:py-6 lg:py-8 space-y-4 sm:space-y-6 lg:space-y-8">
              {/* Statistics */}
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4">
                <Card className="bg-gradient-to-br from-orange-500 to-orange-600 text-white shadow-lg">
                  <CardContent className="p-4 sm:p-6">
                    <Package className="h-6 w-6 sm:h-8 sm:w-8 mb-2 text-white opacity-90" />
                    <p className="text-white opacity-90 text-xs sm:text-sm">Total Items</p>
                    <p className="text-2xl sm:text-3xl font-bold">{stats.total}</p>
                  </CardContent>
                </Card>
                <Card className="bg-gradient-to-br from-green-500 to-green-600 text-white shadow-lg">
                  <CardContent className="p-4 sm:p-6">
                    <TrendingUp className="h-6 w-6 sm:h-8 sm:w-8 mb-2 text-white opacity-90" />
                    <p className="text-white opacity-90 text-xs sm:text-sm">In Stock</p>
                    <p className="text-2xl sm:text-3xl font-bold">{stats.inStock}</p>
                  </CardContent>
                </Card>
                <Card className="bg-gradient-to-br from-orange-400 to-orange-500 text-white shadow-lg">
                  <CardContent className="p-4 sm:p-6">
                    <AlertTriangle className="h-6 w-6 sm:h-8 sm:w-8 mb-2 text-white opacity-90" />
                    <p className="text-white opacity-90 text-xs sm:text-sm">Low Stock</p>
                    <p className="text-2xl sm:text-3xl font-bold">{stats.lowStock}</p>
                  </CardContent>
                </Card>
                <Card className="bg-gradient-to-br from-red-500 to-red-600 text-white shadow-lg col-span-2 sm:col-span-1">
                  <CardContent className="p-4 sm:p-6">
                    <TrendingDown className="h-6 w-6 sm:h-8 sm:w-8 mb-2 text-white opacity-90" />
                    <p className="text-white opacity-90 text-xs sm:text-sm">Out of Stock</p>
                    <p className="text-2xl sm:text-3xl font-bold">{stats.outOfStock}</p>
                  </CardContent>
                </Card>
                <Card className="bg-gradient-to-br from-green-600 to-green-700 text-white shadow-lg col-span-2 sm:col-span-3 lg:col-span-1">
                  <CardContent className="p-4 sm:p-6">
                    <BarChart className="h-6 w-6 sm:h-8 sm:w-8 mb-2 text-white opacity-90" />
                    <p className="text-white opacity-90 text-xs sm:text-sm">Total Value</p>
                    <p className="text-lg sm:text-xl lg:text-lg font-bold">PKR {(stats.totalValue / 1000).toFixed(0)}K</p>
                  </CardContent>
                </Card>
              </div>

              {/* Search and Filters */}
              <Card>
                <CardContent className="p-4 sm:p-6">
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    <div className="relative sm:col-span-2">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <Input
                        type="text"
                        placeholder="Search by product name or SKU..."
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
                        <SelectItem value="all">All Status</SelectItem>
                        <SelectItem value="IN_STOCK">In Stock</SelectItem>
                        <SelectItem value="LOW_STOCK">Low Stock</SelectItem>
                        <SelectItem value="OUT_OF_STOCK">Out of Stock</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </CardContent>
              </Card>

              {/* Inventory List */}
              <Card>
                <CardContent className="p-6">
                  <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">Stock Levels</h3>
                  
                  {loading ? (
                    <div className="flex justify-center py-12">
                      <RefreshCw className="h-8 w-8 animate-spin text-gray-400 dark:text-gray-500" />
                    </div>
                  ) : filteredInventory.length === 0 ? (
                    <div className="text-center py-12">
                      <Package className="h-16 w-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
                      <p className="text-gray-500 dark:text-gray-400 text-lg">No inventory items found</p>
                      <p className="text-gray-400 dark:text-gray-500 text-sm mt-2">Add products with stock to see them here</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {filteredInventory.map((item) => {
                        const badge = getStatusBadge(item.status)
                        return (
                          <div key={item.id} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 hover:shadow-md transition-shadow">
                            <div className="flex items-center justify-between">
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-2">
                                  <h4 className="font-semibold text-gray-900 dark:text-white">{item.productName}</h4>
                                  <Badge className={badge.color}>
                                    <span className="flex items-center gap-1">
                                      {badge.icon}
                                      {item.status.replace('_', ' ')}
                                    </span>
                                  </Badge>
                                </div>
                                <p className="text-sm text-gray-600 dark:text-gray-300">SKU: {item.sku} • Model: {item.model}</p>
                                <p className="text-sm text-gray-500 dark:text-gray-400">{item.category} • {item.brand}</p>
                                <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                                  Selling Price: PKR {item.sellingPrice.toLocaleString()}
                                </p>
                              </div>
                              <div className="text-right">
                                <p className="text-sm text-gray-600 dark:text-gray-300">Current Stock</p>
                                <p className="text-2xl font-bold text-gray-900 dark:text-white">{item.currentStock}</p>
                                <p className="text-xs text-gray-500 dark:text-gray-400">Threshold: {item.lowStockThreshold}</p>
                                {isOwner && (
                                  <div className="flex gap-2 mt-3">
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      onClick={() => {
                                        setSelectedItem(item)
                                        setAdjustmentType('add')
                                        setShowAdjustDialog(true)
                                      }}
                                      className="gap-1"
                                    >
                                      <Plus className="h-4 w-4" />
                                      Add
                                    </Button>
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      onClick={() => {
                                        setSelectedItem(item)
                                        setAdjustmentType('remove')
                                        setShowAdjustDialog(true)
                                      }}
                                      className="gap-1"
                                      disabled={item.currentStock === 0}
                                    >
                                      <Minus className="h-4 w-4" />
                                      Remove
                                    </Button>
                                  </div>
                                )}
                                {isWorker && (
                                  <div className="text-xs text-gray-400 italic mt-3">
                                    Contact owner to adjust inventory
                                  </div>
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

            {/* Stock Adjustment Dialog */}
            {showAdjustDialog && selectedItem && (
              <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
                <div className="bg-white rounded-xl shadow-2xl max-w-md w-full">
                  <div className="p-6 border-b border-gray-200">
                    <h3 className="text-lg font-semibold text-gray-900">
                      {adjustmentType === 'add' ? 'Add Stock' : 'Remove Stock'}
                    </h3>
                    <p className="text-sm text-gray-600">{selectedItem.productName}</p>
                  </div>
                  <div className="p-6 space-y-4">
                    <div>
                      <Label>Current Stock</Label>
                      <p className="text-2xl font-bold text-gray-900">{selectedItem.currentStock} units</p>
                    </div>
                    <div className="space-y-2">
                      <Label>Quantity to {adjustmentType === 'add' ? 'Add' : 'Remove'} *</Label>
                      <Input
                        type="number"
                        value={adjustmentQty}
                        onChange={(e) => setAdjustmentQty(e.target.value)}
                        placeholder="Enter quantity"
                        min="1"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Reason *</Label>
                      <Input
                        value={adjustmentReason}
                        onChange={(e) => setAdjustmentReason(e.target.value)}
                        placeholder="e.g., New stock arrival, Damaged items, etc."
                      />
                    </div>
                    {adjustmentQty && (
                      <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                        <p className="text-sm text-blue-900">
                          New stock will be: <strong>
                            {adjustmentType === 'add' 
                              ? selectedItem.currentStock + parseInt(adjustmentQty)
                              : selectedItem.currentStock - parseInt(adjustmentQty)
                            } units
                          </strong>
                        </p>
                      </div>
                    )}
                  </div>
                  <div className="p-6 border-t border-gray-200 bg-gray-50 flex gap-3">
                    <Button 
                      variant="outline" 
                      onClick={() => {
                        setShowAdjustDialog(false)
                        setSelectedItem(null)
                        setAdjustmentQty('')
                        setAdjustmentReason('')
                      }} 
                      className="flex-1"
                    >
                      Cancel
                    </Button>
                    <Button 
                      onClick={handleStockAdjustment} 
                      className="flex-1 bg-blue-600 hover:bg-blue-700" 
                      disabled={!adjustmentQty || !adjustmentReason}
                    >
                      Confirm
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </ProtectedRoute>
  )
}

export default function InventoryManagementPageWrapper() {
  const { user } = useAuth()

  // If user is a worker, wrap with ShiftGuard
  if (user?.role === UserRole.SHOP_WORKER) {
    return (
      <ShiftGuard>
        <InventoryManagementPage />
      </ShiftGuard>
    )
  }

  // Owners bypass shift requirement
  return <InventoryManagementPage />
}

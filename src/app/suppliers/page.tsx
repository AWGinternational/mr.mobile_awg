'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useAuth } from '@/hooks/use-auth'
import { useNotify } from '@/hooks/use-notifications'
import { useFormNavigation } from '@/hooks/use-form-navigation'
import { ProtectedRoute } from '@/components/auth/protected-route'
import { UserRole } from '@/types'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { BusinessSidebar } from '@/components/layout/BusinessSidebar'
import { TopNavigation } from '@/components/layout/TopNavigation'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import {
  Truck,
  ArrowLeft,
  LogOut,
  Search,
  Plus,
  Edit3,
  Phone,
  Mail,
  MapPin,
  ShoppingCart,
  DollarSign,
  X,
  Loader2,
  Trash2
} from 'lucide-react'
import { formatUserRole } from '@/utils/user-formatting'

interface Supplier {
  id: string
  name: string
  contactPerson: string
  phone: string
  email?: string
  address: string
  city: string
  province: string
  gstNumber?: string
  creditLimit?: number
  creditDays?: number
  status: string
  totalOrders: number
  totalPaid: number
  totalDue?: number
  _count?: {
    purchases: number
    inventoryItems: number
  }
}

export default function SupplierManagementPage() {
  const router = useRouter()
  const queryClient = useQueryClient()
  const { user: currentUser, logout } = useAuth()
  const { success, error: showError } = useNotify()
  const { handleNavigationKeys } = useFormNavigation()
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('ALL')
  const [page, setPage] = useState(1)
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [showEditDialog, setShowEditDialog] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [selectedSupplier, setSelectedSupplier] = useState<Supplier | null>(null)
  const [formData, setFormData] = useState({
    name: '',
    contactPerson: '',
    phone: '',
    email: '',
    address: '',
    city: '',
    province: '',
    gstNumber: '',
    creditLimit: '',
    creditDays: '30',
    status: 'ACTIVE'
  })

  // Debounced search term
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('')
  
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm)
      setPage(1) // Reset to first page on search
    }, 300)
    return () => clearTimeout(timer)
  }, [searchTerm])

  // Fetch suppliers with React Query
  const { data: suppliersData, isLoading: loading, error } = useQuery({
    queryKey: ['suppliers', debouncedSearchTerm, statusFilter, page],
    queryFn: async () => {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '20',
        ...(debouncedSearchTerm && { search: debouncedSearchTerm }),
        ...(statusFilter !== 'ALL' && { status: statusFilter })
      })
      
      const response = await fetch(`/api/suppliers?${params}`)
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || 'Failed to fetch suppliers')
      }
      return response.json()
    },
    staleTime: 2 * 60 * 1000, // 2 minutes
    gcTime: 5 * 60 * 1000, // 5 minutes
  })

  const suppliers = suppliersData?.data?.suppliers || []
  const pagination = suppliersData?.data?.pagination || { page: 1, limit: 20, totalCount: 0, totalPages: 0 }

  // Show error notification
  useEffect(() => {
    if (error) {
      showError(error instanceof Error ? error.message : 'Failed to load suppliers')
    }
  }, [error, showError])

  // Mutation for create supplier
  const createMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      const response = await fetch('/api/suppliers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      })
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || 'Failed to create supplier')
      }
      return response.json()
    },
    onSuccess: () => {
      success('Supplier created successfully')
      setShowCreateDialog(false)
      resetForm()
      queryClient.invalidateQueries({ queryKey: ['suppliers'] })
    },
    onError: (error: Error) => {
      showError(error.message)
    }
  })

  const handleCreate = () => {
    createMutation.mutate(formData)
  }

  const handleEdit = (supplier: Supplier) => {
    setSelectedSupplier(supplier)
    setFormData({
      name: supplier.name,
      contactPerson: supplier.contactPerson,
      phone: supplier.phone,
      email: supplier.email || '',
      address: supplier.address,
      city: supplier.city,
      province: supplier.province,
      gstNumber: supplier.gstNumber || '',
      creditLimit: supplier.creditLimit?.toString() || '',
      creditDays: supplier.creditDays?.toString() || '30',
      status: supplier.status
    })
    setShowEditDialog(true)
  }

  // Mutation for update supplier
  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string, data: typeof formData }) => {
      const response = await fetch(`/api/suppliers/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      })
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || 'Failed to update supplier')
      }
      return response.json()
    },
    onSuccess: () => {
      success('Supplier updated successfully')
      setShowEditDialog(false)
      setSelectedSupplier(null)
      resetForm()
      queryClient.invalidateQueries({ queryKey: ['suppliers'] })
    },
    onError: (error: Error) => {
      showError(error.message)
    }
  })

  const handleUpdate = () => {
    if (!selectedSupplier) return
    updateMutation.mutate({ id: selectedSupplier.id, data: formData })
  }

  const handleDelete = (supplier: Supplier) => {
    setSelectedSupplier(supplier)
    setShowDeleteDialog(true)
  }

  // Mutation for delete supplier
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await fetch(`/api/suppliers/${id}`, {
        method: 'DELETE'
      })
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || 'Failed to delete supplier')
      }
      return response.json()
    },
    onSuccess: () => {
      success('Supplier deleted successfully')
      setShowDeleteDialog(false)
      setSelectedSupplier(null)
      queryClient.invalidateQueries({ queryKey: ['suppliers'] })
    },
    onError: (error: Error) => {
      showError(error.message)
    }
  })

  const handleDeleteConfirm = () => {
    if (!selectedSupplier) return
    deleteMutation.mutate(selectedSupplier.id)
  }

  const resetForm = () => {
    setFormData({
      name: '',
      contactPerson: '',
      phone: '',
      email: '',
      address: '',
      city: '',
      province: '',
      gstNumber: '',
      creditLimit: '',
      creditDays: '30',
      status: 'ACTIVE'
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

  const stats = {
    total: suppliers.length,
    active: suppliers.filter((s: Supplier) => s.status === 'ACTIVE').length,
    totalPaid: suppliers.reduce((sum: number, s: Supplier) => sum + (s.totalPaid || 0), 0),
    totalOrders: suppliers.reduce((sum: number, s: Supplier) => sum + (s.totalOrders || 0), 0)
  }

  return (
    <ProtectedRoute allowedRoles={[UserRole.SUPER_ADMIN, UserRole.SHOP_OWNER, UserRole.SHOP_WORKER]}>
      <div className="flex min-h-screen bg-gray-50 dark:bg-gray-900">
        <BusinessSidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
        <div className={`flex-1 flex flex-col min-h-screen transition-all duration-300 ${sidebarOpen ? 'lg:ml-20' : 'lg:ml-64'}`}>
          <TopNavigation onMenuClick={() => setSidebarOpen(!sidebarOpen)} />
          
          <div className="flex-1 bg-gray-50 dark:bg-gray-900">
            {/* Header */}
            <div className="bg-gradient-to-r from-orange-600 to-orange-700 text-white">
              <div className="px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                  <div className="flex items-center gap-3 sm:gap-4 w-full sm:w-auto">
                    <button 
                      onClick={handleBack} 
                      className="p-2 sm:p-3 bg-white/10 hover:bg-white/20 rounded-xl transition-all duration-200 shrink-0"
                    >
                      <ArrowLeft className="h-5 w-5 text-white" />
                    </button>
                    <div className="min-w-0 flex-1">
                      <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold mb-1 sm:mb-2 truncate">🚚 Supplier Management</h1>
                      <p className="text-orange-100 text-sm sm:text-base lg:text-lg">Vendor relationships and purchase orders</p>
                    </div>
                  </div>
                  <Button 
                    onClick={() => setShowCreateDialog(true)} 
                    className="bg-white text-orange-600 hover:bg-orange-50 w-full sm:w-auto h-9 sm:h-10"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add Supplier
                  </Button>
                </div>
              </div>
            </div>

            {/* Content */}
            <div className="px-4 sm:px-6 lg:px-8 py-4 sm:py-6 lg:py-8 space-y-4 sm:space-y-6 lg:space-y-8">
              {/* Statistics */}
              <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-6">
                <Card className="bg-gradient-to-br from-orange-500 to-orange-600 text-white shadow-lg">
                  <CardContent className="p-4 sm:p-6">
                    <Truck className="h-6 w-6 sm:h-8 sm:w-8 mb-2 text-white opacity-90" />
                    <p className="text-white opacity-90 text-xs sm:text-sm">Total Suppliers</p>
                    <p className="text-2xl sm:text-3xl font-bold">{stats.total}</p>
                  </CardContent>
                </Card>
                <Card className="bg-gradient-to-br from-blue-500 to-blue-600 text-white shadow-lg">
                  <CardContent className="p-4 sm:p-6">
                    <ShoppingCart className="h-6 w-6 sm:h-8 sm:w-8 mb-2 text-white opacity-90" />
                    <p className="text-white opacity-90 text-xs sm:text-sm">Total Orders</p>
                    <p className="text-2xl sm:text-3xl font-bold">{stats.totalOrders}</p>
                  </CardContent>
                </Card>
                <Card className="bg-gradient-to-br from-green-500 to-green-600 text-white shadow-lg">
                  <CardContent className="p-4 sm:p-6">
                    <DollarSign className="h-6 w-6 sm:h-8 sm:w-8 mb-2 text-white opacity-90" />
                    <p className="text-white opacity-90 text-xs sm:text-sm">Total Paid</p>
                    <p className="text-lg sm:text-xl font-bold">{formatCurrency(stats.totalPaid)}</p>
                  </CardContent>
                </Card>
                <Card className="bg-gradient-to-br from-gray-500 to-gray-600 text-white shadow-lg">
                  <CardContent className="p-4 sm:p-6">
                    <Truck className="h-6 w-6 sm:h-8 sm:w-8 mb-2 text-white opacity-90" />
                    <p className="text-white opacity-90 text-xs sm:text-sm">Active</p>
                    <p className="text-2xl sm:text-3xl font-bold">{stats.active}</p>
                  </CardContent>
                </Card>
              </div>

              {/* Search Bar */}
              <Card>
                <CardContent className="p-4 sm:p-6">
                  <div className="relative">
                    <Search className="absolute left-2.5 sm:left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 sm:h-5 sm:w-5 text-gray-400 dark:text-gray-500" />
                    <Input
                      type="text"
                      placeholder="Search suppliers..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-8 sm:pl-10 h-9 sm:h-10 text-sm sm:text-base"
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Suppliers List */}
              <Card>
                <CardContent className="p-4 sm:p-6">
                  <h3 className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-white mb-4 sm:mb-6">Supplier Directory</h3>
              
              {loading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-gray-400 dark:text-gray-500" />
                  <span className="ml-2 text-gray-500 dark:text-gray-400">Loading suppliers...</span>
                </div>
              ) : suppliers.length === 0 ? (
                <div className="text-center py-12">
                  <Truck className="h-16 w-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
                  <p className="text-gray-500 dark:text-gray-400">No suppliers found</p>
                  <Button onClick={() => setShowCreateDialog(true)} className="mt-4">
                    <Plus className="h-4 w-4 mr-2" />
                    Add First Supplier
                  </Button>
                </div>
              ) : (
                <>
                  <div className="space-y-3 sm:space-y-4">
                    {suppliers.map((supplier: Supplier) => (
                    <div key={supplier.id} className="border border-gray-200 dark:border-gray-700 rounded-lg p-3 sm:p-4 hover:border-orange-300 dark:hover:border-orange-500 hover:shadow-md transition-all">
                      <div className="flex flex-col sm:flex-row items-start gap-3 sm:gap-4">
                        {/* Icon & Main Info */}
                        <div className="flex items-start gap-3 flex-1 w-full">
                          <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-orange-500 to-orange-600 rounded-lg flex items-center justify-center shadow-md shrink-0">
                            <Truck className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <h4 className="font-semibold text-gray-900 dark:text-white mb-1 truncate text-sm sm:text-base">{supplier.name}</h4>
                            <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 mb-2 truncate">Contact: {supplier.contactPerson}</p>
                            <div className="space-y-1">
                              <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 flex items-center gap-2">
                                <Phone className="h-3 w-3 sm:h-4 sm:w-4 shrink-0" />
                                <span className="truncate">{supplier.phone}</span>
                              </p>
                              {supplier.email && (
                                <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 flex items-center gap-2">
                                  <Mail className="h-3 w-3 sm:h-4 sm:w-4 shrink-0" />
                                  <span className="truncate">{supplier.email}</span>
                                </p>
                              )}
                              <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 flex items-center gap-2">
                                <MapPin className="h-3 w-3 sm:h-4 sm:w-4 shrink-0" />
                                <span className="truncate">{supplier.address}, {supplier.city}, {supplier.province}</span>
                              </p>
                            </div>
                          </div>
                        </div>
                        
                        {/* Stats & Actions */}
                        <div className="w-full sm:w-auto flex flex-row sm:flex-col justify-between sm:text-right gap-3 sm:gap-0">
                          <div className="flex gap-3 sm:block">
                            <div className="mb-0 sm:mb-3">
                              <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">Orders</p>
                              <p className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white">{supplier.totalOrders || 0}</p>
                            </div>
                            <div className="mb-0 sm:mb-3">
                              <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">Paid</p>
                              <p className="text-sm sm:text-lg font-bold text-green-600 dark:text-green-400">{formatCurrency(supplier.totalPaid || 0)}</p>
                            </div>
                          </div>
                          
                          <div className="flex flex-col gap-2 items-end">
                            <div className="flex gap-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleEdit(supplier)}
                                className="text-blue-600 hover:text-blue-700 hover:bg-blue-50 dark:hover:bg-blue-900/20 border-blue-200 dark:border-blue-800 h-7 w-7 sm:h-8 sm:w-8 p-0"
                              >
                                <Edit3 className="h-3 w-3 sm:h-4 sm:w-4" />
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleDelete(supplier)}
                                className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20 border-red-200 dark:border-red-800 h-7 w-7 sm:h-8 sm:w-8 p-0"
                              >
                                <Trash2 className="h-3 w-3 sm:h-4 sm:w-4" />
                              </Button>
                            </div>
                            <Badge className={supplier.status === 'ACTIVE' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200'}>
                              {supplier.status}
                            </Badge>
                          </div>
                        </div>
                      </div>
                    </div>
                    ))}
                  </div>

                  {/* Pagination Controls */}
                  {pagination.totalPages > 1 && (
                    <div className="flex items-center justify-between mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
                      <div className="text-sm text-gray-600 dark:text-gray-400">
                        Showing {((page - 1) * pagination.limit) + 1} to {Math.min(page * pagination.limit, pagination.totalCount)} of {pagination.totalCount} suppliers
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setPage(p => Math.max(1, p - 1))}
                          disabled={page === 1 || loading}
                        >
                          Previous
                        </Button>
                        <div className="flex items-center gap-1">
                          {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => {
                            let pageNum: number
                            if (pagination.totalPages <= 5) {
                              pageNum = i + 1
                            } else if (page <= 3) {
                              pageNum = i + 1
                            } else if (page >= pagination.totalPages - 2) {
                              pageNum = pagination.totalPages - 4 + i
                            } else {
                              pageNum = page - 2 + i
                            }
                            return (
                              <Button
                                key={pageNum}
                                variant={page === pageNum ? "default" : "outline"}
                                size="sm"
                                onClick={() => setPage(pageNum)}
                                disabled={loading}
                              >
                                {pageNum}
                              </Button>
                            )
                          })}
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setPage(p => Math.min(pagination.totalPages, p + 1))}
                          disabled={page === pagination.totalPages || loading}
                        >
                          Next
                        </Button>
                      </div>
                    </div>
                  )}
                </>
              )}
            </CardContent>
          </Card>
        </div>
        </div>
      </div>
      </div>

      {/* Create Supplier Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Add New Supplier</DialogTitle>
          </DialogHeader>
          <form className="grid grid-cols-2 gap-4">
            <div>
              <Label>Company Name *</Label>
              <Input
                value={formData.name}
                onChange={(e) => setFormData({...formData, name: e.target.value})}
                onKeyDown={handleNavigationKeys}
                placeholder="Ali Mobile Distributors"
                autoFocus
                className="focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <Label>Contact Person *</Label>
              <Input
                value={formData.contactPerson}
                onChange={(e) => setFormData({...formData, contactPerson: e.target.value})}
                onKeyDown={handleNavigationKeys}
                placeholder="Ahmed Khan"
                className="focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <Label>Phone *</Label>
              <Input
                value={formData.phone}
                onChange={(e) => setFormData({...formData, phone: e.target.value})}
                onKeyDown={handleNavigationKeys}
                placeholder="+92 21 11223344"
                className="focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <Label>Email</Label>
              <Input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({...formData, email: e.target.value})}
                onKeyDown={handleNavigationKeys}
                placeholder="supplier@example.com"
                className="focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div className="col-span-2">
              <Label>Address *</Label>
              <Input
                value={formData.address}
                onChange={(e) => setFormData({...formData, address: e.target.value})}
                onKeyDown={handleNavigationKeys}
                placeholder="Shop Address"
                className="focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <Label>City *</Label>
              <Input
                value={formData.city}
                onChange={(e) => setFormData({...formData, city: e.target.value})}
                onKeyDown={handleNavigationKeys}
                placeholder="Karachi"
                className="focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <Label>Province *</Label>
              <Input
                value={formData.province}
                onChange={(e) => setFormData({...formData, province: e.target.value})}
                onKeyDown={handleNavigationKeys}
                placeholder="Sindh"
                className="focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <Label>GST Number</Label>
              <Input
                value={formData.gstNumber}
                onChange={(e) => setFormData({...formData, gstNumber: e.target.value})}
                onKeyDown={handleNavigationKeys}
                placeholder="GST-123456"
                className="focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <Label>Credit Limit (PKR)</Label>
              <Input
                type="number"
                value={formData.creditLimit}
                onChange={(e) => setFormData({...formData, creditLimit: e.target.value})}
                onKeyDown={handleNavigationKeys}
                placeholder="500000"
                className="focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <Label>Credit Days</Label>
              <Input
                type="number"
                value={formData.creditDays}
                onChange={(e) => setFormData({...formData, creditDays: e.target.value})}
                onKeyDown={handleNavigationKeys}
                placeholder="30"
                className="focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <Label>Status</Label>
              <Select value={formData.status} onValueChange={(value) => setFormData({...formData, status: value})}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ACTIVE">Active</SelectItem>
                  <SelectItem value="INACTIVE">Inactive</SelectItem>
                  <SelectItem value="BLOCKED">Blocked</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </form>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setShowCreateDialog(false); resetForm(); }}>
              Cancel
            </Button>
            <Button onClick={handleCreate} disabled={createMutation.isPending}>
              {createMutation.isPending ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
              Create Supplier
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Supplier Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Supplier</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Company Name *</Label>
              <Input
                value={formData.name}
                onChange={(e) => setFormData({...formData, name: e.target.value})}
              />
            </div>
            <div>
              <Label>Contact Person *</Label>
              <Input
                value={formData.contactPerson}
                onChange={(e) => setFormData({...formData, contactPerson: e.target.value})}
              />
            </div>
            <div>
              <Label>Phone *</Label>
              <Input
                value={formData.phone}
                onChange={(e) => setFormData({...formData, phone: e.target.value})}
              />
            </div>
            <div>
              <Label>Email</Label>
              <Input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({...formData, email: e.target.value})}
              />
            </div>
            <div className="col-span-2">
              <Label>Address *</Label>
              <Input
                value={formData.address}
                onChange={(e) => setFormData({...formData, address: e.target.value})}
              />
            </div>
            <div>
              <Label>City *</Label>
              <Input
                value={formData.city}
                onChange={(e) => setFormData({...formData, city: e.target.value})}
              />
            </div>
            <div>
              <Label>Province *</Label>
              <Input
                value={formData.province}
                onChange={(e) => setFormData({...formData, province: e.target.value})}
              />
            </div>
            <div>
              <Label>GST Number</Label>
              <Input
                value={formData.gstNumber}
                onChange={(e) => setFormData({...formData, gstNumber: e.target.value})}
              />
            </div>
            <div>
              <Label>Credit Limit (PKR)</Label>
              <Input
                type="number"
                value={formData.creditLimit}
                onChange={(e) => setFormData({...formData, creditLimit: e.target.value})}
              />
            </div>
            <div>
              <Label>Credit Days</Label>
              <Input
                type="number"
                value={formData.creditDays}
                onChange={(e) => setFormData({...formData, creditDays: e.target.value})}
              />
            </div>
            <div>
              <Label>Status</Label>
              <Select value={formData.status} onValueChange={(value) => setFormData({...formData, status: value})}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ACTIVE">Active</SelectItem>
                  <SelectItem value="INACTIVE">Inactive</SelectItem>
                  <SelectItem value="BLOCKED">Blocked</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setShowEditDialog(false); setSelectedSupplier(null); resetForm(); }}>
              Cancel
            </Button>
            <Button onClick={handleUpdate} disabled={updateMutation.isPending}>
              {updateMutation.isPending ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
              Update Supplier
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Supplier Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Supplier</DialogTitle>
          </DialogHeader>
          <p>Are you sure you want to delete <strong>{selectedSupplier?.name}</strong>?</p>
          <p className="text-sm text-red-600 mt-2">
            Note: Suppliers with existing purchases or inventory items cannot be deleted. Set status to INACTIVE instead.
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setShowDeleteDialog(false); setSelectedSupplier(null); }}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDeleteConfirm} disabled={deleteMutation.isPending}>
              {deleteMutation.isPending ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </ProtectedRoute>
  )
}


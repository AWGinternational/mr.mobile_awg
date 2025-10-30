'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/use-auth'
import { useNotify } from '@/hooks/use-notifications'
import { ProtectedRoute } from '@/components/auth/protected-route'
import { ShiftGuard } from '@/components/auth/shift-guard'
import { UserRole } from '@/types'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { BusinessSidebar } from '@/components/layout/BusinessSidebar'
import { TopNavigation } from '@/components/layout/TopNavigation'
import {
  Users,
  Search,
  Plus,
  Edit3,
  Eye,
  ArrowLeft,
  LogOut,
  X,
  Phone,
  Mail,
  MapPin,
  ShoppingCart,
  DollarSign,
  Trash2,
  Edit
} from 'lucide-react'
import { formatUserRole } from '@/utils/user-formatting'

interface Customer {
  id: string
  name: string
  phone: string
  email?: string
  cnic?: string
  address?: string
  city?: string
  creditLimit?: number | null
  creditUsed?: number
  totalPurchases: number
  totalSpent: number
  lastPurchase?: string | null
  activeLoans?: number
  createdAt: string
}

function CustomerManagementPage() {
  const router = useRouter()
  const { user: currentUser, logout } = useAuth()
  const { success, error: showError } = useNotify()

  const [customers, setCustomers] = useState<Customer[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [showViewDialog, setShowViewDialog] = useState(false)
  const [showEditDialog, setShowEditDialog] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [currentShopId, setCurrentShopId] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    cnic: '',
    address: '',
    city: ''
  })
  const [editFormData, setEditFormData] = useState({
    name: '',
    phone: '',
    email: '',
    cnic: '',
    address: '',
    city: ''
  })
  const [actionLoading, setActionLoading] = useState(false)

  // Fetch user's shop
  useEffect(() => {
    const fetchUserShop = async () => {
      if (!currentUser) return
      
      try {
        // Both SHOP_OWNER and SHOP_WORKER can use /api/shops endpoint
        // The API handles role-based filtering automatically
        const response = await fetch('/api/shops')
        
        if (!response.ok) {
          console.error('Failed to fetch shops:', response.status)
          return
        }
        
        const data = await response.json()
        if (data.shops && data.shops.length > 0) {
          setCurrentShopId(data.shops[0].id)
        }
      } catch (error) {
        console.error('Error fetching user shop:', error)
      }
    }
    
    fetchUserShop()
  }, [currentUser])

  // Fetch customers
  const fetchCustomers = useCallback(async () => {
    if (!currentShopId) return
    
    try {
      setLoading(true)
      const response = await fetch(`/api/customers?shopId=${currentShopId}`)
      if (!response.ok) throw new Error('Failed to fetch customers')
      
      const data = await response.json()
      setCustomers(data.customers || [])
    } catch (error) {
      console.error('Error fetching customers:', error)
      // showError is used here but not in dependencies to avoid infinite loop
    } finally {
      setLoading(false)
    }
  }, [currentShopId])

  useEffect(() => {
    if (currentShopId) {
      fetchCustomers()
    }
  }, [currentShopId, fetchCustomers])

  // Debug effect to log customers state changes
  useEffect(() => {
    // Customer state tracking for debugging
  }, [customers])

  const handleCreateCustomer = async () => {
    if (!currentShopId || !formData.name || !formData.phone) {
      showError('Name and phone number are required')
      return
    }

    try {
      
      const response = await fetch('/api/customers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          shopId: currentShopId,
          ...formData
        })
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to create customer')
      }

      const result = await response.json()
      
      // Add the new customer to the list immediately (optimistic update)
      setCustomers(prev => {
        const updated = [result.customer, ...prev]
        return updated
      })
      
      success('Customer added successfully!')
      setShowCreateDialog(false)
      setFormData({ name: '', phone: '', email: '', cnic: '', address: '', city: '' })
      
    } catch (error: any) {
      console.error('❌ Error creating customer:', error)
      showError(error.message || 'Failed to create customer')
    }
  }

  const handleEditCustomer = (customer: Customer) => {
    setSelectedCustomer(customer)
    setEditFormData({
      name: customer.name,
      phone: customer.phone,
      email: customer.email || '',
      cnic: customer.cnic || '',
      address: customer.address || '',
      city: customer.city || ''
    })
    setShowEditDialog(true)
  }

  const handleDeleteCustomer = (customer: Customer) => {
    setSelectedCustomer(customer)
    setShowDeleteDialog(true)
  }

  const handleUpdateCustomer = async () => {
    if (!selectedCustomer || !currentShopId) return

    try {
      setActionLoading(true)
      
      const response = await fetch(`/api/customers/${selectedCustomer.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editFormData)
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to update customer')
      }

      const result = await response.json()
      
      // Update the customer in the list
      setCustomers(prev => 
        prev.map(customer => 
          customer.id === selectedCustomer.id 
            ? { ...customer, ...result.customer }
            : customer
        )
      )
      
      success('Customer updated successfully!')
      setShowEditDialog(false)
      setSelectedCustomer(null)
      setEditFormData({ name: '', phone: '', email: '', cnic: '', address: '', city: '' })
      
    } catch (error: any) {
      console.error('❌ Error updating customer:', error)
      showError(error.message || 'Failed to update customer')
    } finally {
      setActionLoading(false)
    }
  }

  const handleDeleteCustomerConfirm = async () => {
    if (!selectedCustomer) return

    try {
      setActionLoading(true)
      
      const response = await fetch(`/api/customers/${selectedCustomer.id}`, {
        method: 'DELETE'
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to delete customer')
      }

      // Remove the customer from the list
      setCustomers(prev => prev.filter(customer => customer.id !== selectedCustomer.id))
      
      success('Customer deleted successfully!')
      setShowDeleteDialog(false)
      setSelectedCustomer(null)
      
    } catch (error: any) {
      console.error('❌ Error deleting customer:', error)
      showError(error.message || 'Failed to delete customer')
    } finally {
      setActionLoading(false)
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
    if (currentUser?.role === UserRole.SUPER_ADMIN) {
      router.push('/dashboard/admin')
    } else if (currentUser?.role === UserRole.SHOP_OWNER) {
      router.push('/dashboard/owner')
    } else {
      router.push('/dashboard/worker')
    }
  }

  const filteredCustomers = customers.filter(customer => {
    const searchLower = searchTerm.toLowerCase()
    return !searchTerm || 
      customer.name.toLowerCase().includes(searchLower) ||
      customer.phone.includes(searchTerm) ||
      customer.email?.toLowerCase().includes(searchLower)
  })

  const stats = {
    total: customers.length,
    active: customers.filter(c => c.lastPurchase && new Date(c.lastPurchase) > new Date(Date.now() - 30 * 86400000)).length,
    totalRevenue: customers.reduce((sum, c) => sum + c.totalSpent, 0),
    avgSpent: customers.length > 0 ? customers.reduce((sum, c) => sum + c.totalSpent, 0) / customers.length : 0
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-PK', {
      style: 'currency',
      currency: 'PKR',
      minimumFractionDigits: 0
    }).format(amount)
  }

  const formatPhoneNumber = (phone: string) => {
    // Remove any non-digit characters
    const cleaned = phone.replace(/\D/g, '')
    
    // Pakistani phone number formatting
    if (cleaned.length === 12 && cleaned.startsWith('92')) {
      return `+${cleaned.slice(0, 2)} ${cleaned.slice(2, 5)} ${cleaned.slice(5, 8)} ${cleaned.slice(8)}`
    } else if (cleaned.length === 11 && cleaned.startsWith('3')) {
      return `+92 ${cleaned.slice(0, 3)} ${cleaned.slice(3, 6)} ${cleaned.slice(6)}`
    } else if (cleaned.length === 10) {
      return `+92 ${cleaned.slice(0, 3)} ${cleaned.slice(3, 6)} ${cleaned.slice(6)}`
    }
    
    // Return original if doesn't match expected patterns
    return phone
  }

  const formatCNIC = (cnic?: string) => {
    if (!cnic) return ''
    // Remove any non-digit characters
    const cleaned = cnic.replace(/\D/g, '')
    
    // CNIC formatting: XXXXX-XXXXXXX-X
    if (cleaned.length === 13) {
      return `${cleaned.slice(0, 5)}-${cleaned.slice(5, 12)}-${cleaned.slice(12)}`
    }
    
    // Return original if doesn't match expected pattern
    return cnic
  }

  return (
    <ProtectedRoute allowedRoles={[UserRole.SUPER_ADMIN, UserRole.SHOP_OWNER, UserRole.SHOP_WORKER]}>
      <div className="flex min-h-screen bg-gray-50 dark:bg-gray-900">
        <BusinessSidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
        <div className={`flex-1 flex flex-col min-h-screen transition-all duration-300 ${sidebarOpen ? 'lg:ml-20' : 'lg:ml-64'}`}>
          <TopNavigation onMenuClick={() => setSidebarOpen(!sidebarOpen)} />
          
          <div className="flex-1 bg-gray-50 dark:bg-gray-900">
            {/* Header */}
            <div className="bg-gradient-to-r from-indigo-600 to-indigo-700 text-white">
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
                      <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold mb-1 sm:mb-2 truncate">👥 Customer Management</h1>
                      <p className="text-indigo-100 text-sm sm:text-base lg:text-lg">Customer database and purchase history</p>
                    </div>
                  </div>
                  <Button 
                    onClick={() => setShowCreateDialog(true)} 
                    className="bg-white text-indigo-600 hover:bg-indigo-50 w-full sm:w-auto h-9 sm:h-10"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add Customer
                  </Button>
                </div>
              </div>
            </div>

            {/* Content */}
            <div className="px-4 sm:px-6 lg:px-8 py-4 sm:py-6 lg:py-8 space-y-4 sm:space-y-6 lg:space-y-8">
              {/* Statistics */}
              <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-6">
                <Card className="bg-gradient-to-br from-indigo-500 to-indigo-600 text-white shadow-lg">
                  <CardContent className="p-4 sm:p-6">
                    <Users className="h-6 w-6 sm:h-8 sm:w-8 mb-2 text-white opacity-90" />
                    <p className="text-white opacity-90 text-xs sm:text-sm">Total Customers</p>
                    <p className="text-2xl sm:text-3xl font-bold">{stats.total}</p>
                  </CardContent>
                </Card>
                <Card className="bg-gradient-to-br from-blue-500 to-blue-600 text-white shadow-lg">
                  <CardContent className="p-4 sm:p-6">
                    <ShoppingCart className="h-6 w-6 sm:h-8 sm:w-8 mb-2 text-white opacity-90" />
                    <p className="text-white opacity-90 text-xs sm:text-sm">Active (30d)</p>
                    <p className="text-2xl sm:text-3xl font-bold">{stats.active}</p>
                  </CardContent>
                </Card>
                <Card className="bg-gradient-to-br from-green-500 to-green-600 text-white shadow-lg">
                  <CardContent className="p-4 sm:p-6">
                    <DollarSign className="h-6 w-6 sm:h-8 sm:w-8 mb-2 text-white opacity-90" />
                    <p className="text-white opacity-90 text-xs sm:text-sm">Total Revenue</p>
                    <p className="text-lg sm:text-xl font-bold">{formatCurrency(stats.totalRevenue)}</p>
                  </CardContent>
                </Card>
                <Card className="bg-gradient-to-br from-green-600 to-green-700 text-white shadow-lg">
                  <CardContent className="p-4 sm:p-6">
                    <DollarSign className="h-6 w-6 sm:h-8 sm:w-8 mb-2 text-white opacity-90" />
                    <p className="text-white opacity-90 text-xs sm:text-sm">Avg Spent</p>
                    <p className="text-lg sm:text-xl font-bold">{formatCurrency(stats.avgSpent)}</p>
                  </CardContent>
                </Card>
              </div>

              {/* Search */}
              <Card>
                <CardContent className="p-4 sm:p-6">
                  <div className="relative">
                    <Search className="absolute left-2.5 sm:left-3 top-1/2 transform -translate-y-1/2 h-3.5 w-3.5 sm:h-4 sm:w-4 text-gray-400 dark:text-gray-500" />
                    <Input
                      type="text"
                      placeholder="Search by name, phone, or email..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-8 sm:pl-10 h-9 sm:h-10 text-sm sm:text-base"
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Customers List */}
              <Card>
                <CardContent className="p-4 sm:p-6">
                  <h3 className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-white mb-4 sm:mb-6">Customer Directory</h3>
              
              {loading ? (
                <div className="text-center py-12">
                  <div className="w-8 h-8 border-4 border-teal-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                  <p className="text-gray-600 dark:text-gray-400">Loading customers...</p>
                </div>
              ) : filteredCustomers.length === 0 ? (
                <div className="text-center py-12">
                  <Users className="h-12 w-12 text-gray-400 dark:text-gray-600 mx-auto mb-4" />
                  <p className="text-gray-600 dark:text-gray-400 mb-4">
                    {searchTerm ? 'No customers found matching your search' : 'No customers yet'}
                  </p>
                  {!searchTerm && (
                    <Button 
                      onClick={() => setShowCreateDialog(true)}
                      className="bg-teal-600 hover:bg-teal-700"
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Add Your First Customer
                    </Button>
                  )}
                </div>
              ) : (
              <div className="space-y-2 sm:space-y-3">
                {filteredCustomers.map((customer) => (
                  <div key={customer.id} className="border border-gray-200 dark:border-gray-700 rounded-lg p-3 sm:p-4 hover:shadow-md dark:hover:shadow-gray-900/50 transition-shadow bg-white dark:bg-gray-800">
                    {/* Mobile: Stacked Layout */}
                    <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 sm:gap-4">
                      {/* Customer Info Section */}
                      <div className="flex items-start gap-2 sm:gap-3 flex-1 min-w-0">
                        <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-teal-500 to-cyan-600 rounded-full flex items-center justify-center shrink-0">
                          <span className="text-white font-bold text-base sm:text-lg">{customer.name.charAt(0)}</span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="font-semibold text-gray-900 dark:text-white text-sm sm:text-base mb-1 truncate">{customer.name}</h4>
                          <div className="space-y-0.5 sm:space-y-1">
                            <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 flex items-center gap-1.5 sm:gap-2">
                              <Phone className="h-3 w-3 sm:h-4 sm:w-4 shrink-0" />
                              <span className="truncate">{formatPhoneNumber(customer.phone)}</span>
                            </p>
                            {customer.email && (
                              <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 flex items-center gap-1.5 sm:gap-2">
                                <Mail className="h-3 w-3 sm:h-4 sm:w-4 shrink-0" />
                                <span className="truncate">{customer.email}</span>
                              </p>
                            )}
                            {customer.city && (
                              <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 flex items-center gap-1.5 sm:gap-2">
                                <MapPin className="h-3 w-3 sm:h-4 sm:w-4 shrink-0" />
                                <span className="truncate">{customer.city}</span>
                              </p>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Stats & Actions Section */}
                      <div className="flex items-center justify-between sm:flex-col sm:items-end gap-3">
                        {/* Stats */}
                        <div className="flex gap-3 sm:gap-4 sm:flex-col sm:items-end">
                          <div className="text-left sm:text-right">
                            <p className="text-xs text-gray-600 dark:text-gray-400">Purchases</p>
                            <p className="text-base sm:text-lg font-bold text-gray-900 dark:text-white">{customer.totalPurchases}</p>
                          </div>
                          <div className="text-left sm:text-right">
                            <p className="text-xs text-gray-600 dark:text-gray-400">Spent</p>
                            <p className="text-sm sm:text-base font-bold text-teal-600 dark:text-teal-400 truncate">{formatCurrency(customer.totalSpent)}</p>
                          </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
                          <button
                            onClick={() => {setSelectedCustomer(customer); setShowViewDialog(true)}}
                            className="p-1.5 sm:p-2 bg-blue-50 dark:bg-blue-900/20 hover:bg-blue-100 dark:hover:bg-blue-900/30 text-blue-700 dark:text-blue-400 rounded-lg transition-colors"
                            title="View Details"
                          >
                            <Eye className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                          </button>
                          <button
                            onClick={() => handleEditCustomer(customer)}
                            className="p-1.5 sm:p-2 bg-green-50 dark:bg-green-900/20 hover:bg-green-100 dark:hover:bg-green-900/30 text-green-700 dark:text-green-400 rounded-lg transition-colors"
                            title="Edit Customer"
                          >
                            <Edit className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteCustomer(customer)}
                            className="p-1.5 sm:p-2 bg-red-50 dark:bg-red-900/20 hover:bg-red-100 dark:hover:bg-red-900/30 text-red-700 dark:text-red-400 rounded-lg transition-colors"
                            title="Delete Customer"
                          >
                            <Trash2 className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Create Customer Dialog - Placeholder */}
        {showCreateDialog && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl max-w-md w-full">
              <div className="p-6 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Add New Customer</h3>
                <button onClick={() => setShowCreateDialog(false)} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full">
                  <X className="h-5 w-5 dark:text-gray-400" />
                </button>
              </div>
              <div className="p-6 space-y-4">
                <div className="space-y-2">
                  <Label className="dark:text-gray-300">Customer Name *</Label>
                  <Input value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} placeholder="Enter name" className="dark:bg-gray-700 dark:border-gray-600 dark:text-white" />
                </div>
                <div className="space-y-2">
                  <Label className="dark:text-gray-300">Phone Number *</Label>
                  <Input value={formData.phone} onChange={(e) => setFormData({...formData, phone: e.target.value})} placeholder="+92 300 1234567" className="dark:bg-gray-700 dark:border-gray-600 dark:text-white" />
                </div>
                <div className="space-y-2">
                  <Label className="dark:text-gray-300">Email</Label>
                  <Input type="email" value={formData.email} onChange={(e) => setFormData({...formData, email: e.target.value})} placeholder="customer@example.com" className="dark:bg-gray-700 dark:border-gray-600 dark:text-white" />
                </div>
                <div className="space-y-2">
                  <Label className="dark:text-gray-300">CNIC</Label>
                  <Input value={formData.cnic} onChange={(e) => setFormData({...formData, cnic: e.target.value})} placeholder="42101-1234567-1" className="dark:bg-gray-700 dark:border-gray-600 dark:text-white" />
                </div>
                <div className="space-y-2">
                  <Label className="dark:text-gray-300">City</Label>
                  <Input value={formData.city} onChange={(e) => setFormData({...formData, city: e.target.value})} placeholder="Karachi" className="dark:bg-gray-700 dark:border-gray-600 dark:text-white" />
                </div>
              </div>
              <div className="p-6 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 flex gap-3">
                <Button variant="outline" onClick={() => setShowCreateDialog(false)} className="flex-1">Cancel</Button>
                <Button 
                  onClick={handleCreateCustomer} 
                  disabled={!formData.name || !formData.phone}
                  className="flex-1 bg-teal-600 hover:bg-teal-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Add Customer
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Edit Customer Dialog */}
        {showEditDialog && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl max-w-md w-full">
              <div className="p-6 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Edit Customer</h3>
                <button onClick={() => setShowEditDialog(false)} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full">
                  <X className="h-5 w-5 dark:text-gray-400" />
                </button>
              </div>
              <div className="p-6 space-y-4">
                <div className="space-y-2">
                  <Label className="dark:text-gray-300">Customer Name *</Label>
                  <Input 
                    value={editFormData.name} 
                    onChange={(e) => setEditFormData({...editFormData, name: e.target.value})} 
                    placeholder="Enter name" 
                    className="dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="dark:text-gray-300">Phone Number *</Label>
                  <Input 
                    value={editFormData.phone} 
                    onChange={(e) => setEditFormData({...editFormData, phone: e.target.value})} 
                    placeholder="+92 300 1234567" 
                    className="dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="dark:text-gray-300">Email</Label>
                  <Input 
                    type="email" 
                    value={editFormData.email} 
                    onChange={(e) => setEditFormData({...editFormData, email: e.target.value})} 
                    placeholder="customer@example.com" 
                    className="dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="dark:text-gray-300">CNIC</Label>
                  <Input 
                    value={editFormData.cnic} 
                    onChange={(e) => setEditFormData({...editFormData, cnic: e.target.value})} 
                    placeholder="42101-1234567-1" 
                    className="dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="dark:text-gray-300">Address</Label>
                  <Textarea 
                    value={editFormData.address} 
                    onChange={(e) => setEditFormData({...editFormData, address: e.target.value})} 
                    placeholder="Enter address" 
                    rows={2}
                    className="dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="dark:text-gray-300">City</Label>
                  <Input 
                    value={editFormData.city} 
                    onChange={(e) => setEditFormData({...editFormData, city: e.target.value})} 
                    placeholder="Karachi" 
                    className="dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  />
                </div>
              </div>
              <div className="p-6 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 flex gap-3">
                <Button variant="outline" onClick={() => setShowEditDialog(false)} className="flex-1">Cancel</Button>
                <Button 
                  onClick={handleUpdateCustomer} 
                  disabled={!editFormData.name || !editFormData.phone || actionLoading}
                  className="flex-1 bg-teal-600 hover:bg-teal-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {actionLoading ? 'Updating...' : 'Update Customer'}
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Delete Customer Dialog */}
        {showDeleteDialog && selectedCustomer && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl max-w-md w-full">
              <div className="p-6 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Delete Customer</h3>
                <button onClick={() => setShowDeleteDialog(false)} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full">
                  <X className="h-5 w-5 dark:text-gray-400" />
                </button>
              </div>
              <div className="p-6">
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-teal-500 to-cyan-600 rounded-full flex items-center justify-center">
                    <span className="text-white font-bold text-lg">{selectedCustomer.name.charAt(0)}</span>
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900 dark:text-white">{selectedCustomer.name}</h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400">{formatPhoneNumber(selectedCustomer.phone)}</p>
                  </div>
                </div>
                <p className="text-gray-600 dark:text-gray-400 mb-4">
                  Are you sure you want to delete this customer? This action cannot be undone.
                </p>
                <p className="text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 p-3 rounded-lg">
                  <strong>Note:</strong> Customers with existing sales or loans cannot be deleted. 
                  Consider archiving instead.
                </p>
              </div>
              <div className="p-6 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 flex gap-3">
                <Button variant="outline" onClick={() => setShowDeleteDialog(false)} className="flex-1">Cancel</Button>
                <Button 
                  onClick={handleDeleteCustomerConfirm} 
                  disabled={actionLoading}
                  className="flex-1 bg-red-600 hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {actionLoading ? 'Deleting...' : 'Delete Customer'}
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* View Customer Dialog */}
        {showViewDialog && selectedCustomer && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl max-w-lg w-full">
              <div className="p-6 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Customer Details</h3>
                <button onClick={() => setShowViewDialog(false)} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full">
                  <X className="h-5 w-5 dark:text-gray-400" />
                </button>
              </div>
              <div className="p-6 space-y-6">
                {/* Customer Header */}
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 bg-gradient-to-br from-teal-500 to-cyan-600 rounded-full flex items-center justify-center">
                    <span className="text-white font-bold text-xl">{selectedCustomer.name.charAt(0)}</span>
                  </div>
                  <div>
                    <h4 className="text-xl font-semibold text-gray-900 dark:text-white">{selectedCustomer.name}</h4>
                    <p className="text-gray-600 dark:text-gray-400">Customer since {new Date(selectedCustomer.createdAt).toLocaleDateString()}</p>
                  </div>
                </div>

                {/* Contact Information */}
                <div className="space-y-4">
                  <h5 className="font-medium text-gray-900 dark:text-white">Contact Information</h5>
                  <div className="space-y-3">
                    <div className="flex items-center gap-3">
                      <Phone className="h-4 w-4 text-gray-400 dark:text-gray-500" />
                      <span className="text-gray-900 dark:text-white">{formatPhoneNumber(selectedCustomer.phone)}</span>
                    </div>
                    {selectedCustomer.email && (
                      <div className="flex items-center gap-3">
                        <Mail className="h-4 w-4 text-gray-400 dark:text-gray-500" />
                        <span className="text-gray-900 dark:text-white">{selectedCustomer.email}</span>
                      </div>
                    )}
                    {selectedCustomer.cnic && (
                      <div className="flex items-center gap-3">
                        <span className="h-4 w-4 flex items-center justify-center text-xs font-bold text-gray-400 dark:text-gray-500">ID</span>
                        <span className="text-gray-900 dark:text-white">{formatCNIC(selectedCustomer.cnic)}</span>
                      </div>
                    )}
                    {selectedCustomer.city && (
                      <div className="flex items-center gap-3">
                        <MapPin className="h-4 w-4 text-gray-400 dark:text-gray-500" />
                        <span className="text-gray-900 dark:text-white">{selectedCustomer.city}</span>
                      </div>
                    )}
                    {selectedCustomer.address && (
                      <div className="flex items-start gap-3">
                        <MapPin className="h-4 w-4 text-gray-400 dark:text-gray-500 mt-1" />
                        <span className="text-gray-900 dark:text-white">{selectedCustomer.address}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Purchase Statistics */}
                <div className="space-y-4">
                  <h5 className="font-medium text-gray-900 dark:text-white">Purchase Statistics</h5>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                      <p className="text-sm text-gray-600 dark:text-gray-400">Total Purchases</p>
                      <p className="text-2xl font-bold text-gray-900 dark:text-white">{selectedCustomer.totalPurchases}</p>
                    </div>
                    <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                      <p className="text-sm text-gray-600 dark:text-gray-400">Total Spent</p>
                      <p className="text-2xl font-bold text-teal-600 dark:text-teal-400">{formatCurrency(selectedCustomer.totalSpent)}</p>
                    </div>
                  </div>
                  {selectedCustomer.lastPurchase && (
                    <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                      <p className="text-sm text-gray-600 dark:text-gray-400">Last Purchase</p>
                      <p className="text-lg font-semibold text-gray-900 dark:text-white">
                        {new Date(selectedCustomer.lastPurchase).toLocaleDateString()}
                      </p>
                    </div>
                  )}
                </div>

                {/* Credit Information */}
                {(selectedCustomer.creditLimit || selectedCustomer.creditUsed) && (
                  <div className="space-y-4">
                    <h5 className="font-medium text-gray-900 dark:text-white">Credit Information</h5>
                    <div className="space-y-3">
                      {selectedCustomer.creditLimit && (
                        <div className="flex justify-between items-center">
                          <span className="text-gray-600 dark:text-gray-400">Credit Limit</span>
                          <span className="font-semibold text-gray-900 dark:text-white">{formatCurrency(selectedCustomer.creditLimit)}</span>
                        </div>
                      )}
                      {selectedCustomer.creditUsed && (
                        <div className="flex justify-between items-center">
                          <span className="text-gray-600 dark:text-gray-400">Credit Used</span>
                          <span className="font-semibold text-gray-900 dark:text-white">{formatCurrency(selectedCustomer.creditUsed)}</span>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
              <div className="p-6 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 flex gap-3">
                <Button variant="outline" onClick={() => setShowViewDialog(false)} className="flex-1">Close</Button>
                <Button 
                  onClick={() => {
                    setShowViewDialog(false)
                    handleEditCustomer(selectedCustomer)
                  }}
                  className="flex-1 bg-teal-600 hover:bg-teal-700"
                >
                  <Edit className="h-4 w-4 mr-2" />
                  Edit Customer
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

// Wrap with ShiftGuard for workers
export default function CustomerManagementPageWithShiftGuard() {
  const { user } = useAuth()
  
  if (user?.role === UserRole.SHOP_WORKER) {
    return (
      <ShiftGuard>
        <CustomerManagementPage />
      </ShiftGuard>
    )
  }
  
  return <CustomerManagementPage />
}

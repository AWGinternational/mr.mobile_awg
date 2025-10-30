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
import {
  Store,
  Users,
  Search,
  X,
  ArrowLeft,
  LogOut,
  UserPlus,
  Edit3,
  Key,
  Trash2,
  History,
  UserCog,
  TrendingUp,
  Building2,
  DollarSign
} from 'lucide-react'
import { EditUserDialog } from '@/components/shop/EditUserDialog'
import { UserStatusToggle } from '@/components/shop/UserStatusToggle'
import { PasswordResetDialog } from '@/components/shop/PasswordResetDialog'
import { RoleChangeDialog } from '@/components/shop/RoleChangeDialog'
import { UserAuditLogDialog } from '@/components/shop/UserAuditLogDialog'
import { formatUserRole } from '@/utils/user-formatting'

interface ShopOwner {
  id: string
  name: string
  email: string
  phone: string
  role: string
  status: string
  cnic?: string
  businessName?: string
  lastLogin?: string
  createdAt: string
  _count?: {
    ownedShops: number
  }
}

interface Shop {
  id: string
  name: string
  status: string
}

export default function ShopOwnersPage() {
  const router = useRouter()
  const { user: currentUser, logout } = useAuth()
  const { success, error: showError } = useNotify()

  // State
  const [owners, setOwners] = useState<ShopOwner[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [cityFilter, setCityFilter] = useState<string>('all')

  // Dialog states
  const [showEditUserDialog, setShowEditUserDialog] = useState(false)
  const [showPasswordResetDialog, setShowPasswordResetDialog] = useState(false)
  const [showRoleChangeDialog, setShowRoleChangeDialog] = useState(false)
  const [showAuditLogDialog, setShowAuditLogDialog] = useState(false)
  const [selectedOwner, setSelectedOwner] = useState<ShopOwner | null>(null)

  // Fetch shop owners
  const fetchOwners = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/users/shop-owners')
      const data = await response.json()
      
      if (response.ok) {
        setOwners(data.shopOwners || [])
      } else {
        throw new Error(data.error || 'Failed to fetch shop owners')
      }
    } catch (error) {
      console.error('Failed to fetch shop owners:', error)
      showError('Failed to fetch shop owners')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchOwners()
  }, [])

  // Filter owners
  const filteredOwners = owners.filter(owner => {
    const searchLower = searchTerm.toLowerCase()
    const matchesSearch = !searchTerm || 
      owner.name?.toLowerCase().includes(searchLower) ||
      owner.email?.toLowerCase().includes(searchLower) ||
      owner.phone?.includes(searchTerm) ||
      owner.businessName?.toLowerCase().includes(searchLower)

    const matchesStatus = statusFilter === 'all' || owner.status === statusFilter

    return matchesSearch && matchesStatus
  })

  // Handlers
  const handleLogout = async () => {
    try {
      await logout()
      router.push('/login')
    } catch (error) {
      console.error('Logout error:', error)
      showError('Failed to logout')
    }
  }

  const handleBack = () => {
    router.push('/dashboard/admin')
  }

  const handleEditOwner = (owner: ShopOwner) => {
    setSelectedOwner(owner)
    setShowEditUserDialog(true)
  }

  const handleResetPassword = (owner: ShopOwner) => {
    setSelectedOwner(owner)
    setShowPasswordResetDialog(true)
  }

  const handleRoleChange = (owner: ShopOwner) => {
    setSelectedOwner(owner)
    setShowRoleChangeDialog(true)
  }

  const handleViewAuditLog = (owner: ShopOwner) => {
    setSelectedOwner(owner)
    setShowAuditLogDialog(true)
  }

  const handleStatusChange = async (owner: ShopOwner, newStatus: string, reason?: string) => {
    try {
      const response = await fetch(`/api/users/${owner.id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus, reason })
      })

      if (response.ok) {
        success('Owner status updated')
        fetchOwners()
      } else {
        throw new Error('Failed to update status')
      }
    } catch (error) {
      showError('Failed to update status')
    }
  }

  const handleDeleteOwner = async (owner: ShopOwner) => {
    const confirmed = window.confirm(`Deactivate ${owner.name}? This will also deactivate their shops and workers.`)
    if (!confirmed) return

    try {
      const response = await fetch(`/api/users/${owner.id}`, { method: 'DELETE' })
      if (response.ok) {
        success('Owner deactivated')
        fetchOwners()
      } else {
        throw new Error('Failed to deactivate owner')
      }
    } catch (error) {
      showError('Failed to deactivate owner')
    }
  }

  // Stats
  const stats = {
    total: owners.length,
    active: owners.filter(o => o.status === 'ACTIVE').length,
    inactive: owners.filter(o => o.status === 'INACTIVE').length,
    totalShops: owners.reduce((sum, o) => sum + (o._count?.ownedShops || 0), 0)
  }

  return (
    <ProtectedRoute allowedRoles={[UserRole.SUPER_ADMIN]}>
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-orange-50 to-yellow-100">
        {/* Header */}
        <div className="bg-gradient-to-r from-orange-600 via-amber-600 to-yellow-700 text-white">
          <div className="px-8 py-12">
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-4">
                <button
                  onClick={handleBack}
                  className="p-3 bg-white/10 hover:bg-white/20 rounded-xl transition-all duration-200"
                  title="Back to Dashboard"
                >
                  <ArrowLeft className="h-5 w-5 text-white" />
                </button>
                <div>
                  <h1 className="text-4xl font-bold mb-2">
                    🏪 Shop Owners
                  </h1>
                  <p className="text-orange-100 text-lg">Manage franchise owners and their businesses</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="px-8 py-8 space-y-8">
          {/* Statistics */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card className="bg-gradient-to-br from-orange-500 to-orange-600 text-white">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-orange-100 text-sm mb-1">Total Owners</p>
                    <p className="text-3xl font-bold">{stats.total}</p>
                  </div>
                  <Users className="h-8 w-8 text-orange-200" />
                </div>
              </CardContent>
            </Card>
            <Card className="bg-gradient-to-br from-emerald-500 to-emerald-600 text-white">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-emerald-100 text-sm mb-1">Active Owners</p>
                    <p className="text-3xl font-bold">{stats.active}</p>
                  </div>
                  <TrendingUp className="h-8 w-8 text-emerald-200" />
                </div>
              </CardContent>
            </Card>
            <Card className="bg-gradient-to-br from-blue-500 to-blue-600 text-white">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-blue-100 text-sm mb-1">Total Shops</p>
                    <p className="text-3xl font-bold">{stats.totalShops}</p>
                  </div>
                  <Building2 className="h-8 w-8 text-blue-200" />
                </div>
              </CardContent>
            </Card>
            <Card className="bg-gradient-to-br from-purple-500 to-purple-600 text-white">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-purple-100 text-sm mb-1">Avg Shops/Owner</p>
                    <p className="text-3xl font-bold">{stats.total > 0 ? (stats.totalShops / stats.total).toFixed(1) : 0}</p>
                  </div>
                  <Store className="h-8 w-8 text-purple-200" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Search and Filters */}
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2 bg-orange-100 rounded-lg">
                  <Search className="h-5 w-5 text-orange-600" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">Search Shop Owners</h3>
                  <p className="text-sm text-gray-600">Find owners by name, email, or business</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="relative col-span-2">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    type="text"
                    placeholder="Search by name, email, phone, business name..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                  {searchTerm && (
                    <button
                      onClick={() => setSearchTerm('')}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2"
                    >
                      <X className="h-4 w-4 text-gray-400" />
                    </button>
                  )}
                </div>

                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="Filter by status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="ACTIVE">Active</SelectItem>
                    <SelectItem value="INACTIVE">Inactive</SelectItem>
                    <SelectItem value="SUSPENDED">Suspended</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Owners List */}
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-xl font-semibold text-gray-900">Shop Owners Directory</h3>
                  <p className="text-sm text-gray-600">
                    Showing {filteredOwners.length} of {owners.length} owners
                  </p>
                </div>
              </div>

              {loading ? (
                <div className="text-center py-12">
                  <div className="w-8 h-8 border-4 border-orange-600 border-t-transparent rounded-full animate-spin mx-auto" />
                  <p className="text-gray-600 mt-4">Loading shop owners...</p>
                </div>
              ) : filteredOwners.length === 0 ? (
                <div className="text-center py-12">
                  <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600">
                    {searchTerm || statusFilter !== 'all'
                      ? 'No shop owners match your filters'
                      : 'No shop owners found'}
                  </p>
                </div>
              ) : (
                <div className="grid gap-4">
                  {filteredOwners.map((owner) => (
                    <div
                      key={owner.id}
                      className="group bg-gradient-to-r from-white to-orange-50 rounded-xl p-6 border border-orange-200 hover:border-orange-400 hover:shadow-lg transition-all duration-300"
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex items-center space-x-4 min-w-0 flex-1">
                          <div className="w-16 h-16 bg-gradient-to-br from-orange-500 to-amber-600 rounded-xl flex items-center justify-center shadow-lg flex-shrink-0">
                            <span className="text-white font-bold text-2xl">{owner.name?.charAt(0) || 'O'}</span>
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <h4 className="text-lg font-bold text-gray-900">{owner.name}</h4>
                              <Badge className="bg-orange-100 text-orange-800">
                                {owner._count?.ownedShops || 0} shop{(owner._count?.ownedShops || 0) !== 1 ? 's' : ''}
                              </Badge>
                            </div>
                            {owner.businessName && (
                              <p className="text-base font-semibold text-orange-600 mb-1">{owner.businessName}</p>
                            )}
                            <p className="text-sm text-gray-600">{owner.email}</p>
                            {owner.phone && (
                              <p className="text-sm text-gray-500">{owner.phone}</p>
                            )}
                            {owner.lastLogin && (
                              <p className="text-xs text-gray-500 mt-2">
                                <span suppressHydrationWarning>
                                  Last login: {new Date(owner.lastLogin).toLocaleDateString('en-PK', {
                                    month: 'short',
                                    day: 'numeric',
                                    hour: '2-digit',
                                    minute: '2-digit'
                                  })}
                                </span>
                              </p>
                            )}
                          </div>
                        </div>
                        <div className="flex flex-wrap items-center gap-1">
                          <UserStatusToggle user={owner as any} onStatusChange={handleStatusChange as any} />
                          <button
                            onClick={() => handleEditOwner(owner)}
                            className="p-2 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg transition-colors"
                            title="Edit"
                          >
                            <Edit3 className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleRoleChange(owner)}
                            className="p-2 bg-purple-50 hover:bg-purple-100 text-purple-700 rounded-lg transition-colors"
                            title="Change Role"
                          >
                            <UserCog className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleViewAuditLog(owner)}
                            className="p-2 bg-gray-50 hover:bg-gray-100 text-gray-700 rounded-lg transition-colors"
                            title="Audit Log"
                          >
                            <History className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleResetPassword(owner)}
                            className="p-2 bg-orange-50 hover:bg-orange-100 text-orange-700 rounded-lg transition-colors"
                            title="Reset Password"
                          >
                            <Key className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteOwner(owner)}
                            className="p-2 bg-red-50 hover:bg-red-100 text-red-700 rounded-lg transition-colors"
                            title="Delete"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Dialogs */}
        <EditUserDialog
          user={selectedOwner as any}
          open={showEditUserDialog}
          onClose={() => {
            setShowEditUserDialog(false)
            setSelectedOwner(null)
          }}
          onSuccess={() => {
            setShowEditUserDialog(false)
            setSelectedOwner(null)
            fetchOwners()
          }}
        />

        <PasswordResetDialog
          user={selectedOwner as any}
          open={showPasswordResetDialog}
          onClose={() => {
            setShowPasswordResetDialog(false)
            setSelectedOwner(null)
          }}
          onSuccess={() => {
            setShowPasswordResetDialog(false)
            setSelectedOwner(null)
          }}
        />

        <RoleChangeDialog
          user={selectedOwner}
          open={showRoleChangeDialog}
          onClose={() => {
            setShowRoleChangeDialog(false)
            setSelectedOwner(null)
          }}
          onSuccess={() => {
            setShowRoleChangeDialog(false)
            setSelectedOwner(null)
            fetchOwners()
          }}
        />

        <UserAuditLogDialog
          userId={selectedOwner?.id || null}
          userName={selectedOwner?.name || null}
          open={showAuditLogDialog}
          onClose={() => {
            setShowAuditLogDialog(false)
            setSelectedOwner(null)
          }}
        />
      </div>
    </ProtectedRoute>
  )
}


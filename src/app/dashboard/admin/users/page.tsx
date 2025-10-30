'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/use-auth'
import { useNotify } from '@/hooks/use-notifications'
import { ProtectedRoute } from '@/components/auth/protected-route'
import { UserRole, UserStatus } from '@/types'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import {
  Users,
  Search,
  Filter,
  X,
  ArrowLeft,
  LogOut,
  UserPlus,
  CheckSquare,
  Square,
  Edit3,
  Key,
  Trash2,
  History,
  UserCog,
  Shield
} from 'lucide-react'
import { EditUserDialog } from '@/components/shop/EditUserDialog'
import { UserStatusToggle } from '@/components/shop/UserStatusToggle'
import { PasswordResetDialog } from '@/components/shop/PasswordResetDialog'
import { RoleChangeDialog } from '@/components/shop/RoleChangeDialog'
import { UserAuditLogDialog } from '@/components/shop/UserAuditLogDialog'
import { WorkerPermissionsDialog } from '@/components/shop/WorkerPermissionsDialog'
import { formatUserRole } from '@/utils/user-formatting'

interface User {
  id: string
  name: string
  email: string
  phone: string
  role: string
  status: string
  cnic?: string
  businessName?: string
  position?: string
  lastLogin?: string
  createdAt: string
}

export default function UserAdministrationPage() {
  const router = useRouter()
  const { user: currentUser, logout } = useAuth()
  const { success, error: showError } = useNotify()

  // State
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [roleFilter, setRoleFilter] = useState<string>('all')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [selectedUsers, setSelectedUsers] = useState<Set<string>>(new Set())
  const [showBulkActions, setShowBulkActions] = useState(false)

  // Dialog states
  const [showEditUserDialog, setShowEditUserDialog] = useState(false)
  const [showPasswordResetDialog, setShowPasswordResetDialog] = useState(false)
  const [showRoleChangeDialog, setShowRoleChangeDialog] = useState(false)
  const [showAuditLogDialog, setShowAuditLogDialog] = useState(false)
  const [showPermissionsDialog, setShowPermissionsDialog] = useState(false)
  const [selectedUser, setSelectedUser] = useState<User | null>(null)

  // Fetch all users
  const fetchUsers = async () => {
    try {
      setLoading(true)
      // Fetch without pagination to get all users
      const response = await fetch('/api/users?limit=1000')
      const data = await response.json()
      
      if (response.ok) {
        // The API returns 'data' not 'users'
        setUsers(data.data || data.users || [])
      } else {
        throw new Error(data.error || 'Failed to fetch users')
      }
    } catch (error) {
      console.error('Failed to fetch users:', error)
      showError('Failed to fetch users')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchUsers()
  }, [])

  // Filter users
  const filteredUsers = users.filter(user => {
    const searchLower = searchTerm.toLowerCase()
    const matchesSearch = !searchTerm || 
      user.name?.toLowerCase().includes(searchLower) ||
      user.email?.toLowerCase().includes(searchLower) ||
      user.phone?.includes(searchTerm) ||
      user.cnic?.includes(searchTerm)

    const matchesRole = roleFilter === 'all' || user.role === roleFilter
    const matchesStatus = statusFilter === 'all' || user.status === statusFilter

    return matchesSearch && matchesRole && matchesStatus
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

  const handleSelectUser = (userId: string) => {
    const newSelected = new Set(selectedUsers)
    if (newSelected.has(userId)) {
      newSelected.delete(userId)
    } else {
      newSelected.add(userId)
    }
    setSelectedUsers(newSelected)
  }

  const handleSelectAll = () => {
    if (selectedUsers.size === filteredUsers.length) {
      setSelectedUsers(new Set())
    } else {
      setSelectedUsers(new Set(filteredUsers.map(u => u.id)))
    }
  }

  const handleBulkStatusChange = async (newStatus: string) => {
    if (selectedUsers.size === 0) return

    const confirmed = window.confirm(`Change status for ${selectedUsers.size} user(s)?`)
    if (!confirmed) return

    try {
      const promises = Array.from(selectedUsers).map(userId =>
        fetch(`/api/users/${userId}/status`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status: newStatus, reason: 'Bulk status change' })
        })
      )

      await Promise.all(promises)
      success(`Updated ${selectedUsers.size} user(s)`)
      setSelectedUsers(new Set())
      fetchUsers()
    } catch (error) {
      showError('Failed to update users')
    }
  }

  const handleBulkDelete = async () => {
    if (selectedUsers.size === 0) return

    const confirmed = window.confirm(`Deactivate ${selectedUsers.size} user(s)?`)
    if (!confirmed) return

    try {
      const promises = Array.from(selectedUsers).map(userId =>
        fetch(`/api/users/${userId}`, { method: 'DELETE' })
      )

      await Promise.all(promises)
      success(`Deactivated ${selectedUsers.size} user(s)`)
      setSelectedUsers(new Set())
      fetchUsers()
    } catch (error) {
      showError('Failed to deactivate users')
    }
  }

  const handleEditUser = (user: User) => {
    setSelectedUser(user)
    setShowEditUserDialog(true)
  }

  const handleResetPassword = (user: User) => {
    setSelectedUser(user)
    setShowPasswordResetDialog(true)
  }

  const handleRoleChange = (user: User) => {
    setSelectedUser(user)
    setShowRoleChangeDialog(true)
  }

  const handleViewAuditLog = (user: User) => {
    setSelectedUser(user)
    setShowAuditLogDialog(true)
  }

  const handleManagePermissions = (user: User) => {
    setSelectedUser(user)
    setShowPermissionsDialog(true)
  }

  const handleStatusChange = async (user: User, newStatus: string, reason?: string) => {
    try {
      const response = await fetch(`/api/users/${user.id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus, reason })
      })

      if (response.ok) {
        success('User status updated')
        fetchUsers()
      } else {
        throw new Error('Failed to update status')
      }
    } catch (error) {
      showError('Failed to update status')
    }
  }

  const handleDeleteUser = async (user: User) => {
    const confirmed = window.confirm(`Deactivate ${user.name}?`)
    if (!confirmed) return

    try {
      const response = await fetch(`/api/users/${user.id}`, { method: 'DELETE' })
      if (response.ok) {
        success('User deactivated')
        fetchUsers()
      } else {
        throw new Error('Failed to deactivate user')
      }
    } catch (error) {
      showError('Failed to deactivate user')
    }
  }

  // Stats
  const stats = {
    total: users.length,
    superAdmins: users.filter(u => u.role === 'SUPER_ADMIN').length,
    shopOwners: users.filter(u => u.role === 'SHOP_OWNER').length,
    workers: users.filter(u => u.role === 'SHOP_WORKER').length,
    active: users.filter(u => u.status === 'ACTIVE').length,
    inactive: users.filter(u => u.status === 'INACTIVE').length
  }

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'SUPER_ADMIN': return 'bg-red-100 text-red-800'
      case 'SHOP_OWNER': return 'bg-blue-100 text-blue-800'
      case 'SHOP_WORKER': return 'bg-green-100 text-green-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  return (
    <ProtectedRoute allowedRoles={[UserRole.SUPER_ADMIN]}>
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
        {/* Header */}
        <div className="bg-gradient-to-r from-green-600 via-emerald-600 to-teal-700 text-white">
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
                    👥 User Administration
                  </h1>
                  <p className="text-green-100 text-lg">Manage all system users</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="px-8 py-8 space-y-8">
          {/* Statistics */}
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
            <Card className="bg-gradient-to-br from-purple-500 to-purple-600 text-white">
              <CardContent className="p-6">
                <div className="text-center">
                  <p className="text-purple-100 text-sm mb-1">Total Users</p>
                  <p className="text-3xl font-bold">{stats.total}</p>
                </div>
              </CardContent>
            </Card>
            <Card className="bg-gradient-to-br from-red-500 to-red-600 text-white">
              <CardContent className="p-6">
                <div className="text-center">
                  <p className="text-red-100 text-sm mb-1">Super Admins</p>
                  <p className="text-3xl font-bold">{stats.superAdmins}</p>
                </div>
              </CardContent>
            </Card>
            <Card className="bg-gradient-to-br from-blue-500 to-blue-600 text-white">
              <CardContent className="p-6">
                <div className="text-center">
                  <p className="text-blue-100 text-sm mb-1">Shop Owners</p>
                  <p className="text-3xl font-bold">{stats.shopOwners}</p>
                </div>
              </CardContent>
            </Card>
            <Card className="bg-gradient-to-br from-green-500 to-green-600 text-white">
              <CardContent className="p-6">
                <div className="text-center">
                  <p className="text-green-100 text-sm mb-1">Workers</p>
                  <p className="text-3xl font-bold">{stats.workers}</p>
                </div>
              </CardContent>
            </Card>
            <Card className="bg-gradient-to-br from-emerald-500 to-emerald-600 text-white">
              <CardContent className="p-6">
                <div className="text-center">
                  <p className="text-emerald-100 text-sm mb-1">Active</p>
                  <p className="text-3xl font-bold">{stats.active}</p>
                </div>
              </CardContent>
            </Card>
            <Card className="bg-gradient-to-br from-gray-500 to-gray-600 text-white">
              <CardContent className="p-6">
                <div className="text-center">
                  <p className="text-gray-100 text-sm mb-1">Inactive</p>
                  <p className="text-3xl font-bold">{stats.inactive}</p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Search and Filters */}
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <Search className="h-5 w-5 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">Search & Filter Users</h3>
                    <p className="text-sm text-gray-600">Find users across the system</p>
                  </div>
                </div>
                {selectedUsers.size > 0 && (
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-600">{selectedUsers.size} selected</span>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setShowBulkActions(!showBulkActions)}
                    >
                      <Filter className="h-4 w-4 mr-2" />
                      Bulk Actions
                    </Button>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="relative col-span-2">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    type="text"
                    placeholder="Search by name, email, phone, CNIC..."
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

                <Select value={roleFilter} onValueChange={setRoleFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="Filter by role" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Roles</SelectItem>
                    <SelectItem value="SUPER_ADMIN">Super Admin</SelectItem>
                    <SelectItem value="SHOP_OWNER">Shop Owner</SelectItem>
                    <SelectItem value="SHOP_WORKER">Worker</SelectItem>
                  </SelectContent>
                </Select>

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

              {showBulkActions && selectedUsers.size > 0 && (
                <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-blue-900">
                      {selectedUsers.size} user(s) selected
                    </span>
                    <div className="flex items-center gap-2">
                      <Select onValueChange={handleBulkStatusChange}>
                        <SelectTrigger className="w-40 h-9 text-sm">
                          <SelectValue placeholder="Change status" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="ACTIVE">Set Active</SelectItem>
                          <SelectItem value="INACTIVE">Set Inactive</SelectItem>
                          <SelectItem value="SUSPENDED">Set Suspended</SelectItem>
                        </SelectContent>
                      </Select>
                      <Button size="sm" variant="destructive" onClick={handleBulkDelete}>
                        <Trash2 className="h-4 w-4 mr-2" />
                        Deactivate
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setSelectedUsers(new Set())
                          setShowBulkActions(false)
                        }}
                      >
                        Cancel
                      </Button>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Users List */}
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-xl font-semibold text-gray-900">All Users</h3>
                  <p className="text-sm text-gray-600">
                    Showing {filteredUsers.length} of {users.length} users
                  </p>
                </div>
                {filteredUsers.length > 0 && (
                  <button
                    onClick={handleSelectAll}
                    className="flex items-center gap-2 px-4 py-2 border rounded-lg hover:bg-gray-50"
                  >
                    {selectedUsers.size === filteredUsers.length && filteredUsers.length > 0 ? (
                      <CheckSquare className="h-5 w-5 text-blue-600" />
                    ) : (
                      <Square className="h-5 w-5 text-gray-400" />
                    )}
                    <span className="text-sm">Select All</span>
                  </button>
                )}
              </div>

              {loading ? (
                <div className="text-center py-12">
                  <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto" />
                  <p className="text-gray-600 mt-4">Loading users...</p>
                </div>
              ) : filteredUsers.length === 0 ? (
                <div className="text-center py-12">
                  <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600">
                    {searchTerm || roleFilter !== 'all' || statusFilter !== 'all'
                      ? 'No users match your filters'
                      : 'No users found'}
                  </p>
                </div>
              ) : (
                <div className="grid gap-4">
                  {filteredUsers.map((user) => (
                    <div
                      key={user.id}
                      className="group bg-gradient-to-r from-white to-gray-50 rounded-xl p-4 border border-gray-200 hover:border-blue-300 hover:shadow-md transition-all duration-300"
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex items-center space-x-4 min-w-0 flex-1">
                          <button
                            onClick={() => handleSelectUser(user.id)}
                            className="flex-shrink-0 p-1 hover:bg-gray-100 rounded"
                          >
                            {selectedUsers.has(user.id) ? (
                              <CheckSquare className="h-5 w-5 text-blue-600" />
                            ) : (
                              <Square className="h-5 w-5 text-gray-400" />
                            )}
                          </button>
                          <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg flex-shrink-0">
                            <span className="text-white font-bold text-lg">{user.name?.charAt(0) || 'U'}</span>
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <p className="font-semibold text-gray-900">{user.name}</p>
                              <Badge className={getRoleBadgeColor(user.role)}>
                                {formatUserRole(user.role)}
                              </Badge>
                            </div>
                            <p className="text-sm text-gray-600 truncate">{user.email}</p>
                            {user.phone && (
                              <p className="text-xs text-gray-500">{user.phone}</p>
                            )}
                            {user.businessName && (
                              <p className="text-xs text-blue-600 font-medium">{user.businessName}</p>
                            )}
                            {user.lastLogin && (
                              <p className="text-xs text-gray-500 mt-1">
                                <span suppressHydrationWarning>
                                  Last login: {new Date(user.lastLogin).toLocaleDateString('en-PK', {
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
                          <UserStatusToggle user={user as any} onStatusChange={handleStatusChange as any} />
                          <button
                            onClick={() => handleEditUser(user)}
                            className="p-2 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg transition-colors"
                            title="Edit"
                          >
                            <Edit3 className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleRoleChange(user)}
                            className="p-2 bg-purple-50 hover:bg-purple-100 text-purple-700 rounded-lg transition-colors"
                            title="Change Role"
                          >
                            <UserCog className="h-4 w-4" />
                          </button>
                          {user.role === 'SHOP_WORKER' && (
                            <button
                              onClick={() => handleManagePermissions(user)}
                              className="p-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-lg transition-colors"
                              title="Manage Permissions"
                            >
                              <Shield className="h-4 w-4" />
                            </button>
                          )}
                          <button
                            onClick={() => handleViewAuditLog(user)}
                            className="p-2 bg-gray-50 hover:bg-gray-100 text-gray-700 rounded-lg transition-colors"
                            title="Audit Log"
                          >
                            <History className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleResetPassword(user)}
                            className="p-2 bg-orange-50 hover:bg-orange-100 text-orange-700 rounded-lg transition-colors"
                            title="Reset Password"
                          >
                            <Key className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteUser(user)}
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
          user={selectedUser as any}
          open={showEditUserDialog}
          onClose={() => {
            setShowEditUserDialog(false)
            setSelectedUser(null)
          }}
          onSuccess={() => {
            setShowEditUserDialog(false)
            setSelectedUser(null)
            fetchUsers()
          }}
        />

        <PasswordResetDialog
          user={selectedUser as any}
          open={showPasswordResetDialog}
          onClose={() => {
            setShowPasswordResetDialog(false)
            setSelectedUser(null)
          }}
          onSuccess={() => {
            setShowPasswordResetDialog(false)
            setSelectedUser(null)
          }}
        />

        <RoleChangeDialog
          user={selectedUser as any}
          open={showRoleChangeDialog}
          onClose={() => {
            setShowRoleChangeDialog(false)
            setSelectedUser(null)
          }}
          onSuccess={() => {
            setShowRoleChangeDialog(false)
            setSelectedUser(null)
            fetchUsers()
          }}
        />

        <UserAuditLogDialog
          userId={selectedUser?.id || null}
          userName={selectedUser?.name || null}
          open={showAuditLogDialog}
          onClose={() => {
            setShowAuditLogDialog(false)
            setSelectedUser(null)
          }}
        />

        <WorkerPermissionsDialog
          worker={selectedUser as any}
          open={showPermissionsDialog}
          onClose={() => {
            setShowPermissionsDialog(false)
            setSelectedUser(null)
          }}
          onSuccess={() => {
            setShowPermissionsDialog(false)
            setSelectedUser(null)
          }}
        />
      </div>
    </ProtectedRoute>
  )
}


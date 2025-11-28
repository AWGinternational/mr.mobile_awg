'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/use-auth'
import { useNotify } from '@/hooks/use-notifications'
import { ProtectedRoute } from '@/components/auth/protected-route'
import { UserRole } from '@/types'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { BusinessSidebar } from '@/components/layout/BusinessSidebar'
import { TopNavigation } from '@/components/layout/TopNavigation'
import {
  Users,
  Edit,
  Shield,
  CheckCircle,
  XCircle,
  ArrowLeft,
  Save,
  UserPlus,
  Trash2
} from 'lucide-react'

interface Worker {
  id: string
  name: string
  email: string
  phone: string | null
  joinedAt: string
  isActive: boolean
  permissions: {
    [key: string]: string[]
  }
}

interface ModulePermission {
  module: string
  displayName: string
  permissions: {
    VIEW: boolean
    CREATE: boolean
    EDIT: boolean
    DELETE: boolean
    MANAGE: boolean
  }
}

export default function WorkerManagementPage() {
  const router = useRouter()
  const { user: currentUser } = useAuth()
  const { success, error: showError } = useNotify()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [workers, setWorkers] = useState<Worker[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedWorker, setSelectedWorker] = useState<Worker | null>(null)
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [addWorkerDialogOpen, setAddWorkerDialogOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  
  // New Worker Form State
  const [newWorkerForm, setNewWorkerForm] = useState({
    name: '',
    email: '',
    phone: '',
    password: ''
  })

  // Module permissions state
  const [modulePermissions, setModulePermissions] = useState<ModulePermission[]>([
    {
      module: 'PRODUCT_MANAGEMENT',
      displayName: 'Products',
      permissions: { VIEW: true, CREATE: false, EDIT: false, DELETE: false, MANAGE: false }
    },
    {
      module: 'INVENTORY_MANAGEMENT',
      displayName: 'Inventory',
      permissions: { VIEW: true, CREATE: false, EDIT: false, DELETE: false, MANAGE: false }
    },
    {
      module: 'POS_SYSTEM',
      displayName: 'POS System',
      permissions: { VIEW: true, CREATE: true, EDIT: false, DELETE: false, MANAGE: false }
    },
    {
      module: 'CUSTOMER_MANAGEMENT',
      displayName: 'Customers',
      permissions: { VIEW: true, CREATE: true, EDIT: true, DELETE: false, MANAGE: false }
    },
    {
      module: 'SALES_REPORTS',
      displayName: 'Sales Reports',
      permissions: { VIEW: true, CREATE: false, EDIT: false, DELETE: false, MANAGE: false }
    },
    {
      module: 'SUPPLIER_MANAGEMENT',
      displayName: 'Suppliers',
      permissions: { VIEW: true, CREATE: false, EDIT: false, DELETE: false, MANAGE: false }
    },
    {
      module: 'PAYMENT_PROCESSING',
      displayName: 'Payments',
      permissions: { VIEW: false, CREATE: false, EDIT: false, DELETE: false, MANAGE: false }
    },
    {
      module: 'DAILY_CLOSING',
      displayName: 'Daily Closing',
      permissions: { VIEW: true, CREATE: false, EDIT: false, DELETE: false, MANAGE: false }
    },
    {
      module: 'LOAN_MANAGEMENT',
      displayName: 'Loans',
      permissions: { VIEW: false, CREATE: false, EDIT: false, DELETE: false, MANAGE: false }
    },
    {
      module: 'SERVICE_MANAGEMENT',
      displayName: 'Mobile Services',
      permissions: { VIEW: true, CREATE: true, EDIT: false, DELETE: false, MANAGE: false }
    }
  ])

  useEffect(() => {
    fetchWorkers()
  }, [])

  const fetchWorkers = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/settings/workers')
      const result = await response.json()

      if (response.ok && result.success) {
        setWorkers(result.data.workers)
      } else {
        showError(result.error || 'Failed to fetch workers')
      }
    } catch (error) {
      console.error('Error fetching workers:', error)
      showError('Failed to fetch workers')
    } finally {
      setLoading(false)
    }
  }

  const handleEditWorker = (worker: Worker) => {
    setSelectedWorker(worker)
    
    // Load worker's current permissions into the form - create completely new objects
    const updatedPermissions: ModulePermission[] = [
      {
        module: 'POS_SYSTEM',
        displayName: 'POS System',
        permissions: {
          VIEW: worker.permissions['POS_SYSTEM']?.includes('VIEW') || false,
          CREATE: worker.permissions['POS_SYSTEM']?.includes('CREATE') || false,
          EDIT: worker.permissions['POS_SYSTEM']?.includes('EDIT') || false,
          DELETE: worker.permissions['POS_SYSTEM']?.includes('DELETE') || false,
          MANAGE: worker.permissions['POS_SYSTEM']?.includes('MANAGE') || false
        }
      },
      {
        module: 'PRODUCT_MANAGEMENT',
        displayName: 'Product Management',
        permissions: {
          VIEW: worker.permissions['PRODUCT_MANAGEMENT']?.includes('VIEW') || false,
          CREATE: worker.permissions['PRODUCT_MANAGEMENT']?.includes('CREATE') || false,
          EDIT: worker.permissions['PRODUCT_MANAGEMENT']?.includes('EDIT') || false,
          DELETE: worker.permissions['PRODUCT_MANAGEMENT']?.includes('DELETE') || false,
          MANAGE: worker.permissions['PRODUCT_MANAGEMENT']?.includes('MANAGE') || false
        }
      },
      {
        module: 'INVENTORY_MANAGEMENT',
        displayName: 'Inventory Management',
        permissions: {
          VIEW: worker.permissions['INVENTORY_MANAGEMENT']?.includes('VIEW') || false,
          CREATE: worker.permissions['INVENTORY_MANAGEMENT']?.includes('CREATE') || false,
          EDIT: worker.permissions['INVENTORY_MANAGEMENT']?.includes('EDIT') || false,
          DELETE: worker.permissions['INVENTORY_MANAGEMENT']?.includes('DELETE') || false,
          MANAGE: worker.permissions['INVENTORY_MANAGEMENT']?.includes('MANAGE') || false
        }
      },
      {
        module: 'CUSTOMER_MANAGEMENT',
        displayName: 'Customer Management',
        permissions: {
          VIEW: worker.permissions['CUSTOMER_MANAGEMENT']?.includes('VIEW') || false,
          CREATE: worker.permissions['CUSTOMER_MANAGEMENT']?.includes('CREATE') || false,
          EDIT: worker.permissions['CUSTOMER_MANAGEMENT']?.includes('EDIT') || false,
          DELETE: worker.permissions['CUSTOMER_MANAGEMENT']?.includes('DELETE') || false,
          MANAGE: worker.permissions['CUSTOMER_MANAGEMENT']?.includes('MANAGE') || false
        }
      },
      {
        module: 'SALES_REPORTS',
        displayName: 'Sales & Reports',
        permissions: {
          VIEW: worker.permissions['SALES_REPORTS']?.includes('VIEW') || false,
          CREATE: worker.permissions['SALES_REPORTS']?.includes('CREATE') || false,
          EDIT: worker.permissions['SALES_REPORTS']?.includes('EDIT') || false,
          DELETE: worker.permissions['SALES_REPORTS']?.includes('DELETE') || false,
          MANAGE: worker.permissions['SALES_REPORTS']?.includes('MANAGE') || false
        }
      },
      {
        module: 'SUPPLIER_MANAGEMENT',
        displayName: 'Supplier Management',
        permissions: {
          VIEW: worker.permissions['SUPPLIER_MANAGEMENT']?.includes('VIEW') || false,
          CREATE: worker.permissions['SUPPLIER_MANAGEMENT']?.includes('CREATE') || false,
          EDIT: worker.permissions['SUPPLIER_MANAGEMENT']?.includes('EDIT') || false,
          DELETE: worker.permissions['SUPPLIER_MANAGEMENT']?.includes('DELETE') || false,
          MANAGE: worker.permissions['SUPPLIER_MANAGEMENT']?.includes('MANAGE') || false
        }
      },
      {
        module: 'PAYMENT_PROCESSING',
        displayName: 'Payments',
        permissions: {
          VIEW: worker.permissions['PAYMENT_PROCESSING']?.includes('VIEW') || false,
          CREATE: worker.permissions['PAYMENT_PROCESSING']?.includes('CREATE') || false,
          EDIT: worker.permissions['PAYMENT_PROCESSING']?.includes('EDIT') || false,
          DELETE: worker.permissions['PAYMENT_PROCESSING']?.includes('DELETE') || false,
          MANAGE: worker.permissions['PAYMENT_PROCESSING']?.includes('MANAGE') || false
        }
      },
      {
        module: 'DAILY_CLOSING',
        displayName: 'Daily Closing',
        permissions: {
          VIEW: worker.permissions['DAILY_CLOSING']?.includes('VIEW') || false,
          CREATE: worker.permissions['DAILY_CLOSING']?.includes('CREATE') || false,
          EDIT: worker.permissions['DAILY_CLOSING']?.includes('EDIT') || false,
          DELETE: worker.permissions['DAILY_CLOSING']?.includes('DELETE') || false,
          MANAGE: worker.permissions['DAILY_CLOSING']?.includes('MANAGE') || false
        }
      },
      {
        module: 'LOAN_MANAGEMENT',
        displayName: 'Loans',
        permissions: {
          VIEW: worker.permissions['LOAN_MANAGEMENT']?.includes('VIEW') || false,
          CREATE: worker.permissions['LOAN_MANAGEMENT']?.includes('CREATE') || false,
          EDIT: worker.permissions['LOAN_MANAGEMENT']?.includes('EDIT') || false,
          DELETE: worker.permissions['LOAN_MANAGEMENT']?.includes('DELETE') || false,
          MANAGE: worker.permissions['LOAN_MANAGEMENT']?.includes('MANAGE') || false
        }
      },
      {
        module: 'SERVICE_MANAGEMENT',
        displayName: 'Mobile Services',
        permissions: {
          VIEW: worker.permissions['SERVICE_MANAGEMENT']?.includes('VIEW') || false,
          CREATE: worker.permissions['SERVICE_MANAGEMENT']?.includes('CREATE') || false,
          EDIT: worker.permissions['SERVICE_MANAGEMENT']?.includes('EDIT') || false,
          DELETE: worker.permissions['SERVICE_MANAGEMENT']?.includes('DELETE') || false,
          MANAGE: worker.permissions['SERVICE_MANAGEMENT']?.includes('MANAGE') || false
        }
      }
    ]
    
    setModulePermissions(updatedPermissions)
    setEditDialogOpen(true)
  }

  const togglePermission = (moduleIndex: number, permission: keyof ModulePermission['permissions']) => {
    console.log('togglePermission called:', { moduleIndex, permission, currentState: modulePermissions[moduleIndex]?.permissions[permission] })
    
    setModulePermissions(prev => {
      const updated = [...prev]
      updated[moduleIndex] = {
        ...updated[moduleIndex],
        permissions: {
          ...updated[moduleIndex].permissions,
          [permission]: !updated[moduleIndex].permissions[permission]
        }
      }
      console.log('Updated permissions:', updated[moduleIndex])
      return updated
    })
  }

  const handleSavePermissions = async () => {
    if (!selectedWorker) return

    try {
      setSaving(true)

      // Convert permissions to API format
      const permissionsData = modulePermissions.reduce((acc, module) => {
        const enabledPerms = Object.entries(module.permissions)
          .filter(([_, enabled]) => enabled)
          .map(([perm, _]) => perm)
        
        if (enabledPerms.length > 0) {
          acc[module.module] = enabledPerms
        }
        return acc
      }, {} as { [key: string]: string[] })

      const response = await fetch(`/api/settings/workers/${selectedWorker.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ permissions: permissionsData })
      })

      const result = await response.json()

      if (response.ok && result.success) {
        success('Worker permissions updated successfully')
        setEditDialogOpen(false)
        fetchWorkers()
      } else {
        showError(result.error || 'Failed to update permissions')
      }
    } catch (error) {
      console.error('Error saving permissions:', error)
      showError('Failed to save permissions')
    } finally {
      setSaving(false)
    }
  }

  const handleToggleWorkerStatus = async (workerId: string, currentStatus: boolean) => {
    try {
      const response = await fetch('/api/settings/workers', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          workerId,
          isActive: !currentStatus 
        })
      })

      const result = await response.json()

      if (response.ok && result.success) {
        success(`Worker ${currentStatus ? 'deactivated' : 'activated'} successfully`)
        fetchWorkers()
      } else {
        showError(result.error || 'Failed to update worker status')
      }
    } catch (error) {
      console.error('Error toggling worker status:', error)
      showError('Failed to update worker status')
    }
  }

  const handleDeleteWorker = async (workerId: string, workerName: string) => {
    if (!confirm(`⚠️ Are you sure you want to permanently delete ${workerName}?\n\nThis action cannot be undone and will:\n• Delete the worker account\n• Remove all permissions\n• Delete all associated data`)) {
      return
    }

    try {
      const response = await fetch(`/api/settings/workers?workerId=${workerId}`, {
        method: 'DELETE'
      })

      const result = await response.json()

      if (response.ok && result.success) {
        success('Worker deleted successfully')
        fetchWorkers()
      } else {
        showError(result.error || 'Failed to delete worker')
      }
    } catch (error) {
      console.error('Error deleting worker:', error)
      showError('Failed to delete worker')
    }
  }

  const handleBack = () => {
    router.push('/settings/shop')
  }

  const handleAddWorker = async () => {
    try {
      // Validation
      if (!newWorkerForm.name || !newWorkerForm.email || !newWorkerForm.password) {
        showError('Please fill in all required fields')
        return
      }

      // Email validation
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      if (!emailRegex.test(newWorkerForm.email)) {
        showError('Please enter a valid email address')
        return
      }

      // Password validation
      if (newWorkerForm.password.length < 6) {
        showError('Password must be at least 6 characters long')
        return
      }

      setSaving(true)

      const response = await fetch('/api/settings/workers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newWorkerForm)
      })

      const result = await response.json()

      if (response.ok && result.success) {
        success('Worker added successfully!')
        setAddWorkerDialogOpen(false)
        setNewWorkerForm({ name: '', email: '', phone: '', password: '' })
        fetchWorkers()
      } else {
        showError(result.error || 'Failed to add worker')
      }
    } catch (error) {
      console.error('Error adding worker:', error)
      showError('Failed to add worker')
    } finally {
      setSaving(false)
    }
  }

  const canAddMoreWorkers = workers.length < 2

  return (
    <ProtectedRoute allowedRoles={[UserRole.SHOP_OWNER, UserRole.SUPER_ADMIN]}>
      <div className="flex min-h-screen bg-gray-50 dark:bg-gray-900">
        <BusinessSidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
        
        <div className={`flex-1 flex flex-col min-h-screen transition-all duration-300 ${sidebarOpen ? 'lg:ml-20' : 'lg:ml-64'}`}>
          <TopNavigation onMenuClick={() => setSidebarOpen(!sidebarOpen)} />
          
          <div className="flex-1 bg-gray-50 dark:bg-gray-900">
            {/* Header */}
            <div className="bg-gradient-to-r from-blue-600 to-indigo-700 dark:from-blue-800 dark:to-indigo-900 text-white">
              <div className="px-4 sm:px-6 lg:px-8 py-5 sm:py-6 lg:py-8 xl:py-12">
                <div className="flex flex-col gap-3 sm:gap-4 sm:flex-row sm:justify-between sm:items-center">
                  <div className="flex items-center gap-2.5 sm:gap-3 lg:gap-4 min-w-0 flex-1">
                    <button onClick={handleBack} className="p-2 sm:p-2.5 lg:p-3 bg-white/10 hover:bg-white/20 active:bg-white/30 rounded-xl transition-all duration-200 flex-shrink-0 touch-manipulation">
                      <ArrowLeft className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
                    </button>
                    <div className="min-w-0 flex-1">
                      <h1 className="text-xl sm:text-2xl lg:text-3xl xl:text-4xl font-bold mb-1 sm:mb-2 leading-tight">👥 Worker Management</h1>
                      <p className="text-blue-100 text-xs sm:text-sm lg:text-base leading-snug">
                        Manage worker accounts and permissions ({workers.length}/2 workers)
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2.5 sm:gap-3 lg:gap-4">
                    {canAddMoreWorkers && (
                      <Button
                        onClick={() => setAddWorkerDialogOpen(true)}
                        className="bg-white text-indigo-600 hover:bg-gray-100 active:bg-gray-200 text-xs sm:text-sm lg:text-base h-9 sm:h-10 touch-manipulation"
                      >
                        <UserPlus className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1.5 sm:mr-2" />
                        <span className="hidden sm:inline">Add Worker</span>
                        <span className="sm:hidden">Add</span>
                      </Button>
                    )}
                    <Shield className="h-10 w-10 sm:h-12 sm:w-12 lg:h-16 lg:w-16 text-white/20 hidden sm:block flex-shrink-0" />
                  </div>
                </div>
              </div>
            </div>

            {/* Content */}
            <div className="px-4 sm:px-6 lg:px-8 py-4 sm:py-6 lg:py-8">
              {loading ? (
                <div className="text-center py-8 sm:py-12">
                  <div className="animate-spin rounded-full h-10 w-10 sm:h-12 sm:w-12 border-b-2 border-blue-600 mx-auto"></div>
                  <p className="mt-3 sm:mt-4 text-xs sm:text-sm lg:text-base text-gray-600 dark:text-gray-400">Loading workers...</p>
                </div>
              ) : workers.length === 0 ? (
                <Card className="bg-white dark:bg-gray-800 dark:border-gray-700">
                  <CardContent className="p-6 sm:p-8 lg:p-12 text-center">
                    <Users className="h-10 w-10 sm:h-12 sm:w-12 lg:h-16 lg:w-16 text-gray-400 dark:text-gray-600 mx-auto mb-3 sm:mb-4" />
                    <h3 className="text-base sm:text-lg lg:text-xl font-semibold text-gray-900 dark:text-white mb-2">No Workers Yet</h3>
                    <p className="text-xs sm:text-sm lg:text-base text-gray-600 dark:text-gray-400">Add workers to your shop to manage their permissions.</p>
                  </CardContent>
                </Card>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 lg:gap-6">
                  {workers.map((worker) => (
                    <Card key={worker.id} className="hover:shadow-lg dark:hover:shadow-gray-900/50 transition-shadow bg-white dark:bg-gray-800 dark:border-gray-700">
                      <CardHeader className="p-3 sm:p-4 lg:p-6">
                        <div className="flex justify-between items-start gap-2">
                          <div className="min-w-0 flex-1">
                            <CardTitle className="text-sm sm:text-base lg:text-lg dark:text-white truncate">{worker.name}</CardTitle>
                            <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 mt-1 truncate leading-snug">{worker.email}</p>
                          </div>
                          {worker.isActive ? (
                            <Badge className="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300 text-xs flex-shrink-0">
                              <CheckCircle className="h-3 w-3 mr-1" />
                              Active
                            </Badge>
                          ) : (
                            <Badge className="bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300 text-xs flex-shrink-0">
                              <XCircle className="h-3 w-3 mr-1" />
                              Inactive
                            </Badge>
                          )}
                        </div>
                      </CardHeader>
                      <CardContent className="p-3 sm:p-4 lg:p-6 pt-0">
                        <div className="space-y-2 sm:space-y-3">
                          {worker.phone && (
                            <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 leading-snug">📱 {worker.phone}</p>
                          )}
                          <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 leading-snug">
                            Joined: {new Date(worker.joinedAt).toLocaleDateString()}
                          </p>
                          
                          <div className="flex gap-2 mt-3 sm:mt-4">
                            <Button
                              onClick={() => handleEditWorker(worker)}
                              className="flex-1 flex items-center justify-center gap-1.5 sm:gap-2 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700 text-xs sm:text-sm h-9 sm:h-8 touch-manipulation"
                              variant="outline"
                              size="sm"
                              disabled={!worker.isActive}
                            >
                              <Edit className="h-3.5 w-3.5 sm:h-4 sm:w-4 flex-shrink-0" />
                              <span className="hidden sm:inline">Edit Permissions</span>
                              <span className="sm:hidden">Permissions</span>
                            </Button>
                          </div>
                          
                          {worker.isActive ? (
                            <Button
                              onClick={() => handleToggleWorkerStatus(worker.id, worker.isActive)}
                              className="w-full bg-red-600 hover:bg-red-700 active:bg-red-800 text-white text-xs sm:text-sm h-9 sm:h-8 touch-manipulation"
                              size="sm"
                            >
                              <XCircle className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1.5 sm:mr-2 flex-shrink-0" />
                              <span className="hidden sm:inline">Deactivate Worker</span>
                              <span className="sm:hidden">Deactivate</span>
                            </Button>
                          ) : (
                            <div className="flex gap-2">
                              <Button
                                onClick={() => handleToggleWorkerStatus(worker.id, worker.isActive)}
                                className="flex-1 bg-green-600 hover:bg-green-700 active:bg-green-800 text-white text-xs sm:text-sm h-9 sm:h-8 touch-manipulation"
                                size="sm"
                              >
                                <CheckCircle className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1.5 sm:mr-2 flex-shrink-0" />
                                Reactivate
                              </Button>
                              <Button
                                onClick={() => handleDeleteWorker(worker.id, worker.name)}
                                className="flex-1 bg-red-600 hover:bg-red-700 active:bg-red-800 text-white text-xs sm:text-sm h-9 sm:h-8 touch-manipulation"
                                size="sm"
                              >
                                <Trash2 className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1.5 sm:mr-2 flex-shrink-0" />
                                Delete
                              </Button>
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Add Worker Dialog */}
      <Dialog open={addWorkerDialogOpen} onOpenChange={setAddWorkerDialogOpen}>
        <DialogContent className="max-w-[95vw] sm:max-w-[500px] bg-white dark:bg-gray-800 dark:border-gray-700 mx-4 sm:mx-auto">
          <DialogHeader className="px-1 sm:px-0">
            <DialogTitle className="text-xl sm:text-2xl dark:text-white flex items-center gap-2">
              <UserPlus className="h-5 w-5 sm:h-6 sm:w-6 text-indigo-600 dark:text-indigo-400 flex-shrink-0" />
              Add New Worker
            </DialogTitle>
            <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 mt-2 leading-relaxed">
              Add a new worker to your shop. Maximum 2 workers allowed per shop.
            </p>
          </DialogHeader>
          
          <div className="space-y-3 sm:space-y-4 mt-4 px-1 sm:px-0">
            <div>
              <Label htmlFor="worker-name" className="dark:text-gray-300 text-xs sm:text-sm">
                Full Name <span className="text-red-500">*</span>
              </Label>
              <Input
                id="worker-name"
                placeholder="Enter worker's full name"
                value={newWorkerForm.name}
                onChange={(e) => setNewWorkerForm({ ...newWorkerForm, name: e.target.value })}
                className="mt-1.5 dark:bg-gray-900 dark:border-gray-700 dark:text-white text-sm sm:text-base h-9 sm:h-10"
              />
            </div>

            <div>
              <Label htmlFor="worker-email" className="dark:text-gray-300 text-xs sm:text-sm">
                Email Address <span className="text-red-500">*</span>
              </Label>
              <Input
                id="worker-email"
                type="email"
                placeholder="worker@example.com"
                value={newWorkerForm.email}
                onChange={(e) => setNewWorkerForm({ ...newWorkerForm, email: e.target.value })}
                className="mt-1.5 dark:bg-gray-900 dark:border-gray-700 dark:text-white text-sm sm:text-base h-9 sm:h-10"
              />
            </div>

            <div>
              <Label htmlFor="worker-phone" className="dark:text-gray-300 text-xs sm:text-sm">
                Phone Number (Optional)
              </Label>
              <Input
                id="worker-phone"
                placeholder="+92 300 1234567"
                value={newWorkerForm.phone}
                onChange={(e) => setNewWorkerForm({ ...newWorkerForm, phone: e.target.value })}
                className="mt-1.5 dark:bg-gray-900 dark:border-gray-700 dark:text-white text-sm sm:text-base h-9 sm:h-10"
              />
            </div>

            <div>
              <Label htmlFor="worker-password" className="dark:text-gray-300 text-xs sm:text-sm">
                Password <span className="text-red-500">*</span>
              </Label>
              <Input
                id="worker-password"
                type="password"
                placeholder="Minimum 6 characters"
                value={newWorkerForm.password}
                onChange={(e) => setNewWorkerForm({ ...newWorkerForm, password: e.target.value })}
                className="mt-1.5 dark:bg-gray-900 dark:border-gray-700 dark:text-white text-sm sm:text-base h-9 sm:h-10"
              />
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1.5">
                The worker will use this password to login
              </p>
            </div>

            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3 sm:p-4 mt-4">
              <p className="text-xs sm:text-sm text-blue-800 dark:text-blue-300 leading-relaxed">
                ℹ️ After adding, you can customize this worker's permissions from the worker list.
              </p>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-2.5 sm:gap-3 justify-end mt-4 sm:mt-6 pt-4 border-t dark:border-gray-700 px-1 sm:px-0">
            <Button 
              variant="outline" 
              onClick={() => {
                setAddWorkerDialogOpen(false)
                setNewWorkerForm({ name: '', email: '', phone: '', password: '' })
              }}
              className="dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700 w-full sm:w-auto text-xs sm:text-sm h-9 sm:h-10 touch-manipulation"
            >
              Cancel
            </Button>
            <Button 
              onClick={handleAddWorker} 
              disabled={saving}
              className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white w-full sm:w-auto text-xs sm:text-sm h-9 sm:h-10 touch-manipulation"
            >
              {saving ? (
                <>
                  <div className="animate-spin rounded-full h-3.5 w-3.5 sm:h-4 sm:w-4 border-b-2 border-white mr-1.5 sm:mr-2"></div>
                  <span className="hidden sm:inline">Adding...</span>
                  <span className="sm:hidden">Adding</span>
                </>
              ) : (
                <>
                  <UserPlus className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1.5 sm:mr-2" />
                  <span className="hidden sm:inline">Add Worker</span>
                  <span className="sm:hidden">Add</span>
                </>
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Permissions Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="max-w-[95vw] sm:max-w-2xl lg:max-w-3xl max-h-[85vh] sm:max-h-[80vh] overflow-y-auto bg-white dark:bg-gray-800 dark:border-gray-700 mx-4 sm:mx-auto">
          <DialogHeader className="px-1 sm:px-0">
            <DialogTitle className="text-lg sm:text-xl lg:text-2xl dark:text-white truncate">
              Edit Permissions: {selectedWorker?.name}
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4 sm:space-y-6 mt-4 px-1 sm:px-0">
            {modulePermissions.map((module, index) => (
              <Card key={`${module.module}-${index}`} className="bg-white dark:bg-gray-900 dark:border-gray-700">
                <CardHeader className="p-3 sm:p-4 lg:p-6">
                  <CardTitle className="text-sm sm:text-base lg:text-lg dark:text-white">{module.displayName}</CardTitle>
                </CardHeader>
                <CardContent className="p-3 sm:p-4 lg:p-6 pt-0">
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-3 sm:gap-4">
                    {Object.entries(module.permissions).map(([permission, enabled]) => (
                      <div key={`${module.module}-${permission}`} className="flex items-center space-x-2 min-w-0">
                        <Switch
                          id={`${module.module}-${permission}-${index}`}
                          checked={enabled}
                          onCheckedChange={() => {
                            console.log('Toggle clicked:', module.module, permission, 'current:', enabled, 'index:', index)
                            togglePermission(index, permission as keyof ModulePermission['permissions'])
                          }}
                          className="flex-shrink-0 touch-manipulation"
                        />
                        <Label 
                          htmlFor={`${module.module}-${permission}-${index}`} 
                          className="text-xs sm:text-sm cursor-pointer dark:text-gray-300 truncate"
                        >
                          {permission}
                        </Label>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
            
            <div className="flex flex-col sm:flex-row gap-2.5 sm:gap-3 justify-end pt-4 border-t dark:border-gray-700">
              <Button 
                variant="outline" 
                onClick={() => setEditDialogOpen(false)}
                className="w-full sm:w-auto text-xs sm:text-sm h-9 sm:h-10 touch-manipulation dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
              >
                Cancel
              </Button>
              <Button 
                onClick={handleSavePermissions} 
                disabled={saving} 
                className="flex items-center justify-center gap-1.5 sm:gap-2 w-full sm:w-auto text-xs sm:text-sm h-9 sm:h-10 touch-manipulation"
              >
                {saving ? (
                  <>
                    <div className="animate-spin rounded-full h-3.5 w-3.5 sm:h-4 sm:w-4 border-b-2 border-white"></div>
                    <span className="hidden sm:inline">Saving...</span>
                    <span className="sm:hidden">Saving</span>
                  </>
                ) : (
                  <>
                    <Save className="h-3.5 w-3.5 sm:h-4 sm:w-4 flex-shrink-0" />
                    <span className="hidden sm:inline">Save Permissions</span>
                    <span className="sm:hidden">Save</span>
                  </>
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </ProtectedRoute>
  )
}

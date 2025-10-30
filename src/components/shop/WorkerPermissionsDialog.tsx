'use client'

import React, { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Shield, X, CheckSquare, Square } from 'lucide-react'
import { SystemModule, Permission } from '@/types'

interface WorkerPermissionsDialogProps {
  worker: {
    id: string
    name: string
    email: string
    role: string
  } | null
  open: boolean
  onClose: () => void
  onSuccess: () => void
}

interface ModulePermission {
  module: SystemModule
  permissions: Permission[]
}

const MODULES = [
  { value: SystemModule.PRODUCT_MANAGEMENT, label: 'Product Management' },
  { value: SystemModule.INVENTORY_MANAGEMENT, label: 'Inventory Management' },
  { value: SystemModule.POS_SYSTEM, label: 'POS System' },
  { value: SystemModule.CUSTOMER_MANAGEMENT, label: 'Customer Management' },
  { value: SystemModule.SALES_REPORTS, label: 'Sales Reports' },
  { value: SystemModule.SUPPLIER_MANAGEMENT, label: 'Supplier Management' },
  { value: SystemModule.PAYMENT_PROCESSING, label: 'Payment Processing' },
  { value: SystemModule.DAILY_CLOSING, label: 'Daily Closing' },
  { value: SystemModule.LOAN_MANAGEMENT, label: 'Loan Management' },
  { value: SystemModule.REPAIR_MANAGEMENT, label: 'Repair Management' },
  { value: SystemModule.SERVICE_MANAGEMENT, label: 'Service Management' },
  { value: SystemModule.BUSINESS_ANALYTICS, label: 'Business Analytics' }
]

const PERMISSIONS = [
  { value: Permission.VIEW, label: 'View' },
  { value: Permission.CREATE, label: 'Create' },
  { value: Permission.EDIT, label: 'Edit' },
  { value: Permission.DELETE, label: 'Delete' },
  { value: Permission.MANAGE, label: 'Manage' }
]

export function WorkerPermissionsDialog({ worker, open, onClose, onSuccess }: WorkerPermissionsDialogProps) {
  const [permissions, setPermissions] = useState<ModulePermission[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (open && worker) {
      fetchPermissions()
    }
  }, [open, worker])

  const fetchPermissions = async () => {
    if (!worker) return

    try {
      setLoading(true)
      const response = await fetch(`/api/users/${worker.id}/permissions`)
      const data = await response.json()

      if (response.ok) {
        setPermissions(data.permissions || [])
      }
    } catch (error) {
      console.error('Failed to fetch permissions:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleTogglePermission = (module: SystemModule, permission: Permission) => {
    setPermissions(prev => {
      const modulePerms = prev.find(p => p.module === module)
      
      if (!modulePerms) {
        return [...prev, { module, permissions: [permission] }]
      }

      const hasPermission = modulePerms.permissions.includes(permission)
      
      if (hasPermission) {
        // Remove permission
        const newPermissions = modulePerms.permissions.filter(p => p !== permission)
        if (newPermissions.length === 0) {
          return prev.filter(p => p.module !== module)
        }
        return prev.map(p => p.module === module ? { ...p, permissions: newPermissions } : p)
      } else {
        // Add permission
        return prev.map(p => p.module === module ? { ...p, permissions: [...p.permissions, permission] } : p)
      }
    })
  }

  const hasPermission = (module: SystemModule, permission: Permission) => {
    const modulePerms = permissions.find(p => p.module === module)
    return modulePerms?.permissions.includes(permission) || false
  }

  const handleSave = async () => {
    if (!worker) return

    try {
      setLoading(true)
      const response = await fetch(`/api/users/${worker.id}/permissions`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ permissions })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to update permissions')
      }

      onSuccess()
      onClose()
    } catch (error) {
      console.error('Permission update error:', error)
      alert(error instanceof Error ? error.message : 'Failed to update permissions')
    } finally {
      setLoading(false)
    }
  }

  if (!open || !worker) return null

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl shadow-2xl max-w-5xl w-full max-h-[85vh] border border-gray-200 flex flex-col">
        {/* Header */}
        <div className="p-6 border-b border-gray-200 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
              <Shield className="h-5 w-5 text-purple-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Worker Permissions</h3>
              <p className="text-sm text-gray-600">{worker.name} - {worker.email}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={loading}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X className="h-5 w-5 text-gray-500" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          <div className="space-y-6">
            {MODULES.map(module => (
              <div key={module.value} className="border border-gray-200 rounded-lg p-4">
                <h4 className="font-semibold text-gray-900 mb-3">{module.label}</h4>
                <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                  {PERMISSIONS.map(permission => (
                    <button
                      key={permission.value}
                      onClick={() => handleTogglePermission(module.value, permission.value)}
                      className={`flex items-center gap-2 p-2 rounded-lg border transition-all duration-200 ${
                        hasPermission(module.value, permission.value)
                          ? 'bg-purple-50 border-purple-300 text-purple-700'
                          : 'bg-white border-gray-200 text-gray-700 hover:border-purple-200'
                      }`}
                    >
                      {hasPermission(module.value, permission.value) ? (
                        <CheckSquare className="h-4 w-4 flex-shrink-0" />
                      ) : (
                        <Square className="h-4 w-4 flex-shrink-0" />
                      )}
                      <span className="text-sm">{permission.label}</span>
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-gray-200 bg-gray-50 rounded-b-xl flex justify-between items-center">
          <p className="text-sm text-gray-600">
            Configure module-specific permissions for this worker
          </p>
          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={onClose}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSave}
              disabled={loading}
              className="bg-purple-600 hover:bg-purple-700"
            >
              {loading ? 'Saving...' : 'Save Permissions'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}


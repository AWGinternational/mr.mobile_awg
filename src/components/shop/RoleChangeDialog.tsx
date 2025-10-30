'use client'

import React, { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Shield, AlertTriangle, UserCog } from 'lucide-react'
import { UserRole, UserStatus } from '@/types'

interface RoleChangeDialogProps {
  user: {
    id: string
    name: string
    email: string
    role: string
    status: string
  } | null
  open: boolean
  onClose: () => void
  onSuccess: () => void
}

export function RoleChangeDialog({ user, open, onClose, onSuccess }: RoleChangeDialogProps) {
  const [newRole, setNewRole] = useState<string>(user?.role || '')
  const [reason, setReason] = useState('')
  const [loading, setLoading] = useState(false)

  // Update newRole when user changes
  useEffect(() => {
    if (user?.role) {
      setNewRole(user.role)
      setReason('')
    }
  }, [user?.role, open])

  if (!open || !user) return null

  const handleConfirm = async () => {
    if (newRole === user.role) {
      return
    }

    try {
      setLoading(true)
      
      const response = await fetch(`/api/users/${user.id}/role`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role: newRole, reason })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to change role')
      }

      onSuccess()
      onClose()
    } catch (error) {
      console.error('Role change error:', error)
      alert(error instanceof Error ? error.message : 'Failed to change role')
    } finally {
      setLoading(false)
    }
  }

  const getRoleInfo = (role: string) => {
    switch (role) {
      case 'SUPER_ADMIN':
        return {
          label: 'Super Admin',
          color: 'text-red-700',
          bgColor: 'bg-red-50',
          description: 'Full system access and control',
          icon: Shield
        }
      case 'SHOP_OWNER':
        return {
          label: 'Shop Owner',
          color: 'text-blue-700',
          bgColor: 'bg-blue-50',
          description: 'Manage own shops and workers',
          icon: UserCog
        }
      case 'SHOP_WORKER':
        return {
          label: 'Shop Worker',
          color: 'text-green-700',
          bgColor: 'bg-green-50',
          description: 'Operational access with restrictions',
          icon: UserCog
        }
      default:
        return {
          label: 'Unknown',
          color: 'text-gray-700',
          bgColor: 'bg-gray-50',
          description: 'Unknown role',
          icon: UserCog
        }
    }
  }

  const currentRoleInfo = getRoleInfo(user.role)
  const newRoleInfo = getRoleInfo(newRole)
  const CurrentIcon = currentRoleInfo.icon
  const NewIcon = newRoleInfo.icon

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-2xl max-w-md w-full border border-gray-200">
        {/* Header */}
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center">
              <UserCog className="h-4 w-4 text-orange-600" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-gray-900">Change User Role</h3>
              <p className="text-sm text-gray-600">{user.name}</p>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-4 space-y-4">
          {/* Current Role */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">Current Role</Label>
            <div className={`p-3 rounded ${currentRoleInfo.bgColor} flex items-center gap-2`}>
              <CurrentIcon className={`h-5 w-5 ${currentRoleInfo.color}`} />
              <div>
                <p className={`text-sm font-medium ${currentRoleInfo.color}`}>{currentRoleInfo.label}</p>
                <p className="text-xs text-gray-600">{currentRoleInfo.description}</p>
              </div>
            </div>
          </div>

          {/* New Role Selection */}
          <div className="space-y-2">
            <Label htmlFor="new-role" className="text-sm font-medium">New Role</Label>
            <Select value={newRole} onValueChange={setNewRole}>
              <SelectTrigger className="h-10">
                <SelectValue placeholder="Select new role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="SUPER_ADMIN">Super Admin - Full system access</SelectItem>
                <SelectItem value="SHOP_OWNER">Shop Owner - Manage shops</SelectItem>
                <SelectItem value="SHOP_WORKER">Shop Worker - Operational access</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* New Role Preview */}
          {newRole !== user.role && (
            <div className="space-y-2">
              <Label className="text-sm font-medium">New Role Preview</Label>
              <div className={`p-3 rounded ${newRoleInfo.bgColor} flex items-center gap-2`}>
                <NewIcon className={`h-5 w-5 ${newRoleInfo.color}`} />
                <div>
                  <p className={`text-sm font-medium ${newRoleInfo.color}`}>{newRoleInfo.label}</p>
                  <p className="text-xs text-gray-600">{newRoleInfo.description}</p>
                </div>
              </div>
            </div>
          )}

          {/* Warning */}
          {newRole !== user.role && (
            <div className="p-3 bg-yellow-50 border border-yellow-200 rounded">
              <div className="flex items-start gap-2">
                <AlertTriangle className="h-5 w-5 text-yellow-600 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-sm font-medium text-yellow-800">Warning</p>
                  <p className="text-xs text-yellow-700 mt-1">
                    Changing the user role will immediately affect their permissions and access level.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Reason Input */}
          <div className="space-y-2">
            <Label htmlFor="reason" className="text-sm font-medium">
              Reason for Change (Optional)
            </Label>
            <Textarea
              id="reason"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Enter reason for role change..."
              rows={2}
              className="text-sm"
            />
            <p className="text-xs text-gray-500">
              This reason will be logged for audit purposes
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="flex gap-3 p-4 border-t border-gray-200 bg-gray-50 rounded-b-lg">
          <Button
            variant="outline"
            onClick={onClose}
            disabled={loading}
            className="flex-1 h-9 text-sm"
          >
            Cancel
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={loading || newRole === user.role}
            className="flex-1 h-9 text-sm bg-orange-600 hover:bg-orange-700"
          >
            {loading ? 'Changing...' : 'Change Role'}
          </Button>
        </div>
      </div>
    </div>
  )
}


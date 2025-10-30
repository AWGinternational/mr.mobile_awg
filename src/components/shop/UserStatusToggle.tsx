"use client"

import React, { useState } from 'react'
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { User, UserStatus } from '@/types'
import {
  CheckCircle,
  XCircle,
  AlertCircle,
  Clock,
  Shield,
  AlertTriangle,
  MessageSquare
} from 'lucide-react'

// Textarea component
const Textarea = ({ className, ...props }: React.TextareaHTMLAttributes<HTMLTextAreaElement>) => (
  <textarea
    className={`flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 ${className || ''}`}
    {...props}
  />
)

interface UserStatusToggleProps {
  user: User
  onStatusChange: (user: User, newStatus: UserStatus, reason?: string) => void
  disabled?: boolean
}

interface StatusChangeDialogProps {
  user: User
  open: boolean
  onClose: () => void
  onConfirm: (newStatus: UserStatus, reason: string) => void
}

function StatusChangeDialog({ user, open, onClose, onConfirm }: StatusChangeDialogProps) {
  const [newStatus, setNewStatus] = useState<UserStatus>(user.status)
  const [reason, setReason] = useState('')
  const [loading, setLoading] = useState(false)

  const getStatusInfo = (status: UserStatus) => {
    switch (status) {
      case 'ACTIVE':
        return {
          color: 'text-green-600',
          bgColor: 'bg-green-50',
          icon: CheckCircle,
          label: 'Active',
          description: 'User can login and access all features'
        }
      case 'INACTIVE':
        return {
          color: 'text-gray-600',
          bgColor: 'bg-gray-50',
          icon: XCircle,
          label: 'Inactive',
          description: 'User cannot login or access the system'
        }
      case 'SUSPENDED':
        return {
          color: 'text-red-600',
          bgColor: 'bg-red-50',
          icon: AlertCircle,
          label: 'Suspended',
          description: 'User is temporarily blocked from the system'
        }
      case 'PENDING_VERIFICATION':
        return {
          color: 'text-yellow-600',
          bgColor: 'bg-yellow-50',
          icon: Clock,
          label: 'Pending Verification',
          description: 'User needs to verify their account'
        }
      default:
        return {
          color: 'text-gray-600',
          bgColor: 'bg-gray-50',
          icon: XCircle,
          label: 'Unknown',
          description: 'Unknown status'
        }
    }
  }

  const handleConfirm = async () => {
    if (newStatus === user.status) {
      onClose()
      return
    }

    setLoading(true)
    try {
      await onConfirm(newStatus, reason)
      onClose()
    } catch (error) {
      console.error('Failed to change status:', error)
    } finally {
      setLoading(false)
    }
  }

  const currentStatusInfo = getStatusInfo(user.status)
  const newStatusInfo = getStatusInfo(newStatus)

  if (!open) return null

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-2xl max-w-sm w-full border border-gray-200">
        <div className="p-3 border-b border-gray-200">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-orange-100 rounded-full flex items-center justify-center">
              <Shield className="h-3 w-3 text-orange-600" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-gray-900">Change Status</h3>
              <p className="text-xs text-gray-600">{user.name}</p>
            </div>
          </div>
        </div>

        <div className="p-3 space-y-3">
          {/* Current Status */}
          <div className="space-y-1">
            <Label className="text-xs">Current Status</Label>
            <div className={`p-2 rounded ${currentStatusInfo.bgColor} flex items-center gap-2`}>
              <currentStatusInfo.icon className={`h-4 w-4 ${currentStatusInfo.color}`} />
              <div>
                <p className={`text-sm font-medium ${currentStatusInfo.color}`}>{currentStatusInfo.label}</p>
                <p className="text-xs text-gray-600">{currentStatusInfo.description}</p>
              </div>
            </div>
          </div>

          {/* New Status Selection */}
          <div className="space-y-1">
            <Label htmlFor="new-status" className="text-xs">New Status</Label>
            <Select value={newStatus} onValueChange={(value) => setNewStatus(value as UserStatus)}>
              <SelectTrigger className="h-8">
                <SelectValue placeholder="Select new status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ACTIVE">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <span>Active</span>
                  </div>
                </SelectItem>
                <SelectItem value="INACTIVE">
                  <div className="flex items-center gap-2">
                    <XCircle className="h-4 w-4 text-gray-600" />
                    <span>Inactive</span>
                  </div>
                </SelectItem>
                <SelectItem value="SUSPENDED">
                  <div className="flex items-center gap-2">
                    <AlertCircle className="h-4 w-4 text-red-600" />
                    <span>Suspended</span>
                  </div>
                </SelectItem>
                <SelectItem value="PENDING_VERIFICATION">
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-yellow-600" />
                    <span>Pending Verification</span>
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* New Status Preview */}
          {newStatus !== user.status && (
            <div className="space-y-1">
              <Label className="text-xs">New Status Preview</Label>
              <div className={`p-2 rounded ${newStatusInfo.bgColor} flex items-center gap-2`}>
                <newStatusInfo.icon className={`h-4 w-4 ${newStatusInfo.color}`} />
                <div>
                  <p className={`text-sm font-medium ${newStatusInfo.color}`}>{newStatusInfo.label}</p>
                  <p className="text-xs text-gray-600">{newStatusInfo.description}</p>
                </div>
              </div>
            </div>
          )}

          {/* Warning for Shop Owners */}
          {user.role === 'SHOP_OWNER' && newStatus === 'INACTIVE' && (
            <div className="p-2 bg-yellow-50 border border-yellow-200 rounded">
              <div className="flex items-start gap-2">
                <AlertTriangle className="h-4 w-4 text-yellow-600 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-yellow-800">Warning: Cascading Effect</p>
                  <p className="text-xs text-yellow-700">
                    Deactivating this shop owner will also deactivate all their shops and workers.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Reason Input */}
          <div className="space-y-1">
            <Label htmlFor="reason" className="text-xs">
              <div className="flex items-center gap-1">
                <MessageSquare className="h-3 w-3" />
                Reason for Change
              </div>
            </Label>
            <Textarea
              id="reason"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Enter reason for status change (optional)"
              rows={2}
              className="text-xs"
            />
            <p className="text-xs text-gray-500">
              This reason will be logged for audit purposes
            </p>
          </div>
        </div>

        <div className="flex gap-2 p-3 border-t border-gray-200 bg-gray-50 rounded-b-lg">
          <Button
            variant="outline"
            onClick={onClose}
            disabled={loading}
            className="flex-1 h-8 text-xs"
          >
            Cancel
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={loading || newStatus === user.status}
            className="flex-1 h-8 text-xs bg-orange-600 hover:bg-orange-700"
          >
            {loading ? 'Changing...' : 'Change Status'}
          </Button>
        </div>
      </div>
    </div>
  )
}

export function UserStatusToggle({ user, onStatusChange, disabled = false }: UserStatusToggleProps) {
  const [showDialog, setShowDialog] = useState(false)
  const [loading, setLoading] = useState(false)

  const getStatusConfig = (status: UserStatus) => {
    switch (status) {
      case 'ACTIVE':
        return {
          color: 'bg-green-100 text-green-800',
          icon: CheckCircle,
          label: 'Active'
        }
      case 'INACTIVE':
        return {
          color: 'bg-gray-100 text-gray-800',
          icon: XCircle,
          label: 'Inactive'
        }
      case 'SUSPENDED':
        return {
          color: 'bg-red-100 text-red-800',
          icon: AlertCircle,
          label: 'Suspended'
        }
      case 'PENDING_VERIFICATION':
        return {
          color: 'bg-yellow-100 text-yellow-800',
          icon: Clock,
          label: 'Pending'
        }
      default:
        return {
          color: 'bg-gray-100 text-gray-800',
          icon: XCircle,
          label: 'Unknown'
        }
    }
  }

  const handleStatusChangeConfirm = async (newStatus: UserStatus, reason: string) => {
    setLoading(true)
    try {
      await onStatusChange(user, newStatus, reason)
    } catch (error) {
      throw error
    } finally {
      setLoading(false)
    }
  }

  const statusConfig = getStatusConfig(user.status)
  const StatusIcon = statusConfig.icon

  return (
    <>
      <div className="flex items-center gap-2">
        <Badge className={statusConfig.color}>
          <StatusIcon className="w-3 h-3 mr-1" />
          {statusConfig.label}
        </Badge>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setShowDialog(true)}
          disabled={disabled || loading}
          className="text-xs"
        >
          Change
        </Button>
      </div>

      <StatusChangeDialog
        user={user}
        open={showDialog}
        onClose={() => setShowDialog(false)}
        onConfirm={handleStatusChangeConfirm}
      />
    </>
  )
}
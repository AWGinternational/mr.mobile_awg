"use client"

import React, { useState } from 'react'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { User } from '@/types'
import { formatUserRole } from '@/utils/user-formatting'
import {
  Key,
  Copy,
  CheckCircle,
  AlertTriangle,
  Mail,
  Clock,
  Shield,
  Eye,
  EyeOff
} from 'lucide-react'

interface PasswordResetDialogProps {
  user: User | null
  open: boolean
  onClose: () => void
  onSuccess: (credentials: { email: string; password: string; resetToken: string }) => void
}

interface ResetResult {
  temporaryPassword: string
  resetToken: string
  userInfo: {
    id: string
    name: string
    email: string
  }
  instructions: {
    message: string
    validFor: string
    emailSent: boolean
  }
}

export function PasswordResetDialog({ user, open, onClose, onSuccess }: PasswordResetDialogProps) {
  const [loading, setLoading] = useState(false)
  const [resetResult, setResetResult] = useState<ResetResult | null>(null)
  const [showPassword, setShowPassword] = useState(false)
  const [copied, setCopied] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleReset = async () => {
    if (!user) return

    setLoading(true)
    setError(null)

    try {
      const response = await fetch(`/api/users/${user.id}/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      })

      const result = await response.json()

      if (response.ok && result.success) {
        setResetResult(result)
        onSuccess({
          email: result.userInfo.email,
          password: result.temporaryPassword,
          resetToken: result.resetToken
        })
      } else {
        setError(result.error || 'Failed to reset password')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to reset password')
    } finally {
      setLoading(false)
    }
  }

  const handleCopyPassword = async () => {
    if (!resetResult) return

    try {
      await navigator.clipboard.writeText(resetResult.temporaryPassword)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error('Failed to copy password:', err)
    }
  }

  const handleClose = () => {
    setResetResult(null)
    setError(null)
    setCopied(false)
    setShowPassword(false)
    onClose()
  }

  if (!open || !user) return null

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl shadow-2xl max-w-md w-full border border-gray-200">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
              <Key className="h-5 w-5 text-red-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Reset Password</h3>
              <p className="text-sm text-gray-600">Generate new password for {user.name}</p>
            </div>
          </div>
        </div>

        <div className="p-6">
          {!resetResult ? (
            // Confirmation Step
            <div className="space-y-4">
              {error && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4 text-red-600" />
                    <p className="text-sm text-red-700">{error}</p>
                  </div>
                </div>
              )}

              <div className="space-y-3">
                <div className="p-4 bg-gray-50 rounded-lg">
                  <h4 className="font-medium text-gray-900 mb-2">User Information</h4>
                  <div className="space-y-1 text-sm">
                    <p><span className="font-medium">Name:</span> {user.name}</p>
                    <p><span className="font-medium">Email:</span> {user.email}</p>
                    <p><span className="font-medium">Role:</span> {formatUserRole(user.role)}</p>
                  </div>
                </div>

                <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <div className="flex items-start gap-2">
                    <AlertTriangle className="h-5 w-5 text-yellow-600 mt-0.5" />
                    <div>
                      <p className="font-medium text-yellow-800">Important</p>
                      <ul className="text-sm text-yellow-700 mt-1 space-y-1">
                        <li>• A new temporary password will be generated</li>
                        <li>• The user's current password will be invalidated</li>
                        <li>• User will be required to change password on next login</li>
                        <li>• This action will be logged for security purposes</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            // Success Step - Show New Credentials
            <div className="space-y-4">
              <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                  <p className="font-medium text-green-800">Password Reset Successful</p>
                </div>
                <p className="text-sm text-green-700">
                  New temporary password has been generated for {resetResult.userInfo.name}
                </p>
              </div>

              <div className="space-y-3">
                <div>
                  <Label htmlFor="reset-email">Email Address</Label>
                  <Input
                    id="reset-email"
                    value={resetResult.userInfo.email}
                    readOnly
                    className="bg-gray-50"
                  />
                </div>

                <div>
                  <Label htmlFor="reset-password">Temporary Password</Label>
                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <Input
                        id="reset-password"
                        type={showPassword ? 'text' : 'password'}
                        value={resetResult.temporaryPassword}
                        readOnly
                        className="bg-yellow-50 border-yellow-300 pr-10"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                      >
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleCopyPassword}
                      className="px-3"
                    >
                      {copied ? (
                        <CheckCircle className="h-4 w-4 text-green-600" />
                      ) : (
                        <Copy className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                  {copied && (
                    <p className="text-xs text-green-600 mt-1">Password copied to clipboard!</p>
                  )}
                </div>
              </div>

              <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="flex items-start gap-2">
                  <Clock className="h-4 w-4 text-blue-600 mt-0.5" />
                  <div className="text-sm">
                    <p className="font-medium text-blue-800">Next Steps</p>
                    <ul className="text-blue-700 mt-1 space-y-1">
                      <li>• Share these credentials with the user securely</li>
                      <li>• User must change password on next login</li>
                      <li>• Temporary password is valid for {resetResult.instructions.validFor}</li>
                      {!resetResult.instructions.emailSent && (
                        <li>• Consider sending credentials via secure channel</li>
                      )}
                    </ul>
                  </div>
                </div>
              </div>

              {!resetResult.instructions.emailSent && (
                <div className="p-3 bg-orange-50 border border-orange-200 rounded-lg">
                  <div className="flex items-center gap-2">
                    <Mail className="h-4 w-4 text-orange-600" />
                    <p className="text-sm text-orange-700">
                      <span className="font-medium">Note:</span> Email notification is not configured. 
                      Please share credentials manually.
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="flex gap-3 p-6 border-t border-gray-200 bg-gray-50 rounded-b-xl">
          {!resetResult ? (
            <>
              <Button
                variant="outline"
                onClick={handleClose}
                disabled={loading}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                onClick={handleReset}
                disabled={loading}
                className="flex-1 bg-red-600 hover:bg-red-700"
              >
                {loading ? 'Resetting...' : 'Reset Password'}
              </Button>
            </>
          ) : (
            <Button
              onClick={handleClose}
              className="w-full bg-blue-600 hover:bg-blue-700"
            >
              <Shield className="h-4 w-4 mr-2" />
              Close & Secure
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}
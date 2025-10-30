"use client"

import React, { useState } from 'react'
import { Button } from './button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './card'
import { Copy, Eye, EyeOff, CheckCircle } from 'lucide-react'

interface CredentialDisplayProps {
  email: string
  password: string
  userName: string
  onClose: () => void
}

export function CredentialDisplay({ email, password, userName, onClose }: CredentialDisplayProps) {
  const [showPassword, setShowPassword] = useState(false)
  const [copied, setCopied] = useState<'email' | 'password' | null>(null)

  const copyToClipboard = async (text: string, type: 'email' | 'password') => {
    try {
      await navigator.clipboard.writeText(text)
      setCopied(type)
      setTimeout(() => setCopied(null), 2000)
    } catch (error) {
      console.error('Failed to copy to clipboard:', error)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <Card className="w-full max-w-md mx-4">
        <CardHeader className="text-center">
          <div className="mx-auto w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mb-4">
            <CheckCircle className="w-6 h-6 text-green-600" />
          </div>
          <CardTitle className="text-green-800">Shop Owner Created Successfully!</CardTitle>
          <CardDescription>
            {userName} has been created. Please save these login credentials securely.
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-4">
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <p className="text-sm text-yellow-800 font-medium mb-2">
              ⚠️ Important: Save these credentials now!
            </p>
            <p className="text-xs text-yellow-700">
              These credentials will only be shown once for security reasons.
            </p>
          </div>

          {/* Email */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">Email Address</label>
            <div className="flex items-center gap-2">
              <div className="flex-1 p-3 bg-gray-50 rounded-md border font-mono text-sm">
                {email}
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => copyToClipboard(email, 'email')}
                className="px-3"
              >
                {copied === 'email' ? (
                  <CheckCircle className="w-4 h-4 text-green-600" />
                ) : (
                  <Copy className="w-4 h-4" />
                )}
              </Button>
            </div>
          </div>

          {/* Password */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">Temporary Password</label>
            <div className="flex items-center gap-2">
              <div className="flex-1 p-3 bg-gray-50 rounded-md border font-mono text-sm">
                {showPassword ? password : '•'.repeat(password.length)}
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowPassword(!showPassword)}
                className="px-3"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => copyToClipboard(password, 'password')}
                className="px-3"
              >
                {copied === 'password' ? (
                  <CheckCircle className="w-4 h-4 text-green-600" />
                ) : (
                  <Copy className="w-4 h-4" />
                )}
              </Button>
            </div>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <p className="text-sm text-blue-800 font-medium mb-1">
              Next Steps:
            </p>
            <ul className="text-xs text-blue-700 space-y-1">
              <li>• The shop owner can login at the login page</li>
              <li>• They should change their password after first login</li>
              <li>• They can then create and manage their shops</li>
            </ul>
          </div>

          <div className="flex gap-2 pt-4">
            <Button onClick={onClose} className="flex-1">
              I've Saved the Credentials
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
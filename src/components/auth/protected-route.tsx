'use client'

import { ReactNode, useEffect } from 'react'
import { useAuth } from '@/hooks/use-auth'
import { UserRole } from '@/types'
import { formatUserRole } from '@/utils/user-formatting'
import { Card, CardContent } from '@/components/ui/card'
import { Shield, ShieldAlert, Loader2 } from 'lucide-react'

interface ProtectedRouteProps {
  children: ReactNode
  allowedRoles?: UserRole[]
  requiredPermission?: {
    resource: string
    action: string
  }
  fallback?: ReactNode
}

export function ProtectedRoute({ 
  children, 
  allowedRoles, 
  requiredPermission,
  fallback 
}: ProtectedRouteProps) {
  const { user, isLoading, isAuthenticated, canAccess } = useAuth()

  // Show loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="flex flex-col items-center justify-center p-8">
            <Loader2 className="h-8 w-8 animate-spin text-blue-600 mb-4" />
            <h3 className="text-lg font-semibold text-gray-900">Verifying Access</h3>
            <p className="text-sm text-gray-600 text-center mt-2">
              Please wait while we verify your authentication...
            </p>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Show unauthorized if not authenticated
  if (!isAuthenticated) {
    if (fallback) return <>{fallback}</>
    
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="w-full max-w-md border-red-200">
          <CardContent className="flex flex-col items-center justify-center p-8">
            <ShieldAlert className="h-12 w-12 text-red-500 mb-4" />
            <h3 className="text-lg font-semibold text-gray-900">Access Denied</h3>
            <p className="text-sm text-gray-600 text-center mt-2">
              You need to be logged in to access this page.
            </p>
            <a 
              href="/login"
              className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700 transition-colors"
            >
              Go to Login
            </a>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Check role-based access
  if (allowedRoles && user && !allowedRoles.includes(user.role as UserRole)) {
    if (fallback) return <>{fallback}</>
    
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="w-full max-w-md border-orange-200">
          <CardContent className="flex flex-col items-center justify-center p-8">
            <Shield className="h-12 w-12 text-orange-500 mb-4" />
            <h3 className="text-lg font-semibold text-gray-900">Insufficient Permissions</h3>
            <p className="text-sm text-gray-600 text-center mt-2">
              Your role ({formatUserRole(user.role)}) doesn't have access to this page.
            </p>
            <a 
              href="/dashboard"
              className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700 transition-colors"
            >
              Go to Dashboard
            </a>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Check permission-based access
  if (requiredPermission && user && !canAccess(requiredPermission.resource, requiredPermission.action)) {
    if (fallback) return <>{fallback}</>
    
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="w-full max-w-md border-orange-200">
          <CardContent className="flex flex-col items-center justify-center p-8">
            <Shield className="h-12 w-12 text-orange-500 mb-4" />
            <h3 className="text-lg font-semibold text-gray-900">Permission Required</h3>
            <p className="text-sm text-gray-600 text-center mt-2">
              You don't have permission to {requiredPermission.action} {requiredPermission.resource}.
            </p>
            <a 
              href="/dashboard"
              className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700 transition-colors"
            >
              Go to Dashboard
            </a>
          </CardContent>
        </Card>
      </div>
    )
  }

  // If all checks pass, render children
  return <>{children}</>
}

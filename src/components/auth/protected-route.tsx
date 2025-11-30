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
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center p-4">
        <Card className="w-full max-w-xs sm:max-w-sm">
          <CardContent className="flex flex-col items-center justify-center p-5 sm:p-6">
            <Loader2 className="h-6 w-6 sm:h-8 sm:w-8 animate-spin text-blue-600 mb-3" />
            <h3 className="text-sm sm:text-base font-semibold text-gray-900 dark:text-white">Verifying Access</h3>
            <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 text-center mt-1.5">
              Please wait...
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
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center p-4">
        <Card className="w-full max-w-xs sm:max-w-sm border-red-200 dark:border-red-800 dark:bg-gray-800">
          <CardContent className="flex flex-col items-center justify-center p-5 sm:p-6">
            <ShieldAlert className="h-8 w-8 sm:h-10 sm:w-10 text-red-500 mb-3" />
            <h3 className="text-sm sm:text-base font-semibold text-red-600 dark:text-red-400">Access Denied</h3>
            <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 text-center mt-1.5">
              You need to be logged in to access this page.
            </p>
            <a 
              href="/login"
              className="mt-3 px-4 py-2 bg-blue-600 text-white rounded-lg text-xs sm:text-sm font-medium hover:bg-blue-700 transition-colors"
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
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center p-4">
        <Card className="w-full max-w-xs sm:max-w-sm border-orange-200 dark:border-orange-800 dark:bg-gray-800">
          <CardContent className="flex flex-col items-center justify-center p-5 sm:p-6">
            <Shield className="h-8 w-8 sm:h-10 sm:w-10 text-orange-500 mb-3" />
            <h3 className="text-sm sm:text-base font-semibold text-orange-600 dark:text-orange-400">Insufficient Permissions</h3>
            <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 text-center mt-1.5">
              Your role ({formatUserRole(user.role)}) doesn't have access.
            </p>
            <a 
              href="/dashboard"
              className="mt-3 px-4 py-2 bg-blue-600 text-white rounded-lg text-xs sm:text-sm font-medium hover:bg-blue-700 transition-colors"
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
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center p-4">
        <Card className="w-full max-w-xs sm:max-w-sm border-orange-200 dark:border-orange-800 dark:bg-gray-800">
          <CardContent className="flex flex-col items-center justify-center p-5 sm:p-6">
            <Shield className="h-8 w-8 sm:h-10 sm:w-10 text-orange-500 mb-3" />
            <h3 className="text-sm sm:text-base font-semibold text-orange-600 dark:text-orange-400">Permission Required</h3>
            <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 text-center mt-1.5">
              You don't have permission to {requiredPermission.action} {requiredPermission.resource}.
            </p>
            <a 
              href="/dashboard"
              className="mt-3 px-4 py-2 bg-blue-600 text-white rounded-lg text-xs sm:text-sm font-medium hover:bg-blue-700 transition-colors"
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

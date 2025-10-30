'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/use-auth'
import { Card, CardContent } from '@/components/ui/card'
import { Loader2 } from 'lucide-react'

export default function DashboardPage() {
  const { user, isLoading, isAuthenticated } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!isLoading) {
      if (!isAuthenticated) {
        router.replace('/login')
        return
      }

      if (user) {
        // Redirect to role-specific dashboard
        switch (user.role) {
          case 'SUPER_ADMIN':
            router.replace('/dashboard/admin')
            break
          case 'SHOP_OWNER':
            router.replace('/dashboard/owner')
            break
          case 'SHOP_WORKER':
            router.replace('/dashboard/worker')
            break
          default:
            router.replace('/dashboard/worker')
        }
      }
    }
  }, [isLoading, isAuthenticated, user, router])

  // Loading state while redirecting
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <Card className="w-full max-w-md">
        <CardContent className="flex flex-col items-center justify-center p-8">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600 mb-4" />
          <h3 className="text-lg font-semibold text-gray-900">Loading Dashboard</h3>
          <p className="text-sm text-gray-600 text-center mt-2">
            Redirecting to your dashboard based on your role...
          </p>
        </CardContent>
      </Card>
    </div>
  )
}

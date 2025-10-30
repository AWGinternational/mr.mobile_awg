'use client'

import { useEffect, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { AlertCircle, LogIn, Clock, Smartphone } from 'lucide-react'

export function ShiftGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const pathname = usePathname()
  const [shiftActive, setShiftActive] = useState<boolean | null>(null)
  const [shiftStartTime, setShiftStartTime] = useState<string | null>(null)

  // Check shift status on mount and when path changes
  useEffect(() => {
    const checkShiftStatus = () => {
      const savedShiftActive = localStorage.getItem('shiftActive') === 'true'
      const savedShiftStartTime = localStorage.getItem('shiftStartTime')
      
      setShiftActive(savedShiftActive)
      setShiftStartTime(savedShiftStartTime)
    }

    checkShiftStatus()

    // Listen for storage changes (if shift is started/ended in another tab)
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'shiftActive' || e.key === 'shiftStartTime') {
        checkShiftStatus()
      }
    }

    window.addEventListener('storage', handleStorageChange)
    return () => window.removeEventListener('storage', handleStorageChange)
  }, [pathname])

  // Show loading state initially
  if (shiftActive === null) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <Clock className="h-12 w-12 animate-spin text-blue-500 mx-auto mb-4" />
          <p className="text-gray-600 dark:text-gray-400">Checking shift status...</p>
        </div>
      </div>
    )
  }

  // Allow access to dashboard page (where they can start shift)
  const isDashboardPage = pathname === '/dashboard/worker'
  
  // If shift is not active and NOT on dashboard, block access
  if (!shiftActive && !isDashboardPage) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50 dark:bg-gray-900 p-4">
        <Card className="max-w-2xl w-full border-2 border-red-300 bg-gradient-to-br from-red-50 to-orange-50 dark:from-red-900/20 dark:to-orange-900/20 shadow-2xl">
          <CardContent className="pt-12 pb-12 px-8">
            <div className="text-center space-y-6">
              {/* Warning Icon */}
              <div className="flex justify-center">
                <div className="bg-red-500 p-6 rounded-full">
                  <AlertCircle className="h-16 w-16 text-white" />
                </div>
              </div>

              {/* Title */}
              <div>
                <h1 className="text-4xl font-bold text-red-900 dark:text-red-200 mb-3">
                  ⚠️ Shift Not Started
                </h1>
                <p className="text-xl text-red-700 dark:text-red-300">
                  You must start your shift to access this feature
                </p>
              </div>

              {/* Feature Locked Message */}
              <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border-2 border-red-200 dark:border-red-800">
                <p className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
                  🔒 The following features are locked:
                </p>
                <div className="grid grid-cols-2 gap-3 text-sm text-gray-700 dark:text-gray-300">
                  <div className="flex items-center gap-2">
                    <span className="text-red-500">✕</span> Point of Sale (POS)
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-red-500">✕</span> Mobile Services
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-red-500">✕</span> Inventory Updates
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-red-500">✕</span> Customer Management
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-red-500">✕</span> Product Creation
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-red-500">✕</span> All Transactions
                  </div>
                </div>
              </div>

              {/* Instructions */}
              <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-6 border border-blue-200 dark:border-blue-800">
                <p className="text-blue-900 dark:text-blue-200 font-medium mb-2">
                  📝 To access all features:
                </p>
                <ol className="text-left text-sm text-blue-800 dark:text-blue-300 space-y-2 ml-4">
                  <li>1. Go to your dashboard</li>
                  <li>2. Click the "Start My Shift" button</li>
                  <li>3. All features will be unlocked</li>
                </ol>
              </div>

              {/* Action Button */}
              <Button
                onClick={() => router.push('/dashboard/worker')}
                size="lg"
                className="bg-green-600 hover:bg-green-700 text-white px-10 py-7 text-xl font-bold shadow-2xl hover:shadow-3xl transform hover:scale-105 transition-all w-full"
              >
                <LogIn className="h-7 w-7 mr-3" />
                Go to Dashboard & Start Shift
              </Button>

              {/* Additional Info */}
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-4">
                <Clock className="inline h-4 w-4 mr-1" />
                Your shift time will be tracked for attendance and performance monitoring
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Shift is active or on dashboard page - allow access
  return <>{children}</>
}

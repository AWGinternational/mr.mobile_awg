'use client'

import { useState, useEffect } from 'react'
import { Button } from './button'
import { Card } from './card'
import { AlertCircle, Clock } from 'lucide-react'
import { formatTimeRemaining } from '@/hooks/use-session-timeout'

interface SessionTimeoutWarningProps {
  onExtend: () => void
  onLogout: () => void
  timeRemaining: number
}

/**
 * Modal warning dialog shown before session timeout
 */
export function SessionTimeoutWarning({ 
  onExtend, 
  onLogout, 
  timeRemaining: initialTime 
}: SessionTimeoutWarningProps) {
  const [timeRemaining, setTimeRemaining] = useState(initialTime)

  useEffect(() => {
    // Update time remaining every second
    const interval = setInterval(() => {
      setTimeRemaining(prev => {
        const newTime = Math.max(0, prev - 1000)
        if (newTime === 0) {
          onLogout()
        }
        return newTime
      })
    }, 1000)

    return () => clearInterval(interval)
  }, [onLogout])

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <Card className="max-w-md w-full mx-4 p-6 shadow-2xl border-2 border-orange-500">
        <div className="space-y-4">
          {/* Header */}
          <div className="flex items-start gap-4">
            <div className="flex-shrink-0 w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center">
              <AlertCircle className="h-6 w-6 text-orange-600" />
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-bold text-gray-900">
                Session Expiring Soon
              </h3>
              <p className="text-sm text-gray-600 mt-1">
                Your session will expire due to inactivity
              </p>
            </div>
          </div>

          {/* Timer */}
          <div className="bg-orange-50 border-2 border-orange-200 rounded-lg p-4 text-center">
            <div className="flex items-center justify-center gap-2 mb-2">
              <Clock className="h-5 w-5 text-orange-600" />
              <span className="text-sm font-medium text-orange-800">
                Time Remaining
              </span>
            </div>
            <div className="text-3xl font-bold text-orange-600 font-mono">
              {formatTimeRemaining(timeRemaining)}
            </div>
          </div>

          {/* Message */}
          <p className="text-sm text-gray-600 text-center">
            Click "Stay Logged In" to continue your session, or "Logout" to end it now.
          </p>

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <Button
              onClick={onLogout}
              variant="outline"
              className="flex-1"
            >
              Logout Now
            </Button>
            <Button
              onClick={onExtend}
              className="flex-1 bg-orange-600 hover:bg-orange-700"
            >
              Stay Logged In
            </Button>
          </div>
        </div>
      </Card>
    </div>
  )
}


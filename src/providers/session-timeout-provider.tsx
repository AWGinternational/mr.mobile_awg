'use client'

import { useState, useCallback } from 'react'
import { useSession } from 'next-auth/react'
import { useSessionTimeout } from '@/hooks/use-session-timeout'
import { SessionTimeoutWarning } from '@/components/ui/session-timeout-warning'
import { signOut } from 'next-auth/react'

interface SessionTimeoutProviderProps {
  children: React.ReactNode
}

/**
 * Provider to handle session timeout globally
 * Wrap your app with this to enable automatic logout after inactivity
 */
export function SessionTimeoutProvider({ children }: SessionTimeoutProviderProps) {
  const { data: session, status } = useSession()
  const [showWarning, setShowWarning] = useState(false)
  const [timeRemaining, setTimeRemaining] = useState(0)

  const handleWarning = useCallback(() => {
    setShowWarning(true)
    // Show warning with 5 minutes remaining
    setTimeRemaining(5 * 60 * 1000)
  }, [])

  const handleTimeout = useCallback(async () => {
    console.log('Session timed out - logging out')
    await signOut({
      callbackUrl: '/login?timeout=true',
      redirect: true
    })
  }, [])

  const { extendSession, getTimeRemaining } = useSessionTimeout({
    onWarning: handleWarning,
    onTimeout: handleTimeout,
    enabled: status === 'authenticated' && !!session
  })

  const handleExtend = useCallback(() => {
    setShowWarning(false)
    extendSession()
  }, [extendSession])

  const handleLogout = useCallback(async () => {
    setShowWarning(false)
    await signOut({
      callbackUrl: '/login',
      redirect: true
    })
  }, [])

  return (
    <>
      {children}
      {showWarning && (
        <SessionTimeoutWarning
          onExtend={handleExtend}
          onLogout={handleLogout}
          timeRemaining={timeRemaining}
        />
      )}
    </>
  )
}


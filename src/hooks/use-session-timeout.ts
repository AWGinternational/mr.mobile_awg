import { useEffect, useRef, useCallback } from 'react'
import { signOut } from 'next-auth/react'

/**
 * Session Timeout Configuration
 */
const SESSION_CONFIG = {
  // Timeout in milliseconds (30 minutes = 1800000ms)
  TIMEOUT_DURATION: parseInt(process.env.NEXT_PUBLIC_SESSION_TIMEOUT || '1800000'),
  
  // Warning before timeout (5 minutes = 300000ms)
  WARNING_DURATION: parseInt(process.env.NEXT_PUBLIC_SESSION_WARNING || '300000'),
  
  // Events that should reset the timer
  ACTIVITY_EVENTS: ['mousedown', 'keydown', 'scroll', 'touchstart', 'click']
}

interface SessionTimeoutOptions {
  onWarning?: () => void
  onTimeout?: () => void
  enabled?: boolean
}

/**
 * Hook to handle session timeout with activity tracking
 * Automatically logs out user after period of inactivity
 */
export function useSessionTimeout(options: SessionTimeoutOptions = {}) {
  const {
    onWarning,
    onTimeout,
    enabled = true
  } = options

  const timeoutRef = useRef<NodeJS.Timeout | undefined>(undefined)
  const warningRef = useRef<NodeJS.Timeout | undefined>(undefined)
  const lastActivityRef = useRef<number>(Date.now())

  /**
   * Handle timeout - logout user
   */
  const handleTimeout = useCallback(async () => {
    console.log('⏰ Session timeout - logging out user')
    
    if (onTimeout) {
      onTimeout()
    }

    // Sign out with redirect to login
    await signOut({
      callbackUrl: '/login?timeout=true',
      redirect: true
    })
  }, [onTimeout])

  /**
   * Handle warning - notify user before timeout
   */
  const handleWarning = useCallback(() => {
    console.log('⚠️ Session warning - will timeout soon')
    
    if (onWarning) {
      onWarning()
    }
  }, [onWarning])

  /**
   * Reset activity timer
   */
  const resetTimer = useCallback(() => {
    // Clear existing timers
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
    }
    if (warningRef.current) {
      clearTimeout(warningRef.current)
    }

    lastActivityRef.current = Date.now()

    // Set warning timer (e.g., 25 minutes)
    const warningTime = SESSION_CONFIG.TIMEOUT_DURATION - SESSION_CONFIG.WARNING_DURATION
    warningRef.current = setTimeout(handleWarning, warningTime)

    // Set timeout timer (e.g., 30 minutes)
    timeoutRef.current = setTimeout(handleTimeout, SESSION_CONFIG.TIMEOUT_DURATION)
  }, [handleWarning, handleTimeout])

  /**
   * Handle user activity
   */
  const handleActivity = useCallback(() => {
    // Only reset if at least 1 second has passed since last activity
    // This prevents excessive timer resets
    if (Date.now() - lastActivityRef.current > 1000) {
      resetTimer()
    }
  }, [resetTimer])

  /**
   * Setup activity listeners
   */
  useEffect(() => {
    if (!enabled) {
      return
    }

    // Initialize timer
    resetTimer()

    // Add activity event listeners
    SESSION_CONFIG.ACTIVITY_EVENTS.forEach(event => {
      document.addEventListener(event, handleActivity, { passive: true })
    })

    // Cleanup
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
      if (warningRef.current) {
        clearTimeout(warningRef.current)
      }

      SESSION_CONFIG.ACTIVITY_EVENTS.forEach(event => {
        document.removeEventListener(event, handleActivity)
      })
    }
  }, [enabled, handleActivity, resetTimer])

  /**
   * Manual extend session
   */
  const extendSession = useCallback(() => {
    console.log('🔄 Session extended by user')
    resetTimer()
  }, [resetTimer])

  /**
   * Get time remaining until timeout
   */
  const getTimeRemaining = useCallback(() => {
    const elapsed = Date.now() - lastActivityRef.current
    const remaining = SESSION_CONFIG.TIMEOUT_DURATION - elapsed
    return Math.max(0, remaining)
  }, [])

  return {
    extendSession,
    getTimeRemaining,
    isActive: enabled
  }
}

/**
 * Format milliseconds to readable time
 */
export function formatTimeRemaining(ms: number): string {
  const minutes = Math.floor(ms / 60000)
  const seconds = Math.floor((ms % 60000) / 1000)
  
  if (minutes > 0) {
    return `${minutes}m ${seconds}s`
  }
  return `${seconds}s`
}


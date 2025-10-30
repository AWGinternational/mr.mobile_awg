'use client'

import { useSession as useNextAuthSession, signIn, signOut } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useCallback, useEffect, useRef } from 'react'
import { UserRole } from '@/types'

// Session timeout configuration
const IDLE_TIMEOUT = 30 * 60 * 1000 // 30 minutes
const WARNING_TIMEOUT = 25 * 60 * 1000 // 25 minutes (5 min warning)

// Custom hook for authentication
export function useAuth() {
  const { data: session, status } = useNextAuthSession()
  const router = useRouter()
  const isLoggingOut = useRef(false)
  const idleTimer = useRef<NodeJS.Timeout | null>(null)
  const warningTimer = useRef<NodeJS.Timeout | null>(null)

  const user = session?.user

  // Session timeout and idle logout implementation
  const resetIdleTimer = useCallback(() => {
    // Clear existing timers
    if (idleTimer.current) clearTimeout(idleTimer.current)
    if (warningTimer.current) clearTimeout(warningTimer.current)

    // Only set timers if user is authenticated and not logging out
    if (status === 'authenticated' && !isLoggingOut.current) {
      // Set warning timer (5 minutes before logout)
      warningTimer.current = setTimeout(() => {
        if (!isLoggingOut.current) {
          console.log('⚠️ Session will expire in 5 minutes due to inactivity')
          // Could show a warning modal here
        }
      }, WARNING_TIMEOUT)

      // Set logout timer
      idleTimer.current = setTimeout(async () => {
        if (!isLoggingOut.current) {
          console.log('🕐 Session expired due to inactivity')
          await signOut({ redirect: false })
          router.push('/login?reason=timeout')
        }
      }, IDLE_TIMEOUT)
    }
  }, [status, router])

  // Reset timer on user activity
  useEffect(() => {
    const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart', 'click']
    
    const resetTimer = () => {
      if (status === 'authenticated' && !isLoggingOut.current) {
        resetIdleTimer()
      }
    }

    // Add event listeners
    events.forEach(event => {
      document.addEventListener(event, resetTimer, true)
    })

    // Initial timer setup
    resetIdleTimer()

    // Cleanup function
    return () => {
      events.forEach(event => {
        document.removeEventListener(event, resetTimer, true)
      })
      if (idleTimer.current) clearTimeout(idleTimer.current)
      if (warningTimer.current) clearTimeout(warningTimer.current)
    }
  }, [status, resetIdleTimer])

  // Role-based dashboard redirection (defined first)
  const redirectToDashboard = useCallback((role: UserRole) => {
    console.log('Redirecting user with role:', role)
    switch (role) {
      case UserRole.SUPER_ADMIN:
        router.push('/dashboard/admin')
        break
      case UserRole.SHOP_OWNER:
        router.push('/dashboard/owner')
        break
      case UserRole.SHOP_WORKER:
        router.push('/dashboard/worker')
        break
      default:
        router.push('/dashboard/worker')
    }
  }, [router])

  // Login function
  const login = useCallback(async (email: string, password: string) => {
    try {
      console.log('Attempting login for:', email)
      const result = await signIn('credentials', {
        email,
        password,
        redirect: false,
      })

      console.log('SignIn result:', result)

      if (result?.error) {
        const errorMessage = typeof result.error === 'string' ? result.error : 'Login failed'
        throw new Error(errorMessage)
      }

      if (!result?.ok) {
        throw new Error('Invalid email or password')
      }

      // Return the result - redirection will be handled by useEffect when session updates
      return result
    } catch (error) {
      console.error('Login error:', error)
      throw error
    }
  }, [])

  // Handle redirection after successful login
  useEffect(() => {
    console.log('Auth status changed:', { status, userRole: user?.role, user, isLoggingOut: isLoggingOut.current })
    
    // Only redirect to dashboard if:
    // 1. User just became authenticated (not already on a protected page)
    // 2. User is not in the process of logging out
    // 3. User is on login page or root page (not already navigated to a specific route)
    if (status === 'authenticated' && user?.role && !isLoggingOut.current) {
      const currentPath = window.location.pathname
      const isOnLoginOrRoot = currentPath === '/login' || currentPath === '/'
      
      // Only redirect if user is on login page or root page
      // Do NOT redirect if user is already on a protected page like /shops
      if (isOnLoginOrRoot) {
        console.log('Redirecting from login/root to dashboard for role:', user.role)
        redirectToDashboard(user.role as UserRole)
      } else {
        console.log('User already on protected page, skipping redirect:', currentPath)
      }
    }
    
    // Reset logging out flag when unauthenticated
    if (status === 'unauthenticated') {
      isLoggingOut.current = false
    }
  }, [status, user?.role, redirectToDashboard])

  // Logout function
  const logout = useCallback(async () => {
    try {
      console.log('🚪 Starting logout process...')
      isLoggingOut.current = true
      
      await signOut({ 
        redirect: false,
        callbackUrl: '/login'
      })
      console.log('✅ SignOut completed, redirecting to login...')
      
      router.push('/login')
    } catch (error) {
      console.error('❌ Logout error:', error)
      isLoggingOut.current = false
      throw error
    }
  }, [router])

  // Check if user has specific role
  const hasRole = useCallback((role: UserRole): boolean => {
    return user?.role === role
  }, [user])

  // Check if user can access resource
  const canAccess = useCallback((resource: string, action: string): boolean => {
    if (!user) return false
    
    // Import permissions check (we'll implement this)
    // For now, return basic role-based access
    if (user.role === UserRole.SUPER_ADMIN) return true
    if (user.role === UserRole.SHOP_OWNER && action !== 'manage_system') return true
    if (user.role === UserRole.SHOP_WORKER && action === 'read') return true
    
    return false
  }, [user])

  return {
    user,
    session,
    status,
    isLoading: status === 'loading',
    isAuthenticated: !!session && !!user,
    login,
    logout,
    hasRole,
    canAccess,
    redirectToDashboard,
  }
}

// Hook for role-based access
export function useRoleGuard(allowedRoles: UserRole[]) {
  const { user, isLoading, isAuthenticated } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!isLoading) {
      if (!isAuthenticated) {
        router.push('/login')
        return
      }

      if (user && !allowedRoles.includes(user.role as UserRole)) {
        // Redirect to appropriate dashboard if role not allowed
        switch (user.role as UserRole) {
          case UserRole.SUPER_ADMIN:
            router.push('/dashboard/admin')
            break
          case UserRole.SHOP_OWNER:
            router.push('/dashboard/owner')
            break
          case UserRole.SHOP_WORKER:
            router.push('/dashboard/worker')
            break
          default:
            router.push('/login')
        }
      }
    }
  }, [isLoading, isAuthenticated, user, allowedRoles, router])

  return {
    isLoading,
    isAuthenticated,
    hasAccess: user ? allowedRoles.includes(user.role as UserRole) : false,
    user,
  }
}

// Hook for permission-based access
export function usePermissions() {
  const { user } = useAuth()

  const checkPermission = useCallback((resource: string, action: string): boolean => {
    if (!user) return false

    // Super admin has all permissions
    if (user.role === UserRole.SUPER_ADMIN) return true

    // Shop owner has most permissions within their shop
    if (user.role === UserRole.SHOP_OWNER) {
      const restrictedActions = ['manage_system', 'create_shops', 'manage_all_users']
      return !restrictedActions.includes(action)
    }

    // Shop worker has limited permissions
    if (user.role === UserRole.SHOP_WORKER) {
      const allowedActions = [
        'read', 'create_sale', 'process_payment', 'view_products', 
        'view_customers', 'create_customer', 'submit_closing'
      ]
      return allowedActions.includes(action)
    }

    return false
  }, [user])

  return { checkPermission, user }
}

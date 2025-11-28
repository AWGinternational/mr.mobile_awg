'use client'

// Opt out of static generation due to useSearchParams
export const dynamic = 'force-dynamic'

import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useAuth } from '@/hooks/use-auth'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Eye, EyeOff, Smartphone, Loader2, Store, Shield, Users } from 'lucide-react'
import { AuthLoadingOverlay, AuthSuccessOverlay } from '@/components/ui/auth-loading-overlay'

function LoginContent() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [loginSuccess, setLoginSuccess] = useState(false)
  
  const { login, isAuthenticated, user, logout } = useAuth()
  const router = useRouter()
  const searchParams = useSearchParams()

  // Check if user wants to force login (e.g., after logout)
  const forceLogin = searchParams?.get('force') === 'true'

  // Redirect if already authenticated (unless forcing login)
  useEffect(() => {
    if (isAuthenticated && user && !forceLogin) {
      // Don't auto-redirect on login page - let user choose where to go
      // Only redirect if they came from a protected route
      const callbackUrl = searchParams?.get('callbackUrl')
      if (callbackUrl) {
        router.push(callbackUrl)
      }
      // Otherwise, let them stay on login page or manually navigate
    }
  }, [isAuthenticated, user, router, forceLogin, searchParams])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setIsLoading(true)

    try {
      // Basic validation
      if (!email || !password) {
        throw new Error('Please fill in all fields')
      }

      // Use NextAuth for all authentication
      const result = await login(email, password)
      
      if (result?.error) {
        throw new Error(result.error)
      }

      // Show success animation
      setLoginSuccess(true)
      
      // Wait a moment for animation then redirect
      setTimeout(() => {
        // Login function will handle redirection automatically
      }, 1500)
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed')
      setIsLoading(false)
    }
  }

  return (
    <>
      {/* Loading Overlay */}
      {isLoading && !loginSuccess && <AuthLoadingOverlay message="Signing you in..." />}
      
      {/* Success Overlay */}
      {loginSuccess && <AuthSuccessOverlay />}
      
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-gray-900 dark:via-gray-900 dark:to-gray-900 p-4">
        {/* Background Pattern */}
        <div className="absolute inset-0 bg-grid-slate-100 dark:bg-grid-slate-800 [mask-image:linear-gradient(0deg,white,rgba(255,255,255,0.6))] dark:[mask-image:linear-gradient(0deg,rgba(0,0,0,0.8),rgba(0,0,0,0.4))]" />
        
        <Card className="w-full max-w-md relative z-10 shadow-2xl border-0 bg-white/95 dark:bg-gray-800/95 backdrop-blur-sm">
        <CardHeader className="text-center space-y-6 pb-8">
          {/* Logo */}
          <div className="flex justify-center">
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl blur-lg opacity-50" />
              <div className="relative bg-gradient-to-r from-blue-600 to-purple-600 p-4 rounded-2xl">
                <Smartphone className="h-8 w-8 text-white" />
              </div>
            </div>
          </div>
          
          {/* Title */}
          <div>
            <CardTitle className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              Mr. Mobile
            </CardTitle>
            <CardDescription className="text-gray-600 dark:text-gray-400 mt-2">
              Mobile Shop Management System
            </CardDescription>
          </div>

          {/* Features */}
          <div className="grid grid-cols-3 gap-4 pt-4">
            <div className="text-center">
              <div className="bg-blue-100 dark:bg-blue-900/30 p-3 rounded-xl inline-block mb-2">
                <Store className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              </div>
              <p className="text-xs text-gray-600 dark:text-gray-400 font-medium">Multi-Shop</p>
            </div>
            <div className="text-center">
              <div className="bg-purple-100 dark:bg-purple-900/30 p-3 rounded-xl inline-block mb-2">
                <Shield className="h-5 w-5 text-purple-600 dark:text-purple-400" />
              </div>
              <p className="text-xs text-gray-600 dark:text-gray-400 font-medium">Secure</p>
            </div>
            <div className="text-center">
              <div className="bg-indigo-100 dark:bg-indigo-900/30 p-3 rounded-xl inline-block mb-2">
                <Users className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
              </div>
              <p className="text-xs text-gray-600 dark:text-gray-400 font-medium">Role-Based</p>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Existing User Alert */}
          {isAuthenticated && user && forceLogin && (
            <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-xl">
              <p className="text-sm text-yellow-800 dark:text-yellow-300 mb-3">
                Logged in as <strong>{user.email}</strong>
              </p>
              <Button
                variant="outline"
                onClick={async () => {
                  await logout()
                  window.location.href = '/login'
                }}
                className="w-full"
              >
                Logout and Switch Account
              </Button>
            </div>
          )}
          
          <form onSubmit={handleSubmit} className="space-y-5">
            {error && (
              <Alert variant="destructive" className="border-red-300 dark:border-red-800">
                <AlertDescription className="text-red-800 dark:text-red-300">{error}</AlertDescription>
              </Alert>
            )}
            
            <div className="space-y-2">
              <Label htmlFor="email" className="text-gray-700 dark:text-gray-300 font-medium">Email Address</Label>
              <Input
                id="email"
                type="email"
                placeholder="your@email.com"
                value={email}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEmail(e.target.value)}
                required
                disabled={isLoading}
                className="h-12 bg-gray-50 dark:bg-gray-900 border-gray-200 dark:border-gray-700"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="text-gray-700 dark:text-gray-300 font-medium">Password</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setPassword(e.target.value)}
                  required
                  disabled={isLoading}
                  className="h-12 bg-gray-50 dark:bg-gray-900 border-gray-200 dark:border-gray-700 pr-12"
                />
                <button
                  type="button"
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
                  onClick={() => setShowPassword(!showPassword)}
                  disabled={isLoading}
                >
                  {showPassword ? (
                    <EyeOff className="h-5 w-5" />
                  ) : (
                    <Eye className="h-5 w-5" />
                  )}
                </button>
              </div>
            </div>

            <Button 
              type="submit" 
              className="w-full h-12 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-medium shadow-lg shadow-blue-500/30 dark:shadow-blue-500/20" 
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Signing in...
                </>
              ) : (
                'Sign In'
              )}
            </Button>
          </form>

          <div className="text-center pt-2">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Need access?{' '}
              <a 
                href="mailto:abdulwahab01567@gmail.com?subject=Mr.%20Mobile%20-%20Access%20Request&body=Hello%20Admin%2C%0A%0AI%20would%20like%20to%20request%20access%20to%20the%20Mr.%20Mobile%20Shop%20Management%20System.%0A%0AMy%20Details%3A%0AName%3A%20%0APhone%3A%20%0AShop%20Name%3A%20%0A%0AThank%20you." 
                className="font-medium text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300"
              >
                Contact Administrator
              </a>
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
    </>
  )
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-gray-900 dark:via-gray-900 dark:to-gray-900">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    }>
      <LoginContent />
    </Suspense>
  )
}

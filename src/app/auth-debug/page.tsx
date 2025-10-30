'use client'

import { useState } from 'react'
import { signIn, signOut, useSession } from 'next-auth/react'
import { useAuth } from '@/hooks/use-auth'

export default function AuthDebugPage() {
  const [email, setEmail] = useState('admin@mrmobile.pk')
  const [password, setPassword] = useState('demo123')
  const [isLoading, setIsLoading] = useState(false)
  const [result, setResult] = useState<any>(null)
  
  const { data: session, status } = useSession()
  const { user, isAuthenticated } = useAuth()

  const handleTestLogin = async () => {
    setIsLoading(true)
    setResult(null)
    
    console.log('🚀 Starting login test...')
    
    try {
      const result = await signIn('credentials', {
        email,
        password,
        redirect: false,
      })
      
      console.log('📊 Login result:', result)
      setResult(result)
      
    } catch (error) {
      console.error('💥 Login error:', error)
      setResult({ error: error instanceof Error ? error.message : 'Unknown error occurred' })
    } finally {
      setIsLoading(false)
    }
  }

  const handleLogout = async () => {
    await signOut({ redirect: false })
    setResult(null)
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">🔐 Authentication Debug Center</h1>
        
        <div className="space-y-6">
          {/* Login Test Form */}
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-xl font-semibold mb-4">Login Test</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Email:</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full p-2 border rounded"
                  placeholder="Enter email"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Password:</label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full p-2 border rounded"
                  placeholder="Enter password"
                />
              </div>
              <div className="flex space-x-4">
                <button
                  onClick={handleTestLogin}
                  disabled={isLoading}
                  className="bg-blue-600 text-white px-4 py-2 rounded disabled:opacity-50"
                >
                  {isLoading ? 'Testing...' : 'Test Login'}
                </button>
                <button
                  onClick={handleLogout}
                  className="bg-red-600 text-white px-4 py-2 rounded"
                >
                  Logout
                </button>
              </div>
            </div>
            
            {result && (
              <div className="mt-4 p-4 bg-gray-100 rounded">
                <h3 className="font-semibold">Login Result:</h3>
                <pre className="text-sm mt-2 overflow-auto">
                  {JSON.stringify(result, null, 2)}
                </pre>
              </div>
            )}
          </div>

          {/* Session Status */}
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-xl font-semibold mb-4">Session Status</h2>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <h3 className="font-medium">NextAuth Session:</h3>
                <p>Status: <span className="font-mono">{status}</span></p>
                <p>Has Session: <span className="font-mono">{!!session ? 'Yes' : 'No'}</span></p>
                <p>User ID: <span className="font-mono">{session?.user?.id || 'None'}</span></p>
                <p>Email: <span className="font-mono">{session?.user?.email || 'None'}</span></p>
                <p>Role: <span className="font-mono">{(session?.user as any)?.role || 'None'}</span></p>
              </div>
              <div>
                <h3 className="font-medium">useAuth Hook:</h3>
                <p>Is Authenticated: <span className="font-mono">{isAuthenticated ? 'Yes' : 'No'}</span></p>
                <p>User Object: <span className="font-mono">{user ? 'Present' : 'Missing'}</span></p>
                <p>User Role: <span className="font-mono">{user?.role || 'None'}</span></p>
                <p>User Name: <span className="font-mono">{user?.name || 'None'}</span></p>
              </div>
            </div>
          </div>

          {/* Raw Data */}
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-xl font-semibold mb-4">Raw Session Data</h2>
            <pre className="bg-gray-100 p-4 rounded text-sm overflow-auto">
              {JSON.stringify(session, null, 2)}
            </pre>
          </div>

          {/* Demo Accounts */}
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-xl font-semibold mb-4">Available Demo Accounts</h2>
            <div className="space-y-2 text-sm">
              <div className="p-2 bg-red-50 rounded">
                <strong>Super Admin:</strong> admin@mrmobile.pk / demo123
              </div>
              <div className="p-2 bg-blue-50 rounded">
                <strong>Shop Owner:</strong> owner@karachi.shop / demo123
              </div>
              <div className="p-2 bg-green-50 rounded">
                <strong>Shop Worker:</strong> worker@karachi.shop / demo123
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

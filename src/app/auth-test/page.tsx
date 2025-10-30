'use client'

import { useAuth } from '@/hooks/use-auth'
import { useSession } from 'next-auth/react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

export default function AuthTestPage() {
  const { user, status, isAuthenticated, login, logout } = useAuth()
  const { data: session, status: sessionStatus } = useSession()

  const handleTestLogin = async () => {
    try {
      await login('admin@mrmobile.pk', 'demo123')
    } catch (error) {
      console.error('Test login failed:', error)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto space-y-6">
        <h1 className="text-3xl font-bold text-gray-900">Authentication Test Page</h1>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Session Status */}
          <Card>
            <CardHeader>
              <CardTitle>Session Status</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <p><strong>Status:</strong> {sessionStatus}</p>
                <p><strong>Authenticated:</strong> {isAuthenticated ? 'Yes' : 'No'}</p>
                <p><strong>User ID:</strong> {session?.user?.id || 'None'}</p>
                <p><strong>Email:</strong> {session?.user?.email || 'None'}</p>
                <p><strong>Name:</strong> {session?.user?.name || 'None'}</p>
                <p><strong>Role:</strong> {(session?.user as any)?.role || 'None'}</p>
              </div>
            </CardContent>
          </Card>

          {/* useAuth Hook Data */}
          <Card>
            <CardHeader>
              <CardTitle>useAuth Hook Data</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <p><strong>Hook Status:</strong> {status}</p>
                <p><strong>User Object:</strong> {user ? 'Present' : 'Missing'}</p>
                <p><strong>User Role:</strong> {user?.role || 'None'}</p>
                <p><strong>User Name:</strong> {user?.name || 'None'}</p>
                <p><strong>User Email:</strong> {user?.email || 'None'}</p>
              </div>
            </CardContent>
          </Card>

          {/* Raw Session Data */}
          <Card className="md:col-span-2">
            <CardHeader>
              <CardTitle>Raw Session Data</CardTitle>
            </CardHeader>
            <CardContent>
              <pre className="bg-gray-100 p-4 rounded-lg text-sm overflow-auto">
                {JSON.stringify(session, null, 2)}
              </pre>
            </CardContent>
          </Card>

          {/* Actions */}
          <Card className="md:col-span-2">
            <CardHeader>
              <CardTitle>Test Actions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex space-x-4">
                <Button onClick={handleTestLogin}>
                  Test Login (Admin)
                </Button>
                <Button onClick={logout} variant="destructive">
                  Logout
                </Button>
                <Button onClick={() => window.location.reload()} variant="outline">
                  Refresh Page
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

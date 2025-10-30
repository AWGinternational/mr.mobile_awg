'use client'


import { useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/use-auth'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ProtectedRoute } from '@/components/auth/protected-route'
import { UserRole } from '@/types'
import { 
  Building2,
  Users,
  Settings,
  BarChart3,
  Shield,
  Database,
  TrendingUp,
  Store
} from 'lucide-react'

export default function SuperAdminDashboard() {
  const router = useRouter()
  const { logout } = useAuth()

  const handleLogout = async () => {
    try {
      await logout()
    } catch (error) {
      console.error('Logout error:', error)
      router.push('/login')
    }
  }

  const systemStats = {
    totalShops: 12,
    totalUsers: 47,
    totalOwners: 8,
    totalRevenue: 2450000,
    systemHealth: 98.5,
    activeCities: ['Karachi', 'Lahore', 'Islamabad', 'Rawalpindi', 'Faisalabad'],
    gstCompliantShops: 11,
    pendingRegistrations: 3
  }

  const regionStats = [
    { region: 'Sindh', shops: 5, revenue: 1200000, growth: '+15%' },
    { region: 'Punjab', shops: 4, revenue: 950000, growth: '+12%' },
    { region: 'KPK', shops: 2, revenue: 180000, growth: '+8%' },
    { region: 'Islamabad', shops: 1, revenue: 120000, growth: '+20%' }
  ]

  return (
    <ProtectedRoute allowedRoles={[UserRole.SUPER_ADMIN]}>
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        {/* Super Admin Header */}
      <header className="bg-gradient-to-r from-red-600 to-red-700 text-white shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <div className="bg-white/20 p-2 rounded-lg">
                <Shield className="h-6 w-6 text-white" />
              </div>
              <div className="ml-3">
                <h1 className="text-xl font-bold">Super Administrator</h1>
                <p className="text-red-100 text-sm">System-wide Control Panel</p>
              </div>
            </div>
            <Button onClick={handleLogout} variant="outline" className="text-red-600 border-white hover:bg-white/10">
              Logout
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          
          {/* System Overview Stats */}
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">System Overview</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <Card className="bg-gradient-to-br from-blue-500 to-blue-600 text-white">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-blue-100 text-sm">Total Shops</p>
                      <p className="text-3xl font-bold">{systemStats.totalShops}</p>
                    </div>
                    <Building2 className="h-8 w-8 text-blue-200" />
                  </div>
                </CardContent>
              </Card>
              
              <Card className="bg-gradient-to-br from-green-500 to-green-600 text-white">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-green-100 text-sm">Total Revenue</p>
                      <p className="text-3xl font-bold">PKR {(systemStats.totalRevenue / 1000).toFixed(0)}K</p>
                    </div>
                    <TrendingUp className="h-8 w-8 text-green-200" />
                  </div>
                </CardContent>
              </Card>
              
              <Card className="bg-gradient-to-br from-purple-500 to-purple-600 text-white">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-purple-100 text-sm">Total Users</p>
                      <p className="text-3xl font-bold">{systemStats.totalUsers}</p>
                    </div>
                    <Users className="h-8 w-8 text-purple-200" />
                  </div>
                </CardContent>
              </Card>
              
              <Card className="bg-gradient-to-br from-orange-500 to-orange-600 text-white">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-orange-100 text-sm">System Health</p>
                      <p className="text-3xl font-bold">{systemStats.systemHealth}%</p>
                    </div>
                    <BarChart3 className="h-8 w-8 text-orange-200" />
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Admin Modules */}
          <div className="mb-8">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Administrative Modules</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              
              <Card className="hover:shadow-lg transition-all duration-200 cursor-pointer group">
                <CardHeader className="flex flex-row items-center space-y-0 pb-2">
                  <div className="p-2 rounded-lg bg-blue-500 text-white group-hover:scale-110 transition-transform">
                    <Building2 className="h-5 w-5" />
                  </div>
                  <div className="ml-3 flex-1">
                    <CardTitle className="text-lg">Shop Management</CardTitle>
                    <p className="text-sm text-gray-500 font-medium">{systemStats.totalShops}</p>
                  </div>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-gray-600 mb-3">
                    Create, manage, and monitor all mobile shops
                  </CardDescription>
                  <Button 
                    className="w-full" 
                    size="sm"
                    onClick={() => router.push('/dashboard/admin/shops')}
                  >
                    Access Module
                  </Button>
                </CardContent>
              </Card>

              <Card className="hover:shadow-lg transition-all duration-200 cursor-pointer group">
                <CardHeader className="flex flex-row items-center space-y-0 pb-2">
                  <div className="p-2 rounded-lg bg-green-500 text-white group-hover:scale-110 transition-transform">
                    <Users className="h-5 w-5" />
                  </div>
                  <div className="ml-3 flex-1">
                    <CardTitle className="text-lg">User Administration</CardTitle>
                    <p className="text-sm text-gray-500 font-medium">{systemStats.totalUsers}</p>
                  </div>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-gray-600 mb-3">
                    Manage shop owners, workers, and permissions
                  </CardDescription>
                  <Button 
                    className="w-full" 
                    size="sm"
                    onClick={() => router.push('/dashboard/admin/users')}
                  >
                    Access Module
                  </Button>
                </CardContent>
              </Card>

              <Card className="hover:shadow-lg transition-all duration-200 cursor-pointer group">
                <CardHeader className="flex flex-row items-center space-y-0 pb-2">
                  <div className="p-2 rounded-lg bg-orange-500 text-white group-hover:scale-110 transition-transform">
                    <Store className="h-5 w-5" />
                  </div>
                  <div className="ml-3 flex-1">
                    <CardTitle className="text-lg">Shop Owners</CardTitle>
                    <p className="text-sm text-gray-500 font-medium">{systemStats.totalOwners}</p>
                  </div>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-gray-600 mb-3">
                    Manage franchise owners and their shops
                  </CardDescription>
                  <Button 
                    className="w-full" 
                    size="sm"
                    onClick={() => router.push('/dashboard/admin/owners')}
                  >
                    Access Module
                  </Button>
                </CardContent>
              </Card>

              <Card className="hover:shadow-lg transition-all duration-200 cursor-pointer group">
                <CardHeader className="flex flex-row items-center space-y-0 pb-2">
                  <div className="p-2 rounded-lg bg-purple-500 text-white group-hover:scale-110 transition-transform">
                    <BarChart3 className="h-5 w-5" />
                  </div>
                  <div className="ml-3 flex-1">
                    <CardTitle className="text-lg">System Analytics</CardTitle>
                    <p className="text-sm text-gray-500 font-medium">24/7</p>
                  </div>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-gray-600 mb-3">
                    Global sales, performance, and business intelligence
                  </CardDescription>
                  <Button 
                    className="w-full" 
                    size="sm"
                    onClick={() => router.push('/dashboard/admin/analytics')}
                  >
                    Access Module
                  </Button>
                </CardContent>
              </Card>

              <Card className="hover:shadow-lg transition-all duration-200 cursor-pointer group">
                <CardHeader className="flex flex-row items-center space-y-0 pb-2">
                  <div className="p-2 rounded-lg bg-red-500 text-white group-hover:scale-110 transition-transform">
                    <Shield className="h-5 w-5" />
                  </div>
                  <div className="ml-3 flex-1">
                    <CardTitle className="text-lg">Security Center</CardTitle>
                    <p className="text-sm text-gray-500 font-medium">Active</p>
                  </div>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-gray-600 mb-3">
                    Monitor security, access logs, and compliance
                  </CardDescription>
                  <Button 
                    className="w-full" 
                    size="sm"
                    onClick={() => router.push('/dashboard/admin/security')}
                  >
                    Access Module
                  </Button>
                </CardContent>
              </Card>

              <Card className="hover:shadow-lg transition-all duration-200 cursor-pointer group">
                <CardHeader className="flex flex-row items-center space-y-0 pb-2">
                  <div className="p-2 rounded-lg bg-orange-500 text-white group-hover:scale-110 transition-transform">
                    <Database className="h-5 w-5" />
                  </div>
                  <div className="ml-3 flex-1">
                    <CardTitle className="text-lg">Database Management</CardTitle>
                    <p className="text-sm text-gray-500 font-medium">99.9%</p>
                  </div>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-gray-600 mb-3">
                    Backup, restore, and database maintenance
                  </CardDescription>
                  <Button 
                    className="w-full" 
                    size="sm"
                    onClick={() => router.push('/dashboard/admin/database')}
                  >
                    Access Module
                  </Button>
                </CardContent>
              </Card>

              <Card className="hover:shadow-lg transition-all duration-200 cursor-pointer group">
                <CardHeader className="flex flex-row items-center space-y-0 pb-2">
                  <div className="p-2 rounded-lg bg-gray-500 text-white group-hover:scale-110 transition-transform">
                    <Settings className="h-5 w-5" />
                  </div>
                  <div className="ml-3 flex-1">
                    <CardTitle className="text-lg">Global Settings</CardTitle>
                    <p className="text-sm text-gray-500 font-medium">Config</p>
                  </div>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-gray-600 mb-3">
                    System-wide configurations and preferences
                  </CardDescription>
                  <Button 
                    className="w-full" 
                    size="sm"
                    onClick={() => router.push('/dashboard/admin/settings')}
                  >
                    Access Module
                  </Button>
                </CardContent>
              </Card>

            </div>
          </div>

          {/* Regional Performance */}
          <div className="mb-8">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Regional Performance</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {regionStats.map((region, index) => (
                <Card key={index} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-semibold text-gray-900">{region.region}</h4>
                      <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">
                        {region.growth}
                      </span>
                    </div>
                    <div className="space-y-1">
                      <p className="text-sm text-gray-600">{region.shops} shops</p>
                      <p className="text-lg font-bold">PKR {(region.revenue / 1000).toFixed(0)}K</p>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          {/* System Status */}
          <div className="mt-8 p-4 bg-green-50 rounded-lg border border-green-200">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                <Shield className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-green-900 font-semibold">System Status: Fully Operational</p>
                <p className="text-green-700 text-sm">
                  All administrative modules are active and ready for use. Access any module above to manage your mobile shop system.
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
    </ProtectedRoute>
  )
}

'use client'

import { useSession } from 'next-auth/react'
import { redirect } from 'next/navigation'
import { useEffect, useState } from 'react'
import ShopDirectory from '@/components/admin/shop-directory'
import ShopAnalytics from '@/components/admin/shop-analytics'
import ShopManagement from '@/components/admin/shop-management'
import SystemMonitoring from '@/components/admin/system-monitoring'
import { Users, Store, BarChart3, Settings, Wrench, Activity, RefreshCw } from 'lucide-react'
import { OptimisticUpdate } from '@/components/ui/form-progress'

type ActiveTab = 'overview' | 'users' | 'shops' | 'shop-management' | 'analytics' | 'monitoring' | 'settings'

export default function AdminPanel() {
  const { data: session, status } = useSession()
  const [activeTab, setActiveTab] = useState<ActiveTab>('overview')
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [stats, setStats] = useState({
    totalShops: 12,
    totalUsers: 47,
    activeSessions: 23,
    systemHealth: 98.5
  })

  const refreshStats = async () => {
    setIsRefreshing(true)
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000))
      // In real implementation, fetch from API
      setStats(prev => ({
        ...prev,
        totalShops: prev.totalShops + Math.floor(Math.random() * 3),
        totalUsers: prev.totalUsers + Math.floor(Math.random() * 5),
        activeSessions: Math.floor(Math.random() * 50) + 10,
        systemHealth: 95 + Math.random() * 5
      }))
    } finally {
      setIsRefreshing(false)
    }
  }

  useEffect(() => {
    if (status === 'loading') return
    if (!session?.user || session.user.role !== 'SUPER_ADMIN') {
      redirect('/auth/signin')
    }
  }, [session, status])

  if (status === 'loading') {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  const tabs = [
    { id: 'overview', label: 'Overview', icon: BarChart3 },
    { id: 'users', label: 'User Management', icon: Users },
    { id: 'shops', label: 'Shop Directory', icon: Store },
    { id: 'shop-management', label: 'Shop Management', icon: Wrench },
    { id: 'analytics', label: 'Analytics', icon: BarChart3 },
    { id: 'monitoring', label: 'System Monitoring', icon: Activity },
    { id: 'settings', label: 'Settings', icon: Settings },
  ] as const

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Admin Panel</h1>
              <p className="text-sm text-gray-600">System administration and management</p>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-sm text-gray-600">
                Welcome, {session?.user?.name}
              </span>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Tab Navigation */}
        <div className="mb-8">
          <nav className="flex space-x-8 overflow-x-auto">
            {tabs.map((tab) => {
              const Icon = tab.icon
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as ActiveTab)}
                  className={`flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-md whitespace-nowrap ${activeTab === tab.id
                    ? 'bg-blue-100 text-blue-700 border-b-2 border-blue-700'
                    : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
                    }`}
                >
                  <Icon className="h-4 w-4" />
                  {tab.label}
                </button>
              )
            })}
          </nav>
        </div>

        {/* Tab Content */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            <div className="bg-white p-6 rounded-lg shadow-sm border">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold text-gray-900">System Overview</h2>
                <button
                  onClick={refreshStats}
                  disabled={isRefreshing}
                  className="flex items-center gap-2 px-3 py-1 text-sm bg-blue-50 text-blue-600 rounded-md hover:bg-blue-100 disabled:opacity-50"
                >
                  <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
                  Refresh
                </button>
              </div>
              <OptimisticUpdate isUpdating={isRefreshing} updateMessage="Refreshing stats...">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-blue-600">Total Shops</p>
                        <p className="text-2xl font-bold text-blue-900">{stats.totalShops}</p>
                      </div>
                      <Store className="h-8 w-8 text-blue-600" />
                    </div>
                  </div>
                  <div className="bg-green-50 p-4 rounded-lg">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-green-600">Total Users</p>
                        <p className="text-2xl font-bold text-green-900">{stats.totalUsers}</p>
                      </div>
                      <Users className="h-8 w-8 text-green-600" />
                    </div>
                  </div>
                  <div className="bg-purple-50 p-4 rounded-lg">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-purple-600">Active Sessions</p>
                        <p className="text-2xl font-bold text-purple-900">{stats.activeSessions}</p>
                      </div>
                      <Activity className="h-8 w-8 text-purple-600" />
                    </div>
                  </div>
                  <div className="bg-orange-50 p-4 rounded-lg">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-orange-600">System Health</p>
                        <p className="text-2xl font-bold text-orange-900">{stats.systemHealth.toFixed(1)}%</p>
                      </div>
                      <BarChart3 className="h-8 w-8 text-orange-600" />
                    </div>
                  </div>
                </div>
              </OptimisticUpdate>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-sm border">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <button
                  onClick={() => setActiveTab('shop-management')}
                  className="p-4 text-left border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <Wrench className="h-6 w-6 text-blue-600 mb-2" />
                  <h4 className="font-medium text-gray-900">Manage Shops</h4>
                  <p className="text-sm text-gray-600">Create, edit, and manage shop operations</p>
                </button>
                <button
                  onClick={() => setActiveTab('analytics')}
                  className="p-4 text-left border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <BarChart3 className="h-6 w-6 text-green-600 mb-2" />
                  <h4 className="font-medium text-gray-900">View Analytics</h4>
                  <p className="text-sm text-gray-600">Monitor performance and sales data</p>
                </button>
                <button
                  onClick={() => setActiveTab('monitoring')}
                  className="p-4 text-left border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <Activity className="h-6 w-6 text-purple-600 mb-2" />
                  <h4 className="font-medium text-gray-900">System Status</h4>
                  <p className="text-sm text-gray-600">Monitor system health and performance</p>
                </button>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'users' && (
          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">User Management</h2>
            <p className="text-gray-600">User management functionality will be implemented here.</p>
          </div>
        )}

        {activeTab === 'shops' && <ShopDirectory />}
        {activeTab === 'shop-management' && <ShopManagement />}
        {activeTab === 'analytics' && <ShopAnalytics />}
        {activeTab === 'monitoring' && <SystemMonitoring />}

        {activeTab === 'settings' && (
          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">System Settings</h2>
            <p className="text-gray-600">System configuration settings will be implemented here.</p>
          </div>
        )}
      </div>
    </div>
  )
}
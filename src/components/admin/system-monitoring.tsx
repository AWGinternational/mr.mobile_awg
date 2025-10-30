'use client'
import { useState, useEffect } from 'react'
import { Activity, AlertTriangle, CheckCircle, Clock, Database, Server, Users, Zap } from 'lucide-react'

interface SystemHealth {
    status: 'healthy' | 'warning' | 'critical'
    uptime: number
    lastChecked: string
    services: {
        database: 'online' | 'offline' | 'slow'
        api: 'online' | 'offline' | 'slow'
        storage: 'online' | 'offline' | 'slow'
        cache: 'online' | 'offline' | 'slow'
    }
    performance: {
        responseTime: number
        cpuUsage: number
        memoryUsage: number
        diskUsage: number
    }
    alerts: Array<{
        id: string
        type: 'error' | 'warning' | 'info'
        message: string
        timestamp: string
        resolved: boolean
    }>
}

interface UserActivity {
    totalActiveUsers: number
    newUsersToday: number
    activeShops: number
    recentLogins: Array<{
        id: string
        userName: string
        userRole: string
        shopName?: string
        loginTime: string
        ipAddress: string
    }>
}

export default function SystemMonitoring() {
    const [systemHealth, setSystemHealth] = useState<SystemHealth | null>(null)
    const [userActivity, setUserActivity] = useState<UserActivity | null>(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [autoRefresh, setAutoRefresh] = useState(true)

    const fetchSystemHealth = async () => {
        try {
            // Mock data for system health - in real implementation, this would call actual monitoring APIs
            const mockHealth: SystemHealth = {
                status: 'healthy',
                uptime: 99.8,
                lastChecked: new Date().toISOString(),
                services: {
                    database: 'online',
                    api: 'online',
                    storage: 'online',
                    cache: 'online'
                },
                performance: {
                    responseTime: 120,
                    cpuUsage: 45,
                    memoryUsage: 62,
                    diskUsage: 78
                },
                alerts: [
                    {
                        id: '1',
                        type: 'warning',
                        message: 'High disk usage detected on server',
                        timestamp: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
                        resolved: false
                    },
                    {
                        id: '2',
                        type: 'info',
                        message: 'Database backup completed successfully',
                        timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
                        resolved: true
                    }
                ]
            }
            setSystemHealth(mockHealth)
        } catch (err) {
            console.error('Error fetching system health:', err)
            setError('Failed to fetch system health data')
        }
    }

    const fetchUserActivity = async () => {
        try {
            // Mock data for user activity - in real implementation, this would call actual APIs
            const mockActivity: UserActivity = {
                totalActiveUsers: 45,
                newUsersToday: 3,
                activeShops: 12,
                recentLogins: [
                    {
                        id: '1',
                        userName: 'Ahmad Khan',
                        userRole: 'SHOP_OWNER',
                        shopName: 'Tech Store Lahore',
                        loginTime: new Date(Date.now() - 1000 * 60 * 15).toISOString(),
                        ipAddress: '192.168.1.100'
                    },
                    {
                        id: '2',
                        userName: 'Sarah Ahmed',
                        userRole: 'SHOP_WORKER',
                        shopName: 'Mobile Hub Karachi',
                        loginTime: new Date(Date.now() - 1000 * 60 * 25).toISOString(),
                        ipAddress: '192.168.1.101'
                    },
                    {
                        id: '3',
                        userName: 'Admin User',
                        userRole: 'SUPER_ADMIN',
                        loginTime: new Date(Date.now() - 1000 * 60 * 45).toISOString(),
                        ipAddress: '192.168.1.102'
                    }
                ]
            }
            setUserActivity(mockActivity)
        } catch (err) {
            console.error('Error fetching user activity:', err)
            setError('Failed to fetch user activity data')
        }
    }

    const fetchData = async () => {
        setLoading(true)
        await Promise.all([fetchSystemHealth(), fetchUserActivity()])
        setLoading(false)
    }

    useEffect(() => {
        fetchData()
    }, [])

    useEffect(() => {
        if (autoRefresh) {
            const interval = setInterval(fetchData, 30000) // Refresh every 30 seconds
            return () => clearInterval(interval)
        }
    }, [autoRefresh])

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'healthy':
            case 'online':
                return 'text-green-600 bg-green-100'
            case 'warning':
            case 'slow':
                return 'text-yellow-600 bg-yellow-100'
            case 'critical':
            case 'offline':
                return 'text-red-600 bg-red-100'
            default:
                return 'text-gray-600 bg-gray-100'
        }
    }

    const getStatusIcon = (status: string) => {
        switch (status) {
            case 'healthy':
            case 'online':
                return <CheckCircle className="h-4 w-4" />
            case 'warning':
            case 'slow':
                return <AlertTriangle className="h-4 w-4" />
            case 'critical':
            case 'offline':
                return <AlertTriangle className="h-4 w-4" />
            default:
                return <Clock className="h-4 w-4" />
        }
    }

    const formatUptime = (uptime: number) => {
        return `${uptime.toFixed(2)}%`
    }

    const formatTimeAgo = (timestamp: string) => {
        const now = new Date()
        const time = new Date(timestamp)
        const diffInMinutes = Math.floor((now.getTime() - time.getTime()) / (1000 * 60))

        if (diffInMinutes < 1) return 'Just now'
        if (diffInMinutes < 60) return `${diffInMinutes}m ago`
        if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`
        return `${Math.floor(diffInMinutes / 1440)}d ago`
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
        )
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold text-gray-900">System Monitoring</h2>
                <div className="flex items-center gap-4">
                    <label className="flex items-center gap-2">
                        <input
                            type="checkbox"
                            checked={autoRefresh}
                            onChange={(e) => setAutoRefresh(e.target.checked)}
                            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                        <span className="text-sm text-gray-600">Auto-refresh</span>
                    </label>
                    <button
                        onClick={fetchData}
                        className="px-3 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                    >
                        Refresh
                    </button>
                </div>
            </div>

            {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md">
                    {error}
                </div>
            )}

            {/* System Health Overview */}
            {systemHealth && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    <div className="bg-white p-6 rounded-lg shadow-sm border">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-gray-600">System Status</p>
                                <div className={`inline-flex items-center gap-2 px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(systemHealth.status)}`}>
                                    {getStatusIcon(systemHealth.status)}
                                    {systemHealth.status.charAt(0).toUpperCase() + systemHealth.status.slice(1)}
                                </div>
                            </div>
                            <Activity className="h-8 w-8 text-blue-600" />
                        </div>
                        <p className="text-xs text-gray-500 mt-2">
                            Last checked: {formatTimeAgo(systemHealth.lastChecked)}
                        </p>
                    </div>

                    <div className="bg-white p-6 rounded-lg shadow-sm border">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-gray-600">Uptime</p>
                                <p className="text-2xl font-bold text-gray-900">{formatUptime(systemHealth.uptime)}</p>
                            </div>
                            <Server className="h-8 w-8 text-green-600" />
                        </div>
                    </div>

                    <div className="bg-white p-6 rounded-lg shadow-sm border">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-gray-600">Response Time</p>
                                <p className="text-2xl font-bold text-gray-900">{systemHealth.performance.responseTime}ms</p>
                            </div>
                            <Zap className="h-8 w-8 text-yellow-600" />
                        </div>
                    </div>

                    <div className="bg-white p-6 rounded-lg shadow-sm border">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-gray-600">Active Alerts</p>
                                <p className="text-2xl font-bold text-gray-900">
                                    {systemHealth.alerts.filter(alert => !alert.resolved).length}
                                </p>
                            </div>
                            <AlertTriangle className="h-8 w-8 text-red-600" />
                        </div>
                    </div>
                </div>
            )}

            {/* Services Status */}
            {systemHealth && (
                <div className="bg-white rounded-lg shadow-sm border">
                    <div className="p-6 border-b">
                        <h3 className="text-lg font-semibold text-gray-900">Services Status</h3>
                    </div>
                    <div className="p-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                            {Object.entries(systemHealth.services).map(([service, status]) => (
                                <div key={service} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                                    <div className="flex items-center gap-3">
                                        <Database className="h-5 w-5 text-gray-600" />
                                        <span className="font-medium text-gray-900 capitalize">{service}</span>
                                    </div>
                                    <div className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(status)}`}>
                                        {getStatusIcon(status)}
                                        {status}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {/* Performance Metrics */}
            {systemHealth && (
                <div className="bg-white rounded-lg shadow-sm border">
                    <div className="p-6 border-b">
                        <h3 className="text-lg font-semibold text-gray-900">Performance Metrics</h3>
                    </div>
                    <div className="p-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                            {Object.entries(systemHealth.performance).map(([metric, value]) => (
                                <div key={metric} className="space-y-2">
                                    <div className="flex justify-between items-center">
                                        <span className="text-sm font-medium text-gray-600 capitalize">
                                            {metric.replace(/([A-Z])/g, ' $1').trim()}
                                        </span>
                                        <span className="text-sm font-bold text-gray-900">
                                            {metric === 'responseTime' ? `${value}ms` : `${value}%`}
                                        </span>
                                    </div>
                                    <div className="w-full bg-gray-200 rounded-full h-2">
                                        <div
                                            className={`h-2 rounded-full ${value > 80 ? 'bg-red-500' : value > 60 ? 'bg-yellow-500' : 'bg-green-500'
                                                }`}
                                            style={{ width: `${Math.min(value, 100)}%` }}
                                        ></div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {/* User Activity */}
            {userActivity && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div className="bg-white rounded-lg shadow-sm border">
                        <div className="p-6 border-b">
                            <h3 className="text-lg font-semibold text-gray-900">User Activity</h3>
                        </div>
                        <div className="p-6">
                            <div className="grid grid-cols-3 gap-4">
                                <div className="text-center">
                                    <div className="flex items-center justify-center w-12 h-12 bg-blue-100 rounded-full mx-auto mb-2">
                                        <Users className="h-6 w-6 text-blue-600" />
                                    </div>
                                    <p className="text-2xl font-bold text-gray-900">{userActivity.totalActiveUsers}</p>
                                    <p className="text-sm text-gray-600">Active Users</p>
                                </div>
                                <div className="text-center">
                                    <div className="flex items-center justify-center w-12 h-12 bg-green-100 rounded-full mx-auto mb-2">
                                        <Users className="h-6 w-6 text-green-600" />
                                    </div>
                                    <p className="text-2xl font-bold text-gray-900">{userActivity.newUsersToday}</p>
                                    <p className="text-sm text-gray-600">New Today</p>
                                </div>
                                <div className="text-center">
                                    <div className="flex items-center justify-center w-12 h-12 bg-purple-100 rounded-full mx-auto mb-2">
                                        <Server className="h-6 w-6 text-purple-600" />
                                    </div>
                                    <p className="text-2xl font-bold text-gray-900">{userActivity.activeShops}</p>
                                    <p className="text-sm text-gray-600">Active Shops</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white rounded-lg shadow-sm border">
                        <div className="p-6 border-b">
                            <h3 className="text-lg font-semibold text-gray-900">Recent Logins</h3>
                        </div>
                        <div className="p-6">
                            <div className="space-y-3">
                                {userActivity.recentLogins.map((login) => (
                                    <div key={login.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-md">
                                        <div>
                                            <div className="font-medium text-gray-900">{login.userName}</div>
                                            <div className="text-sm text-gray-500">
                                                {login.userRole} {login.shopName && `• ${login.shopName}`}
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <div className="text-sm text-gray-900">{formatTimeAgo(login.loginTime)}</div>
                                            <div className="text-xs text-gray-500">{login.ipAddress}</div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* System Alerts */}
            {systemHealth && systemHealth.alerts.length > 0 && (
                <div className="bg-white rounded-lg shadow-sm border">
                    <div className="p-6 border-b">
                        <h3 className="text-lg font-semibold text-gray-900">System Alerts</h3>
                    </div>
                    <div className="p-6">
                        <div className="space-y-3">
                            {systemHealth.alerts.map((alert) => (
                                <div
                                    key={alert.id}
                                    className={`flex items-start gap-3 p-4 rounded-lg ${alert.resolved ? 'bg-gray-50' :
                                        alert.type === 'error' ? 'bg-red-50' :
                                            alert.type === 'warning' ? 'bg-yellow-50' : 'bg-blue-50'
                                        }`}
                                >
                                    <div className={`flex-shrink-0 ${alert.resolved ? 'text-gray-400' :
                                        alert.type === 'error' ? 'text-red-600' :
                                            alert.type === 'warning' ? 'text-yellow-600' : 'text-blue-600'
                                        }`}>
                                        {alert.resolved ? (
                                            <CheckCircle className="h-5 w-5" />
                                        ) : (
                                            <AlertTriangle className="h-5 w-5" />
                                        )}
                                    </div>
                                    <div className="flex-1">
                                        <p className={`text-sm font-medium ${alert.resolved ? 'text-gray-600' : 'text-gray-900'
                                            }`}>
                                            {alert.message}
                                        </p>
                                        <p className="text-xs text-gray-500 mt-1">
                                            {formatTimeAgo(alert.timestamp)}
                                            {alert.resolved && ' • Resolved'}
                                        </p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
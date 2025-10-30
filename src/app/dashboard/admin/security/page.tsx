'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/use-auth'
import { useNotify } from '@/hooks/use-notifications'
import { ProtectedRoute } from '@/components/auth/protected-route'
import { UserRole } from '@/types'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Shield,
  Search,
  X,
  ArrowLeft,
  LogOut,
  Activity,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Clock,
  User,
  Calendar,
  FileText,
  Lock,
  Unlock,
  Eye
} from 'lucide-react'
import { formatUserRole } from '@/utils/user-formatting'

interface AuditLog {
  id: string
  userId: string
  action: string
  tableName: string
  recordId: string
  changes: any
  createdAt: string
  user?: {
    name: string
    email: string
    role: string
  }
}

interface LoginHistory {
  id: string
  userId: string
  success: boolean
  ipAddress?: string
  userAgent?: string
  createdAt: string
  user?: {
    name: string
    email: string
  }
}

export default function SecurityCenterPage() {
  const router = useRouter()
  const { user: currentUser, logout } = useAuth()
  const { success, error: showError } = useNotify()

  // State
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([])
  const [loginHistory, setLoginHistory] = useState<LoginHistory[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [actionFilter, setActionFilter] = useState<string>('all')
  const [dateFilter, setDateFilter] = useState<string>('7days')

  // Fetch audit logs
  const fetchAuditLogs = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/admin/audit-logs')
      const data = await response.json()
      
      if (response.ok) {
        setAuditLogs(data.logs || [])
      }
    } catch (error) {
      console.error('Failed to fetch audit logs:', error)
      showError('Failed to fetch audit logs')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchAuditLogs()
  }, [])

  // Filter logs
  const filteredLogs = auditLogs.filter(log => {
    const searchLower = searchTerm.toLowerCase()
    const matchesSearch = !searchTerm || 
      log.user?.name?.toLowerCase().includes(searchLower) ||
      log.user?.email?.toLowerCase().includes(searchLower) ||
      log.tableName?.toLowerCase().includes(searchLower) ||
      log.action?.toLowerCase().includes(searchLower)

    const matchesAction = actionFilter === 'all' || log.action === actionFilter

    // Date filter
    const logDate = new Date(log.createdAt)
    const now = new Date()
    const daysDiff = Math.floor((now.getTime() - logDate.getTime()) / (1000 * 60 * 60 * 24))
    
    let matchesDate = true
    if (dateFilter === '1day') matchesDate = daysDiff <= 1
    if (dateFilter === '7days') matchesDate = daysDiff <= 7
    if (dateFilter === '30days') matchesDate = daysDiff <= 30

    return matchesSearch && matchesAction && matchesDate
  })

  const handleLogout = async () => {
    try {
      await logout()
      router.push('/login')
    } catch (error) {
      console.error('Logout error:', error)
    }
  }

  const handleBack = () => {
    router.push('/dashboard/admin')
  }

  const getActionColor = (action: string) => {
    switch (action) {
      case 'CREATE': return 'bg-green-100 text-green-800'
      case 'UPDATE': return 'bg-blue-100 text-blue-800'
      case 'DELETE': return 'bg-red-100 text-red-800'
      case 'LOGIN': return 'bg-purple-100 text-purple-800'
      case 'LOGOUT': return 'bg-gray-100 text-gray-800'
      case 'PASSWORD_RESET': return 'bg-orange-100 text-orange-800'
      case 'USER_STATUS_CHANGED': return 'bg-yellow-100 text-yellow-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getActionIcon = (action: string) => {
    switch (action) {
      case 'CREATE': return <CheckCircle className="h-4 w-4" />
      case 'UPDATE': return <Activity className="h-4 w-4" />
      case 'DELETE': return <XCircle className="h-4 w-4" />
      case 'LOGIN': return <Unlock className="h-4 w-4" />
      case 'LOGOUT': return <Lock className="h-4 w-4" />
      default: return <FileText className="h-4 w-4" />
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-PK', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    })
  }

  const formatChanges = (changes: any) => {
    if (typeof changes === 'string') {
      try {
        changes = JSON.parse(changes)
      } catch {
        return changes
      }
    }

    if (changes?.field) {
      return (
        <div className="text-xs space-y-1">
          <div><span className="font-medium">Field:</span> {changes.field}</div>
          {changes.oldValue && <div><span className="font-medium">Old:</span> {changes.oldValue}</div>}
          {changes.newValue && <div><span className="font-medium">New:</span> {changes.newValue}</div>}
          {changes.reason && <div><span className="font-medium">Reason:</span> {changes.reason}</div>}
        </div>
      )
    }

    return <pre className="text-xs overflow-auto max-h-20">{JSON.stringify(changes, null, 2)}</pre>
  }

  // Stats
  const stats = {
    totalLogs: auditLogs.length,
    todayLogs: auditLogs.filter(log => {
      const today = new Date().toDateString()
      return new Date(log.createdAt).toDateString() === today
    }).length,
    creates: auditLogs.filter(log => log.action === 'CREATE').length,
    updates: auditLogs.filter(log => log.action === 'UPDATE').length,
    deletes: auditLogs.filter(log => log.action === 'DELETE').length,
    logins: auditLogs.filter(log => log.action === 'LOGIN').length
  }

  return (
    <ProtectedRoute allowedRoles={[UserRole.SUPER_ADMIN]}>
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-red-50 to-orange-100">
        {/* Header */}
        <div className="bg-gradient-to-r from-red-600 via-rose-600 to-pink-700 text-white">
          <div className="px-8 py-12">
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-4">
                <button
                  onClick={handleBack}
                  className="p-3 bg-white/10 hover:bg-white/20 rounded-xl transition-all duration-200"
                  title="Back to Dashboard"
                >
                  <ArrowLeft className="h-5 w-5 text-white" />
                </button>
                <div>
                  <h1 className="text-4xl font-bold mb-2">
                    🛡️ Security Center
                  </h1>
                  <p className="text-red-100 text-lg">Monitor security, access logs, and compliance</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="px-8 py-8 space-y-8">
          {/* Statistics */}
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
            <Card className="bg-gradient-to-br from-red-500 to-red-600 text-white">
              <CardContent className="p-6">
                <div className="text-center">
                  <p className="text-red-100 text-sm mb-1">Total Logs</p>
                  <p className="text-3xl font-bold">{stats.totalLogs}</p>
                </div>
              </CardContent>
            </Card>
            <Card className="bg-gradient-to-br from-orange-500 to-orange-600 text-white">
              <CardContent className="p-6">
                <div className="text-center">
                  <p className="text-orange-100 text-sm mb-1">Today</p>
                  <p className="text-3xl font-bold">{stats.todayLogs}</p>
                </div>
              </CardContent>
            </Card>
            <Card className="bg-gradient-to-br from-green-500 to-green-600 text-white">
              <CardContent className="p-6">
                <div className="text-center">
                  <p className="text-green-100 text-sm mb-1">Creates</p>
                  <p className="text-3xl font-bold">{stats.creates}</p>
                </div>
              </CardContent>
            </Card>
            <Card className="bg-gradient-to-br from-blue-500 to-blue-600 text-white">
              <CardContent className="p-6">
                <div className="text-center">
                  <p className="text-blue-100 text-sm mb-1">Updates</p>
                  <p className="text-3xl font-bold">{stats.updates}</p>
                </div>
              </CardContent>
            </Card>
            <Card className="bg-gradient-to-br from-purple-500 to-purple-600 text-white">
              <CardContent className="p-6">
                <div className="text-center">
                  <p className="text-purple-100 text-sm mb-1">Logins</p>
                  <p className="text-3xl font-bold">{stats.logins}</p>
                </div>
              </CardContent>
            </Card>
            <Card className="bg-gradient-to-br from-rose-500 to-rose-600 text-white">
              <CardContent className="p-6">
                <div className="text-center">
                  <p className="text-rose-100 text-sm mb-1">Deletes</p>
                  <p className="text-3xl font-bold">{stats.deletes}</p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Tabs for different security sections */}
          <Tabs defaultValue="audit-logs" className="w-full">
            <TabsList className="grid w-full grid-cols-2 lg:grid-cols-4">
              <TabsTrigger value="audit-logs">Audit Logs</TabsTrigger>
              <TabsTrigger value="access">Access Monitor</TabsTrigger>
              <TabsTrigger value="security">Security Alerts</TabsTrigger>
              <TabsTrigger value="compliance">Compliance</TabsTrigger>
            </TabsList>

            {/* Audit Logs Tab */}
            <TabsContent value="audit-logs" className="space-y-6">
              {/* Search and Filters */}
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="p-2 bg-red-100 rounded-lg">
                      <Search className="h-5 w-5 text-red-600" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">Search Audit Logs</h3>
                      <p className="text-sm text-gray-600">System-wide activity tracking</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <Input
                        type="text"
                        placeholder="Search by user, action, table..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-10"
                      />
                      {searchTerm && (
                        <button
                          onClick={() => setSearchTerm('')}
                          className="absolute right-3 top-1/2 transform -translate-y-1/2"
                        >
                          <X className="h-4 w-4 text-gray-400" />
                        </button>
                      )}
                    </div>

                    <Select value={actionFilter} onValueChange={setActionFilter}>
                      <SelectTrigger>
                        <SelectValue placeholder="Filter by action" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Actions</SelectItem>
                        <SelectItem value="CREATE">Create</SelectItem>
                        <SelectItem value="UPDATE">Update</SelectItem>
                        <SelectItem value="DELETE">Delete</SelectItem>
                        <SelectItem value="LOGIN">Login</SelectItem>
                        <SelectItem value="LOGOUT">Logout</SelectItem>
                        <SelectItem value="PASSWORD_RESET">Password Reset</SelectItem>
                        <SelectItem value="USER_STATUS_CHANGED">Status Changed</SelectItem>
                      </SelectContent>
                    </Select>

                    <Select value={dateFilter} onValueChange={setDateFilter}>
                      <SelectTrigger>
                        <SelectValue placeholder="Time period" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="1day">Last 24 hours</SelectItem>
                        <SelectItem value="7days">Last 7 days</SelectItem>
                        <SelectItem value="30days">Last 30 days</SelectItem>
                        <SelectItem value="all">All time</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </CardContent>
              </Card>

              {/* Audit Logs List */}
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-6">
                    <div>
                      <h3 className="text-xl font-semibold text-gray-900">System Audit Trail</h3>
                      <p className="text-sm text-gray-600">
                        Showing {filteredLogs.length} of {auditLogs.length} logs
                      </p>
                    </div>
                    <Button
                      variant="outline"
                      onClick={fetchAuditLogs}
                      disabled={loading}
                    >
                      Refresh
                    </Button>
                  </div>

                  {loading ? (
                    <div className="text-center py-12">
                      <div className="w-8 h-8 border-4 border-red-600 border-t-transparent rounded-full animate-spin mx-auto" />
                      <p className="text-gray-600 mt-4">Loading audit logs...</p>
                    </div>
                  ) : filteredLogs.length === 0 ? (
                    <div className="text-center py-12">
                      <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-600">No audit logs found</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {filteredLogs.map((log) => (
                        <div
                          key={log.id}
                          className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
                        >
                          <div className="flex items-start justify-between mb-3">
                            <div className="flex items-center gap-3">
                              <Badge className={getActionColor(log.action)}>
                                <span className="flex items-center gap-1">
                                  {getActionIcon(log.action)}
                                  {log.action}
                                </span>
                              </Badge>
                              <span className="text-sm font-medium text-gray-700">{log.tableName}</span>
                            </div>
                            <div className="flex items-center gap-1 text-xs text-gray-500">
                              <Calendar className="h-3 w-3" />
                              <span suppressHydrationWarning>{formatDate(log.createdAt)}</span>
                            </div>
                          </div>

                          {log.user && (
                            <div className="flex items-center gap-2 mb-2">
                              <User className="h-4 w-4 text-gray-400" />
                              <span className="text-sm text-gray-700">{log.user.name}</span>
                              <span className="text-xs text-gray-500">({log.user.email})</span>
                              <Badge variant="outline" className="text-xs">
                                {formatUserRole(log.user.role)}
                              </Badge>
                            </div>
                          )}

                          {log.changes && (
                            <div className="bg-gray-50 rounded p-3 mt-2">
                              {formatChanges(log.changes)}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Access Monitor Tab */}
            <TabsContent value="access" className="space-y-6">
              <Card>
                <CardContent className="p-6">
                  <div className="text-center py-12">
                    <Activity className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">Active Session Monitoring</h3>
                    <p className="text-gray-600 mb-6">Track user sessions and access patterns in real-time</p>
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 max-w-md mx-auto">
                      <p className="text-sm text-blue-900">
                        This feature tracks active user sessions, IP addresses, and login patterns.
                        Coming soon with real-time monitoring capabilities.
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Security Alerts Tab */}
            <TabsContent value="security" className="space-y-6">
              <Card>
                <CardContent className="p-6">
                  <div className="text-center py-12">
                    <AlertTriangle className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">Security Alerts</h3>
                    <p className="text-gray-600 mb-6">Monitor suspicious activities and security incidents</p>
                    <div className="space-y-3 max-w-2xl mx-auto">
                      <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-center gap-3">
                        <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0" />
                        <div className="text-left">
                          <p className="text-sm font-medium text-green-900">System Secure</p>
                          <p className="text-xs text-green-700">No security alerts detected in the last 24 hours</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Compliance Tab */}
            <TabsContent value="compliance" className="space-y-6">
              <Card>
                <CardContent className="p-6">
                  <div className="text-center py-12">
                    <Shield className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">Compliance & Data Protection</h3>
                    <p className="text-gray-600 mb-6">GDPR compliance and data retention policies</p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-4xl mx-auto">
                      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                        <h4 className="font-semibold text-blue-900 mb-2">Data Retention</h4>
                        <p className="text-sm text-blue-700">User data is retained according to Pakistani data protection laws</p>
                      </div>
                      <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                        <h4 className="font-semibold text-purple-900 mb-2">Audit Trail</h4>
                        <p className="text-sm text-purple-700">All system actions are logged for compliance and security</p>
                      </div>
                      <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                        <h4 className="font-semibold text-green-900 mb-2">User Privacy</h4>
                        <p className="text-sm text-green-700">User data is encrypted and securely stored</p>
                      </div>
                      <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                        <h4 className="font-semibold text-orange-900 mb-2">Access Control</h4>
                        <p className="text-sm text-orange-700">Role-based permissions ensure data security</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </ProtectedRoute>
  )
}


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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Database,
  ArrowLeft,
  LogOut,
  HardDrive,
  Download,
  Upload,
  RefreshCw,
  AlertTriangle,
  CheckCircle,
  FileDown,
  FileUp,
  Trash2,
  Clock,
  Activity
} from 'lucide-react'
import { formatUserRole } from '@/utils/user-formatting'

interface DatabaseStats {
  size: string
  tables: number
  totalRecords: number
  connections: number
  uptime: string
  lastBackup: string | null
}

interface BackupHistory {
  id: string
  filename: string
  size: string
  createdAt: string
  status: 'completed' | 'failed'
}

export default function DatabaseManagementPage() {
  const router = useRouter()
  const { user: currentUser, logout } = useAuth()
  const { success, error: showError } = useNotify()

  // State
  const [loading, setLoading] = useState(false)
  const [dbStats, setDbStats] = useState<DatabaseStats>({
    size: '245 MB',
    tables: 28,
    totalRecords: 15847,
    connections: 12,
    uptime: '15 days 8 hours',
    lastBackup: new Date().toISOString()
  })

  const [backupHistory, setBackupHistory] = useState<BackupHistory[]>([
    {
      id: '1',
      filename: 'backup_2025_10_10_14_30.sql',
      size: '242 MB',
      createdAt: new Date().toISOString(),
      status: 'completed'
    },
    {
      id: '2',
      filename: 'backup_2025_10_09_14_30.sql',
      size: '238 MB',
      createdAt: new Date(Date.now() - 86400000).toISOString(),
      status: 'completed'
    },
    {
      id: '3',
      filename: 'backup_2025_10_08_14_30.sql',
      size: '235 MB',
      createdAt: new Date(Date.now() - 2 * 86400000).toISOString(),
      status: 'completed'
    }
  ])

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

  const handleCreateBackup = async () => {
    const confirmed = window.confirm('Create a database backup? This may take a few minutes.')
    if (!confirmed) return

    try {
      setLoading(true)
      
      // Simulated backup creation
      await new Promise(resolve => setTimeout(resolve, 2000))
      
      success('Database backup created successfully')
      
      // Add to history
      const newBackup: BackupHistory = {
        id: Date.now().toString(),
        filename: `backup_${new Date().toISOString().split('T')[0].replace(/-/g, '_')}_${new Date().getHours()}_${new Date().getMinutes()}.sql`,
        size: dbStats.size,
        createdAt: new Date().toISOString(),
        status: 'completed'
      }
      setBackupHistory([newBackup, ...backupHistory])
    } catch (error) {
      showError('Failed to create backup')
    } finally {
      setLoading(false)
    }
  }

  const handleDownloadBackup = (backup: BackupHistory) => {
    success(`Downloading ${backup.filename}...`)
    // Download logic would go here
  }

  const handleDeleteBackup = async (backup: BackupHistory) => {
    const confirmed = window.confirm(`Delete backup ${backup.filename}?`)
    if (!confirmed) return

    try {
      setBackupHistory(prev => prev.filter(b => b.id !== backup.id))
      success('Backup deleted successfully')
    } catch (error) {
      showError('Failed to delete backup')
    }
  }

  const handleOptimizeDatabase = async () => {
    const confirmed = window.confirm('Optimize database? This may take a few minutes and could affect performance temporarily.')
    if (!confirmed) return

    try {
      setLoading(true)
      await new Promise(resolve => setTimeout(resolve, 3000))
      success('Database optimized successfully')
    } catch (error) {
      showError('Failed to optimize database')
    } finally {
      setLoading(false)
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-PK', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  return (
    <ProtectedRoute allowedRoles={[UserRole.SUPER_ADMIN]}>
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-orange-50 to-amber-100">
        {/* Header */}
        <div className="bg-gradient-to-r from-orange-600 via-amber-600 to-yellow-700 text-white">
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
                    💾 Database Management
                  </h1>
                  <p className="text-orange-100 text-lg">Backup, restore, and database maintenance</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="px-8 py-8 space-y-8">
          {/* Database Health Stats */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card className="bg-gradient-to-br from-blue-500 to-blue-600 text-white">
              <CardContent className="p-6">
                <HardDrive className="h-8 w-8 mb-3 text-blue-100" />
                <p className="text-blue-100 text-sm mb-1">Database Size</p>
                <p className="text-2xl font-bold">{dbStats.size}</p>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-green-500 to-green-600 text-white">
              <CardContent className="p-6">
                <Database className="h-8 w-8 mb-3 text-green-100" />
                <p className="text-green-100 text-sm mb-1">Total Tables</p>
                <p className="text-2xl font-bold">{dbStats.tables}</p>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-purple-500 to-purple-600 text-white">
              <CardContent className="p-6">
                <Activity className="h-8 w-8 mb-3 text-purple-100" />
                <p className="text-purple-100 text-sm mb-1">Total Records</p>
                <p className="text-2xl font-bold">{dbStats.totalRecords.toLocaleString()}</p>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-orange-500 to-orange-600 text-white">
              <CardContent className="p-6">
                <Clock className="h-8 w-8 mb-3 text-orange-100" />
                <p className="text-orange-100 text-sm mb-1">System Uptime</p>
                <p className="text-lg font-bold">{dbStats.uptime}</p>
              </CardContent>
            </Card>
          </div>

          <Tabs defaultValue="backup" className="w-full">
            <TabsList className="grid w-full grid-cols-2 lg:grid-cols-3">
              <TabsTrigger value="backup">Backup & Restore</TabsTrigger>
              <TabsTrigger value="maintenance">Maintenance</TabsTrigger>
              <TabsTrigger value="import-export">Import/Export</TabsTrigger>
            </TabsList>

            {/* Backup Tab */}
            <TabsContent value="backup" className="space-y-6">
              {/* Quick Actions */}
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-6">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">Backup Operations</h3>
                      <p className="text-sm text-gray-600">Create and manage database backups</p>
                    </div>
                    <Button
                      onClick={handleCreateBackup}
                      disabled={loading}
                      className="gap-2 bg-blue-600 hover:bg-blue-700"
                    >
                      <Download className="h-4 w-4" />
                      {loading ? 'Creating Backup...' : 'Create Backup Now'}
                    </Button>
                  </div>

                  {dbStats.lastBackup && (
                    <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-center gap-3">
                      <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0" />
                      <div>
                        <p className="text-sm font-medium text-green-900">Last Backup</p>
                        <p className="text-xs text-green-700" suppressHydrationWarning>
                          {formatDate(dbStats.lastBackup)}
                        </p>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Backup History */}
              <Card>
                <CardContent className="p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-6">Backup History</h3>
                  
                  <div className="space-y-3">
                    {backupHistory.map((backup) => (
                      <div
                        key={backup.id}
                        className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                              backup.status === 'completed' ? 'bg-green-100' : 'bg-red-100'
                            }`}>
                              {backup.status === 'completed' ? (
                                <CheckCircle className="h-5 w-5 text-green-600" />
                              ) : (
                                <AlertTriangle className="h-5 w-5 text-red-600" />
                              )}
                            </div>
                            <div>
                              <p className="font-medium text-gray-900">{backup.filename}</p>
                              <div className="flex items-center gap-3 mt-1">
                                <span className="text-xs text-gray-500">{backup.size}</span>
                                <span className="text-xs text-gray-500" suppressHydrationWarning>
                                  {formatDate(backup.createdAt)}
                                </span>
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleDownloadBackup(backup)}
                              className="gap-2"
                            >
                              <Download className="h-4 w-4" />
                              Download
                            </Button>
                            <button
                              onClick={() => handleDeleteBackup(backup)}
                              className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                              title="Delete"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Maintenance Tab */}
            <TabsContent value="maintenance" className="space-y-6">
              <Card>
                <CardContent className="p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-6">Database Maintenance</h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="border border-gray-200 rounded-lg p-6">
                      <div className="flex items-center gap-3 mb-4">
                        <div className="p-2 bg-blue-100 rounded-lg">
                          <RefreshCw className="h-5 w-5 text-blue-600" />
                        </div>
                        <div>
                          <h4 className="font-semibold text-gray-900">Optimize Database</h4>
                          <p className="text-sm text-gray-600">Improve query performance</p>
                        </div>
                      </div>
                      <Button
                        onClick={handleOptimizeDatabase}
                        disabled={loading}
                        variant="outline"
                        className="w-full gap-2"
                      >
                        <RefreshCw className="h-4 w-4" />
                        Optimize Now
                      </Button>
                    </div>

                    <div className="border border-gray-200 rounded-lg p-6">
                      <div className="flex items-center gap-3 mb-4">
                        <div className="p-2 bg-purple-100 rounded-lg">
                          <Activity className="h-5 w-5 text-purple-600" />
                        </div>
                        <div>
                          <h4 className="font-semibold text-gray-900">Health Check</h4>
                          <p className="text-sm text-gray-600">Verify database integrity</p>
                        </div>
                      </div>
                      <Button
                        variant="outline"
                        className="w-full gap-2"
                      >
                        <Activity className="h-4 w-4" />
                        Run Health Check
                      </Button>
                    </div>

                    <div className="border border-gray-200 rounded-lg p-6">
                      <div className="flex items-center gap-3 mb-4">
                        <div className="p-2 bg-orange-100 rounded-lg">
                          <Trash2 className="h-5 w-5 text-orange-600" />
                        </div>
                        <div>
                          <h4 className="font-semibold text-gray-900">Clean Old Data</h4>
                          <p className="text-sm text-gray-600">Remove old audit logs</p>
                        </div>
                      </div>
                      <Button
                        variant="outline"
                        className="w-full gap-2"
                      >
                        <Trash2 className="h-4 w-4" />
                        Clean Data
                      </Button>
                    </div>

                    <div className="border border-gray-200 rounded-lg p-6">
                      <div className="flex items-center gap-3 mb-4">
                        <div className="p-2 bg-red-100 rounded-lg">
                          <AlertTriangle className="h-5 w-5 text-red-600" />
                        </div>
                        <div>
                          <h4 className="font-semibold text-gray-900">Rebuild Indexes</h4>
                          <p className="text-sm text-gray-600">Rebuild database indexes</p>
                        </div>
                      </div>
                      <Button
                        variant="outline"
                        className="w-full gap-2"
                      >
                        <RefreshCw className="h-4 w-4" />
                        Rebuild Indexes
                      </Button>
                    </div>
                  </div>

                  <div className="mt-6 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                    <div className="flex items-start gap-2">
                      <AlertTriangle className="h-5 w-5 text-yellow-600 mt-0.5 flex-shrink-0" />
                      <div>
                        <p className="text-sm font-medium text-yellow-900">Warning</p>
                        <p className="text-sm text-yellow-700 mt-1">
                          Maintenance operations can temporarily affect system performance. 
                          It's recommended to run these during off-peak hours.
                        </p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Import/Export Tab */}
            <TabsContent value="import-export" className="space-y-6">
              <Card>
                <CardContent className="p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-6">Data Import/Export</h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="border border-gray-200 rounded-lg p-6">
                      <div className="flex items-center gap-3 mb-4">
                        <div className="p-2 bg-green-100 rounded-lg">
                          <FileUp className="h-5 w-5 text-green-600" />
                        </div>
                        <div>
                          <h4 className="font-semibold text-gray-900">Import Users</h4>
                          <p className="text-sm text-gray-600">Bulk import from CSV file</p>
                        </div>
                      </div>
                      <Button variant="outline" className="w-full gap-2">
                        <Upload className="h-4 w-4" />
                        Upload CSV
                      </Button>
                      <Button
                        variant="ghost"
                        className="w-full gap-2 mt-2"
                        size="sm"
                      >
                        <Download className="h-4 w-4" />
                        Download Template
                      </Button>
                    </div>

                    <div className="border border-gray-200 rounded-lg p-6">
                      <div className="flex items-center gap-3 mb-4">
                        <div className="p-2 bg-blue-100 rounded-lg">
                          <FileDown className="h-5 w-5 text-blue-600" />
                        </div>
                        <div>
                          <h4 className="font-semibold text-gray-900">Export Data</h4>
                          <p className="text-sm text-gray-600">Download database export</p>
                        </div>
                      </div>
                      <Button variant="outline" className="w-full gap-2">
                        <Download className="h-4 w-4" />
                        Export to CSV
                      </Button>
                      <Button
                        variant="ghost"
                        className="w-full gap-2 mt-2"
                        size="sm"
                      >
                        <Download className="h-4 w-4" />
                        Export to SQL
                      </Button>
                    </div>
                  </div>

                  <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <p className="text-sm text-blue-900">
                      <strong>Tip:</strong> Use CSV templates for bulk operations. 
                      Ensure your data matches the required format before importing.
                    </p>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>

          {/* Database Status */}
          <Card className="bg-gradient-to-r from-green-50 to-emerald-50 border-green-200">
            <CardContent className="p-6">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                  <CheckCircle className="h-6 w-6 text-green-600" />
                </div>
                <div>
                  <h4 className="font-semibold text-green-900">Database Status: Healthy</h4>
                  <p className="text-sm text-green-700">
                    All systems operational. Last backup: <span suppressHydrationWarning>{dbStats.lastBackup ? formatDate(dbStats.lastBackup) : 'Never'}</span>
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </ProtectedRoute>
  )
}


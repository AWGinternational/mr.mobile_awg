'use client'

import React, { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { History, X, User, Calendar, FileText } from 'lucide-react'

interface AuditLog {
  id: string
  userId: string
  action: string
  tableName: string
  recordId: string
  changes: any
  createdAt: string
}

interface UserAuditLogDialogProps {
  userId: string | null
  userName: string | null
  open: boolean
  onClose: () => void
}

export function UserAuditLogDialog({ userId, userName, open, onClose }: UserAuditLogDialogProps) {
  const [logs, setLogs] = useState<AuditLog[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (open && userId) {
      fetchAuditLogs()
    }
  }, [open, userId])

  const fetchAuditLogs = async () => {
    if (!userId) return

    try {
      setLoading(true)
      setError(null)
      
      const response = await fetch(`/api/users/${userId}/audit-logs`)
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch audit logs')
      }

      setLogs(data.logs || [])
    } catch (error) {
      console.error('Failed to fetch audit logs:', error)
      setError(error instanceof Error ? error.message : 'Failed to fetch audit logs')
    } finally {
      setLoading(false)
    }
  }

  if (!open) return null

  const getActionColor = (action: string) => {
    switch (action) {
      case 'CREATE':
        return 'bg-green-100 text-green-800'
      case 'UPDATE':
        return 'bg-blue-100 text-blue-800'
      case 'DELETE':
        return 'bg-red-100 text-red-800'
      case 'LOGIN':
        return 'bg-purple-100 text-purple-800'
      case 'LOGOUT':
        return 'bg-gray-100 text-gray-800'
      default:
        return 'bg-yellow-100 text-yellow-800'
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
        <div className="text-sm space-y-1">
          <div><span className="font-medium">Field:</span> {changes.field}</div>
          {changes.oldValue && <div><span className="font-medium">Old:</span> {changes.oldValue}</div>}
          {changes.newValue && <div><span className="font-medium">New:</span> {changes.newValue}</div>}
          {changes.reason && <div><span className="font-medium">Reason:</span> {changes.reason}</div>}
          {changes.changedBy && <div><span className="font-medium">Changed by:</span> {changes.changedBy}</div>}
        </div>
      )
    }

    return <pre className="text-xs overflow-auto">{JSON.stringify(changes, null, 2)}</pre>
  }

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[80vh] border border-gray-200 flex flex-col">
        {/* Header */}
        <div className="p-6 border-b border-gray-200 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
              <History className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Audit Log History</h3>
              {userName && <p className="text-sm text-gray-600">{userName}</p>}
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X className="h-5 w-5 text-gray-500" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : error ? (
            <div className="text-center py-12">
              <FileText className="h-12 w-12 text-red-400 mx-auto mb-4" />
              <p className="text-red-600">{error}</p>
            </div>
          ) : logs.length === 0 ? (
            <div className="text-center py-12">
              <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">No audit logs found for this user</p>
            </div>
          ) : (
            <div className="space-y-4">
              {logs.map((log) => (
                <div
                  key={log.id}
                  className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <Badge className={getActionColor(log.action)}>
                        {log.action}
                      </Badge>
                      <span className="text-sm font-medium text-gray-700">{log.tableName}</span>
                    </div>
                    <div className="flex items-center gap-1 text-xs text-gray-500">
                      <Calendar className="h-3 w-3" />
                      {formatDate(log.createdAt)}
                    </div>
                  </div>

                  {log.changes && (
                    <div className="bg-gray-50 rounded p-3 mt-2">
                      {formatChanges(log.changes)}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-200 bg-gray-50 rounded-b-xl flex justify-between items-center">
          <p className="text-sm text-gray-600">
            {logs.length} {logs.length === 1 ? 'entry' : 'entries'}
          </p>
          <Button onClick={onClose} variant="outline">
            Close
          </Button>
        </div>
      </div>
    </div>
  )
}


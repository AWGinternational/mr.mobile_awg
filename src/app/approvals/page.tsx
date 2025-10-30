'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/use-auth'
import { useNotify } from '@/hooks/use-notifications'
import { ProtectedRoute } from '@/components/auth/protected-route'
import { UserRole } from '@/types'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { BusinessSidebar } from '@/components/layout/BusinessSidebar'
import { TopNavigation } from '@/components/layout/TopNavigation'
import {
  CheckCircle,
  XCircle,
  Clock,
  User,
  Calendar,
  FileText,
  AlertCircle
} from 'lucide-react'

interface ApprovalRequest {
  id: string
  type: 'CREATE' | 'UPDATE' | 'DELETE'
  tableName: string
  recordId: string | null
  requestData: any
  reason: string
  status: 'PENDING' | 'APPROVED' | 'REJECTED'
  createdAt: string
  worker: {
    name: string
    email: string
  }
}

export default function ApprovalsPage() {
  const router = useRouter()
  const { user: currentUser } = useAuth()
  const { success, error: showError } = useNotify()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [requests, setRequests] = useState<ApprovalRequest[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'ALL' | 'PENDING' | 'APPROVED' | 'REJECTED'>('PENDING')
  const [reviewNotes, setReviewNotes] = useState<{ [key: string]: string }>({})
  const [processingId, setProcessingId] = useState<string | null>(null)

  useEffect(() => {
    fetchRequests()
  }, [filter])

  const fetchRequests = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/approvals?status=${filter}`)
      const result = await response.json()

      if (response.ok && result.success) {
        setRequests(result.data.requests)
      } else {
        showError(result.error || 'Failed to fetch approval requests')
      }
    } catch (error) {
      console.error('Error fetching requests:', error)
      showError('Failed to fetch approval requests')
    } finally {
      setLoading(false)
    }
  }

  const handleApprove = async (requestId: string) => {
    try {
      setProcessingId(requestId)
      
      const response = await fetch(`/api/approvals/${requestId}/approve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          reviewNotes: reviewNotes[requestId] || ''
        })
      })

      const result = await response.json()

      if (response.ok && result.success) {
        success('Request approved successfully')
        fetchRequests()
        setReviewNotes(prev => {
          const updated = { ...prev }
          delete updated[requestId]
          return updated
        })
      } else {
        showError(result.error || 'Failed to approve request')
      }
    } catch (error) {
      console.error('Error approving request:', error)
      showError('Failed to approve request')
    } finally {
      setProcessingId(null)
    }
  }

  const handleReject = async (requestId: string) => {
    try {
      setProcessingId(requestId)
      
      const response = await fetch(`/api/approvals/${requestId}/reject`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          reviewNotes: reviewNotes[requestId] || 'Request rejected by owner'
        })
      })

      const result = await response.json()

      if (response.ok && result.success) {
        success('Request rejected')
        fetchRequests()
        setReviewNotes(prev => {
          const updated = { ...prev }
          delete updated[requestId]
          return updated
        })
      } else {
        showError(result.error || 'Failed to reject request')
      }
    } catch (error) {
      console.error('Error rejecting request:', error)
      showError('Failed to reject request')
    } finally {
      setProcessingId(null)
    }
  }

  const getActionBadge = (type: string) => {
    // Parse the approval type enum to extract action
    // Examples: PRODUCT_UPDATE → Update, CUSTOMER_DELETE → Delete
    const actionMap: { [key: string]: string } = {
      'CREATE': 'Create',
      'UPDATE': 'Update',
      'DELETE': 'Delete',
      'ADJUSTMENT': 'Adjust',
      'MODIFICATION': 'Modify'
    }

    // Extract action from enum (e.g., PRODUCT_UPDATE → UPDATE)
    const parts = type.split('_')
    const action = parts[parts.length - 1] // Get last part (CREATE, UPDATE, DELETE, etc.)
    const displayAction = actionMap[action] || action

    switch (action) {
      case 'CREATE':
        return <Badge className="bg-green-100 text-green-800">{displayAction}</Badge>
      case 'UPDATE':
      case 'MODIFICATION':
        return <Badge className="bg-blue-100 text-blue-800">{displayAction}</Badge>
      case 'DELETE':
        return <Badge className="bg-red-100 text-red-800">{displayAction}</Badge>
      case 'ADJUSTMENT':
        return <Badge className="bg-orange-100 text-orange-800">{displayAction}</Badge>
      default:
        return <Badge>{displayAction}</Badge>
    }
  }

  const getReadableActionText = (type: string, tableName: string) => {
    // Parse the approval type to create readable text
    // Examples:
    // PRODUCT_UPDATE + Category → "Update Category"
    // CUSTOMER_DELETE + Customer → "Delete Customer"
    const parts = type.split('_')
    const action = parts[parts.length - 1]
    
    const actionMap: { [key: string]: string } = {
      'CREATE': 'Create',
      'UPDATE': 'Update',
      'DELETE': 'Delete',
      'ADJUSTMENT': 'Adjust',
      'MODIFICATION': 'Modify'
    }
    
    const displayAction = actionMap[action] || action
    return `${displayAction} ${tableName}`
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'PENDING':
        return (
          <Badge className="bg-yellow-100 text-yellow-800 flex items-center gap-1">
            <Clock className="h-3 w-3" />
            Pending
          </Badge>
        )
      case 'APPROVED':
        return (
          <Badge className="bg-green-100 text-green-800 flex items-center gap-1">
            <CheckCircle className="h-3 w-3" />
            Approved
          </Badge>
        )
      case 'REJECTED':
        return (
          <Badge className="bg-red-100 text-red-800 flex items-center gap-1">
            <XCircle className="h-3 w-3" />
            Rejected
          </Badge>
        )
      default:
        return <Badge>{status}</Badge>
    }
  }

  const pendingCount = requests.filter(r => r.status === 'PENDING').length

  return (
    <ProtectedRoute allowedRoles={[UserRole.SHOP_OWNER, UserRole.SUPER_ADMIN]}>
      <div className="flex min-h-screen bg-gray-50 dark:bg-gray-900">
        <BusinessSidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
        
        <div className={`flex-1 flex flex-col min-h-screen transition-all duration-300 ${sidebarOpen ? 'lg:ml-20' : 'lg:ml-64'}`}>
          <TopNavigation onMenuClick={() => setSidebarOpen(!sidebarOpen)} />
          
          <div className="flex-1 bg-gray-50 dark:bg-gray-900">
            {/* Header */}
            <div className="bg-gradient-to-r from-purple-600 to-indigo-700 text-white">
              <div className="px-8 py-12">
                <div className="flex justify-between items-center">
                  <div>
                    <h1 className="text-4xl font-bold mb-2">📋 Approval Dashboard</h1>
                    <p className="text-purple-100 text-lg">Review and manage worker change requests</p>
                  </div>
                  {pendingCount > 0 && (
                    <div className="bg-white/20 backdrop-blur-sm rounded-xl px-6 py-4">
                      <div className="text-3xl font-bold">{pendingCount}</div>
                      <div className="text-sm text-purple-100">Pending</div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Filters */}
            <div className="px-8 py-6 bg-white border-b">
              <div className="flex gap-2">
                {(['ALL', 'PENDING', 'APPROVED', 'REJECTED'] as const).map((status) => (
                  <Button
                    key={status}
                    onClick={() => setFilter(status)}
                    variant={filter === status ? 'default' : 'outline'}
                    size="sm"
                  >
                    {status}
                    {status === 'PENDING' && pendingCount > 0 && (
                      <span className="ml-2 bg-white text-purple-600 rounded-full px-2 py-0.5 text-xs font-bold">
                        {pendingCount}
                      </span>
                    )}
                  </Button>
                ))}
              </div>
            </div>

            {/* Content */}
            <div className="px-8 py-8">
              {loading ? (
                <div className="text-center py-12">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto"></div>
                  <p className="mt-4 text-gray-600">Loading requests...</p>
                </div>
              ) : requests.length === 0 ? (
                <Card>
                  <CardContent className="p-12 text-center">
                    <AlertCircle className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">No Requests Found</h3>
                    <p className="text-gray-600">
                      {filter === 'PENDING'
                        ? 'All caught up! No pending approval requests.'
                        : `No ${filter.toLowerCase()} requests found.`}
                    </p>
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-4">
                  {requests.map((request) => (
                    <Card key={request.id} className="hover:shadow-lg transition-shadow">
                      <CardHeader>
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                              {getActionBadge(request.type)}
                              <span className="text-gray-600 dark:text-gray-400 font-medium">
                                {getReadableActionText(request.type, request.tableName)}
                              </span>
                              {getStatusBadge(request.status)}
                            </div>
                            <CardTitle className="text-lg text-gray-900 dark:text-white">{request.reason}</CardTitle>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-4">
                          {/* Worker Info */}
                          <div className="flex items-center gap-4 text-sm text-gray-600">
                            <div className="flex items-center gap-2">
                              <User className="h-4 w-4" />
                              {request.worker.name}
                            </div>
                            <div className="flex items-center gap-2">
                              <Calendar className="h-4 w-4" />
                              {new Date(request.createdAt).toLocaleString()}
                            </div>
                          </div>

                          {/* Request Data Preview */}
                          <div className="bg-gray-50 rounded-lg p-4">
                            <div className="text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                              <FileText className="h-4 w-4" />
                              Request Details
                            </div>
                            <pre className="text-xs text-gray-600 overflow-x-auto">
                              {JSON.stringify(request.requestData, null, 2)}
                            </pre>
                          </div>

                          {/* Review Notes */}
                          {request.status === 'PENDING' && (
                            <div className="space-y-2">
                              <label className="text-sm font-medium text-gray-700">
                                Review Notes (Optional)
                              </label>
                              <Textarea
                                value={reviewNotes[request.id] || ''}
                                onChange={(e) => setReviewNotes(prev => ({
                                  ...prev,
                                  [request.id]: e.target.value
                                }))}
                                placeholder="Add notes about your decision..."
                                rows={2}
                              />
                            </div>
                          )}

                          {/* Actions */}
                          {request.status === 'PENDING' && (
                            <div className="flex gap-3 pt-2">
                              <Button
                                onClick={() => handleApprove(request.id)}
                                disabled={processingId === request.id}
                                className="flex-1 bg-green-600 hover:bg-green-700 flex items-center justify-center gap-2"
                              >
                                {processingId === request.id ? (
                                  <>
                                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                                    Processing...
                                  </>
                                ) : (
                                  <>
                                    <CheckCircle className="h-4 w-4" />
                                    Approve
                                  </>
                                )}
                              </Button>
                              <Button
                                onClick={() => handleReject(request.id)}
                                disabled={processingId === request.id}
                                variant="destructive"
                                className="flex-1 flex items-center justify-center gap-2"
                              >
                                <XCircle className="h-4 w-4" />
                                Reject
                              </Button>
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  )
}

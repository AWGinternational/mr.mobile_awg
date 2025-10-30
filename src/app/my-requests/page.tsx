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
import { BusinessSidebar } from '@/components/layout/BusinessSidebar'
import { TopNavigation } from '@/components/layout/TopNavigation'
import {
  CheckCircle,
  XCircle,
  Clock,
  User,
  Calendar,
  FileText,
  AlertCircle,
  RefreshCw,
  MessageSquare
} from 'lucide-react'

interface MyApprovalRequest {
  id: string
  type: string
  tableName: string
  recordId: string | null
  requestData: any
  reason: string
  status: 'PENDING' | 'APPROVED' | 'REJECTED'
  createdAt: string
  approvedAt: string | null
  approvedBy: string | null
  rejectionReason: string | null
  reviewer: {
    name: string
    email: string
  } | null
}

export default function MyRequestsPage() {
  const router = useRouter()
  const { user: currentUser } = useAuth()
  const { success, error: showError } = useNotify()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [requests, setRequests] = useState<MyApprovalRequest[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'ALL' | 'PENDING' | 'APPROVED' | 'REJECTED'>('ALL')

  useEffect(() => {
    fetchMyRequests()
    // Set up polling to check for updates every 30 seconds
    const interval = setInterval(fetchMyRequests, 30000)
    return () => clearInterval(interval)
  }, [filter])

  const fetchMyRequests = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/approvals/my-requests?status=${filter}`)
      const result = await response.json()

      if (response.ok && result.success) {
        setRequests(result.data.requests)
      } else {
        showError(result.error || 'Failed to fetch your requests')
      }
    } catch (error) {
      console.error('Error fetching requests:', error)
      showError('Failed to fetch your requests')
    } finally {
      setLoading(false)
    }
  }

  const getActionBadge = (type: string) => {
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
            Pending Review
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

  const getStatusMessage = (request: MyApprovalRequest) => {
    if (request.status === 'APPROVED') {
      return (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
            <div>
              <p className="font-semibold text-green-900">Request Approved!</p>
              <p className="text-sm text-green-700 mt-1">
                Your request has been approved by {request.reviewer?.name || 'Shop Owner'}.
                {request.approvedAt && (
                  <span className="block mt-1">
                    Approved on {new Date(request.approvedAt).toLocaleString()}
                  </span>
                )}
              </p>
            </div>
          </div>
        </div>
      )
    } else if (request.status === 'REJECTED') {
      return (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <XCircle className="h-5 w-5 text-red-600 mt-0.5" />
            <div className="flex-1">
              <p className="font-semibold text-red-900">Request Rejected</p>
              <p className="text-sm text-red-700 mt-1">
                Your request was rejected by {request.reviewer?.name || 'Shop Owner'}.
              </p>
              {request.rejectionReason && (
                <div className="mt-2 bg-white rounded p-2 border border-red-200">
                  <p className="text-xs font-medium text-red-800 mb-1">Reason:</p>
                  <p className="text-sm text-red-900">{request.rejectionReason}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )
    } else {
      return (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <Clock className="h-5 w-5 text-yellow-600 mt-0.5" />
            <div>
              <p className="font-semibold text-yellow-900">Awaiting Review</p>
              <p className="text-sm text-yellow-700 mt-1">
                Your request is pending review by the shop owner.
              </p>
            </div>
          </div>
        </div>
      )
    }
  }

  const pendingCount = requests.filter(r => r.status === 'PENDING').length
  const approvedCount = requests.filter(r => r.status === 'APPROVED').length
  const rejectedCount = requests.filter(r => r.status === 'REJECTED').length

  return (
    <ProtectedRoute allowedRoles={[UserRole.SHOP_WORKER]}>
      <div className="flex min-h-screen bg-gray-50 dark:bg-gray-900">
        <BusinessSidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
        
        <div className={`flex-1 flex flex-col min-h-screen transition-all duration-300 ${sidebarOpen ? 'lg:ml-20' : 'lg:ml-64'}`}>
          <TopNavigation onMenuClick={() => setSidebarOpen(!sidebarOpen)} />
          
          <div className="flex-1 bg-gray-50 dark:bg-gray-900">
            {/* Header */}
            <div className="bg-gradient-to-r from-blue-600 to-indigo-700 text-white">
              <div className="px-8 py-12">
                <div className="flex justify-between items-start">
                  <div>
                    <h1 className="text-4xl font-bold mb-2">📝 My Approval Requests</h1>
                    <p className="text-blue-100 text-lg">Track the status of your approval requests</p>
                  </div>
                  <Button
                    onClick={fetchMyRequests}
                    variant="outline"
                    className="bg-white/10 border-white/20 text-white hover:bg-white/20"
                  >
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Refresh
                  </Button>
                </div>
                
                {/* Stats */}
                <div className="grid grid-cols-3 gap-4 mt-8">
                  <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4">
                    <div className="text-2xl font-bold">{pendingCount}</div>
                    <div className="text-sm text-blue-100">Pending</div>
                  </div>
                  <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4">
                    <div className="text-2xl font-bold">{approvedCount}</div>
                    <div className="text-sm text-blue-100">Approved</div>
                  </div>
                  <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4">
                    <div className="text-2xl font-bold">{rejectedCount}</div>
                    <div className="text-sm text-blue-100">Rejected</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Filters */}
            <div className="px-8 py-6 bg-white dark:bg-gray-800 border-b dark:border-gray-700">
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
                      <span className="ml-2 bg-white text-blue-600 rounded-full px-2 py-0.5 text-xs font-bold">
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
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                  <p className="mt-4 text-gray-600 dark:text-gray-400">Loading your requests...</p>
                </div>
              ) : requests.length === 0 ? (
                <Card>
                  <CardContent className="p-12 text-center">
                    <MessageSquare className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">No Requests Found</h3>
                    <p className="text-gray-600 dark:text-gray-400">
                      {filter === 'PENDING'
                        ? 'You have no pending approval requests.'
                        : `You have no ${filter.toLowerCase()} requests.`}
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
                            <CardTitle className="text-lg text-gray-900 dark:text-white">
                              {request.reason}
                            </CardTitle>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-4">
                          {/* Status Message */}
                          {getStatusMessage(request)}

                          {/* Submission Info */}
                          <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400">
                            <div className="flex items-center gap-2">
                              <Calendar className="h-4 w-4" />
                              Submitted: {new Date(request.createdAt).toLocaleString()}
                            </div>
                          </div>

                          {/* Request Data Preview */}
                          <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
                            <div className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 flex items-center gap-2">
                              <FileText className="h-4 w-4" />
                              Request Details
                            </div>
                            <pre className="text-xs text-gray-600 dark:text-gray-400 overflow-x-auto">
                              {JSON.stringify(request.requestData, null, 2)}
                            </pre>
                          </div>
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

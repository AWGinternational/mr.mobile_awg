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
import { Input } from '@/components/ui/input'
import { BusinessSidebar } from '@/components/layout/BusinessSidebar'
import { TopNavigation } from '@/components/layout/TopNavigation'
import {
  ArrowLeft,
  LogOut,
  CheckCircle,
  Calendar,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Search,
  Filter,
  Eye,
  Edit,
  Trash2,
  Loader2
} from 'lucide-react'
import { formatUserRole } from '@/utils/user-formatting'

interface DailyClosing {
  id: string
  date: string
  status: string
  cashSales: number
  jazzLoadSales: number
  telenorLoadSales: number
  zongLoadSales: number
  ufoneLoadSales: number
  easypaisaSales: number
  jazzcashSales: number
  receiving: number
  bankTransfer: number
  loan: number
  cash: number
  credit: number
  inventory: number
  totalIncome: number
  totalExpenses: number
  netAmount: number
  notes?: string
  createdAt: string
  updatedAt: string
}

export default function DailyClosingRecordsPage() {
  const router = useRouter()
  const { user: currentUser, logout } = useAuth()
  const { error: showError } = useNotify()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  
  const [closings, setClosings] = useState<DailyClosing[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedClosing, setSelectedClosing] = useState<DailyClosing | null>(null)
  const [showDetails, setShowDetails] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [actionLoading, setActionLoading] = useState(false)

  useEffect(() => {
    if (currentUser) {
      fetchClosings()
    }
  }, [currentUser])

  const fetchClosings = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/daily-closing/history')
      const result = await response.json()
      
      if (response.ok && result.success) {
        setClosings(result.data.closings || [])
      } else {
        showError(result.error || 'Failed to fetch closing records')
      }
    } catch (error) {
      console.error('Error fetching closing records:', error)
      showError('Failed to fetch closing records')
    } finally {
      setLoading(false)
    }
  }

  const handleLogout = async () => {
    try {
      await logout()
      router.push('/login')
    } catch (error) {
      console.error('Logout error:', error)
    }
  }

  const handleBack = () => {
    router.push('/daily-closing')
  }

  const handleEdit = (closing: DailyClosing) => {
    // Navigate to the daily closing page with the date pre-selected
    router.push(`/daily-closing?date=${closing.date}`)
  }

  const handleDelete = (closing: DailyClosing) => {
    setSelectedClosing(closing)
    setShowDeleteDialog(true)
  }

  const handleDeleteConfirm = async () => {
    if (!selectedClosing) return

    try {
      setActionLoading(true)
      const response = await fetch(`/api/daily-closing/${selectedClosing.id}`, {
        method: 'DELETE'
      })

      const result = await response.json()

      if (response.ok && result.success) {
        // Remove from list
        setClosings(prev => prev.filter(c => c.id !== selectedClosing.id))
        setShowDeleteDialog(false)
        setSelectedClosing(null)
      } else {
        showError(result.error || 'Failed to delete closing')
      }
    } catch (error) {
      console.error('Error deleting closing:', error)
      showError('Failed to delete closing')
    } finally {
      setActionLoading(false)
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-PK', { 
      style: 'currency', 
      currency: 'PKR', 
      minimumFractionDigits: 0 
    }).format(amount)
  }

  const filteredClosings = closings.filter(closing => {
    if (!searchTerm) return true
    const date = new Date(closing.date).toLocaleDateString('en-PK')
    const amount = closing.netAmount.toString()
    return date.includes(searchTerm) || amount.includes(searchTerm)
  })

  const totalClosingAmount = closings.reduce((sum, c) => sum + parseFloat(String(c.netAmount)), 0)
  const averageClosing = closings.length > 0 ? totalClosingAmount / closings.length : 0

  return (
    <ProtectedRoute allowedRoles={[UserRole.SHOP_OWNER, UserRole.SHOP_WORKER]}>
      <div className="flex min-h-screen bg-gray-50 dark:bg-gray-900">
        <BusinessSidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
        <div className={`flex-1 flex flex-col min-h-screen transition-all duration-300 ${sidebarOpen ? 'lg:ml-20' : 'lg:ml-64'}`}>
          <TopNavigation onMenuClick={() => setSidebarOpen(!sidebarOpen)} />
          
          <div className="flex-1 bg-gray-50 dark:bg-gray-900">
            {/* Header */}
            <div className="bg-gradient-to-r from-green-600 via-emerald-600 to-teal-700 text-white">
              <div className="px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                  <div className="flex items-center gap-3 sm:gap-4 w-full sm:w-auto">
                    <button 
                      onClick={handleBack} 
                      className="p-2 sm:p-3 bg-white/10 hover:bg-white/20 rounded-xl transition-all duration-200 shrink-0"
                    >
                      <ArrowLeft className="h-5 w-5 text-white" />
                    </button>
                    <div className="min-w-0 flex-1">
                      <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold mb-1 sm:mb-2 truncate">📊 Daily Closing Records</h1>
                      <p className="text-green-100 text-sm sm:text-base lg:text-lg">View and analyze all submitted daily closings</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="px-4 sm:px-6 lg:px-8 py-4 sm:py-6 lg:py-8">
              {/* Stats Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 mb-6 sm:mb-8">
              <Card className="border-l-4 border-l-green-500">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium text-gray-600">Total Closings</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between">
                    <p className="text-3xl font-bold text-gray-900">{closings.length}</p>
                    <Calendar className="h-8 w-8 text-green-500" />
                  </div>
                </CardContent>
              </Card>

              <Card className="border-l-4 border-l-blue-500">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium text-gray-600">Total Amount</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between">
                    <p className="text-3xl font-bold text-blue-900">{formatCurrency(totalClosingAmount)}</p>
                    <DollarSign className="h-8 w-8 text-blue-500" />
                  </div>
                </CardContent>
              </Card>

              <Card className="border-l-4 border-l-purple-500">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium text-gray-600">Average Closing</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between">
                    <p className="text-3xl font-bold text-purple-900">{formatCurrency(averageClosing)}</p>
                    <TrendingUp className="h-8 w-8 text-purple-500" />
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Search Bar */}
            <Card className="mb-4 sm:mb-6">
              <CardContent className="p-3 sm:p-4">
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 sm:gap-4">
                  <div className="relative flex-1">
                    <Search className="absolute left-2.5 sm:left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 sm:h-5 sm:w-5 text-gray-400 dark:text-gray-500" />
                    <Input
                      type="text"
                      placeholder="Search by date or amount..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-8 sm:pl-10 h-9 sm:h-10 text-sm sm:text-base"
                    />
                  </div>
                  <Button variant="outline" className="flex items-center justify-center gap-2 h-9 sm:h-10">
                    <Filter className="h-3 w-3 sm:h-4 sm:w-4" />
                    <span className="text-sm sm:text-base">Filter</span>
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Closings List */}
            {loading ? (
              <div className="text-center py-12">
                <p className="text-gray-500 text-lg">Loading closing records...</p>
              </div>
            ) : filteredClosings.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <Calendar className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500 text-lg">No closing records found</p>
                  <p className="text-gray-400 mt-2">Start by creating a daily closing</p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-3 sm:space-y-4">
                {filteredClosings.map((closing) => {
                  const totalLoads = parseFloat(String(closing.jazzLoadSales || 0)) + 
                                    parseFloat(String(closing.telenorLoadSales || 0)) + 
                                    parseFloat(String(closing.zongLoadSales || 0)) + 
                                    parseFloat(String(closing.ufoneLoadSales || 0))
                  
                  return (
                    <Card key={closing.id} className="hover:shadow-lg transition-shadow duration-200">
                      <CardContent className="p-4 sm:p-6">
                        <div className="flex flex-col gap-4">
                          {/* Header */}
                          <div className="flex flex-col sm:flex-row justify-between items-start gap-3">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 sm:gap-3 mb-2 flex-wrap">
                                <CheckCircle className="h-4 w-4 sm:h-5 sm:w-5 text-green-500 shrink-0" />
                                <h3 className="text-base sm:text-lg lg:text-xl font-bold text-gray-900 dark:text-white truncate">
                                  {new Date(closing.date).toLocaleDateString('en-PK', { 
                                    weekday: 'short', 
                                    year: 'numeric', 
                                    month: 'short', 
                                    day: 'numeric' 
                                  })}
                                </h3>
                                <Badge className="bg-green-600 text-white text-xs">CLOSED</Badge>
                              </div>
                              <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">
                                Submitted {new Date(closing.createdAt).toLocaleString('en-PK', { 
                                  dateStyle: 'short', 
                                  timeStyle: 'short' 
                                })}
                              </p>
                            </div>

                            {/* Stats Grid */}
                            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4 w-full sm:w-auto">
                              <div className="bg-blue-50 p-3 rounded-lg">
                                <p className="text-xs text-blue-600 font-medium mb-1">POS Sales</p>
                                <p className="text-lg font-bold text-blue-900">
                                  {formatCurrency(parseFloat(String(closing.cashSales || 0)))}
                                </p>
                              </div>
                              <div className="bg-purple-50 p-3 rounded-lg">
                                <p className="text-xs text-purple-600 font-medium mb-1">Load Sales</p>
                                <p className="text-lg font-bold text-purple-900">
                                  {formatCurrency(totalLoads)}
                                </p>
                              </div>
                              <div className="bg-green-50 p-3 rounded-lg">
                                <p className="text-xs text-green-600 font-medium mb-1">Total Income</p>
                                <p className="text-lg font-bold text-green-900">
                                  {formatCurrency(parseFloat(String(closing.totalIncome || 0)))}
                                </p>
                              </div>
                              <div className="bg-red-50 p-3 rounded-lg">
                                <p className="text-xs text-red-600 font-medium mb-1">Total Expenses</p>
                                <p className="text-lg font-bold text-red-900">
                                  {formatCurrency(parseFloat(String(closing.totalExpenses || 0)))}
                                </p>
                              </div>
                              <div className="bg-emerald-50 p-3 rounded-lg col-span-2">
                                <p className="text-xs text-emerald-600 font-medium mb-1">💼 Total Closing</p>
                                <p className="text-2xl font-bold text-emerald-900">
                                  {formatCurrency(parseFloat(String(closing.netAmount || 0)))}
                                </p>
                              </div>
                            </div>

                            {closing.notes && (
                              <div className="mt-3 p-3 bg-gray-50 border border-gray-200 rounded-lg">
                                <p className="text-sm text-gray-600">
                                  <strong className="text-gray-700">Notes:</strong> {closing.notes}
                                </p>
                              </div>
                            )}
                          </div>

                          <div className="ml-4 flex flex-col gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                setSelectedClosing(closing)
                                setShowDetails(true)
                              }}
                            >
                              <Eye className="h-4 w-4 mr-2" />
                              View Details
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                              onClick={() => handleEdit(closing)}
                            >
                              <Edit className="h-4 w-4 mr-2" />
                              Edit
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              className="text-red-600 hover:text-red-700 hover:bg-red-50"
                              onClick={() => handleDelete(closing)}
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              Delete
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  )
                })}
              </div>
            )}
          </div>

          {/* Details Modal */}
          {showDetails && selectedClosing && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
              <Card className="w-full max-w-4xl max-h-[90vh] overflow-y-auto">
                <CardHeader className="border-b bg-gradient-to-r from-green-50 to-emerald-50">
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="text-2xl font-bold text-gray-900 mb-2">
                        Daily Closing Details
                      </CardTitle>
                      <p className="text-gray-600">
                        {new Date(selectedClosing.date).toLocaleDateString('en-PK', { 
                          weekday: 'long', 
                          year: 'numeric', 
                          month: 'long', 
                          day: 'numeric' 
                        })}
                      </p>
                    </div>
                    <Button variant="ghost" onClick={() => setShowDetails(false)}>✕</Button>
                  </div>
                </CardHeader>
                <CardContent className="p-6">
                  <div className="space-y-6">
                    {/* POS Sales */}
                    <div>
                      <h4 className="font-semibold text-gray-900 mb-3">💰 POS Sales</h4>
                      <div className="bg-blue-50 p-4 rounded-lg">
                        <p className="text-2xl font-bold text-blue-900">
                          {formatCurrency(parseFloat(String(selectedClosing.cashSales || 0)))}
                        </p>
                      </div>
                    </div>

                    {/* Load Sales */}
                    <div>
                      <h4 className="font-semibold text-gray-900 mb-3">📱 Load Sales</h4>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                        <div className="bg-purple-50 p-3 rounded-lg">
                          <p className="text-xs text-purple-600 mb-1">Jazz Load</p>
                          <p className="font-bold text-purple-900">{formatCurrency(parseFloat(String(selectedClosing.jazzLoadSales || 0)))}</p>
                        </div>
                        <div className="bg-purple-50 p-3 rounded-lg">
                          <p className="text-xs text-purple-600 mb-1">Telenor Load</p>
                          <p className="font-bold text-purple-900">{formatCurrency(parseFloat(String(selectedClosing.telenorLoadSales || 0)))}</p>
                        </div>
                        <div className="bg-purple-50 p-3 rounded-lg">
                          <p className="text-xs text-purple-600 mb-1">Zong Load</p>
                          <p className="font-bold text-purple-900">{formatCurrency(parseFloat(String(selectedClosing.zongLoadSales || 0)))}</p>
                        </div>
                        <div className="bg-purple-50 p-3 rounded-lg">
                          <p className="text-xs text-purple-600 mb-1">Ufone Load</p>
                          <p className="font-bold text-purple-900">{formatCurrency(parseFloat(String(selectedClosing.ufoneLoadSales || 0)))}</p>
                        </div>
                      </div>
                    </div>

                    {/* Mobile Payments */}
                    <div>
                      <h4 className="font-semibold text-gray-900 mb-3">💳 Mobile Payments</h4>
                      <div className="grid grid-cols-2 gap-3">
                        <div className="bg-amber-50 p-3 rounded-lg">
                          <p className="text-xs text-amber-600 mb-1">EasyPaisa</p>
                          <p className="font-bold text-amber-900">{formatCurrency(parseFloat(String(selectedClosing.easypaisaSales || 0)))}</p>
                        </div>
                        <div className="bg-amber-50 p-3 rounded-lg">
                          <p className="text-xs text-amber-600 mb-1">JazzCash</p>
                          <p className="font-bold text-amber-900">{formatCurrency(parseFloat(String(selectedClosing.jazzcashSales || 0)))}</p>
                        </div>
                      </div>
                    </div>

                    {/* Other Income */}
                    <div>
                      <h4 className="font-semibold text-gray-900 mb-3">💵 Other Income</h4>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                        <div className="bg-green-50 p-3 rounded-lg">
                          <p className="text-xs text-green-600 mb-1">Commissions</p>
                          <p className="font-bold text-green-900">{formatCurrency(parseFloat(String(selectedClosing.receiving || 0)))}</p>
                        </div>
                        <div className="bg-green-50 p-3 rounded-lg">
                          <p className="text-xs text-green-600 mb-1">Bank Amount</p>
                          <p className="font-bold text-green-900">{formatCurrency(parseFloat(String(selectedClosing.bankTransfer || 0)))}</p>
                        </div>
                        <div className="bg-green-50 p-3 rounded-lg">
                          <p className="text-xs text-green-600 mb-1">Loan</p>
                          <p className="font-bold text-green-900">{formatCurrency(parseFloat(String(selectedClosing.loan || 0)))}</p>
                        </div>
                        <div className="bg-green-50 p-3 rounded-lg">
                          <p className="text-xs text-green-600 mb-1">Cash</p>
                          <p className="font-bold text-green-900">{formatCurrency(parseFloat(String(selectedClosing.cash || 0)))}</p>
                        </div>
                      </div>
                    </div>

                    {/* Expenses */}
                    <div>
                      <h4 className="font-semibold text-gray-900 mb-3">📉 Expenses</h4>
                      <div className="grid grid-cols-2 gap-3">
                        <div className="bg-red-50 p-3 rounded-lg">
                          <p className="text-xs text-red-600 mb-1">Credit</p>
                          <p className="font-bold text-red-900">{formatCurrency(parseFloat(String(selectedClosing.credit || 0)))}</p>
                        </div>
                        <div className="bg-red-50 p-3 rounded-lg">
                          <p className="text-xs text-red-600 mb-1">Inventory/Purchasing</p>
                          <p className="font-bold text-red-900">{formatCurrency(parseFloat(String(selectedClosing.inventory || 0)))}</p>
                        </div>
                      </div>
                    </div>

                    {/* Totals */}
                    <div className="border-t pt-4">
                      <div className="grid grid-cols-3 gap-4">
                        <div className="bg-green-50 p-4 rounded-lg text-center">
                          <TrendingUp className="h-6 w-6 text-green-600 mx-auto mb-2" />
                          <p className="text-xs text-green-600 mb-1">Total Income</p>
                          <p className="text-xl font-bold text-green-900">
                            {formatCurrency(parseFloat(String(selectedClosing.totalIncome || 0)))}
                          </p>
                        </div>
                        <div className="bg-red-50 p-4 rounded-lg text-center">
                          <TrendingDown className="h-6 w-6 text-red-600 mx-auto mb-2" />
                          <p className="text-xs text-red-600 mb-1">Total Expenses</p>
                          <p className="text-xl font-bold text-red-900">
                            {formatCurrency(parseFloat(String(selectedClosing.totalExpenses || 0)))}
                          </p>
                        </div>
                        <div className="bg-emerald-100 p-4 rounded-lg text-center border-2 border-emerald-500">
                          <DollarSign className="h-6 w-6 text-emerald-600 mx-auto mb-2" />
                          <p className="text-xs text-emerald-600 mb-1">💼 Total Closing</p>
                          <p className="text-2xl font-bold text-emerald-900">
                            {formatCurrency(parseFloat(String(selectedClosing.netAmount || 0)))}
                          </p>
                        </div>
                      </div>
                    </div>

                    {selectedClosing.notes && (
                      <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                        <p className="text-sm font-medium text-gray-700 mb-2">Notes:</p>
                        <p className="text-gray-600">{selectedClosing.notes}</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Delete Confirmation Dialog */}
          {showDeleteDialog && selectedClosing && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
              <Card className="w-full max-w-md">
                <CardHeader className="border-b bg-red-50">
                  <CardTitle className="text-xl font-bold text-red-900 flex items-center gap-2">
                    <Trash2 className="h-5 w-5" />
                    Delete Daily Closing
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-6">
                  <p className="text-gray-700 mb-4">
                    Are you sure you want to delete the daily closing for{' '}
                    <strong>
                      {new Date(selectedClosing.date).toLocaleDateString('en-PK', { 
                        weekday: 'long', 
                        year: 'numeric', 
                        month: 'long', 
                        day: 'numeric' 
                      })}
                    </strong>
                    ?
                  </p>
                  <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4">
                    <p className="text-sm text-red-800">
                      <strong>Warning:</strong> This action cannot be undone. The closing record and all associated data will be permanently deleted.
                    </p>
                  </div>
                  <div className="flex gap-3 justify-end">
                    <Button
                      variant="outline"
                      onClick={() => {
                        setShowDeleteDialog(false)
                        setSelectedClosing(null)
                      }}
                      disabled={actionLoading}
                    >
                      Cancel
                    </Button>
                    <Button
                      className="bg-red-600 hover:bg-red-700 text-white"
                      onClick={handleDeleteConfirm}
                      disabled={actionLoading}
                    >
                      {actionLoading ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Deleting...
                        </>
                      ) : (
                        <>
                          <Trash2 className="h-4 w-4 mr-2" />
                          Delete
                        </>
                      )}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
          </div>
        </div>
      </div>
    </ProtectedRoute>
  )
}


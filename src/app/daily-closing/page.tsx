'use client'

// Force dynamic rendering - do not attempt static generation
export const dynamic = 'force-dynamic'

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
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { BusinessSidebar } from '@/components/layout/BusinessSidebar'
import { TopNavigation } from '@/components/layout/TopNavigation'
import {
  DollarSign,
  ArrowLeft,
  LogOut,
  CheckCircle,
  Clock,
  TrendingUp,
  Banknote,
  CreditCard,
  AlertTriangle,
  History,
  Calendar
} from 'lucide-react'
import { formatUserRole } from '@/utils/user-formatting'

// Component that uses URL query parameters
function DailyClosingContent() {
  const router = useRouter()
  const { user: currentUser, logout } = useAuth()
  const { success, error: showError } = useNotify()
  const [sidebarOpen, setSidebarOpen] = useState(false)

  // Check if user is owner (can perform all actions)
  const isOwner = currentUser?.role === UserRole.SHOP_OWNER || currentUser?.role === UserRole.SUPER_ADMIN
  const isWorker = currentUser?.role === UserRole.SHOP_WORKER

  const [closingData, setClosingData] = useState({
    cashSales: '', // Total POS Sales (all payment methods combined)
    jazzLoadSales: '',
    telenorLoadSales: '',
    zongLoadSales: '',
    ufoneLoadSales: '',
    easypaisaSales: '',
    jazzcashSales: '',
    receiving: '', // Commissions
    bankTransfer: '', // Bank Amount
    loan: '',
    cash: '',
    credit: '',
    inventory: '',
    notes: ''
  })

  // Handle Enter key to move to next input
  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>, nextFieldId?: string) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      if (nextFieldId) {
        const nextField = document.getElementById(nextFieldId)
        if (nextField) {
          nextField.focus()
        }
      }
    }
  }

  const [salesData, setSalesData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  
  // Get date from URL query param or use today's date (client-side only)
  const [currentDate, setCurrentDate] = useState(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search)
      return params.get('date') || new Date().toISOString().split('T')[0]
    }
    return new Date().toISOString().split('T')[0]
  })
  const [existingClosing, setExistingClosing] = useState<any>(null) // To track if there's a saved closing
  const [showHistory, setShowHistory] = useState(false)
  const [closingHistory, setClosingHistory] = useState<any[]>([])
  const [loadingHistory, setLoadingHistory] = useState(false)

  // Fetch daily closing data
  const fetchDailyClosingData = async (date: string) => {
    try {
      setLoading(true)
      const response = await fetch(`/api/daily-closing?date=${date}`)
      const result = await response.json()
      
      if (response.ok && result.success) {
        setSalesData(result.data.salesData)
        
        // If there's existing closing data, populate the form and save reference
        if (result.data.closingData) {
          const existing = result.data.closingData
          const sales = result.data.salesData
          const loans = result.data.loanData
          
          setExistingClosing(existing) // Save the existing closing for display
          
          // If existing cashSales is 0 or empty, use current sales data
          const cashSalesValue = (existing.cashSales === 0 || !existing.cashSales) && sales?.totalSales 
            ? sales.totalSales.toString() 
            : existing.cashSales?.toString() || ''
            
          const loanValue = (existing.loan === 0 || !existing.loan) && loans?.totalRemainingLoans
            ? loans.totalRemainingLoans.toString()
            : existing.loan?.toString() || ''
          
          setClosingData({
            cashSales: cashSalesValue, // Auto-update if 0
            jazzLoadSales: existing.jazzLoadSales?.toString() || '',
            telenorLoadSales: existing.telenorLoadSales?.toString() || '',
            zongLoadSales: existing.zongLoadSales?.toString() || '',
            ufoneLoadSales: existing.ufoneLoadSales?.toString() || '',
            easypaisaSales: existing.easypaisaSales?.toString() || '',
            jazzcashSales: existing.jazzcashSales?.toString() || '',
            receiving: existing.receiving?.toString() || '', // Commissions
            bankTransfer: existing.bankTransfer?.toString() || '', // Bank Amount
            loan: loanValue, // Auto-update if 0
            cash: existing.cash?.toString() || '',
            credit: existing.credit?.toString() || '',
            inventory: existing.inventory?.toString() || '',
            notes: existing.notes || ''
          })
        } else {
          setExistingClosing(null) // No existing closing
          // 🆕 Auto-populate from API calculations
          const sales = result.data.salesData
          const loans = result.data.loanData
          const purchases = result.data.purchaseData
          const serviceFees = result.data.serviceFeeData
          
          setClosingData(prev => ({
            ...prev,
            cashSales: sales?.totalSales?.toString() || '0', // All POS sales
            loan: loans?.totalRemainingLoans?.toString() || '0', // Total remaining loans
            // 🆕 AUTO-POPULATE PURCHASE EXPENSES
            inventory: purchases?.totalPurchaseExpenses?.toString() || '0', // Supplier payments made today
            // 🆕 AUTO-POPULATE SERVICE FEES
            jazzLoadSales: serviceFees?.jazzLoadFees?.toString() || '0',
            telenorLoadSales: serviceFees?.telenorLoadFees?.toString() || '0',
            zongLoadSales: serviceFees?.zongLoadFees?.toString() || '0',
            ufoneLoadSales: serviceFees?.ufoneLoadFees?.toString() || '0',
            easypaisaSales: serviceFees?.easypaisaFees?.toString() || '0',
            jazzcashSales: serviceFees?.jazzcashFees?.toString() || '0',
          }))
        }
      } else {
        showError(result.error || 'Failed to fetch daily closing data')
      }
    } catch (error) {
      console.error('Error fetching daily closing data:', error)
      showError('Failed to fetch daily closing data')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (currentUser) {
      fetchDailyClosingData(currentDate)
    }
  }, [currentDate, currentUser])

  const handleLogout = async () => {
    try {
      await logout()
      router.push('/login')
    } catch (error) {
      console.error('Logout error:', error)
    }
  }

  const handleBack = () => {
    if (currentUser?.role === UserRole.SUPER_ADMIN) {
      router.push('/dashboard/admin')
    } else if (currentUser?.role === UserRole.SHOP_OWNER) {
      router.push('/dashboard/owner')
    } else {
      router.push('/dashboard/worker')
    }
  }

  const fetchClosingHistory = async () => {
    try {
      setLoadingHistory(true)
      // Fetch last 30 days of closings
      const response = await fetch('/api/daily-closing/history')
      const result = await response.json()
      
      if (response.ok && result.success) {
        setClosingHistory(result.data.closings || [])
      } else {
        showError(result.error || 'Failed to fetch closing history')
      }
    } catch (error) {
      console.error('Error fetching closing history:', error)
      showError('Failed to fetch closing history')
    } finally {
      setLoadingHistory(false)
    }
  }

  const handleSubmitClosing = async () => {
    try {
      setSubmitting(true)
      
      const response = await fetch('/api/daily-closing', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          date: currentDate,
          ...closingData
        })
      })

      const result = await response.json()

      if (response.ok && result.success) {
        success(result.data.message)
        // Refresh data to show updated totals
        await fetchDailyClosingData(currentDate)
      } else {
        showError(result.error || 'Failed to submit daily closing')
      }
    } catch (error) {
      console.error('Error submitting daily closing:', error)
      showError('Failed to submit daily closing')
    } finally {
      setSubmitting(false)
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-PK', { style: 'currency', currency: 'PKR', minimumFractionDigits: 0 }).format(amount)
  }

  const calculateTotals = () => {
    const cashSales = parseFloat(closingData.cashSales) || 0 // Total POS sales (all payment methods)
    const jazzLoadSales = parseFloat(closingData.jazzLoadSales) || 0
    const telenorLoadSales = parseFloat(closingData.telenorLoadSales) || 0
    const zongLoadSales = parseFloat(closingData.zongLoadSales) || 0
    const ufoneLoadSales = parseFloat(closingData.ufoneLoadSales) || 0
    const easypaisaSales = parseFloat(closingData.easypaisaSales) || 0 // Banking service commission
    const jazzcashSales = parseFloat(closingData.jazzcashSales) || 0 // Banking service commission
    const receiving = parseFloat(closingData.receiving) || 0
    const bankTransfer = parseFloat(closingData.bankTransfer) || 0
    const loan = parseFloat(closingData.loan) || 0
    const cash = parseFloat(closingData.cash) || 0
    const credit = parseFloat(closingData.credit) || 0
    const inventory = parseFloat(closingData.inventory) || 0

    // Formula: (Total POS Sales + all loads + bank amount + easypaisa + jazzcash + loan + cash + commissions) - (purchasing/inventory + credit)
    const totalIncome = cashSales + // Total POS Sales (all payment methods combined)
                       jazzLoadSales + telenorLoadSales + zongLoadSales + ufoneLoadSales + // All loads
                       bankTransfer + // Bank amount
                       easypaisaSales + jazzcashSales + // Easypaisa + JazzCash (banking services/commissions)
                       loan + cash + // Loan + Cash
                       receiving // Commissions

    const totalExpenses = inventory + credit // Inventory/Purchasing + Credit taken from company
    const netAmount = totalIncome - totalExpenses

    return { 
      totalIncome, 
      totalExpenses, 
      netAmount,
      cashSales, // Total POS sales
      jazzLoadSales,
      telenorLoadSales,
      zongLoadSales,
      ufoneLoadSales,
      easypaisaSales,
      jazzcashSales,
      receiving,
      bankTransfer,
      loan,
      cash,
      credit,
      inventory
    }
  }

  const totals = calculateTotals()

  return (
    <ProtectedRoute allowedRoles={[UserRole.SHOP_OWNER, UserRole.SHOP_WORKER]}>
      <div className="flex min-h-screen bg-gray-50 dark:bg-gray-900">
        <BusinessSidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
        
        {/* Main Content Area */}
        <div className={`flex-1 flex flex-col min-h-screen transition-all duration-300 ${sidebarOpen ? 'lg:ml-20' : 'lg:ml-64'}`}>
          {/* Top Navigation */}
          <TopNavigation onMenuClick={() => setSidebarOpen(!sidebarOpen)} />
          
          {/* Page Content */}
          <div className="flex-1 bg-gray-50 dark:bg-gray-900">
            {/* Header */}
            <div className="bg-gradient-to-r from-green-600 to-green-700 text-white">
              <div className="px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                  <div className="flex items-center gap-3 sm:gap-4 w-full sm:w-auto">
                    <button onClick={handleBack} className="p-2 sm:p-3 bg-white/10 hover:bg-white/20 rounded-xl transition-all duration-200 shrink-0">
                      <ArrowLeft className="h-5 w-5 text-white" />
                    </button>
                    <div className="min-w-0 flex-1">
                      <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold mb-1 sm:mb-2 truncate">💰 Daily Cash Closing</h1>
                      <p className="text-green-100 text-sm sm:text-base lg:text-lg">End of day cash and reserves calculation</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

          <div className="px-4 sm:px-6 lg:px-8 py-4 sm:py-6 lg:py-8 space-y-4 sm:space-y-6 lg:space-y-8">
            {/* Date Selector */}
          <Card>
            <CardContent className="p-4 sm:p-6">
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 sm:gap-4 flex-1">
                  <Label htmlFor="date" className="text-base sm:text-lg font-medium shrink-0">Select Date:</Label>
                  <Input
                    id="date"
                    type="date"
                    value={currentDate}
                    onChange={(e) => setCurrentDate(e.target.value)}
                    className="w-full sm:max-w-xs h-10 sm:h-11"
                  />
                </div>
                
                <Dialog open={showHistory} onOpenChange={setShowHistory}>
                  <DialogTrigger asChild>
                    <Button 
                      variant="outline" 
                      className="flex items-center justify-center gap-2 h-10 sm:h-11 w-full sm:w-auto"
                      onClick={fetchClosingHistory}
                    >
                      <History className="h-4 w-4" />
                      <span>View History</span>
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
                    <DialogHeader>
                      <DialogTitle className="text-2xl font-bold flex items-center gap-2">
                        <Calendar className="h-6 w-6 text-green-600" />
                        Daily Closing History
                      </DialogTitle>
                    </DialogHeader>
                    
                    {loadingHistory ? (
                      <div className="py-8 text-center">
                        <p className="text-gray-500 dark:text-gray-400">Loading history...</p>
                      </div>
                    ) : closingHistory.length === 0 ? (
                      <div className="py-8 text-center">
                        <p className="text-gray-500 dark:text-gray-400">No closing records found</p>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {closingHistory.map((closing) => (
                          <Card key={closing.id} className="border-l-4 border-l-green-500">
                            <CardContent className="p-4">
                              <div className="flex justify-between items-start">
                                <div>
                                  <p className="font-semibold text-lg text-gray-900 dark:text-white">
                                    {new Date(closing.date).toLocaleDateString('en-PK', { 
                                      weekday: 'long', 
                                      year: 'numeric', 
                                      month: 'long', 
                                      day: 'numeric' 
                                    })}
                                  </p>
                                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                                    Submitted on {new Date(closing.createdAt).toLocaleString('en-PK', { 
                                      dateStyle: 'medium', 
                                      timeStyle: 'short' 
                                    })}
                                  </p>
                                </div>
                                <div className="text-right">
                                  <Badge className="mb-2 bg-green-600">CLOSED</Badge>
                                  <p className="text-2xl font-bold text-green-900 dark:text-green-400">
                                    {formatCurrency(parseFloat(closing.netAmount || 0))}
                                  </p>
                                  <p className="text-xs text-gray-500 dark:text-gray-400">Total Closing</p>
                                </div>
                              </div>
                              
                              <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-3 pt-3 border-t dark:border-gray-700">
                                <div>
                                  <p className="text-xs text-gray-500 dark:text-gray-400">POS Sales</p>
                                  <p className="font-semibold text-gray-900 dark:text-white">{formatCurrency(parseFloat(closing.cashSales || 0))}</p>
                                </div>
                                <div>
                                  <p className="text-xs text-gray-500 dark:text-gray-400">Load Sales</p>
                                  <p className="font-semibold text-gray-900 dark:text-white">
                                    {formatCurrency(
                                      parseFloat(closing.jazzLoadSales || 0) + 
                                      parseFloat(closing.telenorLoadSales || 0) + 
                                      parseFloat(closing.zongLoadSales || 0) + 
                                      parseFloat(closing.ufoneLoadSales || 0)
                                    )}
                                  </p>
                                </div>
                                <div>
                                  <p className="text-xs text-gray-500 dark:text-gray-400">Total Income</p>
                                  <p className="font-semibold text-green-700 dark:text-green-400">{formatCurrency(parseFloat(closing.totalIncome || 0))}</p>
                                </div>
                                <div>
                                  <p className="text-xs text-gray-500 dark:text-gray-400">Total Expenses</p>
                                  <p className="font-semibold text-red-700 dark:text-red-400">{formatCurrency(parseFloat(closing.totalExpenses || 0))}</p>
                                </div>
                              </div>
                              
                              {closing.notes && (
                                <div className="mt-3 p-2 bg-gray-50 dark:bg-gray-700 rounded-md">
                                  <p className="text-xs text-gray-600 dark:text-gray-400"><strong>Notes:</strong> {closing.notes}</p>
                                </div>
                              )}
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    )}
                  </DialogContent>
                </Dialog>
              </div>
            </CardContent>
          </Card>

          {/* Submitted Closing Status */}
          {existingClosing && (
            <Card className="border-2 border-green-500 bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20">
              <CardContent className="p-4 sm:p-6">
                <div className="flex flex-col sm:flex-row items-start gap-4">
                  <div className="flex items-start gap-3 flex-1">
                    <div className="p-2 sm:p-3 bg-green-500 rounded-full shrink-0">
                      <CheckCircle className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <h3 className="text-base sm:text-lg lg:text-xl font-bold text-green-900 dark:text-green-100 flex flex-wrap items-center gap-2">
                        <span className="truncate">Daily Closing Submitted</span>
                        <Badge className="bg-green-600 text-white text-xs">CLOSED</Badge>
                      </h3>
                      <p className="text-xs sm:text-sm text-green-700 dark:text-green-300 mt-1">
                        Submitted {new Date(existingClosing.createdAt).toLocaleString('en-PK', { 
                          dateStyle: 'short', 
                          timeStyle: 'short' 
                        })}
                      </p>
                    </div>
                  </div>
                  <div className="text-left sm:text-right w-full sm:w-auto">
                    <p className="text-xs sm:text-sm text-green-600 dark:text-green-400 font-medium">Total Closing</p>
                    <p className="text-2xl sm:text-3xl font-bold text-green-900 dark:text-green-100">
                      {formatCurrency(parseFloat(existingClosing.netAmount || 0))}
                    </p>
                  </div>
                </div>
                
                {existingClosing.notes && (
                  <div className="mt-4 p-3 bg-white dark:bg-gray-800 rounded-lg border border-green-200 dark:border-green-700">
                    <p className="text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300">Notes:</p>
                    <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 mt-1">{existingClosing.notes}</p>
                  </div>
                )}
                
                <div className="mt-4 pt-4 border-t border-green-200 dark:border-green-700">
                  <p className="text-xs text-green-600 dark:text-green-400 italic">
                    💡 You can update the values below and resubmit to modify this closing record.
                  </p>
                </div>
              </CardContent>
            </Card>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
            {/* Closing Form */}
            <div className="lg:col-span-2 space-y-4 sm:space-y-6">
              {/* POS Sales Card */}
              <Card>
                <CardContent className="p-4 sm:p-6">
                  <h3 className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-white mb-4 sm:mb-6">💰 POS Sales (All Payment Methods)</h3>
                  <div className="space-y-3 sm:space-y-4">
                    <div className="space-y-2">
                      <Label className="text-sm sm:text-base">Total POS Sales (PKR) - Auto-filled from system</Label>
                      <Input
                        id="cashSales"
                        type="number"
                        value={closingData.cashSales || '0'}
                        onChange={(e) => setClosingData({...closingData, cashSales: e.target.value})}
                        onKeyPress={(e) => handleKeyPress(e, 'jazzLoadSales')}
                        placeholder="0"
                        className="bg-green-50 dark:bg-green-900/20 h-10 sm:h-11 text-sm sm:text-base"
                        autoFocus
                      />
                      <p className="text-xs text-green-600 dark:text-green-400">
                        ● Auto-calculated from today's POS sales
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Load Sales */}
              <Card>
                <CardContent className="p-4 sm:p-6">
                  <h3 className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-white mb-4 sm:mb-6">📱 Load Sales (Service Fees)</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                    <div className="space-y-2">
                      <Label className="text-sm sm:text-base">Jazz Load (PKR)</Label>
                      <Input
                        id="jazzLoadSales"
                        type="number"
                        value={closingData.jazzLoadSales}
                        onChange={(e) => setClosingData({...closingData, jazzLoadSales: e.target.value})}
                        onKeyPress={(e) => handleKeyPress(e, 'telenorLoadSales')}
                        placeholder="0"
                        className="bg-blue-50 dark:bg-blue-900/20 h-10 sm:h-11 text-sm sm:text-base"
                      />
                      <p className="text-xs text-blue-600 dark:text-blue-400">
                        ● Auto-calculated from mobile services
                      </p>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-sm sm:text-base">Telenor Load (PKR)</Label>
                      <Input
                        id="telenorLoadSales"
                        type="number"
                        value={closingData.telenorLoadSales}
                        onChange={(e) => setClosingData({...closingData, telenorLoadSales: e.target.value})}
                        onKeyPress={(e) => handleKeyPress(e, 'zongLoadSales')}
                        placeholder="0"
                        className="bg-blue-50 dark:bg-blue-900/20 h-10 sm:h-11 text-sm sm:text-base"
                      />
                      <p className="text-xs text-blue-600 dark:text-blue-400">
                        ● Auto-calculated from mobile services
                      </p>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-sm sm:text-base">Zong Load (PKR)</Label>
                      <Input
                        id="zongLoadSales"
                        type="number"
                        value={closingData.zongLoadSales}
                        onChange={(e) => setClosingData({...closingData, zongLoadSales: e.target.value})}
                        onKeyPress={(e) => handleKeyPress(e, 'ufoneLoadSales')}
                        placeholder="0"
                        className="bg-blue-50 dark:bg-blue-900/20 h-10 sm:h-11 text-sm sm:text-base"
                      />
                      <p className="text-xs text-blue-600 dark:text-blue-400">
                        ● Auto-calculated from mobile services
                      </p>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-sm sm:text-base">Ufone Load (PKR)</Label>
                      <Input
                        id="ufoneLoadSales"
                        type="number"
                        value={closingData.ufoneLoadSales}
                        onChange={(e) => setClosingData({...closingData, ufoneLoadSales: e.target.value})}
                        onKeyPress={(e) => handleKeyPress(e, 'easypaisaSales')}
                        placeholder="0"
                        className="bg-blue-50 dark:bg-blue-900/20 h-10 sm:h-11 text-sm sm:text-base"
                      />
                      <p className="text-xs text-blue-600 dark:text-blue-400">
                        ● Auto-calculated from mobile services
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Mobile Payments Card */}
              <Card>
                <CardContent className="p-4 sm:p-6">
                  <h3 className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-white mb-4 sm:mb-6">💳 Banking Services</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                    <div className="space-y-2">
                      <Label className="text-sm sm:text-base">EasyPaisa (PKR)</Label>
                      <Input
                        id="easypaisaSales"
                        type="number"
                        value={closingData.easypaisaSales}
                        onChange={(e) => setClosingData({...closingData, easypaisaSales: e.target.value})}
                        onKeyPress={(e) => handleKeyPress(e, 'jazzcashSales')}
                        placeholder="0"
                        className="bg-purple-50 dark:bg-purple-900/20 h-10 sm:h-11 text-sm sm:text-base"
                      />
                      <p className="text-xs text-purple-600 dark:text-purple-400">
                        ● Auto-calculated from mobile services
                      </p>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-sm sm:text-base">JazzCash (PKR)</Label>
                      <Input
                        id="jazzcashSales"
                        type="number"
                        value={closingData.jazzcashSales}
                        onChange={(e) => setClosingData({...closingData, jazzcashSales: e.target.value})}
                        onKeyPress={(e) => handleKeyPress(e, 'receiving')}
                        placeholder="0"
                        className="bg-purple-50 dark:bg-purple-900/20 h-10 sm:h-11 text-sm sm:text-base"
                      />
                      <p className="text-xs text-purple-600 dark:text-purple-400">
                        ● Auto-calculated from mobile services
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Other Income Card */}
              <Card>
                <CardContent className="p-4 sm:p-6">
                  <h3 className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-white mb-4 sm:mb-6">💵 Other Income</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                    <div className="space-y-2">
                      <Label className="text-sm sm:text-base">Commissions (PKR)</Label>
                      <Input
                        id="receiving"
                        type="number"
                        value={closingData.receiving}
                        onChange={(e) => setClosingData({...closingData, receiving: e.target.value})}
                        onKeyPress={(e) => handleKeyPress(e, 'bankTransfer')}
                        placeholder="0"
                        className="h-10 sm:h-11 text-sm sm:text-base"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-sm sm:text-base">Bank Amount (PKR)</Label>
                      <Input
                        id="bankTransfer"
                        type="number"
                        value={closingData.bankTransfer}
                        onChange={(e) => setClosingData({...closingData, bankTransfer: e.target.value})}
                        onKeyPress={(e) => handleKeyPress(e, 'loan')}
                        placeholder="0"
                        className="h-10 sm:h-11 text-sm sm:text-base"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2 text-sm sm:text-base">
                        <span>Total Outstanding Loans (PKR)</span>
                        <span className="text-xs text-green-600 font-normal">● Auto-calculated</span>
                      </Label>
                      <Input
                        id="loan"
                        type="number"
                        value={closingData.loan}
                        onChange={(e) => setClosingData({...closingData, loan: e.target.value})}
                        onKeyPress={(e) => handleKeyPress(e, 'cash')}
                        placeholder="0"
                        className="bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-700 h-10 sm:h-11 text-sm sm:text-base"
                      />
                      <p className="text-xs text-gray-500 dark:text-gray-400">Total amount customers owe (remaining loan balance)</p>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-sm sm:text-base">Cash (PKR)</Label>
                      <Input
                        id="cash"
                        type="number"
                        value={closingData.cash}
                        onChange={(e) => setClosingData({...closingData, cash: e.target.value})}
                        onKeyPress={(e) => handleKeyPress(e, 'credit')}
                        placeholder="0"
                        className="h-10 sm:h-11 text-sm sm:text-base"
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Expenses Card */}
              <Card>
                <CardContent className="p-4 sm:p-6">
                  <h3 className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-white mb-4 sm:mb-6">📉 Expenses</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                    <div className="space-y-2">
                      <Label className="text-sm sm:text-base">Credit (PKR)</Label>
                      <Input
                        id="credit"
                        type="number"
                        value={closingData.credit}
                        onChange={(e) => setClosingData({...closingData, credit: e.target.value})}
                        onKeyPress={(e) => handleKeyPress(e, 'inventory')}
                        placeholder="0"
                        className="h-10 sm:h-11 text-sm sm:text-base"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-sm sm:text-base">Inventory/Purchasing (PKR)</Label>
                      <Input
                        id="inventory"
                        type="number"
                        value={closingData.inventory}
                        onChange={(e) => setClosingData({...closingData, inventory: e.target.value})}
                        placeholder="0"
                        className="bg-red-50 dark:bg-red-900/20 h-10 sm:h-11 text-sm sm:text-base"
                      />
                      <p className="text-xs text-red-600 dark:text-red-400">
                        ● Auto-calculated from supplier payments today
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Notes Card */}
              <Card>
                <CardContent className="p-4 sm:p-6">
                  <h3 className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-white mb-4 sm:mb-6">📝 Notes</h3>
                  <Textarea
                    value={closingData.notes}
                    onChange={(e) => setClosingData({...closingData, notes: e.target.value})}
                    placeholder="Any additional notes about the day..."
                    rows={4}
                    className="text-sm sm:text-base"
                  />
                </CardContent>
              </Card>

              {isOwner && (
                <Button 
                  onClick={handleSubmitClosing} 
                  disabled={submitting || loading}
                  className="w-full bg-green-600 hover:bg-green-700 h-11 sm:h-12 text-base sm:text-lg disabled:opacity-50"
                >
                  {submitting ? 'Submitting...' : 'Submit Cash Closing'}
                </Button>
              )}
              {isWorker && (
                <div className="w-full p-4 bg-yellow-50 border border-yellow-200 rounded-lg text-center">
                  <AlertTriangle className="h-5 w-5 text-yellow-600 mx-auto mb-2" />
                  <p className="text-sm text-yellow-800">
                    Only shop owners can submit daily closing entries.
                  </p>
                  <p className="text-xs text-yellow-600 mt-1">
                    You can view the data but cannot submit.
                  </p>
                </div>
              )}
            </div>

            {/* Summary */}
            <div className="lg:sticky lg:top-8">
              <Card>
                <CardContent className="p-4 sm:p-6">
                  <h3 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white mb-4 sm:mb-6">📊 Cash & Reserves Summary</h3>
                  
                  {/* Sales Data from API */}
                  {salesData && (
                    <div className="mb-4 sm:mb-6 p-3 sm:p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                      <h4 className="font-medium text-blue-900 dark:text-blue-100 mb-2 sm:mb-3 text-sm sm:text-base">📈 POS Sales Summary</h4>
                      <div className="space-y-2 text-xs sm:text-sm">
                        <div className="flex justify-between">
                          <span className="text-gray-700 dark:text-gray-300">Total POS Sales:</span>
                          <span className="font-semibold text-gray-900 dark:text-white">{formatCurrency(salesData.totalSales)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-700 dark:text-gray-300">Transactions Count:</span>
                          <span className="font-semibold text-gray-900 dark:text-white">{salesData.totalTransactions}</span>
                        </div>
                        <div className="text-xs text-blue-600 dark:text-blue-400 mt-2">
                          <p>• Includes all payment methods</p>
                          <p>• Auto-filled in "Total POS Sales" field</p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Manual Entry Totals */}
                  <div className="space-y-3 sm:space-y-4">
                    <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-3 sm:p-4">
                      <p className="text-xs sm:text-sm text-green-700 dark:text-green-300 mb-1">💰 Today Overall Cash</p>
                      <p className="text-xl sm:text-2xl font-bold text-green-900 dark:text-green-100">{formatCurrency(totals.totalIncome)}</p>
                    </div>
                    <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3 sm:p-4">
                      <p className="text-xs sm:text-sm text-red-700 dark:text-red-300 mb-1">📉 Total Expenses</p>
                      <p className="text-xl sm:text-2xl font-bold text-red-900 dark:text-red-100">{formatCurrency(totals.totalExpenses)}</p>
                    </div>
                    <div className={`border rounded-lg p-3 sm:p-4 ${totals.netAmount >= 0 ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800' : 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800'}`}>
                      <p className={`text-xs sm:text-sm mb-1 ${totals.netAmount >= 0 ? 'text-blue-700 dark:text-blue-300' : 'text-red-700 dark:text-red-300'}`}>
                        💼 Total Closing
                      </p>
                      <p className={`text-xl sm:text-2xl font-bold ${totals.netAmount >= 0 ? 'text-blue-900 dark:text-blue-100' : 'text-red-900 dark:text-red-100'}`}>
                        {formatCurrency(totals.netAmount)}
                      </p>
                    </div>
                  </div>

                  {/* Breakdown */}
                  <div className="mt-4 sm:mt-6 pt-3 sm:pt-4 border-t border-gray-200 dark:border-gray-700">
                    <h4 className="font-medium text-gray-900 dark:text-white mb-2 sm:mb-3 text-sm sm:text-base">📋 Income Breakdown</h4>
                    <div className="space-y-2 text-xs sm:text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-700 dark:text-gray-300">POS Sales (All Methods):</span>
                        <span className="text-gray-900 dark:text-white font-medium">{formatCurrency(totals.cashSales)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-700 dark:text-gray-300">Load Sales (Mobile Credit):</span>
                        <span className="text-gray-900 dark:text-white font-medium">{formatCurrency(totals.jazzLoadSales + totals.telenorLoadSales + totals.zongLoadSales + totals.ufoneLoadSales)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-700 dark:text-gray-300">Banking Services (Commission):</span>
                        <span className="text-gray-900 dark:text-white font-medium">{formatCurrency(totals.easypaisaSales + totals.jazzcashSales)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-700 dark:text-gray-300">Other Income:</span>
                        <span className="text-gray-900 dark:text-white font-medium">{formatCurrency(totals.receiving + totals.bankTransfer + totals.loan + totals.cash)}</span>
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400 ml-3 sm:ml-4 space-y-1">
                        <div>• Commissions: {formatCurrency(totals.receiving)}</div>
                        <div>• Bank Amount: {formatCurrency(totals.bankTransfer)}</div>
                        <div>• Loan: {formatCurrency(totals.loan)}</div>
                        <div>• Cash: {formatCurrency(totals.cash)}</div>
                      </div>
                    </div>
                  </div>

                  <div className="mt-3 sm:mt-4 pt-3 sm:pt-4 border-t border-gray-200 dark:border-gray-700">
                    <h4 className="font-medium text-gray-900 dark:text-white mb-3">💸 Expense Breakdown</h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span>Credit:</span>
                        <span>{formatCurrency(totals.credit)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Inventory:</span>
                        <span>{formatCurrency(totals.inventory)}</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
          </div>
        </div>
        </div>
      </div>
    </ProtectedRoute>
  )
}

// Export the content directly as a client component
// No Suspense needed since 'use client' is at the top
export default DailyClosingContent

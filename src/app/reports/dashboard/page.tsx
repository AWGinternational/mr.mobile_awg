'use client'

import React, { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/use-auth'
import { useNotify } from '@/hooks/use-notifications'
import { ProtectedRoute } from '@/components/auth/protected-route'
import { UserRole } from '@/types'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { BusinessSidebar } from '@/components/layout/BusinessSidebar'
import { TopNavigation } from '@/components/layout/TopNavigation'
import {
  BarChart3,
  ArrowLeft,
  Download,
  Calendar,
  DollarSign,
  ShoppingCart,
  Package,
  Smartphone,
  CreditCard,
  TrendingUp,
  TrendingDown,
  FileText,
  Loader2,
  RefreshCw,
  Receipt,
  Truck,
  Boxes,
  Banknote,
  ChevronLeft,
  ChevronRight,
  Printer
} from 'lucide-react'

// Service type labels
const SERVICE_TYPE_LABELS: Record<string, string> = {
  EASYPAISA_CASHIN: 'EasyPaisa Cash In',
  EASYPAISA_CASHOUT: 'EasyPaisa Cash Out',
  JAZZCASH_CASHIN: 'JazzCash Cash In',
  JAZZCASH_CASHOUT: 'JazzCash Cash Out',
  BANK_TRANSFER: 'Bank Transfer',
  MOBILE_LOAD: 'Mobile Load',
  BILL_PAYMENT: 'Bill Payment',
}

// Payment method labels
const PAYMENT_METHOD_LABELS: Record<string, string> = {
  CASH: 'Cash',
  CARD: 'Card',
  EASYPAISA: 'EasyPaisa',
  JAZZCASH: 'JazzCash',
  BANK_TRANSFER: 'Bank Transfer',
}

export default function ComprehensiveReportsPage() {
  const router = useRouter()
  const { user: currentUser } = useAuth()
  const { success, error: showError } = useNotify()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [loading, setLoading] = useState(true)
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0])
  const [reportData, setReportData] = useState<any>(null)
  const [activeTab, setActiveTab] = useState('summary')
  const printRef = useRef<HTMLDivElement>(null)

  // Fetch report data
  const fetchReportData = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/reports/comprehensive?date=${selectedDate}&type=all`)
      const data = await response.json()
      
      if (data.success) {
        setReportData(data.data)
      } else {
        showError(data.error || 'Failed to fetch report data')
      }
    } catch (error) {
      console.error('Error fetching report:', error)
      showError('Failed to fetch report data')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchReportData()
  }, [selectedDate])

  const handleBack = () => {
    if (currentUser?.role === UserRole.SUPER_ADMIN) router.push('/dashboard/admin')
    else if (currentUser?.role === UserRole.SHOP_OWNER) router.push('/dashboard/owner')
    else router.push('/dashboard/worker')
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-PK', { style: 'currency', currency: 'PKR', minimumFractionDigits: 0 }).format(amount || 0)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-PK', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString('en-PK', {
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const formatDateTime = (dateString: string) => {
    return `${formatDate(dateString)} ${formatTime(dateString)}`
  }

  // Navigate to previous/next day
  const navigateDate = (days: number) => {
    const current = new Date(selectedDate)
    current.setDate(current.getDate() + days)
    setSelectedDate(current.toISOString().split('T')[0])
  }

  // Export Sales Report to CSV
  const exportSalesReport = () => {
    const transactions = reportData?.sales?.transactions || []
    if (transactions.length === 0) {
      showError('No sales data to export')
      return
    }

    const headers = ['Invoice #', 'Customer', 'Phone', 'Amount', 'Tax', 'Discount', 'Payment Method', 'Status', 'Date', 'Sold By', 'Items']
    const rows = transactions.map((sale: any) => {
      const itemsList = sale.items?.map((i: any) => `${i.productName} x${i.quantity}`).join('; ') || ''
      return [
        sale.invoiceNumber,
        sale.customerName || 'Walk-in',
        sale.customerPhone || '',
        sale.totalAmount,
        sale.taxAmount,
        sale.discountAmount,
        PAYMENT_METHOD_LABELS[sale.paymentMethod] || sale.paymentMethod,
        sale.status,
        formatDate(sale.saleDate),
        sale.createdBy || 'Unknown',
        `"${itemsList}"`
      ].join(',')
    })

    downloadCSV(headers, rows, 'sales_report')
  }

  // Export Purchases Report to CSV
  const exportPurchasesReport = () => {
    const transactions = reportData?.purchases?.transactions || []
    if (transactions.length === 0) {
      showError('No purchases data to export')
      return
    }

    const headers = ['Invoice #', 'Supplier', 'Phone', 'Total Amount', 'Paid', 'Due', 'Status', 'Purchase Date', 'Received Date', 'Items Count']
    const rows = transactions.map((purchase: any) => {
      return [
        purchase.invoiceNumber,
        purchase.supplierName || 'Unknown',
        purchase.supplierPhone || '',
        purchase.totalAmount,
        purchase.paidAmount,
        purchase.dueAmount,
        purchase.status,
        formatDate(purchase.purchaseDate),
        purchase.receivedDate ? formatDate(purchase.receivedDate) : 'Not Received',
        purchase.itemsCount || 0
      ].join(',')
    })

    downloadCSV(headers, rows, 'purchases_report')
  }

  // Export Inventory Report to CSV
  const exportInventoryReport = () => {
    const items = reportData?.inventory?.items || []
    if (items.length === 0) {
      showError('No inventory data to export')
      return
    }

    const headers = ['Product Name', 'SKU', 'IMEI', 'Serial Number', 'Status', 'Cost Price', 'Supplier', 'Purchase Date', 'Added On']
    const rows = items.map((item: any) => {
      return [
        `"${item.productName || 'Unknown'}"`,
        item.sku || 'N/A',
        item.imei || '',
        item.serialNumber || '',
        item.status,
        item.costPrice,
        item.supplierName || '',
        formatDate(item.purchaseDate),
        formatDate(item.createdAt)
      ].join(',')
    })

    downloadCSV(headers, rows, 'inventory_report')
  }

  // Export Mobile Services Report to CSV
  const exportMobileServicesReport = () => {
    const transactions = reportData?.mobileServices?.transactions || []
    if (transactions.length === 0) {
      showError('No mobile services data to export')
      return
    }

    const headers = ['Service Type', 'Provider', 'Customer', 'Phone', 'Amount', 'Commission Rate', 'Commission', 'Discount', 'Net Commission', 'Reference ID', 'Status', 'Date', 'Created By']
    const rows = transactions.map((service: any) => {
      return [
        SERVICE_TYPE_LABELS[service.serviceType] || service.serviceType,
        service.loadProvider || '',
        service.customerName || '',
        service.phoneNumber || '',
        service.amount,
        `${service.commissionRate}%`,
        service.commission,
        service.discount,
        service.netCommission,
        service.referenceId || '',
        service.status,
        formatDate(service.transactionDate),
        service.createdBy || 'Unknown'
      ].join(',')
    })

    downloadCSV(headers, rows, 'mobile_services_report')
  }

  // Export Payments Report to CSV
  const exportPaymentsReport = () => {
    const transactions = reportData?.payments?.transactions || []
    if (transactions.length === 0) {
      showError('No payments data to export')
      return
    }

    const headers = ['Invoice #', 'Customer', 'Amount', 'Payment Method', 'Status', 'Transaction ID', 'Reference', 'Payment Date']
    const rows = transactions.map((payment: any) => {
      return [
        payment.invoiceNumber || '',
        payment.customerName || 'Walk-in',
        payment.amount,
        PAYMENT_METHOD_LABELS[payment.method] || payment.method,
        payment.status,
        payment.transactionId || '',
        payment.reference || '',
        formatDate(payment.paymentDate)
      ].join(',')
    })

    downloadCSV(headers, rows, 'payments_report')
  }

  // Export Daily Closing Report to CSV
  const exportDailyClosingReport = () => {
    const closing = reportData?.dailyClosing
    if (!closing) {
      showError('No daily closing data to export')
      return
    }

    const headers = ['Category', 'Amount']
    const rows = [
      ['Date', formatDate(closing.date)],
      ['Status', closing.status],
      ['--- SALES ---', ''],
      ['Cash Sales', closing.cashSales],
      ['Card Sales', closing.cardSales],
      ['Bank Transfer Sales', closing.bankTransferSales],
      ['--- LOAD SALES ---', ''],
      ['Jazz Load', closing.jazzLoadSales],
      ['Telenor Load', closing.telenorLoadSales],
      ['Zong Load', closing.zongLoadSales],
      ['Ufone Load', closing.ufoneLoadSales],
      ['--- MOBILE PAYMENTS ---', ''],
      ['EasyPaisa Sales', closing.easypaisaSales],
      ['JazzCash Sales', closing.jazzcashSales],
      ['--- TOTALS ---', ''],
      ['Total Income', closing.totalIncome],
      ['Total Expenses', closing.totalExpenses],
      ['Net Amount', closing.netAmount],
      ['Total Sales', closing.totalSales],
      ['Opening Cash', closing.openingCash],
      ['Closing Cash', closing.closingCash],
    ].map(row => row.join(','))

    downloadCSV(headers, rows, 'daily_closing_report')
  }

  // Export Summary Report to CSV
  const exportSummaryReport = () => {
    const summary = reportData?.summary
    if (!summary) {
      showError('No summary data to export')
      return
    }

    const headers = ['Metric', 'Value']
    const rows = [
      ['Report Date', selectedDate],
      ['Total Revenue', summary.totalRevenue],
      ['Total Expenses', summary.totalExpenses],
      ['Net Profit', summary.netProfit],
      ['Total Commissions', summary.totalCommissions],
      ['Inventory Items Added', summary.inventoryItemsAdded],
      ['Sales Count', summary.salesCount],
      ['Purchases Count', summary.purchasesCount],
      ['Mobile Services Count', summary.mobileServicesCount],
    ].map(row => row.join(','))

    downloadCSV(headers, rows, 'summary_report')
  }

  // Generic CSV download helper
  const downloadCSV = (headers: string[], rows: string[], filename: string) => {
    const csvContent = [headers.join(','), ...rows].join('\n')
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    link.href = URL.createObjectURL(blob)
    link.download = `${filename}_${selectedDate}.csv`
    link.click()
    success('Report exported successfully!')
  }

  // Print report
  const handlePrint = () => {
    window.print()
  }

  return (
    <ProtectedRoute allowedRoles={[UserRole.SUPER_ADMIN, UserRole.SHOP_OWNER, UserRole.SHOP_WORKER]}>
      <div className="flex min-h-screen">
        <BusinessSidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
        <div className={`flex-1 min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 dark:from-gray-900 dark:via-gray-900 dark:to-gray-900 ${sidebarOpen ? 'lg:ml-20' : 'lg:ml-64'} transition-all duration-300`}>
          <TopNavigation onMenuClick={() => setSidebarOpen(!sidebarOpen)} />
          
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-700 text-white print:hidden">
            <div className="px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
                <div className="flex items-center gap-3 sm:gap-4">
                  <button onClick={handleBack} className="p-2 sm:p-3 bg-white/10 hover:bg-white/20 rounded-xl transition-all duration-200 flex-shrink-0">
                    <ArrowLeft className="h-5 w-5 text-white" />
                  </button>
                  <div>
                    <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold mb-1 flex items-center gap-2">
                      <BarChart3 className="h-7 w-7 sm:h-8 sm:w-8" />
                      <span>Daily Reports</span>
                    </h1>
                    <p className="text-blue-100 text-sm sm:text-base">Comprehensive daily business analytics</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 sm:gap-3">
                  <Button onClick={handlePrint} variant="ghost" className="bg-white/10 hover:bg-white/20 text-white">
                    <Printer className="h-4 w-4 sm:mr-2" />
                    <span className="hidden sm:inline">Print</span>
                  </Button>
                  <Button onClick={exportSummaryReport} variant="ghost" className="bg-white/10 hover:bg-white/20 text-white">
                    <Download className="h-4 w-4 sm:mr-2" />
                    <span className="hidden sm:inline">Export</span>
                  </Button>
                </div>
              </div>
            </div>
          </div>

          {/* Date Navigation */}
          <div className="px-4 sm:px-6 lg:px-8 py-4 bg-white dark:bg-gray-800 border-b dark:border-gray-700 print:hidden">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-2 sm:gap-4">
                <Button variant="outline" size="sm" onClick={() => navigateDate(-1)}>
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <div className="flex items-center gap-2">
                  <Calendar className="h-5 w-5 text-gray-500" />
                  <Input
                    type="date"
                    value={selectedDate}
                    onChange={(e) => setSelectedDate(e.target.value)}
                    className="w-40 sm:w-48"
                  />
                </div>
                <Button variant="outline" size="sm" onClick={() => navigateDate(1)}>
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" onClick={() => setSelectedDate(new Date().toISOString().split('T')[0])}>
                  Today
                </Button>
                <Button variant="outline" size="sm" onClick={fetchReportData}>
                  <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                  Refresh
                </Button>
              </div>
            </div>
          </div>

          {/* Print Header */}
          <div className="hidden print:block p-4 border-b">
            <h1 className="text-2xl font-bold">Daily Business Report</h1>
            <p className="text-gray-600">Date: {formatDate(selectedDate)}</p>
          </div>

          {/* Main Content */}
          <div ref={printRef} className="px-4 sm:px-6 lg:px-8 py-4 sm:py-6 space-y-4 sm:space-y-6">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
                <span className="ml-2 text-gray-600 dark:text-gray-400">Loading report data...</span>
              </div>
            ) : (
              <>
                {/* Summary Cards */}
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
                  <Card className="bg-gradient-to-br from-green-500 to-green-600 text-white">
                    <CardContent className="p-4">
                      <DollarSign className="h-6 w-6 mb-2 opacity-80" />
                      <p className="text-green-100 text-xs sm:text-sm">Revenue</p>
                      <p className="text-lg sm:text-xl font-bold truncate">{formatCurrency(reportData?.summary?.totalRevenue || 0)}</p>
                    </CardContent>
                  </Card>
                  <Card className="bg-gradient-to-br from-blue-500 to-blue-600 text-white">
                    <CardContent className="p-4">
                      <ShoppingCart className="h-6 w-6 mb-2 opacity-80" />
                      <p className="text-blue-100 text-xs sm:text-sm">Sales</p>
                      <p className="text-lg sm:text-xl font-bold">{reportData?.summary?.salesCount || 0}</p>
                    </CardContent>
                  </Card>
                  <Card className="bg-gradient-to-br from-orange-500 to-orange-600 text-white">
                    <CardContent className="p-4">
                      <Truck className="h-6 w-6 mb-2 opacity-80" />
                      <p className="text-orange-100 text-xs sm:text-sm">Purchases</p>
                      <p className="text-lg sm:text-xl font-bold">{reportData?.summary?.purchasesCount || 0}</p>
                    </CardContent>
                  </Card>
                  <Card className="bg-gradient-to-br from-purple-500 to-purple-600 text-white">
                    <CardContent className="p-4">
                      <Smartphone className="h-6 w-6 mb-2 opacity-80" />
                      <p className="text-purple-100 text-xs sm:text-sm">Mobile Services</p>
                      <p className="text-lg sm:text-xl font-bold">{reportData?.summary?.mobileServicesCount || 0}</p>
                    </CardContent>
                  </Card>
                  <Card className="bg-gradient-to-br from-indigo-500 to-indigo-600 text-white">
                    <CardContent className="p-4">
                      <Banknote className="h-6 w-6 mb-2 opacity-80" />
                      <p className="text-indigo-100 text-xs sm:text-sm">Commission</p>
                      <p className="text-lg sm:text-xl font-bold truncate">{formatCurrency(reportData?.summary?.totalCommissions || 0)}</p>
                    </CardContent>
                  </Card>
                  <Card className={`bg-gradient-to-br ${(reportData?.summary?.netProfit || 0) >= 0 ? 'from-emerald-500 to-emerald-600' : 'from-red-500 to-red-600'} text-white`}>
                    <CardContent className="p-4">
                      {(reportData?.summary?.netProfit || 0) >= 0 ? (
                        <TrendingUp className="h-6 w-6 mb-2 opacity-80" />
                      ) : (
                        <TrendingDown className="h-6 w-6 mb-2 opacity-80" />
                      )}
                      <p className="text-white/80 text-xs sm:text-sm">Net Profit</p>
                      <p className="text-lg sm:text-xl font-bold truncate">{formatCurrency(reportData?.summary?.netProfit || 0)}</p>
                    </CardContent>
                  </Card>
                </div>

                {/* Tabs */}
                <Tabs value={activeTab} onValueChange={setActiveTab} className="print:hidden">
                  <TabsList className="grid w-full grid-cols-3 lg:grid-cols-6 h-auto">
                    <TabsTrigger value="summary" className="text-xs sm:text-sm py-2">
                      <BarChart3 className="h-4 w-4 mr-1 sm:mr-2" />
                      <span className="hidden sm:inline">Summary</span>
                    </TabsTrigger>
                    <TabsTrigger value="sales" className="text-xs sm:text-sm py-2">
                      <Receipt className="h-4 w-4 mr-1 sm:mr-2" />
                      <span className="hidden sm:inline">Sales</span>
                    </TabsTrigger>
                    <TabsTrigger value="purchases" className="text-xs sm:text-sm py-2">
                      <Truck className="h-4 w-4 mr-1 sm:mr-2" />
                      <span className="hidden sm:inline">Purchases</span>
                    </TabsTrigger>
                    <TabsTrigger value="inventory" className="text-xs sm:text-sm py-2">
                      <Boxes className="h-4 w-4 mr-1 sm:mr-2" />
                      <span className="hidden sm:inline">Inventory</span>
                    </TabsTrigger>
                    <TabsTrigger value="mobile" className="text-xs sm:text-sm py-2">
                      <Smartphone className="h-4 w-4 mr-1 sm:mr-2" />
                      <span className="hidden sm:inline">Mobile</span>
                    </TabsTrigger>
                    <TabsTrigger value="payments" className="text-xs sm:text-sm py-2">
                      <CreditCard className="h-4 w-4 mr-1 sm:mr-2" />
                      <span className="hidden sm:inline">Payments</span>
                    </TabsTrigger>
                  </TabsList>

                  {/* Summary Tab */}
                  <TabsContent value="summary" className="space-y-4 mt-4">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                      {/* Sales by Payment Method */}
                      <Card>
                        <CardHeader>
                          <CardTitle className="text-base sm:text-lg flex items-center gap-2">
                            <CreditCard className="h-5 w-5" />
                            Sales by Payment Method
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          {Object.entries(reportData?.sales?.metrics?.byPaymentMethod || {}).length === 0 ? (
                            <p className="text-gray-500 text-center py-4">No sales today</p>
                          ) : (
                            <div className="space-y-3">
                              {Object.entries(reportData?.sales?.metrics?.byPaymentMethod || {}).map(([method, data]: [string, any]) => (
                                <div key={method} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                                  <div className="flex items-center gap-2">
                                    <Badge variant="outline">{PAYMENT_METHOD_LABELS[method] || method}</Badge>
                                    <span className="text-sm text-gray-500">{data.count} sales</span>
                                  </div>
                                  <span className="font-semibold">{formatCurrency(data.amount)}</span>
                                </div>
                              ))}
                            </div>
                          )}
                        </CardContent>
                      </Card>

                      {/* Mobile Services by Type */}
                      <Card>
                        <CardHeader>
                          <CardTitle className="text-base sm:text-lg flex items-center gap-2">
                            <Smartphone className="h-5 w-5" />
                            Mobile Services by Type
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          {Object.entries(reportData?.mobileServices?.metrics?.byServiceType || {}).length === 0 ? (
                            <p className="text-gray-500 text-center py-4">No mobile services today</p>
                          ) : (
                            <div className="space-y-3">
                              {Object.entries(reportData?.mobileServices?.metrics?.byServiceType || {}).map(([type, data]: [string, any]) => (
                                <div key={type} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                                  <div className="flex items-center gap-2">
                                    <Badge variant="outline" className="text-xs">{SERVICE_TYPE_LABELS[type] || type}</Badge>
                                    <span className="text-sm text-gray-500">{data.count}</span>
                                  </div>
                                  <div className="text-right">
                                    <p className="font-semibold">{formatCurrency(data.amount)}</p>
                                    <p className="text-xs text-green-600">+{formatCurrency(data.commission)}</p>
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </CardContent>
                      </Card>

                      {/* Purchases by Supplier */}
                      <Card>
                        <CardHeader>
                          <CardTitle className="text-base sm:text-lg flex items-center gap-2">
                            <Truck className="h-5 w-5" />
                            Purchases by Supplier
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          {Object.entries(reportData?.purchases?.metrics?.bySupplier || {}).length === 0 ? (
                            <p className="text-gray-500 text-center py-4">No purchases today</p>
                          ) : (
                            <div className="space-y-3">
                              {Object.entries(reportData?.purchases?.metrics?.bySupplier || {}).map(([supplier, data]: [string, any]) => (
                                <div key={supplier} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                                  <div>
                                    <p className="font-medium">{supplier}</p>
                                    <p className="text-sm text-gray-500">{data.count} orders</p>
                                  </div>
                                  <span className="font-semibold text-orange-600">{formatCurrency(data.amount)}</span>
                                </div>
                              ))}
                            </div>
                          )}
                        </CardContent>
                      </Card>

                      {/* Inventory Movements */}
                      <Card>
                        <CardHeader>
                          <CardTitle className="text-base sm:text-lg flex items-center gap-2">
                            <Boxes className="h-5 w-5" />
                            Inventory Summary
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="grid grid-cols-2 gap-4">
                            <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg text-center">
                              <TrendingUp className="h-6 w-6 text-green-600 mx-auto mb-2" />
                              <p className="text-2xl font-bold text-green-600">{reportData?.inventory?.metrics?.totalIn || 0}</p>
                              <p className="text-sm text-gray-600 dark:text-gray-400">Stock In</p>
                            </div>
                            <div className="p-4 bg-red-50 dark:bg-red-900/20 rounded-lg text-center">
                              <TrendingDown className="h-6 w-6 text-red-600 mx-auto mb-2" />
                              <p className="text-2xl font-bold text-red-600">{reportData?.inventory?.metrics?.totalOut || 0}</p>
                              <p className="text-sm text-gray-600 dark:text-gray-400">Stock Out</p>
                            </div>
                          </div>
                          <p className="text-center text-sm text-gray-500 mt-4">
                            Total {reportData?.inventory?.metrics?.totalMovements || 0} movements today
                          </p>
                        </CardContent>
                      </Card>
                    </div>
                  </TabsContent>

                  {/* Sales Tab */}
                  <TabsContent value="sales" className="space-y-4 mt-4">
                    <Card>
                      <CardHeader className="flex flex-row items-center justify-between">
                        <CardTitle className="text-base sm:text-lg">Sales Transactions</CardTitle>
                        <Button size="sm" variant="outline" onClick={exportSalesReport}>
                          <Download className="h-4 w-4 mr-2" />
                          Export
                        </Button>
                      </CardHeader>
                      <CardContent>
                        {(reportData?.sales?.transactions || []).length === 0 ? (
                          <p className="text-gray-500 text-center py-8">No sales transactions for this date</p>
                        ) : (
                          <div className="space-y-3">
                            {reportData?.sales?.transactions?.map((sale: any) => (
                              <div key={sale.id} className="border dark:border-gray-700 rounded-lg p-4 hover:shadow-md transition-shadow">
                                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                                  <div>
                                    <div className="flex items-center gap-2 flex-wrap">
                                      <span className="font-semibold">{sale.invoiceNumber}</span>
                                      <Badge className={sale.status === 'COMPLETED' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}>
                                        {sale.status}
                                      </Badge>
                                    </div>
                                    <p className="text-sm text-gray-600 dark:text-gray-400">{sale.customerName}</p>
                                    <p className="text-xs text-gray-500">{sale.itemsCount} items • {formatTime(sale.saleDate)}</p>
                                  </div>
                                  <div className="text-right">
                                    <p className="text-lg font-bold">{formatCurrency(sale.totalAmount)}</p>
                                    <Badge variant="outline">{PAYMENT_METHOD_LABELS[sale.paymentMethod] || sale.paymentMethod}</Badge>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  </TabsContent>

                  {/* Purchases Tab */}
                  <TabsContent value="purchases" className="space-y-4 mt-4">
                    <Card>
                      <CardHeader className="flex flex-row items-center justify-between">
                        <CardTitle className="text-base sm:text-lg">Purchase Orders</CardTitle>
                        <Button size="sm" variant="outline" onClick={exportPurchasesReport}>
                          <Download className="h-4 w-4 mr-2" />
                          Export
                        </Button>
                      </CardHeader>
                      <CardContent>
                        {(reportData?.purchases?.transactions || []).length === 0 ? (
                          <p className="text-gray-500 text-center py-8">No purchase orders for this date</p>
                        ) : (
                          <div className="space-y-3">
                            {reportData?.purchases?.transactions?.map((purchase: any) => (
                              <div key={purchase.id} className="border dark:border-gray-700 rounded-lg p-4 hover:shadow-md transition-shadow">
                                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                                  <div>
                                    <div className="flex items-center gap-2 flex-wrap">
                                      <span className="font-semibold">{purchase.invoiceNumber}</span>
                                      <Badge className={purchase.status === 'RECEIVED' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}>
                                        {purchase.status}
                                      </Badge>
                                    </div>
                                    <p className="text-sm text-gray-600 dark:text-gray-400">{purchase.supplierName}</p>
                                    <p className="text-xs text-gray-500">{purchase.itemsCount} items</p>
                                  </div>
                                  <div className="text-right">
                                    <p className="text-lg font-bold">{formatCurrency(purchase.totalAmount)}</p>
                                    {purchase.dueAmount > 0 && (
                                      <p className="text-sm text-red-600">Due: {formatCurrency(purchase.dueAmount)}</p>
                                    )}
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  </TabsContent>

                  {/* Inventory Tab */}
                  <TabsContent value="inventory" className="space-y-4 mt-4">
                    <Card>
                      <CardHeader className="flex flex-row items-center justify-between">
                        <CardTitle className="text-base sm:text-lg">Inventory Movements</CardTitle>
                        <Button size="sm" variant="outline" onClick={exportInventoryReport}>
                          <Download className="h-4 w-4 mr-2" />
                          Export
                        </Button>
                      </CardHeader>
                      <CardContent>
                        {(reportData?.inventory?.movements || []).length === 0 ? (
                          <p className="text-gray-500 text-center py-8">No inventory movements for this date</p>
                        ) : (
                          <div className="space-y-3">
                            {reportData?.inventory?.movements?.map((movement: any) => (
                              <div key={movement.id} className="border dark:border-gray-700 rounded-lg p-4 hover:shadow-md transition-shadow">
                                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                                  <div>
                                    <p className="font-semibold">{movement.productName}</p>
                                    <p className="text-sm text-gray-600 dark:text-gray-400">SKU: {movement.sku}</p>
                                    <p className="text-xs text-gray-500">{movement.reason || movement.type} • {formatTime(movement.createdAt)}</p>
                                  </div>
                                  <div className="text-right">
                                    <p className={`text-lg font-bold ${movement.quantity > 0 ? 'text-green-600' : 'text-red-600'}`}>
                                      {movement.quantity > 0 ? '+' : ''}{movement.quantity}
                                    </p>
                                    <Badge variant="outline">{movement.type}</Badge>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  </TabsContent>

                  {/* Mobile Services Tab */}
                  <TabsContent value="mobile" className="space-y-4 mt-4">
                    <Card>
                      <CardHeader className="flex flex-row items-center justify-between">
                        <CardTitle className="text-base sm:text-lg">Mobile Service Transactions</CardTitle>
                        <Button size="sm" variant="outline" onClick={exportMobileServicesReport}>
                          <Download className="h-4 w-4 mr-2" />
                          Export
                        </Button>
                      </CardHeader>
                      <CardContent>
                        {(reportData?.mobileServices?.transactions || []).length === 0 ? (
                          <p className="text-gray-500 text-center py-8">No mobile service transactions for this date</p>
                        ) : (
                          <div className="space-y-3">
                            {reportData?.mobileServices?.transactions?.map((service: any) => (
                              <div key={service.id} className="border dark:border-gray-700 rounded-lg p-4 hover:shadow-md transition-shadow">
                                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                                  <div>
                                    <div className="flex items-center gap-2 flex-wrap">
                                      <Badge>{SERVICE_TYPE_LABELS[service.serviceType] || service.serviceType}</Badge>
                                      <Badge className={service.status === 'COMPLETED' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}>
                                        {service.status}
                                      </Badge>
                                    </div>
                                    <p className="text-sm text-gray-600 dark:text-gray-400">{service.customerPhone}</p>
                                    <p className="text-xs text-gray-500">{formatTime(service.createdAt)}</p>
                                  </div>
                                  <div className="text-right">
                                    <p className="text-lg font-bold">{formatCurrency(service.amount)}</p>
                                    <p className="text-sm text-green-600">+{formatCurrency(service.netCommission)} commission</p>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  </TabsContent>

                  {/* Payments Tab */}
                  <TabsContent value="payments" className="space-y-4 mt-4">
                    <Card>
                      <CardHeader className="flex flex-row items-center justify-between">
                        <CardTitle className="text-base sm:text-lg">Payment Transactions</CardTitle>
                        <Button size="sm" variant="outline" onClick={exportPaymentsReport}>
                          <Download className="h-4 w-4 mr-2" />
                          Export
                        </Button>
                      </CardHeader>
                      <CardContent>
                        {(reportData?.payments?.transactions || []).length === 0 ? (
                          <p className="text-gray-500 text-center py-8">No payment transactions for this date</p>
                        ) : (
                          <div className="space-y-3">
                            {reportData?.payments?.transactions?.map((payment: any) => (
                              <div key={payment.id} className="border dark:border-gray-700 rounded-lg p-4 hover:shadow-md transition-shadow">
                                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                                  <div>
                                    <div className="flex items-center gap-2 flex-wrap">
                                      <span className="font-semibold">{payment.invoiceNumber || 'N/A'}</span>
                                      <Badge className={payment.status === 'COMPLETED' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}>
                                        {payment.status}
                                      </Badge>
                                    </div>
                                    <p className="text-sm text-gray-600 dark:text-gray-400">{payment.customerName}</p>
                                    <p className="text-xs text-gray-500">{formatTime(payment.paymentDate)}</p>
                                  </div>
                                  <div className="text-right">
                                    <p className="text-lg font-bold">{formatCurrency(payment.amount)}</p>
                                    <Badge variant="outline">{PAYMENT_METHOD_LABELS[payment.method] || payment.method}</Badge>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  </TabsContent>
                </Tabs>

                {/* Print-only sections */}
                <div className="hidden print:block space-y-6">
                  <div className="border-t pt-4">
                    <h2 className="text-lg font-bold mb-4">Sales Transactions</h2>
                    {(reportData?.sales?.transactions || []).length === 0 ? (
                      <p>No sales transactions</p>
                    ) : (
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b">
                            <th className="text-left py-2">Invoice</th>
                            <th className="text-left py-2">Customer</th>
                            <th className="text-left py-2">Method</th>
                            <th className="text-right py-2">Amount</th>
                          </tr>
                        </thead>
                        <tbody>
                          {reportData?.sales?.transactions?.map((sale: any) => (
                            <tr key={sale.id} className="border-b">
                              <td className="py-2">{sale.invoiceNumber}</td>
                              <td className="py-2">{sale.customerName}</td>
                              <td className="py-2">{sale.paymentMethod}</td>
                              <td className="py-2 text-right">{formatCurrency(sale.totalAmount)}</td>
                            </tr>
                          ))}
                        </tbody>
                        <tfoot>
                          <tr className="font-bold">
                            <td colSpan={3} className="py-2">Total</td>
                            <td className="py-2 text-right">{formatCurrency(reportData?.sales?.metrics?.totalRevenue || 0)}</td>
                          </tr>
                        </tfoot>
                      </table>
                    )}
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Print styles */}
      <style jsx global>{`
        @media print {
          .print\\:hidden {
            display: none !important;
          }
          .print\\:block {
            display: block !important;
          }
          body {
            print-color-adjust: exact;
            -webkit-print-color-adjust: exact;
          }
        }
      `}</style>
    </ProtectedRoute>
  )
}

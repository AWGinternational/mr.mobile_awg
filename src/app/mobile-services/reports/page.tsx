'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { BusinessSidebar } from '@/components/layout/BusinessSidebar';
import { TopNavigation } from '@/components/layout/TopNavigation';
import { Calendar, TrendingUp, DollarSign, Percent, BarChart3 } from 'lucide-react';
import { format, startOfMonth, endOfMonth } from 'date-fns';

const SERVICE_TYPE_LABELS: Record<string, string> = {
  EASYPAISA_CASHIN: 'EasyPaisa Cash In',
  EASYPAISA_CASHOUT: 'EasyPaisa Cash Out',
  JAZZCASH_CASHIN: 'JazzCash Cash In',
  JAZZCASH_CASHOUT: 'JazzCash Cash Out',
  BANK_TRANSFER: 'Bank Transfer',
  MOBILE_LOAD: 'Mobile Load',
  BILL_PAYMENT: 'Bill Payment',
};

export default function MobileServicesReportsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [startDate, setStartDate] = useState(format(startOfMonth(new Date()), 'yyyy-MM-dd'));
  const [endDate, setEndDate] = useState(format(endOfMonth(new Date()), 'yyyy-MM-dd'));
  const [reportData, setReportData] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const fetchReport = async () => {
    if (!session) {
      setError('Please log in to view reports');
      return;
    }

    setLoading(true);
    setError(null);
    setSuccessMessage(null);
    
    try {
      const params = new URLSearchParams({
        startDate,
        endDate,
      });

      console.log('Fetching report with params:', { startDate, endDate });
      const response = await fetch(`/api/mobile-services?${params}`);
      const data = await response.json();
      console.log('Report response:', { ok: response.ok, data });

      if (response.ok && data.transactions) {
        // Process data for report
        const transactions = data.transactions || [];

        // Group by service type
        const byServiceType: Record<string, any> = {};
        transactions.forEach((t: any) => {
          if (!byServiceType[t.serviceType]) {
            byServiceType[t.serviceType] = {
              count: 0,
              totalAmount: 0,
              totalCommission: 0,
              totalDiscount: 0,
              netCommission: 0,
            };
          }
          byServiceType[t.serviceType].count += 1;
          byServiceType[t.serviceType].totalAmount += parseFloat(t.amount);
          byServiceType[t.serviceType].totalCommission += parseFloat(t.commission);
          byServiceType[t.serviceType].totalDiscount += parseFloat(t.discount);
          byServiceType[t.serviceType].netCommission += parseFloat(t.netCommission);
        });

        // Calculate overall totals
        const totals = {
          count: transactions.length,
          totalAmount: 0,
          totalCommission: 0,
          totalDiscount: 0,
          netCommission: 0,
        };

        transactions.forEach((t: any) => {
          totals.totalAmount += parseFloat(t.amount);
          totals.totalCommission += parseFloat(t.commission);
          totals.totalDiscount += parseFloat(t.discount);
          totals.netCommission += parseFloat(t.netCommission);
        });

        setReportData({
          byServiceType,
          totals,
          transactions,
        });
        
        setSuccessMessage(`Report generated successfully! Found ${transactions.length} transactions.`);
        
        console.log('Report generated successfully:', { 
          transactionCount: transactions.length,
          totalAmount: totals.totalAmount 
        });
        
        // Clear success message after 3 seconds
        setTimeout(() => setSuccessMessage(null), 3000);
      } else {
        // Handle error or empty data
        const errorMessage = data.error || 'Failed to fetch data';
        console.error('Error:', errorMessage);
        setError(errorMessage);
        setReportData({
          byServiceType: {},
          totals: {
            count: 0,
            totalAmount: 0,
            totalCommission: 0,
            totalDiscount: 0,
            netCommission: 0,
          },
          transactions: [],
        });
      }
    } catch (error: any) {
      console.error('Error fetching report:', error);
      setError(error.message || 'Failed to fetch report. Please try again.');
      setReportData({
        byServiceType: {},
        totals: {
          count: 0,
          totalAmount: 0,
          totalCommission: 0,
          totalDiscount: 0,
          netCommission: 0,
        },
        transactions: [],
      });
    } finally {
      setLoading(false);
    }
  };

  // Redirect if not authenticated
  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    }
  }, [status, router]);

  // Don't auto-fetch on mount - let user click Generate Report button
  // This makes it clear where the report is and that they need to generate it

  const handleGenerateReport = () => {
    if (session) {
      fetchReport();
    }
  };

  return (
    <div className="flex min-h-screen">
      {/* Sidebar */}
      <BusinessSidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      
      {/* Main Content */}
      <div className={`flex-1 min-h-screen bg-gray-50 ${sidebarOpen ? 'lg:ml-20' : 'lg:ml-64'} transition-all duration-300`}>
        {/* Top Navigation */}
        <TopNavigation onMenuClick={() => setSidebarOpen(!sidebarOpen)} />

        {/* Page Content */}
        <div className="container mx-auto py-8 px-4">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Online Banking Reports</h1>
            <p className="text-gray-600">Commission earnings and transaction analytics</p>
          </div>

      {/* Date Range Selector */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Report Period
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="startDate">Start Date</Label>
              <Input
                id="startDate"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="endDate">End Date</Label>
              <Input
                id="endDate"
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </div>
            <div className="flex items-end">
              <Button 
                onClick={handleGenerateReport} 
                disabled={loading || status === 'loading'} 
                className="w-full"
              >
                {loading ? (
                  <span className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Generating...
                  </span>
                ) : (
                  'Generate Report'
                )}
              </Button>
            </div>
          </div>

          {/* Success Message */}
          {successMessage && (
            <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg">
              <p className="text-sm text-green-600 font-medium">✅ {successMessage}</p>
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-600 font-medium">❌ {error}</p>
            </div>
          )}

          {/* Loading State */}
          {loading && (
            <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-sm text-blue-600 font-medium">⏳ Loading report data...</p>
            </div>
          )}
        </CardContent>
      </Card>

      {reportData && !loading && (
        <>
          {/* Report Header */}
          <div className="mb-6 pt-4 border-t-2 border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">Report Results</h2>
                <p className="text-sm text-gray-600 mt-1">
                  From {format(new Date(startDate), 'MMM dd, yyyy')} to {format(new Date(endDate), 'MMM dd, yyyy')}
                </p>
              </div>
              <div className="text-right">
                <p className="text-sm text-gray-600">Generated</p>
                <p className="text-lg font-semibold text-gray-900">{format(new Date(), 'MMM dd, yyyy HH:mm')}</p>
              </div>
            </div>
          </div>

          {/* Overall Summary */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm font-medium text-blue-700">Total Transactions</p>
                  <TrendingUp className="h-5 w-5 text-blue-600" />
                </div>
                <p className="text-3xl font-bold text-blue-900">{reportData.totals.count}</p>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm font-medium text-green-700">Total Amount</p>
                  <DollarSign className="h-5 w-5 text-green-600" />
                </div>
                <p className="text-3xl font-bold text-green-900">
                  Rs {reportData.totals.totalAmount.toLocaleString('en-PK', { minimumFractionDigits: 2 })}
                </p>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm font-medium text-purple-700">Total Commission</p>
                  <Percent className="h-5 w-5 text-purple-600" />
                </div>
                <p className="text-3xl font-bold text-purple-900">
                  Rs {reportData.totals.totalCommission.toLocaleString('en-PK', { minimumFractionDigits: 2 })}
                </p>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-indigo-50 to-indigo-100 border-indigo-200">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm font-medium text-indigo-700">Net Earnings</p>
                  <DollarSign className="h-5 w-5 text-indigo-600" />
                </div>
                <p className="text-3xl font-bold text-indigo-900">
                  Rs {reportData.totals.netCommission.toLocaleString('en-PK', { minimumFractionDigits: 2 })}
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Breakdown by Service Type */}
          <Card>
            <CardHeader>
              <CardTitle>Breakdown by Service Type</CardTitle>
              <CardDescription>
                Commission earnings from {format(new Date(startDate), 'MMM dd, yyyy')} to{' '}
                {format(new Date(endDate), 'MMM dd, yyyy')}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {Object.entries(reportData.byServiceType).map(([serviceType, data]: [string, any]) => (
                  <Card key={serviceType} className="border-l-4 border-l-blue-500">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between mb-3">
                        <h3 className="font-semibold text-lg">{SERVICE_TYPE_LABELS[serviceType]}</h3>
                        <span className="text-sm text-gray-600">{data.count} transactions</span>
                      </div>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div>
                          <p className="text-sm text-gray-600">Total Amount</p>
                          <p className="text-lg font-semibold text-gray-900">
                            Rs {data.totalAmount.toLocaleString('en-PK', { minimumFractionDigits: 2 })}
                          </p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600">Commission</p>
                          <p className="text-lg font-semibold text-green-600">
                            Rs {data.totalCommission.toLocaleString('en-PK', { minimumFractionDigits: 2 })}
                          </p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600">Discount</p>
                          <p className="text-lg font-semibold text-orange-600">
                            Rs {data.totalDiscount.toLocaleString('en-PK', { minimumFractionDigits: 2 })}
                          </p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600">Net Commission</p>
                          <p className="text-lg font-semibold text-blue-600">
                            Rs {data.netCommission.toLocaleString('en-PK', { minimumFractionDigits: 2 })}
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}

                {Object.keys(reportData.byServiceType).length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    No transactions found for the selected period
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Average Commission Rate */}
          {reportData.totals.count > 0 && (
            <Card className="mt-6">
              <CardHeader>
                <CardTitle>Performance Metrics</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="text-center p-4 bg-gray-50 rounded-lg">
                    <p className="text-sm text-gray-600 mb-2">Average Transaction</p>
                    <p className="text-2xl font-bold text-gray-900">
                      Rs{' '}
                      {(reportData.totals.totalAmount / reportData.totals.count).toLocaleString('en-PK', {
                        minimumFractionDigits: 2,
                      })}
                    </p>
                  </div>
                  <div className="text-center p-4 bg-gray-50 rounded-lg">
                    <p className="text-sm text-gray-600 mb-2">Average Commission</p>
                    <p className="text-2xl font-bold text-green-600">
                      Rs{' '}
                      {(reportData.totals.totalCommission / reportData.totals.count).toLocaleString('en-PK', {
                        minimumFractionDigits: 2,
                      })}
                    </p>
                  </div>
                  <div className="text-center p-4 bg-gray-50 rounded-lg">
                    <p className="text-sm text-gray-600 mb-2">Commission Rate</p>
                    <p className="text-2xl font-bold text-blue-600">
                      {((reportData.totals.totalCommission / reportData.totals.totalAmount) * 100).toFixed(3)}%
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </>
      )}

      {/* No Report Yet Message */}
      {!reportData && !loading && (
        <Card className="mt-6">
          <CardContent className="p-12 text-center">
            <div className="max-w-md mx-auto">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <BarChart3 className="w-8 h-8 text-gray-400" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">No Report Generated Yet</h3>
              <p className="text-gray-600 mb-4">
                Select your date range above and click "Generate Report" to view your online banking transaction analytics.
              </p>
            </div>
          </CardContent>
        </Card>
      )}
        </div>
      </div>
    </div>
  );
}

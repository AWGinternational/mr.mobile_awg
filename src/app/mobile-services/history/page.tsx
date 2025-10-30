'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { BusinessSidebar } from '@/components/layout/BusinessSidebar';
import { TopNavigation } from '@/components/layout/TopNavigation';
import { Search, Calendar, Filter, Pencil, Trash2 } from 'lucide-react';
import { format } from 'date-fns';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { useToast } from '@/components/ui/use-toast';

const SERVICE_TYPE_LABELS: Record<string, string> = {
  EASYPAISA_CASHIN: 'EasyPaisa Cash In',
  EASYPAISA_CASHOUT: 'EasyPaisa Cash Out',
  JAZZCASH_CASHIN: 'JazzCash Cash In',
  JAZZCASH_CASHOUT: 'JazzCash Cash Out',
  BANK_TRANSFER: 'Bank Transfer',
  MOBILE_LOAD: 'Mobile Load',
  BILL_PAYMENT: 'Bill Payment',
};

const LOAD_PROVIDER_LABELS: Record<string, string> = {
  JAZZ: 'Jazz',
  TELENOR: 'Telenor',
  ZONG: 'Zong',
  UFONE: 'Ufone',
};

export default function TransactionHistoryPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0, totalPages: 0 });

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [serviceType, setServiceType] = useState('ALL');
  const [status, setStatus] = useState('ALL');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // Edit/Delete states
  const [editingTransaction, setEditingTransaction] = useState<any>(null);
  const [deleteTransaction, setDeleteTransaction] = useState<any>(null);
  const { toast } = useToast();

  const fetchTransactions = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: pagination.page.toString(),
        limit: pagination.limit.toString(),
      });

      if (searchQuery) params.append('search', searchQuery);
      if (serviceType && serviceType !== 'ALL') params.append('serviceType', serviceType);
      if (status && status !== 'ALL') params.append('status', status);
      if (startDate) params.append('startDate', startDate);
      if (endDate) params.append('endDate', endDate);

      const response = await fetch(`/api/mobile-services?${params}`);
      const data = await response.json();

      if (response.ok) {
        setTransactions(data.transactions);
        setPagination(data.pagination);
      }
    } catch (error) {
      console.error('Error fetching transactions:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTransactions();
  }, [pagination.page, searchQuery, serviceType, status, startDate, endDate]);

  const handleSearch = () => {
    setPagination((prev) => ({ ...prev, page: 1 }));
    fetchTransactions();
  };

  const handleReset = () => {
    setSearchQuery('');
    setServiceType('ALL');
    setStatus('ALL');
    setStartDate('');
    setEndDate('');
    setPagination((prev) => ({ ...prev, page: 1 }));
  };

  const handleEdit = (transaction: any) => {
    setEditingTransaction(transaction);
  };

  const handleDelete = async () => {
    if (!deleteTransaction) return;

    try {
      const response = await fetch(`/api/mobile-services/${deleteTransaction.id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        toast({
          title: '✅ Transaction Deleted',
          description: 'Transaction has been successfully deleted',
        });
        setDeleteTransaction(null);
        fetchTransactions();
      } else {
        const error = await response.json();
        toast({
          title: '❌ Delete Failed',
          description: error.message || 'Failed to delete transaction',
          variant: 'destructive',
        });
      }
    } catch (error) {
      toast({
        title: '❌ Error',
        description: 'An error occurred while deleting the transaction',
        variant: 'destructive',
      });
    }
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTransaction) return;

    try {
      const response = await fetch(`/api/mobile-services/${editingTransaction.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: parseFloat(editingTransaction.amount),
          discount: parseFloat(editingTransaction.discount) || 0,
          customerName: editingTransaction.customerName,
          phoneNumber: editingTransaction.phoneNumber,
          referenceId: editingTransaction.referenceId,
          status: editingTransaction.status,
          notes: editingTransaction.notes,
        }),
      });

      if (response.ok) {
        toast({
          title: '✅ Transaction Updated',
          description: 'Transaction has been successfully updated',
        });
        setEditingTransaction(null);
        fetchTransactions();
      } else {
        const error = await response.json();
        toast({
          title: '❌ Update Failed',
          description: error.message || 'Failed to update transaction',
          variant: 'destructive',
        });
      }
    } catch (error) {
      toast({
        title: '❌ Error',
        description: 'An error occurred while updating the transaction',
        variant: 'destructive',
      });
    }
  };

  // Calculate totals
  const totals = transactions.reduce(
    (acc, t) => ({
      amount: acc.amount + parseFloat(t.amount.toString()),
      commission: acc.commission + parseFloat(t.commission.toString()),
      discount: acc.discount + parseFloat(t.discount.toString()),
      netCommission: acc.netCommission + parseFloat(t.netCommission.toString()),
    }),
    { amount: 0, commission: 0, discount: 0, netCommission: 0 }
  );

  return (
    <div className="flex min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Sidebar */}
      <BusinessSidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      
      {/* Main Content */}
      <div className={`flex-1 flex flex-col min-h-screen transition-all duration-300 ${sidebarOpen ? 'lg:ml-20' : 'lg:ml-64'}`}>
        {/* Top Navigation */}
        <TopNavigation onMenuClick={() => setSidebarOpen(!sidebarOpen)} />

        <div className="flex-1 bg-gray-50 dark:bg-gray-900">
          {/* Header */}
          <div className="bg-gradient-to-r from-purple-600 to-indigo-700 text-white">
            <div className="px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div className="min-w-0 flex-1">
                  <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold mb-1 sm:mb-2 truncate">Transaction History</h1>
                  <p className="text-purple-100 text-sm sm:text-base lg:text-lg">View and filter all online banking transactions</p>
                </div>
              </div>
            </div>
          </div>

        {/* Page Content */}
        <div className="px-4 sm:px-6 lg:px-8 py-4 sm:py-6 lg:py-8">

      {/* Filters */}
      <Card className="mb-6 dark:bg-gray-800">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filters
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
            {/* Search */}
            <div className="space-y-2">
              <Label htmlFor="search">Search</Label>
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  id="search"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Customer, phone, reference..."
                  className="pl-9"
                />
              </div>
            </div>

            {/* Service Type */}
            <div className="space-y-2">
              <Label htmlFor="serviceType">Service Type</Label>
              <Select value={serviceType} onValueChange={setServiceType}>
                <SelectTrigger>
                  <SelectValue placeholder="All services" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">All services</SelectItem>
                  {Object.entries(SERVICE_TYPE_LABELS).map(([value, label]) => (
                    <SelectItem key={value} value={value}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Status */}
            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <Select value={status} onValueChange={setStatus}>
                <SelectTrigger>
                  <SelectValue placeholder="All statuses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">All statuses</SelectItem>
                  <SelectItem value="COMPLETED">Completed</SelectItem>
                  <SelectItem value="PENDING">Pending</SelectItem>
                  <SelectItem value="CANCELLED">Cancelled</SelectItem>
                  <SelectItem value="FAILED">Failed</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Start Date */}
            <div className="space-y-2">
              <Label htmlFor="startDate">Start Date</Label>
              <div className="relative">
                <Calendar className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  id="startDate"
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>

            {/* End Date */}
            <div className="space-y-2">
              <Label htmlFor="endDate">End Date</Label>
              <div className="relative">
                <Calendar className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  id="endDate"
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>
          </div>

          <div className="flex gap-2">
            <Button onClick={handleSearch}>Apply Filters</Button>
            <Button variant="outline" onClick={handleReset}>
              Reset
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Summary Cards */}
      {transactions.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-4 sm:mb-6">
          <Card>
            <CardContent className="p-3 sm:p-4">
              <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 mb-1">Total Amount</p>
              <p className="text-lg sm:text-2xl font-bold text-gray-900 dark:text-white">
                Rs {totals.amount.toLocaleString('en-PK', { minimumFractionDigits: 2 })}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <p className="text-sm text-gray-600 mb-1">Total Commission</p>
              <p className="text-2xl font-bold text-green-600">
                Rs {totals.commission.toLocaleString('en-PK', { minimumFractionDigits: 2 })}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <p className="text-sm text-gray-600 mb-1">Total Discount</p>
              <p className="text-2xl font-bold text-orange-600">
                Rs {totals.discount.toLocaleString('en-PK', { minimumFractionDigits: 2 })}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <p className="text-sm text-gray-600 mb-1">Net Commission</p>
              <p className="text-2xl font-bold text-blue-600">
                Rs {totals.netCommission.toLocaleString('en-PK', { minimumFractionDigits: 2 })}
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Transactions Table - Desktop / Cards - Mobile */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg sm:text-xl dark:text-white">Transactions</CardTitle>
          <CardDescription className="dark:text-gray-400">
            Showing {transactions.length} of {pagination.total} transactions
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">Loading transactions...</div>
          ) : transactions.length === 0 ? (
            <div className="text-center py-8 text-gray-500 dark:text-gray-400">No transactions found</div>
          ) : (
            <>
              {/* Desktop Table - Hidden on Mobile */}
              <div className="hidden lg:block overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Service</TableHead>
                      <TableHead>Customer</TableHead>
                      <TableHead>Phone</TableHead>
                      <TableHead className="text-right">Amount</TableHead>
                      <TableHead className="text-right">Commission</TableHead>
                      <TableHead className="text-right">Discount</TableHead>
                      <TableHead className="text-right">Net Commission</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-center">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {transactions.map((transaction) => (
                      <TableRow key={transaction.id}>
                        <TableCell>
                          {format(new Date(transaction.transactionDate), 'MMM dd, yyyy')}
                        </TableCell>
                        <TableCell>
                          <div>
                            <p className="font-medium">
                              {SERVICE_TYPE_LABELS[transaction.serviceType]}
                            </p>
                            {transaction.loadProvider && (
                              <p className="text-sm text-gray-500">
                                {LOAD_PROVIDER_LABELS[transaction.loadProvider]}
                              </p>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>{transaction.customerName || '-'}</TableCell>
                        <TableCell>{transaction.phoneNumber || '-'}</TableCell>
                        <TableCell className="text-right font-medium">
                          Rs {parseFloat(transaction.amount).toLocaleString('en-PK', { minimumFractionDigits: 2 })}
                        </TableCell>
                        <TableCell className="text-right text-green-600">
                          Rs {parseFloat(transaction.commission).toLocaleString('en-PK', { minimumFractionDigits: 2 })}
                        </TableCell>
                        <TableCell className="text-right text-orange-600">
                          Rs {parseFloat(transaction.discount).toLocaleString('en-PK', { minimumFractionDigits: 2 })}
                        </TableCell>
                        <TableCell className="text-right font-semibold text-blue-600">
                          Rs {parseFloat(transaction.netCommission).toLocaleString('en-PK', { minimumFractionDigits: 2 })}
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant={
                              transaction.status === 'COMPLETED'
                                ? 'default'
                                : transaction.status === 'PENDING'
                                ? 'secondary'
                                : 'destructive'
                            }
                          >
                            {transaction.status}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center justify-center gap-2">
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleEdit(transaction)}
                              className="h-8 w-8 p-0 text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => setDeleteTransaction(transaction)}
                              className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {/* Mobile Cards - Shown on Mobile/Tablet */}
              <div className="lg:hidden space-y-3 sm:space-y-4">
                {transactions.map((transaction) => (
                  <Card key={transaction.id} className="border-l-4 border-l-purple-500">
                    <CardContent className="p-4">
                      {/* Header */}
                      <div className="flex justify-between items-start mb-3">
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-gray-900 dark:text-white truncate">
                            {SERVICE_TYPE_LABELS[transaction.serviceType]}
                          </p>
                          {transaction.loadProvider && (
                            <p className="text-xs text-gray-500 dark:text-gray-400">
                              {LOAD_PROVIDER_LABELS[transaction.loadProvider]}
                            </p>
                          )}
                          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                            {format(new Date(transaction.transactionDate), 'MMM dd, yyyy')}
                          </p>
                        </div>
                        <Badge
                          variant={
                            transaction.status === 'COMPLETED'
                              ? 'default'
                              : transaction.status === 'PENDING'
                              ? 'secondary'
                              : 'destructive'
                          }
                          className="text-xs"
                        >
                          {transaction.status}
                        </Badge>
                      </div>

                      {/* Customer Info */}
                      {(transaction.customerName || transaction.phoneNumber) && (
                        <div className="mb-3 pb-3 border-b border-gray-200 dark:border-gray-700">
                          {transaction.customerName && (
                            <p className="text-sm text-gray-700 dark:text-gray-300 truncate">
                              👤 {transaction.customerName}
                            </p>
                          )}
                          {transaction.phoneNumber && (
                            <p className="text-sm text-gray-700 dark:text-gray-300">
                              📞 {transaction.phoneNumber}
                            </p>
                          )}
                        </div>
                      )}

                      {/* Amounts Grid */}
                      <div className="grid grid-cols-2 gap-3 mb-3">
                        <div>
                          <p className="text-xs text-gray-500 dark:text-gray-400">Amount</p>
                          <p className="text-sm font-semibold text-gray-900 dark:text-white">
                            Rs {parseFloat(transaction.amount).toLocaleString('en-PK', { minimumFractionDigits: 2 })}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500 dark:text-gray-400">Commission</p>
                          <p className="text-sm font-semibold text-green-600 dark:text-green-400">
                            Rs {parseFloat(transaction.commission).toLocaleString('en-PK', { minimumFractionDigits: 2 })}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500 dark:text-gray-400">Discount</p>
                          <p className="text-sm font-semibold text-orange-600 dark:text-orange-400">
                            Rs {parseFloat(transaction.discount).toLocaleString('en-PK', { minimumFractionDigits: 2 })}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500 dark:text-gray-400">Net</p>
                          <p className="text-sm font-bold text-blue-600 dark:text-blue-400">
                            Rs {parseFloat(transaction.netCommission).toLocaleString('en-PK', { minimumFractionDigits: 2 })}
                          </p>
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex gap-2 pt-3 border-t border-gray-200 dark:border-gray-700">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleEdit(transaction)}
                          className="flex-1 text-blue-600 hover:text-blue-700 hover:bg-blue-50 dark:hover:bg-blue-900/20"
                        >
                          <Pencil className="h-3 w-3 mr-1" />
                          Edit
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setDeleteTransaction(transaction)}
                          className="flex-1 text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20"
                        >
                          <Trash2 className="h-3 w-3 mr-1" />
                          Delete
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {/* Pagination */}
              {pagination.totalPages > 1 && (
                <div className="flex items-center justify-between mt-4">
                  <p className="text-sm text-gray-600">
                    Page {pagination.page} of {pagination.totalPages}
                  </p>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      onClick={() => setPagination((prev) => ({ ...prev, page: prev.page - 1 }))}
                      disabled={pagination.page === 1}
                    >
                      Previous
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => setPagination((prev) => ({ ...prev, page: prev.page + 1 }))}
                      disabled={pagination.page === pagination.totalPages}
                    >
                      Next
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
        </div>
      </div>

      {/* Edit Dialog */}
      <Dialog open={!!editingTransaction} onOpenChange={(open) => !open && setEditingTransaction(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Transaction</DialogTitle>
            <DialogDescription>
              Update transaction details below
            </DialogDescription>
          </DialogHeader>
          
          {editingTransaction && (
            <form onSubmit={handleUpdate}>
              <div className="space-y-4">
                {/* Service Info (Read-only) */}
                <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                  <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Service Type</p>
                  <p className="text-base font-semibold text-gray-900 dark:text-white">
                    {SERVICE_TYPE_LABELS[editingTransaction.serviceType]}
                  </p>
                  {editingTransaction.loadProvider && (
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {LOAD_PROVIDER_LABELS[editingTransaction.loadProvider]}
                    </p>
                  )}
                </div>

                {/* Editable Fields */}
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="edit-amount">Amount (PKR)</Label>
                    <Input
                      id="edit-amount"
                      type="number"
                      step="0.01"
                      value={editingTransaction.amount}
                      onChange={(e) =>
                        setEditingTransaction({ ...editingTransaction, amount: e.target.value })
                      }
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="edit-discount">Discount (PKR)</Label>
                    <Input
                      id="edit-discount"
                      type="number"
                      step="0.01"
                      value={editingTransaction.discount}
                      onChange={(e) =>
                        setEditingTransaction({ ...editingTransaction, discount: e.target.value })
                      }
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="edit-customer">Customer Name</Label>
                    <Input
                      id="edit-customer"
                      value={editingTransaction.customerName || ''}
                      onChange={(e) =>
                        setEditingTransaction({ ...editingTransaction, customerName: e.target.value })
                      }
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="edit-phone">Phone Number</Label>
                    <Input
                      id="edit-phone"
                      value={editingTransaction.phoneNumber || ''}
                      onChange={(e) =>
                        setEditingTransaction({ ...editingTransaction, phoneNumber: e.target.value })
                      }
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="edit-reference">Reference ID</Label>
                    <Input
                      id="edit-reference"
                      value={editingTransaction.referenceId || ''}
                      onChange={(e) =>
                        setEditingTransaction({ ...editingTransaction, referenceId: e.target.value })
                      }
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="edit-status">Status</Label>
                    <Select
                      value={editingTransaction.status}
                      onValueChange={(value) =>
                        setEditingTransaction({ ...editingTransaction, status: value })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="COMPLETED">Completed</SelectItem>
                        <SelectItem value="PENDING">Pending</SelectItem>
                        <SelectItem value="CANCELLED">Cancelled</SelectItem>
                        <SelectItem value="FAILED">Failed</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="edit-notes">Notes</Label>
                  <Input
                    id="edit-notes"
                    value={editingTransaction.notes || ''}
                    onChange={(e) =>
                      setEditingTransaction({ ...editingTransaction, notes: e.target.value })
                    }
                    placeholder="Optional notes..."
                  />
                </div>
              </div>

              <DialogFooter className="mt-6">
                <Button type="button" variant="outline" onClick={() => setEditingTransaction(null)}>
                  Cancel
                </Button>
                <Button type="submit" className="bg-blue-600 hover:bg-blue-700">
                  Save Changes
                </Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteTransaction} onOpenChange={(open: boolean) => !open && setDeleteTransaction(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Transaction?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this transaction? This action cannot be undone.
              {deleteTransaction && (
                <div className="mt-4 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg text-sm">
                  <p className="font-medium text-gray-900 dark:text-white">
                    {SERVICE_TYPE_LABELS[deleteTransaction.serviceType]}
                  </p>
                  <p className="text-gray-600 dark:text-gray-400">
                    Amount: Rs {parseFloat(deleteTransaction.amount).toLocaleString('en-PK')}
                  </p>
                  <p className="text-gray-600 dark:text-gray-400">
                    Date: {format(new Date(deleteTransaction.transactionDate), 'MMM dd, yyyy')}
                  </p>
                </div>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-red-600 hover:bg-red-700"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      </div>
    </div>
  );
}

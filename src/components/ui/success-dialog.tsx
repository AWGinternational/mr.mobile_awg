import React from 'react'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { CheckCircle, Download, X } from 'lucide-react'

interface SuccessDialogProps {
  open: boolean
  onClose: () => void
  title: string
  message: string
  details?: {
    invoiceNumber?: string
    totalAmount?: number
    customerName?: string
    paymentMethod?: string
  }
  onGenerateReceipt?: () => void
  showReceiptOption?: boolean
}

export function SuccessDialog({
  open,
  onClose,
  title,
  message,
  details,
  onGenerateReceipt,
  showReceiptOption = false
}: SuccessDialogProps) {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-PK', { 
      style: 'currency', 
      currency: 'PKR', 
      minimumFractionDigits: 0 
    }).format(amount)
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
            <div>
              <DialogTitle className="text-xl text-green-800">{title}</DialogTitle>
              <DialogDescription className="text-green-600">{message}</DialogDescription>
            </div>
          </div>
        </DialogHeader>
        
        {details && (
          <div className="space-y-3 py-4">
            {details.invoiceNumber && (
              <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                <span className="text-sm text-gray-600">Invoice Number:</span>
                <span className="font-medium text-gray-900">{details.invoiceNumber}</span>
              </div>
            )}
            
            {details.totalAmount && (
              <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                <span className="text-sm text-gray-600">Total Amount:</span>
                <span className="font-bold text-green-600 text-lg">{formatCurrency(details.totalAmount)}</span>
              </div>
            )}
            
            {details.customerName && (
              <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                <span className="text-sm text-gray-600">Customer:</span>
                <span className="font-medium text-gray-900">{details.customerName}</span>
              </div>
            )}
            
            {details.paymentMethod && (
              <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                <span className="text-sm text-gray-600">Payment Method:</span>
                <span className="font-medium text-gray-900 capitalize">{details.paymentMethod}</span>
              </div>
            )}
          </div>
        )}

        <div className="flex gap-3">
          {showReceiptOption && onGenerateReceipt && (
            <Button 
              onClick={onGenerateReceipt}
              className="flex-1 bg-blue-600 hover:bg-blue-700"
            >
              <Download className="h-4 w-4 mr-2" />
              Generate Receipt
            </Button>
          )}
          <Button 
            onClick={onClose}
            variant="outline"
            className="flex-1"
          >
            <X className="h-4 w-4 mr-2" />
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

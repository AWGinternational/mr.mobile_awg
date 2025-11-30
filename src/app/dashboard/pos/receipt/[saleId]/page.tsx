'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { ProtectedRoute } from '@/components/auth/protected-route'
import { UserRole } from '@/types'
import { Button } from '@/components/ui/button'
import { ArrowLeft, Printer, X } from 'lucide-react'

export default function ReceiptPage() {
  const params = useParams()
  const router = useRouter()
  const saleId = params?.saleId as string
  const [receiptHtml, setReceiptHtml] = useState<string>('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!saleId) {
      setError('Sale ID is required')
      setLoading(false)
      return
    }

    const fetchReceipt = async () => {
      try {
        const response = await fetch(`/api/pos/receipt/${saleId}`)
        if (!response.ok) {
          throw new Error('Failed to load receipt')
        }
        const html = await response.text()
        setReceiptHtml(html)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load receipt')
      } finally {
        setLoading(false)
      }
    }

    fetchReceipt()
  }, [saleId])

  useEffect(() => {
    // Auto-print when receipt is loaded
    if (receiptHtml && !loading) {
      // Small delay to ensure content is rendered
      const timer = setTimeout(() => {
        window.print()
      }, 500)
      return () => clearTimeout(timer)
    }
  }, [receiptHtml, loading])

  const handleBack = () => {
    router.push('/dashboard/pos')
  }

  if (loading) {
    return (
      <ProtectedRoute allowedRoles={[UserRole.SUPER_ADMIN, UserRole.SHOP_OWNER, UserRole.SHOP_WORKER]}>
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
          <div className="text-center">
            <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <p className="text-gray-600 dark:text-gray-400">Loading receipt...</p>
          </div>
        </div>
      </ProtectedRoute>
    )
  }

  if (error) {
    return (
      <ProtectedRoute allowedRoles={[UserRole.SUPER_ADMIN, UserRole.SHOP_OWNER, UserRole.SHOP_WORKER]}>
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
          <div className="text-center max-w-md mx-auto p-6">
            <div className="w-16 h-16 bg-red-100 dark:bg-red-900/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <X className="h-8 w-8 text-red-600 dark:text-red-400" />
            </div>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">Error Loading Receipt</h2>
            <p className="text-gray-600 dark:text-gray-400 mb-6">{error}</p>
            <Button onClick={handleBack} className="bg-blue-600 hover:bg-blue-700">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to POS
            </Button>
          </div>
        </div>
      </ProtectedRoute>
    )
  }

  return (
    <ProtectedRoute allowedRoles={[UserRole.SUPER_ADMIN, UserRole.SHOP_OWNER, UserRole.SHOP_WORKER]}>
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        {/* Header with actions - hidden when printing */}
        <div className="print:hidden bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700 p-4">
          <div className="max-w-4xl mx-auto flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button
                variant="outline"
                size="sm"
                onClick={handleBack}
                className="flex items-center gap-2"
              >
                <ArrowLeft className="h-4 w-4" />
                Back to POS
              </Button>
              <h1 className="text-lg font-semibold text-gray-900 dark:text-white">Receipt</h1>
            </div>
            <Button
              onClick={() => window.print()}
              className="bg-blue-600 hover:bg-blue-700 flex items-center gap-2"
            >
              <Printer className="h-4 w-4" />
              Print
            </Button>
          </div>
        </div>

        {/* Receipt Content */}
        <div className="max-w-4xl mx-auto p-4 print:p-0">
          <div 
            dangerouslySetInnerHTML={{ __html: receiptHtml }}
            className="bg-white print:bg-white"
          />
        </div>
      </div>
    </ProtectedRoute>
  )
}


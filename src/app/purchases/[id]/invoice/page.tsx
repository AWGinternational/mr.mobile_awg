'use client'

import React, { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import { Loader2 } from 'lucide-react'

interface PurchaseItem {
  id: string
  product: {
    id: string
    name: string
    model: string
    sku: string
  }
  quantity: number
  receivedQty: number
  unitCost: number
  totalCost: number
}

interface Purchase {
  id: string
  invoiceNumber: string
  supplier: {
    id: string
    name: string
    contactPerson: string
    phone: string
    email: string
  }
  totalAmount: number
  paidAmount: number
  dueAmount: number
  status: string
  purchaseDate: string
  receivedDate: string | null
  notes: string | null
  items: PurchaseItem[]
}

export default function PurchaseInvoicePage() {
  const params = useParams()
  const [purchase, setPurchase] = useState<Purchase | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchPurchase = async () => {
      try {
        const response = await fetch(`/api/purchases/${params.id}`)
        const data = await response.json()
        if (data.success) {
          setPurchase(data.data)
        }
      } catch (error) {
        console.error('Error fetching purchase:', error)
      } finally {
        setLoading(false)
      }
    }

    if (params.id) {
      fetchPurchase()
    }
  }, [params.id])

  useEffect(() => {
    // Auto-print when loaded
    if (purchase && !loading) {
      setTimeout(() => {
        window.print()
      }, 500)
    }
  }, [purchase, loading])

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-PK', {
      style: 'currency',
      currency: 'PKR',
      minimumFractionDigits: 0
    }).format(amount)
  }

  const formatDate = (date: string | null) => {
    if (!date) return 'N/A'
    return new Date(date).toLocaleDateString('en-PK', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    )
  }

  if (!purchase) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p>Purchase not found</p>
      </div>
    )
  }

  return (
    <>
      <style jsx global>{`
        @media print {
          body {
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }
          
          @page {
            margin: 1cm;
            size: A4;
          }
          
          .no-print {
            display: none !important;
          }
        }
      `}</style>

      <div className="min-h-screen bg-white p-8">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="border-b-4 border-blue-600 pb-6 mb-6">
            <div className="flex justify-between items-start">
              <div>
                <h1 className="text-4xl font-bold text-gray-900 mb-2">PURCHASE ORDER</h1>
                <p className="text-xl text-gray-600">#{purchase.invoiceNumber}</p>
              </div>
              <div className="text-right">
                <h2 className="text-2xl font-bold text-blue-600 mb-2">Mr. Mobile</h2>
                <p className="text-sm text-gray-600">Mobile Shop Management</p>
                <p className="text-sm text-gray-600">Pakistan</p>
              </div>
            </div>
          </div>

          {/* Details Section */}
          <div className="grid grid-cols-2 gap-8 mb-8">
            {/* Supplier Info */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-3 border-b border-gray-300 pb-2">
                SUPPLIER INFORMATION
              </h3>
              <div className="space-y-2">
                <div>
                  <span className="text-sm text-gray-600">Name:</span>
                  <p className="font-semibold text-gray-900">{purchase.supplier.name}</p>
                </div>
                <div>
                  <span className="text-sm text-gray-600">Contact Person:</span>
                  <p className="font-semibold text-gray-900">{purchase.supplier.contactPerson}</p>
                </div>
                <div>
                  <span className="text-sm text-gray-600">Phone:</span>
                  <p className="font-semibold text-gray-900">{purchase.supplier.phone}</p>
                </div>
                {purchase.supplier.email && (
                  <div>
                    <span className="text-sm text-gray-600">Email:</span>
                    <p className="font-semibold text-gray-900">{purchase.supplier.email}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Order Info */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-3 border-b border-gray-300 pb-2">
                ORDER INFORMATION
              </h3>
              <div className="space-y-2">
                <div>
                  <span className="text-sm text-gray-600">Order Date:</span>
                  <p className="font-semibold text-gray-900">{formatDate(purchase.purchaseDate)}</p>
                </div>
                {purchase.receivedDate && (
                  <div>
                    <span className="text-sm text-gray-600">Received Date:</span>
                    <p className="font-semibold text-gray-900">{formatDate(purchase.receivedDate)}</p>
                  </div>
                )}
                <div>
                  <span className="text-sm text-gray-600">Status:</span>
                  <p className="font-semibold text-gray-900 uppercase">{purchase.status}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Items Table */}
          <div className="mb-8">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">ORDER ITEMS</h3>
            <table className="w-full border-collapse border border-gray-300">
              <thead>
                <tr className="bg-gray-100">
                  <th className="border border-gray-300 px-4 py-3 text-left text-sm font-semibold text-gray-900">
                    #
                  </th>
                  <th className="border border-gray-300 px-4 py-3 text-left text-sm font-semibold text-gray-900">
                    Product Details
                  </th>
                  <th className="border border-gray-300 px-4 py-3 text-center text-sm font-semibold text-gray-900">
                    Quantity
                  </th>
                  <th className="border border-gray-300 px-4 py-3 text-center text-sm font-semibold text-gray-900">
                    Received
                  </th>
                  <th className="border border-gray-300 px-4 py-3 text-right text-sm font-semibold text-gray-900">
                    Unit Price
                  </th>
                  <th className="border border-gray-300 px-4 py-3 text-right text-sm font-semibold text-gray-900">
                    Total
                  </th>
                </tr>
              </thead>
              <tbody>
                {purchase.items.map((item, index) => (
                  <tr key={item.id} className="hover:bg-gray-50">
                    <td className="border border-gray-300 px-4 py-3 text-sm text-gray-900">
                      {index + 1}
                    </td>
                    <td className="border border-gray-300 px-4 py-3">
                      <p className="font-semibold text-gray-900">{item.product.name}</p>
                      <p className="text-sm text-gray-600">
                        {item.product.model} • SKU: {item.product.sku}
                      </p>
                    </td>
                    <td className="border border-gray-300 px-4 py-3 text-center text-sm text-gray-900 font-semibold">
                      {item.quantity}
                    </td>
                    <td className="border border-gray-300 px-4 py-3 text-center text-sm">
                      <span className={item.receivedQty >= item.quantity ? 'text-green-600 font-semibold' : 'text-orange-600'}>
                        {item.receivedQty}
                      </span>
                    </td>
                    <td className="border border-gray-300 px-4 py-3 text-right text-sm text-gray-900">
                      {formatCurrency(item.unitCost)}
                    </td>
                    <td className="border border-gray-300 px-4 py-3 text-right text-sm font-semibold text-gray-900">
                      {formatCurrency(item.totalCost)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Financial Summary */}
          <div className="flex justify-end mb-8">
            <div className="w-80 space-y-3">
              <div className="flex justify-between items-center py-2 border-b border-gray-200">
                <span className="text-sm text-gray-600">Subtotal:</span>
                <span className="font-semibold text-gray-900 text-lg">
                  {formatCurrency(purchase.totalAmount)}
                </span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-gray-200">
                <span className="text-sm text-gray-600">Paid Amount:</span>
                <span className="font-semibold text-green-600 text-lg">
                  {formatCurrency(purchase.paidAmount)}
                </span>
              </div>
              <div className="flex justify-between items-center py-3 bg-gray-100 px-4 rounded-lg border-2 border-gray-300">
                <span className="font-semibold text-gray-900">Amount Due:</span>
                <span className="font-bold text-red-600 text-xl">
                  {formatCurrency(purchase.dueAmount)}
                </span>
              </div>
            </div>
          </div>

          {/* Notes */}
          {purchase.notes && (
            <div className="mb-8 border-t border-gray-300 pt-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">NOTES</h3>
              <p className="text-sm text-gray-700 whitespace-pre-wrap">{purchase.notes}</p>
            </div>
          )}

          {/* Footer */}
          <div className="border-t-2 border-gray-300 pt-6 mt-8">
            <div className="grid grid-cols-2 gap-8">
              <div>
                <p className="text-sm font-semibold text-gray-900 mb-2">Authorized By:</p>
                <div className="border-b border-gray-400 w-48 mt-12"></div>
                <p className="text-xs text-gray-600 mt-1">Signature & Stamp</p>
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-900 mb-2">Received By:</p>
                <div className="border-b border-gray-400 w-48 mt-12"></div>
                <p className="text-xs text-gray-600 mt-1">Signature & Date</p>
              </div>
            </div>
          </div>

          {/* Print Info */}
          <div className="mt-8 text-center text-xs text-gray-500 border-t border-gray-200 pt-4">
            <p>This is a computer-generated document. No signature is required.</p>
            <p>Printed on: {new Date().toLocaleString('en-PK')}</p>
          </div>

          {/* Print Button - Only visible on screen */}
          <div className="no-print mt-8 flex justify-center gap-4">
            <button
              onClick={() => window.print()}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-semibold"
            >
              Print / Download PDF
            </button>
            <button
              onClick={() => window.close()}
              className="px-6 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 font-semibold"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </>
  )
}

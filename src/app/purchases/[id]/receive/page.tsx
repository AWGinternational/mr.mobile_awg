'use client'

import React, { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { useAuth } from '@/hooks/use-auth'
import { useNotify } from '@/hooks/use-notifications'
import { ProtectedRoute } from '@/components/auth/protected-route'
import { TopNavigation } from '@/components/layout/TopNavigation'
import { BusinessSidebar } from '@/components/layout/BusinessSidebar'
import { UserRole } from '@/types'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import {
  ArrowLeft,
  Package,
  CheckCircle,
  Loader2,
  Save
} from 'lucide-react'

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
  }
  totalAmount: number
  paidAmount: number
  dueAmount: number
  status: string
  purchaseDate: string
  items: PurchaseItem[]
}

interface ReceiveItem {
  id: string
  receivedQty: number
  imeiNumbers: string[]
  serialNumbers: string[]
}

export default function ReceiveStockPage() {
  return (
    <ProtectedRoute allowedRoles={[UserRole.SUPER_ADMIN, UserRole.SHOP_OWNER, UserRole.SHOP_WORKER]}>
      <ReceiveStockPageContent />
    </ProtectedRoute>
  )
}

function ReceiveStockPageContent() {
  const router = useRouter()
  const params = useParams()
  const notify = useNotify()
  const purchaseId = params.id as string

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [purchase, setPurchase] = useState<Purchase | null>(null)
  const [receiveItems, setReceiveItems] = useState<ReceiveItem[]>([])

  useEffect(() => {
    if (purchaseId) {
      fetchPurchaseDetails()
    }
  }, [purchaseId])

  const fetchPurchaseDetails = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/purchases/${purchaseId}`)
      const data = await response.json()

      if (data.success) {
        setPurchase(data.data)
        // Initialize receive items - start with current receivedQty but input will be empty
        setReceiveItems(
          data.data.items.map((item: PurchaseItem) => ({
            id: item.id,
            receivedQty: item.receivedQty, // Track current state
            imeiNumbers: [],
            serialNumbers: []
          }))
        )
      } else {
        notify.error(data.error || 'Failed to fetch purchase details')
      }
    } catch (error) {
      console.error('Error fetching purchase:', error)
      notify.error('Failed to fetch purchase details')
    } finally {
      setLoading(false)
    }
  }

  const handleReceiveQtyChange = (itemId: string, qty: number) => {
    const purchaseItem = purchase?.items.find(pi => pi.id === itemId)
    if (!purchaseItem) return

    // Ensure quantity doesn't exceed ordered quantity
    const maxQty = purchaseItem.quantity
    const validatedQty = Math.min(Math.max(0, qty), maxQty)

    setReceiveItems(prev =>
      prev.map(item =>
        item.id === itemId
          ? { ...item, receivedQty: validatedQty }
          : item
      )
    )
  }

  const handleIMEIChange = (itemId: string, value: string) => {
    const imeis = value.split('\n').filter(s => s.trim())
    setReceiveItems(prev =>
      prev.map(item =>
        item.id === itemId ? { ...item, imeiNumbers: imeis } : item
      )
    )
  }

  const handleSerialChange = (itemId: string, value: string) => {
    const serials = value.split('\n').filter(s => s.trim())
    setReceiveItems(prev =>
      prev.map(item =>
        item.id === itemId ? { ...item, serialNumbers: serials } : item
      )
    )
  }

  const handleReceiveStock = async () => {
    try {
      // Filter to only items that have new quantities to receive
      const itemsToReceive = receiveItems.filter(item => {
        const currentItem = purchase?.items.find(pi => pi.id === item.id)
        return currentItem && item.receivedQty > currentItem.receivedQty
      })

      if (itemsToReceive.length === 0) {
        notify.error('Please enter received quantities for at least one item')
        return
      }

      // Validate IMEI/Serial numbers if required
      for (const item of itemsToReceive) {
        const purchaseItem = purchase?.items.find(pi => pi.id === item.id)
        if (!purchaseItem) continue

        const newlyReceived = item.receivedQty - purchaseItem.receivedQty
        if (newlyReceived > 0) {
          const totalIdentifiers = item.imeiNumbers.length + item.serialNumbers.length
          if (totalIdentifiers > 0 && totalIdentifiers !== newlyReceived) {
            notify.error(
              `Item "${purchaseItem.product.name}": Number of IMEI/Serial numbers (${totalIdentifiers}) must match received quantity (${newlyReceived})`
            )
            return
          }
        }
      }

      console.log('📦 Sending items to receive:', itemsToReceive.map(item => ({
        id: item.id,
        receivedQty: item.receivedQty,
        imeiCount: item.imeiNumbers.length,
        serialCount: item.serialNumbers.length
      })))

      setSaving(true)

      const response = await fetch(`/api/purchases/${purchaseId}/receive`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items: itemsToReceive })
      })

      const data = await response.json()

      if (data.success) {
        notify.success('Stock received successfully')
        router.push(`/purchases/${purchaseId}?refresh=true`)
      } else {
        notify.error(data.error || 'Failed to receive stock')
      }
    } catch (error) {
      console.error('Error receiving stock:', error)
      notify.error('Failed to receive stock')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <TopNavigation onMenuClick={() => setSidebarOpen(!sidebarOpen)} />
        <div className="flex">
          <BusinessSidebar />
          <main className="flex-1 p-8 lg:ml-64">
            <div className="flex items-center justify-center h-64">
              <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
            </div>
          </main>
        </div>
      </div>
    )
  }

  if (!purchase) {
    return (
      <div className="min-h-screen bg-gray-50">
        <TopNavigation onMenuClick={() => setSidebarOpen(!sidebarOpen)} />
        <div className="flex">
          <BusinessSidebar />
          <main className="flex-1 p-8 lg:ml-64">
            <div className="text-center">
              <p className="text-gray-500">Purchase not found</p>
              <Button
                onClick={() => router.push('/purchases')}
                variant="outline"
                className="mt-4"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Purchases
              </Button>
            </div>
          </main>
        </div>
      </div>
    )
  }

  const allItemsReceived = purchase.items.every(
    item => item.receivedQty >= item.quantity
  )

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-gray-50">
      <TopNavigation onMenuClick={() => setSidebarOpen(!sidebarOpen)} />
      <div className="flex">
        <BusinessSidebar />
        <main className="flex-1 p-8 lg:ml-64">
          <div className="max-w-6xl mx-auto space-y-6">
            {/* Header */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <Button
                onClick={() => router.push(`/purchases/${purchaseId}`)}
                variant="ghost"
                size="sm"
                className="mb-4 hover:bg-gray-100"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Purchase Details
              </Button>
              
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-3 mb-2">
                    <div className="bg-blue-100 p-2 rounded-lg">
                      <Package className="h-6 w-6 text-blue-600" />
                    </div>
                    <div>
                      <h1 className="text-3xl font-bold text-gray-900">
                        Receive Stock
                      </h1>
                      <p className="text-gray-500 text-sm mt-1">
                        Purchase Order: <span className="font-medium text-gray-700">{purchase.invoiceNumber}</span>
                      </p>
                    </div>
                  </div>
                </div>
                <div className="text-right bg-gray-50 p-4 rounded-lg border border-gray-200">
                  <div className="text-xs text-gray-500 uppercase tracking-wide mb-1">Supplier</div>
                  <div className="font-semibold text-gray-900">{purchase.supplier.name}</div>
                  <div className="text-sm text-gray-600 mt-1">{purchase.supplier.contactPerson}</div>
                </div>
              </div>
            </div>

            {/* Status Alert */}
            {allItemsReceived && (
              <Card className="bg-green-50 border-green-200">
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 text-green-800">
                    <CheckCircle className="h-5 w-5" />
                    <span className="font-medium">
                      All items have been fully received
                    </span>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Items to Receive */}
            <Card className="shadow-md border-gray-200">
              <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-gray-200">
                <CardTitle className="flex items-center gap-2 text-gray-900">
                  <div className="bg-blue-600 p-2 rounded-lg">
                    <Package className="h-5 w-5 text-white" />
                  </div>
                  Items to Receive
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6 p-6">
                {purchase.items.map((item, index) => {
                  const receiveItem = receiveItems.find(ri => ri.id === item.id)
                  const pendingQty = item.quantity - item.receivedQty
                  const isFullyReceived = pendingQty === 0

                  return (
                    <div
                      key={item.id}
                      className={`border rounded-xl p-5 shadow-sm transition-all ${
                        isFullyReceived 
                          ? 'bg-gradient-to-br from-green-50 to-gray-50 border-green-200 opacity-80' 
                          : 'bg-white border-gray-200 hover:shadow-md'
                      }`}
                    >
                      {/* Item Header */}
                      <div className="flex items-start justify-between mb-5">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <h3 className="font-semibold text-lg text-gray-900">
                              {item.product.name}
                            </h3>
                            {isFullyReceived && (
                              <Badge className="bg-green-500 text-white hover:bg-green-600">
                                <CheckCircle className="h-3 w-3 mr-1" />
                                Fully Received
                              </Badge>
                            )}
                          </div>
                          <p className="text-sm text-gray-600 mb-3">
                            <span className="font-medium">Model:</span> {item.product.model} 
                            <span className="mx-2">•</span>
                            <span className="font-medium">SKU:</span> {item.product.sku}
                          </p>
                          <div className="flex items-center gap-4 text-sm flex-wrap">
                            <div className="flex items-center gap-2 bg-blue-50 px-4 py-2 rounded-lg border border-blue-200">
                              <span className="text-gray-600 font-medium">Ordered:</span>
                              <strong className="text-blue-700 text-lg">{item.quantity}</strong>
                            </div>
                            <div className="flex items-center gap-2 bg-green-50 px-4 py-2 rounded-lg border border-green-200">
                              <span className="text-gray-600 font-medium">Already Received:</span>
                              <strong className="text-green-700 text-lg">{item.receivedQty}</strong>
                            </div>
                            <div className="flex items-center gap-2 bg-orange-50 px-4 py-2 rounded-lg border border-orange-200">
                              <span className="text-gray-600 font-medium">Pending:</span>
                              <strong className="text-orange-700 text-lg">{pendingQty}</strong>
                            </div>
                            {receiveItem && receiveItem.receivedQty > item.receivedQty && (
                              <div className="flex items-center gap-2 bg-purple-50 px-4 py-2 rounded-lg border border-purple-200">
                                <span className="text-gray-600 font-medium">Receiving Now:</span>
                                <strong className="text-purple-700 text-lg">
                                  +{receiveItem.receivedQty - item.receivedQty}
                                </strong>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Receive Quantity */}
                      {!isFullyReceived && (
                        <div className="space-y-5 bg-gray-50 p-4 rounded-lg border border-gray-200">
                          <div>
                            <Label htmlFor={`qty-${item.id}`} className="text-sm font-semibold text-gray-700">
                              Receiving Quantity *
                            </Label>
                            <div className="relative max-w-xs">
                              <Input
                                id={`qty-${item.id}`}
                                type="number"
                                min={item.receivedQty}
                                max={item.quantity}
                                value={receiveItem?.receivedQty === item.receivedQty ? '' : receiveItem?.receivedQty}
                                placeholder={`Enter total received (max: ${item.quantity})`}
                                onChange={e => {
                                  const value = parseInt(e.target.value)
                                  if (value > item.quantity) {
                                    notify.error(`Cannot receive more than ordered quantity (${item.quantity})`)
                                  }
                                  handleReceiveQtyChange(
                                    item.id,
                                    parseInt(e.target.value) || item.receivedQty
                                  )
                                }}
                                className={`mt-1.5 border-gray-300 focus:border-blue-500 focus:ring-blue-500 ${
                                  receiveItem && receiveItem.receivedQty > item.quantity 
                                    ? 'border-red-500 focus:border-red-500 focus:ring-red-500' 
                                    : ''
                                }`}
                              />
                              {receiveItem && receiveItem.receivedQty > item.quantity && (
                                <p className="text-xs text-red-600 mt-1 flex items-center gap-1">
                                  ⚠️ Cannot exceed ordered quantity of {item.quantity}
                                </p>
                              )}
                            </div>
                            <p className="text-xs text-gray-600 mt-1.5 flex items-center gap-1">
                              <span className="font-medium">Already received:</span> {item.receivedQty} 
                              <span className="mx-1">•</span>
                              <span className="font-medium">Maximum:</span> {item.quantity} units
                            </p>
                          </div>

                          {/* IMEI Numbers */}
                          <div>
                            <Label htmlFor={`imei-${item.id}`} className="text-sm font-semibold text-gray-700">
                              IMEI Numbers <span className="text-gray-500 font-normal">(Optional - one per line)</span>
                            </Label>
                            <textarea
                              id={`imei-${item.id}`}
                              className="w-full min-h-[100px] p-3 border border-gray-300 rounded-lg text-sm font-mono focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all mt-1.5"
                              placeholder="Enter IMEI numbers, one per line&#10;Example:&#10;123456789012345&#10;987654321098765"
                              value={receiveItem?.imeiNumbers.join('\n') || ''}
                              onChange={e =>
                                handleIMEIChange(item.id, e.target.value)
                              }
                            />
                            <p className="text-xs text-gray-600 mt-1.5 flex items-center gap-1">
                              <span className="font-medium">{receiveItem?.imeiNumbers.length || 0}</span> IMEI number(s) entered
                            </p>
                          </div>

                          {/* Serial Numbers */}
                          <div>
                            <Label htmlFor={`serial-${item.id}`} className="text-sm font-semibold text-gray-700">
                              Serial Numbers <span className="text-gray-500 font-normal">(Optional - one per line)</span>
                            </Label>
                            <textarea
                              id={`serial-${item.id}`}
                              className="w-full min-h-[100px] p-3 border border-gray-300 rounded-lg text-sm font-mono focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all mt-1.5"
                              placeholder="Enter serial numbers, one per line&#10;Example:&#10;SN-001-ABC&#10;SN-002-DEF"
                              value={receiveItem?.serialNumbers.join('\n') || ''}
                              onChange={e =>
                                handleSerialChange(item.id, e.target.value)
                              }
                            />
                            <p className="text-xs text-gray-600 mt-1.5 flex items-center gap-1">
                              <span className="font-medium">{receiveItem?.serialNumbers.length || 0}</span> serial number(s) entered
                            </p>
                          </div>
                        </div>
                      )}
                    </div>
                  )
                })}
              </CardContent>
            </Card>

            {/* Action Buttons */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between">
                <Button
                  onClick={() => router.push(`/purchases/${purchaseId}`)}
                  variant="outline"
                  className="border-gray-300 hover:bg-gray-50"
                >
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Cancel
                </Button>
                <Button
                  onClick={handleReceiveStock}
                  disabled={saving || allItemsReceived}
                  className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-md disabled:opacity-50 disabled:cursor-not-allowed px-6"
                >
                  {saving ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Receiving Stock...
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4 mr-2" />
                      Receive Stock & Update Inventory
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}

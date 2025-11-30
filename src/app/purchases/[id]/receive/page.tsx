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
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <TopNavigation onMenuClick={() => setSidebarOpen(!sidebarOpen)} />
        <div className="flex">
          <BusinessSidebar />
          <main className="flex-1 p-4 sm:p-6 lg:p-8 lg:ml-64">
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
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <TopNavigation onMenuClick={() => setSidebarOpen(!sidebarOpen)} />
        <div className="flex">
          <BusinessSidebar />
          <main className="flex-1 p-4 sm:p-6 lg:p-8 lg:ml-64">
            <div className="text-center">
              <p className="text-gray-500 dark:text-gray-400">Purchase not found</p>
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
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-gray-50 dark:from-gray-900 dark:via-gray-900 dark:to-gray-900">
      <TopNavigation onMenuClick={() => setSidebarOpen(!sidebarOpen)} />
      <div className="flex">
        <BusinessSidebar />
        <main className="flex-1 p-3 sm:p-4 lg:p-8 lg:ml-64 pb-32 sm:pb-8">
          <div className="max-w-6xl mx-auto space-y-4 sm:space-y-6">
            {/* Header */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-4 sm:p-6">
              <Button
                onClick={() => router.push(`/purchases/${purchaseId}`)}
                variant="ghost"
                size="sm"
                className="mb-3 sm:mb-4 hover:bg-gray-100 dark:hover:bg-gray-700 text-xs sm:text-sm"
              >
                <ArrowLeft className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1.5 sm:mr-2" />
                Back to Purchase Details
              </Button>
              
              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2 sm:gap-3 mb-2">
                    <div className="bg-blue-100 dark:bg-blue-900/30 p-2 sm:p-2.5 rounded-lg">
                      <Package className="h-5 w-5 sm:h-6 sm:w-6 text-blue-600 dark:text-blue-400" />
                    </div>
                    <div>
                      <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900 dark:text-white">
                        Receive Stock
                      </h1>
                      <p className="text-gray-500 dark:text-gray-400 text-xs sm:text-sm mt-0.5 sm:mt-1">
                        Purchase Order: <span className="font-medium text-gray-700 dark:text-gray-300">{purchase.invoiceNumber}</span>
                      </p>
                    </div>
                  </div>
                </div>
                <div className="text-left sm:text-right bg-gray-50 dark:bg-gray-700/50 p-3 sm:p-4 rounded-lg border border-gray-200 dark:border-gray-600">
                  <div className="text-[10px] sm:text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-0.5 sm:mb-1">Supplier</div>
                  <div className="font-semibold text-gray-900 dark:text-white text-sm sm:text-base">{purchase.supplier.name}</div>
                  <div className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 mt-0.5 sm:mt-1">{purchase.supplier.contactPerson}</div>
                </div>
              </div>
            </div>

            {/* Status Alert */}
            {allItemsReceived && (
              <Card className="bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-700">
                <CardContent className="p-3 sm:p-4">
                  <div className="flex items-center gap-2 text-green-800 dark:text-green-300">
                    <CheckCircle className="h-4 w-4 sm:h-5 sm:w-5" />
                    <span className="font-medium text-sm sm:text-base">
                      All items have been fully received
                    </span>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Items to Receive */}
            <Card className="shadow-md border-gray-200 dark:border-gray-700 dark:bg-gray-800">
              <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border-b border-gray-200 dark:border-gray-700 p-3 sm:p-4 lg:p-6">
                <CardTitle className="flex items-center gap-2 text-gray-900 dark:text-white text-sm sm:text-base">
                  <div className="bg-blue-600 p-1.5 sm:p-2 rounded-lg">
                    <Package className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
                  </div>
                  Items to Receive
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 sm:space-y-6 p-3 sm:p-4 lg:p-6">
                {purchase.items.map((item, index) => {
                  const receiveItem = receiveItems.find(ri => ri.id === item.id)
                  const pendingQty = item.quantity - item.receivedQty
                  const isFullyReceived = pendingQty === 0

                  return (
                    <div
                      key={item.id}
                      className={`border rounded-xl p-3 sm:p-4 lg:p-5 shadow-sm transition-all ${
                        isFullyReceived 
                          ? 'bg-gradient-to-br from-green-50 to-gray-50 dark:from-green-900/10 dark:to-gray-800 border-green-200 dark:border-green-700 opacity-80' 
                          : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 hover:shadow-md'
                      }`}
                    >
                      {/* Item Header */}
                      <div className="mb-4 sm:mb-5">
                        <div className="flex flex-wrap items-start justify-between gap-2 mb-2">
                          <h3 className="font-semibold text-base sm:text-lg text-gray-900 dark:text-white">
                            {item.product.name}
                          </h3>
                          {isFullyReceived && (
                            <Badge className="bg-green-500 text-white hover:bg-green-600 text-[10px] sm:text-xs">
                              <CheckCircle className="h-2.5 w-2.5 sm:h-3 sm:w-3 mr-0.5 sm:mr-1" />
                              Fully Received
                            </Badge>
                          )}
                          </div>
                        <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 mb-3">
                          <span className="font-medium">Model:</span> {item.product.model} 
                          <span className="mx-1.5 sm:mx-2">•</span>
                          <span className="font-medium">SKU:</span> {item.product.sku}
                        </p>
                        
                        {/* Stats Grid - Mobile Optimized */}
                        <div className="grid grid-cols-2 sm:flex sm:flex-wrap gap-2 sm:gap-3 text-xs sm:text-sm">
                          <div className="flex items-center justify-between sm:justify-start gap-1.5 sm:gap-2 bg-blue-50 dark:bg-blue-900/20 px-2.5 sm:px-4 py-1.5 sm:py-2 rounded-lg border border-blue-200 dark:border-blue-700">
                            <span className="text-gray-600 dark:text-gray-400 font-medium">Ordered:</span>
                            <strong className="text-blue-700 dark:text-blue-400 text-sm sm:text-lg">{item.quantity}</strong>
                          </div>
                          <div className="flex items-center justify-between sm:justify-start gap-1.5 sm:gap-2 bg-green-50 dark:bg-green-900/20 px-2.5 sm:px-4 py-1.5 sm:py-2 rounded-lg border border-green-200 dark:border-green-700">
                            <span className="text-gray-600 dark:text-gray-400 font-medium">Received:</span>
                            <strong className="text-green-700 dark:text-green-400 text-sm sm:text-lg">{item.receivedQty}</strong>
                          </div>
                          <div className="flex items-center justify-between sm:justify-start gap-1.5 sm:gap-2 bg-orange-50 dark:bg-orange-900/20 px-2.5 sm:px-4 py-1.5 sm:py-2 rounded-lg border border-orange-200 dark:border-orange-700">
                            <span className="text-gray-600 dark:text-gray-400 font-medium">Pending:</span>
                            <strong className="text-orange-700 dark:text-orange-400 text-sm sm:text-lg">{pendingQty}</strong>
                          </div>
                          {receiveItem && receiveItem.receivedQty > item.receivedQty && (
                            <div className="flex items-center justify-between sm:justify-start gap-1.5 sm:gap-2 bg-purple-50 dark:bg-purple-900/20 px-2.5 sm:px-4 py-1.5 sm:py-2 rounded-lg border border-purple-200 dark:border-purple-700 col-span-2 sm:col-span-1">
                              <span className="text-gray-600 dark:text-gray-400 font-medium">Receiving:</span>
                              <strong className="text-purple-700 dark:text-purple-400 text-sm sm:text-lg">
                                +{receiveItem.receivedQty - item.receivedQty}
                              </strong>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Receive Quantity */}
                      {!isFullyReceived && (
                        <div className="space-y-4 sm:space-y-5 bg-gray-50 dark:bg-gray-700/50 p-3 sm:p-4 rounded-lg border border-gray-200 dark:border-gray-600">
                          <div>
                            <Label htmlFor={`qty-${item.id}`} className="text-xs sm:text-sm font-semibold text-gray-700 dark:text-gray-300">
                              Receiving Quantity *
                            </Label>
                            <div className="relative max-w-full sm:max-w-xs">
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
                                className={`mt-1.5 text-sm border-gray-300 dark:border-gray-600 focus:border-blue-500 focus:ring-blue-500 ${
                                  receiveItem && receiveItem.receivedQty > item.quantity 
                                    ? 'border-red-500 focus:border-red-500 focus:ring-red-500' 
                                    : ''
                                }`}
                              />
                              {receiveItem && receiveItem.receivedQty > item.quantity && (
                                <p className="text-[10px] sm:text-xs text-red-600 mt-1 flex items-center gap-1">
                                  ⚠️ Cannot exceed ordered quantity of {item.quantity}
                                </p>
                              )}
                            </div>
                            <p className="text-[10px] sm:text-xs text-gray-600 dark:text-gray-400 mt-1.5 flex items-center gap-1 flex-wrap">
                              <span className="font-medium">Already received:</span> {item.receivedQty} 
                              <span className="mx-1">•</span>
                              <span className="font-medium">Maximum:</span> {item.quantity} units
                            </p>
                          </div>

                          {/* IMEI Numbers */}
                          <div>
                            <Label htmlFor={`imei-${item.id}`} className="text-xs sm:text-sm font-semibold text-gray-700 dark:text-gray-300">
                              IMEI Numbers <span className="text-gray-500 font-normal">(Optional - one per line)</span>
                            </Label>
                            <textarea
                              id={`imei-${item.id}`}
                              className="w-full min-h-[80px] sm:min-h-[100px] p-2.5 sm:p-3 border border-gray-300 dark:border-gray-600 dark:bg-gray-800 dark:text-white rounded-lg text-xs sm:text-sm font-mono focus:border-blue-500 focus:ring-2 focus:ring-blue-200 dark:focus:ring-blue-800 transition-all mt-1.5"
                              placeholder="Enter IMEI numbers, one per line&#10;Example:&#10;123456789012345&#10;987654321098765"
                              value={receiveItem?.imeiNumbers.join('\n') || ''}
                              onChange={e =>
                                handleIMEIChange(item.id, e.target.value)
                              }
                            />
                            <p className="text-[10px] sm:text-xs text-gray-600 dark:text-gray-400 mt-1.5 flex items-center gap-1">
                              <span className="font-medium">{receiveItem?.imeiNumbers.length || 0}</span> IMEI number(s) entered
                            </p>
                          </div>

                          {/* Serial Numbers */}
                          <div>
                            <Label htmlFor={`serial-${item.id}`} className="text-xs sm:text-sm font-semibold text-gray-700 dark:text-gray-300">
                              Serial Numbers <span className="text-gray-500 font-normal">(Optional - one per line)</span>
                            </Label>
                            <textarea
                              id={`serial-${item.id}`}
                              className="w-full min-h-[80px] sm:min-h-[100px] p-2.5 sm:p-3 border border-gray-300 dark:border-gray-600 dark:bg-gray-800 dark:text-white rounded-lg text-xs sm:text-sm font-mono focus:border-blue-500 focus:ring-2 focus:ring-blue-200 dark:focus:ring-blue-800 transition-all mt-1.5"
                              placeholder="Enter serial numbers, one per line&#10;Example:&#10;SN-001-ABC&#10;SN-002-DEF"
                              value={receiveItem?.serialNumbers.join('\n') || ''}
                              onChange={e =>
                                handleSerialChange(item.id, e.target.value)
                              }
                            />
                            <p className="text-[10px] sm:text-xs text-gray-600 dark:text-gray-400 mt-1.5 flex items-center gap-1">
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

            {/* Action Buttons - Desktop Only */}
            <div className="hidden sm:block bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4 sm:p-6">
              <div className="flex items-center justify-between">
                <Button
                  onClick={() => router.push(`/purchases/${purchaseId}`)}
                  variant="outline"
                  className="border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700"
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

      {/* Fixed Bottom Action Bar - Mobile Only */}
      <div className="sm:hidden fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 p-3 shadow-lg z-50">
        <div className="flex gap-2">
          <Button
            onClick={() => router.push(`/purchases/${purchaseId}`)}
            variant="outline"
            className="flex-1 h-11 text-sm border-gray-300 dark:border-gray-600"
          >
            <ArrowLeft className="h-4 w-4 mr-1.5" />
            Cancel
          </Button>
          <Button
            onClick={handleReceiveStock}
            disabled={saving || allItemsReceived}
            className="flex-[2] h-11 text-sm bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-md disabled:opacity-50"
          >
            {saving ? (
              <>
                <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />
                Receiving...
              </>
            ) : (
              <>
                <Save className="h-4 w-4 mr-1.5" />
                Receive Stock
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  )
}

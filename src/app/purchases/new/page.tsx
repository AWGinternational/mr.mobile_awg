'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/use-auth'
import { useNotify } from '@/hooks/use-notifications'
import { ProtectedRoute } from '@/components/auth/protected-route'
import { TopNavigation } from '@/components/layout/TopNavigation'
import { BusinessSidebar } from '@/components/layout/BusinessSidebar'
import { UserRole, PurchaseStatus } from '@/types'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import {
  ArrowLeft,
  Plus,
  Trash2,
  Save,
  Send,
  Loader2
} from 'lucide-react'

interface PurchaseItem {
  productId: string
  productName?: string
  quantity: number
  unitCost: number
  totalCost: number
}

interface Supplier {
  id: string
  name: string
  contactPerson: string
  phone: string
}

interface Product {
  id: string
  name: string
  model: string
  sku: string
  costPrice: number
}

export default function NewPurchaseOrderPage() {
  const router = useRouter()
  const { user: currentUser } = useAuth()
  const { success, error: showError } = useNotify()

  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [suppliers, setSuppliers] = useState<Supplier[]>([])
  const [products, setProducts] = useState<Product[]>([])

  const [formData, setFormData] = useState({
    invoiceNumber: '', // Will be auto-generated
    supplierId: '',
    paidAmount: '0',
    dueDate: '',
    notes: ''
  })
  
  const [isGeneratingInvoice, setIsGeneratingInvoice] = useState(false)

  const [items, setItems] = useState<PurchaseItem[]>([
    { productId: '', quantity: 1, unitCost: 0, totalCost: 0 }
  ])

  const [currentShopId, setCurrentShopId] = useState<string | null>(null)

  useEffect(() => {
    const fetchUserShop = async () => {
      if (!currentUser) return
      
      try {
        if (currentUser.role === UserRole.SHOP_OWNER) {
          const response = await fetch(`/api/shops?ownerId=${currentUser.id}`)
          const data = await response.json()
          if (data.shops && data.shops.length > 0) {
            setCurrentShopId(data.shops[0].id)
          }
        }
      } catch (error) {
        console.error('Error fetching user shop:', error)
      }
    }
    
    fetchUserShop()
  }, [currentUser])

  useEffect(() => {
    if (currentShopId) {
      fetchSuppliers()
      fetchProducts()
      generateInvoiceNumber() // Auto-generate on load
    }
  }, [currentShopId])
  
  // Auto-generate invoice number
  const generateInvoiceNumber = async () => {
    setIsGeneratingInvoice(true)
    try {
      const response = await fetch('/api/purchases/generate-invoice')
      const data = await response.json()
      if (data.success) {
        setFormData(prev => ({ ...prev, invoiceNumber: data.invoiceNumber }))
      }
    } catch (error) {
      console.error('Error generating invoice:', error)
      // Fallback to client-side generation
      const timestamp = Date.now()
      const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0')
      setFormData(prev => ({ ...prev, invoiceNumber: `PO-${timestamp}-${random}` }))
    } finally {
      setIsGeneratingInvoice(false)
    }
  }

  const fetchSuppliers = async () => {
    try {
      const response = await fetch('/api/suppliers')
      const data = await response.json()
      console.log('🏭 Suppliers API response:', data)
      if (data.success) {
        // Handle both response formats
        setSuppliers(data.suppliers || data.data?.suppliers || [])
      }
    } catch (error) {
      console.error('Error fetching suppliers:', error)
    }
  }

  const fetchProducts = async () => {
    try {
      const response = await fetch('/api/products')
      const data = await response.json()
      console.log('📦 Products API response:', data)
      if (data.success) {
        setProducts(data.products || [])
      }
    } catch (error) {
      console.error('Error fetching products:', error)
    }
  }

  const handleAddItem = () => {
    setItems([...items, { productId: '', quantity: 1, unitCost: 0, totalCost: 0 }])
  }

  const handleRemoveItem = (index: number) => {
    if (items.length > 1) {
      setItems(items.filter((_, i) => i !== index))
    }
  }

  const handleItemChange = (index: number, field: string, value: any) => {
    const newItems = [...items]
    newItems[index] = { ...newItems[index], [field]: value }

    // Auto-calculate total
    if (field === 'quantity' || field === 'unitCost') {
      const qty = field === 'quantity' ? parseInt(value) : newItems[index].quantity
      const cost = field === 'unitCost' ? parseFloat(value) : newItems[index].unitCost
      newItems[index].totalCost = qty * cost
    }

    // Auto-fill cost price when product selected
    if (field === 'productId') {
      const product = products.find(p => p.id === value)
      if (product) {
        newItems[index].unitCost = Number(product.costPrice)
        newItems[index].totalCost = newItems[index].quantity * Number(product.costPrice)
        newItems[index].productName = product.name
      }
    }

    setItems(newItems)
  }

  const calculateTotal = () => {
    return items.reduce((sum, item) => sum + item.totalCost, 0)
  }

  const handleSubmit = async (status: PurchaseStatus) => {
    try {
      // Validation
      if (!formData.invoiceNumber || !formData.supplierId) {
        showError('Please fill in all required fields')
        return
      }

      const hasInvalidItems = items.some(item => !item.productId || item.quantity <= 0 || item.unitCost <= 0)
      if (hasInvalidItems) {
        showError('Please complete all product details')
        return
      }

      setLoading(true)

      const response = await fetch('/api/purchases', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          items,
          status
        })
      })

      const data = await response.json()

      if (data.success) {
        const message = status === 'DRAFT' 
          ? `✓ Draft saved! You can complete it later from the purchases page.`
          : `✓ Order created! Next step: Go to Purchases → Click "Receive Stock" when items arrive to add them to inventory.`
        success(message)
        
        // Redirect after showing message
        setTimeout(() => {
          router.push('/purchases')
        }, 2000)
      } else {
        showError(data.error || 'Failed to create purchase order')
      }
    } catch (error) {
      console.error('Error creating purchase:', error)
      showError('Failed to create purchase order')
    } finally {
      setLoading(false)
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-PK', { 
      style: 'currency', 
      currency: 'PKR', 
      minimumFractionDigits: 0 
    }).format(amount)
  }

  return (
    <ProtectedRoute allowedRoles={[UserRole.SUPER_ADMIN, UserRole.SHOP_OWNER, UserRole.SHOP_WORKER]}>
      <div className="flex min-h-screen bg-gray-50 dark:bg-gray-900">
        <BusinessSidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
        <div className={`flex-1 flex flex-col min-h-screen ${sidebarOpen ? 'lg:ml-20' : 'lg:ml-64'} transition-all duration-300`}>
          <div className="max-w-7xl mx-auto px-4 py-8 w-full">
            <TopNavigation onMenuClick={() => setSidebarOpen(!sidebarOpen)} />

            <div className="flex-1">
              {/* Header */}
              <div className="bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-700 text-white rounded-t-xl">
                <div className="px-8 py-8">
                  <div className="flex items-center gap-4">
                    <button 
                      onClick={() => router.push('/purchases')} 
                      className="p-2 bg-white/10 hover:bg-white/20 rounded-lg transition-all"
                    >
                      <ArrowLeft className="h-5 w-5" />
                    </button>
                    <div>
                      <h1 className="text-3xl font-bold">New Purchase Order</h1>
                      <p className="text-blue-100">Create a new purchase order from supplier</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Workflow Steps */}
              <div className="bg-white border-x border-gray-200 px-8 py-4">
                <div className="flex items-center justify-between max-w-3xl mx-auto">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold">
                      1
                    </div>
                    <div>
                      <p className="font-semibold text-sm">Create Order</p>
                      <p className="text-xs text-gray-500">Add products & details</p>
                    </div>
                  </div>
                  
                  <div className="flex-1 h-0.5 bg-gray-300 mx-4"></div>
                  
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-gray-300 text-gray-600 flex items-center justify-center font-bold">
                      2
                    </div>
                    <div>
                      <p className="font-semibold text-sm text-gray-500">Receive Stock</p>
                      <p className="text-xs text-gray-400">Add IMEI/Serials</p>
                    </div>
                  </div>
                  
                  <div className="flex-1 h-0.5 bg-gray-300 mx-4"></div>
                  
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-gray-300 text-gray-600 flex items-center justify-center font-bold">
                      3
                    </div>
                    <div>
                      <p className="font-semibold text-sm text-gray-500">In Inventory</p>
                      <p className="text-xs text-gray-400">Ready to sell</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Form */}
              <Card className="rounded-t-none">
                <CardContent className="p-8 space-y-8">
                  {/* Info Box */}
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <div className="flex gap-3">
                      <div className="text-blue-600 text-xl">ℹ️</div>
                      <div>
                        <h4 className="font-semibold text-blue-900 mb-1">How Purchase Orders Work</h4>
                        <ul className="text-sm text-blue-800 space-y-1">
                          <li>• <strong>Step 1:</strong> Create order with products and quantities</li>
                          <li>• <strong>Step 2:</strong> When stock arrives, go to "Receive Stock" to add IMEI/Serial numbers</li>
                          <li>• <strong>Step 3:</strong> Products automatically added to inventory and ready to sell!</li>
                        </ul>
                        <p className="text-xs text-blue-700 mt-2">
                          💡 You can save as draft and complete it later, or create order immediately.
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Basic Information */}
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Purchase Information</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <Label className="flex items-center gap-2">
                          Invoice Number *
                          <span className="text-xs text-green-600 font-normal">
                            (Auto-generated)
                          </span>
                        </Label>
                        <div className="flex gap-2">
                          <Input
                            value={formData.invoiceNumber}
                            onChange={(e) => setFormData({ ...formData, invoiceNumber: e.target.value })}
                            placeholder="e.g., PO-2024-001"
                            disabled={isGeneratingInvoice}
                            className="bg-gray-50"
                          />
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={generateInvoiceNumber}
                            disabled={isGeneratingInvoice}
                            title="Regenerate invoice number"
                          >
                            {isGeneratingInvoice ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              '🔄'
                            )}
                          </Button>
                        </div>
                        <p className="text-xs text-gray-500">
                          Auto-generated unique invoice number
                        </p>
                      </div>

                      <div className="space-y-2">
                        <Label>Supplier *</Label>
                        <Select 
                          value={formData.supplierId} 
                          onValueChange={(value) => setFormData({ ...formData, supplierId: value })}
                        >
                          <SelectTrigger className={!formData.supplierId ? 'border-orange-300' : ''}>
                            <SelectValue placeholder="Choose supplier to order from" />
                          </SelectTrigger>
                          <SelectContent>
                            {suppliers.length === 0 ? (
                              <div className="p-4 text-center text-gray-500">
                                <p>No suppliers found</p>
                                <p className="text-xs mt-1">Add suppliers first</p>
                              </div>
                            ) : (
                              suppliers.map(supplier => (
                                <SelectItem key={supplier.id} value={supplier.id}>
                                  <div className="flex flex-col">
                                    <span className="font-medium">{supplier.name}</span>
                                    <span className="text-xs text-gray-500">
                                      {supplier.contactPerson} • {supplier.phone}
                                    </span>
                                  </div>
                                </SelectItem>
                              ))
                            )}
                          </SelectContent>
                        </Select>
                        <p className="text-xs text-gray-500">
                          Select the supplier you're ordering from
                        </p>
                      </div>

                      <div className="space-y-2">
                        <Label>Paid Amount</Label>
                        <Input
                          type="number"
                          value={formData.paidAmount}
                          onChange={(e) => setFormData({ ...formData, paidAmount: e.target.value })}
                          placeholder="0"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label>Due Date</Label>
                        <Input
                          type="date"
                          value={formData.dueDate}
                          onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                        />
                      </div>

                      <div className="space-y-2 md:col-span-2">
                        <Label>Notes</Label>
                        <Textarea
                          value={formData.notes}
                          onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                          placeholder="Additional notes about this purchase..."
                          rows={3}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Items */}
                  <div>
                    <div className="flex justify-between items-center mb-4">
                      <h3 className="text-lg font-semibold text-gray-900">Purchase Items</h3>
                      <Button onClick={handleAddItem} variant="outline" size="sm">
                        <Plus className="h-4 w-4 mr-2" />
                        Add Item
                      </Button>
                    </div>

                    <div className="space-y-4">
                      {items.map((item, index) => (
                        <div key={index} className="border border-gray-200 rounded-lg p-4">
                          <div className="grid grid-cols-12 gap-4 items-end">
                            <div className="col-span-12 md:col-span-5 space-y-2">
                              <Label>Product *</Label>
                              <Select 
                                value={item.productId} 
                                onValueChange={(value) => handleItemChange(index, 'productId', value)}
                              >
                                <SelectTrigger className={!item.productId ? 'border-orange-300' : ''}>
                                  <SelectValue placeholder="Choose product to order" />
                                </SelectTrigger>
                                <SelectContent>
                                  {products.length === 0 ? (
                                    <div className="p-4 text-center text-gray-500">
                                      <p>No products found</p>
                                      <p className="text-xs mt-1">Add products first</p>
                                    </div>
                                  ) : (
                                    products.map(product => (
                                      <SelectItem key={product.id} value={product.id}>
                                        <div className="flex flex-col">
                                          <span className="font-medium">{product.name} - {product.model}</span>
                                          <span className="text-xs text-gray-500">
                                            SKU: {product.sku} • Cost: {formatCurrency(product.costPrice)}
                                          </span>
                                        </div>
                                      </SelectItem>
                                    ))
                                  )}
                                </SelectContent>
                              </Select>
                              {item.productId && item.productName && (
                                <p className="text-xs text-green-600">
                                  ✓ Selected: {item.productName}
                                </p>
                              )}
                            </div>

                            <div className="col-span-4 md:col-span-2 space-y-2">
                              <Label>Quantity *</Label>
                              <Input
                                type="number"
                                min="1"
                                value={item.quantity}
                                onChange={(e) => handleItemChange(index, 'quantity', e.target.value)}
                              />
                            </div>

                            <div className="col-span-4 md:col-span-2 space-y-2">
                              <Label>Unit Cost *</Label>
                              <Input
                                type="number"
                                min="0"
                                step="0.01"
                                value={item.unitCost}
                                onChange={(e) => handleItemChange(index, 'unitCost', e.target.value)}
                              />
                            </div>

                            <div className="col-span-4 md:col-span-2 space-y-2">
                              <Label>Total</Label>
                              <div className="font-semibold text-gray-900 py-2">
                                {formatCurrency(item.totalCost)}
                              </div>
                            </div>

                            <div className="col-span-12 md:col-span-1">
                              <Button
                                onClick={() => handleRemoveItem(index)}
                                variant="ghost"
                                size="sm"
                                className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                disabled={items.length === 1}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Summary */}
                  <div className="border-t pt-6">
                    <div className="bg-gradient-to-r from-gray-50 to-blue-50 rounded-lg p-6 mb-6">
                      <h3 className="text-lg font-semibold text-gray-900 mb-4">Order Summary</h3>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div className="bg-white rounded-lg p-4 shadow-sm">
                          <p className="text-xs text-gray-500 mb-1">Total Items</p>
                          <p className="text-2xl font-bold text-gray-900">{items.length}</p>
                        </div>
                        <div className="bg-white rounded-lg p-4 shadow-sm">
                          <p className="text-xs text-gray-500 mb-1">Total Units</p>
                          <p className="text-2xl font-bold text-blue-600">
                            {items.reduce((sum, item) => sum + (parseInt(item.quantity.toString()) || 0), 0)}
                          </p>
                        </div>
                        <div className="bg-white rounded-lg p-4 shadow-sm">
                          <p className="text-xs text-gray-500 mb-1">Total Amount</p>
                          <p className="text-xl font-bold text-green-600">
                            {formatCurrency(calculateTotal())}
                          </p>
                        </div>
                        <div className="bg-white rounded-lg p-4 shadow-sm">
                          <p className="text-xs text-gray-500 mb-1">Amount Due</p>
                          <p className="text-xl font-bold text-orange-600">
                            {formatCurrency(calculateTotal() - parseFloat(formData.paidAmount || '0'))}
                          </p>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex justify-between items-center">

                      <div className="flex gap-3">
                        <Button
                          onClick={() => handleSubmit(PurchaseStatus.DRAFT)}
                          variant="outline"
                          disabled={loading}
                        >
                          {loading ? (
                            <>
                              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                              Saving...
                            </>
                          ) : (
                            <>
                              <Save className="h-4 w-4 mr-2" />
                              Save as Draft
                            </>
                          )}
                        </Button>
                        <Button
                          onClick={() => handleSubmit(PurchaseStatus.ORDERED)}
                          disabled={loading}
                        >
                          {loading ? (
                            <>
                              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                              Creating...
                            </>
                          ) : (
                            <>
                              <Send className="h-4 w-4 mr-2" />
                              Create Order
                            </>
                          )}
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  )
}

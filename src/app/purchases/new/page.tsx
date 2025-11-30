'use client'

import React, { useState, useEffect, useRef, KeyboardEvent } from 'react'
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
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import {
  ArrowLeft,
  Plus,
  Trash2,
  Save,
  Send,
  Loader2,
  Upload,
  X,
  Image as ImageIcon,
  FileText,
  ExternalLink,
  Package,
  Users,
  CheckCircle
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

interface Category {
  id: string
  name: string
  code: string
}

interface Brand {
  id: string
  name: string
  code: string
}

interface UploadedFile {
  id: string
  name: string
  type: string
  url: string
  size: number
}

export default function NewPurchaseOrderPage() {
  const router = useRouter()
  const { user: currentUser } = useAuth()
  const { success, error: showError } = useNotify()

  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [suppliers, setSuppliers] = useState<Supplier[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [brands, setBrands] = useState<Brand[]>([])

  const [formData, setFormData] = useState({
    invoiceNumber: '',
    supplierId: '',
    paidAmount: '0',
    dueDate: '',
    notes: ''
  })
  
  const [isGeneratingInvoice, setIsGeneratingInvoice] = useState(false)
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([])
  const [isUploading, setIsUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Quick Add Dialogs
  const [showAddSupplier, setShowAddSupplier] = useState(false)
  const [showAddProduct, setShowAddProduct] = useState(false)
  const [newSupplier, setNewSupplier] = useState({ name: '', contactPerson: '', phone: '', email: '', address: '', city: '', province: '' })
  const [newProduct, setNewProduct] = useState({ name: '', model: '', costPrice: '', sellingPrice: '', categoryId: '', brandId: '' })
  const [addingSupplier, setAddingSupplier] = useState(false)
  const [addingProduct, setAddingProduct] = useState(false)

  // Input refs for keyboard navigation
  const supplierRef = useRef<HTMLButtonElement>(null)
  const paidAmountRef = useRef<HTMLInputElement>(null)
  const dueDateRef = useRef<HTMLInputElement>(null)
  const notesRef = useRef<HTMLTextAreaElement>(null)
  const itemRefs = useRef<{ [key: string]: HTMLInputElement | HTMLButtonElement | null }>({})

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
      fetchCategories()
      fetchBrands()
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

  const fetchCategories = async () => {
    try {
      const response = await fetch('/api/categories')
      const data = await response.json()
      console.log('📂 Categories API response:', data)
      if (data.success) {
        setCategories(data.data || [])
      }
    } catch (error) {
      console.error('Error fetching categories:', error)
    }
  }

  const fetchBrands = async () => {
    try {
      const response = await fetch('/api/brands')
      const data = await response.json()
      console.log('🏷️ Brands API response:', data)
      if (data.success) {
        setBrands(data.data || [])
      }
    } catch (error) {
      console.error('Error fetching brands:', error)
    }
  }

  // Quick Add Supplier
  const handleAddSupplier = async () => {
    if (!newSupplier.name || !newSupplier.phone || !newSupplier.contactPerson || !newSupplier.address || !newSupplier.city || !newSupplier.province) {
      showError('Please fill in all required fields (name, contact person, phone, address, city, province)')
      return
    }
    
    try {
      setAddingSupplier(true)
      const response = await fetch('/api/suppliers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newSupplier)
      })
      const data = await response.json()
      
      if (data.success) {
        success('Supplier added successfully!')
        setShowAddSupplier(false)
        setNewSupplier({ name: '', contactPerson: '', phone: '', email: '', address: '', city: '', province: '' })
        await fetchSuppliers()
        // Auto-select the new supplier
        if (data.supplier?.id) {
          setFormData(prev => ({ ...prev, supplierId: data.supplier.id }))
        }
      } else {
        showError(data.error || 'Failed to add supplier')
      }
    } catch (error) {
      showError('Failed to add supplier')
    } finally {
      setAddingSupplier(false)
    }
  }

  // Quick Add Product
  const handleAddProduct = async () => {
    if (!newProduct.name || !newProduct.model || !newProduct.costPrice || !newProduct.categoryId || !newProduct.brandId) {
      showError('Please fill in all required fields (name, model, cost, category, brand)')
      return
    }
    
    try {
      setAddingProduct(true)
      const response = await fetch('/api/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newProduct.name,
          model: newProduct.model,
          categoryId: newProduct.categoryId,
          brandId: newProduct.brandId,
          costPrice: parseFloat(newProduct.costPrice),
          sellingPrice: parseFloat(newProduct.sellingPrice || newProduct.costPrice)
        })
      })
      const data = await response.json()
      
      if (data.success && data.product) {
        success('Product added successfully!')
        setShowAddProduct(false)
        setNewProduct({ name: '', model: '', costPrice: '', sellingPrice: '', categoryId: '', brandId: '' })
        await fetchProducts()
        
        // Auto-select the newly created product in the first empty item slot
        const emptyItemIndex = items.findIndex(item => !item.productId)
        if (emptyItemIndex !== -1) {
          const newProduct = data.product
          handleItemChange(emptyItemIndex, 'productId', newProduct.id)
          // Also set the cost price
          setTimeout(() => {
            handleItemChange(emptyItemIndex, 'unitCost', newProduct.costPrice)
          }, 100)
        }
      } else {
        showError(data.error || 'Failed to add product')
      }
    } catch (error) {
      showError('Failed to add product')
    } finally {
      setAddingProduct(false)
    }
  }

  // File Upload Handler
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files || files.length === 0) return

    setIsUploading(true)
    
    for (const file of Array.from(files)) {
      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        showError(`${file.name} is too large. Max size is 5MB`)
        continue
      }

      // Create preview for images
      const isImage = file.type.startsWith('image/')
      const reader = new FileReader()
      
      reader.onload = () => {
        const newFile: UploadedFile = {
          id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
          name: file.name,
          type: file.type,
          url: reader.result as string,
          size: file.size
        }
        setUploadedFiles(prev => [...prev, newFile])
      }
      
      reader.readAsDataURL(file)
    }
    
    setIsUploading(false)
    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const removeFile = (fileId: string) => {
    setUploadedFiles(prev => prev.filter(f => f.id !== fileId))
  }

  // Keyboard Navigation Handler
  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement | HTMLTextAreaElement>, nextRef?: React.RefObject<any>, action?: () => void) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      if (action) {
        action()
      } else if (nextRef?.current) {
        nextRef.current.focus()
      }
    }
  }

  // Handle item field keyboard navigation
  const handleItemKeyDown = (e: KeyboardEvent<HTMLInputElement>, index: number, field: 'quantity' | 'unitCost') => {
    if (e.key === 'Enter') {
      e.preventDefault()
      
      if (field === 'quantity') {
        // Move to unit cost
        const costRef = itemRefs.current[`cost-${index}`]
        costRef?.focus()
      } else if (field === 'unitCost') {
        // Check if item is complete, then add new item or submit
        const item = items[index]
        if (item.productId && item.quantity > 0 && item.unitCost > 0) {
          if (index === items.length - 1) {
            // Last item - add new one
            handleAddItem()
            // Focus will be set after re-render
            setTimeout(() => {
              const newProductRef = itemRefs.current[`product-${index + 1}`]
              newProductRef?.focus()
            }, 100)
          }
        }
      }
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
      <div className="flex min-h-screen bg-gradient-to-br from-slate-50 via-gray-50 to-blue-50 dark:from-gray-900 dark:via-gray-900 dark:to-gray-900">
        <BusinessSidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
        <div className={`flex-1 flex flex-col min-h-screen ${sidebarOpen ? 'lg:ml-20' : 'lg:ml-64'} transition-all duration-300`}>
          <div className="max-w-6xl mx-auto px-3 sm:px-4 lg:px-6 py-4 sm:py-6 lg:py-8 w-full">
            <TopNavigation onMenuClick={() => setSidebarOpen(!sidebarOpen)} />

            <div className="flex-1 space-y-4 sm:space-y-6">
              {/* Header - Compact on Mobile */}
              <div className="relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-700 rounded-xl sm:rounded-2xl"></div>
                <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmZmZmYiIGZpbGwtb3BhY2l0eT0iMC4wNSI+PHBhdGggZD0iTTM2IDM0djItSDI0di0yaDEyek0zNiAzMHYySDI0di0yaDEyek0zNiAyNnYySDI0di0yaDEyeiIvPjwvZz48L2c+PC9zdmc+')] opacity-30"></div>
                <div className="relative px-4 sm:px-6 py-4 sm:py-5">
                  <div className="flex items-center gap-3">
                    <button 
                      onClick={() => router.push('/purchases')} 
                      className="p-2 sm:p-2.5 bg-white/20 hover:bg-white/30 active:scale-95 rounded-lg sm:rounded-xl transition-all shrink-0 backdrop-blur-sm"
                    >
                      <ArrowLeft className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
                    </button>
                    <div className="min-w-0 flex-1">
                      <h1 className="text-lg sm:text-xl lg:text-2xl font-bold text-white flex items-center gap-2">
                        <span className="hidden sm:inline">📝</span> New Purchase Order
                      </h1>
                      <p className="text-blue-100 text-xs sm:text-sm mt-0.5 truncate">Create a new order from suppliers</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Workflow Steps - Mobile Optimized */}
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-3 sm:p-4">
                {/* Mobile: Compact Vertical Steps */}
                <div className="sm:hidden">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 text-white flex items-center justify-center font-bold text-xs shadow-md ring-2 ring-blue-100">
                        1
                      </div>
                      <span className="text-xs font-medium text-gray-900 dark:text-white">Create Order</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <div className="w-8 h-0.5 bg-gradient-to-r from-blue-400 to-gray-300 rounded-full"></div>
                      <div className="w-6 h-6 rounded-full bg-gray-200 dark:bg-gray-700 text-gray-400 flex items-center justify-center font-bold text-[10px]">2</div>
                      <div className="w-4 h-0.5 bg-gray-300 rounded-full"></div>
                      <div className="w-6 h-6 rounded-full bg-gray-200 dark:bg-gray-700 text-gray-400 flex items-center justify-center font-bold text-[10px]">3</div>
                    </div>
                  </div>
                </div>

                {/* Desktop: Horizontal Steps */}
                <div className="hidden sm:flex items-center justify-center gap-0">
                  <div className="flex items-center gap-2.5 shrink-0">
                    <div className="w-9 h-9 lg:w-10 lg:h-10 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 text-white flex items-center justify-center font-bold text-sm shadow-lg ring-4 ring-blue-100 dark:ring-blue-900/50">
                      1
                    </div>
                    <div>
                      <p className="font-semibold text-sm text-gray-900 dark:text-white">Create Order</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">Add products</p>
                    </div>
                  </div>
                  
                  <div className="flex-1 h-1 bg-gradient-to-r from-blue-400 to-gray-300 dark:from-blue-600 dark:to-gray-600 mx-4 lg:mx-6 min-w-[40px] max-w-[80px] rounded-full"></div>
                  
                  <div className="flex items-center gap-2.5 shrink-0 opacity-50">
                    <div className="w-9 h-9 lg:w-10 lg:h-10 rounded-full bg-gray-200 dark:bg-gray-700 text-gray-500 flex items-center justify-center font-bold text-sm">
                      2
                    </div>
                    <div>
                      <p className="font-semibold text-sm text-gray-400 dark:text-gray-500">Receive Stock</p>
                      <p className="text-xs text-gray-400 dark:text-gray-600">Add IMEI</p>
                    </div>
                  </div>
                  
                  <div className="flex-1 h-1 bg-gray-300 dark:bg-gray-600 mx-4 lg:mx-6 min-w-[40px] max-w-[80px] rounded-full"></div>
                  
                  <div className="flex items-center gap-2.5 shrink-0 opacity-50">
                    <div className="w-9 h-9 lg:w-10 lg:h-10 rounded-full bg-gray-200 dark:bg-gray-700 text-gray-500 flex items-center justify-center font-bold text-sm">
                      3
                    </div>
                    <div>
                      <p className="font-semibold text-sm text-gray-400 dark:text-gray-500">In Inventory</p>
                      <p className="text-xs text-gray-400 dark:text-gray-600">Ready to sell</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Form Card */}
              <Card className="rounded-xl shadow-lg border-0 bg-white dark:bg-gray-800 overflow-hidden">
                <CardContent className="p-4 sm:p-5 lg:p-6 space-y-5 sm:space-y-6">
                  {/* Info Box - Collapsible on Mobile */}
                  <div className="bg-gradient-to-r from-blue-50 via-indigo-50 to-purple-50 dark:from-blue-900/20 dark:via-indigo-900/20 dark:to-purple-900/20 border border-blue-200/50 dark:border-blue-700/50 rounded-xl overflow-hidden">
                    <div className="p-3 sm:p-4">
                      <div className="flex items-start gap-3">
                        <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shrink-0 shadow-md">
                          <span className="text-sm sm:text-base">💡</span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="font-semibold text-blue-900 dark:text-blue-100 text-sm">Quick Guide</h4>
                          <div className="mt-2 space-y-1.5">
                            <div className="flex items-center gap-2 text-xs text-blue-700 dark:text-blue-200">
                              <span className="w-4 h-4 rounded-full bg-blue-600 text-white flex items-center justify-center text-[9px] font-bold shrink-0">1</span>
                              <span>Add products & quantities</span>
                            </div>
                            <div className="flex items-center gap-2 text-xs text-blue-700 dark:text-blue-200">
                              <span className="w-4 h-4 rounded-full bg-indigo-500 text-white flex items-center justify-center text-[9px] font-bold shrink-0">2</span>
                              <span>Receive stock & add IMEI</span>
                            </div>
                            <div className="flex items-center gap-2 text-xs text-blue-700 dark:text-blue-200">
                              <span className="w-4 h-4 rounded-full bg-green-500 text-white flex items-center justify-center text-[9px] font-bold shrink-0">3</span>
                              <span>Auto-added to inventory!</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Basic Information */}
                  <div className="space-y-4">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-gradient-to-br from-orange-400 to-orange-600 flex items-center justify-center shadow-sm">
                        <span className="text-sm sm:text-base">📋</span>
                      </div>
                      <h3 className="text-sm sm:text-base font-semibold text-gray-900 dark:text-white">Purchase Information</h3>
                    </div>
                    
                    <div className="grid grid-cols-1 gap-4">
                      {/* Invoice Number - Full Width on Mobile */}
                      <div className="space-y-1.5">
                        <Label className="text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center gap-1.5">
                          Invoice Number
                          <span className="text-red-500">*</span>
                          <span className="text-[9px] sm:text-[10px] text-emerald-600 bg-emerald-50 dark:bg-emerald-900/30 px-1.5 py-0.5 rounded-full">
                            Auto
                          </span>
                        </Label>
                        <div className="flex gap-2">
                          <Input
                            value={formData.invoiceNumber}
                            onChange={(e) => setFormData({ ...formData, invoiceNumber: e.target.value })}
                            placeholder="e.g., PO-2024-001"
                            disabled={isGeneratingInvoice}
                            className="flex-1 bg-gray-50 dark:bg-gray-900 text-sm font-mono h-10 sm:h-11"
                          />
                          <Button
                            type="button"
                            variant="outline"
                            size="icon"
                            onClick={generateInvoiceNumber}
                            disabled={isGeneratingInvoice}
                            className="h-10 w-10 sm:h-11 sm:w-11 shrink-0"
                          >
                            {isGeneratingInvoice ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <span className="text-sm">🔄</span>
                            )}
                          </Button>
                        </div>
                      </div>

                      {/* Supplier - Full Width with Quick Add */}
                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between">
                          <Label className="text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300">
                            Supplier <span className="text-red-500">*</span>
                          </Label>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => setShowAddSupplier(true)}
                            className="h-6 px-2 text-xs text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                          >
                            <Plus className="h-3 w-3 mr-1" />
                            Add New
                          </Button>
                        </div>
                        <Select 
                          value={formData.supplierId} 
                          onValueChange={(value) => {
                            setFormData({ ...formData, supplierId: value })
                            paidAmountRef.current?.focus()
                          }}
                        >
                          <SelectTrigger 
                            ref={supplierRef}
                            className={`h-10 sm:h-11 text-sm ${!formData.supplierId ? 'border-orange-300 bg-orange-50/50 dark:bg-orange-900/10' : ''}`}
                          >
                            <SelectValue placeholder="Select supplier..." />
                          </SelectTrigger>
                          <SelectContent>
                            {suppliers.length === 0 ? (
                              <div className="p-4 text-center">
                                <Users className="h-8 w-8 text-gray-300 mx-auto mb-2" />
                                <p className="text-sm text-gray-500">No suppliers found</p>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="mt-2"
                                  onClick={() => setShowAddSupplier(true)}
                                >
                                  <Plus className="h-3 w-3 mr-1" />
                                  Add Supplier
                                </Button>
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
                      </div>

                      {/* Two Column Grid for Amount and Date */}
                      <div className="grid grid-cols-2 gap-3 sm:gap-4">
                        <div className="space-y-1.5">
                          <Label className="text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300">Paid Amount</Label>
                          <div className="relative">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-gray-400">PKR</span>
                            <Input
                              ref={paidAmountRef}
                              type="number"
                              value={formData.paidAmount}
                              onChange={(e) => setFormData({ ...formData, paidAmount: e.target.value })}
                              onKeyDown={(e) => handleKeyDown(e, dueDateRef)}
                              placeholder="0"
                              className="h-10 sm:h-11 text-sm pl-10"
                            />
                          </div>
                        </div>

                        <div className="space-y-1.5">
                          <Label className="text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300">Due Date</Label>
                          <Input
                            ref={dueDateRef}
                            type="date"
                            value={formData.dueDate}
                            onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                            onKeyDown={(e) => handleKeyDown(e, notesRef)}
                            className="h-10 sm:h-11 text-sm"
                          />
                        </div>
                      </div>

                      {/* Notes - Full Width */}
                      <div className="space-y-1.5">
                        <Label className="text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300">Notes</Label>
                        <Textarea
                          ref={notesRef}
                          value={formData.notes}
                          onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                          placeholder="Additional notes..."
                          rows={2}
                          className="text-sm resize-none"
                        />
                      </div>

                      {/* File Upload Section */}
                      <div className="space-y-2">
                        <Label className="text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300">
                          Attachments <span className="text-gray-400 font-normal">(Bills, Invoices, Images)</span>
                        </Label>
                        
                        <div className="border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-xl p-4 hover:border-blue-400 dark:hover:border-blue-500 transition-colors">
                          <input
                            ref={fileInputRef}
                            type="file"
                            multiple
                            accept="image/*,.pdf,.doc,.docx"
                            onChange={handleFileUpload}
                            className="hidden"
                          />
                          
                          <div className="text-center">
                            <div className="flex justify-center gap-2 mb-2">
                              <div className="w-10 h-10 rounded-lg bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center">
                                <ImageIcon className="h-5 w-5 text-blue-500" />
                              </div>
                              <div className="w-10 h-10 rounded-lg bg-orange-50 dark:bg-orange-900/20 flex items-center justify-center">
                                <FileText className="h-5 w-5 text-orange-500" />
                              </div>
                            </div>
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => fileInputRef.current?.click()}
                              disabled={isUploading}
                              className="mb-1"
                            >
                              {isUploading ? (
                                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                              ) : (
                                <Upload className="h-4 w-4 mr-2" />
                              )}
                              Upload Files
                            </Button>
                            <p className="text-xs text-gray-500">PNG, JPG, PDF up to 5MB</p>
                          </div>
                        </div>

                        {/* Uploaded Files Preview */}
                        {uploadedFiles.length > 0 && (
                          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mt-3">
                            {uploadedFiles.map((file) => (
                              <div 
                                key={file.id}
                                className="relative group border border-gray-200 dark:border-gray-700 rounded-lg p-2 bg-gray-50 dark:bg-gray-800"
                              >
                                {file.type.startsWith('image/') ? (
                                  <img 
                                    src={file.url} 
                                    alt={file.name}
                                    className="w-full h-16 object-cover rounded"
                                  />
                                ) : (
                                  <div className="w-full h-16 flex items-center justify-center bg-gray-100 dark:bg-gray-700 rounded">
                                    <FileText className="h-8 w-8 text-gray-400" />
                                  </div>
                                )}
                                <p className="text-[10px] text-gray-600 dark:text-gray-400 truncate mt-1">{file.name}</p>
                                <button
                                  onClick={() => removeFile(file.id)}
                                  className="absolute -top-2 -right-2 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                                >
                                  <X className="h-3 w-3" />
                                </button>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Items */}
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-gradient-to-br from-purple-400 to-purple-600 flex items-center justify-center shadow-sm">
                          <span className="text-sm sm:text-base">📦</span>
                        </div>
                        <h3 className="text-sm sm:text-base font-semibold text-gray-900 dark:text-white">Items</h3>
                        <span className="text-xs bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 px-2 py-0.5 rounded-full">{items.length}</span>
                      </div>
                      <Button 
                        onClick={handleAddItem} 
                        variant="outline" 
                        size="sm" 
                        className="h-8 sm:h-9 text-xs sm:text-sm bg-emerald-50 hover:bg-emerald-100 border-emerald-200 text-emerald-700 dark:bg-emerald-900/20 dark:hover:bg-emerald-900/30 dark:border-emerald-700 dark:text-emerald-400"
                      >
                        <Plus className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1" />
                        Add Item
                      </Button>
                    </div>

                    {/* Keyboard hint */}
                    <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg px-3 py-2 text-xs text-blue-700 dark:text-blue-300 flex items-center gap-2">
                      <span className="bg-blue-200 dark:bg-blue-800 px-1.5 py-0.5 rounded text-[10px] font-mono">Enter</span>
                      <span>Press Enter to move to next field. When item is complete, it auto-adds a new row.</span>
                    </div>

                    <div className="space-y-3">
                      {items.map((item, index) => (
                        <div 
                          key={index} 
                          className="bg-gradient-to-br from-gray-50 to-slate-50 dark:from-gray-800/50 dark:to-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-3 sm:p-4 shadow-sm hover:shadow-md transition-all"
                        >
                          {/* Item Header */}
                          <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center gap-2">
                              <span className="text-[10px] sm:text-xs font-semibold text-gray-500 dark:text-gray-400 bg-white dark:bg-gray-700 px-2 py-1 rounded-lg shadow-sm">
                                #{index + 1}
                              </span>
                              {item.productId && item.quantity > 0 && item.unitCost > 0 && (
                                <CheckCircle className="h-4 w-4 text-emerald-500" />
                              )}
                            </div>
                            <Button
                              onClick={() => handleRemoveItem(index)}
                              variant="ghost"
                              size="sm"
                              className="text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 h-7 px-2 text-xs"
                              disabled={items.length === 1}
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                          
                          {/* Product Select */}
                          <div className="space-y-3">
                            <div className="space-y-1.5">
                              <div className="flex items-center justify-between">
                                <Label className="text-xs font-medium text-gray-600 dark:text-gray-400">
                                  Product <span className="text-red-500">*</span>
                                </Label>
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => setShowAddProduct(true)}
                                  className="h-6 px-2 text-[10px] text-blue-600 hover:text-blue-700 hover:bg-blue-50 dark:hover:bg-blue-900/20"
                                >
                                  <Plus className="h-3 w-3 mr-0.5" />
                                  New Product
                                </Button>
                              </div>
                              <Select 
                                value={item.productId} 
                                onValueChange={(value) => {
                                  handleItemChange(index, 'productId', value)
                                  // Focus quantity after selecting product
                                  setTimeout(() => {
                                    const qtyRef = itemRefs.current[`qty-${index}`]
                                    qtyRef?.focus()
                                  }, 100)
                                }}
                              >
                                <SelectTrigger 
                                  ref={(el) => { itemRefs.current[`product-${index}`] = el }}
                                  className={`h-10 text-sm ${!item.productId ? 'border-orange-300 bg-orange-50/50 dark:bg-orange-900/10' : 'bg-white dark:bg-gray-800'}`}
                                >
                                  <SelectValue placeholder="🔍 Select product..." />
                                </SelectTrigger>
                                <SelectContent>
                                  {products.length === 0 ? (
                                    <div className="p-4 text-center">
                                      <Package className="h-8 w-8 text-gray-300 mx-auto mb-2" />
                                      <p className="text-sm text-gray-500">No products found</p>
                                      <Button
                                        variant="outline"
                                        size="sm"
                                        className="mt-2"
                                        onClick={() => setShowAddProduct(true)}
                                      >
                                        <Plus className="h-3 w-3 mr-1" />
                                        Add Product
                                      </Button>
                                    </div>
                                  ) : (
                                    products.map(product => (
                                      <SelectItem key={product.id} value={product.id}>
                                        <div className="flex flex-col">
                                          <span className="font-medium text-sm">{product.name} - {product.model}</span>
                                          <span className="text-xs text-gray-500">
                                            {product.sku} • {formatCurrency(product.costPrice)}
                                          </span>
                                        </div>
                                      </SelectItem>
                                    ))
                                  )}
                                </SelectContent>
                              </Select>
                              {item.productId && item.productName && (
                                <p className="text-[10px] text-emerald-600 flex items-center gap-1">
                                  <CheckCircle className="h-3 w-3" /> {item.productName}
                                </p>
                              )}
                            </div>

                            {/* Quantity, Cost, Total - 3 Column Grid */}
                            <div className="grid grid-cols-3 gap-2 sm:gap-3">
                              <div className="space-y-1">
                                <Label className="text-[10px] sm:text-xs font-medium text-gray-600 dark:text-gray-400">Qty</Label>
                                <Input
                                  ref={(el) => { itemRefs.current[`qty-${index}`] = el }}
                                  type="number"
                                  min="1"
                                  value={item.quantity}
                                  onChange={(e) => handleItemChange(index, 'quantity', e.target.value)}
                                  onKeyDown={(e) => handleItemKeyDown(e, index, 'quantity')}
                                  className="h-9 sm:h-10 text-sm text-center font-semibold"
                                />
                              </div>

                              <div className="space-y-1">
                                <Label className="text-[10px] sm:text-xs font-medium text-gray-600 dark:text-gray-400">Cost</Label>
                                <Input
                                  ref={(el) => { itemRefs.current[`cost-${index}`] = el }}
                                  type="number"
                                  min="0"
                                  step="0.01"
                                  value={item.unitCost}
                                  onChange={(e) => handleItemChange(index, 'unitCost', e.target.value)}
                                  onKeyDown={(e) => handleItemKeyDown(e, index, 'unitCost')}
                                  className="h-9 sm:h-10 text-sm"
                                />
                              </div>

                              <div className="space-y-1">
                                <Label className="text-[10px] sm:text-xs font-medium text-gray-600 dark:text-gray-400">Total</Label>
                                <div className="h-9 sm:h-10 flex items-center justify-center rounded-lg bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-700">
                                  <span className="font-bold text-emerald-700 dark:text-emerald-400 text-xs sm:text-sm">
                                    {formatCurrency(item.totalCost)}
                                  </span>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Summary */}
                  <div className="border-t dark:border-gray-700 pt-5 space-y-4">
                    {/* Order Summary Stats */}
                    <div className="bg-gradient-to-br from-slate-50 via-blue-50/50 to-indigo-50/50 dark:from-gray-800 dark:via-gray-800 dark:to-gray-800 rounded-xl p-4 border border-gray-100 dark:border-gray-700">
                      <div className="flex items-center gap-2 mb-3">
                        <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-lg bg-gradient-to-br from-indigo-400 to-indigo-600 flex items-center justify-center shadow-sm">
                          <span className="text-xs sm:text-sm">📊</span>
                        </div>
                        <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Summary</h3>
                      </div>
                      
                      <div className="grid grid-cols-4 gap-2 sm:gap-3">
                        <div className="bg-white dark:bg-gray-800 rounded-lg p-2.5 sm:p-3 shadow-sm border border-gray-100 dark:border-gray-700 text-center">
                          <p className="text-[9px] sm:text-[10px] text-gray-500 uppercase tracking-wide mb-0.5">Items</p>
                          <p className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white">{items.length}</p>
                        </div>
                        <div className="bg-white dark:bg-gray-800 rounded-lg p-2.5 sm:p-3 shadow-sm border border-gray-100 dark:border-gray-700 text-center">
                          <p className="text-[9px] sm:text-[10px] text-gray-500 uppercase tracking-wide mb-0.5">Units</p>
                          <p className="text-lg sm:text-xl font-bold text-blue-600">
                            {items.reduce((sum, item) => sum + (parseInt(item.quantity.toString()) || 0), 0)}
                          </p>
                        </div>
                        <div className="bg-gradient-to-br from-emerald-50 to-green-50 dark:from-emerald-900/20 dark:to-green-900/20 rounded-lg p-2.5 sm:p-3 shadow-sm border border-emerald-200 dark:border-emerald-700 text-center">
                          <p className="text-[9px] sm:text-[10px] text-emerald-600 uppercase tracking-wide mb-0.5">Total</p>
                          <p className="text-[10px] sm:text-sm font-bold text-emerald-700 dark:text-emerald-400">
                            {formatCurrency(calculateTotal())}
                          </p>
                        </div>
                        <div className="bg-gradient-to-br from-orange-50 to-amber-50 dark:from-orange-900/20 dark:to-amber-900/20 rounded-lg p-2.5 sm:p-3 shadow-sm border border-orange-200 dark:border-orange-700 text-center">
                          <p className="text-[9px] sm:text-[10px] text-orange-600 uppercase tracking-wide mb-0.5">Due</p>
                          <p className="text-[10px] sm:text-sm font-bold text-orange-600 dark:text-orange-400">
                            {formatCurrency(calculateTotal() - parseFloat(formData.paidAmount || '0'))}
                          </p>
                        </div>
                      </div>
                    </div>
                    
                    {/* Action Buttons - Stacked on Mobile */}
                    <div className="flex flex-col-reverse sm:flex-row justify-end items-stretch gap-2 sm:gap-3">
                      <Button
                        onClick={() => handleSubmit(PurchaseStatus.DRAFT)}
                        variant="outline"
                        disabled={loading}
                        className="h-11 sm:h-12 text-sm font-medium"
                      >
                        {loading ? (
                          <>
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            Saving...
                          </>
                        ) : (
                          <>
                            <Save className="h-4 w-4 mr-2" />
                            Save Draft
                          </>
                        )}
                      </Button>
                      <Button
                        onClick={() => handleSubmit(PurchaseStatus.ORDERED)}
                        disabled={loading}
                        className="h-11 sm:h-12 text-sm font-medium bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-lg active:scale-[0.98] transition-all"
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
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Add Supplier Dialog */}
      <Dialog open={showAddSupplier} onOpenChange={setShowAddSupplier}>
        <DialogContent className="max-w-md mx-4 sm:mx-auto max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Users className="h-5 w-5 text-blue-600" />
              Quick Add Supplier
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Supplier Name <span className="text-red-500">*</span></Label>
              <Input
                value={newSupplier.name}
                onChange={(e) => setNewSupplier({ ...newSupplier, name: e.target.value })}
                placeholder="e.g., Samsung Distributors"
              />
            </div>
            <div className="space-y-2">
              <Label>Contact Person <span className="text-red-500">*</span></Label>
              <Input
                value={newSupplier.contactPerson}
                onChange={(e) => setNewSupplier({ ...newSupplier, contactPerson: e.target.value })}
                placeholder="e.g., Ahmed Khan"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Phone <span className="text-red-500">*</span></Label>
                <Input
                  value={newSupplier.phone}
                  onChange={(e) => setNewSupplier({ ...newSupplier, phone: e.target.value })}
                  placeholder="03XX-XXXXXXX"
                />
              </div>
              <div className="space-y-2">
                <Label>Email</Label>
                <Input
                  type="email"
                  value={newSupplier.email}
                  onChange={(e) => setNewSupplier({ ...newSupplier, email: e.target.value })}
                  placeholder="email@example.com"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Address <span className="text-red-500">*</span></Label>
              <Input
                value={newSupplier.address}
                onChange={(e) => setNewSupplier({ ...newSupplier, address: e.target.value })}
                placeholder="Street address..."
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>City <span className="text-red-500">*</span></Label>
                <Input
                  value={newSupplier.city}
                  onChange={(e) => setNewSupplier({ ...newSupplier, city: e.target.value })}
                  placeholder="e.g., Lahore"
                />
              </div>
              <div className="space-y-2">
                <Label>Province <span className="text-red-500">*</span></Label>
                <Select
                  value={newSupplier.province}
                  onValueChange={(value) => setNewSupplier({ ...newSupplier, province: value })}
                >
                  <SelectTrigger className={!newSupplier.province ? 'border-orange-300' : ''}>
                    <SelectValue placeholder="Select province" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Punjab">Punjab</SelectItem>
                    <SelectItem value="Sindh">Sindh</SelectItem>
                    <SelectItem value="KPK">KPK</SelectItem>
                    <SelectItem value="Balochistan">Balochistan</SelectItem>
                    <SelectItem value="Islamabad">Islamabad</SelectItem>
                    <SelectItem value="Gilgit-Baltistan">Gilgit-Baltistan</SelectItem>
                    <SelectItem value="AJK">AJK</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <p className="text-xs text-gray-500 bg-gray-50 dark:bg-gray-800 p-2 rounded-lg">
              💡 You can add more details later from the Suppliers page
            </p>
          </div>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setShowAddSupplier(false)}>
              Cancel
            </Button>
            <Button onClick={handleAddSupplier} disabled={addingSupplier}>
              {addingSupplier ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Plus className="h-4 w-4 mr-2" />
              )}
              Add Supplier
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Quick Add Product Dialog */}
      <Dialog open={showAddProduct} onOpenChange={setShowAddProduct}>
        <DialogContent className="max-w-md mx-4 sm:mx-auto max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Package className="h-5 w-5 text-purple-600" />
              Quick Add Product
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Product Name <span className="text-red-500">*</span></Label>
              <Input
                value={newProduct.name}
                onChange={(e) => setNewProduct({ ...newProduct, name: e.target.value })}
                placeholder="e.g., iPhone 15 Pro"
              />
            </div>
            <div className="space-y-2">
              <Label>Model <span className="text-red-500">*</span></Label>
              <Input
                value={newProduct.model}
                onChange={(e) => setNewProduct({ ...newProduct, model: e.target.value })}
                placeholder="e.g., 256GB Black"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Category <span className="text-red-500">*</span></Label>
                <Select
                  value={newProduct.categoryId}
                  onValueChange={(value) => setNewProduct({ ...newProduct, categoryId: value })}
                >
                  <SelectTrigger className={!newProduct.categoryId ? 'border-orange-300' : ''}>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.length === 0 ? (
                      <div className="p-3 text-center text-sm text-gray-500">
                        No categories found. Add from Products page.
                      </div>
                    ) : (
                      categories.map((cat) => (
                        <SelectItem key={cat.id} value={cat.id}>
                          {cat.name}
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Brand <span className="text-red-500">*</span></Label>
                <Select
                  value={newProduct.brandId}
                  onValueChange={(value) => setNewProduct({ ...newProduct, brandId: value })}
                >
                  <SelectTrigger className={!newProduct.brandId ? 'border-orange-300' : ''}>
                    <SelectValue placeholder="Select brand" />
                  </SelectTrigger>
                  <SelectContent>
                    {brands.length === 0 ? (
                      <div className="p-3 text-center text-sm text-gray-500">
                        No brands found. Add from Products page.
                      </div>
                    ) : (
                      brands.map((brand) => (
                        <SelectItem key={brand.id} value={brand.id}>
                          {brand.name}
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Cost Price <span className="text-red-500">*</span></Label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-gray-400">PKR</span>
                  <Input
                    type="number"
                    value={newProduct.costPrice}
                    onChange={(e) => setNewProduct({ ...newProduct, costPrice: e.target.value })}
                    placeholder="0"
                    className="pl-10"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Selling Price</Label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-gray-400">PKR</span>
                  <Input
                    type="number"
                    value={newProduct.sellingPrice}
                    onChange={(e) => setNewProduct({ ...newProduct, sellingPrice: e.target.value })}
                    placeholder="0"
                    className="pl-10"
                  />
                </div>
              </div>
            </div>
            <p className="text-xs text-gray-500 bg-gray-50 dark:bg-gray-800 p-2 rounded-lg">
              💡 SKU will be auto-generated. Add more details later from the Products page.
            </p>
          </div>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setShowAddProduct(false)}>
              Cancel
            </Button>
            <Button onClick={handleAddProduct} disabled={addingProduct}>
              {addingProduct ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Plus className="h-4 w-4 mr-2" />
              )}
              Add Product
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </ProtectedRoute>
  )
}

'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/use-auth'
import { useNotify } from '@/hooks/use-notifications'
import { ProtectedRoute } from '@/components/auth/protected-route'
import { ShiftGuard } from '@/components/auth/shift-guard'
import { ApprovalRequestDialog } from '@/components/approvals/ApprovalRequestDialog'
import { UserRole, ProductStatus } from '@/types'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { BusinessSidebar } from '@/components/layout/BusinessSidebar'
import { TopNavigation } from '@/components/layout/TopNavigation'
import {
  Package,
  Search,
  Plus,
  Edit3,
  Trash2,
  ArrowLeft,
  LogOut,
  X,
  Smartphone,
  DollarSign,
  BarChart,
  AlertTriangle,
  CheckCircle,
  Tag,
  Award,
  Upload,
  Download,
  FileSpreadsheet
} from 'lucide-react'
import { formatUserRole } from '@/utils/user-formatting'

interface Product {
  id: string
  name: string
  model: string
  sku: string
  barcode?: string
  sellingPrice: number
  costPrice: number
  stock: number
  lowStockThreshold: number
  status: string
  category?: { name: string }
  brand?: { name: string }
  createdAt: string
}

function ProductManagementPage() {
  const router = useRouter()
  const { user: currentUser, logout } = useAuth()
  const { success, error: showError } = useNotify()

  // Check if user is owner (can perform all actions)
  const isOwner = currentUser?.role === UserRole.SHOP_OWNER || currentUser?.role === UserRole.SUPER_ADMIN
  const isWorker = currentUser?.role === UserRole.SHOP_WORKER

  // State
  const [products, setProducts] = useState<Product[]>([])
  const [categories, setCategories] = useState<any[]>([])
  const [brands, setBrands] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [categoryFilter, setCategoryFilter] = useState<string>('all')
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [showEditDialog, setShowEditDialog] = useState(false)
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  
  // Brand/Category states
  const [showCreateBrand, setShowCreateBrand] = useState(false)
  const [showCreateCategory, setShowCreateCategory] = useState(false)
  const [showEditBrand, setShowEditBrand] = useState(false)
  const [showEditCategory, setShowEditCategory] = useState(false)
  const [editingBrand, setEditingBrand] = useState<any>(null)
  const [editingCategory, setEditingCategory] = useState<any>(null)
  const [brandName, setBrandName] = useState('')
  const [brandCode, setBrandCode] = useState('')
  const [brandDescription, setBrandDescription] = useState('')
  const [categoryName, setCategoryName] = useState('')
  const [categoryCode, setCategoryCode] = useState('')
  const [categoryDescription, setCategoryDescription] = useState('')

  // Approval system state
  const [showApprovalDialog, setShowApprovalDialog] = useState(false)
  const [approvalRequest, setApprovalRequest] = useState<any>(null)

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    model: '',
    barcode: '',
    categoryId: '',
    brandId: '',
    costPrice: '',
    sellingPrice: '',
    lowStockThreshold: '',
    description: '',
    stock: ''
  })

  // Stock management state
  const [quantityToAdd, setQuantityToAdd] = useState('')

  // Import state
  const [showImportDialog, setShowImportDialog] = useState(false)
  const [importFile, setImportFile] = useState<File | null>(null)
  const [importLoading, setImportLoading] = useState(false)
  const [importResults, setImportResults] = useState<any>(null)

  // Fetch products
  const fetchProducts = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/products')
      const data = await response.json()
      
      if (response.ok) {
        setProducts(data.products || [])
      }
    } catch (error) {
      console.error('Failed to fetch products:', error)
      showError('Failed to fetch products')
    } finally {
      setLoading(false)
    }
  }

  // Fetch categories
  const fetchCategories = async () => {
    try {
      const response = await fetch('/api/categories')
      const data = await response.json()
      if (response.ok) {
        setCategories(data.data || [])
      }
    } catch (error) {
      console.error('Failed to fetch categories:', error)
    }
  }

  // Fetch brands
  const fetchBrands = async () => {
    try {
      const response = await fetch('/api/brands')
      const data = await response.json()
      if (response.ok) {
        setBrands(data.data || [])
      }
    } catch (error) {
      console.error('Failed to fetch brands:', error)
    }
  }

  useEffect(() => {
    fetchProducts()
    fetchCategories()
    fetchBrands()
  }, [])

  // Filter products
  const filteredProducts = products.filter(product => {
    const searchLower = searchTerm.toLowerCase()
    const matchesSearch = !searchTerm || 
      product.name?.toLowerCase().includes(searchLower) ||
      product.model?.toLowerCase().includes(searchLower) ||
      product.sku?.toLowerCase().includes(searchLower)

    const matchesStatus = statusFilter === 'all' || product.status === statusFilter
    const matchesCategory = categoryFilter === 'all' || product.category?.name === categoryFilter

    return matchesSearch && matchesStatus && matchesCategory
  })

  // Handlers
  const handleLogout = async () => {
    try {
      await logout()
      router.push('/login')
    } catch (error) {
      console.error('Logout error:', error)
    }
  }

  const handleBack = () => {
    if (currentUser?.role === UserRole.SUPER_ADMIN) {
      router.push('/dashboard/admin')
    } else if (currentUser?.role === UserRole.SHOP_OWNER) {
      router.push('/dashboard/owner')
    } else {
      router.push('/dashboard/worker')
    }
  }

  const handleCreate = async () => {
    try {
      // Validate required fields
      if (!formData.name || !formData.model || !formData.categoryId || !formData.brandId) {
        showError('Please fill in all required fields')
        return
      }

      const costPrice = parseFloat(formData.costPrice)
      const sellingPrice = parseFloat(formData.sellingPrice)

      if (isNaN(costPrice) || costPrice <= 0) {
        showError('Please enter a valid cost price')
        return
      }

      if (isNaN(sellingPrice) || sellingPrice <= 0) {
        showError('Please enter a valid selling price')
        return
      }

      const response = await fetch('/api/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name,
          model: formData.model,
          barcode: formData.barcode || undefined,
          description: formData.description || undefined,
          categoryId: formData.categoryId,
          brandId: formData.brandId,
          costPrice: costPrice,
          sellingPrice: sellingPrice,
          lowStockThreshold: parseInt(formData.lowStockThreshold) || 5,
          initialStock: parseInt(formData.stock) || 0
        })
      })

      if (response.ok) {
        success('Product created successfully')
        setShowCreateDialog(false)
        resetForm()
        fetchProducts()
      } else {
        const data = await response.json()
        console.error('API Error:', data)
        throw new Error(data.error || data.details?.[0]?.message || 'Failed to create product')
      }
    } catch (error) {
      console.error('Create product error:', error)
      showError(error instanceof Error ? error.message : 'Failed to create product')
    }
  }

  const handleEdit = (product: Product) => {
    // Workers need approval for updates
    if (isWorker) {
      setApprovalRequest({
        type: 'UPDATE',
        tableName: 'Product',
        data: product,
        itemName: product.name
      })
      setShowApprovalDialog(true)
      return
    }

    // Owner can edit directly
    setSelectedProduct(product)
    setFormData({
      name: product.name,
      model: product.model,
      barcode: product.barcode || '',
      categoryId: (product.category as any)?.id || '',
      brandId: (product.brand as any)?.id || '',
      costPrice: product.costPrice.toString(),
      sellingPrice: product.sellingPrice.toString(),
      lowStockThreshold: product.lowStockThreshold.toString(),
      description: '',
      stock: product.stock?.toString() || '0'
    })
    setQuantityToAdd('') // Reset quantity to add
    setShowEditDialog(true)
  }

  const handleUpdate = async () => {
    if (!selectedProduct) return

    try {
      const response = await fetch(`/api/products/${selectedProduct.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name,
          model: formData.model,
          barcode: formData.barcode,
          description: formData.description,
          categoryId: formData.categoryId,
          brandId: formData.brandId,
          costPrice: parseFloat(formData.costPrice),
          sellingPrice: parseFloat(formData.sellingPrice),
          lowStockThreshold: parseInt(formData.lowStockThreshold) || 5,
          quantityToAdd: parseInt(quantityToAdd) || 0
        })
      })

      if (response.ok) {
        success('Product updated successfully')
        setShowEditDialog(false)
        setSelectedProduct(null)
        resetForm()
        fetchProducts()
      } else {
        const data = await response.json()
        throw new Error(data.error || 'Failed to update product')
      }
    } catch (error) {
      showError(error instanceof Error ? error.message : 'Failed to update product')
    }
  }

  const handleDelete = async (product: Product) => {
    // Workers need approval for deletes
    if (isWorker) {
      setApprovalRequest({
        type: 'DELETE',
        tableName: 'Product',
        data: product,
        itemName: product.name
      })
      setShowApprovalDialog(true)
      return
    }

    // Owner can delete directly (with confirmation)
    if (!window.confirm(`Delete ${product.name}?`)) return

    try {
      const response = await fetch(`/api/products/${product.id}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        success('Product deleted successfully')
        fetchProducts()
      } else {
        throw new Error('Failed to delete product')
      }
    } catch (error) {
      showError('Failed to delete product')
    }
  }

  const resetForm = () => {
    setFormData({
      name: '',
      model: '',
      barcode: '',
      categoryId: '',
      brandId: '',
      costPrice: '',
      sellingPrice: '',
      lowStockThreshold: '',
      description: '',
      stock: ''
    })
    setQuantityToAdd('')
  }

  // Brand handlers
  const handleCreateBrand = async () => {
    try {
      const response = await fetch('/api/brands', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          name: brandName,
          code: brandCode,
          description: brandDescription
        })
      })

      if (response.ok) {
        success('Brand created successfully')
        setShowCreateBrand(false)
        setBrandName('')
        setBrandCode('')
        setBrandDescription('')
        fetchBrands()
      } else {
        throw new Error('Failed to create brand')
      }
    } catch (error) {
      showError('Failed to create brand')
    }
  }

  const handleEditBrand = (brand: any) => {
    // Workers need approval for updates
    if (isWorker) {
      setApprovalRequest({
        type: 'UPDATE',
        tableName: 'Brand',
        data: brand,
        itemName: brand.name
      })
      setShowApprovalDialog(true)
      return
    }

    // Owner can edit directly
    setEditingBrand(brand)
    setBrandName(brand.name)
    setBrandCode(brand.code || '')
    setBrandDescription(brand.description || '')
    setShowEditBrand(true)
  }

  const handleUpdateBrand = async () => {
    if (!editingBrand) return

    try {
      const response = await fetch(`/api/brands/${editingBrand.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          name: brandName,
          code: brandCode,
          description: brandDescription
        })
      })

      if (response.ok) {
        success('Brand updated successfully')
        setShowEditBrand(false)
        setEditingBrand(null)
        setBrandName('')
        setBrandCode('')
        setBrandDescription('')
        fetchBrands()
      } else {
        throw new Error('Failed to update brand')
      }
    } catch (error) {
      console.error('Error updating brand:', error)
      showError('Failed to update brand')
    }
  }

  const handleDeleteBrand = async (brandId: string) => {
    const brand = brands.find(b => b.id === brandId)
    
    // Workers need approval for deletes
    if (isWorker) {
      setApprovalRequest({
        type: 'DELETE',
        tableName: 'Brand',
        data: { id: brandId },
        itemName: brand?.name || 'Brand'
      })
      setShowApprovalDialog(true)
      return
    }

    // Owner can delete directly
    if (!window.confirm('Delete this brand?')) return

    try {
      const response = await fetch(`/api/brands/${brandId}`, { method: 'DELETE' })
      if (response.ok) {
        success('Brand deleted successfully')
        fetchBrands()
      } else {
        throw new Error('Failed to delete brand')
      }
    } catch (error) {
      showError('Failed to delete brand')
    }
  }

  // Category handlers
  const handleCreateCategory = async () => {
    try {
      const response = await fetch('/api/categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          name: categoryName, 
          code: categoryCode,
          description: categoryDescription
        })
      })

      if (response.ok) {
        success('Category created successfully')
        setShowCreateCategory(false)
        setCategoryName('')
        setCategoryCode('')
        setCategoryDescription('')
        fetchCategories()
      } else {
        throw new Error('Failed to create category')
      }
    } catch (error) {
      showError('Failed to create category')
    }
  }

  const handleEditCategory = (category: any) => {
    // Workers need approval for updates
    if (isWorker) {
      setApprovalRequest({
        type: 'UPDATE',
        tableName: 'Category',
        data: category,
        itemName: category.name
      })
      setShowApprovalDialog(true)
      return
    }

    // Owner can edit directly
    setEditingCategory(category)
    setCategoryName(category.name)
    setCategoryCode(category.code || '')
    setCategoryDescription(category.description || '')
    setShowEditCategory(true)
  }

  const handleUpdateCategory = async () => {
    if (!editingCategory) return

    try {
      const response = await fetch(`/api/categories/${editingCategory.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          name: categoryName,
          code: categoryCode,
          description: categoryDescription
        })
      })

      if (response.ok) {
        success('Category updated successfully')
        setShowEditCategory(false)
        setEditingCategory(null)
        setCategoryName('')
        setCategoryCode('')
        setCategoryDescription('')
        fetchCategories()
      } else {
        throw new Error('Failed to update category')
      }
    } catch (error) {
      console.error('Error updating category:', error)
      showError('Failed to update category')
    }
  }

  const handleDeleteCategory = async (categoryId: string) => {
    const category = categories.find(c => c.id === categoryId)
    
    // Workers need approval for deletes
    if (isWorker) {
      setApprovalRequest({
        type: 'DELETE',
        tableName: 'Category',
        data: { id: categoryId },
        itemName: category?.name || 'Category'
      })
      setShowApprovalDialog(true)
      return
    }

    // Owner can delete directly
    if (!window.confirm('Delete this category?')) return

    try {
      const response = await fetch(`/api/categories/${categoryId}`, { method: 'DELETE' })
      if (response.ok) {
        success('Category deleted successfully')
        fetchCategories()
      } else {
        throw new Error('Failed to delete category')
      }
    } catch (error) {
      showError('Failed to delete category')
    }
  }

  // Approval submission handler
  const handleApprovalSubmit = async (reason: string) => {
    if (!approvalRequest) return

    try {
      const response = await fetch('/api/approvals/request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: approvalRequest.type,
          tableName: approvalRequest.tableName,
          recordId: approvalRequest.data?.id || null,
          requestData: approvalRequest.data,
          reason
        })
      })

      const result = await response.json()

      if (response.ok && result.success) {
        success('✅ Approval request submitted successfully! Your shop owner will review it.')
        setShowApprovalDialog(false)
        setApprovalRequest(null)
      } else {
        showError(result.error || 'Failed to submit approval request')
      }
    } catch (error) {
      console.error('Approval submission error:', error)
      showError('Failed to submit approval request')
    }
  }

  const getStockBadge = (stock: number, threshold: number) => {
    if (stock === 0) return { color: 'bg-red-100 text-red-800', label: 'Out of Stock' }
    if (stock <= threshold) return { color: 'bg-yellow-100 text-yellow-800', label: 'Low Stock' }
    return { color: 'bg-green-100 text-green-800', label: 'In Stock' }
  }

  // Import handlers
  const handleDownloadTemplate = async () => {
    try {
      const response = await fetch('/api/products/template')
      const result = await response.json()
      
      if (response.ok && result.success) {
        // Create download link
        const link = document.createElement('a')
        link.href = result.templateUrl
        link.download = 'product-import-template.csv'
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
        success('Template downloaded successfully')
      } else {
        showError(result.error || 'Failed to download template')
      }
    } catch (error) {
      console.error('Download template error:', error)
      showError('Failed to download template')
    }
  }

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      if (file.type === 'text/csv' || file.name.endsWith('.csv')) {
        setImportFile(file)
      } else {
        showError('Please select a CSV file')
      }
    }
  }

  const handleImport = async () => {
    if (!importFile) {
      showError('Please select a file to import')
      return
    }

    try {
      setImportLoading(true)
      console.log('🚀 Starting import process...')
      console.log('📁 File details:', {
        name: importFile.name,
        size: importFile.size,
        type: importFile.type
      })
      
      const formData = new FormData()
      formData.append('file', importFile)

      console.log('📤 Sending request to /api/products/import...')
      const response = await fetch('/api/products/import', {
        method: 'POST',
        body: formData
      })

      console.log('📥 Received response:', response.status, response.statusText)
      const result = await response.json()
      console.log('Import API Response:', response.status, result)

      if (response.ok && result.success) {
        setImportResults(result)
        success(result.message || `Successfully imported ${result.createdCount} products`)
        // Refresh the products list to show new products
        await fetchProducts()
        setImportFile(null)
        setShowImportDialog(false)
      } else {
        setImportResults(result)
        console.error('Import failed:', result)
        console.log('Import errors:', result.errors)
        const errorMessage = result.error || result.message || 'Import failed'
        const errorDetails = result.errors && result.errors.length > 0 
          ? `: ${result.errors.slice(0, 3).join('; ')}${result.errors.length > 3 ? '...' : ''}`
          : ''
        showError(errorMessage + errorDetails)
      }
    } catch (error) {
      showError('Failed to import products')
    } finally {
      setImportLoading(false)
    }
  }

  const stats = {
    total: products.length,
    active: products.filter(p => p.status === 'ACTIVE').length,
    inStock: products.filter(p => p.stock > p.lowStockThreshold).length,
    lowStock: products.filter(p => p.stock > 0 && p.stock <= p.lowStockThreshold).length,
    outOfStock: products.filter(p => p.stock === 0).length
  }

  return (
    <ProtectedRoute allowedRoles={[UserRole.SUPER_ADMIN, UserRole.SHOP_OWNER, UserRole.SHOP_WORKER]}>
      <div className="flex min-h-screen bg-gray-50 dark:bg-gray-900">
        {/* Sidebar */}
        <BusinessSidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
        
        {/* Main Content Area */}
        <div className={`flex-1 flex flex-col min-h-screen transition-all duration-300 ${sidebarOpen ? 'lg:ml-20' : 'lg:ml-64'}`}>
          {/* Top Navigation */}
          <TopNavigation onMenuClick={() => setSidebarOpen(!sidebarOpen)} />
          
          {/* Page Content */}
          <div className="flex-1 bg-gray-50 dark:bg-gray-900">
            {/* Header */}
            <div className="bg-gradient-to-r from-teal-600 to-teal-700 text-white">
              <div className="px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                  <div className="flex items-center gap-3 sm:gap-4 w-full sm:w-auto">
                    <button
                      onClick={handleBack}
                      className="p-2 sm:p-3 bg-white/10 hover:bg-white/20 rounded-xl transition-all duration-200 shrink-0"
                      title="Back"
                    >
                      <ArrowLeft className="h-5 w-5 text-white" />
                    </button>
                    <div className="min-w-0 flex-1">
                      <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold mb-1 sm:mb-2 truncate">📦 Product Management</h1>
                      <p className="text-teal-100 text-sm sm:text-base lg:text-lg">Manage your mobile phone inventory</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Content */}
            <div className="px-4 sm:px-6 lg:px-8 py-4 sm:py-6 lg:py-8 space-y-4 sm:space-y-6 lg:space-y-8">
              {/* Tabs for Products/Brands/Categories */}
              <Tabs defaultValue="products" className="w-full">
                <TabsList className="grid w-full grid-cols-3 max-w-full sm:max-w-md">
                  <TabsTrigger value="products" className="text-xs sm:text-sm">Products</TabsTrigger>
                  <TabsTrigger value="brands" className="text-xs sm:text-sm">Brands</TabsTrigger>
                  <TabsTrigger value="categories" className="text-xs sm:text-sm">Categories</TabsTrigger>
                </TabsList>

                {/* Products Tab */}
                <TabsContent value="products" className="space-y-4 sm:space-y-6 lg:space-y-8">
                  {/* Statistics */}
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4">
                    <Card className="bg-gradient-to-br from-teal-500 to-teal-600 text-white shadow-lg">
                      <CardContent className="p-4 sm:p-6">
                        <Package className="h-6 w-6 sm:h-8 sm:w-8 mb-2 text-white opacity-90" />
                        <p className="text-white opacity-90 text-xs sm:text-sm">Total Products</p>
                        <p className="text-2xl sm:text-3xl font-bold">{stats.total}</p>
                      </CardContent>
                    </Card>
                    <Card className="bg-gradient-to-br from-blue-500 to-blue-600 text-white shadow-lg">
                      <CardContent className="p-4 sm:p-6">
                        <CheckCircle className="h-6 w-6 sm:h-8 sm:w-8 mb-2 text-white opacity-90" />
                        <p className="text-white opacity-90 text-xs sm:text-sm">Active</p>
                        <p className="text-2xl sm:text-3xl font-bold">{stats.active}</p>
                      </CardContent>
                    </Card>
                    <Card className="bg-gradient-to-br from-green-500 to-green-600 text-white shadow-lg">
                      <CardContent className="p-4 sm:p-6">
                        <BarChart className="h-6 w-6 sm:h-8 sm:w-8 mb-2 text-white opacity-90" />
                        <p className="text-white opacity-90 text-xs sm:text-sm">In Stock</p>
                        <p className="text-2xl sm:text-3xl font-bold">{stats.inStock}</p>
                      </CardContent>
                    </Card>
                    <Card className="bg-gradient-to-br from-orange-500 to-orange-600 text-white shadow-lg col-span-2 sm:col-span-1">
                      <CardContent className="p-4 sm:p-6">
                        <AlertTriangle className="h-6 w-6 sm:h-8 sm:w-8 mb-2 text-white opacity-90" />
                        <p className="text-white opacity-90 text-xs sm:text-sm">Low Stock</p>
                        <p className="text-2xl sm:text-3xl font-bold">{stats.lowStock}</p>
                      </CardContent>
                    </Card>
                    <Card className="bg-gradient-to-br from-red-500 to-red-600 text-white shadow-lg col-span-2 sm:col-span-3 lg:col-span-1">
                      <CardContent className="p-4 sm:p-6">
                        <X className="h-6 w-6 sm:h-8 sm:w-8 mb-2 text-white opacity-90" />
                        <p className="text-white opacity-90 text-xs sm:text-sm">Out of Stock</p>
                        <p className="text-2xl sm:text-3xl font-bold">{stats.outOfStock}</p>
                      </CardContent>
                    </Card>
                  </div>

                  {/* Search and Filters */}
                  <Card>
                    <CardContent className="p-4 sm:p-6">
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                        <div className="relative sm:col-span-2">
                          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 dark:text-gray-500" />
                          <Input
                            type="text"
                            placeholder="Search products..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="Filter by status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="ACTIVE">Active</SelectItem>
                    <SelectItem value="INACTIVE">Inactive</SelectItem>
                    <SelectItem value="DISCONTINUED">Discontinued</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="Filter by category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Categories</SelectItem>
                    {categories.map(cat => (
                      <SelectItem key={cat.id} value={cat.name}>{cat.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Products List */}
          <Card>
            <CardContent className="p-4 sm:p-6">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-4 sm:mb-6">
                <div className="min-w-0 flex-1">
                  <h3 className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-white truncate">Product Catalog</h3>
                  <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">
                    Showing {filteredProducts.length} of {products.length} products
                  </p>
                </div>
                <div className="flex flex-wrap gap-2 w-full sm:w-auto">
                  {isOwner && (
                    <>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleDownloadTemplate}
                        className="flex items-center gap-1 sm:gap-2 h-8 px-2 sm:px-3 text-xs sm:text-sm"
                      >
                        <Download className="h-3 w-3 sm:h-4 sm:w-4" />
                        <span className="hidden sm:inline">Template</span>
                        <span className="sm:hidden">CSV</span>
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setShowImportDialog(true)}
                        className="flex items-center gap-1 sm:gap-2 h-8 px-2 sm:px-3 text-xs sm:text-sm"
                      >
                        <Upload className="h-3 w-3 sm:h-4 sm:w-4" />
                        Import
                      </Button>
                      <Button
                        onClick={() => setShowCreateDialog(true)}
                        className="flex items-center gap-1 sm:gap-2 h-8 px-2 sm:px-3 text-xs sm:text-sm"
                        size="sm"
                      >
                        <Plus className="h-3 w-3 sm:h-4 sm:w-4" />
                        <span className="hidden sm:inline">Add Product</span>
                        <span className="sm:hidden">Add</span>
                      </Button>
                    </>
                  )}
                  {isWorker && (
                    <div className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 italic py-2">
                      Contact shop owner to add or modify products
                    </div>
                  )}
                </div>
              </div>

              {loading ? (
                <div className="text-center py-12">
                  <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto" />
                  <p className="text-gray-600 dark:text-gray-400 mt-4">Loading products...</p>
                </div>
              ) : filteredProducts.length === 0 ? (
                <div className="text-center py-12">
                  <Package className="h-12 w-12 text-gray-400 dark:text-gray-500 mx-auto mb-4" />
                  <p className="text-gray-600 dark:text-gray-400">No products found</p>
                </div>
              ) : (
                <div className="grid gap-3 sm:gap-4">
                  {filteredProducts.map((product) => {
                    const stockBadge = getStockBadge(product.stock, product.lowStockThreshold)
                    return (
                      <div
                        key={product.id}
                        className="border border-gray-200 dark:border-gray-700 rounded-lg p-3 sm:p-4 hover:shadow-md transition-shadow"
                      >
                        <div className="flex flex-col sm:flex-row items-start justify-between gap-3 sm:gap-4">
                          <div className="flex items-start gap-3 sm:gap-4 flex-1 w-full">
                            <div className="w-12 h-12 sm:w-16 sm:h-16 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center shrink-0">
                              <Smartphone className="h-6 w-6 sm:h-8 sm:w-8 text-white" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2 mb-1">
                                <h4 className="font-semibold text-sm sm:text-base text-gray-900 dark:text-white truncate">{product.name}</h4>
                                <Badge className={`${stockBadge.color} text-xs shrink-0 w-fit`}>{stockBadge.label}</Badge>
                              </div>
                              <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 truncate">{product.model}</p>
                              <p className="text-xs text-gray-500 dark:text-gray-400">SKU: {product.sku}</p>
                              <div className="flex flex-wrap gap-1 sm:gap-2 mt-1 sm:mt-2">
                                {product.category && (
                                  <Badge variant="outline" className="text-xs">{product.category.name}</Badge>
                                )}
                                {product.brand && (
                                  <Badge variant="outline" className="text-xs">{product.brand.name}</Badge>
                                )}
                              </div>
                            </div>
                          </div>
                          <div className="w-full sm:w-auto sm:text-right flex sm:flex-col justify-between sm:justify-start gap-3 sm:gap-4">
                            <div className="flex-1 sm:flex-initial">
                              <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">Selling Price</p>
                              <p className="text-base sm:text-xl font-bold text-gray-900 dark:text-white">
                                PKR {product.sellingPrice.toLocaleString()}
                              </p>
                              <p className="text-xs text-gray-500 dark:text-gray-400">
                                Cost: PKR {product.costPrice.toLocaleString()}
                              </p>
                            </div>
                            <div className="flex-1 sm:flex-initial">
                              <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">Stock</p>
                              <p className="text-base sm:text-lg font-bold text-gray-900 dark:text-white">{product.stock} units</p>
                            </div>
                            {isOwner && (
                              <div className="flex sm:flex-row gap-2">
                                <button
                                  onClick={() => handleEdit(product)}
                                  className="p-1.5 sm:p-2 bg-blue-50 dark:bg-blue-900/20 hover:bg-blue-100 dark:hover:bg-blue-900/30 text-blue-700 dark:text-blue-400 rounded-lg transition-colors"
                                  title="Edit"
                                >
                                  <Edit3 className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                                </button>
                                <button
                                  onClick={() => handleDelete(product)}
                                  className="p-1.5 sm:p-2 bg-red-50 dark:bg-red-900/20 hover:bg-red-100 dark:hover:bg-red-900/30 text-red-700 dark:text-red-400 rounded-lg transition-colors"
                                  title="Delete"
                                >
                                  <Trash2 className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                                </button>
                              </div>
                            )}
                            {isWorker && (
                              <div className="text-xs text-gray-400 dark:text-gray-500 italic">
                                View only
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </CardContent>
          </Card>
          </TabsContent>

          {/* Brands Tab */}
          <TabsContent value="brands" className="space-y-6">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h3 className="text-xl font-semibold text-gray-900 dark:text-white">Brand Management</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Manage mobile phone brands</p>
                  </div>
                  <Button onClick={() => setShowCreateBrand(true)} className="gap-2 bg-blue-600 hover:bg-blue-700">
                    <Plus className="h-4 w-4" />
                    Add Brand
                  </Button>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {brands.map((brand) => (
                    <div key={brand.id} className="border border-gray-200 rounded-lg p-4 hover:border-teal-300 hover:shadow-md transition-all group">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 flex-1">
                          <Award className="h-5 w-5 text-teal-600" />
                          <div className="flex-1">
                            <span className="font-medium text-gray-900 dark:text-white">{brand.name}</span>
                            {brand.code && (
                              <p className="text-xs text-gray-500 dark:text-gray-400">{brand.code}</p>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => handleEditBrand(brand)}
                            className="opacity-0 group-hover:opacity-100 p-1 text-blue-600 hover:bg-blue-50 rounded transition-all"
                            title="Edit"
                          >
                            <Edit3 className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteBrand(brand.id)}
                            className="opacity-0 group-hover:opacity-100 p-1 text-red-600 hover:bg-red-50 rounded transition-all"
                            title="Delete"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {brands.length === 0 && (
                  <div className="text-center py-12">
                    <Award className="h-12 w-12 text-gray-400 dark:text-gray-500 mx-auto mb-4" />
                    <p className="text-gray-600 dark:text-gray-400">No brands found. Add your first brand.</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Categories Tab */}
          <TabsContent value="categories" className="space-y-6">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h3 className="text-xl font-semibold text-gray-900 dark:text-white">Category Management</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Organize products by categories</p>
                  </div>
                  <Button onClick={() => setShowCreateCategory(true)} className="gap-2 bg-blue-600 hover:bg-blue-700">
                    <Plus className="h-4 w-4" />
                    Add Category
                  </Button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {categories.map((category) => (
                    <div key={category.id} className="border border-gray-200 rounded-lg p-4 hover:border-teal-300 hover:shadow-md transition-all group">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3 flex-1">
                          <Tag className="h-5 w-5 text-teal-600" />
                          <div className="flex-1">
                            <p className="font-medium text-gray-900 dark:text-white">{category.name}</p>
                            <p className="text-xs text-gray-500 dark:text-gray-400">{category.code}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => handleEditCategory(category)}
                            className="opacity-0 group-hover:opacity-100 p-1 text-blue-600 hover:bg-blue-50 rounded transition-all"
                            title="Edit"
                          >
                            <Edit3 className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteCategory(category.id)}
                            className="opacity-0 group-hover:opacity-100 p-1 text-red-600 hover:bg-red-50 rounded transition-all"
                            title="Delete"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {categories.length === 0 && (
                  <div className="text-center py-12">
                    <Tag className="h-12 w-12 text-gray-400 dark:text-gray-500 mx-auto mb-4" />
                    <p className="text-gray-600 dark:text-gray-400">No categories found. Add your first category.</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
          </Tabs>
        </div>
        </div>

        {/* Create Product Dialog */}
        {showCreateDialog && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between sticky top-0 bg-white dark:bg-gray-800">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Add New Product</h3>
                <button onClick={() => setShowCreateDialog(false)} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full">
                  <X className="h-5 w-5" />
                </button>
              </div>
              <div className="p-6 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Product Name *</Label>
                    <Input value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} placeholder="iPhone 15 Pro Max" />
                  </div>
                  <div className="space-y-2">
                    <Label>Model *</Label>
                    <Input value={formData.model} onChange={(e) => setFormData({...formData, model: e.target.value})} placeholder="A2849" />
                  </div>
                  <div className="space-y-2">
                    <Label>Barcode</Label>
                    <Input value={formData.barcode} onChange={(e) => setFormData({...formData, barcode: e.target.value})} placeholder="Optional" />
                  </div>
                  <div className="space-y-2">
                    <Label>Category *</Label>
                    <Select value={formData.categoryId} onValueChange={(value) => setFormData({...formData, categoryId: value})}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select category" />
                      </SelectTrigger>
                      <SelectContent>
                        {categories.map(cat => (
                          <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Brand *</Label>
                    <Select value={formData.brandId} onValueChange={(value) => setFormData({...formData, brandId: value})}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select brand" />
                      </SelectTrigger>
                      <SelectContent>
                        {brands.map(brand => (
                          <SelectItem key={brand.id} value={brand.id}>{brand.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Cost Price (PKR) *</Label>
                    <Input type="number" value={formData.costPrice} onChange={(e) => setFormData({...formData, costPrice: e.target.value})} placeholder="350000" />
                  </div>
                  <div className="space-y-2">
                    <Label>Selling Price (PKR) *</Label>
                    <Input type="number" value={formData.sellingPrice} onChange={(e) => setFormData({...formData, sellingPrice: e.target.value})} placeholder="420000" />
                  </div>
                  <div className="space-y-2">
                    <Label>Initial Stock *</Label>
                    <Input type="number" value={formData.stock} onChange={(e) => setFormData({...formData, stock: e.target.value})} placeholder="10" />
                  </div>
                  <div className="space-y-2">
                    <Label>Low Stock Threshold *</Label>
                    <Input type="number" value={formData.lowStockThreshold} onChange={(e) => setFormData({...formData, lowStockThreshold: e.target.value})} placeholder="3" />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Description</Label>
                  <Textarea value={formData.description} onChange={(e) => setFormData({...formData, description: e.target.value})} placeholder="Product description..." rows={3} />
                </div>
              </div>
              <div className="p-6 border-t border-gray-200 bg-gray-50 flex gap-3">
                <Button variant="outline" onClick={() => setShowCreateDialog(false)} className="flex-1">Cancel</Button>
                <Button onClick={handleCreate} className="flex-1 bg-blue-600 hover:bg-blue-700">Create Product</Button>
              </div>
            </div>
          </div>
        )}

        {/* Edit Product Dialog */}
        {showEditDialog && selectedProduct && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between sticky top-0 bg-white dark:bg-gray-800">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Edit Product</h3>
                <button onClick={() => {setShowEditDialog(false); setSelectedProduct(null); resetForm()}} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full">
                  <X className="h-5 w-5" />
                </button>
              </div>
              <div className="p-6 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Product Name *</Label>
                    <Input value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} />
                  </div>
                  <div className="space-y-2">
                    <Label>Model *</Label>
                    <Input value={formData.model} onChange={(e) => setFormData({...formData, model: e.target.value})} />
                  </div>
                  <div className="space-y-2">
                    <Label>Cost Price (PKR) *</Label>
                    <Input type="number" value={formData.costPrice} onChange={(e) => setFormData({...formData, costPrice: e.target.value})} />
                  </div>
                  <div className="space-y-2">
                    <Label>Selling Price (PKR) *</Label>
                    <Input type="number" value={formData.sellingPrice} onChange={(e) => setFormData({...formData, sellingPrice: e.target.value})} />
                  </div>
                  <div className="space-y-2">
                    <Label>Low Stock Threshold *</Label>
                    <Input type="number" value={formData.lowStockThreshold} onChange={(e) => setFormData({...formData, lowStockThreshold: e.target.value})} />
                  </div>
                  <div className="space-y-2">
                    <Label>Current Stock</Label>
                    <div className="p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                      <span className="text-lg font-semibold text-gray-900 dark:text-white">{selectedProduct?.stock || 0} units</span>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Add Stock</Label>
                    <Input 
                      type="number" 
                      value={quantityToAdd} 
                      onChange={(e) => setQuantityToAdd(e.target.value)} 
                      placeholder="Enter quantity to add"
                      min="0"
                    />
                    <p className="text-xs text-gray-500 dark:text-gray-400">Enter the number of units to add to current stock</p>
                  </div>
                </div>
              </div>
              <div className="p-6 border-t border-gray-200 bg-gray-50 flex gap-3">
                <Button variant="outline" onClick={() => {setShowEditDialog(false); setSelectedProduct(null); resetForm()}} className="flex-1">Cancel</Button>
                <Button onClick={handleUpdate} className="flex-1 bg-blue-600 hover:bg-blue-700">Update Product</Button>
              </div>
            </div>
          </div>
        )}

        {/* Create Brand Dialog */}
        {showCreateBrand && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-xl shadow-2xl max-w-md w-full">
              <div className="p-6 border-b border-gray-200 flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900">Add New Brand</h3>
                <button onClick={() => {setShowCreateBrand(false); setBrandName(''); setBrandCode(''); setBrandDescription('')}} className="p-2 hover:bg-gray-100 rounded-full">
                  <X className="h-5 w-5" />
                </button>
              </div>
              <div className="p-6 space-y-4">
                <div className="space-y-2">
                  <Label>Brand Name *</Label>
                  <Input
                    value={brandName}
                    onChange={(e) => setBrandName(e.target.value)}
                    placeholder="e.g., Samsung, Apple, Xiaomi"
                    autoFocus
                  />
                </div>
                <div className="space-y-2">
                  <Label>Brand Code *</Label>
                  <Input
                    value={brandCode}
                    onChange={(e) => setBrandCode(e.target.value.toUpperCase())}
                    placeholder="e.g., SAMSUNG, APPLE, XIAOMI"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Description</Label>
                  <Textarea
                    value={brandDescription}
                    onChange={(e) => setBrandDescription(e.target.value)}
                    placeholder="Brief description of this brand"
                    rows={3}
                  />
                </div>
              </div>
              <div className="p-6 border-t border-gray-200 bg-gray-50 flex gap-3">
                <Button variant="outline" onClick={() => {setShowCreateBrand(false); setBrandName(''); setBrandCode(''); setBrandDescription('')}} className="flex-1">
                  Cancel
                </Button>
                <Button onClick={handleCreateBrand} disabled={!brandName || !brandCode} className="flex-1 bg-blue-600 hover:bg-blue-700">
                  Create Brand
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Create Category Dialog */}
        {showCreateCategory && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-xl shadow-2xl max-w-md w-full">
              <div className="p-6 border-b border-gray-200 flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900">Add New Category</h3>
                <button onClick={() => {setShowCreateCategory(false); setCategoryName(''); setCategoryCode(''); setCategoryDescription('')}} className="p-2 hover:bg-gray-100 rounded-full">
                  <X className="h-5 w-5" />
                </button>
              </div>
              <div className="p-6 space-y-4">
                <div className="space-y-2">
                  <Label>Category Name *</Label>
                  <Input
                    value={categoryName}
                    onChange={(e) => setCategoryName(e.target.value)}
                    placeholder="e.g., Smartphones, Accessories"
                    autoFocus
                  />
                </div>
                <div className="space-y-2">
                  <Label>Category Code *</Label>
                  <Input
                    value={categoryCode}
                    onChange={(e) => setCategoryCode(e.target.value.toUpperCase())}
                    placeholder="e.g., SMARTPHONE, ACCESSORIES"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Description</Label>
                  <Textarea
                    value={categoryDescription}
                    onChange={(e) => setCategoryDescription(e.target.value)}
                    placeholder="Brief description of this category"
                    rows={3}
                  />
                </div>
              </div>
              <div className="p-6 border-t border-gray-200 bg-gray-50 flex gap-3">
                <Button variant="outline" onClick={() => {setShowCreateCategory(false); setCategoryName(''); setCategoryCode(''); setCategoryDescription('')}} className="flex-1">
                  Cancel
                </Button>
                <Button onClick={handleCreateCategory} disabled={!categoryName || !categoryCode} className="flex-1 bg-purple-600 hover:bg-purple-700">
                  Create Category
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Edit Brand Dialog */}
        {showEditBrand && editingBrand && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-xl shadow-2xl max-w-md w-full">
              <div className="p-6 border-b border-gray-200 flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900">Edit Brand</h3>
                <button onClick={() => {setShowEditBrand(false); setEditingBrand(null); setBrandName(''); setBrandCode(''); setBrandDescription('')}} className="p-2 hover:bg-gray-100 rounded-full">
                  <X className="h-5 w-5" />
                </button>
              </div>
              <div className="p-6 space-y-4">
                <div className="space-y-2">
                  <Label>Brand Name *</Label>
                  <Input
                    value={brandName}
                    onChange={(e) => setBrandName(e.target.value)}
                    placeholder="e.g., Samsung, Apple, Xiaomi"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Brand Code *</Label>
                  <Input
                    value={brandCode}
                    onChange={(e) => setBrandCode(e.target.value.toUpperCase())}
                    placeholder="e.g., SAMSUNG, APPLE, XIAOMI"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Description</Label>
                  <Textarea
                    value={brandDescription}
                    onChange={(e) => setBrandDescription(e.target.value)}
                    placeholder="Brief description of this brand"
                    rows={3}
                  />
                </div>
              </div>
              <div className="p-6 border-t border-gray-200 bg-gray-50 flex gap-3">
                <Button variant="outline" onClick={() => {setShowEditBrand(false); setEditingBrand(null); setBrandName(''); setBrandCode(''); setBrandDescription('')}} className="flex-1">
                  Cancel
                </Button>
                <Button onClick={handleUpdateBrand} disabled={!brandName || !brandCode} className="flex-1 bg-blue-600 hover:bg-blue-700">
                  Update Brand
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Edit Category Dialog */}
        {showEditCategory && editingCategory && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-xl shadow-2xl max-w-md w-full">
              <div className="p-6 border-b border-gray-200 flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900">Edit Category</h3>
                <button onClick={() => {setShowEditCategory(false); setEditingCategory(null); setCategoryName(''); setCategoryCode(''); setCategoryDescription('')}} className="p-2 hover:bg-gray-100 rounded-full">
                  <X className="h-5 w-5" />
                </button>
              </div>
              <div className="p-6 space-y-4">
                <div className="space-y-2">
                  <Label>Category Name *</Label>
                  <Input
                    value={categoryName}
                    onChange={(e) => setCategoryName(e.target.value)}
                    placeholder="e.g., Smartphones, Accessories"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Category Code *</Label>
                  <Input
                    value={categoryCode}
                    onChange={(e) => setCategoryCode(e.target.value.toUpperCase())}
                    placeholder="e.g., SMARTPHONE, ACCESSORIES"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Description</Label>
                  <Textarea
                    value={categoryDescription}
                    onChange={(e) => setCategoryDescription(e.target.value)}
                    placeholder="Brief description of this category"
                    rows={3}
                  />
                </div>
              </div>
              <div className="p-6 border-t border-gray-200 bg-gray-50 flex gap-3">
                <Button variant="outline" onClick={() => {setShowEditCategory(false); setEditingCategory(null); setCategoryName(''); setCategoryCode(''); setCategoryDescription('')}} className="flex-1">
                  Cancel
                </Button>
                <Button onClick={handleUpdateCategory} disabled={!categoryName || !categoryCode} className="flex-1 bg-purple-600 hover:bg-purple-700">
                  Update Category
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Import Products Dialog */}
        {showImportDialog && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6 border-b border-gray-200 flex items-center justify-between sticky top-0 bg-white">
                <h3 className="text-lg font-semibold text-gray-900">Import Products from CSV</h3>
                <button onClick={() => {setShowImportDialog(false); setImportFile(null); setImportResults(null)}} className="p-2 hover:bg-gray-100 rounded-full">
                  <X className="h-5 w-5" />
                </button>
              </div>
              <div className="p-6 space-y-6">
                {/* Instructions */}
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <h4 className="font-semibold text-blue-900 mb-2">Import Instructions</h4>
                  <ul className="text-sm text-blue-800 space-y-1">
                    <li>• Download the template CSV file first</li>
                    <li>• Fill in your product data following the template format</li>
                    <li>• Required fields: name, model, sku, costPrice, sellingPrice, category, brand</li>
                    <li>• SKUs must be unique within your shop</li>
                    <li>• Prices should be in PKR (no currency symbols)</li>
                    <li>• Categories and brands will be created automatically if they don't exist</li>
                  </ul>
                </div>

                {/* Template Download */}
                <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                  <div className="flex items-center gap-3">
                    <FileSpreadsheet className="h-8 w-8 text-green-600" />
                    <div>
                      <p className="font-medium text-gray-900">Download Template</p>
                      <p className="text-sm text-gray-600">Get the CSV template with sample data</p>
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    onClick={handleDownloadTemplate}
                    className="flex items-center gap-2"
                  >
                    <Download className="h-4 w-4" />
                    Download
                  </Button>
                </div>

                {/* File Upload */}
                <div className="space-y-4">
                  <Label>Select CSV File</Label>
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                    <Upload className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    {importFile ? (
                      <div>
                        <p className="text-sm font-medium text-gray-900">{importFile.name}</p>
                        <p className="text-xs text-gray-500">{(importFile.size / 1024).toFixed(1)} KB</p>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setImportFile(null)}
                          className="mt-2"
                        >
                          Remove File
                        </Button>
                      </div>
                    ) : (
                      <div>
                        <p className="text-sm text-gray-600 mb-2">Click to select or drag and drop</p>
                        <input
                          type="file"
                          accept=".csv"
                          onChange={handleFileSelect}
                          className="hidden"
                          id="csv-upload"
                        />
                        <Button
                          variant="outline"
                          onClick={() => document.getElementById('csv-upload')?.click()}
                        >
                          Select File
                        </Button>
                      </div>
                    )}
                  </div>
                </div>

                {/* Import Results */}
                {importResults && (
                  <div className={`p-4 rounded-lg border ${
                    importResults.success ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'
                  }`}>
                    <div className="flex items-center gap-2 mb-2">
                      {importResults.success ? (
                        <CheckCircle className="h-5 w-5 text-green-600" />
                      ) : (
                        <AlertTriangle className="h-5 w-5 text-red-600" />
                      )}
                      <h4 className={`font-semibold ${
                        importResults.success ? 'text-green-900' : 'text-red-900'
                      }`}>
                        {importResults.success ? 'Import Successful' : 'Import Failed'}
                      </h4>
                    </div>
                    <p className={`text-sm ${
                      importResults.success ? 'text-green-800' : 'text-red-800'
                    }`}>
                      {importResults.message}
                    </p>
                    {importResults.details && Array.isArray(importResults.details) && (
                      <div className="mt-3">
                        <p className="text-sm font-medium mb-2">Errors:</p>
                        <ul className="text-xs space-y-1 max-h-32 overflow-y-auto">
                          {importResults.details.map((error: string, index: number) => (
                            <li key={index} className="text-red-700">• {error}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                )}

                {/* Action Buttons */}
                <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
                  <Button
                    variant="outline"
                    onClick={() => {setShowImportDialog(false); setImportFile(null); setImportResults(null)}}
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleImport}
                    disabled={!importFile || importLoading}
                    className="flex items-center gap-2"
                  >
                    {importLoading ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        Importing...
                      </>
                    ) : (
                      <>
                        <Upload className="h-4 w-4" />
                        Import Products
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Approval Request Dialog */}
        <ApprovalRequestDialog
          open={showApprovalDialog}
          onOpenChange={setShowApprovalDialog}
          requestType={approvalRequest?.type}
          tableName={approvalRequest?.tableName}
          recordData={approvalRequest?.data}
          onSubmit={handleApprovalSubmit}
        />
        </div>
      </div>
    </ProtectedRoute>
  )
}

// Wrap with ShiftGuard for workers
function ProductManagementPageWithShiftGuard() {
  const { user } = useAuth()
  
  if (user?.role === UserRole.SHOP_WORKER) {
    return (
      <ShiftGuard>
        <ProductManagementPage />
      </ShiftGuard>
    )
  }
  
  return <ProductManagementPage />
}

export default ProductManagementPageWithShiftGuard

'use client'

import React, { useState, useEffect, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { useQuery, useQueryClient } from '@tanstack/react-query'
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
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog'
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
  FileSpreadsheet,
  Info,
  ChevronDown,
  ChevronUp,
  HelpCircle
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
  category?: { id: string; name: string; code: string }
  brand?: { id: string; name: string; code: string }
  createdAt: string
}

interface Category {
  id: string
  name: string
  code: string
  description?: string
  isActive: boolean
  _count?: {
    products: number
  }
}

interface Brand {
  id: string
  name: string
  code: string
  description?: string
  isActive: boolean
  _count?: {
    products: number
  }
}

function ProductManagementPage() {
  const router = useRouter()
  const { user: currentUser, logout } = useAuth()
  const { success, error: showError } = useNotify()
  const queryClient = useQueryClient()

  // Check if user is owner (can perform all actions)
  const isOwner = currentUser?.role === UserRole.SHOP_OWNER || currentUser?.role === UserRole.SUPER_ADMIN
  const isWorker = currentUser?.role === UserRole.SHOP_WORKER

  // State
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [categoryFilter, setCategoryFilter] = useState<string>('all')
  const [page, setPage] = useState(1)
  const [limit] = useState(50) // 50 products per page
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

  // Delete confirmation dialogs
  const [showDeleteProductDialog, setShowDeleteProductDialog] = useState(false)
  const [showDeleteBrandDialog, setShowDeleteBrandDialog] = useState(false)
  const [showDeleteCategoryDialog, setShowDeleteCategoryDialog] = useState(false)
  const [productToDelete, setProductToDelete] = useState<Product | null>(null)
  const [brandToDelete, setBrandToDelete] = useState<Brand | null>(null)
  const [categoryToDelete, setCategoryToDelete] = useState<Category | null>(null)
  const [deleteLoading, setDeleteLoading] = useState(false)

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
  const [showFieldGuide, setShowFieldGuide] = useState(false)

  // Build query params for products
  const productsQueryParams = useMemo(() => {
    const params = new URLSearchParams()
    params.append('page', page.toString())
    params.append('limit', limit.toString())
    if (statusFilter !== 'all') params.append('status', statusFilter)
    if (categoryFilter !== 'all') params.append('category', categoryFilter)
    if (searchTerm) params.append('search', searchTerm)
    return params.toString()
  }, [page, limit, statusFilter, categoryFilter, searchTerm])

  // Fetch products with React Query
  const {
    data: productsData,
    isLoading: productsLoading,
    error: productsError
  } = useQuery({
    queryKey: ['products', page, limit, statusFilter, categoryFilter, searchTerm],
    queryFn: async () => {
      const response = await fetch(`/api/products?${productsQueryParams}`)
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to fetch products')
      }
      return response.json()
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  })

  // Fetch categories with React Query
  const { data: categoriesData } = useQuery({
    queryKey: ['categories'],
    queryFn: async () => {
      const response = await fetch('/api/categories')
      if (!response.ok) throw new Error('Failed to fetch categories')
      const data = await response.json()
      return data.data || []
    },
    staleTime: 0, // Always refetch on invalidation (categories can be auto-created during import)
  })

  // Fetch brands with React Query
  const { data: brandsData } = useQuery({
    queryKey: ['brands'],
    queryFn: async () => {
      const response = await fetch('/api/brands')
      if (!response.ok) throw new Error('Failed to fetch brands')
      const data = await response.json()
      return data.data || []
    },
    staleTime: 0, // Always refetch on invalidation (brands can be auto-created during import)
  })

  // Extract data from queries
  const products = productsData?.products || []
  const categories = categoriesData || []
  const brands = brandsData || []
  const loading = productsLoading
  const pagination = productsData?.pagination

  // Handle errors
  useEffect(() => {
    if (productsError) {
      showError('Failed to fetch products')
    }
  }, [productsError, showError])

  // Reset to page 1 when filters change
  useEffect(() => {
    setPage(1)
  }, [statusFilter, categoryFilter, searchTerm])

  // Server-side filtering is now handled by the API, no need for client-side filtering

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
        // Invalidate products query to refetch
        queryClient.invalidateQueries({ queryKey: ['products'] })
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
        // Invalidate products query to refetch
        queryClient.invalidateQueries({ queryKey: ['products'] })
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
    setProductToDelete(product)
    setShowDeleteProductDialog(true)
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
        queryClient.invalidateQueries({ queryKey: ['brands'] })
      } else {
        throw new Error('Failed to create brand')
      }
    } catch (error) {
      showError('Failed to create brand')
    }
  }

  const handleEditBrand = (brand: Brand) => {
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
        queryClient.invalidateQueries({ queryKey: ['brands'] })
      } else {
        throw new Error('Failed to update brand')
      }
    } catch (error) {
      console.error('Error updating brand:', error)
      showError('Failed to update brand')
    }
  }

  const handleDeleteBrand = async (brandId: string) => {
    const brand = brands.find((b: Brand) => b.id === brandId)
    
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
    if (brand) {
      setBrandToDelete(brand)
      setShowDeleteBrandDialog(true)
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
        queryClient.invalidateQueries({ queryKey: ['categories'] })
      } else {
        throw new Error('Failed to create category')
      }
    } catch (error) {
      showError('Failed to create category')
    }
  }

  const handleEditCategory = (category: Category) => {
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
        queryClient.invalidateQueries({ queryKey: ['categories'] })
      } else {
        throw new Error('Failed to update category')
      }
    } catch (error) {
      console.error('Error updating category:', error)
      showError('Failed to update category')
    }
  }

  const handleDeleteCategory = async (categoryId: string) => {
    const category = categories.find((c: Category) => c.id === categoryId)
    
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
    if (category) {
      setCategoryToDelete(category)
      setShowDeleteCategoryDialog(true)
    }
  }

  // Delete confirmation handlers
  const handleDeleteProductConfirm = async () => {
    if (!productToDelete) return
    
    setDeleteLoading(true)
    try {
      const response = await fetch(`/api/products/${productToDelete.id}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        success('Product deleted successfully')
        queryClient.invalidateQueries({ queryKey: ['products'] })
        setShowDeleteProductDialog(false)
        setProductToDelete(null)
      } else {
        const data = await response.json()
        throw new Error(data.error || 'Failed to delete product')
      }
    } catch (error) {
      showError(error instanceof Error ? error.message : 'Failed to delete product')
    } finally {
      setDeleteLoading(false)
    }
  }

  const handleDeleteBrandConfirm = async () => {
    if (!brandToDelete) return
    
    setDeleteLoading(true)
    try {
      const response = await fetch(`/api/brands/${brandToDelete.id}`, { method: 'DELETE' })
      if (response.ok) {
        success('Brand deleted successfully')
        queryClient.invalidateQueries({ queryKey: ['brands'] })
        setShowDeleteBrandDialog(false)
        setBrandToDelete(null)
      } else {
        const data = await response.json()
        throw new Error(data.error || 'Failed to delete brand')
      }
    } catch (error) {
      showError(error instanceof Error ? error.message : 'Failed to delete brand')
    } finally {
      setDeleteLoading(false)
    }
  }

  const handleDeleteCategoryConfirm = async () => {
    if (!categoryToDelete) return
    
    setDeleteLoading(true)
    try {
      const response = await fetch(`/api/categories/${categoryToDelete.id}`, { method: 'DELETE' })
      if (response.ok) {
        success('Category deleted successfully')
        queryClient.invalidateQueries({ queryKey: ['categories'] })
        setShowDeleteCategoryDialog(false)
        setCategoryToDelete(null)
      } else {
        const data = await response.json()
        throw new Error(data.error || 'Failed to delete category')
      }
    } catch (error) {
      showError(error instanceof Error ? error.message : 'Failed to delete category')
    } finally {
      setDeleteLoading(false)
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
        // Invalidate all related queries to refetch products, categories, and brands
        queryClient.invalidateQueries({ queryKey: ['products'] })
        queryClient.invalidateQueries({ queryKey: ['categories'] })
        queryClient.invalidateQueries({ queryKey: ['brands'] })
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
    active: products.filter((p: { status: string }) => p.status === 'ACTIVE').length,
    inStock: products.filter((p: { stock: number; lowStockThreshold: number }) => p.stock > p.lowStockThreshold).length,
    lowStock: products.filter((p: { stock: number; lowStockThreshold: number }) => p.stock > 0 && p.stock <= p.lowStockThreshold).length,
    outOfStock: products.filter((p: { stock: number }) => p.stock === 0).length
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
                    Showing {products.length} of {pagination?.totalCount || 0} products
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
              ) : products.length === 0 ? (
                <div className="text-center py-12">
                  <Package className="h-12 w-12 text-gray-400 dark:text-gray-500 mx-auto mb-4" />
                  <p className="text-gray-600 dark:text-gray-400">No products found</p>
                </div>
              ) : (
                <div className="grid gap-3 sm:gap-4">
                  {products.map((product) => {
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

              {/* Pagination Controls */}
              {pagination && pagination.totalPages > 1 && (
                <div className="mt-6 flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    Showing {((pagination.page - 1) * pagination.limit) + 1} to {Math.min(pagination.page * pagination.limit, pagination.totalCount)} of {pagination.totalCount} products
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage(p => Math.max(1, p - 1))}
                      disabled={!pagination.hasPreviousPage}
                    >
                      Previous
                    </Button>
                    <div className="flex items-center gap-1">
                      {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => {
                        let pageNum: number
                        if (pagination.totalPages <= 5) {
                          pageNum = i + 1
                        } else if (pagination.page <= 3) {
                          pageNum = i + 1
                        } else if (pagination.page >= pagination.totalPages - 2) {
                          pageNum = pagination.totalPages - 4 + i
                        } else {
                          pageNum = pagination.page - 2 + i
                        }
                        return (
                          <Button
                            key={pageNum}
                            variant={pagination.page === pageNum ? "default" : "outline"}
                            size="sm"
                            onClick={() => setPage(pageNum)}
                            className="min-w-[40px]"
                          >
                            {pageNum}
                          </Button>
                        )
                      })}
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage(p => Math.min(pagination.totalPages, p + 1))}
                      disabled={!pagination.hasNextPage}
                    >
                      Next
                    </Button>
                  </div>
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
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between sticky top-0 bg-white dark:bg-gray-800">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Import Products from CSV</h3>
                <button 
                  onClick={() => {
                    setShowImportDialog(false)
                    setImportFile(null)
                    setImportResults(null)
                    setShowFieldGuide(false)
                  }} 
                  className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
              <div className="p-6 space-y-6">
                {/* Quick Instructions */}
                <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                  <h4 className="font-semibold text-blue-900 dark:text-blue-100 mb-2 flex items-center gap-2">
                    <Info className="h-5 w-5" />
                    Quick Start Guide
                  </h4>
                  <ul className="text-sm text-blue-800 dark:text-blue-200 space-y-2">
                    <li className="flex items-start gap-2">
                      <span className="font-medium min-w-[20px]">1.</span>
                      <div className="flex-1">
                        <span className="font-medium">Download template</span> - Click the button below to get the CSV template
                      </div>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="font-medium min-w-[20px]">2.</span>
                      <div className="flex-1">
                        <span className="font-medium">Fill your data</span> - Add your products following the column format
                      </div>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="font-medium min-w-[20px]">3.</span>
                      <div className="flex-1">
                        <span className="font-medium">Upload file</span> - Select your completed CSV file
                      </div>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="font-medium min-w-[20px]">4.</span>
                      <div className="flex-1">
                        <span className="font-medium">Import</span> - Review and import your products
                      </div>
                    </li>
                  </ul>
                  <div className="mt-3 pt-3 border-t border-blue-200 dark:border-blue-800">
                    <p className="text-xs text-blue-700 dark:text-blue-300 flex items-center gap-1">
                      <HelpCircle className="h-3 w-3" />
                      <span>Expand "Column Reference Guide" below for detailed field explanations</span>
                    </p>
                  </div>
                </div>

                {/* Detailed Column Guide - Expandable */}
                <div className="border border-gray-300 dark:border-gray-700 rounded-lg overflow-hidden">
                  <button 
                    onClick={() => setShowFieldGuide(!showFieldGuide)}
                    className="w-full p-4 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      <FileSpreadsheet className="h-5 w-5 text-teal-600" />
                      <span className="font-semibold text-gray-900 dark:text-gray-100">Column Reference Guide</span>
                      <Badge variant="outline" className="ml-2">16 columns</Badge>
                    </div>
                    {showFieldGuide ? <ChevronUp className="h-5 w-5 text-gray-500" /> : <ChevronDown className="h-5 w-5 text-gray-500" />}
                  </button>
                  
                  {showFieldGuide && (
                    <div className="border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
                      <div className="p-4 max-h-96 overflow-y-auto space-y-4">
                        {/* Required Fields Section */}
                        <div>
                          <h5 className="font-semibold text-sm text-gray-900 dark:text-gray-100 mb-3 flex items-center gap-2">
                            <span className="w-2 h-2 bg-red-500 rounded-full"></span>
                            Required Fields
                          </h5>
                          <div className="space-y-3">
                            {/* Name */}
                            <div className="bg-white dark:bg-gray-900 p-3 rounded border border-gray-200 dark:border-gray-700">
                              <div className="flex items-start justify-between mb-1">
                                <span className="font-medium text-sm text-gray-900 dark:text-gray-100">name</span>
                                <Badge variant="destructive" className="text-xs">Required</Badge>
                              </div>
                              <p className="text-xs text-gray-600 dark:text-gray-400 mb-2">Product display name</p>
                              <div className="text-xs space-y-1">
                                <p><span className="font-medium text-gray-700 dark:text-gray-300">Format:</span> Text (max 255 characters)</p>
                                <p className="text-green-700 dark:text-green-400"><span className="font-medium">✓ Valid:</span> "iPhone 15 Pro Max", "Samsung Charger"</p>
                                <p className="text-red-700 dark:text-red-400"><span className="font-medium">✗ Invalid:</span> "" (empty)</p>
                              </div>
                            </div>

                            {/* Model */}
                            <div className="bg-white dark:bg-gray-900 p-3 rounded border border-gray-200 dark:border-gray-700">
                              <div className="flex items-start justify-between mb-1">
                                <span className="font-medium text-sm text-gray-900 dark:text-gray-100">model</span>
                                <Badge variant="destructive" className="text-xs">Required</Badge>
                              </div>
                              <p className="text-xs text-gray-600 dark:text-gray-400 mb-2">Product model or variant</p>
                              <div className="text-xs space-y-1">
                                <p className="text-green-700 dark:text-green-400"><span className="font-medium">✓ Valid:</span> "Pro Max 256GB", "Ultra"</p>
                              </div>
                            </div>

                            {/* SKU */}
                            <div className="bg-white dark:bg-gray-900 p-3 rounded border border-gray-200 dark:border-gray-700">
                              <div className="flex items-start justify-between mb-1">
                                <span className="font-medium text-sm text-gray-900 dark:text-gray-100">sku</span>
                                <Badge className="text-xs bg-orange-500">Auto-generated if blank</Badge>
                              </div>
                              <p className="text-xs text-gray-600 dark:text-gray-400 mb-2">Stock Keeping Unit - unique product identifier</p>
                              <div className="text-xs space-y-1">
                                <p><span className="font-medium text-gray-700 dark:text-gray-300">Validation:</span> Must be unique within your shop</p>
                                <p className="text-green-700 dark:text-green-400"><span className="font-medium">✓ Valid:</span> "APP-IP15-256"</p>
                                <p className="text-blue-700 dark:text-blue-400"><span className="font-medium">💡 Tip:</span> Leave blank to auto-generate</p>
                              </div>
                            </div>

                            {/* Category & Brand */}
                            <div className="bg-white dark:bg-gray-900 p-3 rounded border border-gray-200 dark:border-gray-700">
                              <div className="flex items-start justify-between mb-1">
                                <span className="font-medium text-sm text-gray-900 dark:text-gray-100">category & brand</span>
                                <Badge variant="destructive" className="text-xs">Required</Badge>
                              </div>
                              <p className="text-xs text-gray-600 dark:text-gray-400 mb-2">Will be created automatically if they don't exist</p>
                              <div className="text-xs space-y-1">
                                <p className="text-green-700 dark:text-green-400"><span className="font-medium">✓ Valid:</span> "Smartphones", "Apple"</p>
                                <p className="text-blue-700 dark:text-blue-400"><span className="font-medium">💡 Tip:</span> Use consistent naming</p>
                              </div>
                            </div>

                            {/* Prices */}
                            <div className="bg-white dark:bg-gray-900 p-3 rounded border border-gray-200 dark:border-gray-700">
                              <div className="flex items-start justify-between mb-1">
                                <span className="font-medium text-sm text-gray-900 dark:text-gray-100">costPrice & sellingPrice</span>
                                <Badge variant="destructive" className="text-xs">Required</Badge>
                              </div>
                              <p className="text-xs text-gray-600 dark:text-gray-400 mb-2">In PKR (no currency symbols)</p>
                              <div className="text-xs space-y-1">
                                <p><span className="font-medium text-gray-700 dark:text-gray-300">Validation:</span> sellingPrice must be ≥ costPrice</p>
                                <p className="text-green-700 dark:text-green-400"><span className="font-medium">✓ Valid:</span> 390000, 420000</p>
                                <p className="text-red-700 dark:text-red-400"><span className="font-medium">✗ Invalid:</span> "Rs 390000", 0, -100</p>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Optional Fields Section */}
                        <div>
                          <h5 className="font-semibold text-sm text-gray-900 dark:text-gray-100 mb-3 flex items-center gap-2">
                            <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                            Optional Fields
                          </h5>
                          <div className="bg-white dark:bg-gray-900 p-3 rounded border border-gray-200 dark:border-gray-700">
                            <div className="text-xs space-y-2">
                              <div><span className="font-medium">barcode:</span> Auto-generated if blank (8-14 digits)</div>
                              <div><span className="font-medium">description:</span> Product details</div>
                              <div><span className="font-medium">stock:</span> Initial quantity (default: 1)</div>
                              <div><span className="font-medium">type:</span> MOBILE_PHONE, ACCESSORY, SIM_CARD, SERVICE</div>
                              <div><span className="font-medium">lowStockThreshold:</span> Alert level (default: 5)</div>
                              <div><span className="font-medium">warranty:</span> Months (default: 12)</div>
                            </div>
                          </div>
                        </div>

                        {/* Common Errors */}
                        <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-3">
                          <h5 className="font-semibold text-sm text-yellow-900 dark:text-yellow-100 mb-2 flex items-center gap-2">
                            <AlertTriangle className="h-4 w-4" />
                            Common Errors to Avoid
                          </h5>
                          <ul className="text-xs text-yellow-800 dark:text-yellow-200 space-y-1">
                            <li>• Empty required fields</li>
                            <li>• Currency symbols in prices (390000 not Rs 390,000)</li>
                            <li>• Selling price less than cost price</li>
                            <li>• Duplicate SKUs</li>
                            <li>• Negative or zero prices</li>
                          </ul>
                        </div>
                      </div>
                    </div>
                  )}
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

                {/* Import Results - Enhanced */}
                {importResults && (
                  <div className={`rounded-lg border ${
                    importResults.success ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800' : 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800'
                  }`}>
                    {/* Header */}
                    <div className="p-4 border-b border-gray-200 dark:border-gray-700">
                      <div className="flex items-center gap-2 mb-2">
                        {importResults.success ? (
                          <CheckCircle className="h-6 w-6 text-green-600 dark:text-green-400" />
                        ) : (
                          <AlertTriangle className="h-6 w-6 text-red-600 dark:text-red-400" />
                        )}
                        <h4 className={`font-semibold text-lg ${
                          importResults.success ? 'text-green-900 dark:text-green-100' : 'text-red-900 dark:text-red-100'
                        }`}>
                          {importResults.success ? 'Import Completed' : 'Import Failed'}
                        </h4>
                      </div>
                      <p className={`text-sm ${
                        importResults.success ? 'text-green-800 dark:text-green-200' : 'text-red-800 dark:text-red-200'
                      }`}>
                        {importResults.message}
                      </p>
                    </div>

                    {/* Statistics */}
                    <div className="p-4 grid grid-cols-3 gap-3">
                      <div className="bg-white dark:bg-gray-900 rounded-lg p-3 text-center border border-gray-200 dark:border-gray-700">
                        <div className="text-2xl font-bold text-green-600 dark:text-green-400">{importResults.createdCount || 0}</div>
                        <div className="text-xs text-gray-600 dark:text-gray-400 mt-1">Created</div>
                      </div>
                      {importResults.skippedCount > 0 && (
                        <div className="bg-white dark:bg-gray-900 rounded-lg p-3 text-center border border-gray-200 dark:border-gray-700">
                          <div className="text-2xl font-bold text-orange-600 dark:text-orange-400">{importResults.skippedCount}</div>
                          <div className="text-xs text-gray-600 dark:text-gray-400 mt-1">Skipped</div>
                        </div>
                      )}
                      {importResults.errors && importResults.errors.length > 0 && (
                        <div className="bg-white dark:bg-gray-900 rounded-lg p-3 text-center border border-gray-200 dark:border-gray-700">
                          <div className="text-2xl font-bold text-red-600 dark:text-red-400">{importResults.errors.length}</div>
                          <div className="text-xs text-gray-600 dark:text-gray-400 mt-1">Errors</div>
                        </div>
                      )}
                    </div>

                    {/* Categorized Errors */}
                    {importResults.errors && importResults.errors.length > 0 && (
                      <div className="p-4 border-t border-gray-200 dark:border-gray-700">
                        <h5 className="font-semibold text-sm text-gray-900 dark:text-gray-100 mb-3 flex items-center gap-2">
                          <AlertTriangle className="h-4 w-4 text-red-600" />
                          Validation Errors ({importResults.errors.length})
                        </h5>
                        
                        {/* Categorize errors */}
                        {(() => {
                          const missingFields = importResults.errors.filter((e: string) => e.includes('Missing required fields'))
                          const priceErrors = importResults.errors.filter((e: string) => e.includes('price') && !e.includes('Missing'))
                          const otherErrors = importResults.errors.filter((e: string) => 
                            !e.includes('Missing required fields') && 
                            !e.includes('price')
                          )
                          
                          return (
                            <div className="space-y-3 max-h-64 overflow-y-auto">
                              {missingFields.length > 0 && (
                                <div className="bg-white dark:bg-gray-900 rounded border border-red-200 dark:border-red-800 p-3">
                                  <p className="font-medium text-xs text-red-900 dark:text-red-100 mb-2">Missing Required Fields ({missingFields.length})</p>
                                  <ul className="text-xs space-y-1">
                                    {missingFields.slice(0, 5).map((error: string, index: number) => (
                                      <li key={index} className="text-red-700 dark:text-red-300 flex items-start gap-1">
                                        <span className="text-red-500 mt-0.5">•</span>
                                        <span>{error}</span>
                                      </li>
                                    ))}
                                    {missingFields.length > 5 && (
                                      <li className="text-red-600 dark:text-red-400 italic">... and {missingFields.length - 5} more</li>
                                    )}
                                  </ul>
                                </div>
                              )}
                              
                              {priceErrors.length > 0 && (
                                <div className="bg-white dark:bg-gray-900 rounded border border-red-200 dark:border-red-800 p-3">
                                  <p className="font-medium text-xs text-red-900 dark:text-red-100 mb-2">Price Validation Errors ({priceErrors.length})</p>
                                  <ul className="text-xs space-y-1">
                                    {priceErrors.slice(0, 5).map((error: string, index: number) => (
                                      <li key={index} className="text-red-700 dark:text-red-300 flex items-start gap-1">
                                        <span className="text-red-500 mt-0.5">•</span>
                                        <span>{error}</span>
                                      </li>
                                    ))}
                                    {priceErrors.length > 5 && (
                                      <li className="text-red-600 dark:text-red-400 italic">... and {priceErrors.length - 5} more</li>
                                    )}
                                  </ul>
                                </div>
                              )}
                              
                              {otherErrors.length > 0 && (
                                <div className="bg-white dark:bg-gray-900 rounded border border-red-200 dark:border-red-800 p-3">
                                  <p className="font-medium text-xs text-red-900 dark:text-red-100 mb-2">Other Errors ({otherErrors.length})</p>
                                  <ul className="text-xs space-y-1">
                                    {otherErrors.slice(0, 5).map((error: string, index: number) => (
                                      <li key={index} className="text-red-700 dark:text-red-300 flex items-start gap-1">
                                        <span className="text-red-500 mt-0.5">•</span>
                                        <span>{error}</span>
                                      </li>
                                    ))}
                                    {otherErrors.length > 5 && (
                                      <li className="text-red-600 dark:text-red-400 italic">... and {otherErrors.length - 5} more</li>
                                    )}
                                  </ul>
                                </div>
                              )}
                            </div>
                          )
                        })()}
                      </div>
                    )}

                    {/* Skipped Duplicates */}
                    {importResults.skippedDuplicates && importResults.skippedDuplicates.length > 0 && (
                      <div className="p-4 border-t border-gray-200 dark:border-gray-700">
                        <h5 className="font-semibold text-sm text-orange-900 dark:text-orange-100 mb-3 flex items-center gap-2">
                          <Info className="h-4 w-4 text-orange-600" />
                          Skipped Duplicates ({importResults.skippedDuplicates.length})
                        </h5>
                        <ul className="text-xs space-y-1 max-h-32 overflow-y-auto">
                          {importResults.skippedDuplicates.slice(0, 10).map((msg: string, index: number) => (
                            <li key={index} className="text-orange-700 dark:text-orange-300 flex items-start gap-1">
                              <span className="text-orange-500 mt-0.5">•</span>
                              <span>{msg}</span>
                            </li>
                          ))}
                          {importResults.skippedDuplicates.length > 10 && (
                            <li className="text-orange-600 dark:text-orange-400 italic">... and {importResults.skippedDuplicates.length - 10} more</li>
                          )}
                        </ul>
                      </div>
                    )}
                  </div>
                )}

                {/* Action Buttons */}
                <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setShowImportDialog(false)
                      setImportFile(null)
                      setImportResults(null)
                      setShowFieldGuide(false)
                    }}
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

        {/* Delete Product Confirmation Dialog */}
        <Dialog open={showDeleteProductDialog} onOpenChange={setShowDeleteProductDialog}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-red-100 dark:bg-red-900 rounded-full flex items-center justify-center">
                  <AlertTriangle className="h-5 w-5 text-red-600 dark:text-red-300" />
                </div>
                <div>
                  <DialogTitle>Delete Product</DialogTitle>
                  <DialogDescription>This action cannot be undone</DialogDescription>
                </div>
              </div>
            </DialogHeader>
            <div className="py-4">
              <p className="text-gray-700 dark:text-gray-300">
                Are you sure you want to delete <strong>{productToDelete?.name}</strong>?
              </p>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => {
                  setShowDeleteProductDialog(false)
                  setProductToDelete(null)
                }}
                disabled={deleteLoading}
              >
                Cancel
              </Button>
              <Button
                onClick={handleDeleteProductConfirm}
                className="bg-red-600 hover:bg-red-700"
                disabled={deleteLoading}
              >
                {deleteLoading ? 'Deleting...' : 'Delete'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Delete Brand Confirmation Dialog */}
        <Dialog open={showDeleteBrandDialog} onOpenChange={setShowDeleteBrandDialog}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-red-100 dark:bg-red-900 rounded-full flex items-center justify-center">
                  <AlertTriangle className="h-5 w-5 text-red-600 dark:text-red-300" />
                </div>
                <div>
                  <DialogTitle>Delete Brand</DialogTitle>
                  <DialogDescription>This action cannot be undone</DialogDescription>
                </div>
              </div>
            </DialogHeader>
            <div className="py-4">
              <p className="text-gray-700 dark:text-gray-300">
                Are you sure you want to delete <strong>{brandToDelete?.name}</strong>?
              </p>
              {brandToDelete?._count && brandToDelete._count.products > 0 && (
                <p className="text-red-600 dark:text-red-400 text-sm mt-2">
                  Warning: This brand has {brandToDelete._count.products} product(s).
                </p>
              )}
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => {
                  setShowDeleteBrandDialog(false)
                  setBrandToDelete(null)
                }}
                disabled={deleteLoading}
              >
                Cancel
              </Button>
              <Button
                onClick={handleDeleteBrandConfirm}
                className="bg-red-600 hover:bg-red-700"
                disabled={deleteLoading}
              >
                {deleteLoading ? 'Deleting...' : 'Delete'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Delete Category Confirmation Dialog */}
        <Dialog open={showDeleteCategoryDialog} onOpenChange={setShowDeleteCategoryDialog}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-red-100 dark:bg-red-900 rounded-full flex items-center justify-center">
                  <AlertTriangle className="h-5 w-5 text-red-600 dark:text-red-300" />
                </div>
                <div>
                  <DialogTitle>Delete Category</DialogTitle>
                  <DialogDescription>This action cannot be undone</DialogDescription>
                </div>
              </div>
            </DialogHeader>
            <div className="py-4">
              <p className="text-gray-700 dark:text-gray-300">
                Are you sure you want to delete <strong>{categoryToDelete?.name}</strong>?
              </p>
              {categoryToDelete?._count && categoryToDelete._count.products > 0 && (
                <p className="text-red-600 dark:text-red-400 text-sm mt-2">
                  Warning: This category has {categoryToDelete._count.products} product(s).
                </p>
              )}
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => {
                  setShowDeleteCategoryDialog(false)
                  setCategoryToDelete(null)
                }}
                disabled={deleteLoading}
              >
                Cancel
              </Button>
              <Button
                onClick={handleDeleteCategoryConfirm}
                className="bg-red-600 hover:bg-red-700"
                disabled={deleteLoading}
              >
                {deleteLoading ? 'Deleting...' : 'Delete'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

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

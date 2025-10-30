'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { ProtectedRoute } from '@/components/auth/protected-route'
import { UserRole } from '@/types'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { BusinessSidebar } from '@/components/layout/BusinessSidebar'
import { TopNavigation } from '@/components/layout/TopNavigation'
import { 
  Tag,
  Plus,
  Edit3,
  Trash2,
  Search,
  Package,
  ArrowLeft,
  X,
  Check,
  AlertTriangle
} from 'lucide-react'

interface Brand {
  id: string
  name: string
  description: string | null
  status: string
  createdAt: string
  _count?: {
    products: number
  }
}

export default function BrandsPage() {
  const router = useRouter()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [brands, setBrands] = useState<Brand[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  
  // Create/Edit Dialog States
  const [showDialog, setShowDialog] = useState(false)
  const [editingBrand, setEditingBrand] = useState<Brand | null>(null)
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    isActive: true,
    code: ''
  })
  const [formLoading, setFormLoading] = useState(false)

  // Delete Dialog States
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [deletingBrand, setDeletingBrand] = useState<Brand | null>(null)
  const [deleteLoading, setDeleteLoading] = useState(false)

  useEffect(() => {
    fetchBrands()
  }, [])

  const fetchBrands = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/brands')
      const data = await response.json()
      setBrands(data.data || [])
    } catch (error) {
      console.error('Error fetching brands:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleCreate = () => {
    setEditingBrand(null)
    setFormData({ name: '', description: '', isActive: true, code: '' })
    setShowDialog(true)
  }

  const handleEdit = (brand: Brand) => {
    setEditingBrand(brand)
    setFormData({
      name: brand.name,
      description: brand.description || '',
      isActive: (brand as any).isActive ?? true,
      code: (brand as any).code || ''
    })
    setShowDialog(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setFormLoading(true)

    try {
      const url = editingBrand 
        ? `/api/brands/${editingBrand.id}`
        : '/api/brands'
      
      const method = editingBrand ? 'PUT' : 'POST'

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })

      if (response.ok) {
        setShowDialog(false)
        fetchBrands()
      } else {
        const error = await response.json()
        alert(error.error || 'Failed to save brand')
      }
    } catch (error) {
      console.error('Error saving brand:', error)
      alert('Failed to save brand')
    } finally {
      setFormLoading(false)
    }
  }

  const handleDeleteClick = (brand: Brand) => {
    setDeletingBrand(brand)
    setShowDeleteDialog(true)
  }

  const handleDeleteConfirm = async () => {
    if (!deletingBrand) return

    setDeleteLoading(true)
    try {
      const response = await fetch(`/api/brands/${deletingBrand.id}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        setShowDeleteDialog(false)
        setDeletingBrand(null)
        fetchBrands()
      } else {
        const error = await response.json()
        alert(error.error || 'Failed to delete brand')
      }
    } catch (error) {
      console.error('Error deleting brand:', error)
      alert('Failed to delete brand')
    } finally {
      setDeleteLoading(false)
    }
  }

  const filteredBrands = brands.filter(brand =>
    brand.name.toLowerCase().includes(searchTerm.toLowerCase())
  )

  return (
    <ProtectedRoute allowedRoles={[UserRole.SHOP_OWNER, UserRole.SHOP_WORKER]}>
      <div className="flex min-h-screen">
        {/* Sidebar */}
        <BusinessSidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
        
        {/* Main Content */}
        <div className={`flex-1 min-h-screen bg-gray-50 dark:bg-gray-900 ${sidebarOpen ? 'lg:ml-20' : 'lg:ml-64'} transition-all duration-300`}>
          <TopNavigation onMenuClick={() => setSidebarOpen(!sidebarOpen)} />
          {/* Header */}
          <header className="bg-white dark:bg-gray-800 shadow-sm border-b dark:border-gray-700">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="flex justify-between items-center h-16">
                <div className="flex items-center gap-4">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => router.push('/products')}
                    className="flex items-center gap-2"
                  >
                    <ArrowLeft className="h-4 w-4" />
                    Back to Products
                  </Button>
                  <div className="h-8 w-px bg-gray-300 dark:bg-gray-600" />
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-purple-100 dark:bg-purple-900 rounded-lg flex items-center justify-center">
                      <Tag className="h-6 w-6 text-purple-600 dark:text-purple-300" />
                    </div>
                    <div>
                      <h1 className="text-xl font-bold text-gray-900 dark:text-white">Brands</h1>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Manage product brands</p>
                    </div>
                  </div>
                </div>
                <Button onClick={handleCreate} className="flex items-center gap-2">
                  <Plus className="h-4 w-4" />
                  Add Brand
                </Button>
              </div>
            </div>
          </header>

          {/* Main Content */}
          <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            {/* Search Bar */}
            <div className="mb-6">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <Input
                  type="text"
                  placeholder="Search brands..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            {/* Brands Grid */}
            {loading ? (
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto"></div>
                <p className="mt-4 text-gray-600 dark:text-gray-400">Loading brands...</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {filteredBrands.map((brand) => (
                  <Card key={brand.id} className="hover:shadow-lg transition-shadow">
                    <CardHeader className="pb-3 p-4">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <CardTitle className="text-base sm:text-lg flex items-center gap-2 truncate">
                            <Tag className="h-4 w-4 sm:h-5 sm:w-5 text-purple-600 shrink-0" />
                            <span className="truncate">{brand.name}</span>
                          </CardTitle>
                          <CardDescription className="mt-1 text-xs sm:text-sm line-clamp-2">
                            {brand.description || 'No description'}
                          </CardDescription>
                        </div>
                        <Badge variant={(brand as any).isActive ? 'default' : 'secondary'} className="shrink-0 text-xs">
                          {(brand as any).isActive ? 'ACTIVE' : 'INACTIVE'}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="p-4 pt-0">
                      <div className="flex items-center justify-between flex-wrap gap-2">
                        <div className="flex items-center gap-2 text-xs sm:text-sm text-gray-600 dark:text-gray-400">
                          <Package className="h-3 w-3 sm:h-4 sm:w-4 shrink-0" />
                          <span>{brand._count?.products || 0} products</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleEdit(brand)}
                            className="h-7 px-2 sm:h-8 sm:px-3"
                          >
                            <Edit3 className="h-3 w-3" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDeleteClick(brand)}
                            className="h-7 px-2 sm:h-8 sm:px-3 text-red-600 hover:text-red-700"
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}

                {filteredBrands.length === 0 && (
                  <div className="col-span-full text-center py-12">
                    <Tag className="h-12 w-12 text-gray-400 dark:text-gray-500 mx-auto mb-4" />
                    <p className="text-gray-600 dark:text-gray-400">No brands found</p>
                    <Button onClick={handleCreate} className="mt-4">
                      <Plus className="h-4 w-4 mr-2" />
                      Create First Brand
                    </Button>
                  </div>
                )}
              </div>
            )}
          </main>
        </div>
      </div>

      {/* Create/Edit Dialog */}
      {showDialog && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full mx-4">
            <div className="p-6 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  {editingBrand ? 'Edit Brand' : 'Create Brand'}
                </h3>
                <button
                  onClick={() => setShowDialog(false)}
                  className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                >
                  <X className="h-5 w-5" />
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <Label htmlFor="name">Brand Name *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g., Samsung, Apple, Xiaomi"
                  required
                />
              </div>
              <div>
                <Label htmlFor="code">Brand Code *</Label>
                <Input
                  id="code"
                  value={formData.code}
                  onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                  placeholder="e.g., SAMSUNG, APPLE, XIAOMI"
                  required
                />
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Unique identifier for the brand</p>
              </div>
              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Brief description of this brand"
                  rows={3}
                />
              </div>
              <div className="flex gap-3 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowDialog(false)}
                  className="flex-1"
                  disabled={formLoading}
                >
                  Cancel
                </Button>
                <Button type="submit" className="flex-1" disabled={formLoading}>
                  {formLoading ? 'Saving...' : editingBrand ? 'Update' : 'Create'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      {showDeleteDialog && deletingBrand && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full mx-4">
            <div className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-red-100 dark:bg-red-900 rounded-full flex items-center justify-center">
                  <AlertTriangle className="h-5 w-5 text-red-600 dark:text-red-300" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Delete Brand</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">This action cannot be undone</p>
                </div>
              </div>
              <p className="text-gray-700 dark:text-gray-300 mb-6">
                Are you sure you want to delete <strong>{deletingBrand.name}</strong>?
                {deletingBrand._count && deletingBrand._count.products > 0 && (
                  <span className="text-red-600 block mt-2">
                    Warning: This brand has {deletingBrand._count.products} product(s).
                  </span>
                )}
              </p>
              <div className="flex gap-3">
                <Button
                  variant="outline"
                  onClick={() => setShowDeleteDialog(false)}
                  className="flex-1"
                  disabled={deleteLoading}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleDeleteConfirm}
                  className="flex-1 bg-red-600 hover:bg-red-700"
                  disabled={deleteLoading}
                >
                  {deleteLoading ? 'Deleting...' : 'Delete'}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </ProtectedRoute>
  )
}


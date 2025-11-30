'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { ProtectedRoute } from '@/components/auth/protected-route'
import { UserRole } from '@/types'
import { useNotify } from '@/hooks/use-notifications'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { BusinessSidebar } from '@/components/layout/BusinessSidebar'
import { TopNavigation } from '@/components/layout/TopNavigation'
import { 
  Grid,
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

interface Category {
  id: string
  name: string
  description: string | null
  status: string
  createdAt: string
  _count?: {
    products: number
  }
}

export default function CategoriesPage() {
  const router = useRouter()
  const queryClient = useQueryClient()
  const { success, error: showError } = useNotify()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [page, setPage] = useState(1)
  
  // Create/Edit Dialog States
  const [showDialog, setShowDialog] = useState(false)
  const [editingCategory, setEditingCategory] = useState<Category | null>(null)
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    isActive: true,
    code: ''
  })

  // Delete Dialog States
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [deletingCategory, setDeletingCategory] = useState<Category | null>(null)

  // Debounced search term
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('')
  
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm)
      setPage(1) // Reset to first page on search
    }, 300)
    return () => clearTimeout(timer)
  }, [searchTerm])

  // Fetch categories with React Query
  const { data: categoriesData, isLoading: loading, error } = useQuery({
    queryKey: ['categories', debouncedSearchTerm, page],
    queryFn: async () => {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '20',
        ...(debouncedSearchTerm && { search: debouncedSearchTerm })
      })
      
      const response = await fetch(`/api/categories?${params}`)
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || 'Failed to fetch categories')
      }
      return response.json()
    },
    staleTime: 2 * 60 * 1000, // 2 minutes
    gcTime: 5 * 60 * 1000, // 5 minutes
  })

  const categories = categoriesData?.data || []
  const pagination = categoriesData?.pagination || { page: 1, limit: 20, totalCount: 0, totalPages: 0 }

  // Show error notification
  useEffect(() => {
    if (error) {
      showError(error instanceof Error ? error.message : 'Failed to load categories')
    }
  }, [error, showError])

  const handleCreate = () => {
    setEditingCategory(null)
    setFormData({ name: '', description: '', isActive: true, code: '' })
    setShowDialog(true)
  }

  const handleEdit = (category: Category) => {
    setEditingCategory(category)
    setFormData({
      name: category.name,
      description: category.description || '',
      isActive: (category as any).isActive ?? true,
      code: (category as any).code || ''
    })
    setShowDialog(true)
  }

  // Mutation for create/update category
  const categoryMutation = useMutation({
    mutationFn: async ({ category, data }: { category: Category | null, data: typeof formData }) => {
      const url = category ? `/api/categories/${category.id}` : '/api/categories'
      const method = category ? 'PUT' : 'POST'

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || 'Failed to save category')
      }
      return response.json()
    },
    onSuccess: () => {
      success(editingCategory ? 'Category updated successfully' : 'Category created successfully')
      setShowDialog(false)
      setEditingCategory(null)
      setFormData({ name: '', description: '', isActive: true, code: '' })
      // Invalidate and refetch categories
      queryClient.invalidateQueries({ queryKey: ['categories'] })
    },
    onError: (error: Error) => {
      showError(error.message)
    }
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    categoryMutation.mutate({ category: editingCategory, data: formData })
  }

  const handleDeleteClick = (category: Category) => {
    setDeletingCategory(category)
    setShowDeleteDialog(true)
  }

  // Mutation for delete category
  const deleteMutation = useMutation({
    mutationFn: async (categoryId: string) => {
      const response = await fetch(`/api/categories/${categoryId}`, {
        method: 'DELETE'
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || 'Failed to delete category')
      }
      return response.json()
    },
    onSuccess: () => {
      success('Category deleted successfully')
      setShowDeleteDialog(false)
      setDeletingCategory(null)
      // Invalidate and refetch categories
      queryClient.invalidateQueries({ queryKey: ['categories'] })
    },
    onError: (error: Error) => {
      showError(error.message)
    }
  })

  const handleDeleteConfirm = () => {
    if (!deletingCategory) return
    deleteMutation.mutate(deletingCategory.id)
  }

  // Server-side filtering is handled by API, no client-side filtering needed
  const filteredCategories = categories

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
                    <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900 rounded-lg flex items-center justify-center">
                      <Grid className="h-6 w-6 text-blue-600 dark:text-blue-300" />
                    </div>
                    <div>
                      <h1 className="text-xl font-bold text-gray-900 dark:text-white">Categories</h1>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Manage product categories</p>
                    </div>
                  </div>
                </div>
                <Button onClick={handleCreate} className="flex items-center gap-2">
                  <Plus className="h-4 w-4" />
                  Add Category
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
                  placeholder="Search categories..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            {/* Categories Grid */}
            {loading ? (
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                <p className="mt-4 text-gray-600 dark:text-gray-400">Loading categories...</p>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                  {filteredCategories.map((category: Category) => (
                    <Card key={category.id} className="hover:shadow-lg transition-shadow">
                      <CardHeader className="pb-3 p-4">
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1 min-w-0">
                            <CardTitle className="text-base sm:text-lg flex items-center gap-2 truncate">
                              <Grid className="h-4 w-4 sm:h-5 sm:w-5 text-blue-600 shrink-0" />
                              <span className="truncate">{category.name}</span>
                            </CardTitle>
                            <CardDescription className="mt-1 text-xs sm:text-sm line-clamp-2">
                              {category.description || 'No description'}
                            </CardDescription>
                          </div>
                          <Badge variant={(category as any).isActive ? 'default' : 'secondary'} className="shrink-0 text-xs">
                            {(category as any).isActive ? 'ACTIVE' : 'INACTIVE'}
                          </Badge>
                        </div>
                      </CardHeader>
                      <CardContent className="p-4 pt-0">
                        <div className="flex items-center justify-between flex-wrap gap-2">
                          <div className="flex items-center gap-2 text-xs sm:text-sm text-gray-600 dark:text-gray-400">
                            <Package className="h-3 w-3 sm:h-4 sm:w-4 shrink-0" />
                            <span>{category._count?.products || 0} products</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleEdit(category)}
                              className="h-7 px-2 sm:h-8 sm:px-3"
                            >
                              <Edit3 className="h-3 w-3" />
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleDeleteClick(category)}
                              className="h-7 px-2 sm:h-8 sm:px-3 text-red-600 hover:text-red-700"
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}

                  {filteredCategories.length === 0 && !loading && (
                    <div className="col-span-full text-center py-12">
                      <Grid className="h-12 w-12 text-gray-400 dark:text-gray-500 mx-auto mb-4" />
                      <p className="text-gray-600 dark:text-gray-400">No categories found</p>
                      <Button onClick={handleCreate} className="mt-4">
                        <Plus className="h-4 w-4 mr-2" />
                        Create First Category
                      </Button>
                    </div>
                  )}
                </div>

                {/* Pagination Controls */}
                {pagination.totalPages > 1 && (
                  <div className="flex items-center justify-between mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
                    <div className="text-sm text-gray-600 dark:text-gray-400">
                      Showing {((page - 1) * pagination.limit) + 1} to {Math.min(page * pagination.limit, pagination.totalCount)} of {pagination.totalCount} categories
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setPage(p => Math.max(1, p - 1))}
                        disabled={page === 1 || loading}
                      >
                        Previous
                      </Button>
                      <div className="flex items-center gap-1">
                        {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => {
                          let pageNum: number
                          if (pagination.totalPages <= 5) {
                            pageNum = i + 1
                          } else if (page <= 3) {
                            pageNum = i + 1
                          } else if (page >= pagination.totalPages - 2) {
                            pageNum = pagination.totalPages - 4 + i
                          } else {
                            pageNum = page - 2 + i
                          }
                          return (
                            <Button
                              key={pageNum}
                              variant={page === pageNum ? "default" : "outline"}
                              size="sm"
                              onClick={() => setPage(pageNum)}
                              disabled={loading}
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
                        disabled={page === pagination.totalPages || loading}
                      >
                        Next
                      </Button>
                    </div>
                  </div>
                )}
              </>
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
                  {editingCategory ? 'Edit Category' : 'Create Category'}
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
                <Label htmlFor="name">Category Name *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g., Smartphones, Accessories"
                  required
                />
              </div>
              <div>
                <Label htmlFor="code">Category Code *</Label>
                <Input
                  id="code"
                  value={formData.code}
                  onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                  placeholder="e.g., SMARTPHONE, ACCESSORIES"
                  required
                />
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Unique identifier for the category</p>
              </div>
              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Brief description of this category"
                  rows={3}
                />
              </div>
              <div className="flex gap-3 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowDialog(false)}
                  className="flex-1"
                  disabled={categoryMutation.isPending}
                >
                  Cancel
                </Button>
                <Button type="submit" className="flex-1" disabled={categoryMutation.isPending}>
                  {categoryMutation.isPending ? 'Saving...' : editingCategory ? 'Update' : 'Create'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      {showDeleteDialog && deletingCategory && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full mx-4">
            <div className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-red-100 dark:bg-red-900 rounded-full flex items-center justify-center">
                  <AlertTriangle className="h-5 w-5 text-red-600 dark:text-red-300" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Delete Category</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">This action cannot be undone</p>
                </div>
              </div>
              <p className="text-gray-700 dark:text-gray-300 mb-6">
                Are you sure you want to delete <strong>{deletingCategory.name}</strong>?
                {deletingCategory._count && deletingCategory._count.products > 0 && (
                  <span className="text-red-600 block mt-2">
                    Warning: This category has {deletingCategory._count.products} product(s).
                  </span>
                )}
              </p>
              <div className="flex gap-3">
                <Button
                  variant="outline"
                  onClick={() => setShowDeleteDialog(false)}
                  className="flex-1"
                  disabled={deleteMutation.isPending}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleDeleteConfirm}
                  className="flex-1 bg-red-600 hover:bg-red-700"
                  disabled={deleteMutation.isPending}
                >
                  {deleteMutation.isPending ? 'Deleting...' : 'Delete'}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </ProtectedRoute>
  )
}


'use client'
import { useState, useEffect } from 'react'
import { Edit, Trash2, UserPlus, Settings, AlertTriangle, Check, X, Search, Plus } from 'lucide-react'

interface Shop {
  id: string
  name: string
  description: string | null
  address: string
  phone: string | null
  isActive: boolean
  createdAt: string
  owner: {
    id: string
    name: string
    email: string
  } | null
  _count: {
    products: number
    sales: number
    workers: number
  }
}

interface ShopOwner {
  id: string
  name: string
  email: string
  role: string
}

interface ShopFormData {
  name: string
  description: string
  address: string
  phone: string
  ownerId: string
}

export default function ShopManagement() {
  const [shops, setShops] = useState<Shop[]>([])
  const [shopOwners, setShopOwners] = useState<ShopOwner[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedShop, setSelectedShop] = useState<Shop | null>(null)
  const [showEditModal, setShowEditModal] = useState(false)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [showOwnerModal, setShowOwnerModal] = useState(false)
  const [formData, setFormData] = useState<ShopFormData>({
    name: '',
    description: '',
    address: '',
    phone: '',
    ownerId: ''
  })
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('')

  const fetchShops = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams({
        limit: '50',
        ...(searchTerm && { search: searchTerm }),
        ...(statusFilter && { status: statusFilter })
      })
      const response = await fetch(`/api/shops?${params}`)
      const data = await response.json()
      if (data.success) {
        setShops(data.shops)
        setError(null)
      } else {
        setError(data.message || 'Failed to fetch shops')
      }
    } catch (err) {
      setError('Failed to fetch shops')
      console.error('Error fetching shops:', err)
    } finally {
      setLoading(false)
    }
  }

  const fetchShopOwners = async () => {
    try {
      const response = await fetch('/api/users/shop-owners')
      const data = await response.json()
      if (data.success) {
        setShopOwners(data.users)
      }
    } catch (err) {
      console.error('Error fetching shop owners:', err)
    }
  }

  const handleCreateShop = async () => {
    try {
      const response = await fetch('/api/shops', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData)
      })
      const data = await response.json()
      if (data.success) {
        setShowCreateModal(false)
        setFormData({ name: '', description: '', address: '', phone: '', ownerId: '' })
        fetchShops()
      } else {
        setError(data.message || 'Failed to create shop')
      }
    } catch (err) {
      setError('Failed to create shop')
      console.error('Error creating shop:', err)
    }
  }

  const handleUpdateShop = async () => {
    if (!selectedShop) return
    try {
      const response = await fetch(`/api/shops/${selectedShop.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData)
      })
      const data = await response.json()
      if (data.success) {
        setShowEditModal(false)
        setSelectedShop(null)
        fetchShops()
      } else {
        setError(data.message || 'Failed to update shop')
      }
    } catch (err) {
      setError('Failed to update shop')
      console.error('Error updating shop:', err)
    }
  }

  const handleDeleteShop = async () => {
    if (!selectedShop) return
    try {
      const response = await fetch(`/api/shops/${selectedShop.id}`, {
        method: 'DELETE'
      })
      const data = await response.json()
      if (data.success) {
        setShowDeleteModal(false)
        setSelectedShop(null)
        fetchShops()
      } else {
        setError(data.message || 'Failed to delete shop')
      }
    } catch (err) {
      setError('Failed to delete shop')
      console.error('Error deleting shop:', err)
    }
  }

  const handleToggleStatus = async (shop: Shop) => {
    try {
      const response = await fetch(`/api/shops/${shop.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ isActive: !shop.isActive })
      })
      const data = await response.json()
      if (data.success) {
        fetchShops()
      } else {
        setError(data.message || 'Failed to update shop status')
      }
    } catch (err) {
      setError('Failed to update shop status')
      console.error('Error updating shop status:', err)
    }
  }

  const openEditModal = (shop: Shop) => {
    setSelectedShop(shop)
    setFormData({
      name: shop.name,
      description: shop.description || '',
      address: shop.address,
      phone: shop.phone || '',
      ownerId: shop.owner?.id || ''
    })
    setShowEditModal(true)
  }

  const openDeleteModal = (shop: Shop) => {
    setSelectedShop(shop)
    setShowDeleteModal(true)
  }

  const openOwnerModal = (shop: Shop) => {
    setSelectedShop(shop)
    setFormData({
      name: shop.name,
      description: shop.description || '',
      address: shop.address,
      phone: shop.phone || '',
      ownerId: shop.owner?.id || ''
    })
    setShowOwnerModal(true)
  }

  const handleOwnerAssignment = async () => {
    if (!selectedShop) return
    try {
      const response = await fetch(`/api/shops/${selectedShop.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ ownerId: formData.ownerId })
      })
      const data = await response.json()
      if (data.success) {
        setShowOwnerModal(false)
        setSelectedShop(null)
        fetchShops()
      } else {
        setError(data.message || 'Failed to assign owner')
      }
    } catch (err) {
      setError('Failed to assign owner')
      console.error('Error assigning owner:', err)
    }
  }

  useEffect(() => {
    fetchShops()
    fetchShopOwners()
  }, [searchTerm, statusFilter])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900">Shop Management</h2>
        <button
          onClick={() => {
            setFormData({ name: '', description: '', address: '', phone: '', ownerId: '' })
            setShowCreateModal(true)
          }}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
        >
          <Plus className="h-4 w-4" />
          Create Shop
        </button>
      </div>

      {/* Search and Filters */}
      <div className="bg-white p-4 rounded-lg shadow-sm border">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <input
                type="text"
                placeholder="Search shops..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="">All Status</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md">
          {error}
        </div>
      )}

      {/* Shops Table */}
      <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Shop
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Owner
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Stats
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {shops.map((shop) => (
                <tr key={shop.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-medium text-gray-900">{shop.name}</div>
                      <div className="text-sm text-gray-500">{shop.address}</div>
                      {shop.phone && (
                        <div className="text-sm text-gray-500">{shop.phone}</div>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {shop.owner ? (
                      <div>
                        <div className="text-sm font-medium text-gray-900">{shop.owner.name}</div>
                        <div className="text-sm text-gray-500">{shop.owner.email}</div>
                      </div>
                    ) : (
                      <span className="text-sm text-gray-400 italic">No owner assigned</span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <button
                      onClick={() => handleToggleStatus(shop)}
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        shop.isActive
                          ? 'bg-green-100 text-green-800 hover:bg-green-200'
                          : 'bg-red-100 text-red-800 hover:bg-red-200'
                      }`}
                    >
                      {shop.isActive ? 'Active' : 'Inactive'}
                    </button>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    <div className="flex gap-4">
                      <span>{shop._count.products} products</span>
                      <span>{shop._count.sales} sales</span>
                      <span>{shop._count.workers} workers</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex gap-2">
                      <button
                        onClick={() => openEditModal(shop)}
                        className="text-blue-600 hover:text-blue-900"
                        title="Edit shop"
                      >
                        <Edit className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => openOwnerModal(shop)}
                        className="text-green-600 hover:text-green-900"
                        title="Assign owner"
                      >
                        <UserPlus className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => openDeleteModal(shop)}
                        className="text-red-600 hover:text-red-900"
                        title="Delete shop"
                        disabled={shop._count.products > 0 || shop._count.sales > 0 || shop._count.workers > 0}
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create Shop Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full">
            <div className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Create New Shop</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Shop Name</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    rows={3}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
                  <input
                    type="text"
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                  <input
                    type="text"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Shop Owner</label>
                  <select
                    value={formData.ownerId}
                    onChange={(e) => setFormData({ ...formData, ownerId: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">Select an owner (optional)</option>
                    {shopOwners.map((owner) => (
                      <option key={owner.id} value={owner.id}>
                        {owner.name} ({owner.email})
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="flex gap-3 mt-6">
                <button
                  onClick={handleCreateShop}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                >
                  <Check className="h-4 w-4" />
                  Create Shop
                </button>
                <button
                  onClick={() => setShowCreateModal(false)}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400 focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
                >
                  <X className="h-4 w-4" />
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Shop Modal */}
      {showEditModal && selectedShop && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full">
            <div className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Edit Shop</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Shop Name</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    rows={3}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
                  <input
                    type="text"
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                  <input
                    type="text"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>
              <div className="flex gap-3 mt-6">
                <button
                  onClick={handleUpdateShop}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                >
                  <Check className="h-4 w-4" />
                  Update Shop
                </button>
                <button
                  onClick={() => setShowEditModal(false)}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400 focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
                >
                  <X className="h-4 w-4" />
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Owner Assignment Modal */}
      {showOwnerModal && selectedShop && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full">
            <div className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Assign Shop Owner</h3>
              <p className="text-sm text-gray-600 mb-4">
                Assign or change the owner for <strong>{selectedShop.name}</strong>
              </p>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Shop Owner</label>
                <select
                  value={formData.ownerId}
                  onChange={(e) => setFormData({ ...formData, ownerId: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">No owner</option>
                  {shopOwners.map((owner) => (
                    <option key={owner.id} value={owner.id}>
                      {owner.name} ({owner.email})
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex gap-3 mt-6">
                <button
                  onClick={handleOwnerAssignment}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                >
                  <Check className="h-4 w-4" />
                  Assign Owner
                </button>
                <button
                  onClick={() => setShowOwnerModal(false)}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400 focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
                >
                  <X className="h-4 w-4" />
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && selectedShop && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full">
            <div className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <AlertTriangle className="h-6 w-6 text-red-600" />
                <h3 className="text-lg font-semibold text-gray-900">Delete Shop</h3>
              </div>
              <p className="text-sm text-gray-600 mb-4">
                Are you sure you want to delete <strong>{selectedShop.name}</strong>? This action cannot be undone.
              </p>
              {(selectedShop._count.products > 0 || selectedShop._count.sales > 0 || selectedShop._count.workers > 0) && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md mb-4">
                  <p className="text-sm">
                    This shop cannot be deleted because it has:
                  </p>
                  <ul className="text-sm mt-1 list-disc list-inside">
                    {selectedShop._count.products > 0 && <li>{selectedShop._count.products} products</li>}
                    {selectedShop._count.sales > 0 && <li>{selectedShop._count.sales} sales</li>}
                    {selectedShop._count.workers > 0 && <li>{selectedShop._count.workers} workers</li>}
                  </ul>
                  <p className="text-sm mt-2">
                    Please transfer or remove these items first.
                  </p>
                </div>
              )}
              <div className="flex gap-3">
                <button
                  onClick={handleDeleteShop}
                  disabled={selectedShop._count.products > 0 || selectedShop._count.sales > 0 || selectedShop._count.workers > 0}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 focus:ring-2 focus:ring-red-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Trash2 className="h-4 w-4" />
                  Delete Shop
                </button>
                <button
                  onClick={() => setShowDeleteModal(false)}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400 focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
                >
                  <X className="h-4 w-4" />
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
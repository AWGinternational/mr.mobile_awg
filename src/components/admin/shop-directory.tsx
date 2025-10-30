'use client'
import { useState, useEffect } from 'react'
import { Search, Filter, Eye, MoreVertical, MapPin, Phone, User, TrendingUp, Package, DollarSign } from 'lucide-react'

interface Shop {
  id: string
  name: string
  address: string
  phone: string | null
  isActive: boolean
  status: string
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

interface ShopStats {
  totalRevenue: number
  totalSales: number
  totalProducts: number
  activeProducts: number
  topProducts: Array<{
    product: {
      id: string
      name: string
      price: number
    }
    totalQuantity: number
  }>
  salesByDay: Array<{
    date: string
    sales: number
    revenue: number
  }>
}

export default function ShopDirectory() {
  const [shops, setShops] = useState<Shop[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [selectedShop, setSelectedShop] = useState<Shop | null>(null)
  const [shopStats, setShopStats] = useState<ShopStats | null>(null)
  const [showStatsModal, setShowStatsModal] = useState(false)

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

  const fetchShopStats = async (shopId: string) => {
    try {
      const response = await fetch(`/api/shops/${shopId}/stats`)
      const data = await response.json()
      
      if (data.success) {
        setShopStats(data.stats.overview)
      }
    } catch (err) {
      console.error('Error fetching shop stats:', err)
    }
  }

  const handleViewShop = async (shop: Shop) => {
    setSelectedShop(shop)
    setShowStatsModal(true)
    await fetchShopStats(shop.id)
  }

  useEffect(() => {
    fetchShops()
  }, [searchTerm, statusFilter])

  const filteredShops = shops.filter(shop => {
    const matchesSearch = !searchTerm || 
      shop.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      shop.address.toLowerCase().includes(searchTerm.toLowerCase()) ||
      shop.owner?.name.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesStatus = !statusFilter || 
      (statusFilter === 'active' && shop.isActive) ||
      (statusFilter === 'inactive' && !shop.isActive)
    
    return matchesSearch && matchesStatus
  })

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
        <h2 className="text-2xl font-bold text-gray-900">Shop Directory</h2>
        <div className="text-sm text-gray-600">
          {filteredShops.length} of {shops.length} shops
        </div>
      </div>

      {/* Search and Filters */}
      <div className="bg-white p-4 rounded-lg shadow-sm border">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <input
                type="text"
                placeholder="Search shops, addresses, or owners..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>
          <div className="flex gap-2">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">All Status</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
            <button className="flex items-center gap-2 px-3 py-2 border border-gray-300 rounded-md hover:bg-gray-50">
              <Filter className="h-4 w-4" />
              More Filters
            </button>
          </div>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md">
          {error}
        </div>
      )}

      {/* Shop Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredShops.map((shop) => (
          <div key={shop.id} className="bg-white rounded-lg shadow-sm border hover:shadow-md transition-shadow">
            <div className="p-6">
              {/* Shop Header */}
              <div className="flex justify-between items-start mb-4">
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-gray-900 mb-1">{shop.name}</h3>
                  <div className="flex items-center gap-2">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      shop.isActive 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {shop.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                </div>
                <div className="relative">
                  <button className="p-1 hover:bg-gray-100 rounded">
                    <MoreVertical className="h-4 w-4 text-gray-400" />
                  </button>
                </div>
              </div>

              {/* Shop Details */}
              <div className="space-y-3 mb-4">
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <MapPin className="h-4 w-4" />
                  <span className="truncate">{shop.address}</span>
                </div>
                {shop.phone && (
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Phone className="h-4 w-4" />
                    <span>{shop.phone}</span>
                  </div>
                )}
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <User className="h-4 w-4" />
                  <span>{shop.owner ? shop.owner.name : 'No owner assigned'}</span>
                </div>
              </div>

              {/* Shop Stats */}
              <div className="grid grid-cols-3 gap-4 mb-4 p-3 bg-gray-50 rounded-lg">
                <div className="text-center">
                  <div className="text-lg font-semibold text-gray-900">{shop._count.products}</div>
                  <div className="text-xs text-gray-600">Products</div>
                </div>
                <div className="text-center">
                  <div className="text-lg font-semibold text-gray-900">{shop._count.sales}</div>
                  <div className="text-xs text-gray-600">Sales</div>
                </div>
                <div className="text-center">
                  <div className="text-lg font-semibold text-gray-900">{shop._count.workers}</div>
                  <div className="text-xs text-gray-600">Workers</div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-2">
                <button
                  onClick={() => handleViewShop(shop)}
                  className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                >
                  <Eye className="h-4 w-4" />
                  View Details
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {filteredShops.length === 0 && !loading && (
        <div className="text-center py-12">
          <div className="text-gray-400 mb-4">
            <Search className="h-12 w-12 mx-auto" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No shops found</h3>
          <p className="text-gray-600">
            {searchTerm || statusFilter 
              ? 'Try adjusting your search criteria or filters'
              : 'No shops have been created yet'
            }
          </p>
        </div>
      )}

      {/* Shop Details Modal */}
      {showStatsModal && selectedShop && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b">
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="text-xl font-semibold text-gray-900">{selectedShop.name}</h3>
                  <p className="text-sm text-gray-600">{selectedShop.address}</p>
                </div>
                <button
                  onClick={() => setShowStatsModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>
            
            <div className="p-6">
              {shopStats ? (
                <div className="space-y-6">
                  {/* Overview Stats */}
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="bg-blue-50 p-4 rounded-lg">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-blue-600">Total Revenue</p>
                          <p className="text-2xl font-bold text-blue-900">
                            PKR {shopStats.totalRevenue.toLocaleString()}
                          </p>
                        </div>
                        <DollarSign className="h-8 w-8 text-blue-600" />
                      </div>
                    </div>
                    <div className="bg-green-50 p-4 rounded-lg">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-green-600">Total Sales</p>
                          <p className="text-2xl font-bold text-green-900">{shopStats.totalSales}</p>
                        </div>
                        <TrendingUp className="h-8 w-8 text-green-600" />
                      </div>
                    </div>
                    <div className="bg-purple-50 p-4 rounded-lg">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-purple-600">Total Products</p>
                          <p className="text-2xl font-bold text-purple-900">{shopStats.totalProducts}</p>
                        </div>
                        <Package className="h-8 w-8 text-purple-600" />
                      </div>
                    </div>
                    <div className="bg-orange-50 p-4 rounded-lg">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-orange-600">Active Products</p>
                          <p className="text-2xl font-bold text-orange-900">{shopStats.activeProducts}</p>
                        </div>
                        <Package className="h-8 w-8 text-orange-600" />
                      </div>
                    </div>
                  </div>

                  {/* Top Products */}
                  {shopStats.topProducts && shopStats.topProducts.length > 0 && (
                    <div>
                      <h4 className="text-lg font-semibold text-gray-900 mb-4">Top Products</h4>
                      <div className="space-y-2">
                        {shopStats.topProducts.slice(0, 5).map((item, index) => (
                          <div key={item.product.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                            <div className="flex items-center gap-3">
                              <span className="flex items-center justify-center w-6 h-6 bg-blue-100 text-blue-800 rounded-full text-sm font-semibold">
                                {index + 1}
                              </span>
                              <div>
                                <div className="font-medium text-gray-900">{item.product.name}</div>
                                <div className="text-sm text-gray-500">PKR {item.product.price}</div>
                              </div>
                            </div>
                            <div className="text-right">
                              <div className="font-semibold text-gray-900">{item.totalQuantity} sold</div>
                              <div className="text-sm text-gray-500">
                                PKR {(item.totalQuantity * item.product.price).toLocaleString()}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="flex items-center justify-center h-32">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
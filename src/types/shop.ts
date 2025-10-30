// Shop-related TypeScript types

export interface Shop {
  id: string
  name: string
  code: string
  address: string
  city: string
  province: string
  postalCode: string
  phone: string
  email: string
  licenseNumber: string
  gstNumber: string
  status: 'ACTIVE' | 'INACTIVE' | 'SUSPENDED'
  databaseUrl: string
  ownerId: string
  settings: ShopSettings
  createdAt: Date
  updatedAt: Date
}

export interface ShopSettings {
  currency: string
  timezone: string
  gstRate: number
  maxWorkers: number
  businessHours: {
    open: string
    close: string
    days: string[]
  }
}

export interface ShopWithOwner extends Shop {
  owner: {
    id: string
    name: string
    email: string
    phone?: string
    businessName?: string
    businessRegNo?: string
  }
}

export interface ShopWithDetails extends ShopWithOwner {
  workers: Array<{
    id: string
    userId: string
    permissions: WorkerPermissions
    isActive: boolean
    createdAt: Date
    user: {
      id: string
      name: string
      email: string
      phone?: string
      role: string
    }
  }>
  _count: {
    workers: number
  }
}

export interface WorkerPermissions {
  canHandleCash: boolean
  canProcessReturns: boolean
  canManageInventory: boolean
  canViewReports: boolean
  maxDiscountPercent: number
  dailyTransactionLimit: number
}

export interface ShopStats {
  shop: {
    id: string
    name: string
    code: string
    status: string
    ageInDays: number
  }
  workers: {
    total: number
    active: number
    capacity: number
    utilization: number
  }
  activity: {
    recentAuditLogs: number
  }
  activeWorkers: Array<{
    id: string
    name: string
    email: string
    phone?: string
    joinedAt: Date
    permissions: WorkerPermissions
  }>
}

export interface CreateShopInput {
  name: string
  address: string
  city: string
  province: string
  postalCode: string
  phone: string
  email: string
  licenseNumber: string
  gstNumber: string
  ownerId: string
  settings?: Partial<ShopSettings>
}

export interface UpdateShopInput {
  name?: string
  address?: string
  city?: string
  province?: string
  postalCode?: string
  phone?: string
  email?: string
  licenseNumber?: string
  gstNumber?: string
  status?: 'ACTIVE' | 'INACTIVE' | 'SUSPENDED'
  settings?: Partial<ShopSettings>
}

export interface ShopListResponse {
  shops: ShopWithDetails[]
  pagination: {
    page: number
    limit: number
    total: number
    pages: number
  }
}

export interface ShopOwner {
  id: string
  email: string
  name: string
  phone?: string
  cnic?: string
  address?: string
  city?: string
  province?: string
  businessName?: string
  businessRegNo?: string
  status: string
  emailVerified?: Date
  createdAt: Date
  _count?: {
    ownedShops: number
  }
  ownedShops?: Array<{
    id: string
    name: string
    code: string
    city: string
    status: string
    createdAt: Date
  }>
}

export interface ShopOwnersListResponse {
  shopOwners: ShopOwner[]
  pagination: {
    page: number
    limit: number
    total: number
    pages: number
  }
}

// Form validation types
export interface ShopFormErrors {
  name?: string
  address?: string
  city?: string
  province?: string
  postalCode?: string
  phone?: string
  email?: string
  licenseNumber?: string
  gstNumber?: string
  ownerId?: string
  settings?: {
    gstRate?: string
    maxWorkers?: string
    businessHours?: {
      open?: string
      close?: string
      days?: string
    }
  }
}

export interface ShopFilters {
  status?: 'ACTIVE' | 'INACTIVE' | 'SUSPENDED'
  city?: string
  province?: string
  ownerId?: string
  page?: number
  limit?: number
}

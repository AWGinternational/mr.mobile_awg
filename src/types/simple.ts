// Simple types for authentication without Prisma dependency
export enum UserRole {
  SUPER_ADMIN = 'SUPER_ADMIN',
  SHOP_OWNER = 'SHOP_OWNER', 
  SHOP_WORKER = 'SHOP_WORKER'
}

export enum UserStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
  SUSPENDED = 'SUSPENDED',
  PENDING_VERIFICATION = 'PENDING_VERIFICATION'
}

export enum ShopStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
  SUSPENDED = 'SUSPENDED'
}

export enum ProductType {
  SMARTPHONE = 'SMARTPHONE',
  TABLET = 'TABLET',
  ACCESSORY = 'ACCESSORY',
  SMARTWATCH = 'SMARTWATCH'
}

export enum ProductStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
  DISCONTINUED = 'DISCONTINUED'
}

export enum PaymentMethod {
  CASH = 'CASH',
  CARD = 'CARD',
  EASYPAISA = 'EASYPAISA',
  JAZZCASH = 'JAZZCASH',
  BANK_TRANSFER = 'BANK_TRANSFER'
}

export enum PaymentStatus {
  PENDING = 'PENDING',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
  CANCELLED = 'CANCELLED'
}

// Core User interface for application use
export interface User {
  id: string
  email: string
  name: string
  phone?: string
  role: UserRole
  status: UserStatus
  emailVerified?: Date
  lastLogin?: Date
  createdAt: Date
  updatedAt: Date
  // Additional fields for UI
  shops?: Array<{
    id: string
    name: string
    code: string
    permissions?: Record<string, unknown>
  }>
}

export interface Session {
  id: string
  sessionToken: string
  userId: string
  expires: Date
}

// Shop Types
export interface Shop {
  id: string
  name: string
  code: string
  address: string
  city: string
  province: string
  postalCode?: string
  phone: string
  email?: string
  licenseNumber?: string
  gstNumber?: string
  status: ShopStatus
  settings: Record<string, unknown>
  ownerId: string
  createdAt: Date
  updatedAt: Date
}

export interface Product {
  id: string
  name: string
  model: string
  sku: string
  barcode?: string
  type: ProductType
  status: ProductStatus
  description?: string
  specifications: Record<string, unknown>
  images: string[]
  warranty?: number
  costPrice: number
  sellingPrice: number
  minimumPrice?: number
  markupPercentage?: number
  categoryId: string
  brandId: string
  lowStockThreshold: number
  reorderPoint: number
  createdAt: Date
  updatedAt: Date
}

// API Response Types
export interface ApiResponse<T = unknown> {
  success: boolean
  data?: T
  message?: string
  error?: string
  pagination?: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}

// Permission Types
export interface Permission {
  resource: string
  actions: string[]
}

export interface UserPermissions {
  [resource: string]: string[]
}

// Dashboard Types
export interface DashboardStats {
  totalSales: number
  totalRevenue: number
  totalCustomers: number
  totalProducts: number
  dailyGrowth: number
  weeklyGrowth: number
  monthlyGrowth: number
}

// POS Types
export interface CartItem {
  product: Product
  quantity: number
  unitPrice: number
  totalPrice: number
  discount?: number
}

export interface Cart {
  items: CartItem[]
  subtotal: number
  taxAmount: number
  discountAmount: number
  totalAmount: number
}

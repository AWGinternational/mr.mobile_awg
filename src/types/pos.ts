// Phase 1 POS System - Enhanced Type Definitions
// Multi-product type support, tracking methods, shop configuration

// Payment and Status Enums
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

export enum ProductStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
  DISCONTINUED = 'DISCONTINUED'
}

export enum InventoryStatus {
  IN_STOCK = 'IN_STOCK',
  OUT_OF_STOCK = 'OUT_OF_STOCK',
  LOW_STOCK = 'LOW_STOCK',
  RESERVED = 'RESERVED'
}

export enum SaleStatus {
  PENDING = 'PENDING',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
  REFUNDED = 'REFUNDED'
}

// Product and Business Enums
export enum ProductType {
  MOBILE_PHONE = 'MOBILE_PHONE',
  SMARTPHONE = 'SMARTPHONE',
  SMARTWATCH = 'SMARTWATCH',
  EARBUDS = 'EARBUDS',
  HEADPHONES = 'HEADPHONES',
  POWER_BANK = 'POWER_BANK',
  CHARGER = 'CHARGER',
  CABLE = 'CABLE',
  SCREEN_PROTECTOR = 'SCREEN_PROTECTOR',
  PHONE_CASE = 'PHONE_CASE',
  MEMORY_CARD = 'MEMORY_CARD',
  ACCESSORY = 'ACCESSORY',
  OTHER_ACCESSORY = 'OTHER_ACCESSORY',
  SIM_CARD = 'SIM_CARD',
  SERVICE = 'SERVICE'
}

export enum TrackingMethod {
  IMEI = 'IMEI',
  SERIAL = 'SERIAL',
  BATCH = 'BATCH',
  NONE = 'NONE'
}

export enum CommissionType {
  PERCENTAGE = 'PERCENTAGE',
  FIXED = 'FIXED',
  TIERED = 'TIERED'
}

export enum GSTMode {
  AUTO = 'AUTO',
  MANUAL = 'MANUAL',
  NONE = 'NONE'
}

// Basic Model Interfaces (to satisfy TypeScript references)
export interface User {
  id: string
  name: string
  email: string
  role: string
}

export interface Shop {
  id: string
  name: string
  code: string
  address: string
  settings?: any
}

export interface Category {
  id: string
  name: string
  description?: string
  shopId: string
}

export interface Brand {
  id: string
  name: string
  description?: string
  shopId: string
}

export interface Supplier {
  id: string
  name: string
  contactPerson?: string
  phone?: string
  email?: string
}

export interface Customer {
  id: string
  name: string
  phone?: string
  email?: string
  address?: string
}

export interface InventoryItem {
  id: string
  productId: string
  quantity: number
  status: InventoryStatus
  serialNumber?: string
  imei?: string
}

export interface SaleItem {
  id: string
  saleId: string
  productId: string
  quantity: number
  unitPrice: number
  totalPrice: number
}

export interface Sale {
  id: string
  saleNumber: string
  status: SaleStatus
  totalAmount: number
  paymentMethod: PaymentMethod
  paymentStatus: PaymentStatus
  createdAt: Date
}

export interface Payment {
  id: string
  saleId: string
  amount: number
  method: PaymentMethod
  status: PaymentStatus
  transactionId?: string
}

// Shop Configuration Types
export interface ShopConfiguration {
  id: string
  shopId: string
  
  // GST Configuration
  gstMode: GSTMode
  gstRate: number
  gstNumber?: string
  autoCalculateGST: boolean
  
  // Commission Configuration
  enableCommissions: boolean
  defaultCommissionType: CommissionType
  defaultCommissionRate: number
  tieredCommissionRates: TieredCommissionRate[]
  
  // Return Policy
  returnPolicyDays: number
  allowReturnWithoutReceipt: boolean
  restockingFee: number
  
  // POS Settings
  requireCustomerInfo: boolean
  defaultPaymentMethod: PaymentMethod
  allowPartialPayments: boolean
  printReceiptsByDefault: boolean
  
  // Offline Settings
  enableOfflineMode: boolean
  offlineSyncInterval: number
  maxOfflineTransactions: number
  
  // Business Hours
  businessHours: BusinessHours
  
  // Currency and Locale
  currency: string
  locale: string
  timezone: string
  
  createdAt: Date
  updatedAt: Date
}

export interface TieredCommissionRate {
  minAmount: number
  maxAmount: number
  rate: number
}

export interface BusinessHours {
  monday: DaySchedule
  tuesday: DaySchedule
  wednesday: DaySchedule
  thursday: DaySchedule
  friday: DaySchedule
  saturday: DaySchedule
  sunday: DaySchedule
}

export interface DaySchedule {
  open: string
  close: string
  closed: boolean
}

// Product Type Configuration
export interface ProductTypeConfiguration {
  id: string
  shopId: string
  productType: ProductType
  trackingMethod: TrackingMethod
  requireSerialNumber: boolean
  requireIMEI: boolean
  requireBatchNumber: boolean
  defaultWarrantyMonths?: number
  enableBarcodeGeneration: boolean
  defaultMarkupPercentage?: number
  isActive: boolean
  createdAt: Date
  updatedAt: Date
}

// Enhanced Product Types
export interface EnhancedProduct {
  id: string
  name: string
  model: string
  sku: string
  barcode?: string
  type: ProductType
  status: ProductStatus
  description?: string
  specifications: Record<string, any>
  images: string[]
  warranty?: number
  
  // Pricing
  costPrice: number
  sellingPrice: number
  minimumPrice?: number
  markupPercentage?: number
  
  // Tracking
  trackingMethod: TrackingMethod
  requiresImei: boolean
  requiresSerial: boolean
  requiresBatch: boolean
  hasVariants: boolean
  
  // POS Features
  commissionRate: number
  tags: string[]
  searchKeywords: string[]
  posDisplayName?: string
  quickSaleEnabled: boolean
  
  // Relationships
  categoryId: string
  brandId: string
  category?: Category
  brand?: Brand
  inventoryItems?: InventoryItem[]
  
  // Stock Information
  currentStock?: number
  availableStock?: number
  reservedStock?: number
  lowStockThreshold: number
  reorderPoint: number
  
  createdAt: Date
  updatedAt: Date
}

// Enhanced Inventory Item
export interface EnhancedInventoryItem {
  id: string
  productId: string
  imei?: string
  serialNumber?: string
  batchNumber?: string
  trackingNumber?: string
  status: InventoryStatus
  costPrice: number
  purchaseDate: Date
  expiryDate?: Date
  location?: string
  supplierId?: string
  notes?: string
  reservedFor?: string
  reservedUntil?: Date
  
  // Relationships
  product?: EnhancedProduct
  supplier?: Supplier
  saleItem?: SaleItem
  
  createdAt: Date
  updatedAt: Date
}

// Worker Commission
export interface WorkerCommission {
  id: string
  workerId: string
  shopId: string
  saleId: string
  productId: string
  commissionType: CommissionType
  commissionRate: number
  saleAmount: number
  commissionAmount: number
  isPaid: boolean
  paidAt?: Date
  notes?: string
  
  // Relationships
  worker?: User
  shop?: Shop
  sale?: Sale
  product?: EnhancedProduct
  
  createdAt: Date
}

// Enhanced Sale
export interface EnhancedSale {
  id: string
  invoiceNumber: string
  customerId?: string
  workerId?: string
  subtotal: number
  taxAmount: number
  discountAmount: number
  totalAmount: number
  commissionTotal: number
  status: SaleStatus
  paymentMethod: PaymentMethod
  paymentStatus: PaymentStatus
  paidAmount: number
  gstMode: GSTMode
  manualGstAmount?: number
  isOffline: boolean
  offlineId?: string
  notes?: string
  saleDate: Date
  
  // Relationships
  customer?: Customer
  worker?: User
  items?: SaleItem[]
  payments?: Payment[]
  commissions?: WorkerCommission[]
  
  createdAt: Date
  updatedAt: Date
}

// Offline Transaction
export interface OfflineTransaction {
  id: string
  shopId: string
  localTransactionId: string
  transactionData: Record<string, any>
  status: 'PENDING' | 'SYNCED' | 'FAILED'
  syncAttempts: number
  lastSyncAttempt?: Date
  errorMessage?: string
  createdAt: Date
  syncedAt?: Date
}

// Product Catalog Filter
export interface ProductCatalogFilter {
  id: string
  shopId: string
  name: string
  filterType: 'PRICE_RANGE' | 'BRAND' | 'CATEGORY' | 'CUSTOM'
  filterData: Record<string, any>
  isActive: boolean
  sortOrder: number
  createdAt: Date
  updatedAt: Date
}

// POS Cart Types
export interface CartItem {
  id: string
  productId: string
  product: EnhancedProduct
  quantity: number
  unitPrice: number
  totalPrice: number
  discountAmount?: number
  commissionRate?: number
  selectedInventoryItems?: string[] // For IMEI tracking
  notes?: string
}

export interface POSCart {
  items: CartItem[]
  subtotal: number
  discountAmount: number
  taxAmount: number
  totalAmount: number
  customerId?: string
  paymentMethod: PaymentMethod
  gstMode: GSTMode
  manualGstAmount?: number
  notes?: string
}

// Product Search Types
export interface ProductSearchFilters {
  query?: string
  categoryId?: string
  brandId?: string
  type?: ProductType
  status?: ProductStatus
  priceRange?: {
    min: number
    max: number
  }
  inStock?: boolean
  tags?: string[]
  trackingMethod?: TrackingMethod
  page?: number
  limit?: number
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
}

export interface ProductSearchResult {
  products: EnhancedProduct[]
  total: number
  page: number
  limit: number
  totalPages: number
  hasNext: boolean
  hasPrev: boolean
}

// Commission Calculation Types
export interface CommissionCalculation {
  productId: string
  saleAmount: number
  commissionType: CommissionType
  commissionRate: number
  commissionAmount: number
}

export interface CommissionSummary {
  workerId: string
  totalSales: number
  totalCommission: number
  paidCommission: number
  unpaidCommission: number
  commissionsByProduct: CommissionCalculation[]
}

// Customer Types for POS
export interface POSCustomer {
  id?: string
  name: string
  phone: string
  email?: string
  address?: string
  city?: string
  isWalkIn?: boolean
}

// Payment Processing Types
export interface PaymentRequest {
  amount: number
  method: PaymentMethod
  reference?: string
  customerPhone?: string // For mobile payments
  notes?: string
}

export interface PaymentResponse {
  success: boolean
  transactionId?: string
  reference?: string
  message?: string
  error?: string
}

// Receipt Types
export interface ReceiptData {
  sale: EnhancedSale
  items: SaleItem[]
  customer?: Customer
  shop: Shop
  shopConfig: ShopConfiguration
  paymentInfo: {
    method: PaymentMethod
    amount: number
    change?: number
    reference?: string
  }
  totals: {
    subtotal: number
    discount: number
    tax: number
    total: number
  }
}

// Quick Sale Preset
export interface QuickSalePreset {
  id: string
  name: string
  productId: string
  quantity: number
  customPrice?: number
  isActive: boolean
  sortOrder: number
}

// Product Variants (for future enhancement)
export interface ProductVariant {
  id: string
  productId: string
  name: string
  sku: string
  specifications: Record<string, any>
  costPrice: number
  sellingPrice: number
  isActive: boolean
}

// Barcode Generation
export interface BarcodeConfig {
  format: 'CODE128' | 'CODE39' | 'EAN13' | 'EAN8'
  includeText: boolean
  width: number
  height: number
}

// Export all existing types from the original file
export * from '../types/index'

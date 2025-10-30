import { UserRole } from '@/types'

// Permission actions
export const ACTIONS = {
  CREATE: 'create',
  READ: 'read',
  UPDATE: 'update',
  DELETE: 'delete',
  APPROVE: 'approve',
  MANAGE: 'manage', // Full CRUD access
} as const

// Resources in the system
export const RESOURCES = {
  // User Management
  USERS: 'users',
  SHOPS: 'shops',
  WORKERS: 'workers',
  
  // Product Management
  PRODUCTS: 'products',
  CATEGORIES: 'categories',
  BRANDS: 'brands',
  
  // Inventory
  INVENTORY: 'inventory',
  STOCK_TRANSFERS: 'stock_transfers',
  
  // Sales
  SALES: 'sales',
  CUSTOMERS: 'customers',
  PAYMENTS: 'payments',
  
  // Suppliers
  SUPPLIERS: 'suppliers',
  PURCHASES: 'purchases',
  
  // Financial
  DAILY_CLOSING: 'daily_closing',
  EXPENSES: 'expenses',
  REPORTS: 'reports',
  
  // Loans
  LOANS: 'loans',
  LOAN_INSTALLMENTS: 'loan_installments',
  
  // System
  SETTINGS: 'settings',
  AUDIT_LOGS: 'audit_logs',
  APPROVALS: 'approvals',
  
  // AI/ML
  AI_INSIGHTS: 'ai_insights',
  PREDICTIONS: 'predictions',
} as const

// Type for actions
type Action = typeof ACTIONS[keyof typeof ACTIONS]
type Resource = typeof RESOURCES[keyof typeof RESOURCES]

// Role-based permissions matrix - simplified with string arrays
export const ROLE_PERMISSIONS: Record<UserRole, Record<string, string[]>> = {
  [UserRole.SUPER_ADMIN]: {
    // Super Admin has full access to everything
    [RESOURCES.USERS]: ['manage'],
    [RESOURCES.SHOPS]: ['manage'],
    [RESOURCES.WORKERS]: ['manage'],
    [RESOURCES.PRODUCTS]: ['manage'],
    [RESOURCES.CATEGORIES]: ['manage'],
    [RESOURCES.BRANDS]: ['manage'],
    [RESOURCES.INVENTORY]: ['manage'],
    [RESOURCES.STOCK_TRANSFERS]: ['manage'],
    [RESOURCES.SALES]: ['manage'],
    [RESOURCES.CUSTOMERS]: ['manage'],
    [RESOURCES.PAYMENTS]: ['manage'],
    [RESOURCES.SUPPLIERS]: ['manage'],
    [RESOURCES.PURCHASES]: ['manage'],
    [RESOURCES.DAILY_CLOSING]: ['manage'],
    [RESOURCES.EXPENSES]: ['manage'],
    [RESOURCES.REPORTS]: ['manage'],
    [RESOURCES.LOANS]: ['manage'],
    [RESOURCES.LOAN_INSTALLMENTS]: ['manage'],
    [RESOURCES.SETTINGS]: ['manage'],
    [RESOURCES.AUDIT_LOGS]: ['read'],
    [RESOURCES.APPROVALS]: ['manage'],
    [RESOURCES.AI_INSIGHTS]: ['read'],
    [RESOURCES.PREDICTIONS]: ['read'],
  },
  
  [UserRole.SHOP_OWNER]: {
    // Shop Owner has full access within their shop
    [RESOURCES.USERS]: ['read'],
    [RESOURCES.SHOPS]: ['read', 'update'], // Can only update their own shop
    [RESOURCES.WORKERS]: ['manage'], // Can manage workers in their shop
    [RESOURCES.PRODUCTS]: ['manage'],
    [RESOURCES.CATEGORIES]: ['manage'],
    [RESOURCES.BRANDS]: ['read', 'create'], // Usually brands are global
    [RESOURCES.INVENTORY]: ['manage'],
    [RESOURCES.STOCK_TRANSFERS]: ['manage'],
    [RESOURCES.SALES]: ['manage'],
    [RESOURCES.CUSTOMERS]: ['manage'],
    [RESOURCES.PAYMENTS]: ['manage'],
    [RESOURCES.SUPPLIERS]: ['manage'],
    [RESOURCES.PURCHASES]: ['manage'],
    [RESOURCES.DAILY_CLOSING]: ['manage'],
    [RESOURCES.EXPENSES]: ['manage'],
    [RESOURCES.REPORTS]: ['read'],
    [RESOURCES.LOANS]: ['manage'],
    [RESOURCES.LOAN_INSTALLMENTS]: ['manage'],
    [RESOURCES.SETTINGS]: ['read', 'update'],
    [RESOURCES.AUDIT_LOGS]: ['read'], // Own shop only
    [RESOURCES.APPROVALS]: ['manage'], // Approve worker requests
    [RESOURCES.AI_INSIGHTS]: ['read'],
    [RESOURCES.PREDICTIONS]: ['read'],
  },
  
  [UserRole.SHOP_WORKER]: {
    // Shop Worker has limited access, mostly operational
    [RESOURCES.USERS]: ['read'], // Can view basic user info
    [RESOURCES.SHOPS]: ['read'], // Can view shop info
    [RESOURCES.WORKERS]: ['read'], // Can view other workers
    [RESOURCES.PRODUCTS]: ['read', 'create'], // Create needs approval
    [RESOURCES.CATEGORIES]: ['read'],
    [RESOURCES.BRANDS]: ['read'],
    [RESOURCES.INVENTORY]: ['read', 'create'], // Create needs approval
    [RESOURCES.STOCK_TRANSFERS]: ['read'],
    [RESOURCES.SALES]: ['create', 'read'], // Main job function
    [RESOURCES.CUSTOMERS]: ['create', 'read', 'update'], // Update needs approval
    [RESOURCES.PAYMENTS]: ['create', 'read'], // Process payments
    [RESOURCES.SUPPLIERS]: ['read'],
    [RESOURCES.PURCHASES]: ['read'],
    [RESOURCES.DAILY_CLOSING]: ['create', 'read'], // Submit closing data
    [RESOURCES.EXPENSES]: ['create', 'read'],
    [RESOURCES.REPORTS]: ['read'], // Basic reports only
    [RESOURCES.LOANS]: ['read'],
    [RESOURCES.LOAN_INSTALLMENTS]: ['read'],
    [RESOURCES.SETTINGS]: ['read'],
    [RESOURCES.AUDIT_LOGS]: [], // No access
    [RESOURCES.APPROVALS]: ['create'], // Can create approval requests
    [RESOURCES.AI_INSIGHTS]: ['read'], // Basic insights
    [RESOURCES.PREDICTIONS]: ['read'],
  },
}

// Actions that require approval for shop workers
export const WORKER_APPROVAL_REQUIRED: Record<string, string[]> = {
  [RESOURCES.PRODUCTS]: ['update', 'delete'],
  [RESOURCES.INVENTORY]: ['update', 'delete'],
  [RESOURCES.CUSTOMERS]: ['update', 'delete'],
  [RESOURCES.SALES]: ['update', 'delete'],
}

// Helper functions
export function hasPermission(
  userRole: UserRole,
  resource: string,
  action: string
): boolean {
  const rolePermissions = ROLE_PERMISSIONS[userRole]
  
  if (!rolePermissions || !rolePermissions[resource]) {
    return false
  }
  
  const resourcePermissions = rolePermissions[resource]
  
  // Check if user has MANAGE permission (includes all actions)
  if (resourcePermissions.includes('manage')) {
    return true
  }
  
  // Check specific permission
  return resourcePermissions.includes(action)
}

export function requiresApproval(
  userRole: UserRole,
  resource: string,
  action: string
): boolean {
  if (userRole !== UserRole.SHOP_WORKER) {
    return false
  }
  
  const approvalRequired = WORKER_APPROVAL_REQUIRED[resource]
  return approvalRequired ? approvalRequired.includes(action) : false
}

export function getUserPermissions(userRole: UserRole): Record<string, string[]> {
  return ROLE_PERMISSIONS[userRole] || {}
}

export function canAccessResource(
  userRole: UserRole,
  resource: string
): boolean {
  const rolePermissions = ROLE_PERMISSIONS[userRole]
  return rolePermissions && !!rolePermissions[resource]
}

// Permission middleware helper
export function checkPermissions(
  userRole: UserRole,
  requiredResource: string,
  requiredAction: string
) {
  return {
    hasAccess: hasPermission(userRole, requiredResource, requiredAction),
    needsApproval: requiresApproval(userRole, requiredResource, requiredAction),
  }
}

// Default worker permissions (can be customized per worker)
export const DEFAULT_WORKER_PERMISSIONS = {
  canProcessSales: true,
  canViewInventory: true,
  canAddCustomers: true,
  canUpdateCustomers: false, // Requires approval
  canViewReports: true,
  canSubmitClosing: true,
  canViewProducts: true,
  canAddProducts: false, // Requires approval
  canUpdateProducts: false, // Requires approval
  canDeleteProducts: false, // Requires approval
  maxDiscountPercentage: 5,
  maxSaleAmount: 50000, // PKR
  canAccessAI: true,
}

export type WorkerPermissions = typeof DEFAULT_WORKER_PERMISSIONS

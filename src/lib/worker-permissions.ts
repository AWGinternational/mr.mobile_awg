/**
 * Worker Permissions Middleware
 * 
 * Provides utilities for checking and enforcing worker permissions across the application.
 * Single worker role with customizable permissions per individual.
 */

import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { NextResponse } from 'next/server'

// System modules that can be restricted
export enum SystemModule {
  PRODUCT_MANAGEMENT = 'PRODUCT_MANAGEMENT',
  INVENTORY_MANAGEMENT = 'INVENTORY_MANAGEMENT',
  POS_SYSTEM = 'POS_SYSTEM',
  CUSTOMER_MANAGEMENT = 'CUSTOMER_MANAGEMENT',
  SALES_REPORTS = 'SALES_REPORTS',
  SUPPLIER_MANAGEMENT = 'SUPPLIER_MANAGEMENT',
  PAYMENT_PROCESSING = 'PAYMENT_PROCESSING',
  DAILY_CLOSING = 'DAILY_CLOSING',
  LOAN_MANAGEMENT = 'LOAN_MANAGEMENT',
  REPAIR_MANAGEMENT = 'REPAIR_MANAGEMENT',
  SERVICE_MANAGEMENT = 'SERVICE_MANAGEMENT',
  BUSINESS_ANALYTICS = 'BUSINESS_ANALYTICS',
}

// Permission types
export enum Permission {
  VIEW = 'VIEW',
  CREATE = 'CREATE',
  EDIT = 'EDIT',
  DELETE = 'DELETE',
  MANAGE = 'MANAGE', // Full control including settings
}

/**
 * Check if a worker has permission for a specific module and action
 * 
 * @param userId - The user's ID
 * @param shopId - The shop ID
 * @param module - The system module to check
 * @param permission - The permission type to check
 * @returns Promise<boolean> - True if permission granted, false otherwise
 */
export async function checkWorkerPermission(
  userId: string,
  shopId: string,
  module: SystemModule,
  permission: Permission
): Promise<boolean> {
  try {
    // 1. Check if user is owner - owners have all permissions
    const shop = await prisma.shop.findUnique({
      where: { id: shopId },
      select: { ownerId: true },
    })

    if (shop?.ownerId === userId) {
      return true // Owners have all permissions
    }

    // 2. Check if user is an active worker in this shop
    const workerRecord = await prisma.shopWorker.findFirst({
      where: {
        userId,
        shopId,
        isActive: true,
      },
    })

    if (!workerRecord) {
      return false // Not a worker in this shop
    }

    // 3. Check module-specific permissions
    const moduleAccess = await prisma.shopWorkerModuleAccess.findFirst({
      where: {
        shopId,
        workerId: userId,
        module,
        isEnabled: true,
      },
    })

    if (!moduleAccess) {
      return false // Module not enabled for this worker
    }

    // 4. Check if specific permission is granted
    const permissions = moduleAccess.permissions as string[]
    return permissions.includes(permission)
  } catch (error) {
    console.error('❌ Error checking worker permission:', error)
    return false // Deny access on error
  }
}

/**
 * Middleware function to enforce permission check
 * Throws an error if permission is denied
 * 
 * @param module - The system module
 * @param permission - The permission type
 * @returns Middleware function
 */
export function enforcePermission(module: SystemModule, permission: Permission) {
  return async () => {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized - Please log in' },
        { status: 401 }
      )
    }

    // Get worker's shop ID
    const workerRecord = await prisma.shopWorker.findFirst({
      where: {
        userId: session.user.id,
        isActive: true,
      },
      select: {
        shopId: true,
      },
    })

    if (!workerRecord) {
      return NextResponse.json(
        { error: 'Shop not found' },
        { status: 404 }
      )
    }

    // Check permission
    const hasPermission = await checkWorkerPermission(
      session.user.id,
      workerRecord.shopId,
      module,
      permission
    )

    if (!hasPermission) {
      return NextResponse.json(
        {
          error: 'Access denied',
          details: `You don't have ${permission} permission for ${module}`,
        },
        { status: 403 }
      )
    }

    return null // Permission granted
  }
}

/**
 * Check if user is shop owner
 * 
 * @param userId - The user's ID
 * @param shopId - The shop ID
 * @returns Promise<boolean>
 */
export async function isShopOwner(userId: string, shopId: string): Promise<boolean> {
  const shop = await prisma.shop.findUnique({
    where: { id: shopId },
    select: { ownerId: true },
  })

  return shop?.ownerId === userId
}

/**
 * Check if user is worker in a shop
 * 
 * @param userId - The user's ID
 * @param shopId - The shop ID
 * @returns Promise<boolean>
 */
export async function isShopWorker(userId: string, shopId: string): Promise<boolean> {
  const workerRecord = await prisma.shopWorker.findFirst({
    where: {
      userId,
      shopId,
      isActive: true,
    },
  })

  return !!workerRecord
}

/**
 * Get all permissions for a worker in a shop
 * 
 * @param userId - The user's ID
 * @param shopId - The shop ID
 * @returns Promise<Map<SystemModule, Permission[]>>
 */
export async function getWorkerPermissions(
  userId: string,
  shopId: string
): Promise<Map<SystemModule, Permission[]>> {
  const permissions = new Map<SystemModule, Permission[]>()

  // If owner, grant all permissions
  if (await isShopOwner(userId, shopId)) {
    Object.values(SystemModule).forEach((module) => {
      permissions.set(module, Object.values(Permission))
    })
    return permissions
  }

  // Get worker's module access
  const moduleAccess = await prisma.shopWorkerModuleAccess.findMany({
    where: {
      shopId,
      workerId: userId,
      isEnabled: true,
    },
  })

  moduleAccess.forEach((access) => {
    permissions.set(
      access.module as SystemModule,
      access.permissions as Permission[]
    )
  })

  return permissions
}

/**
 * Default permissions for new workers
 * These are the baseline permissions every worker gets
 */
export const DEFAULT_WORKER_PERMISSIONS: Partial<Record<SystemModule, Permission[]>> = {
  // POS - Full access (core function)
  [SystemModule.POS_SYSTEM]: [Permission.VIEW, Permission.CREATE],

  // Products - View only
  [SystemModule.PRODUCT_MANAGEMENT]: [Permission.VIEW],

  // Inventory - View only
  [SystemModule.INVENTORY_MANAGEMENT]: [Permission.VIEW],

  // Customers - Create and edit
  [SystemModule.CUSTOMER_MANAGEMENT]: [Permission.VIEW, Permission.CREATE, Permission.EDIT],

  // Sales Reports - View own only
  [SystemModule.SALES_REPORTS]: [Permission.VIEW],

  // Suppliers - View only
  [SystemModule.SUPPLIER_MANAGEMENT]: [Permission.VIEW],

  // Mobile Services - Full access
  [SystemModule.SERVICE_MANAGEMENT]: [Permission.VIEW, Permission.CREATE],

  // No access to:
  // - PAYMENT_PROCESSING (owner only)
  // - DAILY_CLOSING (owner only)
  // - BUSINESS_ANALYTICS (owner only)
  // - LOAN_MANAGEMENT (owner only)
  // - REPAIR_MANAGEMENT (owner only)
}

/**
 * Initialize default permissions for a new worker
 * 
 * @param workerId - The worker's user ID
 * @param shopId - The shop ID
 */
export async function initializeWorkerPermissions(
  workerId: string,
  shopId: string
): Promise<void> {
  const permissionsToCreate = Object.entries(DEFAULT_WORKER_PERMISSIONS).map(
    ([module, permissions]) => ({
      shopId,
      workerId,
      module: module as SystemModule,
      permissions,
      isEnabled: true,
    })
  )

  await prisma.shopWorkerModuleAccess.createMany({
    data: permissionsToCreate,
    skipDuplicates: true,
  })
}

/**
 * Permission helper for client-side
 * Returns permission status for UI rendering
 */
export interface PermissionStatus {
  canView: boolean
  canCreate: boolean
  canEdit: boolean
  canDelete: boolean
  canManage: boolean
}

/**
 * Get permission status for a module
 * 
 * @param userId - The user's ID
 * @param shopId - The shop ID
 * @param module - The system module
 * @returns Promise<PermissionStatus>
 */
export async function getPermissionStatus(
  userId: string,
  shopId: string,
  module: SystemModule
): Promise<PermissionStatus> {
  const [canView, canCreate, canEdit, canDelete, canManage] = await Promise.all([
    checkWorkerPermission(userId, shopId, module, Permission.VIEW),
    checkWorkerPermission(userId, shopId, module, Permission.CREATE),
    checkWorkerPermission(userId, shopId, module, Permission.EDIT),
    checkWorkerPermission(userId, shopId, module, Permission.DELETE),
    checkWorkerPermission(userId, shopId, module, Permission.MANAGE),
  ])

  return {
    canView,
    canCreate,
    canEdit,
    canDelete,
    canManage,
  }
}

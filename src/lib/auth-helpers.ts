/**
 * Authentication and Authorization Helper Functions
 * Centralized utilities for shop-based multitenancy
 */

import { Session } from 'next-auth'
import { prisma } from '@/lib/db'
import { UserRole } from '@/types'

/**
 * Get the current user's assigned shop ID
 * Supports both Shop Owners and Shop Workers
 * 
 * @param session - NextAuth session object
 * @returns shopId string or null if no shop assigned
 * 
 * @example
 * const shopId = await getUserShopId(session)
 * if (!shopId) {
 *   return NextResponse.json({ error: 'No shop assigned' }, { status: 400 })
 * }
 */
export async function getUserShopId(session: Session | null): Promise<string | null> {
  if (!session?.user) return null
  
  // Super Admin - no single shop (can access all shops)
  if (session.user.role === UserRole.SUPER_ADMIN) {
    return null // Super Admin should handle shop selection separately
  }
  
  // Try session shops first (Shop Owner/Admin)
  const userShops = (session.user as any).shops || []
  if (userShops.length > 0) {
    return userShops[0].id
  }
  
  // Try ShopWorker relation (Workers)
  if (session.user.role === UserRole.SHOP_WORKER) {
    const worker = await prisma.shopWorker.findFirst({
      where: { 
        userId: session.user.id,
        isActive: true 
      },
      select: {
        shopId: true
      }
    })
    return worker?.shopId || null
  }
  
  return null
}

/**
 * Get the current user's assigned shop ID with error throwing
 * Use this when shopId is required and missing shop should throw error
 * 
 * @param session - NextAuth session object
 * @returns shopId string
 * @throws Error if no shop assigned
 * 
 * @example
 * try {
 *   const shopId = await requireUserShopId(session)
 *   // Use shopId safely
 * } catch (error) {
 *   return NextResponse.json({ error: error.message }, { status: 400 })
 * }
 */
export async function requireUserShopId(session: Session | null): Promise<string> {
  const shopId = await getUserShopId(session)
  
  if (!shopId) {
    throw new Error('No shop assigned to user')
  }
  
  return shopId
}

/**
 * Verify that a user has access to a specific shop
 * 
 * @param session - NextAuth session object
 * @param shopId - Shop ID to verify access to
 * @returns true if user has access, false otherwise
 * 
 * @example
 * const hasAccess = await verifyShopAccess(session, shopId)
 * if (!hasAccess) {
 *   return NextResponse.json({ error: 'Access denied' }, { status: 403 })
 * }
 */
export async function verifyShopAccess(
  session: Session | null,
  shopId: string
): Promise<boolean> {
  if (!session?.user) return false
  
  // Super Admin has access to all shops
  if (session.user.role === UserRole.SUPER_ADMIN) {
    return true
  }
  
  // Get user's assigned shop
  const userShopId = await getUserShopId(session)
  
  // Check if user's shop matches requested shop
  return userShopId === shopId
}

/**
 * Get user's shop with full details
 * 
 * @param session - NextAuth session object
 * @returns Shop object or null
 */
export async function getUserShop(session: Session | null) {
  const shopId = await getUserShopId(session)
  
  if (!shopId) return null
  
  return await prisma.shop.findUnique({
    where: { id: shopId },
    include: {
      owner: {
        select: {
          id: true,
          name: true,
          email: true
        }
      }
    }
  })
}

/**
 * Check if user has specific permission for a module
 * 
 * @param session - NextAuth session object
 * @param module - System module to check
 * @param permission - Permission to verify
 * @returns true if user has permission, false otherwise
 */
export async function hasModulePermission(
  session: Session | null,
  module: string,
  permission: string
): Promise<boolean> {
  if (!session?.user) return false
  
  // Super Admin has all permissions
  if (session.user.role === UserRole.SUPER_ADMIN) {
    return true
  }
  
  // Shop Owner has all permissions for their shop
  if (session.user.role === UserRole.SHOP_OWNER) {
    return true
  }
  
  // Check Shop Worker permissions
  if (session.user.role === UserRole.SHOP_WORKER) {
    const shopId = await getUserShopId(session)
    
    if (!shopId) return false
    
    const access = await prisma.shopWorkerModuleAccess.findFirst({
      where: {
        workerId: session.user.id,
        shopId: shopId,
        module: module as any,
        isEnabled: true
      }
    })
    
    return access ? access.permissions.includes(permission as any) : false
  }
  
  return false
}

/**
 * Get all shops accessible by the current user
 * Super Admin: All shops
 * Shop Owner: Owned shops
 * Shop Worker: Assigned shops
 * 
 * @param session - NextAuth session object
 * @returns Array of shop IDs
 */
export async function getAccessibleShopIds(session: Session | null): Promise<string[]> {
  if (!session?.user) return []
  
  // Super Admin can access all shops
  if (session.user.role === UserRole.SUPER_ADMIN) {
    const shops = await prisma.shop.findMany({
      select: { id: true }
    })
    return shops.map(shop => shop.id)
  }
  
  // Shop Owner - return owned shops
  if (session.user.role === UserRole.SHOP_OWNER) {
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: {
        ownedShops: {
          where: { status: 'ACTIVE' },
          select: { id: true }
        }
      }
    })
    return user?.ownedShops.map(shop => shop.id) || []
  }
  
  // Shop Worker - return assigned shops
  if (session.user.role === UserRole.SHOP_WORKER) {
    const workers = await prisma.shopWorker.findMany({
      where: {
        userId: session.user.id,
        isActive: true
      },
      select: { shopId: true }
    })
    return workers.map(w => w.shopId)
  }
  
  return []
}

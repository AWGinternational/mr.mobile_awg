// Shop Context Middleware - Determines which shop database to use for requests
// This middleware extracts shop context from requests and provides shop-specific database connections

import { NextRequest } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { ShopDatabaseManager } from './shop-database'
import { PrismaClient } from '../generated/prisma'

export interface ShopContext {
  shopId: string
  shopDB: PrismaClient
  user: {
    id: string
    email: string
    role: string
    name: string
  }
  shop: {
    id: string
    name: string
    code: string
    settings: unknown
    owner: {
      id: string
      name: string
      email: string
      phone?: string
    }
  }
}

/**
 * Get shop context from request
 * Determines shop from URL parameters, user default, or subdomain
 */
export async function getShopContext(request: NextRequest): Promise<ShopContext> {
  // Get user session
  const session = await getServerSession(authOptions)
  if (!session?.user) {
    throw new Error('Unauthorized: User session required')
  }

  // Extract shop ID from request
  const shopId = await getShopIdFromRequest(request, session.user)
  
  // Validate user has access to this shop
  const hasAccess = await ShopDatabaseManager.hasShopAccess(
    session.user.id,
    session.user.role,
    shopId
  )
  
  if (!hasAccess) {
    throw new Error(`Access denied: User does not have access to shop ${shopId}`)
  }

  // Get shop database connection
  const shopDB = await ShopDatabaseManager.getShopDatabase(shopId)
  
  // Get shop information
  const shopInfo = await ShopDatabaseManager.getShopInfo(shopId)
  if (!shopInfo) {
    throw new Error(`Shop ${shopId} not found`)
  }

  return {
    shopId,
    shopDB,
    user: session.user,
    shop: {
      ...shopInfo,
      owner: {
        ...shopInfo.owner,
        phone: shopInfo.owner.phone || undefined
      }
    }
  }
}

/**
 * Extract shop ID from request using multiple strategies
 */
async function getShopIdFromRequest(request: NextRequest, user: { id: string; role: string; email?: string }): Promise<string> {
  const url = new URL(request.url)
  
  // Strategy 1: URL query parameter (?shopId=xxx)
  const shopIdParam = url.searchParams.get('shopId')
  if (shopIdParam) {
    return shopIdParam
  }

  // Strategy 2: Subdomain (shop1.yourapp.com)
  const hostname = url.hostname
  if (hostname.includes('.') && !hostname.startsWith('www')) {
    const subdomain = hostname.split('.')[0]
    // Look up shop by subdomain
    const shopBySubdomain = await ShopDatabaseManager.getShopBySubdomain(subdomain)
    if (shopBySubdomain) {
      return shopBySubdomain.id
    }
  }

  // Strategy 3: Path-based (/shops/sh001/api/...)
  const pathMatch = url.pathname.match(/\/shops\/([^\/]+)\//)
  if (pathMatch) {
    return pathMatch[1]
  }

  // Strategy 4: User's default/first accessible shop
  const userShops = await ShopDatabaseManager.getUserShops(user.id, user.role)
  if (userShops.length > 0) {
    return userShops[0].id
  }

  throw new Error('No accessible shop found for user')
}

/**
 * Wrapper for API routes to automatically inject shop context
 */
export function withShopContext(
  handler: (context: ShopContext, ...args: unknown[]) => Promise<Response>
) {
  return async (request: NextRequest, ...args: unknown[]): Promise<Response> => {
    try {
      const context = await getShopContext(request)
      return await handler(context, ...args)
    } catch (error) {
      console.error('Shop context error:', error)
      return new Response(
        JSON.stringify({ 
          error: error instanceof Error ? error.message : 'Shop context error' 
        }),
        { 
          status: error instanceof Error && error.message.includes('Unauthorized') ? 401 : 400,
          headers: { 'Content-Type': 'application/json' }
        }
      )
    }
  }
}

/**
 * Get multiple shop contexts for super admin operations
 */
export async function getMultiShopContext(_request: NextRequest): Promise<{
  user: { id: string; role: string; email?: string; name?: string }
  shops: Array<{ id: string; name?: string; code?: string }>
  getShopDB: (shopId: string) => Promise<PrismaClient>
}> {
  const session = await getServerSession(authOptions)
  if (!session?.user || session.user.role !== 'SUPER_ADMIN') {
    throw new Error('Super admin access required')
  }

  const userShops = await ShopDatabaseManager.getUserShops(session.user.id, session.user.role)

  return {
    user: session.user,
    shops: userShops,
    getShopDB: (shopId: string) => ShopDatabaseManager.getShopDatabase(shopId)
  }
}

/**
 * Simple helper to get shop ID from query parameters
 */
export function getShopIdFromQuery(request: NextRequest): string | null {
  const url = new URL(request.url)
  return url.searchParams.get('shopId')
}

/**
 * Helper to validate shop access without full context
 */
export async function validateShopAccess(request: NextRequest, shopId: string): Promise<boolean> {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) return false

    return await ShopDatabaseManager.hasShopAccess(
      session.user.id,
      session.user.role,
      shopId
    )
  } catch {
    return false
  }
}

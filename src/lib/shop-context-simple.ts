// Shop Context for Single Database with ShopId Fields
// This replaces the complex multi-database approach with a simple shopId-based approach

import { NextRequest } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from './db'

export interface SimpleShopContext {
  shopId: string
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
    status: string
  }
}

/**
 * Get shop context from request using single database approach
 */
export async function getSimpleShopContext(request: NextRequest): Promise<SimpleShopContext> {
  // Get user session
  const session = await getServerSession(authOptions)
  if (!session?.user) {
    throw new Error('Unauthorized: User session required')
  }

  // Get user with shop relationships
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    include: {
      ownedShops: {
        where: { status: 'ACTIVE' },
        select: { id: true, name: true, code: true, status: true }
      },
      workerShops: {
        where: { 
          isActive: true,
          shop: { status: 'ACTIVE' }
        },
        include: {
          shop: {
            select: { id: true, name: true, code: true, status: true }
          }
        }
      }
    }
  })

  if (!user) {
    throw new Error('User not found')
  }

  // Determine accessible shops
  let accessibleShops: Array<{ id: string; name: string; code: string; status: string }> = []
  
  if (user.role === 'SUPER_ADMIN') {
    // Super admin can access all shops
    const allShops = await prisma.shop.findMany({
      where: { status: 'ACTIVE' },
      select: { id: true, name: true, code: true, status: true }
    })
    accessibleShops = allShops
  } else if (user.role === 'SHOP_OWNER') {
    // Shop owner can access owned shops
    accessibleShops = user.ownedShops
  } else if (user.role === 'SHOP_WORKER') {
    // Shop worker can access assigned shops
    accessibleShops = user.workerShops.map(ws => ws.shop)
  }

  if (accessibleShops.length === 0) {
    throw new Error('No accessible shop found for user')
  }

  // Get shop ID from request or use first accessible shop
  const url = new URL(request.url)
  const shopIdParam = url.searchParams.get('shopId')
  
  let selectedShop: { id: string; name: string; code: string; status: string }

  if (shopIdParam) {
    // Validate user has access to requested shop
    const requestedShop = accessibleShops.find(s => s.id === shopIdParam)
    if (!requestedShop) {
      throw new Error(`Access denied: User does not have access to shop ${shopIdParam}`)
    }
    selectedShop = requestedShop
  } else {
    // Use first accessible shop as default
    selectedShop = accessibleShops[0]
  }

  return {
    shopId: selectedShop.id,
    user: {
      id: session.user.id,
      email: session.user.email || '',
      role: session.user.role || '',
      name: session.user.name || ''
    },
    shop: selectedShop
  }
}

/**
 * Wrapper for API routes to automatically inject simple shop context
 */
export function withSimpleShopContext<T extends Record<string, any>>(
  handler: (context: SimpleShopContext, ...args: any[]) => Promise<Response>
) {
  return async (request: NextRequest, ...args: any[]): Promise<Response> => {
    try {
      const context = await getSimpleShopContext(request)
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
 * Helper to validate shop access for simple approach
 */
export async function validateSimpleShopAccess(userId: string, userRole: string, shopId: string): Promise<boolean> {
  try {
    if (userRole === 'SUPER_ADMIN') {
      return true
    }

    if (userRole === 'SHOP_OWNER') {
      const shop = await prisma.shop.findFirst({
        where: {
          id: shopId,
          ownerId: userId,
          status: 'ACTIVE'
        }
      })
      return !!shop
    }

    if (userRole === 'SHOP_WORKER') {
      const workerShop = await prisma.shopWorker.findFirst({
        where: {
          userId: userId,
          shopId: shopId,
          isActive: true,
          shop: { status: 'ACTIVE' }
        }
      })
      return !!workerShop
    }

    return false
  } catch {
    return false
  }
}

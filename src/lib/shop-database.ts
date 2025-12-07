// Shop Database Manager - Multi-tenant database connection handler
// This manages separate database connections for each shop

import { PrismaClient } from '../generated/prisma'

// Master database connection (for shop registry and user management)
const masterPrisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL
    }
  }
})

// Shop database connections cache
const shopConnections = new Map<string, PrismaClient>()

export class ShopDatabaseManager {
  /**
   * Get shop-specific database connection
   * @param shopId - The shop ID
   * @returns PrismaClient instance for the shop
   */
  static async getShopDatabase(shopId: string): Promise<PrismaClient> {
    // Return cached connection if exists
    if (shopConnections.has(shopId)) {
      return shopConnections.get(shopId)!
    }

    // Get shop info from master database
    const shop = await masterPrisma.shop.findUnique({
      where: { id: shopId },
      select: {
        id: true,
        databaseUrl: true,
        databaseName: true,
        isInitialized: true,
        status: true
      }
    })

    if (!shop) {
      throw new Error(`Shop with ID ${shopId} not found`)
    }

    if (shop.status !== 'ACTIVE') {
      throw new Error(`Shop ${shopId} is not active`)
    }

    if (!shop.isInitialized) {
      throw new Error(`Shop ${shopId} database is not initialized`)
    }

    // Create new shop database connection
    const shopPrisma = new PrismaClient({
      datasources: {
        db: {
          url: shop.databaseUrl
        }
      }
    })

    // Cache the connection
    shopConnections.set(shopId, shopPrisma)

    return shopPrisma
  }

  /**
   * Get shop info from master database
   * @param shopId - The shop ID
   */
  static async getShopInfo(shopId: string) {
    return await masterPrisma.shop.findUnique({
      where: { id: shopId },
      include: {
        owner: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true
          }
        }
      }
    })
  }

  /**
   * Initialize a new shop database
   * @param shopId - The shop ID
   * @param databaseUrl - The database URL for the shop
   */
  static async initializeShopDatabase(shopId: string, databaseUrl: string) {
    try {
      // Create connection to new shop database
      const shopPrisma = new PrismaClient({
        datasources: {
          db: { url: databaseUrl }
        }
      })

      // Test connection
      await shopPrisma.$connect()

      // Run migrations (you'll need to implement this)
      // await this.runShopMigrations(shopPrisma)

      // Update shop status in master database
      await masterPrisma.shop.update({
        where: { id: shopId },
        data: {
          isInitialized: true,
          databaseUrl: databaseUrl
        }
      })

      // Cache the connection
      shopConnections.set(shopId, shopPrisma)

      console.log(`Shop ${shopId} database initialized successfully`)
      return shopPrisma

    } catch (error) {
      console.error(`Failed to initialize shop ${shopId} database:`, error)
      throw error
    }
  }

  /**
   * Close specific shop database connection
   * @param shopId - The shop ID
   */
  static async closeShopConnection(shopId: string) {
    const connection = shopConnections.get(shopId)
    if (connection) {
      await connection.$disconnect()
      shopConnections.delete(shopId)
    }
  }

  /**
   * Close all shop database connections
   */
  static async closeAllConnections() {
    const promises = Array.from(shopConnections.values()).map(client => 
      client.$disconnect()
    )
    await Promise.all(promises)
    shopConnections.clear()
  }

  /**
   * Get list of shops user has access to
   * @param userId - The user ID
   * @param userRole - The user role
   */
  static async getUserShops(userId: string, userRole: string) {
    if (userRole === 'SUPER_ADMIN') {
      // Super admin can access all shops
      return await masterPrisma.shop.findMany({
        where: { status: 'ACTIVE' },
        include: {
          owner: {
            select: { name: true, email: true }
          }
        }
      })
    } else if (userRole === 'SHOP_OWNER') {
      // Shop owner can access owned shops
      return await masterPrisma.shop.findMany({
        where: {
          ownerId: userId,
          status: 'ACTIVE'
        }
      })
    } else if (userRole === 'SHOP_WORKER') {
      // Shop worker can access assigned shops
      const workerShops = await masterPrisma.shopWorker.findMany({
        where: {
          userId: userId,
          isActive: true,
          shop: {
            status: 'ACTIVE'
          }
        },
        include: {
          shop: true
        }
      })
      return workerShops.map((ws: { shop: unknown }) => ws.shop).filter(Boolean)
    }

    return []
  }

  /**
   * Check if user has access to specific shop
   * @param userId - The user ID
   * @param userRole - The user role
   * @param shopId - The shop ID to check access for
   */
  static async hasShopAccess(userId: string, userRole: string, shopId: string): Promise<boolean> {
    if (userRole === 'SUPER_ADMIN') {
      return true
    }

    if (userRole === 'SHOP_OWNER') {
      const shop = await masterPrisma.shop.findFirst({
        where: {
          id: shopId,
          ownerId: userId,
          status: 'ACTIVE'
        }
      })
      return !!shop
    }

    if (userRole === 'SHOP_WORKER') {
      const workerShop = await masterPrisma.shopWorker.findFirst({
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
  }

  /**
   * Get shop by subdomain
   * @param subdomain - The subdomain to search for
   */
  static async getShopBySubdomain(subdomain: string) {
    return await masterPrisma.shop.findFirst({
      where: {
        subdomain: subdomain,
        status: 'ACTIVE'
      },
      select: {
        id: true,
        name: true,
        code: true,
        subdomain: true
      }
    })
  }
}

// Export master database for direct access when needed
export { masterPrisma }

// Cleanup on process exit
process.on('beforeExit', async () => {
  await ShopDatabaseManager.closeAllConnections()
  await masterPrisma.$disconnect()
})

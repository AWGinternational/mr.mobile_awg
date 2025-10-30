import { PrismaClient } from '../generated/prisma'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

export const prisma = globalForPrisma.prisma ?? new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
  datasources: {
    db: {
      url: process.env.DATABASE_URL,
    },
  },
})

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma

// Shop-specific database connections
const shopConnections = new Map<string, PrismaClient>()

export function getShopPrisma(shopId: string): PrismaClient {
  if (!shopConnections.has(shopId)) {
    const shopDbUrl = `${process.env.SHOP_DATABASE_PREFIX}${shopId}`
    
    const shopPrisma = new PrismaClient({
      log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
      datasources: {
        db: {
          url: shopDbUrl,
        },
      },
    })
    
    shopConnections.set(shopId, shopPrisma)
  }
  
  return shopConnections.get(shopId)!
}

// Clean up connections on app shutdown
process.on('beforeExit', async () => {
  await prisma.$disconnect()
  
  for (const [shopId, connection] of shopConnections) {
    await connection.$disconnect()
  }
})

// Database utilities
export async function createShopDatabase(shopId: string, shopCode: string) {
  try {
    // This would be implemented based on your hosting provider
    // For now, we'll assume the database is already created
    const shopDbUrl = `${process.env.SHOP_DATABASE_PREFIX}${shopId}`
    
    // Initialize shop-specific Prisma client
    const shopPrisma = new PrismaClient({
      datasources: {
        db: {
          url: shopDbUrl,
        },
      },
    })
    
    // Run migrations for shop database
    // Note: In production, you'd run migrations via Prisma CLI or programmatically
    
    await shopPrisma.$disconnect()
    
    return shopDbUrl
  } catch (error) {
    console.error('Failed to create shop database:', error)
    throw error
  }
}

export async function healthCheck() {
  try {
    await prisma.$queryRaw`SELECT 1`
    return { status: 'healthy', timestamp: new Date().toISOString() }
  } catch (error) {
    console.error('Database health check failed:', error)
    return { status: 'unhealthy', error: error instanceof Error ? error.message : 'Unknown error' }
  }
}

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'

// GET /api/shops/[id]/stats - Get shop statistics
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const params = await context.params
    const shopId = params.id

    // Verify access to this shop
    let hasAccess = false

    if (session.user.role === 'SUPER_ADMIN') {
      hasAccess = true
    } else if (session.user.role === 'SHOP_OWNER') {
      const shop = await prisma.shop.findFirst({
        where: { id: shopId, ownerId: session.user.id }
      })
      hasAccess = !!shop
    } else if (session.user.role === 'SHOP_WORKER') {
      const workerAssignment = await prisma.shopWorker.findFirst({
        where: {
          userId: session.user.id,
          shopId: shopId,
          isActive: true
        }
      })
      hasAccess = !!workerAssignment
    }

    if (!hasAccess) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    // Get shop basic info
    const shop = await prisma.shop.findUnique({
      where: { id: shopId },
      select: {
        id: true,
        name: true,
        code: true,
        status: true,
        createdAt: true
      }
    })

    if (!shop) {
      return NextResponse.json({ error: 'Shop not found' }, { status: 404 })
    }

    // Calculate statistics
    const [
      totalWorkers,
      activeWorkers,
      recentAuditLogs
    ] = await Promise.all([
      // Total workers ever assigned
      prisma.shopWorker.count({
        where: { shopId }
      }),
      
      // Currently active workers
      prisma.shopWorker.count({
        where: { shopId, isActive: true }
      }),
      
      // Recent audit logs for this shop
      prisma.auditLog.count({
        where: {
          tableName: { in: ['shops', 'shop_workers'] },
          recordId: shopId,
          createdAt: {
            gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) // Last 30 days
          }
        }
      })
    ])

    // Get worker details
    const workers = await prisma.shopWorker.findMany({
      where: { shopId, isActive: true },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true
          }
        }
      },
      orderBy: { joinedAt: 'desc' }
    })

    // Calculate shop age
    const shopAgeInDays = Math.floor(
      (new Date().getTime() - shop.createdAt.getTime()) / (1000 * 60 * 60 * 24)
    )

    const stats = {
      shop: {
        id: shop.id,
        name: shop.name,
        code: shop.code,
        status: shop.status,
        ageInDays: shopAgeInDays
      },
      workers: {
        total: totalWorkers,
        active: activeWorkers,
        capacity: 2, // From shop settings - could be dynamic
        utilization: Math.round((activeWorkers / 2) * 100)
      },
      activity: {
        recentAuditLogs
      },
      activeWorkers: workers.map(worker => ({
        id: worker.user.id,
        name: worker.user.name,
        email: worker.user.email,
        phone: worker.user.phone,
        joinedAt: worker.joinedAt,
        permissions: worker.permissions
      }))
    }

    return NextResponse.json(stats)

  } catch (error) {
    console.error('Failed to fetch shop stats:', error)
    return NextResponse.json(
      { error: 'Failed to fetch shop statistics' },
      { status: 500 }
    )
  }
}

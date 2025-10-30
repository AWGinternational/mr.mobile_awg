import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'

/**
 * GET /api/workers/my-permissions
 * Returns the current worker's module access permissions
 * Used by the sidebar to dynamically filter modules based on VIEW permission
 */
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Only workers need this endpoint
    if (session.user.role !== 'SHOP_WORKER') {
      return NextResponse.json(
        { success: true, permissions: {} }, // Owners see everything
        { status: 200 }
      )
    }

    // Get the shop the worker belongs to
    const shopWorker = await prisma.shopWorker.findFirst({
      where: {
        userId: session.user.id,
        isActive: true
      },
      include: {
        shop: {
          select: {
            id: true,
            name: true
          }
        }
      }
    })

    if (!shopWorker) {
      return NextResponse.json(
        { success: false, error: 'Worker record not found' },
        { status: 404 }
      )
    }

    // Fetch worker's module access permissions
    const moduleAccess = await prisma.shopWorkerModuleAccess.findMany({
      where: {
        workerId: session.user.id,
        shopId: shopWorker.shopId,
        isEnabled: true
      },
      select: {
        module: true,
        permissions: true
      }
    })

    // Transform to object format: { 'POS_SYSTEM': ['VIEW', 'CREATE'], ... }
    const permissions = moduleAccess.reduce((acc, item) => {
      acc[item.module] = item.permissions
      return acc
    }, {} as { [key: string]: string[] })

    console.log(`Worker permissions for ${session.user.email}:`, permissions)

    return NextResponse.json({
      success: true,
      permissions,
      shopId: shopWorker.shopId,
      shopName: shopWorker.shop.name
    })

  } catch (error) {
    console.error('Error fetching worker permissions:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch permissions' },
      { status: 500 }
    )
  }
}

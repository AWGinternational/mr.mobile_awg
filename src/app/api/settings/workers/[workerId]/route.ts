import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { UserRole } from '@/types'

/**
 * PATCH /api/settings/workers/[workerId]
 * Update worker permissions
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ workerId: string }> }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || !session.user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Only shop owners can update worker permissions
    if (session.user.role !== UserRole.SHOP_OWNER && session.user.role !== UserRole.SUPER_ADMIN) {
      return NextResponse.json(
        { success: false, error: 'Access denied' },
        { status: 403 }
      )
    }

    const { workerId } = await params
    const body = await request.json()
    const { permissions } = body

    // Get the shop
    const shop = await prisma.shop.findFirst({
      where: { ownerId: session.user.id },
      select: { id: true }
    })

    if (!shop) {
      return NextResponse.json(
        { success: false, error: 'Shop not found' },
        { status: 404 }
      )
    }

    // Verify the worker belongs to this shop
    const shopWorker = await prisma.shopWorker.findFirst({
      where: {
        userId: workerId,
        shopId: shop.id
      }
    })

    if (!shopWorker) {
      return NextResponse.json(
        { success: false, error: 'Worker not found in your shop' },
        { status: 404 }
      )
    }

    // Delete existing permissions
    await prisma.shopWorkerModuleAccess.deleteMany({
      where: {
        shopId: shop.id,
        workerId: workerId
      }
    })

    // Create new permissions
    const permissionsToCreate = Object.entries(permissions).map(
      ([module, perms]) => ({
        shopId: shop.id,
        workerId: workerId,
        module: module as any,
        permissions: perms as any,
        isEnabled: true
      })
    )

    await prisma.shopWorkerModuleAccess.createMany({
      data: permissionsToCreate
    })

    return NextResponse.json({
      success: true,
      data: {
        message: 'Worker permissions updated successfully'
      }
    })
  } catch (error) {
    console.error('❌ Error updating worker permissions:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}

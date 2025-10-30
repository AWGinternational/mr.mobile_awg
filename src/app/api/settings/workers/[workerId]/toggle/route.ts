import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { UserRole } from '@/types'

/**
 * PATCH /api/settings/workers/[workerId]/toggle
 * Toggle worker active/inactive status
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

    // Only shop owners can toggle worker status
    if (session.user.role !== UserRole.SHOP_OWNER && session.user.role !== UserRole.SUPER_ADMIN) {
      return NextResponse.json(
        { success: false, error: 'Access denied' },
        { status: 403 }
      )
    }

    const { workerId } = await params
    const body = await request.json()
    const { isActive } = body

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

    // Update worker status
    await prisma.shopWorker.updateMany({
      where: {
        userId: workerId,
        shopId: shop.id
      },
      data: {
        isActive
      }
    })

    return NextResponse.json({
      success: true,
      data: {
        message: `Worker ${isActive ? 'activated' : 'deactivated'} successfully`
      }
    })
  } catch (error) {
    console.error('❌ Error toggling worker status:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}

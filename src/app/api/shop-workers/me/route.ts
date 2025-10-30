import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { UserRole } from '@/types'

/**
 * GET /api/shop-workers/me
 * Get the current worker's shop assignment
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Only workers should use this endpoint
    if (session.user.role !== UserRole.SHOP_WORKER) {
      return NextResponse.json({ 
        error: 'This endpoint is for shop workers only' 
      }, { status: 403 })
    }

    // Get worker's shop assignment
    const workerAssignment = await prisma.shopWorker.findFirst({
      where: {
        userId: session.user.id,
        isActive: true
      },
      include: {
        shop: {
          select: {
            id: true,
            name: true,
            code: true,
            address: true,
            city: true,
            province: true
          }
        }
      }
    })

    if (!workerAssignment) {
      return NextResponse.json({ 
        error: 'No active shop assignment found' 
      }, { status: 404 })
    }

    return NextResponse.json({
      shopId: workerAssignment.shopId,
      shop: workerAssignment.shop,
      joinedAt: workerAssignment.joinedAt,
      permissions: workerAssignment.permissions
    })
  } catch (error) {
    console.error('Error fetching worker shop:', error)
    return NextResponse.json(
      { error: 'Failed to fetch shop information' },
      { status: 500 }
    )
  }
}

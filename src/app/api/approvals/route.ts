import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { UserRole } from '@/types'

/**
 * GET /api/approvals
 * Fetch approval requests for the shop owner
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || !session.user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Only shop owners can view approval requests
    if (session.user.role !== UserRole.SHOP_OWNER && session.user.role !== UserRole.SUPER_ADMIN) {
      return NextResponse.json(
        { success: false, error: 'Access denied' },
        { status: 403 }
      )
    }

    // Get query params
    const { searchParams } = new URL(request.url)
    const statusFilter = searchParams.get('status') || 'ALL'

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

    // Build where clause
    const where: any = {
      shopId: shop.id
    }

    if (statusFilter !== 'ALL') {
      where.status = statusFilter
    }

    // Fetch approval requests
    const requests = await prisma.approvalRequest.findMany({
      where,
      include: {
        worker: {
          select: {
            name: true,
            email: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    return NextResponse.json({
      success: true,
      data: {
        requests: requests.map(req => ({
          id: req.id,
          type: req.type,
          tableName: req.tableName,
          recordId: req.recordId,
          requestData: req.requestData,
          reason: req.reason,
          status: req.status,
          createdAt: req.createdAt.toISOString(),
          worker: req.worker
        }))
      }
    })
  } catch (error) {
    console.error('❌ Error fetching approval requests:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}

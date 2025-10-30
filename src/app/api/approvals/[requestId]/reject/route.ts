import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { UserRole } from '@/types'

/**
 * POST /api/approvals/[requestId]/reject
 * Reject a worker's change request
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ requestId: string }> }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || !session.user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Only shop owners can reject requests
    if (session.user.role !== UserRole.SHOP_OWNER && session.user.role !== UserRole.SUPER_ADMIN) {
      return NextResponse.json(
        { success: false, error: 'Access denied' },
        { status: 403 }
      )
    }

    const { requestId } = await params
    const body = await request.json()
    const { reviewNotes } = body

    // Get the approval request
    const approvalRequest = await prisma.approvalRequest.findUnique({
      where: { id: requestId }
    })

    if (!approvalRequest) {
      return NextResponse.json(
        { success: false, error: 'Request not found' },
        { status: 404 }
      )
    }

    // Verify ownership
    const shop = await prisma.shop.findFirst({
      where: {
        id: approvalRequest.shopId,
        ownerId: session.user.id
      }
    })

    if (!shop) {
      return NextResponse.json(
        { success: false, error: 'Access denied' },
        { status: 403 }
      )
    }

    // Update approval request
    await prisma.approvalRequest.update({
      where: { id: requestId },
      data: {
        status: 'REJECTED',
        approvedBy: session.user.id,
        approvedAt: new Date(),
        rejectionReason: reviewNotes || 'Request rejected by owner'
      }
    })

    return NextResponse.json({
      success: true,
      data: {
        message: 'Request rejected'
      }
    })
  } catch (error) {
    console.error('❌ Error rejecting request:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}

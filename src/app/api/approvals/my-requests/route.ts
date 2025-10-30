import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(req.url)
    const statusFilter = searchParams.get('status') || 'ALL'

    // Get worker's requests
    const whereClause: any = {
      workerId: session.user.id,
    }

    if (statusFilter !== 'ALL') {
      whereClause.status = statusFilter
    }

    const requests = await prisma.approvalRequest.findMany({
      where: whereClause,
      include: {
        reviewer: {
          select: {
            name: true,
            email: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    })

    // Transform the data to match the frontend interface
    const transformedRequests = requests.map((request) => ({
      id: request.id,
      type: request.type,
      tableName: request.tableName,
      recordId: request.recordId,
      requestData: request.requestData,
      reason: request.reason || 'No reason provided',
      status: request.status,
      createdAt: request.createdAt.toISOString(),
      approvedAt: request.approvedAt?.toISOString() || null,
      approvedBy: request.approvedBy || null,
      rejectionReason: request.rejectionReason,
      reviewer: request.reviewer,
    }))

    return NextResponse.json({
      success: true,
      data: {
        requests: transformedRequests,
      },
    })
  } catch (error) {
    console.error('Error fetching worker requests:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch requests' },
      { status: 500 }
    )
  }
}

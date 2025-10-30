import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { UserRole } from '@/types'

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Only SUPER_ADMIN can view audit logs
    if (session.user.role !== UserRole.SUPER_ADMIN) {
      return NextResponse.json(
        { error: 'Only Super Admins can view audit logs' },
        { status: 403 }
      )
    }

    const params = await context.params

    // Fetch audit logs for the user
    const logs = await prisma.auditLog.findMany({
      where: {
        OR: [
          { userId: params.id }, // Actions performed by this user
          { recordId: params.id } // Actions performed on this user
        ]
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: 100 // Limit to last 100 logs
    })

    return NextResponse.json({
      success: true,
      logs
    })
  } catch (error) {
    console.error('Audit log fetch error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}


import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'

/**
 * DELETE /api/daily-closing/[id]
 * Delete a daily closing record
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params

    // Get shop ID
    let shopId: string | undefined = session.user.shops?.[0]?.id
    
    if (!shopId && session.user.role === 'SHOP_WORKER') {
      const worker = await prisma.shopWorker.findFirst({
        where: { userId: session.user.id, isActive: true }
      })
      shopId = worker?.shopId
    }

    if (!shopId) {
      return NextResponse.json({ error: 'No shop assigned to user' }, { status: 400 })
    }

    // Verify the closing belongs to the user's shop
    const existingClosing = await prisma.dailyClosing.findFirst({
      where: {
        id,
        shopId
      }
    })

    if (!existingClosing) {
      return NextResponse.json({ error: 'Daily closing not found' }, { status: 404 })
    }

    // Delete the closing
    await prisma.dailyClosing.delete({
      where: { id }
    })

    return NextResponse.json({
      success: true,
      message: 'Daily closing deleted successfully'
    }, { status: 200 })

  } catch (error) {
    console.error('Delete daily closing API error:', error)
    return NextResponse.json({ 
      error: 'Internal server error', 
      details: error instanceof Error ? error.message : 'Unknown error' 
    }, { status: 500 })
  }
}


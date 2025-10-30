import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { UserRole } from '@/types'

/**
 * GET /api/settings/fees
 * Fetch shop's service fees configuration
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

    // Only shop owners and workers can view fees
    if (session.user.role !== UserRole.SHOP_OWNER && 
        session.user.role !== UserRole.SUPER_ADMIN &&
        session.user.role !== UserRole.SHOP_WORKER) {
      return NextResponse.json(
        { success: false, error: 'Access denied' },
        { status: 403 }
      )
    }

    // Get the shop for the current user
    let shop = null

    if (session.user.role === UserRole.SHOP_OWNER) {
      shop = await prisma.shop.findFirst({
        where: { ownerId: session.user.id },
        select: { id: true, settings: true }
      })
    } else if (session.user.role === UserRole.SHOP_WORKER) {
      // For workers, get shop through their worker record
      const worker = await prisma.shopWorker.findFirst({
        where: { userId: session.user.id, isActive: true },
        include: { shop: { select: { id: true, settings: true } } }
      })
      shop = worker?.shop || null
    }

    if (!shop) {
      return NextResponse.json(
        { success: false, error: 'Shop not found' },
        { status: 404 }
      )
    }

    // Extract fees from shop settings
    const settings = shop.settings as any || {}
    const fees = settings.serviceFees || null

    return NextResponse.json({
      success: true,
      data: {
        fees
      }
    })
  } catch (error) {
    console.error('❌ Error fetching fees:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/settings/fees
 * Update shop's service fees configuration
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || !session.user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Only shop owners can update fees
    if (session.user.role !== UserRole.SHOP_OWNER) {
      return NextResponse.json(
        { success: false, error: 'Access denied. Only shop owners can update fees.' },
        { status: 403 }
      )
    }

    // Get the shop for the current owner
    const shop = await prisma.shop.findFirst({
      where: { ownerId: session.user.id },
      select: { id: true, settings: true, name: true }
    })

    if (!shop) {
      return NextResponse.json(
        { success: false, error: 'Shop not found' },
        { status: 404 }
      )
    }

    // Parse request body
    const body = await request.json()
    const { fees } = body

    if (!fees) {
      return NextResponse.json(
        { success: false, error: 'Fees configuration is required' },
        { status: 400 }
      )
    }

    // Get existing settings
    const currentSettings = shop.settings as any || {}

    // Update settings with new fees
    const updatedSettings = {
      ...currentSettings,
      serviceFees: fees
    }

    // Update shop settings in database
    await prisma.shop.update({
      where: { id: shop.id },
      data: {
        settings: updatedSettings
      }
    })

    console.log(`✅ Service fees updated for shop: ${shop.name}`)

    return NextResponse.json({
      success: true,
      message: 'Service fees updated successfully',
      data: {
        fees
      }
    })
  } catch (error) {
    console.error('❌ Error updating fees:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to update fees. Please try again.' },
      { status: 500 }
    )
  }
}

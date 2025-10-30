import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'

// GET - Fetch shop settings
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Allow SHOP_OWNER and SHOP_WORKER to read settings (workers need for POS, receipts, etc.)
    if (!['SHOP_OWNER', 'SHOP_WORKER'].includes(session.user.role)) {
      return NextResponse.json(
        { error: 'Forbidden - Shop owners and workers only' },
        { status: 403 }
      )
    }

    // Get shop ID based on role
    let shopId: string | null = null
    
    if (session.user.role === 'SHOP_OWNER') {
      shopId = (session.user as any).shops?.[0]?.id
    } else if (session.user.role === 'SHOP_WORKER') {
      // Get worker's assigned shop
      const worker = await prisma.shopWorker.findFirst({
        where: {
          userId: session.user.id,
          isActive: true
        },
        select: {
          shopId: true
        }
      })
      shopId = worker?.shopId || null
    }

    if (!shopId) {
      return NextResponse.json(
        { error: 'Shop ID not found' },
        { status: 400 }
      )
    }

    // Fetch shop details with settings
    const shop = await prisma.shop.findUnique({
      where: { id: shopId },
      select: {
        id: true,
        name: true,
        address: true,
        city: true,
        province: true,
        postalCode: true,
        phone: true,
        email: true,
        gstNumber: true,
        settings: true,
      }
    })

    if (!shop) {
      return NextResponse.json(
        { error: 'Shop not found' },
        { status: 404 }
      )
    }

    // Parse settings JSON
    const settings = (shop.settings as any) || {}
    
    // Combine shop data with settings
    const response = {
      name: shop.name,
      location: `${shop.address}, ${shop.city}, ${shop.province}${shop.postalCode ? ` ${shop.postalCode}` : ''}`,
      address: shop.address,
      city: shop.city,
      province: shop.province,
      postalCode: shop.postalCode || '',
      phone: shop.phone,
      email: shop.email || '',
      website: settings.website || '',
      gstNumber: shop.gstNumber || '',
      ntnNumber: settings.ntnNumber || '',
      receiptHeader: settings.receiptHeader || '',
      receiptFooter: settings.receiptFooter || '',
      showLogo: settings.showLogo ?? true,
      enableCash: settings.enableCash ?? true,
      enableCard: settings.enableCard ?? true,
      enableEasyPaisa: settings.enableEasyPaisa ?? true,
      enableJazzCash: settings.enableJazzCash ?? true,
      enableBankTransfer: settings.enableBankTransfer ?? true,
      taxRate: settings.taxRate ?? 0, // Default 0% - Owner can configure in settings
      currency: 'PKR',
      lowStockThreshold: settings.lowStockThreshold ?? 10,
      autoBackup: settings.autoBackup ?? true,
      emailNotifications: settings.emailNotifications ?? true,
      smsNotifications: settings.smsNotifications ?? false,
    }

    return NextResponse.json(response)

  } catch (error) {
    console.error('Error fetching shop settings:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// PUT - Update shop settings
export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Only shop owners can update settings
    if (session.user.role !== 'SHOP_OWNER') {
      return NextResponse.json(
        { error: 'Forbidden - Shop owners only' },
        { status: 403 }
      )
    }

    // Get shop ID from user's shops array
    const shopId = (session.user as any).shops?.[0]?.id

    if (!shopId) {
      return NextResponse.json(
        { error: 'Shop ID not found' },
        { status: 400 }
      )
    }

    const body = await request.json()

    // Validate required fields
    if (!body.name) {
      return NextResponse.json(
        { error: 'Shop name is required' },
        { status: 400 }
      )
    }

    // Get current settings
    const currentShop = await prisma.shop.findUnique({
      where: { id: shopId },
      select: { settings: true }
    })

    const currentSettings = (currentShop?.settings as any) || {}

    // Merge new settings with current settings
    const newSettings = {
      ...currentSettings,
      website: body.website || '',
      ntnNumber: body.ntnNumber || '',
      receiptHeader: body.receiptHeader || '',
      receiptFooter: body.receiptFooter || '',
      showLogo: body.showLogo ?? true,
      enableCash: body.enableCash ?? true,
      enableCard: body.enableCard ?? true,
      enableEasyPaisa: body.enableEasyPaisa ?? true,
      enableJazzCash: body.enableJazzCash ?? true,
      enableBankTransfer: body.enableBankTransfer ?? true,
      taxRate: body.taxRate ?? 0, // Default 0% - Owner can configure in settings
      lowStockThreshold: body.lowStockThreshold ?? 10,
      autoBackup: body.autoBackup ?? true,
      emailNotifications: body.emailNotifications ?? true,
      smsNotifications: body.smsNotifications ?? false,
    }

    // Update shop with new settings
    const updatedShop = await prisma.shop.update({
      where: { id: shopId },
      data: {
        name: body.name,
        address: body.address || body.location || '',
        city: body.city || '',
        province: body.province || '',
        postalCode: body.postalCode || null,
        phone: body.phone || '',
        email: body.email || null,
        gstNumber: body.gstNumber || null,
        settings: newSettings,
        updatedAt: new Date(),
      }
    })

    return NextResponse.json({
      message: 'Settings updated successfully',
      shop: updatedShop
    })

  } catch (error) {
    console.error('Error updating shop settings:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

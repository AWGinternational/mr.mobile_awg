import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { generateCSV, formatShopsForExport } from '@/lib/csv-utils'

// GET /api/shops/bulk/export - Export shops to CSV
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')
    const city = searchParams.get('city')
    const province = searchParams.get('province')

    // Build query based on role
    let whereClause: any = {}

    if (session.user.role === 'SHOP_OWNER') {
      // Shop owners can only export their own shops
      whereClause.ownerId = session.user.id
    } else if (session.user.role === 'SHOP_WORKER') {
      // Workers can see shops they're assigned to
      const workerShops = await prisma.shopWorker.findMany({
        where: { userId: session.user.id, isActive: true },
        select: { shopId: true }
      })
      whereClause.id = { in: workerShops.map(ws => ws.shopId) }
    }
    // Super admins can export all shops (no filter)

    // Apply additional filters
    if (status) {
      whereClause.status = status
    }
    if (city) {
      whereClause.city = { contains: city, mode: 'insensitive' }
    }
    if (province) {
      whereClause.province = { contains: province, mode: 'insensitive' }
    }

    // Fetch shops
    const shops = await prisma.shop.findMany({
      where: whereClause,
      include: {
        owner: {
          select: {
            name: true,
            email: true,
            businessName: true
          }
        },
        _count: {
          select: {
            workers: { where: { isActive: true } }
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    })

    // Format for export
    const formattedData = formatShopsForExport(shops)

    // Generate CSV
    const csv = generateCSV(formattedData)

    // Generate filename
    const timestamp = new Date().toISOString().split('T')[0]
    const filename = `shops-${timestamp}.csv`

    // Return CSV file
    return new NextResponse(csv, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    })

  } catch (error) {
    console.error('Shop export error:', error)
    return NextResponse.json({
      error: 'Failed to export shops',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}


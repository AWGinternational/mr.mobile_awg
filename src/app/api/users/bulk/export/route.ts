import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { generateCSV, formatUsersForExport } from '@/lib/csv-utils'

// GET /api/users/bulk/export - Export users to CSV
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const role = searchParams.get('role') // SHOP_OWNER, SHOP_WORKER, or null for all
    const status = searchParams.get('status') // ACTIVE, INACTIVE, etc.
    const shopId = searchParams.get('shopId') // Filter by shop

    // Build query
    let whereClause: any = {}

    // Role-based filtering
    if (session.user.role === 'SHOP_OWNER') {
      // Shop owners can only export their shop's workers
      const ownedShops = await prisma.shop.findMany({
        where: { ownerId: session.user.id },
        select: { id: true }
      })
      const shopIds = ownedShops.map(s => s.id)
      
      whereClause.OR = [
        { id: session.user.id }, // Include self
        { 
          workerShops: { 
            some: { shopId: { in: shopIds } } 
          } 
        }
      ]
    } else if (session.user.role === 'SHOP_WORKER') {
      // Workers can only export their own data
      whereClause.id = session.user.id
    }
    // Super admins can export all (no additional filter)

    // Apply filters
    if (role) {
      whereClause.role = role
    }
    if (status) {
      whereClause.status = status
    }
    if (shopId && (session.user.role === 'SUPER_ADMIN' || session.user.role === 'SHOP_OWNER')) {
      whereClause.workerShops = {
        some: { shopId }
      }
    }

    // Fetch users
    const users = await prisma.user.findMany({
      where: whereClause,
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        cnic: true,
        address: true,
        city: true,
        province: true,
        businessName: true,
        role: true,
        status: true,
        emailVerified: true,
        lastLogin: true,
        createdAt: true,
        workerShops: {
          select: {
            shop: {
              select: {
                id: true,
                name: true,
                code: true
              }
            }
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    })

    // Format for export
    const formattedData = formatUsersForExport(users)

    // Generate CSV
    const csv = generateCSV(formattedData)

    // Generate filename
    const timestamp = new Date().toISOString().split('T')[0]
    const roleFilter = role ? `-${role.toLowerCase()}` : ''
    const filename = `users${roleFilter}-${timestamp}.csv`

    // Return CSV file
    return new NextResponse(csv, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    })

  } catch (error) {
    console.error('Export error:', error)
    return NextResponse.json({
      error: 'Failed to export users',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}


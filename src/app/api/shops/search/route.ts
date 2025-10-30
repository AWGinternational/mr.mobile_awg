import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'

/**
 * GET /api/shops/search - Advanced shop search with multiple filters
 * 
 * Query Parameters:
 * - q: Search query (searches name, code, address, city, email, phone)
 * - status: Filter by status (ACTIVE, INACTIVE, SUSPENDED, MAINTENANCE)
 * - city: Filter by city
 * - province: Filter by province
 * - ownerId: Filter by owner
 * - dateFrom: Filter by creation date (from)
 * - dateTo: Filter by creation date (to)
 * - hasLicense: Filter by license number (true/false)
 * - hasGST: Filter by GST number (true/false)
 * - minWorkers: Minimum number of workers
 * - maxWorkers: Maximum number of workers
 * - page: Page number (default: 1)
 * - limit: Results per page (default: 20)
 * - sortBy: Sort field (createdAt, name, city)
 * - sortOrder: Sort order (asc, desc)
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    
    // Parse query parameters
    const query = searchParams.get('q') || ''
    const status = searchParams.get('status')
    const city = searchParams.get('city')
    const province = searchParams.get('province')
    const ownerId = searchParams.get('ownerId')
    const dateFrom = searchParams.get('dateFrom')
    const dateTo = searchParams.get('dateTo')
    const hasLicense = searchParams.get('hasLicense')
    const hasGST = searchParams.get('hasGST')
    const minWorkers = searchParams.get('minWorkers')
    const maxWorkers = searchParams.get('maxWorkers')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const sortBy = searchParams.get('sortBy') || 'createdAt'
    const sortOrder = searchParams.get('sortOrder') || 'desc'

    // Build where clause
    let whereClause: any = {}

    // Role-based access control
    if (session.user.role === 'SHOP_OWNER') {
      whereClause.ownerId = session.user.id
    } else if (session.user.role === 'SHOP_WORKER') {
      const workerShops = await prisma.shopWorker.findMany({
        where: { userId: session.user.id, isActive: true },
        select: { shopId: true }
      })
      whereClause.id = { in: workerShops.map(ws => ws.shopId) }
    }
    // Super admins can search all shops (no filter)

    // Search query (multi-field search)
    if (query) {
      whereClause.OR = [
        { name: { contains: query, mode: 'insensitive' as const } },
        { code: { contains: query, mode: 'insensitive' as const } },
        { address: { contains: query, mode: 'insensitive' as const } },
        { city: { contains: query, mode: 'insensitive' as const } },
        { email: { contains: query, mode: 'insensitive' as const } },
        { phone: { contains: query, mode: 'insensitive' as const } },
        { licenseNumber: { contains: query, mode: 'insensitive' as const } },
        { gstNumber: { contains: query, mode: 'insensitive' as const } }
      ]
    }

    // Status filter
    if (status) {
      whereClause.status = status
    }

    // City filter
    if (city) {
      whereClause.city = { contains: city, mode: 'insensitive' as const }
    }

    // Province filter
    if (province) {
      whereClause.province = { contains: province, mode: 'insensitive' as const }
    }

    // Owner filter
    if (ownerId) {
      whereClause.ownerId = ownerId
    }

    // Date range filter
    if (dateFrom || dateTo) {
      whereClause.createdAt = {}
      if (dateFrom) {
        whereClause.createdAt.gte = new Date(dateFrom)
      }
      if (dateTo) {
        whereClause.createdAt.lte = new Date(dateTo)
      }
    }

    // License filter
    if (hasLicense === 'true') {
      whereClause.licenseNumber = { not: null }
    } else if (hasLicense === 'false') {
      whereClause.licenseNumber = null
    }

    // GST filter
    if (hasGST === 'true') {
      whereClause.gstNumber = { not: null }
    } else if (hasGST === 'false') {
      whereClause.gstNumber = null
    }

    // Pagination
    const skip = (page - 1) * limit

    // Sorting
    let orderBy: any = {}
    if (sortBy === 'name' || sortBy === 'city' || sortBy === 'createdAt') {
      orderBy[sortBy] = sortOrder === 'asc' ? 'asc' : 'desc'
    } else {
      orderBy.createdAt = 'desc' // Default sort
    }

    // Execute search
    const [shops, totalCount] = await Promise.all([
      prisma.shop.findMany({
        where: whereClause,
        include: {
          owner: {
            select: {
              id: true,
              name: true,
              email: true,
              businessName: true
            }
          },
          workers: {
            where: { isActive: true },
            include: {
              user: {
                select: {
                  id: true,
                  name: true,
                  email: true
                }
              }
            }
          },
          _count: {
            select: {
              workers: { where: { isActive: true } },
              products: true,
              sales: true
            }
          }
        },
        skip,
        take: limit,
        orderBy
      }),
      prisma.shop.count({ where: whereClause })
    ])

    // Filter by worker count if specified
    let filteredShops = shops
    if (minWorkers || maxWorkers) {
      filteredShops = shops.filter(shop => {
        const workerCount = shop._count.workers
        if (minWorkers && workerCount < parseInt(minWorkers)) return false
        if (maxWorkers && workerCount > parseInt(maxWorkers)) return false
        return true
      })
    }

    return NextResponse.json({
      shops: filteredShops,
      pagination: {
        page,
        limit,
        total: minWorkers || maxWorkers ? filteredShops.length : totalCount,
        pages: Math.ceil((minWorkers || maxWorkers ? filteredShops.length : totalCount) / limit),
        hasNext: page < Math.ceil((minWorkers || maxWorkers ? filteredShops.length : totalCount) / limit),
        hasPrev: page > 1
      },
      filters: {
        query,
        status,
        city,
        province,
        ownerId,
        dateFrom,
        dateTo,
        hasLicense,
        hasGST,
        minWorkers,
        maxWorkers
      }
    })

  } catch (error) {
    console.error('Shop search error:', error)
    return NextResponse.json({
      error: 'Failed to search shops',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}


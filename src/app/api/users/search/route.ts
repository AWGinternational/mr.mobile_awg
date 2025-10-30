import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'

/**
 * GET /api/users/search - Advanced user search with multiple filters
 * 
 * Query Parameters:
 * - q: Search query (searches name, email, phone, CNIC)
 * - role: Filter by role (SHOP_OWNER, SHOP_WORKER, SUPER_ADMIN)
 * - status: Filter by status (ACTIVE, INACTIVE, SUSPENDED, PENDING_VERIFICATION)
 * - city: Filter by city
 * - province: Filter by province
 * - shopId: Filter by shop
 * - dateFrom: Filter by creation date (from)
 * - dateTo: Filter by creation date (to)
 * - hasEmail: Filter by email verification (true/false)
 * - page: Page number (default: 1)
 * - limit: Results per page (default: 20)
 * - sortBy: Sort field (createdAt, name, email, lastLogin)
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
    const role = searchParams.get('role')
    const status = searchParams.get('status')
    const city = searchParams.get('city')
    const province = searchParams.get('province')
    const shopId = searchParams.get('shopId')
    const dateFrom = searchParams.get('dateFrom')
    const dateTo = searchParams.get('dateTo')
    const hasEmail = searchParams.get('hasEmail')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const sortBy = searchParams.get('sortBy') || 'createdAt'
    const sortOrder = searchParams.get('sortOrder') || 'desc'

    // Build where clause
    let whereClause: any = {}

    // Role-based access control
    if (session.user.role === 'SHOP_OWNER') {
      // Shop owners can search their workers and themselves
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
      // Workers can only search themselves
      whereClause.id = session.user.id
    }
    // Super admins can search all users (no filter)

    // Search query (multi-field search)
    if (query) {
      const searchConditions = {
        OR: [
          { name: { contains: query, mode: 'insensitive' as const } },
          { email: { contains: query, mode: 'insensitive' as const } },
          { phone: { contains: query, mode: 'insensitive' as const } },
          { cnic: { contains: query, mode: 'insensitive' as const } },
          { businessName: { contains: query, mode: 'insensitive' as const } },
          { city: { contains: query, mode: 'insensitive' as const } },
          { address: { contains: query, mode: 'insensitive' as const } }
        ]
      }

      // Combine with existing OR clause if it exists
      if (whereClause.OR) {
        whereClause.AND = [
          { OR: whereClause.OR },
          searchConditions
        ]
        delete whereClause.OR
      } else {
        whereClause = { ...whereClause, ...searchConditions }
      }
    }

    // Role filter
    if (role) {
      whereClause.role = role
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

    // Shop filter
    if (shopId) {
      whereClause.workerShops = {
        some: { shopId }
      }
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

    // Email verification filter
    if (hasEmail === 'true') {
      whereClause.emailVerified = { not: null }
    } else if (hasEmail === 'false') {
      whereClause.emailVerified = null
    }

    // Pagination
    const skip = (page - 1) * limit

    // Sorting
    let orderBy: any = {}
    if (sortBy === 'name' || sortBy === 'email' || sortBy === 'createdAt' || sortBy === 'lastLogin') {
      orderBy[sortBy] = sortOrder === 'asc' ? 'asc' : 'desc'
    } else {
      orderBy.createdAt = 'desc' // Default sort
    }

    // Execute search
    const [users, totalCount] = await Promise.all([
      prisma.user.findMany({
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
                  code: true,
                  city: true
                }
              },
              isActive: true
            }
          },
          ownedShops: {
            select: {
              id: true,
              name: true,
              code: true,
              city: true,
              status: true
            }
          }
        },
        skip,
        take: limit,
        orderBy
      }),
      prisma.user.count({ where: whereClause })
    ])

    // Format response
    const formattedUsers = users.map(user => ({
      ...user,
      shops: [
        ...(user.ownedShops || []).map((shop: any) => ({ ...shop, relationship: 'owner' })),
        ...(user.workerShops || []).map((ws: any) => ({ ...ws.shop, relationship: 'worker', isActive: ws.isActive }))
      ],
      ownedShops: undefined,
      workerShops: undefined
    }))

    return NextResponse.json({
      users: formattedUsers,
      pagination: {
        page,
        limit,
        total: totalCount,
        pages: Math.ceil(totalCount / limit),
        hasNext: page < Math.ceil(totalCount / limit),
        hasPrev: page > 1
      },
      filters: {
        query,
        role,
        status,
        city,
        province,
        shopId,
        dateFrom,
        dateTo,
        hasEmail
      }
    })

  } catch (error) {
    console.error('Search error:', error)
    return NextResponse.json({
      error: 'Failed to search users',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}


import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { UserRole, UserStatus, AuditAction } from '@/types'

// GET /api/users - List users with filtering and pagination
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userRole = session.user.role as UserRole
    const { searchParams } = new URL(request.url)
    
    // Pagination
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const skip = (page - 1) * limit

    // Filters
    const role = searchParams.get('role') as UserRole
    const status = searchParams.get('status') as UserStatus
    const search = searchParams.get('search')
    const shopId = searchParams.get('shopId')

    // Build where clause based on user permissions
    let whereClause: any = {}

    // Super admin can see all users
    if (userRole === UserRole.SUPER_ADMIN) {
      if (role) whereClause.role = role
      if (status) whereClause.status = status
      if (search) {
        whereClause.OR = [
          { name: { contains: search, mode: 'insensitive' } },
          { email: { contains: search, mode: 'insensitive' } },
          { phone: { contains: search, mode: 'insensitive' } }
        ]
      }
    }
    // Shop owners can only see users in their shops
    else if (userRole === UserRole.SHOP_OWNER) {
      const userShops = await prisma.shop.findMany({
        where: { ownerId: session.user.id },
        select: { id: true }
      })
      
      const shopIds = userShops.map(shop => shop.id)
      
      whereClause = {
        OR: [
          { id: session.user.id }, // Can see themselves
          { 
            workerShops: {
              some: {
                shopId: { in: shopIds }
              }
            }
          }
        ]
      }
      
      if (role) whereClause.role = role
      if (status) whereClause.status = status
    }
    // Shop workers can only see themselves
    else {
      whereClause.id = session.user.id
    }

    // Get users with pagination
    const [users, total] = await Promise.all([
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
          createdAt: true,
          lastLogin: true,
          ownedShops: {
            select: {
              id: true,
              name: true,
              code: true
            }
          },
          workerShops: {
            select: {
              shop: {
                select: {
                  id: true,
                  name: true,
                  code: true
                }
              },
              permissions: true
            }
          }
        },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' }
      }),
      prisma.user.count({ where: whereClause })
    ])

    return NextResponse.json({
      success: true,
      data: users,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    })

  } catch (error) {
    console.error('Users GET error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// POST /api/users - Create new user (Admin only)
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user || session.user.role !== UserRole.SUPER_ADMIN) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { name, email, phone, role, shopId, permissions } = body

    // Validate required fields
    if (!name || !email || !role) {
      return NextResponse.json(
        { error: 'Name, email, and role are required' },
        { status: 400 }
      )
    }

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: email.toLowerCase() }
    })

    if (existingUser) {
      return NextResponse.json(
        { error: 'User with this email already exists' },
        { status: 400 }
      )
    }

    // Create user
    const user = await prisma.user.create({
      data: {
        name,
        email: email.toLowerCase(),
        phone,
        role,
        status: UserStatus.ACTIVE,
        password: 'temporary123', // Will be changed on first login
      },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        role: true,
        status: true,
        createdAt: true
      }
    })

    // If shop worker, assign to shop
    if (role === UserRole.SHOP_WORKER && shopId) {
      await prisma.shopWorker.create({
        data: {
          userId: user.id,
          shopId,
          permissions: permissions || {},
          isActive: true
        }
      })
    }

    // Log user creation
    await prisma.auditLog.create({
      data: {
        userId: session.user.id,
        action: AuditAction.CREATE,
        tableName: 'users',
        recordId: user.id,
        newValues: {
          name: user.name,
          email: user.email,
          role: user.role,
          createdBy: session.user.id
        },
      },
    })

    return NextResponse.json({
      success: true,
      message: 'User created successfully',
      data: user
    })

  } catch (error) {
    console.error('Users POST error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

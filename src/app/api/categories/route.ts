import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { UserRole } from '@/types'
import { z } from 'zod'

const createCategorySchema = z.object({
  name: z.string().min(1, 'Name is required').max(100, 'Name too long'),
  description: z.string().optional(),
  isActive: z.boolean().default(true),
  code: z.string().min(1, 'Code is required').max(20, 'Code too long')
})

const updateCategorySchema = z.object({
  name: z.string().min(1, 'Name is required').max(100, 'Name too long').optional(),
  description: z.string().optional(),
  isActive: z.boolean().optional(),
  code: z.string().min(1, 'Code is required').max(20, 'Code too long').optional()
})

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const isActive = searchParams.get('isActive')
    const search = searchParams.get('search')

    // Get the user's shop ID (assuming first shop for now)
    const userShops = (session.user as any).shops || []
    const currentShopId = userShops.length > 0 ? userShops[0].id : null
    
    if (!currentShopId) {
      return NextResponse.json({ error: 'No shop assigned to user' }, { status: 400 })
    }

    const where: any = {
      shopId: currentShopId // Filter by shop for multi-tenancy
    }

    if (isActive !== null) {
      where.isActive = isActive === 'true'
    }

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { code: { contains: search, mode: 'insensitive' } }
      ]
    }

    const categories = await prisma.category.findMany({
      where,
      include: {
        _count: {
          select: {
            products: true
          }
        }
      },
      orderBy: {
        name: 'asc'
      }
    })

    return NextResponse.json({
      success: true,
      data: categories
    })

  } catch (error) {
    console.error('Error fetching categories:', error)
    return NextResponse.json(
      { error: 'Failed to fetch categories' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Allow SUPER_ADMIN, SHOP_OWNER, and SHOP_WORKER to create categories
    // Workers can create but may require approval for updates/deletes (future enhancement)
    if (![UserRole.SUPER_ADMIN, UserRole.SHOP_OWNER, UserRole.SHOP_WORKER].includes(session.user.role as UserRole)) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
    }

    const body = await request.json()
    const validatedData = createCategorySchema.parse(body)

    // Get the user's shop ID
    const userShops = (session.user as any).shops || []
    const currentShopId = userShops.length > 0 ? userShops[0].id : null
    
    if (!currentShopId) {
      return NextResponse.json({ error: 'No shop assigned to user' }, { status: 400 })
    }

    // Check if category code already exists for this shop
    const existingCategory = await prisma.category.findUnique({
      where: { 
        code_shopId: {
          code: validatedData.code,
          shopId: currentShopId
        }
      }
    })

    if (existingCategory) {
      return NextResponse.json(
        { error: 'Category code already exists' },
        { status: 400 }
      )
    }

    const category = await prisma.category.create({
      data: {
        name: validatedData.name,
        description: validatedData.description,
        isActive: validatedData.isActive,
        code: validatedData.code,
        shopId: currentShopId
      },
      include: {
        _count: {
          select: {
            products: true
          }
        }
      }
    })

    return NextResponse.json({
      success: true,
      data: category
    }, { status: 201 })

  } catch (error) {
    console.error('Error creating category:', error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.issues },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: 'Failed to create category' },
      { status: 500 }
    )
  }
}
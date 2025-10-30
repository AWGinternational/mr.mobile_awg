import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { UserRole } from '@/types'
import { z } from 'zod'

const updateCategorySchema = z.object({
  name: z.string().min(1, 'Name is required').max(100, 'Name too long').optional(),
  description: z.string().optional(),
  isActive: z.boolean().optional(),
  code: z.string().min(1, 'Code is required').max(20, 'Code too long').optional()
})

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const params = await context.params
    const categoryId = params.id

    // Get the user's shop ID
    const userShops = (session.user as any).shops || []
    const currentShopId = userShops.length > 0 ? userShops[0].id : null
    
    if (!currentShopId) {
      return NextResponse.json({ error: 'No shop assigned to user' }, { status: 400 })
    }

    const category = await prisma.category.findFirst({
      where: { 
        id: categoryId,
        shopId: currentShopId // Ensure user can only access their shop's categories
      },
      include: {
        _count: {
          select: {
            products: true
          }
        }
      }
    })

    if (!category) {
      return NextResponse.json({ error: 'Category not found' }, { status: 404 })
    }

    return NextResponse.json({
      success: true,
      data: category
    })

  } catch (error) {
    console.error('Error fetching category:', error)
    return NextResponse.json(
      { error: 'Failed to fetch category' },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if user has permission to update categories
    if (![UserRole.SUPER_ADMIN, UserRole.SHOP_OWNER].includes(session.user.role as UserRole)) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
    }

    const params = await context.params
    const categoryId = params.id
    const body = await request.json()
    const validatedData = updateCategorySchema.parse(body)

    // Get the user's shop ID
    const userShops = (session.user as any).shops || []
    const currentShopId = userShops.length > 0 ? userShops[0].id : null
    
    if (!currentShopId) {
      return NextResponse.json({ error: 'No shop assigned to user' }, { status: 400 })
    }

    // Check if category exists
    const existingCategory = await prisma.category.findFirst({
      where: { 
        id: categoryId,
        shopId: currentShopId
      }
    })

    if (!existingCategory) {
      return NextResponse.json({ error: 'Category not found' }, { status: 404 })
    }

    // Check if code is being updated and if it already exists
    if (validatedData.code && validatedData.code !== existingCategory.code) {
      const codeExists = await prisma.category.findUnique({
        where: { 
          code_shopId: {
            code: validatedData.code,
            shopId: currentShopId
          }
        }
      })

      if (codeExists) {
        return NextResponse.json(
          { error: 'Category code already exists' },
          { status: 400 }
        )
      }
    }

    const updatedCategory = await prisma.category.update({
      where: { id: categoryId },
      data: validatedData,
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
      data: updatedCategory
    })

  } catch (error) {
    console.error('Error updating category:', error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.issues },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: 'Failed to update category' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if user has permission to delete categories
    if (![UserRole.SUPER_ADMIN, UserRole.SHOP_OWNER].includes(session.user.role as UserRole)) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
    }

    const params = await context.params
    const categoryId = params.id

    // Get the user's shop ID
    const userShops = (session.user as any).shops || []
    const currentShopId = userShops.length > 0 ? userShops[0].id : null
    
    if (!currentShopId) {
      return NextResponse.json({ error: 'No shop assigned to user' }, { status: 400 })
    }

    // Check if category exists
    const existingCategory = await prisma.category.findFirst({
      where: { 
        id: categoryId,
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

    if (!existingCategory) {
      return NextResponse.json({ error: 'Category not found' }, { status: 404 })
    }

    // Check if category has products
    if (existingCategory._count.products > 0) {
      return NextResponse.json(
        { error: 'Cannot delete category with existing products' },
        { status: 400 }
      )
    }

    await prisma.category.delete({
      where: { id: categoryId }
    })

    return NextResponse.json({
      success: true,
      message: 'Category deleted successfully'
    })

  } catch (error) {
    console.error('Error deleting category:', error)
    return NextResponse.json(
      { error: 'Failed to delete category' },
      { status: 500 }
    )
  }
}

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { UserRole } from '@/types'
import { z } from 'zod'

const updateBrandSchema = z.object({
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
    const brandId = params.id

    // Get the user's shop ID
    const userShops = (session.user as any).shops || []
    const currentShopId = userShops.length > 0 ? userShops[0].id : null
    
    if (!currentShopId) {
      return NextResponse.json({ error: 'No shop assigned to user' }, { status: 400 })
    }

    const brand = await prisma.brand.findFirst({
      where: { 
        id: brandId,
        shopId: currentShopId // Ensure user can only access their shop's brands
      },
      include: {
        _count: {
          select: {
            products: true
          }
        }
      }
    })

    if (!brand) {
      return NextResponse.json({ error: 'Brand not found' }, { status: 404 })
    }

    return NextResponse.json({
      success: true,
      data: brand
    })

  } catch (error) {
    console.error('Error fetching brand:', error)
    return NextResponse.json(
      { error: 'Failed to fetch brand' },
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

    // Check if user has permission to update brands
    if (![UserRole.SUPER_ADMIN, UserRole.SHOP_OWNER].includes(session.user.role as UserRole)) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
    }

    const params = await context.params
    const brandId = params.id
    const body = await request.json()
    const validatedData = updateBrandSchema.parse(body)

    // Get the user's shop ID
    const userShops = (session.user as any).shops || []
    const currentShopId = userShops.length > 0 ? userShops[0].id : null
    
    if (!currentShopId) {
      return NextResponse.json({ error: 'No shop assigned to user' }, { status: 400 })
    }

    // Check if brand exists
    const existingBrand = await prisma.brand.findFirst({
      where: { 
        id: brandId,
        shopId: currentShopId
      }
    })

    if (!existingBrand) {
      return NextResponse.json({ error: 'Brand not found' }, { status: 404 })
    }

    // Check if code is being updated and if it already exists
    if (validatedData.code && validatedData.code !== existingBrand.code) {
      const codeExists = await prisma.brand.findUnique({
        where: { 
          code_shopId: {
            code: validatedData.code,
            shopId: currentShopId
          }
        }
      })

      if (codeExists) {
        return NextResponse.json(
          { error: 'Brand code already exists' },
          { status: 400 }
        )
      }
    }

    const updatedBrand = await prisma.brand.update({
      where: { id: brandId },
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
      data: updatedBrand
    })

  } catch (error) {
    console.error('Error updating brand:', error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.issues },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: 'Failed to update brand' },
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

    // Check if user has permission to delete brands
    if (![UserRole.SUPER_ADMIN, UserRole.SHOP_OWNER].includes(session.user.role as UserRole)) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
    }

    const params = await context.params
    const brandId = params.id

    // Get the user's shop ID
    const userShops = (session.user as any).shops || []
    const currentShopId = userShops.length > 0 ? userShops[0].id : null
    
    if (!currentShopId) {
      return NextResponse.json({ error: 'No shop assigned to user' }, { status: 400 })
    }

    // Check if brand exists
    const existingBrand = await prisma.brand.findFirst({
      where: { 
        id: brandId,
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

    if (!existingBrand) {
      return NextResponse.json({ error: 'Brand not found' }, { status: 404 })
    }

    // Check if brand has products
    if (existingBrand._count.products > 0) {
      return NextResponse.json(
        { error: 'Cannot delete brand with existing products' },
        { status: 400 }
      )
    }

    await prisma.brand.delete({
      where: { id: brandId }
    })

    return NextResponse.json({
      success: true,
      message: 'Brand deleted successfully'
    })

  } catch (error) {
    console.error('Error deleting brand:', error)
    return NextResponse.json(
      { error: 'Failed to delete brand' },
      { status: 500 }
    )
  }
}

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { UserRole, ProductType, ProductStatus } from '@/types'
import { z } from 'zod'

const updateProductSchema = z.object({
  name: z.string().min(1, 'Name is required').max(200, 'Name too long').optional(),
  model: z.string().min(1, 'Model is required').max(100, 'Model too long').optional(),
  barcode: z.string().optional(),
  type: z.nativeEnum(ProductType).optional(),
  status: z.nativeEnum(ProductStatus).optional(),
  description: z.string().optional(),
  costPrice: z.number().positive('Cost price must be positive').optional(),
  sellingPrice: z.number().positive('Selling price must be positive').optional(),
  categoryId: z.string().min(1, 'Category is required').optional(),
  brandId: z.string().min(1, 'Brand is required').optional(),
  lowStockThreshold: z.number().int().min(0).optional(),
  reorderPoint: z.number().int().min(0).optional(),
  warranty: z.number().int().min(0).optional(),
  minimumPrice: z.number().positive().optional(),
  quantityToAdd: z.number().int().min(0).optional()
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
    const productId = params.id

    // Get the user's shop ID
    let currentShopId: string | null = null
    
    if (session.user.role === UserRole.SHOP_OWNER || session.user.role === UserRole.SUPER_ADMIN) {
      const user = await prisma.user.findUnique({
        where: { id: session.user.id },
        include: { ownedShops: { select: { id: true } } }
      })
      currentShopId = user?.ownedShops[0]?.id || null
    } else if (session.user.role === UserRole.SHOP_WORKER) {
      const worker = await prisma.shopWorker.findFirst({
        where: { workerId: session.user.id },
        select: { shopId: true }
      })
      currentShopId = worker?.shopId || null
    }
    
    if (!currentShopId) {
      return NextResponse.json({ error: 'No shop assigned to user' }, { status: 400 })
    }

    const product = await prisma.product.findFirst({
      where: { 
        id: productId,
        shopId: currentShopId
      },
      include: {
        category: {
          select: { id: true, name: true, code: true }
        },
        brand: {
          select: { id: true, name: true, code: true }
        },
        inventoryItems: {
          where: { status: 'IN_STOCK' },
          select: { id: true, imei: true, serialNumber: true }
        },
        _count: {
          select: { 
            inventoryItems: {
              where: { status: 'IN_STOCK' }
            }
          }
        }
      }
    })

    if (!product) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 })
    }

    return NextResponse.json({
      success: true,
      product: {
        ...product,
        stock: product._count.inventoryItems,
        costPrice: Number(product.costPrice),
        sellingPrice: Number(product.sellingPrice),
        minimumPrice: product.minimumPrice ? Number(product.minimumPrice) : null,
        markupPercentage: product.markupPercentage ? Number(product.markupPercentage) : null
      }
    })

  } catch (error) {
    console.error('Error fetching product:', error)
    return NextResponse.json(
      { error: 'Failed to fetch product' },
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

    // Check if user has permission to update products
    if (![UserRole.SUPER_ADMIN, UserRole.SHOP_OWNER, UserRole.SHOP_WORKER].includes(session.user.role as UserRole)) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
    }

    const params = await context.params
    const productId = params.id
    const body = await request.json()
    const validatedData = updateProductSchema.parse(body)

    // Get the user's shop ID
    let currentShopId: string | null = null
    
    if (session.user.role === UserRole.SHOP_OWNER || session.user.role === UserRole.SUPER_ADMIN) {
      const user = await prisma.user.findUnique({
        where: { id: session.user.id },
        include: { ownedShops: { select: { id: true } } }
      })
      currentShopId = user?.ownedShops[0]?.id || null
    } else if (session.user.role === UserRole.SHOP_WORKER) {
      const worker = await prisma.shopWorker.findFirst({
        where: { workerId: session.user.id },
        select: { shopId: true }
      })
      currentShopId = worker?.shopId || null
    }
    
    if (!currentShopId) {
      return NextResponse.json({ error: 'No shop assigned to user' }, { status: 400 })
    }

    // Check if product exists
    const existingProduct = await prisma.product.findFirst({
      where: { 
        id: productId,
        shopId: currentShopId
      }
    })

    if (!existingProduct) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 })
    }

    // Check for duplicate barcode if being updated
    if (validatedData.barcode && validatedData.barcode !== existingProduct.barcode) {
      const existingBarcode = await prisma.product.findUnique({
        where: {
          barcode_shopId: {
            barcode: validatedData.barcode,
            shopId: currentShopId
          }
        }
      })

      if (existingBarcode) {
        return NextResponse.json({ error: 'Barcode already exists' }, { status: 400 })
      }
    }

    // Validate category and brand if being updated
    if (validatedData.categoryId) {
      const category = await prisma.category.findFirst({
        where: { 
          id: validatedData.categoryId,
          shopId: currentShopId
        }
      })

      if (!category) {
        return NextResponse.json({ error: 'Category not found' }, { status: 400 })
      }
    }

    if (validatedData.brandId) {
      const brand = await prisma.brand.findFirst({
        where: { 
          id: validatedData.brandId,
          shopId: currentShopId
        }
      })

      if (!brand) {
        return NextResponse.json({ error: 'Brand not found' }, { status: 400 })
      }
    }

    // Update product and add inventory items in a transaction
    const result = await prisma.$transaction(async (tx) => {
      // Prepare update data with proper Prisma relations
      const { categoryId, brandId, quantityToAdd, ...restData } = validatedData
      
      const updateData: any = { ...restData }
      
      // Connect category if provided
      if (categoryId) {
        updateData.category = { connect: { id: categoryId } }
      }
      
      // Connect brand if provided
      if (brandId) {
        updateData.brand = { connect: { id: brandId } }
      }
      
      // Update the product
      const updatedProduct = await tx.product.update({
        where: { id: productId },
        data: updateData,
        include: {
          category: {
            select: { id: true, name: true, code: true }
          },
          brand: {
            select: { id: true, name: true, code: true }
          },
          _count: {
            select: { 
              inventoryItems: {
                where: { status: 'IN_STOCK' }
              }
            }
          }
        }
      })

      // Add inventory items if quantityToAdd > 0
      if (quantityToAdd && quantityToAdd > 0) {
        const inventoryItems = Array.from({ length: quantityToAdd }, (_, index) => ({
          productId: productId,
          batchNumber: `BATCH-${Date.now()}-${index + 1}`,
          status: 'IN_STOCK' as const,
          costPrice: updatedProduct.costPrice,
          purchaseDate: new Date(),
          shopId: currentShopId
        }))

        await tx.inventoryItem.createMany({
          data: inventoryItems
        })

        // Refetch the product to get updated stock count
        const updatedProductWithStock = await tx.product.findUnique({
          where: { id: productId },
          include: {
            category: {
              select: { id: true, name: true, code: true }
            },
            brand: {
              select: { id: true, name: true, code: true }
            },
            _count: {
              select: { inventoryItems: true }
            }
          }
        })

        return { product: updatedProductWithStock!, addedStock: quantityToAdd }
      }

      return { product: updatedProduct, addedStock: 0 }
    })

    return NextResponse.json({
      success: true,
      product: {
        ...result.product,
        stock: result.product._count.inventoryItems,
        costPrice: Number(result.product.costPrice),
        sellingPrice: Number(result.product.sellingPrice),
        minimumPrice: result.product.minimumPrice ? Number(result.product.minimumPrice) : null,
        markupPercentage: result.product.markupPercentage ? Number(result.product.markupPercentage) : null
      },
      addedStock: result.addedStock
    })

  } catch (error) {
    console.error('Error updating product:', error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.issues },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: 'Failed to update product' },
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

    // Check if user has permission to delete products
    if (![UserRole.SUPER_ADMIN, UserRole.SHOP_OWNER].includes(session.user.role as UserRole)) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
    }

    const params = await context.params
    const productId = params.id

    // Get the user's shop ID
    let currentShopId: string | null = null
    
    if (session.user.role === UserRole.SHOP_OWNER || session.user.role === UserRole.SUPER_ADMIN) {
      const user = await prisma.user.findUnique({
        where: { id: session.user.id },
        include: { ownedShops: { select: { id: true } } }
      })
      currentShopId = user?.ownedShops[0]?.id || null
    } else if (session.user.role === UserRole.SHOP_WORKER) {
      const worker = await prisma.shopWorker.findFirst({
        where: { workerId: session.user.id },
        select: { shopId: true }
      })
      currentShopId = worker?.shopId || null
    }
    
    if (!currentShopId) {
      console.error('No shop found for user:', { userId: session.user.id, role: session.user.role })
      return NextResponse.json({ error: 'No shop assigned to user' }, { status: 400 })
    }

    // Check if product exists and has active inventory items
    const existingProduct = await prisma.product.findFirst({
      where: { 
        id: productId,
        shopId: currentShopId
      },
      include: {
        _count: {
          select: { 
            inventoryItems: {
              where: {
                status: 'IN_STOCK' // Only count items that are actually in stock
              }
            },
            saleItems: true 
          }
        }
      }
    })

    if (!existingProduct) {
      console.error('Product not found:', { productId, shopId: currentShopId })
      return NextResponse.json({ error: 'Product not found' }, { status: 404 })
    }

    // Check if product has active inventory items or sales
    if (existingProduct._count.inventoryItems > 0) {
      console.log('Cannot delete product - has active inventory:', { 
        productId, 
        inventoryCount: existingProduct._count.inventoryItems 
      })
      return NextResponse.json(
        { error: `Cannot delete product with inventory items (${existingProduct._count.inventoryItems} items in stock)` },
        { status: 400 }
      )
    }

    if (existingProduct._count.saleItems > 0) {
      console.log('Cannot delete product - has sales history:', { 
        productId, 
        salesCount: existingProduct._count.saleItems 
      })
      return NextResponse.json(
        { error: `Cannot delete product with sales history (${existingProduct._count.saleItems} sales)` },
        { status: 400 }
      )
    }

    // Delete the product along with its inventory items (cascade)
    await prisma.$transaction(async (tx) => {
      // First delete all inventory items for this product
      await tx.inventoryItem.deleteMany({
        where: { productId: productId }
      })
      
      // Then delete the product
      await tx.product.delete({
        where: { id: productId }
      })
    })

    return NextResponse.json({
      success: true,
      message: 'Product deleted successfully'
    })

  } catch (error) {
    console.error('Error deleting product:', error)
    return NextResponse.json(
      { error: 'Failed to delete product' },
      { status: 500 }
    )
  }
}
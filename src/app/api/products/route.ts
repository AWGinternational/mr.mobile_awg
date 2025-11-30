import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { UserRole, ProductType, ProductStatus } from '@/types'
import { z } from 'zod'

const createProductSchema = z.object({
  name: z.string().min(1, 'Name is required').max(200, 'Name too long'),
  model: z.string().min(1, 'Model is required').max(100, 'Model too long'),
  barcode: z.string().optional(),
  type: z.nativeEnum(ProductType).default(ProductType.MOBILE_PHONE),
  description: z.string().optional(),
  costPrice: z.number().positive('Cost price must be positive'),
  sellingPrice: z.number().positive('Selling price must be positive'),
  categoryId: z.string().min(1, 'Category is required'),
  brandId: z.string().min(1, 'Brand is required'),
  lowStockThreshold: z.number().int().min(0).default(5),
  reorderPoint: z.number().int().min(0).default(10),
  warranty: z.number().int().min(0).optional(),
  minimumPrice: z.number().positive().optional(),
  initialStock: z.number().int().min(0).default(0).optional()
})

const updateProductSchema = createProductSchema.partial()

// Generate SKU based on brand, category, and timestamp
function generateSKU(brandCode: string, categoryCode: string, model: string): string {
  const timestamp = Date.now().toString().slice(-6) // Last 6 digits
  const brandPrefix = brandCode.substring(0, 3).toUpperCase()
  const categoryPrefix = categoryCode.substring(0, 3).toUpperCase()
  const modelPrefix = model.replace(/[^A-Z0-9]/g, '').substring(0, 3).toUpperCase()
  
  return `${brandPrefix}-${categoryPrefix}-${modelPrefix}-${timestamp}`
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')
    const category = searchParams.get('category')
    const brand = searchParams.get('brand')
    const search = searchParams.get('search')
    const type = searchParams.get('type')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '50')
    const skip = (page - 1) * limit

    // Get the user's shop ID
    let currentShopId: string | null = null
    
    if (session.user.role === 'SHOP_OWNER' || session.user.role === 'SUPER_ADMIN') {
      const userShops = (session.user as any).shops || []
      currentShopId = userShops.length > 0 ? userShops[0].id : null
    } else if (session.user.role === 'SHOP_WORKER') {
      const worker = await prisma.shopWorker.findFirst({
        where: {
          userId: session.user.id,
          isActive: true
        }
      })
      currentShopId = worker?.shopId || null
    }
    
    if (!currentShopId) {
      return NextResponse.json({ error: 'No shop assigned to user' }, { status: 400 })
    }

    const where: any = {
      shopId: currentShopId
    }

    if (status) {
      where.status = status
    }

    if (category) {
      where.categoryId = category
    }

    if (brand) {
      where.brandId = brand
    }

    if (type) {
      where.type = type
    }

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { model: { contains: search, mode: 'insensitive' } },
        { sku: { contains: search, mode: 'insensitive' } },
        { barcode: { contains: search, mode: 'insensitive' } }
      ]
    }

    // Fetch products and total count in parallel
    const [products, totalCount] = await prisma.$transaction([
      prisma.product.findMany({
        where,
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
        },
        orderBy: {
          createdAt: 'desc'
        },
        skip,
        take: limit
      }),
      prisma.product.count({ where })
    ])

    // Add calculated stock count
    const productsWithStock = products.map(product => ({
      ...product,
      stock: product._count.inventoryItems,
      costPrice: Number(product.costPrice),
      sellingPrice: Number(product.sellingPrice),
      minimumPrice: product.minimumPrice ? Number(product.minimumPrice) : null,
      markupPercentage: product.markupPercentage ? Number(product.markupPercentage) : null
    }))

    const totalPages = Math.ceil(totalCount / limit)
    const hasNextPage = page < totalPages
    const hasPreviousPage = page > 1

    return NextResponse.json({
      success: true,
      products: productsWithStock,
      pagination: {
        page,
        limit,
        totalCount,
        totalPages,
        hasNextPage,
        hasPreviousPage
      }
    })

  } catch (error) {
    console.error('Error fetching products:', error)
    return NextResponse.json(
      { error: 'Failed to fetch products' },
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

    // Allow SUPER_ADMIN, SHOP_OWNER, and SHOP_WORKER to create products
    // Workers can create products (approval workflow can be added later for sensitive changes)
    if (![UserRole.SUPER_ADMIN, UserRole.SHOP_OWNER, UserRole.SHOP_WORKER].includes(session.user.role as UserRole)) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
    }

    // Get the user's shop ID
    let currentShopId: string | null = null
    
    if (session.user.role === 'SHOP_OWNER' || session.user.role === 'SUPER_ADMIN') {
      const userShops = (session.user as any).shops || []
      currentShopId = userShops.length > 0 ? userShops[0].id : null
    } else if (session.user.role === 'SHOP_WORKER') {
      const worker = await prisma.shopWorker.findFirst({
        where: {
          userId: session.user.id,
          isActive: true
        }
      })
      currentShopId = worker?.shopId || null
    }
    
    if (!currentShopId) {
      return NextResponse.json({ error: 'No shop assigned to user' }, { status: 400 })
    }

    const body = await request.json()
    console.log('🔍 Creating product with data:', JSON.stringify(body, null, 2))
    console.log('🏪 Current shop ID:', currentShopId)
    
    const validatedData = createProductSchema.parse(body)

    // Fetch category and brand to generate SKU
    const [category, brand] = await Promise.all([
      prisma.category.findFirst({
        where: { 
          id: validatedData.categoryId,
          shopId: currentShopId
        }
      }),
      prisma.brand.findFirst({
        where: { 
          id: validatedData.brandId,
          shopId: currentShopId
        }
      })
    ])

    if (!category) {
      return NextResponse.json({ error: 'Category not found' }, { status: 400 })
    }

    if (!brand) {
      return NextResponse.json({ error: 'Brand not found' }, { status: 400 })
    }

    // Generate unique SKU
    let sku = generateSKU(brand.code, category.code, validatedData.model)
    let attempts = 0
    const maxAttempts = 10

    // Ensure SKU is unique
    while (attempts < maxAttempts) {
      const existingProduct = await prisma.product.findUnique({
        where: {
          sku_shopId: {
            sku: sku,
            shopId: currentShopId
          }
        }
      })

      if (!existingProduct) {
        break
      }

      sku = generateSKU(brand.code, category.code, validatedData.model)
      attempts++
    }

    if (attempts >= maxAttempts) {
      return NextResponse.json({ error: 'Failed to generate unique SKU' }, { status: 500 })
    }

    // Check for duplicate barcode if provided
    if (validatedData.barcode) {
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

    // Create product and initial inventory items in a transaction
    const result = await prisma.$transaction(async (tx) => {
      // Create the product
      const product = await tx.product.create({
        data: {
          name: validatedData.name,
          model: validatedData.model,
          sku: sku,
          barcode: validatedData.barcode,
          type: validatedData.type,
          description: validatedData.description,
          costPrice: validatedData.costPrice,
          sellingPrice: validatedData.sellingPrice,
          minimumPrice: validatedData.minimumPrice,
          categoryId: validatedData.categoryId,
          brandId: validatedData.brandId,
          shopId: currentShopId,
          lowStockThreshold: validatedData.lowStockThreshold,
          reorderPoint: validatedData.reorderPoint,
          warranty: validatedData.warranty,
          status: ProductStatus.ACTIVE
        },
        include: {
          category: {
            select: { id: true, name: true, code: true }
          },
          brand: {
            select: { id: true, name: true, code: true }
          }
        }
      })

      // Create initial inventory items if initialStock > 0
      const initialStock = validatedData.initialStock || 0
      if (initialStock > 0) {
        const inventoryItems = Array.from({ length: initialStock }, (_, index) => ({
          productId: product.id,
          batchNumber: `BATCH-${Date.now()}-${index + 1}`,
          status: 'IN_STOCK' as const,
          costPrice: validatedData.costPrice,
          purchaseDate: new Date(),
          shopId: currentShopId
        }))

        await tx.inventoryItem.createMany({
          data: inventoryItems
        })
      }

      return { product, initialStock }
    })

    return NextResponse.json({
      success: true,
      product: {
        ...result.product,
        costPrice: Number(result.product.costPrice),
        sellingPrice: Number(result.product.sellingPrice),
        minimumPrice: result.product.minimumPrice ? Number(result.product.minimumPrice) : null,
        markupPercentage: result.product.markupPercentage ? Number(result.product.markupPercentage) : null,
        stock: result.initialStock
      }
    }, { status: 201 })

  } catch (error) {
    console.error('❌ Error creating product:', error)
    
    if (error instanceof z.ZodError) {
      console.error('❌ Validation errors:', JSON.stringify(error.issues, null, 2))
      return NextResponse.json(
        { error: 'Validation failed', details: error.issues },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: 'Failed to create product', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
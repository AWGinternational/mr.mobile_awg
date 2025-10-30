import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { UserRole } from '@/types'

/**
 * GET /api/inventory?shopId=xxx
 * Get inventory items with product details for a shop
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const searchParams = request.nextUrl.searchParams
    const shopId = searchParams.get('shopId')
    
    if (!shopId) {
      return NextResponse.json({ error: 'shopId is required' }, { status: 400 })
    }

    // Get all products for the shop with their inventory counts
    const products = await prisma.product.findMany({
      where: {
        shopId,
        status: 'ACTIVE'
      },
      include: {
        category: true,
        brand: true,
        inventoryItems: {
          where: {
            status: 'IN_STOCK'
          }
        }
      },
      orderBy: {
        name: 'asc'
      }
    })

    // Transform to inventory format
    const inventory = products.map(product => {
      const currentStock = product.inventoryItems.length
      let status = 'IN_STOCK'
      
      if (currentStock === 0) {
        status = 'OUT_OF_STOCK'
      } else if (currentStock <= product.lowStockThreshold) {
        status = 'LOW_STOCK'
      }

      return {
        id: product.id,
        productId: product.id,
        productName: product.name,
        sku: product.sku,
        model: product.model,
        currentStock,
        lowStockThreshold: product.lowStockThreshold,
        reorderPoint: product.reorderPoint,
        status,
        category: product.category.name,
        brand: product.brand.name,
        costPrice: Number(product.costPrice),
        sellingPrice: Number(product.sellingPrice),
        lastRestocked: product.updatedAt,
        inventoryItems: product.inventoryItems
      }
    })

    return NextResponse.json({ inventory })
  } catch (error) {
    console.error('Error fetching inventory:', error)
    return NextResponse.json(
      { error: 'Failed to fetch inventory' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/inventory
 * Add stock to a product
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Workers cannot add inventory - owners only
    if (session.user.role === UserRole.SHOP_WORKER) {
      return NextResponse.json({ 
        error: 'Access denied',
        message: 'Workers cannot add inventory directly. Please submit an approval request.',
        action: 'REQUEST_APPROVAL'
      }, { status: 403 })
    }

    const body = await request.json()
    const { shopId, productId, quantity, costPrice, supplierId, batchNumber, serialNumbers } = body

    if (!shopId || !productId || !quantity) {
      return NextResponse.json(
        { error: 'shopId, productId, and quantity are required' },
        { status: 400 }
      )
    }

    // Verify product belongs to shop
    const product = await prisma.product.findFirst({
      where: { id: productId, shopId }
    })

    if (!product) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 })
    }

    // Create inventory items
    const inventoryItems = []
    for (let i = 0; i < quantity; i++) {
      const item = await prisma.inventoryItem.create({
        data: {
          productId,
          shopId,
          status: 'IN_STOCK',
          costPrice: costPrice || product.costPrice,
          purchaseDate: new Date(),
          supplierId,
          batchNumber,
          serialNumber: serialNumbers?.[i] || undefined
        }
      })
      inventoryItems.push(item)
    }

    return NextResponse.json({ 
      success: true,
      added: inventoryItems.length,
      items: inventoryItems
    }, { status: 201 })
  } catch (error) {
    console.error('Error adding inventory:', error)
    return NextResponse.json(
      { error: 'Failed to add inventory' },
      { status: 500 }
    )
  }
}

/**
 * PATCH /api/inventory
 * Remove stock from a product
 */
export async function PATCH(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Workers cannot adjust inventory - owners only
    if (session.user.role === UserRole.SHOP_WORKER) {
      return NextResponse.json({ 
        error: 'Access denied',
        message: 'Workers cannot adjust inventory directly. Please submit an approval request.',
        action: 'REQUEST_APPROVAL'
      }, { status: 403 })
    }

    const body = await request.json()
    const { shopId, productId, quantity, reason } = body

    if (!shopId || !productId || !quantity) {
      return NextResponse.json(
        { error: 'shopId, productId, and quantity are required' },
        { status: 400 }
      )
    }

    // Get available inventory items
    const availableItems = await prisma.inventoryItem.findMany({
      where: {
        productId,
        shopId,
        status: 'IN_STOCK'
      },
      take: quantity,
      orderBy: {
        purchaseDate: 'asc' // FIFO (First In First Out)
      }
    })

    if (availableItems.length < quantity) {
      return NextResponse.json(
        { error: `Insufficient stock. Only ${availableItems.length} available` },
        { status: 400 }
      )
    }

    // Update status to DAMAGED or RETURNED based on reason
    const newStatus = reason?.toLowerCase().includes('damage') ? 'DAMAGED' : 'RETURNED'
    
    const itemIds = availableItems.map(item => item.id)
    await prisma.inventoryItem.updateMany({
      where: {
        id: { in: itemIds }
      },
      data: {
        status: newStatus
      }
    })

    return NextResponse.json({ 
      success: true,
      removed: itemIds.length,
      status: newStatus
    })
  } catch (error) {
    console.error('Error removing inventory:', error)
    return NextResponse.json(
      { error: 'Failed to remove inventory' },
      { status: 500 }
    )
  }
}


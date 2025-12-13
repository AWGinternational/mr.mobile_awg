import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'

// GET - Retrieve cart items for the current user
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get user's shop ID (for shop workers, get their assigned shop)
    let shopId: string | undefined = session.user.shops?.[0]?.id
    
    if (!shopId && session.user.role === 'SHOP_WORKER') {
      const worker = await prisma.shopWorker.findFirst({
        where: { 
          userId: session.user.id,
          isActive: true 
        },
        include: { shop: true }
      })
      shopId = worker?.shopId
    }

    if (!shopId) {
      return NextResponse.json({ error: 'No shop assigned' }, { status: 400 })
    }

    // Fetch cart items with product details
    const cartItems = await prisma.cartItem.findMany({
      where: {
        userId: session.user.id,
        shopId: shopId
      },
      include: {
        product: {
          include: {
            brand: true,
            category: true
          }
        }
      },
      orderBy: { addedAt: 'desc' }
    })

    // Transform cart items to match frontend expectations
    const items = cartItems.map(item => ({
      id: item.id,
      productId: item.productId,
      productName: item.product.name,
      productSku: item.product.sku,
      quantity: item.quantity,
      unitPrice: Number(item.product.sellingPrice),
      totalPrice: Number(item.product.sellingPrice) * item.quantity,
      product: item.product
    }))

    return NextResponse.json({
      success: true,
      cart: { items }
    })
  } catch (error) {
    console.error('Cart GET error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST - Add item to cart
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { productId, quantity = 1, unitPrice } = body

    if (!productId) {
      return NextResponse.json({ error: 'Product ID is required' }, { status: 400 })
    }

    // Get user's shop ID
    let shopId: string | undefined = session.user.shops?.[0]?.id
    
    if (!shopId && session.user.role === 'SHOP_WORKER') {
      const worker = await prisma.shopWorker.findFirst({
        where: { 
          userId: session.user.id,
          isActive: true 
        }
      })
      shopId = worker?.shopId
    }

    if (!shopId) {
      return NextResponse.json({ error: 'No shop assigned' }, { status: 400 })
    }

    // Check if product exists and belongs to the shop
    const product = await prisma.product.findFirst({
      where: {
        id: productId,
        shopId: shopId,
        status: 'ACTIVE'
      }
    })

    if (!product) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 })
    }

    // Check if item already exists in cart
    const existingItem = await prisma.cartItem.findUnique({
      where: {
        userId_productId_shopId: {
          userId: session.user.id,
          productId: productId,
          shopId: shopId
        }
      }
    })

    if (existingItem) {
      // Update quantity
      const updatedItem = await prisma.cartItem.update({
        where: { id: existingItem.id },
        data: {
          quantity: existingItem.quantity + quantity,
          updatedAt: new Date()
        },
        include: {
          product: {
            include: {
              brand: true,
              category: true
            }
          }
        }
      })

      return NextResponse.json({
        success: true,
        item: {
          id: updatedItem.id,
          productId: updatedItem.productId,
          productName: updatedItem.product.name,
          productSku: updatedItem.product.sku,
          quantity: updatedItem.quantity,
          unitPrice: Number(updatedItem.product.sellingPrice),
          totalPrice: Number(updatedItem.product.sellingPrice) * updatedItem.quantity,
          product: updatedItem.product
        }
      })
    } else {
      // Create new cart item
      const newItem = await prisma.cartItem.create({
        data: {
          userId: session.user.id,
          productId: productId,
          shopId: shopId,
          quantity: quantity
        },
        include: {
          product: {
            include: {
              brand: true,
              category: true
            }
          }
        }
      })

      return NextResponse.json({
        success: true,
        item: {
          id: newItem.id,
          productId: newItem.productId,
          productName: newItem.product.name,
          productSku: newItem.product.sku,
          quantity: newItem.quantity,
          unitPrice: Number(newItem.product.sellingPrice),
          totalPrice: Number(newItem.product.sellingPrice) * newItem.quantity,
          product: newItem.product
        }
      })
    }
  } catch (error) {
    console.error('Cart POST error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// PUT - Update cart item quantity
export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { productId, quantity } = body

    if (!productId) {
      return NextResponse.json({ error: 'Product ID is required' }, { status: 400 })
    }

    // Validate quantity
    if (quantity === undefined || quantity <= 0) {
      return NextResponse.json({ error: 'Quantity must be greater than 0' }, { status: 400 })
    }

    // Get user's shop ID
    let shopId: string | undefined = session.user.shops?.[0]?.id
    
    if (!shopId && session.user.role === 'SHOP_WORKER') {
      const worker = await prisma.shopWorker.findFirst({
        where: { 
          userId: session.user.id,
          isActive: true 
        }
      })
      shopId = worker?.shopId
    }

    if (!shopId) {
      return NextResponse.json({ error: 'No shop assigned' }, { status: 400 })
    }

    // Update cart item
    const updatedItem = await prisma.cartItem.update({
      where: {
        userId_productId_shopId: {
          userId: session.user.id,
          productId: productId,
          shopId: shopId
        }
      },
      data: {
        quantity: quantity,
        updatedAt: new Date()
      },
      include: {
        product: {
          include: {
            brand: true,
            category: true
          }
        }
      }
    })

    return NextResponse.json({
      success: true,
      item: {
        id: updatedItem.id,
        productId: updatedItem.productId,
        productName: updatedItem.product.name,
        productSku: updatedItem.product.sku,
        quantity: updatedItem.quantity,
        unitPrice: Number(updatedItem.product.sellingPrice),
        totalPrice: Number(updatedItem.product.sellingPrice) * updatedItem.quantity,
        product: updatedItem.product
      }
    })
  } catch (error) {
    console.error('Cart PUT error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// DELETE - Remove item from cart or clear entire cart
export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { productId, clearAll } = body

    // Get user's shop ID
    let shopId: string | undefined = session.user.shops?.[0]?.id
    
    if (!shopId && session.user.role === 'SHOP_WORKER') {
      const worker = await prisma.shopWorker.findFirst({
        where: { 
          userId: session.user.id,
          isActive: true 
        }
      })
      shopId = worker?.shopId
    }

    if (!shopId) {
      return NextResponse.json({ error: 'No shop assigned' }, { status: 400 })
    }

    if (clearAll) {
      // Clear entire cart
      await prisma.cartItem.deleteMany({
        where: {
          userId: session.user.id,
          shopId: shopId
        }
      })

      return NextResponse.json({
        success: true,
        message: 'Cart cleared successfully'
      })
    } else if (productId) {
      // Remove specific item
      await prisma.cartItem.delete({
        where: {
          userId_productId_shopId: {
            userId: session.user.id,
            productId: productId,
            shopId: shopId
          }
        }
      })

      return NextResponse.json({
        success: true,
        message: 'Item removed from cart'
      })
    } else {
      return NextResponse.json({ error: 'Product ID or clearAll flag is required' }, { status: 400 })
    }
  } catch (error) {
    console.error('Cart DELETE error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
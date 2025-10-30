import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { 
      customerId, 
      paymentMethod = 'cash', 
      notes, 
      taxPercentage = 17, 
      discountAmount = 0,
      discountType = 'percentage'
    } = body

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

    // Get cart items
    const cartItems = await prisma.cartItem.findMany({
      where: {
        userId: session.user.id,
        shopId: shopId
      },
      include: {
        product: true
      }
    })

    if (cartItems.length === 0) {
      return NextResponse.json({ error: 'Cart is empty' }, { status: 400 })
    }

    // Calculate totals
    const subtotal = cartItems.reduce((total, item) => {
      return total + (Number(item.product.sellingPrice) * item.quantity)
    }, 0)

    // Calculate discount
    let discountAmountFinal = 0
    if (discountType === 'percentage') {
      discountAmountFinal = Math.round(subtotal * (discountAmount / 100))
    } else {
      discountAmountFinal = discountAmount
    }

    // Calculate tax on amount after discount
    const afterDiscount = subtotal - discountAmountFinal
    const taxRate = taxPercentage / 100
    const taxAmount = Math.round(afterDiscount * taxRate)
    const totalAmount = subtotal - discountAmountFinal + taxAmount

    // Generate invoice number
    const today = new Date()
    const dateStr = today.toISOString().slice(0, 10).replace(/-/g, '')
    const randomNum = Math.floor(Math.random() * 1000).toString().padStart(3, '0')
    const invoiceNumber = `INV-${dateStr}-${randomNum}`

    // Create sale transaction with payment record
    const sale = await prisma.sale.create({
      data: {
        shopId: shopId,
        customerId: customerId || null,
        sellerId: session.user.id, // 🆕 Track which worker/owner made this sale
        subtotal: subtotal,
        totalAmount: totalAmount,
        discountAmount: discountAmountFinal,
        taxAmount: taxAmount,
        paymentMethod: paymentMethod.toUpperCase(),
        status: 'COMPLETED',
        notes: notes || `POS Sale by ${session.user.name}`,
        invoiceNumber: invoiceNumber,
        saleDate: new Date(),
        // Create payment record automatically
        payments: {
          create: {
            amount: totalAmount,
            method: paymentMethod.toUpperCase(),
            status: 'COMPLETED',
            paymentDate: new Date(),
            notes: `POS payment for ${invoiceNumber}`
          }
        }
      }
    })

    // Create sale items
    const saleItems = await Promise.all(
      cartItems.map(item => 
        prisma.saleItem.create({
          data: {
            saleId: sale.id,
            productId: item.productId,
            quantity: item.quantity,
            unitPrice: item.product.sellingPrice,
            totalPrice: Number(item.product.sellingPrice) * item.quantity
          }
        })
      )
    )

    // Update inventory (mark items as sold)
    await Promise.all(
      cartItems.map(async item => {
        // Get available inventory items for this product
        const availableItems = await prisma.inventoryItem.findMany({
          where: {
            productId: item.productId,
            shopId: shopId,
            status: 'IN_STOCK'
          },
          take: item.quantity
        })

        // Mark items as sold
        if (availableItems.length > 0) {
          await prisma.inventoryItem.updateMany({
            where: {
              id: { in: availableItems.map(i => i.id) }
            },
            data: {
              status: 'OUT_OF_STOCK'
            }
          })
        }
      })
    )

    // Clear cart
    await prisma.cartItem.deleteMany({
      where: {
        userId: session.user.id,
        shopId: shopId
      }
    })

    // Create audit log
    await prisma.auditLog.create({
      data: {
        userId: session.user.id,
        action: 'CREATE',
        tableName: 'Sale',
        recordId: sale.id,
        newValues: {
          invoiceNumber: invoiceNumber,
          totalAmount: totalAmount,
          paymentMethod: paymentMethod,
          itemsCount: cartItems.length
        }
      }
    })

    return NextResponse.json({
      success: true,
      sale: {
        id: sale.id,
        invoiceNumber: sale.invoiceNumber,
        totalAmount: sale.totalAmount,
        taxAmount: sale.taxAmount,
        paymentMethod: sale.paymentMethod,
        saleDate: sale.saleDate,
        items: saleItems
      },
      message: 'Sale completed successfully'
    })

  } catch (error) {
    console.error('❌ Checkout error:', error)
    console.error('Error details:', error instanceof Error ? error.message : 'Unknown error')
    console.error('Error stack:', error instanceof Error ? error.stack : 'No stack trace')
    return NextResponse.json({ 
      error: 'Internal server error', 
      details: error instanceof Error ? error.message : 'Unknown error' 
    }, { status: 500 })
  }
}
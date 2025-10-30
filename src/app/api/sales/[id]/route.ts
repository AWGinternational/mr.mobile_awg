import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params

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

    // Get sale with shop isolation
    const sale = await prisma.sale.findFirst({
      where: {
        id: id,
        shopId: shopId
      },
      include: {
        customer: {
          select: { id: true, name: true, phone: true }
        },
        items: {
          include: {
            product: {
              select: { 
                id: true, 
                name: true, 
                sku: true, 
                sellingPrice: true,
                brand: {
                  select: { name: true }
                },
                category: {
                  select: { name: true }
                }
              }
            }
          }
        }
      }
    })

    if (!sale) {
      return NextResponse.json({ error: 'Sale not found' }, { status: 404 })
    }

    // Transform sale data
    const transformedSale = {
      id: sale.id,
      invoiceNumber: sale.invoiceNumber,
      customerName: sale.customer?.name || 'Walk-in Customer',
      customerPhone: sale.customer?.phone || null,
      subtotal: Number(sale.subtotal),
      taxAmount: Number(sale.taxAmount),
      discountAmount: Number(sale.discountAmount),
      totalAmount: Number(sale.totalAmount),
      paymentMethod: sale.paymentMethod,
      status: sale.status,
      saleDate: sale.saleDate,
      notes: sale.notes,
      itemsCount: sale.items.length,
      items: sale.items.map(item => ({
        id: item.id,
        productName: item.product.name,
        productSku: item.product.sku,
        productBrand: item.product.brand?.name || 'No Brand',
        productCategory: item.product.category?.name || 'No Category',
        quantity: item.quantity,
        unitPrice: Number(item.unitPrice),
        totalPrice: Number(item.totalPrice)
      }))
    }

    return NextResponse.json({
      success: true,
      data: transformedSale
    })

  } catch (error) {
    console.error('Get sale API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params
    const body = await request.json()
    const { status, notes } = body

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

    // Validate status
    const validStatuses = ['PENDING', 'COMPLETED', 'CANCELLED', 'RETURNED']
    if (status && !validStatuses.includes(status)) {
      return NextResponse.json({ 
        error: 'Invalid status. Must be one of: PENDING, COMPLETED, CANCELLED, RETURNED' 
      }, { status: 400 })
    }

    // Check if sale exists and belongs to user's shop
    const existingSale = await prisma.sale.findFirst({
      where: {
        id: id,
        shopId: shopId
      }
    })

    if (!existingSale) {
      return NextResponse.json({ error: 'Sale not found' }, { status: 404 })
    }

    // Update sale
    const updatedSale = await prisma.sale.update({
      where: { id: id },
      data: {
        ...(status && { status }),
        ...(notes !== undefined && { notes })
      },
      include: {
        customer: {
          select: { id: true, name: true, phone: true }
        },
        items: {
          include: {
            product: {
              select: { 
                id: true, 
                name: true, 
                sku: true, 
                sellingPrice: true 
              }
            }
          }
        }
      }
    })

    return NextResponse.json({
      success: true,
      data: {
        id: updatedSale.id,
        invoiceNumber: updatedSale.invoiceNumber,
        customerName: updatedSale.customer?.name || 'Walk-in Customer',
        customerPhone: updatedSale.customer?.phone || null,
        subtotal: Number(updatedSale.subtotal),
        taxAmount: Number(updatedSale.taxAmount),
        discountAmount: Number(updatedSale.discountAmount),
        totalAmount: Number(updatedSale.totalAmount),
        paymentMethod: updatedSale.paymentMethod,
        status: updatedSale.status,
        saleDate: updatedSale.saleDate,
        notes: updatedSale.notes,
        itemsCount: updatedSale.items.length
      }
    })

  } catch (error) {
    console.error('Update sale API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params

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

    // Check if sale exists and belongs to user's shop
    const existingSale = await prisma.sale.findFirst({
      where: {
        id: id,
        shopId: shopId
      },
      include: {
        items: {
          include: {
            product: true
          }
        }
      }
    })

    if (!existingSale) {
      return NextResponse.json({ error: 'Sale not found' }, { status: 404 })
    }

    // Use transaction to ensure data consistency
    await prisma.$transaction(async (tx) => {
      // Restore inventory items
      for (const item of existingSale.items) {
        // Find inventory items that were marked as OUT_OF_STOCK for this sale
        const inventoryItems = await tx.inventoryItem.findMany({
          where: {
            productId: item.productId,
            shopId: shopId,
            status: 'OUT_OF_STOCK'
          },
          take: item.quantity
        })

        // Restore the inventory items
        if (inventoryItems.length > 0) {
          await tx.inventoryItem.updateMany({
            where: {
              id: {
                in: inventoryItems.map(inv => inv.id)
              }
            },
            data: {
              status: 'IN_STOCK'
            }
          })
        }
      }

      // Delete sale items first (due to foreign key constraints)
      await tx.saleItem.deleteMany({
        where: { saleId: id }
      })

      // Delete the sale
      await tx.sale.delete({
        where: { id: id }
      })
    })

    return NextResponse.json({
      success: true,
      message: 'Sale deleted successfully'
    })

  } catch (error) {
    console.error('Delete sale API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

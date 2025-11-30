import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')
    const status = searchParams.get('status')
    const search = searchParams.get('search')

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

    // Build where clause
    const where: any = {
      shopId: shopId
    }

    // Workers can see ALL shop sales (for customer service, returns, verification)
    // No sellerId filter needed - shop isolation is sufficient
    
    // Add date filters
    if (startDate && endDate) {
      where.saleDate = {
        gte: new Date(startDate),
        lte: new Date(endDate)
      }
    }

    // Add status filter
    if (status) {
      where.status = status
    }

    // Add search filter (invoice number, customer name, customer phone)
    if (search) {
      where.OR = [
        { invoiceNumber: { contains: search, mode: 'insensitive' } },
        { customer: { name: { contains: search, mode: 'insensitive' } } },
        { customer: { phone: { contains: search, mode: 'insensitive' } } }
      ]
    }

    // Get total count
    const totalCount = await prisma.sale.count({ where })

    // Get sales with pagination
    const sales = await prisma.sale.findMany({
      where,
      include: {
        customer: {
          select: { id: true, name: true, phone: true }
        },
        items: {
          include: {
            product: {
              select: { id: true, name: true, sku: true, sellingPrice: true, costPrice: true }
            }
          }
        }
      },
      orderBy: { saleDate: 'desc' },
      skip: (page - 1) * limit,
      take: limit
    })

    // Get all sales for the filter (without pagination) to calculate totals
    const allFilteredSales = await prisma.sale.findMany({
      where,
      include: {
        items: {
          include: {
            product: {
              select: { costPrice: true }
            }
          }
        }
      }
    })

    // Calculate summary statistics
    let totalSalesAmount = 0
    let totalCost = 0
    let totalProfit = 0

    allFilteredSales.forEach(sale => {
      const saleAmount = Number(sale.totalAmount)
      totalSalesAmount += saleAmount
      
      // Calculate cost for each sale item
      sale.items.forEach(item => {
        const itemCost = Number(item.product.costPrice) * item.quantity
        totalCost += itemCost
      })
    })
    
    totalProfit = totalSalesAmount - totalCost

    // Transform sales data
    const transformedSales = sales.map(sale => {
      // Calculate cost and profit for individual sale
      let saleCost = 0
      sale.items.forEach(item => {
        saleCost += Number(item.product.costPrice) * item.quantity
      })
      const saleProfit = Number(sale.totalAmount) - saleCost

      return {
        id: sale.id,
        invoiceNumber: sale.invoiceNumber,
        customerName: sale.customer?.name || 'Walk-in Customer',
        customerPhone: sale.customer?.phone || null,
        subtotal: Number(sale.subtotal),
        taxAmount: Number(sale.taxAmount),
        discountAmount: Number(sale.discountAmount),
        totalAmount: Number(sale.totalAmount),
        costAmount: saleCost,
        profitAmount: saleProfit,
        paymentMethod: sale.paymentMethod,
        status: sale.status,
        saleDate: sale.saleDate,
        itemsCount: sale.items.length,
        items: sale.items.map(item => ({
          id: item.id,
          productName: item.product.name,
          productSku: item.product.sku,
          quantity: item.quantity,
          unitPrice: Number(item.unitPrice),
          totalPrice: Number(item.totalPrice)
        }))
      }
    })

    return NextResponse.json({
      success: true,
      data: {
        sales: transformedSales,
        summary: {
          totalSales: totalSalesAmount,
          totalCost: totalCost,
          totalProfit: totalProfit,
          transactionCount: totalCount
        },
        pagination: {
          page,
          limit,
          totalCount,
          totalPages: Math.ceil(totalCount / limit)
        }
      }
    })

  } catch (error) {
    console.error('Sales API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

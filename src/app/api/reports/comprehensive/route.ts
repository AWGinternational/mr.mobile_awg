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
    const date = searchParams.get('date') || new Date().toISOString().split('T')[0]
    const reportType = searchParams.get('type') || 'all' // all, sales, purchases, inventory, mobile-services, payments

    // Get user's shop ID
    let userShopId: string | undefined = (session.user as any).shops?.[0]?.id
    
    if (!userShopId && session.user.role === 'SHOP_WORKER') {
      const worker = await prisma.shopWorker.findFirst({
        where: { 
          userId: session.user.id,
          isActive: true 
        }
      })
      userShopId = worker?.shopId
    }

    if (!userShopId) {
      return NextResponse.json({ error: 'No shop assigned' }, { status: 400 })
    }

    // Parse date range (start of day to end of day)
    const startDate = new Date(date)
    startDate.setHours(0, 0, 0, 0)
    const endDate = new Date(date)
    endDate.setHours(23, 59, 59, 999)

    const reportData: any = {
      date,
      shopId: userShopId,
      generatedAt: new Date().toISOString(),
    }

    // ==================== SALES DATA ====================
    if (reportType === 'all' || reportType === 'sales') {
      const sales = await prisma.sale.findMany({
        where: {
          shopId: userShopId,
          saleDate: {
            gte: startDate,
            lte: endDate
          }
        },
        include: {
          customer: {
            select: { id: true, name: true, phone: true }
          },
          items: {
            include: {
              product: {
                select: { id: true, name: true, sku: true, costPrice: true }
              }
            }
          },
          seller: {
            select: { id: true, name: true }
          }
        },
        orderBy: { saleDate: 'desc' }
      })

      // Calculate sales metrics
      const salesMetrics = {
        totalSales: sales.length,
        totalRevenue: sales.reduce((sum, s) => sum + Number(s.totalAmount), 0),
        totalTax: sales.reduce((sum, s) => sum + Number(s.taxAmount), 0),
        totalDiscount: sales.reduce((sum, s) => sum + Number(s.discountAmount), 0),
        totalItems: sales.reduce((sum, s) => sum + s.items.reduce((isum, i) => isum + i.quantity, 0), 0),
        totalProfit: sales.reduce((sum, s) => {
          const cost = s.items.reduce((isum, i) => isum + (Number(i.product?.costPrice || 0) * i.quantity), 0)
          return sum + (Number(s.totalAmount) - cost)
        }, 0),
        byPaymentMethod: {} as Record<string, { count: number; amount: number }>,
        byStatus: {} as Record<string, { count: number; amount: number }>,
        completedSales: 0,
        pendingSales: 0,
        cancelledSales: 0,
      }

      // Group by payment method and status
      sales.forEach(sale => {
        // By payment method
        if (!salesMetrics.byPaymentMethod[sale.paymentMethod]) {
          salesMetrics.byPaymentMethod[sale.paymentMethod] = { count: 0, amount: 0 }
        }
        salesMetrics.byPaymentMethod[sale.paymentMethod].count++
        salesMetrics.byPaymentMethod[sale.paymentMethod].amount += Number(sale.totalAmount)

        // By status
        if (!salesMetrics.byStatus[sale.status]) {
          salesMetrics.byStatus[sale.status] = { count: 0, amount: 0 }
        }
        salesMetrics.byStatus[sale.status].count++
        salesMetrics.byStatus[sale.status].amount += Number(sale.totalAmount)

        // Count by status
        if (sale.status === 'COMPLETED') salesMetrics.completedSales++
        else if (sale.status === 'PENDING') salesMetrics.pendingSales++
        else if (sale.status === 'CANCELLED') salesMetrics.cancelledSales++
      })

      reportData.sales = {
        metrics: salesMetrics,
        transactions: sales.map(s => ({
          id: s.id,
          invoiceNumber: s.invoiceNumber,
          customerName: s.customer?.name || 'Walk-in Customer',
          customerPhone: s.customer?.phone,
          totalAmount: Number(s.totalAmount),
          taxAmount: Number(s.taxAmount),
          discountAmount: Number(s.discountAmount),
          paymentMethod: s.paymentMethod,
          status: s.status,
          saleDate: s.saleDate,
          createdBy: s.seller?.name || 'Unknown',
          itemsCount: s.items.length,
          items: s.items.map(i => ({
            productName: i.product?.name || 'Unknown Product',
            sku: i.product?.sku || 'N/A',
            quantity: i.quantity,
            unitPrice: Number(i.unitPrice),
            totalPrice: Number(i.totalPrice),
          }))
        }))
      }
    }

    // ==================== PURCHASES DATA ====================
    if (reportType === 'all' || reportType === 'purchases') {
      const purchases = await prisma.purchase.findMany({
        where: {
          shopId: userShopId,
          purchaseDate: {
            gte: startDate,
            lte: endDate
          }
        },
        include: {
          supplier: {
            select: { id: true, name: true, phone: true, contactPerson: true }
          },
          items: true
        },
        orderBy: { purchaseDate: 'desc' }
      })

      const purchaseMetrics = {
        totalPurchases: purchases.length,
        totalAmount: purchases.reduce((sum, p) => sum + Number(p.totalAmount), 0),
        totalPaid: purchases.reduce((sum, p) => sum + Number(p.paidAmount), 0),
        totalDue: purchases.reduce((sum, p) => sum + Number(p.dueAmount), 0),
        totalItems: purchases.reduce((sum, p) => sum + p.items.reduce((isum: number, i) => isum + i.quantity, 0), 0),
        byStatus: {} as Record<string, { count: number; amount: number }>,
        bySupplier: {} as Record<string, { count: number; amount: number }>,
      }

      // Group by status and supplier
      purchases.forEach(purchase => {
        // By status
        if (!purchaseMetrics.byStatus[purchase.status]) {
          purchaseMetrics.byStatus[purchase.status] = { count: 0, amount: 0 }
        }
        purchaseMetrics.byStatus[purchase.status].count++
        purchaseMetrics.byStatus[purchase.status].amount += Number(purchase.totalAmount)

        // By supplier
        const supplierName = purchase.supplier?.name || 'Unknown'
        if (!purchaseMetrics.bySupplier[supplierName]) {
          purchaseMetrics.bySupplier[supplierName] = { count: 0, amount: 0 }
        }
        purchaseMetrics.bySupplier[supplierName].count++
        purchaseMetrics.bySupplier[supplierName].amount += Number(purchase.totalAmount)
      })

      reportData.purchases = {
        metrics: purchaseMetrics,
        transactions: purchases.map(p => ({
          id: p.id,
          invoiceNumber: p.invoiceNumber,
          supplierName: p.supplier?.name || 'Unknown',
          supplierPhone: p.supplier?.phone,
          totalAmount: Number(p.totalAmount),
          paidAmount: Number(p.paidAmount),
          dueAmount: Number(p.dueAmount),
          status: p.status,
          purchaseDate: p.purchaseDate,
          receivedDate: p.receivedDate,
          itemsCount: p.items.length,
          items: p.items.map(i => ({
            productId: i.productId,
            quantity: i.quantity,
            receivedQty: i.receivedQty,
            unitCost: Number(i.unitCost),
            totalCost: Number(i.totalCost),
          }))
        }))
      }
    }

    // ==================== INVENTORY (Stock Changes) ====================
    if (reportType === 'all' || reportType === 'inventory') {
      // Get inventory items created/updated today
      const inventoryItems = await prisma.inventoryItem.findMany({
        where: {
          shopId: userShopId,
          createdAt: {
            gte: startDate,
            lte: endDate
          }
        },
        include: {
          product: {
            select: { id: true, name: true, sku: true }
          },
          supplier: {
            select: { id: true, name: true }
          }
        },
        orderBy: { createdAt: 'desc' }
      })

      const inventoryMetrics = {
        totalNewItems: inventoryItems.length,
        totalValue: inventoryItems.reduce((sum, i) => sum + Number(i.costPrice), 0),
        byStatus: {} as Record<string, { count: number; value: number }>,
        byProduct: {} as Record<string, { count: number; value: number }>,
      }

      // Group by status and product
      inventoryItems.forEach(item => {
        // By status
        if (!inventoryMetrics.byStatus[item.status]) {
          inventoryMetrics.byStatus[item.status] = { count: 0, value: 0 }
        }
        inventoryMetrics.byStatus[item.status].count++
        inventoryMetrics.byStatus[item.status].value += Number(item.costPrice)

        // By product
        const productName = item.product?.name || 'Unknown'
        if (!inventoryMetrics.byProduct[productName]) {
          inventoryMetrics.byProduct[productName] = { count: 0, value: 0 }
        }
        inventoryMetrics.byProduct[productName].count++
        inventoryMetrics.byProduct[productName].value += Number(item.costPrice)
      })

      reportData.inventory = {
        metrics: inventoryMetrics,
        items: inventoryItems.map(i => ({
          id: i.id,
          productName: i.product?.name || 'Unknown',
          sku: i.product?.sku || 'N/A',
          imei: i.imei,
          serialNumber: i.serialNumber,
          status: i.status,
          costPrice: Number(i.costPrice),
          supplierName: i.supplier?.name,
          purchaseDate: i.purchaseDate,
          createdAt: i.createdAt,
        }))
      }
    }

    // ==================== MOBILE SERVICES ====================
    if (reportType === 'all' || reportType === 'mobile-services') {
      const mobileServices = await prisma.mobileService.findMany({
        where: {
          shopId: userShopId,
          transactionDate: {
            gte: startDate,
            lte: endDate
          }
        },
        include: {
          createdBy: {
            select: { id: true, name: true }
          }
        },
        orderBy: { transactionDate: 'desc' }
      })

      const serviceMetrics = {
        totalTransactions: mobileServices.length,
        totalAmount: mobileServices.reduce((sum, s) => sum + Number(s.amount), 0),
        totalCommission: mobileServices.reduce((sum, s) => sum + Number(s.commission), 0),
        totalDiscount: mobileServices.reduce((sum, s) => sum + Number(s.discount), 0),
        netCommission: mobileServices.reduce((sum, s) => sum + Number(s.netCommission), 0),
        byServiceType: {} as Record<string, { count: number; amount: number; commission: number }>,
        byLoadProvider: {} as Record<string, { count: number; amount: number; commission: number }>,
      }

      // Group by service type and load provider
      mobileServices.forEach(service => {
        // By service type
        if (!serviceMetrics.byServiceType[service.serviceType]) {
          serviceMetrics.byServiceType[service.serviceType] = { count: 0, amount: 0, commission: 0 }
        }
        serviceMetrics.byServiceType[service.serviceType].count++
        serviceMetrics.byServiceType[service.serviceType].amount += Number(service.amount)
        serviceMetrics.byServiceType[service.serviceType].commission += Number(service.netCommission)

        // By load provider (if applicable)
        if (service.loadProvider) {
          if (!serviceMetrics.byLoadProvider[service.loadProvider]) {
            serviceMetrics.byLoadProvider[service.loadProvider] = { count: 0, amount: 0, commission: 0 }
          }
          serviceMetrics.byLoadProvider[service.loadProvider].count++
          serviceMetrics.byLoadProvider[service.loadProvider].amount += Number(service.amount)
          serviceMetrics.byLoadProvider[service.loadProvider].commission += Number(service.netCommission)
        }
      })

      reportData.mobileServices = {
        metrics: serviceMetrics,
        transactions: mobileServices.map(s => ({
          id: s.id,
          serviceType: s.serviceType,
          loadProvider: s.loadProvider,
          customerName: s.customerName,
          phoneNumber: s.phoneNumber,
          amount: Number(s.amount),
          commissionRate: Number(s.commissionRate),
          commission: Number(s.commission),
          discount: Number(s.discount),
          netCommission: Number(s.netCommission),
          referenceId: s.referenceId,
          status: s.status,
          transactionDate: s.transactionDate,
          createdBy: s.createdBy?.name || 'Unknown',
        }))
      }
    }

    // ==================== PAYMENTS ====================
    if (reportType === 'all' || reportType === 'payments') {
      const payments = await prisma.payment.findMany({
        where: {
          sale: {
            shopId: userShopId
          },
          paymentDate: {
            gte: startDate,
            lte: endDate
          }
        },
        include: {
          sale: {
            select: {
              id: true,
              invoiceNumber: true,
              customer: {
                select: { id: true, name: true }
              }
            }
          }
        },
        orderBy: { paymentDate: 'desc' }
      })

      const paymentMetrics = {
        totalPayments: payments.length,
        totalAmount: payments.reduce((sum, p) => sum + Number(p.amount), 0),
        byMethod: {} as Record<string, { count: number; amount: number }>,
        byStatus: {} as Record<string, { count: number; amount: number }>,
      }

      // Group by method and status
      payments.forEach(payment => {
        // By method
        if (!paymentMetrics.byMethod[payment.method]) {
          paymentMetrics.byMethod[payment.method] = { count: 0, amount: 0 }
        }
        paymentMetrics.byMethod[payment.method].count++
        paymentMetrics.byMethod[payment.method].amount += Number(payment.amount)

        // By status
        if (!paymentMetrics.byStatus[payment.status]) {
          paymentMetrics.byStatus[payment.status] = { count: 0, amount: 0 }
        }
        paymentMetrics.byStatus[payment.status].count++
        paymentMetrics.byStatus[payment.status].amount += Number(payment.amount)
      })

      reportData.payments = {
        metrics: paymentMetrics,
        transactions: payments.map(p => ({
          id: p.id,
          amount: Number(p.amount),
          method: p.method,
          status: p.status,
          transactionId: p.transactionId,
          reference: p.reference,
          invoiceNumber: p.sale?.invoiceNumber,
          customerName: p.sale?.customer?.name || 'Walk-in',
          paymentDate: p.paymentDate,
        }))
      }
    }

    // ==================== DAILY CLOSING (if exists) ====================
    if (reportType === 'all') {
      const dailyClosing = await prisma.dailyClosing.findFirst({
        where: {
          shopId: userShopId,
          date: {
            gte: startDate,
            lte: endDate
          }
        }
      })

      if (dailyClosing) {
        reportData.dailyClosing = {
          id: dailyClosing.id,
          date: dailyClosing.date,
          status: dailyClosing.status,
          // Sales categories
          cashSales: Number(dailyClosing.cashSales),
          cardSales: Number(dailyClosing.cardSales),
          bankTransferSales: Number(dailyClosing.bankTransferSales),
          // Load sales
          jazzLoadSales: Number(dailyClosing.jazzLoadSales),
          telenorLoadSales: Number(dailyClosing.telenorLoadSales),
          zongLoadSales: Number(dailyClosing.zongLoadSales),
          ufoneLoadSales: Number(dailyClosing.ufoneLoadSales),
          // Mobile payments
          easypaisaSales: Number(dailyClosing.easypaisaSales),
          jazzcashSales: Number(dailyClosing.jazzcashSales),
          // Totals
          totalIncome: Number(dailyClosing.totalIncome),
          totalExpenses: Number(dailyClosing.totalExpenses),
          netAmount: Number(dailyClosing.netAmount),
          // Legacy/other
          totalSales: Number(dailyClosing.totalSales),
          openingCash: Number(dailyClosing.openingCash),
          closingCash: Number(dailyClosing.closingCash),
          notes: dailyClosing.notes,
          closedAt: dailyClosing.closedAt,
        }
      }
    }

    // ==================== SUMMARY ====================
    if (reportType === 'all') {
      reportData.summary = {
        totalRevenue: reportData.sales?.metrics?.totalRevenue || 0,
        totalExpenses: reportData.purchases?.metrics?.totalAmount || 0,
        netProfit: (reportData.sales?.metrics?.totalRevenue || 0) - (reportData.purchases?.metrics?.totalAmount || 0),
        totalCommissions: reportData.mobileServices?.metrics?.netCommission || 0,
        inventoryItemsAdded: reportData.inventory?.metrics?.totalNewItems || 0,
        salesCount: reportData.sales?.metrics?.totalSales || 0,
        purchasesCount: reportData.purchases?.metrics?.totalPurchases || 0,
        mobileServicesCount: reportData.mobileServices?.metrics?.totalTransactions || 0,
      }
    }

    return NextResponse.json({
      success: true,
      data: reportData
    })

  } catch (error) {
    console.error('Comprehensive report error:', error)
    return NextResponse.json(
      { error: 'Failed to generate report', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

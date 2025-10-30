import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'

/**
 * GET /api/daily-closing?date=YYYY-MM-DD
 * Get daily closing data for a specific date
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const rawDate = searchParams.get('date') || new Date().toISOString().split('T')[0]
    
    // Extract just the date part (YYYY-MM-DD) in case it includes time
    const date = rawDate.split('T')[0]

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

    // Get date range for the day
    const startDate = new Date(date + 'T00:00:00.000Z')
    const endDate = new Date(date + 'T23:59:59.999Z')

    // Fetch sales for the day
    const sales = await prisma.sale.findMany({
      where: {
        shopId: shopId,
        saleDate: {
          gte: startDate,
          lte: endDate
        }
      },
      include: {
        items: {
          include: {
            product: true
          }
        }
      }
    })

    // Calculate sales by payment method
    const salesByPaymentMethod = sales.reduce((acc, sale) => {
      const amount = Number(sale.totalAmount)
      const method = sale.paymentMethod.toLowerCase()
      
      if (!acc[method]) {
        acc[method] = 0
      }
      acc[method] += amount
      
      return acc
    }, {} as Record<string, number>)

    // Get existing daily closing record
    const existingClosing = await prisma.dailyClosing.findFirst({
      where: {
        shopId: shopId,
        date: startDate
      }
    })

    // Calculate total remaining loans for this shop
    const totalRemainingLoans = await prisma.loan.aggregate({
      where: {
        customer: {
          shopId: shopId
        },
        status: {
          in: ['ACTIVE', 'SUSPENDED'] // Only active and suspended loans
        }
      },
      _sum: {
        remainingAmount: true
      }
    })

    // 🆕 AUTO-CALCULATE PURCHASE EXPENSES (Supplier Payments Made Today)
    const purchasePayments = await prisma.purchasePayment.findMany({
      where: {
        purchase: {
          shopId: shopId
        },
        paymentDate: {
          gte: startDate,
          lte: endDate
        }
      },
      include: {
        purchase: {
          include: {
            supplier: true
          }
        }
      }
    })

    const totalPurchaseExpenses = purchasePayments.reduce((sum, payment) => 
      sum + Number(payment.amount), 0
    )

    // 🆕 AUTO-CALCULATE SERVICE FEES (Mobile Services Today)
    const mobileServices = await prisma.mobileService.findMany({
      where: {
        shopId: shopId,
        transactionDate: {
          gte: startDate,
          lte: endDate
        }
      }
    })

    // Group service fees by type
    const serviceFees = mobileServices.reduce((acc, service) => {
      const type = service.serviceType.toLowerCase()
      const commission = Number(service.netCommission || 0)
      const amount = Number(service.amount || 0)
      
      if (!acc[type]) {
        acc[type] = { commission: 0, amount: 0, count: 0 }
      }
      
      acc[type].commission += commission
      acc[type].amount += amount
      acc[type].count += 1
      
      return acc
    }, {} as Record<string, { commission: number; amount: number; count: number }>)

    // Calculate individual service type totals based on provider
    const jazzLoadFees = (serviceFees['load']?.commission || 0) // Jazz loads
    const telenorLoadFees = 0 // Will need to filter by loadProvider if needed
    const zongLoadFees = 0 // Will need to filter by loadProvider if needed
    const ufoneLoadFees = 0 // Will need to filter by loadProvider if needed
    const easypaisaFees = (serviceFees['easypaisa']?.commission || 0) + (serviceFees['easypaisa_transfer']?.commission || 0)
    const jazzcashFees = (serviceFees['jazzcash']?.commission || 0) + (serviceFees['jazzcash_transfer']?.commission || 0)

    // 🆕 AUTO-CALCULATE COST OF GOODS SOLD (COGS)
    const saleItems = await prisma.saleItem.findMany({
      where: {
        sale: {
          shopId: shopId,
          saleDate: {
            gte: startDate,
            lte: endDate
          }
        }
      },
      include: {
        product: true
      }
    })

    const totalCOGS = saleItems.reduce((sum, item) => {
      const costPrice = Number(item.product.costPrice || 0)
      const quantity = Number(item.quantity)
      return sum + (costPrice * quantity)
    }, 0)

    // Calculate totals - ALL POS sales combined regardless of payment method
    const totalSalesFromAPI = sales.reduce((sum, sale) => sum + Number(sale.totalAmount), 0)
    
    const totalCashSales = salesByPaymentMethod.cash || 0
    const totalCardSales = salesByPaymentMethod.card || 0
    const totalBankTransferSales = salesByPaymentMethod.bank_transfer || 0
    const totalMobilePaymentSales = (salesByPaymentMethod.easypaisa || 0) + (salesByPaymentMethod.jazzcash || 0)

    // Calculate Gross Profit
    const grossProfit = totalSalesFromAPI - totalCOGS

    return NextResponse.json({
      success: true,
      data: {
        date,
        salesData: {
          totalSales: totalSalesFromAPI,
          cashSales: totalSalesFromAPI, // Use total for auto-population
          cardSales: totalCardSales,
          bankTransferSales: totalBankTransferSales,
          mobilePaymentSales: totalMobilePaymentSales,
          salesByPaymentMethod,
          totalTransactions: sales.length
        },
        loanData: {
          totalRemainingLoans: Number(totalRemainingLoans._sum.remainingAmount || 0)
        },
        // 🆕 AUTO-CALCULATED PURCHASE DATA
        purchaseData: {
          totalPurchaseExpenses: totalPurchaseExpenses,
          paymentsCount: purchasePayments.length,
          payments: purchasePayments.map(p => ({
            amount: Number(p.amount),
            supplier: p.purchase.supplier.name,
            method: p.method,
            reference: p.reference
          }))
        },
        // 🆕 AUTO-CALCULATED SERVICE FEE DATA
        serviceFeeData: {
          jazzLoadFees,
          telenorLoadFees,
          zongLoadFees,
          ufoneLoadFees,
          easypaisaFees,
          jazzcashFees,
          totalServiceFees: jazzLoadFees + telenorLoadFees + zongLoadFees + ufoneLoadFees + easypaisaFees + jazzcashFees,
          transactionsCount: mobileServices.length,
          breakdown: serviceFees
        },
        // 🆕 AUTO-CALCULATED COGS DATA
        cogsData: {
          totalCOGS,
          grossProfit,
          grossProfitMargin: totalSalesFromAPI > 0 ? ((grossProfit / totalSalesFromAPI) * 100).toFixed(2) : '0',
          itemsSold: saleItems.length
        },
        closingData: existingClosing ? {
          id: existingClosing.id,
          cashSales: Number(existingClosing.cashSales),
          cardSales: Number(existingClosing.cardSales),
          bankTransferSales: Number(existingClosing.bankTransferSales),
          jazzLoadSales: Number(existingClosing.jazzLoadSales),
          telenorLoadSales: Number(existingClosing.telenorLoadSales),
          zongLoadSales: Number(existingClosing.zongLoadSales),
          ufoneLoadSales: Number(existingClosing.ufoneLoadSales),
          easypaisaSales: Number(existingClosing.easypaisaSales),
          jazzcashSales: Number(existingClosing.jazzcashSales),
          receiving: Number(existingClosing.receiving),
          bankTransfer: Number(existingClosing.bankTransfer),
          loan: Number(existingClosing.loan),
          cash: Number(existingClosing.cash),
          credit: Number(existingClosing.credit),
          inventory: Number(existingClosing.inventory),
          totalIncome: Number(existingClosing.totalIncome),
          totalExpenses: Number(existingClosing.totalExpenses),
          netAmount: Number(existingClosing.netAmount),
          notes: existingClosing.notes
        } : null
      }
    })

  } catch (error) {
    console.error('Daily closing API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

/**
 * POST /api/daily-closing
 * Create or update daily closing data
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Only shop owners can create daily closing entries
    if (session.user.role === 'SHOP_WORKER') {
      return NextResponse.json({ 
        error: 'Access denied',
        message: 'Workers cannot create daily closing entries. Only shop owners can perform this action.',
        action: 'CONTACT_OWNER'
      }, { status: 403 })
    }

    const body = await request.json()
    console.log('📋 Daily Closing Request Body:', JSON.stringify(body, null, 2))
    
    // Helper function to safely parse numeric values
    const parseNumeric = (value: any): number => {
      if (value === null || value === undefined || value === '') return 0
      
      // If it's already a number, return it
      if (typeof value === 'number') return value
      
      // If it's a string, remove commas and parse
      if (typeof value === 'string') {
        const cleaned = value.replace(/,/g, '')
        const parsed = parseFloat(cleaned)
        return isNaN(parsed) ? 0 : parsed
      }
      
      return 0
    }
    
    const {
      date: rawDate,
      cashSales: rawCashSales,
      jazzLoadSales: rawJazzLoadSales,
      telenorLoadSales: rawTelenorLoadSales,
      zongLoadSales: rawZongLoadSales,
      ufoneLoadSales: rawUfoneLoadSales,
      easypaisaSales: rawEasypaisaSales,
      jazzcashSales: rawJazzcashSales,
      receiving: rawReceiving,
      bankTransfer: rawBankTransfer,
      loan: rawLoan,
      cash: rawCash,
      credit: rawCredit,
      inventory: rawInventory,
      notes
    } = body
    
    // Extract just the date part (YYYY-MM-DD) in case it includes time
    const date = rawDate ? rawDate.split('T')[0] : new Date().toISOString().split('T')[0]
    
    // Parse all numeric values safely
    const cashSales = parseNumeric(rawCashSales)
    const jazzLoadSales = parseNumeric(rawJazzLoadSales)
    const telenorLoadSales = parseNumeric(rawTelenorLoadSales)
    const zongLoadSales = parseNumeric(rawZongLoadSales)
    const ufoneLoadSales = parseNumeric(rawUfoneLoadSales)
    const easypaisaSales = parseNumeric(rawEasypaisaSales)
    const jazzcashSales = parseNumeric(rawJazzcashSales)
    const receiving = parseNumeric(rawReceiving)
    const bankTransfer = parseNumeric(rawBankTransfer)
    const loan = parseNumeric(rawLoan)
    const cash = parseNumeric(rawCash)
    const credit = parseNumeric(rawCredit)
    const inventory = parseNumeric(rawInventory)
    
    console.log('🔢 Parsed numeric values:', {
      cashSales,
      jazzLoadSales,
      telenorLoadSales,
      zongLoadSales,
      ufoneLoadSales,
      easypaisaSales,
      jazzcashSales,
      receiving,
      bankTransfer,
      loan,
      cash,
      credit,
      inventory
    })

    // Validate that values are within acceptable range (max 9,999,999,999,999.99)
    const MAX_VALUE = 9999999999999.99
    const values = {
      cashSales,
      jazzLoadSales,
      telenorLoadSales,
      zongLoadSales,
      ufoneLoadSales,
      easypaisaSales,
      jazzcashSales,
      receiving,
      bankTransfer,
      loan,
      cash,
      credit,
      inventory
    }
    
    for (const [key, value] of Object.entries(values)) {
      if (value > MAX_VALUE) {
        console.error(`❌ Value too large for ${key}:`, value)
        return NextResponse.json({ 
          error: 'Value too large', 
          details: `The value for ${key} (${value.toLocaleString()}) exceeds the maximum allowed value` 
        }, { status: 400 })
      }
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

    // Calculate totals according to user's formula:
    // (Total POS Sales + all loads + bank amount + easypaisa + jazzcash + loan + cash + commissions) - (purchasing/inventory + credit)
    const totalIncome = (cashSales || 0) + // Total POS Sales (all payment methods combined)
                       (jazzLoadSales || 0) + (telenorLoadSales || 0) + (zongLoadSales || 0) + (ufoneLoadSales || 0) + // All loads
                       (bankTransfer || 0) + // Bank amount
                       (easypaisaSales || 0) + (jazzcashSales || 0) + // Easypaisa + JazzCash (banking services/commissions)
                       (loan || 0) + (cash || 0) + // Loan + Cash
                       (receiving || 0) // Commissions

    const totalExpenses = (inventory || 0) + (credit || 0) // Inventory/Purchasing + Credit taken from company
    const netAmount = totalIncome - totalExpenses
    
    console.log('💰 Daily Closing Calculation:')
    console.log('  - Total POS Sales:', cashSales)
    console.log('  - Load Sales:', (jazzLoadSales || 0) + (telenorLoadSales || 0) + (zongLoadSales || 0) + (ufoneLoadSales || 0))
    console.log('  - Banking Services:', (easypaisaSales || 0) + (jazzcashSales || 0))
    console.log('  - Bank Amount:', bankTransfer || 0)
    console.log('  - Commissions:', receiving || 0)
    console.log('  - Other Income:', (loan || 0) + (cash || 0))
    console.log('  - Total Income:', totalIncome)
    console.log('  - Total Expenses:', totalExpenses)
    console.log('  - Net Amount:', netAmount)

    const closingDate = new Date(date + 'T00:00:00.000Z')

    // Check if closing already exists for this date
    const existingClosing = await prisma.dailyClosing.findFirst({
      where: {
        shopId: shopId,
        date: closingDate
      }
    })

    let dailyClosing

    const dataToSave = {
      status: 'CLOSED' as const,
      cashSales: cashSales || 0,
      cardSales: 0,
      bankTransferSales: 0,
      jazzLoadSales: jazzLoadSales || 0,
      telenorLoadSales: telenorLoadSales || 0,
      zongLoadSales: zongLoadSales || 0,
      ufoneLoadSales: ufoneLoadSales || 0,
      easypaisaSales: easypaisaSales || 0,
      jazzcashSales: jazzcashSales || 0,
      receiving: receiving || 0,
      bankTransfer: bankTransfer || 0,
      loan: loan || 0,
      cash: cash || 0,
      credit: credit || 0,
      inventory: inventory || 0,
      totalIncome,
      totalExpenses,
      netAmount,
      notes: notes || ''
    }
    
    console.log('💾 Data to save (types):', Object.entries(dataToSave).map(([key, val]) => `${key}: ${typeof val} (${val})`).join(', '))

    if (existingClosing) {
      // Update existing closing
      dailyClosing = await prisma.dailyClosing.update({
        where: { id: existingClosing.id },
        data: {
          status: 'CLOSED', // Set status to CLOSED when updating
          cashSales: cashSales || 0, // Total POS Sales (all payment methods combined)
          cardSales: 0, // Not used - all POS sales go into cashSales
          bankTransferSales: 0, // Not used - all POS sales go into cashSales
          jazzLoadSales: jazzLoadSales || 0,
          telenorLoadSales: telenorLoadSales || 0,
          zongLoadSales: zongLoadSales || 0,
          ufoneLoadSales: ufoneLoadSales || 0,
          easypaisaSales: easypaisaSales || 0, // Banking service commission
          jazzcashSales: jazzcashSales || 0, // Banking service commission
          receiving: receiving || 0,
          bankTransfer: bankTransfer || 0,
          loan: loan || 0,
          cash: cash || 0,
          credit: credit || 0,
          inventory: inventory || 0,
          totalIncome,
          totalExpenses,
          netAmount,
          notes: notes || '',
          updatedAt: new Date()
        }
      })
    } else {
      // Create new closing
      dailyClosing = await prisma.dailyClosing.create({
        data: {
          shopId,
          date: closingDate,
          status: 'CLOSED', // Set status to CLOSED when creating
          cashSales: cashSales || 0, // Total POS Sales (all payment methods combined)
          cardSales: 0, // Not used - all POS sales go into cashSales
          bankTransferSales: 0, // Not used - all POS sales go into cashSales
          jazzLoadSales: jazzLoadSales || 0,
          telenorLoadSales: telenorLoadSales || 0,
          zongLoadSales: zongLoadSales || 0,
          ufoneLoadSales: ufoneLoadSales || 0,
          easypaisaSales: easypaisaSales || 0, // Banking service commission
          jazzcashSales: jazzcashSales || 0, // Banking service commission
          receiving: receiving || 0,
          bankTransfer: bankTransfer || 0,
          loan: loan || 0,
          cash: cash || 0,
          credit: credit || 0,
          inventory: inventory || 0,
          totalIncome,
          totalExpenses,
          netAmount,
          notes: notes || ''
        }
      })
    }

    return NextResponse.json({
      success: true,
      data: {
        id: dailyClosing.id,
        date: dailyClosing.date,
        totalIncome,
        totalExpenses,
        netAmount,
        message: existingClosing ? 'Daily closing updated successfully' : 'Daily closing created successfully'
      }
    }, { status: 201 })

  } catch (error) {
    console.error('❌ Create daily closing API error:', error)
    console.error('❌ Error type:', error?.constructor?.name)
    console.error('❌ Error message:', error instanceof Error ? error.message : 'Unknown error')
    console.error('❌ Error stack:', error instanceof Error ? error.stack : 'No stack')
    
    // Extract more details from Prisma errors
    if (error && typeof error === 'object' && 'code' in error) {
      console.error('❌ Prisma error code:', (error as any).code)
      console.error('❌ Prisma meta:', (error as any).meta)
    }
    
    return NextResponse.json({ 
      error: 'Internal server error', 
      details: error instanceof Error ? error.message : 'Unknown error',
      errorType: error?.constructor?.name || 'Unknown'
    }, { status: 500 })
  }
}

import { prisma } from '../src/lib/db'

async function checkSalesAndDates() {
  try {
    console.log('🔍 Checking sales dates...\n')

    // Get all sales
    const sales = await prisma.sale.findMany({
      orderBy: {
        saleDate: 'desc'
      },
      take: 20,
      select: {
        id: true,
        invoiceNumber: true,
        totalAmount: true,
        saleDate: true,
        paymentMethod: true,
        shop: {
          select: {
            id: true,
            name: true
          }
        }
      }
    })

    console.log(`📊 Found ${sales.length} recent sales:\n`)

    sales.forEach(sale => {
      console.log(`Invoice: ${sale.invoiceNumber}`)
      console.log(`  Shop: ${sale.shop.name}`)
      console.log(`  Amount: ${sale.totalAmount}`)
      console.log(`  Payment Method: ${sale.paymentMethod}`)
      console.log(`  Sale Date: ${sale.saleDate.toISOString()}`)
      console.log(`  Sale Date (Local): ${sale.saleDate.toLocaleString('en-PK', { timeZone: 'Asia/Karachi' })}`)
      console.log(`  Date Only: ${sale.saleDate.toISOString().split('T')[0]}`)
      console.log('---')
    })

    // Get today's date in different formats
    const now = new Date()
    console.log('\n📅 Today\'s date in different formats:')
    console.log(`  Current timestamp: ${now.toISOString()}`)
    console.log(`  Local time (Pakistan): ${now.toLocaleString('en-PK', { timeZone: 'Asia/Karachi' })}`)
    console.log(`  Date string (YYYY-MM-DD): ${now.toISOString().split('T')[0]}`)
    
    // Test date range query for today
    const todayStr = now.toISOString().split('T')[0]
    const startDate = new Date(todayStr + 'T00:00:00.000Z')
    const endDate = new Date(todayStr + 'T23:59:59.999Z')
    
    console.log(`\n🔍 Testing date range query for ${todayStr}:`)
    console.log(`  Start: ${startDate.toISOString()}`)
    console.log(`  End: ${endDate.toISOString()}`)

    const todaySales = await prisma.sale.findMany({
      where: {
        saleDate: {
          gte: startDate,
          lte: endDate
        }
      },
      select: {
        id: true,
        invoiceNumber: true,
        totalAmount: true,
        saleDate: true
      }
    })

    console.log(`\n✅ Found ${todaySales.length} sales for ${todayStr}`)
    if (todaySales.length > 0) {
      const total = todaySales.reduce((sum, s) => sum + Number(s.totalAmount), 0)
      console.log(`   Total amount: ${total.toLocaleString('en-PK', { style: 'currency', currency: 'PKR' })}`)
    }

  } catch (error) {
    console.error('❌ Error:', error)
  } finally {
    await prisma.$disconnect()
  }
}

checkSalesAndDates()

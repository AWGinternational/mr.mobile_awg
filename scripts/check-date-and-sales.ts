import { prisma } from '../src/lib/db'

async function checkCurrentDateAndSales() {
  try {
    console.log('📅 Current Date Information:\n')
    
    const now = new Date()
    console.log('System timestamp:', now.toISOString())
    console.log('Local time (Pakistan):', now.toLocaleString('en-PK', { timeZone: 'Asia/Karachi' }))
    console.log('Date string (YYYY-MM-DD):', now.toISOString().split('T')[0])
    console.log('Month:', now.getMonth() + 1, '/', 'Year:', now.getFullYear())
    
    console.log('\n🔍 Recent Sales:\n')

    const sales = await prisma.sale.findMany({
      orderBy: {
        saleDate: 'desc'
      },
      take: 5,
      include: {
        shop: {
          select: {
            name: true
          }
        },
        payments: {
          select: {
            id: true,
            amount: true,
            paymentDate: true
          }
        }
      }
    })

    sales.forEach(sale => {
      console.log(`\n📋 ${sale.invoiceNumber} - ${sale.shop.name}`)
      console.log(`   Amount: ${Number(sale.totalAmount).toLocaleString('en-PK', { style: 'currency', currency: 'PKR' })}`)
      console.log(`   Sale Date: ${sale.saleDate.toISOString()}`)
      console.log(`   Sale Date (Local): ${sale.saleDate.toLocaleString('en-PK', { timeZone: 'Asia/Karachi' })}`)
      console.log(`   Date Only: ${sale.saleDate.toISOString().split('T')[0]}`)
      console.log(`   Payment Records: ${sale.payments.length}`)
      if (sale.payments.length > 0) {
        sale.payments.forEach(p => {
          console.log(`     - Payment: ${Number(p.amount).toLocaleString('en-PK', { style: 'currency', currency: 'PKR' })} on ${p.paymentDate.toISOString().split('T')[0]}`)
        })
      }
    })

    // Test query for today
    const todayStr = now.toISOString().split('T')[0]
    const startDate = new Date(todayStr + 'T00:00:00.000Z')
    const endDate = new Date(todayStr + 'T23:59:59.999Z')

    console.log(`\n\n🔎 Testing query for ${todayStr}:`)
    console.log(`   Range: ${startDate.toISOString()} to ${endDate.toISOString()}`)

    const todaySales = await prisma.sale.findMany({
      where: {
        saleDate: {
          gte: startDate,
          lte: endDate
        }
      }
    })

    console.log(`   Result: ${todaySales.length} sales found`)
    if (todaySales.length > 0) {
      const total = todaySales.reduce((sum, s) => sum + Number(s.totalAmount), 0)
      console.log(`   Total: ${total.toLocaleString('en-PK', { style: 'currency', currency: 'PKR' })}`)
      todaySales.forEach(s => {
        console.log(`     - ${s.invoiceNumber}: ${Number(s.totalAmount).toLocaleString('en-PK', { style: 'currency', currency: 'PKR' })}`)
      })
    }

  } catch (error) {
    console.error('❌ Error:', error)
  } finally {
    await prisma.$disconnect()
  }
}

checkCurrentDateAndSales()

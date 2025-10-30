import { prisma } from '../src/lib/db'

async function checkDailyClosing() {
  try {
    const today = new Date().toISOString().split('T')[0]
    const startDate = new Date(today + 'T00:00:00.000Z')
    
    console.log(`📅 Checking for daily closing on ${today}\n`)

    const closings = await prisma.dailyClosing.findMany({
      where: {
        date: startDate
      },
      include: {
        shop: {
          select: {
            name: true
          }
        }
      }
    })

    console.log(`Found ${closings.length} daily closing records for ${today}:\n`)

    closings.forEach(closing => {
      console.log(`Shop: ${closing.shop.name}`)
      console.log(`  Cash Sales: ${closing.cashSales}`)
      console.log(`  Total Sales: ${closing.totalSales}`)
      console.log(`  Status: ${closing.status}`)
      console.log(`  Closed At: ${closing.closedAt}`)
      console.log(`  Notes: ${closing.notes || 'None'}`)
      console.log('---')
    })

  } catch (error) {
    console.error('❌ Error:', error)
  } finally {
    await prisma.$disconnect()
  }
}

checkDailyClosing()

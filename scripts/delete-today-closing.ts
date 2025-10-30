import { prisma } from '../src/lib/db'

async function deleteTodayClosing() {
  try {
    const today = new Date().toISOString().split('T')[0]
    const startDate = new Date(today + 'T00:00:00.000Z')
    
    console.log(`📅 Looking for daily closing on ${today}\n`)

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

    if (closings.length === 0) {
      console.log('✅ No daily closing records found for today')
      return
    }

    console.log(`Found ${closings.length} daily closing record(s):\n`)

    for (const closing of closings) {
      console.log(`Shop: ${closing.shop.name}`)
      console.log(`  ID: ${closing.id}`)
      console.log(`  Cash Sales: ${closing.cashSales}`)
      console.log(`  Total Sales: ${closing.totalSales}`)
      console.log(`  Status: ${closing.status}`)
      console.log(`  Created: ${closing.createdAt}`)
      
      // Delete this closing
      await prisma.dailyClosing.delete({
        where: {
          id: closing.id
        }
      })
      
      console.log(`  ✅ Deleted closing record`)
      console.log('---\n')
    }

    console.log('✨ All today\'s closing records deleted. Refresh the page to see auto-populated values.')

  } catch (error) {
    console.error('❌ Error:', error)
  } finally {
    await prisma.$disconnect()
  }
}

deleteTodayClosing()

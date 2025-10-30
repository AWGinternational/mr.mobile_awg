import { prisma } from '../src/lib/db'

async function createMissingPayments() {
  try {
    console.log('🔍 Checking for sales without payment records...\n')

    // Find all completed sales that don't have payment records
    const salesWithoutPayments = await prisma.sale.findMany({
      where: {
        status: 'COMPLETED',
        payments: {
          none: {}
        }
      },
      include: {
        shop: {
          select: {
            name: true
          }
        }
      },
      orderBy: {
        saleDate: 'desc'
      }
    })

    console.log(`📊 Found ${salesWithoutPayments.length} sales without payment records\n`)

    if (salesWithoutPayments.length === 0) {
      console.log('✅ All sales already have payment records!')
      return
    }

    let createdCount = 0
    let errorCount = 0

    for (const sale of salesWithoutPayments) {
      try {
        // Create payment record for this sale
        await prisma.payment.create({
          data: {
            saleId: sale.id,
            amount: sale.totalAmount,
            method: sale.paymentMethod,
            status: 'COMPLETED',
            paymentDate: sale.saleDate,
            notes: `Payment record auto-created for ${sale.invoiceNumber}`
          }
        })

        createdCount++
        console.log(`✅ Created payment for sale ${sale.invoiceNumber} (${sale.shop.name}) - ${sale.totalAmount}`)
      } catch (error) {
        errorCount++
        console.error(`❌ Failed to create payment for sale ${sale.invoiceNumber}:`, error)
      }
    }

    console.log('\n📈 Summary:')
    console.log(`  ✅ Successfully created: ${createdCount} payment records`)
    if (errorCount > 0) {
      console.log(`  ❌ Failed to create: ${errorCount} payment records`)
    }
    console.log(`  📊 Total processed: ${salesWithoutPayments.length} sales`)

  } catch (error) {
    console.error('❌ Error:', error)
  } finally {
    await prisma.$disconnect()
  }
}

createMissingPayments()

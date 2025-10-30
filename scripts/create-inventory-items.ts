import { PrismaClient } from '../src/generated/prisma/index.js'

const prisma = new PrismaClient()

async function createInventoryItems() {
  console.log('🔄 Creating inventory items for existing products...\n')

  try {
    // Get all products that don't have inventory items
    const products = await prisma.product.findMany({
      include: {
        inventoryItems: true,
        shop: true
      }
    })

    console.log(`Found ${products.length} products`)

    if (products.length === 0) {
      console.log('❌ No products found. Create products first.')
      return
    }

    for (const product of products) {
      const existingItems = product.inventoryItems.length
      const targetStock = Math.max(5, product.reorderPoint) // At least 5 or reorder point

      if (existingItems === 0) {
        console.log(`\n📦 Product: ${product.name} (${product.shop.name})`)
        console.log(`   Current inventory: ${existingItems} items`)
        console.log(`   Creating ${targetStock} inventory items...`)

        // Create inventory items
        const inventoryItems = []
        for (let i = 0; i < targetStock; i++) {
          const item = await prisma.inventoryItem.create({
            data: {
              productId: product.id,
              shopId: product.shopId,
              status: 'IN_STOCK',
              costPrice: product.costPrice,
              purchaseDate: new Date(),
              batchNumber: `BATCH-${Date.now()}-${i + 1}`,
              serialNumber: `${product.sku}-${i + 1}`,
              location: 'Main Store'
            }
          })
          inventoryItems.push(item)
        }

        console.log(`   ✅ Created ${inventoryItems.length} inventory items`)
      } else {
        console.log(`\n✅ Product: ${product.name} - Already has ${existingItems} items`)
      }
    }

    // Verify results
    const totalItems = await prisma.inventoryItem.count()
    console.log(`\n📊 Total inventory items in database: ${totalItems}`)

    console.log('\n🎉 Inventory creation completed!')
    console.log('Now products should appear in the inventory page.')

  } catch (error) {
    console.error('❌ Error creating inventory items:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

createInventoryItems()
  .then(() => {
    console.log('\n✅ Script completed successfully')
    process.exit(0)
  })
  .catch((error) => {
    console.error('❌ Script failed:', error)
    process.exit(1)
  })

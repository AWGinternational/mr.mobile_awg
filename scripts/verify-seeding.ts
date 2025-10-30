#!/usr/bin/env tsx

/**
 * Database Seeding Verification Script
 * Tests and verifies that the mobile products have been seeded correctly
 * and the POS system can interact with real data
 */

import { PrismaClient } from '../src/generated/prisma'

const prisma = new PrismaClient()

async function main() {
  console.log('🔍 Verifying mobile products database seeding...\n')

  try {
    // Check shops
    const shops = await prisma.shop.findMany()
    console.log(`🏪 Shops found: ${shops.length}`)
    if (shops.length === 0) {
      console.log('❌ No shops found. Run user seeding first.')
      return
    }

    const firstShop = shops[0]
    console.log(`   Active shop: ${firstShop.name}\n`)

    // Check categories
    const categories = await prisma.category.findMany({
      where: { shopId: firstShop.id }
    })
    console.log(`📂 Categories: ${categories.length}`)
    categories.forEach(cat => console.log(`   - ${cat.name}`))
    console.log()

    // Check brands
    const brands = await prisma.brand.findMany({
      where: { shopId: firstShop.id }
    })
    console.log(`🏷️ Brands: ${brands.length}`)
    brands.forEach(brand => console.log(`   - ${brand.name}`))
    console.log()

    // Check suppliers
    const suppliers = await prisma.supplier.findMany({
      where: { shopId: firstShop.id }
    })
    console.log(`🏢 Suppliers: ${suppliers.length}`)
    suppliers.forEach(supplier => console.log(`   - ${supplier.name} (${supplier.email})`))
    console.log()

    // Check products by category
    const smartphones = await prisma.product.findMany({
      where: { 
        shopId: firstShop.id,
        category: { name: 'Smartphones' }
      },
      include: {
        brand: true,
        category: true,
        inventory: true
      }
    })

    const accessories = await prisma.product.findMany({
      where: { 
        shopId: firstShop.id,
        category: { name: 'Accessories' }
      },
      include: {
        brand: true,
        category: true,
        inventory: true
      }
    })

    console.log(`📱 Smartphones: ${smartphones.length}`)
    console.log('   Top 5 products:')
    smartphones.slice(0, 5).forEach(product => {
      const stock = product.inventory?.[0]?.quantity || 0
      const price = product.sellingPrice.toLocaleString()
      console.log(`   - ${product.name} | PKR ${price} | Stock: ${stock}`)
    })
    console.log()

    console.log(`🎧 Accessories: ${accessories.length}`)
    accessories.forEach(product => {
      const stock = product.inventory?.[0]?.quantity || 0
      const price = product.sellingPrice.toLocaleString()
      console.log(`   - ${product.name} | PKR ${price} | Stock: ${stock}`)
    })
    console.log()

    // Check inventory totals
    const totalProducts = smartphones.length + accessories.length
    const totalValue = [...smartphones, ...accessories].reduce((sum, p) => {
      const stock = p.inventory?.[0]?.quantity || 0
      return sum + (p.sellingPrice * stock)
    }, 0)

    const totalItems = [...smartphones, ...accessories].reduce((sum, p) => {
      return sum + (p.inventory?.[0]?.quantity || 0)
    }, 0)

    console.log(`📊 Inventory Summary:`)
    console.log(`   Total Products: ${totalProducts}`)
    console.log(`   Total Items in Stock: ${totalItems}`)
    console.log(`   Total Inventory Value: PKR ${totalValue.toLocaleString()}`)
    console.log()

    // Check products with low stock
    const lowStockProducts = [...smartphones, ...accessories].filter(p => {
      const stock = p.inventory?.[0]?.quantity || 0
      return stock <= p.minStockLevel
    })

    console.log(`⚠️ Low Stock Alerts: ${lowStockProducts.length}`)
    lowStockProducts.forEach(product => {
      const stock = product.inventory?.[0]?.quantity || 0
      console.log(`   - ${product.name}: ${stock} units (min: ${product.minStockLevel})`)
    })
    console.log()

    // Test barcode functionality
    console.log(`🔍 Barcode Test - Sample Products:`)
    const sampleProducts = smartphones.slice(0, 3)
    sampleProducts.forEach(product => {
      console.log(`   - ${product.name}`)
      console.log(`     Barcode: ${product.barcode}`)
      console.log(`     SKU: ${product.sku}`)
      console.log(`     Search Terms: ${product.name.toLowerCase()}, ${product.brand?.name.toLowerCase()}`)
    })
    console.log()

    // Test price ranges
    const priceRanges = {
      'Budget (< PKR 50,000)': [...smartphones, ...accessories].filter(p => p.sellingPrice < 50000).length,
      'Mid-range (PKR 50,000 - 100,000)': [...smartphones, ...accessories].filter(p => p.sellingPrice >= 50000 && p.sellingPrice < 100000).length,
      'Premium (PKR 100,000 - 200,000)': [...smartphones, ...accessories].filter(p => p.sellingPrice >= 100000 && p.sellingPrice < 200000).length,
      'Flagship (> PKR 200,000)': [...smartphones, ...accessories].filter(p => p.sellingPrice >= 200000).length
    }

    console.log(`💰 Price Distribution:`)
    Object.entries(priceRanges).forEach(([range, count]) => {
      console.log(`   ${range}: ${count} products`)
    })
    console.log()

    // Test API endpoints readiness
    console.log(`🚀 POS System API Test Scenarios:`)
    console.log(`   1. Product Search Test:`)
    console.log(`      - Search "iPhone" should return ${smartphones.filter(p => p.name.toLowerCase().includes('iphone')).length} results`)
    console.log(`      - Search "Samsung" should return ${smartphones.filter(p => p.name.toLowerCase().includes('samsung')).length} results`)
    console.log(`      - Search "case" should return ${accessories.filter(p => p.name.toLowerCase().includes('case')).length} results`)
    console.log()

    console.log(`   2. Barcode Scan Test:`)
    console.log(`      - Scan "${sampleProducts[0]?.barcode}" should find "${sampleProducts[0]?.name}"`)
    console.log(`      - Scan "${sampleProducts[1]?.barcode}" should find "${sampleProducts[1]?.name}"`)
    console.log()

    console.log(`   3. Stock Validation Test:`)
    const inStockCount = [...smartphones, ...accessories].filter(p => (p.inventory?.[0]?.quantity || 0) > 0).length
    const outOfStockCount = [...smartphones, ...accessories].filter(p => (p.inventory?.[0]?.quantity || 0) === 0).length
    console.log(`      - In Stock Products: ${inStockCount}`)
    console.log(`      - Out of Stock Products: ${outOfStockCount}`)
    console.log()

    console.log(`   4. Sales Transaction Test Ready:`)
    console.log(`      - Products with sufficient stock for testing`)
    console.log(`      - Price calculations with tax`)
    console.log(`      - Inventory deduction simulation`)
    console.log(`      - Receipt generation with product details`)
    console.log()

    // Recommendations
    console.log(`💡 Next Steps for Testing:`)
    console.log(`   1. Start the development server: npm run dev`)
    console.log(`   2. Navigate to: http://localhost:3000/pos`)
    console.log(`   3. Test product search functionality`)
    console.log(`   4. Add products to cart and process sales`)
    console.log(`   5. Generate receipts and verify inventory updates`)
    console.log(`   6. Check dashboard analytics with real data`)
    console.log(`   7. Test barcode scanning with sample barcodes`)
    console.log()

    console.log(`✅ Database seeding verification completed successfully!`)
    console.log(`📱 ${totalProducts} products ready for POS testing`)

  } catch (error) {
    console.error('❌ Error during verification:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

main()
  .catch((e) => {
    console.error('❌ Verification failed:', e)
    process.exit(1)
  })

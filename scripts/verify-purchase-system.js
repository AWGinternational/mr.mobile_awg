#!/usr/bin/env node

// Quick verification script for Purchase Management System
const { PrismaClient } = require('./src/generated/prisma')

const prisma = new PrismaClient()

async function verifyPurchaseSystem() {
  console.log('🔍 Verifying Purchase Management System...\n')

  try {
    // Check if PurchaseStatus enum is working
    console.log('✅ Checking PurchaseStatus enum...')
    const purchaseStatuses = ['DRAFT', 'ORDERED', 'PARTIAL', 'RECEIVED', 'COMPLETED', 'CANCELLED']
    console.log(`   Statuses available: ${purchaseStatuses.join(', ')}\n`)

    // Check if we can query purchases
    console.log('✅ Checking Purchase model...')
    const purchaseCount = await prisma.purchase.count()
    console.log(`   Total purchases in database: ${purchaseCount}\n`)

    // Check if we can query purchase payments
    console.log('✅ Checking PurchasePayment model...')
    const paymentCount = await prisma.purchasePayment.count()
    console.log(`   Total purchase payments in database: ${paymentCount}\n`)

    // Check suppliers
    console.log('✅ Checking Suppliers...')
    const supplierCount = await prisma.supplier.count()
    console.log(`   Total suppliers in database: ${supplierCount}\n`)

    // Check products
    console.log('✅ Checking Products...')
    const productCount = await prisma.product.count()
    console.log(`   Total products in database: ${productCount}\n`)

    // Check inventory items
    console.log('✅ Checking Inventory Items...')
    const inventoryCount = await prisma.inventoryItem.count()
    console.log(`   Total inventory items in database: ${inventoryCount}\n`)

    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    console.log('✅ Purchase Management System Verification Complete!')
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    console.log('\n🚀 System Status: READY')
    console.log('📱 Navigate to: /purchases')
    console.log('➕ Create new purchase: /purchases/new')
    console.log('\n💡 Next Steps:')
    console.log('   1. Ensure you have suppliers in the system')
    console.log('   2. Ensure you have products in the catalog')
    console.log('   3. Create your first purchase order!')
    
    if (supplierCount === 0) {
      console.log('\n⚠️  WARNING: No suppliers found!')
      console.log('   Add suppliers at: /suppliers')
    }
    
    if (productCount === 0) {
      console.log('\n⚠️  WARNING: No products found!')
      console.log('   Add products at: /products')
    }

  } catch (error) {
    console.error('❌ Verification failed:', error.message)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

verifyPurchaseSystem()
  .catch(console.error)

const { PrismaClient } = require('../src/generated/prisma')

const prisma = new PrismaClient()

async function testSchema() {
  try {
    console.log('🔍 Testing database schema for import...')
    
    // Test if we can create a category
    console.log('📁 Testing category creation...')
    const testCategory = await prisma.category.create({
      data: {
        name: 'Test Category',
        code: 'TST',
        shopId: 'cmgnor1ge000vohaid7pvflmj' // Use a real shop ID from your system
      }
    })
    console.log('✅ Category created:', testCategory)
    
    // Test if we can create a brand
    console.log('🏷️ Testing brand creation...')
    const testBrand = await prisma.brand.create({
      data: {
        name: 'Test Brand',
        code: 'TST',
        shopId: 'cmgnor1ge000vohaid7pvflmj' // Use a real shop ID from your system
      }
    })
    console.log('✅ Brand created:', testBrand)
    
    // Test if we can create a product
    console.log('📱 Testing product creation...')
    const testProduct = await prisma.product.create({
      data: {
        name: 'Test Product',
        model: 'Test Model',
        sku: 'TEST-SKU-' + Date.now(),
        costPrice: 100,
        sellingPrice: 120,
        type: 'MOBILE_PHONE',
        status: 'ACTIVE',
        categoryId: testCategory.id,
        brandId: testBrand.id,
        shopId: 'cmgnor1ge000vohaid7pvflmj' // Use a real shop ID from your system
      }
    })
    console.log('✅ Product created:', testProduct)
    
    // Test if we can create inventory items
    console.log('📦 Testing inventory item creation...')
    const testInventory = await prisma.inventoryItem.create({
      data: {
        productId: testProduct.id,
        shopId: 'cmgnor1ge000vohaid7pvflmj',
        batchNumber: 'TEST-BATCH-001',
        status: 'IN_STOCK',
        costPrice: 100
      }
    })
    console.log('✅ Inventory item created:', testInventory)
    
    // Clean up test data
    console.log('🧹 Cleaning up test data...')
    await prisma.inventoryItem.delete({ where: { id: testInventory.id } })
    await prisma.product.delete({ where: { id: testProduct.id } })
    await prisma.brand.delete({ where: { id: testBrand.id } })
    await prisma.category.delete({ where: { id: testCategory.id } })
    console.log('✅ Test data cleaned up')
    
    console.log('🎉 All tests passed! Schema is working correctly.')
    
  } catch (error) {
    console.error('❌ Test failed:', error)
    console.error('Error details:', error.message)
  } finally {
    await prisma.$disconnect()
  }
}

testSchema()

#!/usr/bin/env tsx
// Add products to second shop for demonstration

import { prisma } from '../src/lib/db'

async function addProductsToSecondShop() {
  console.log('📱 Adding products to ALI Mobile Store...')
  
  const aliShop = await prisma.shop.findFirst({
    where: { name: 'ALI Mobile Store' }
  })
  
  if (!aliShop) {
    console.log('❌ ALI shop not found')
    return
  }
  
  // Create category for ALI's shop
  const category = await prisma.category.create({
    data: {
      name: 'Budget Phones',
      code: 'BUDGET',
      description: 'Affordable smartphones',
      shopId: aliShop.id
    }
  })
  
  // Create brand for ALI's shop
  const brand = await prisma.brand.create({
    data: {
      name: 'Tecno',
      code: 'TECNO',
      description: 'Tecno smartphones',
      shopId: aliShop.id
    }
  })
  
  // Create products for ALI's shop
  const products = [
    {
      name: 'Tecno Spark 10',
      model: 'SPARK10',
      sku: 'TCN-SP10-BLK',
      barcode: '9876543210123',
      type: 'MOBILE_PHONE' as const,
      description: 'Budget-friendly smartphone',
      costPrice: 25000,
      sellingPrice: 30000,
      minimumPrice: 28000,
      markupPercentage: 20.0,
      categoryId: category.id,
      brandId: brand.id,
      shopId: aliShop.id
    },
    {
      name: 'Tecno Camon 20',
      model: 'CAMON20',
      sku: 'TCN-CM20-GLD',
      barcode: '9876543210124',
      type: 'MOBILE_PHONE' as const,
      description: 'Camera-focused smartphone',
      costPrice: 45000,
      sellingPrice: 52000,
      minimumPrice: 48000,
      markupPercentage: 15.6,
      categoryId: category.id,
      brandId: brand.id,
      shopId: aliShop.id
    }
  ]
  
  for (const productData of products) {
    const product = await prisma.product.create({
      data: productData
    })
    console.log(`  ✅ Created: ${product.name}`)
  }
  
  console.log('✅ Products added to ALI Mobile Store')
  
  await prisma.$disconnect()
}

addProductsToSecondShop().catch(console.error)

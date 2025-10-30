/**
 * Example Seed Script - Multi-Tenant Data with shopId
 * 
 * This script demonstrates how to create data for multi-tenant models
 * with proper shopId isolation.
 */

import { PrismaClient } from '@/generated/prisma'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Seeding multi-tenant data...\n')

  // Get existing shops
  const shops = await prisma.shop.findMany({
    take: 2,
    include: { owner: true }
  })

  if (shops.length < 2) {
    console.error('❌ Need at least 2 shops in database. Run shop seed first.')
    return
  }

  const [shop1, shop2] = shops

  console.log(`📍 Shop 1: ${shop1.name} (${shop1.id})`)
  console.log(`📍 Shop 2: ${shop2.name} (${shop2.id})\n`)

  // ============================================
  // PURCHASES - Shop Isolated
  // ============================================
  console.log('💰 Creating purchases...')

  // Get suppliers for each shop
  const supplier1 = await prisma.supplier.findFirst({ 
    where: { shopId: shop1.id } 
  })
  const supplier2 = await prisma.supplier.findFirst({ 
    where: { shopId: shop2.id } 
  })

  if (supplier1) {
    // Get products from shop1
    const products1 = await prisma.product.findMany({ 
      where: { shopId: shop1.id },
      take: 3
    })

    if (products1.length > 0) {
      const purchase1 = await prisma.purchase.create({
        data: {
          shopId: shop1.id, // 🔒 Shop isolation
          supplierId: supplier1.id,
          invoiceNumber: `PUR-${shop1.code}-${Date.now()}`,
          totalAmount: 150000,
          paidAmount: 100000,
          dueAmount: 50000,
          dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
          status: 'PENDING',
          items: {
            create: products1.map((product, index) => ({
              productId: product.id,
              quantity: 10 + index * 5,
              unitCost: Number(product.costPrice),
              totalCost: Number(product.costPrice) * (10 + index * 5)
            }))
          }
        }
      })
      console.log(`  ✅ Purchase created for ${shop1.name}: ${purchase1.invoiceNumber}`)
    }
  }

  if (supplier2) {
    const products2 = await prisma.product.findMany({ 
      where: { shopId: shop2.id },
      take: 3
    })

    if (products2.length > 0) {
      const purchase2 = await prisma.purchase.create({
        data: {
          shopId: shop2.id, // 🔒 Shop isolation
          supplierId: supplier2.id,
          invoiceNumber: `PUR-${shop2.code}-${Date.now()}`,
          totalAmount: 200000,
          paidAmount: 200000,
          dueAmount: 0,
          status: 'COMPLETED',
          items: {
            create: products2.map((product, index) => ({
              productId: product.id,
              quantity: 15 + index * 3,
              unitCost: Number(product.costPrice),
              totalCost: Number(product.costPrice) * (15 + index * 3)
            }))
          }
        }
      })
      console.log(`  ✅ Purchase created for ${shop2.name}: ${purchase2.invoiceNumber}\n`)
    }
  }

  // ============================================
  // DAILY CLOSINGS - Shop Isolated
  // ============================================
  console.log('📅 Creating daily closings...')

  // Get recent sales for each shop to calculate totals
  const sales1 = await prisma.sale.findMany({
    where: {
      shopId: shop1.id,
      saleDate: {
        gte: new Date(new Date().setHours(0, 0, 0, 0))
      }
    }
  })

  const totalSales1 = sales1.reduce((sum, sale) => sum + Number(sale.totalAmount), 0)

  const closing1 = await prisma.dailyClosing.create({
    data: {
      shopId: shop1.id, // 🔒 Shop isolation
      date: new Date(new Date().setHours(0, 0, 0, 0)),
      status: 'OPEN',
      totalSales: totalSales1,
      totalCash: totalSales1 * 0.6,
      totalCard: totalSales1 * 0.3,
      totalDigital: totalSales1 * 0.1,
      openingCash: 10000,
      closingCash: 10000 + (totalSales1 * 0.6),
      expectedCash: 10000 + (totalSales1 * 0.6),
      actualCash: 10000 + (totalSales1 * 0.6) - 100, // Small variance
      variance: -100
    }
  })
  console.log(`  ✅ Daily closing created for ${shop1.name}`)

  const sales2 = await prisma.sale.findMany({
    where: {
      shopId: shop2.id,
      saleDate: {
        gte: new Date(new Date().setHours(0, 0, 0, 0))
      }
    }
  })

  const totalSales2 = sales2.reduce((sum, sale) => sum + Number(sale.totalAmount), 0)

  const closing2 = await prisma.dailyClosing.create({
    data: {
      shopId: shop2.id, // 🔒 Shop isolation
      date: new Date(new Date().setHours(0, 0, 0, 0)),
      status: 'OPEN',
      totalSales: totalSales2,
      totalCash: totalSales2 * 0.5,
      totalCard: totalSales2 * 0.4,
      totalDigital: totalSales2 * 0.1,
      openingCash: 15000,
      closingCash: 15000 + (totalSales2 * 0.5),
      expectedCash: 15000 + (totalSales2 * 0.5),
      actualCash: 15000 + (totalSales2 * 0.5),
      variance: 0
    }
  })
  console.log(`  ✅ Daily closing created for ${shop2.name}\n`)

  // ============================================
  // SALES PREDICTIONS - Shop Isolated
  // ============================================
  console.log('🔮 Creating sales predictions...')

  const products1 = await prisma.product.findMany({ 
    where: { shopId: shop1.id },
    take: 5
  })

  for (const product of products1) {
    const prediction = await prisma.salesPrediction.create({
      data: {
        shopId: shop1.id, // 🔒 Shop isolation
        productId: product.id,
        predictionDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days ahead
        predictedSales: Math.floor(Math.random() * 20) + 10,
        confidence: 0.7 + Math.random() * 0.25,
      }
    })
  }
  console.log(`  ✅ Created ${products1.length} predictions for ${shop1.name}`)

  const products2 = await prisma.product.findMany({ 
    where: { shopId: shop2.id },
    take: 5
  })

  for (const product of products2) {
    const prediction = await prisma.salesPrediction.create({
      data: {
        shopId: shop2.id, // 🔒 Shop isolation
        productId: product.id,
        predictionDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        predictedSales: Math.floor(Math.random() * 15) + 5,
        confidence: 0.75 + Math.random() * 0.2,
      }
    })
  }
  console.log(`  ✅ Created ${products2.length} predictions for ${shop2.name}\n`)

  // ============================================
  // STOCK RECOMMENDATIONS - Shop Isolated
  // ============================================
  console.log('📊 Creating stock recommendations...')

  // Get low stock products for shop1
  const lowStock1 = await prisma.product.findMany({
    where: {
      shopId: shop1.id,
      inventoryItems: {
        some: {
          status: 'IN_STOCK'
        }
      }
    },
    include: {
      inventoryItems: {
        where: { status: 'IN_STOCK' }
      }
    },
    take: 3
  })

  for (const product of lowStock1) {
    const currentStock = product.inventoryItems.length
    if (currentStock < product.lowStockThreshold) {
      const recommendation = await prisma.stockRecommendation.create({
        data: {
          shopId: shop1.id, // 🔒 Shop isolation
          productId: product.id,
          currentStock,
          recommendedQty: product.reorderPoint,
          reason: `Current stock (${currentStock}) below threshold (${product.lowStockThreshold})`,
          priority: currentStock === 0 ? 'CRITICAL' : currentStock < 5 ? 'HIGH' : 'MEDIUM',
          confidence: 0.9,
          isProcessed: false
        }
      })
    }
  }
  console.log(`  ✅ Created stock recommendations for ${shop1.name}`)

  const lowStock2 = await prisma.product.findMany({
    where: {
      shopId: shop2.id,
      inventoryItems: {
        some: {
          status: 'IN_STOCK'
        }
      }
    },
    include: {
      inventoryItems: {
        where: { status: 'IN_STOCK' }
      }
    },
    take: 3
  })

  for (const product of lowStock2) {
    const currentStock = product.inventoryItems.length
    if (currentStock < product.lowStockThreshold) {
      const recommendation = await prisma.stockRecommendation.create({
        data: {
          shopId: shop2.id, // 🔒 Shop isolation
          productId: product.id,
          currentStock,
          recommendedQty: product.reorderPoint,
          reason: `Current stock (${currentStock}) below threshold (${product.lowStockThreshold})`,
          priority: currentStock === 0 ? 'CRITICAL' : currentStock < 5 ? 'HIGH' : 'MEDIUM',
          confidence: 0.85,
          isProcessed: false
        }
      })
    }
  }
  console.log(`  ✅ Created stock recommendations for ${shop2.name}\n`)

  // ============================================
  // APPROVAL REQUESTS - Shop Isolated
  // ============================================
  console.log('✋ Creating approval requests...')

  // Get workers for each shop
  const workers1 = await prisma.shopWorker.findMany({
    where: { shopId: shop1.id, isActive: true },
    include: { user: true }
  })

  if (workers1.length > 0 && products1.length > 0) {
    const worker = workers1[0]
    const product = products1[0]

    const approval1 = await prisma.approvalRequest.create({
      data: {
        shopId: shop1.id, // 🔒 Shop isolation
        workerId: worker.userId,
        shopOwnerId: shop1.ownerId,
        type: 'PRODUCT_UPDATE',
        tableName: 'products',
        recordId: product.id,
        requestData: {
          field: 'sellingPrice',
          oldValue: Number(product.sellingPrice),
          newValue: Number(product.sellingPrice) * 1.1
        },
        reason: 'Price adjustment due to market changes',
        status: 'PENDING'
      }
    })
    console.log(`  ✅ Approval request created for ${shop1.name}`)
  }

  const workers2 = await prisma.shopWorker.findMany({
    where: { shopId: shop2.id, isActive: true },
    include: { user: true }
  })

  if (workers2.length > 0 && products2.length > 0) {
    const worker = workers2[0]
    const product = products2[0]

    const approval2 = await prisma.approvalRequest.create({
      data: {
        shopId: shop2.id, // 🔒 Shop isolation
        workerId: worker.userId,
        shopOwnerId: shop2.ownerId,
        type: 'PRODUCT_DELETE',
        tableName: 'products',
        recordId: product.id,
        requestData: {
          product: {
            id: product.id,
            name: product.name,
            sku: product.sku
          }
        },
        reason: 'Product discontinued by manufacturer',
        status: 'PENDING'
      }
    })
    console.log(`  ✅ Approval request created for ${shop2.name}\n`)
  }

  // ============================================
  // VERIFICATION - Test Shop Isolation
  // ============================================
  console.log('🔍 Verifying shop isolation...')

  const shop1Purchases = await prisma.purchase.count({ where: { shopId: shop1.id } })
  const shop2Purchases = await prisma.purchase.count({ where: { shopId: shop2.id } })
  console.log(`  Shop 1 purchases: ${shop1Purchases}`)
  console.log(`  Shop 2 purchases: ${shop2Purchases}`)

  const shop1Closings = await prisma.dailyClosing.count({ where: { shopId: shop1.id } })
  const shop2Closings = await prisma.dailyClosing.count({ where: { shopId: shop2.id } })
  console.log(`  Shop 1 closings: ${shop1Closings}`)
  console.log(`  Shop 2 closings: ${shop2Closings}`)

  const shop1Predictions = await prisma.salesPrediction.count({ where: { shopId: shop1.id } })
  const shop2Predictions = await prisma.salesPrediction.count({ where: { shopId: shop2.id } })
  console.log(`  Shop 1 predictions: ${shop1Predictions}`)
  console.log(`  Shop 2 predictions: ${shop2Predictions}`)

  const shop1Recommendations = await prisma.stockRecommendation.count({ where: { shopId: shop1.id } })
  const shop2Recommendations = await prisma.stockRecommendation.count({ where: { shopId: shop2.id } })
  console.log(`  Shop 1 recommendations: ${shop1Recommendations}`)
  console.log(`  Shop 2 recommendations: ${shop2Recommendations}`)

  const shop1Approvals = await prisma.approvalRequest.count({ where: { shopId: shop1.id } })
  const shop2Approvals = await prisma.approvalRequest.count({ where: { shopId: shop2.id } })
  console.log(`  Shop 1 approvals: ${shop1Approvals}`)
  console.log(`  Shop 2 approvals: ${shop2Approvals}`)

  console.log('\n✅ Multi-tenant data seeded successfully!')
  console.log('🔒 All data properly isolated per shop')
}

main()
  .catch((e) => {
    console.error('Error seeding data:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })


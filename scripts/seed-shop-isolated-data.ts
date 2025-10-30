#!/usr/bin/env tsx
// Shop Isolation Seeding Script - Creates shop and shop-specific data
// Uses the NEW schema with shopId fields for complete shop isolation

import { prisma } from '../src/lib/db'
import bcrypt from 'bcryptjs'

async function main() {
  console.log('🚀 Starting shop isolation seeding...')

  try {
    // Check if we have users
    let shopOwner = await prisma.user.findFirst({
      where: { role: 'SHOP_OWNER' }
    })

    if (!shopOwner) {
      console.log('👤 Creating shop owner user...')
      const hashedPassword = await bcrypt.hash('password123', 12)
      
      shopOwner = await prisma.user.create({
        data: {
          name: 'ABDUL WAHAB',
          email: 'abdul.wahab@mrmobile.pk',
          password: hashedPassword,
          phone: '+92-300-1234567',
          role: 'SHOP_OWNER',
          status: 'ACTIVE',
          businessName: 'ABDUL WAHAB Mobile Shop',
          city: 'Islamabad',
          province: 'ICT'
        }
      })
      console.log('✅ Shop owner created:', shopOwner.email)
    }

    // Check if shop exists
    let shop = await prisma.shop.findFirst({
      where: { ownerId: shopOwner.id }
    })

    if (!shop) {
      console.log('🏪 Creating shop...')
      shop = await prisma.shop.create({
        data: {
          name: 'ABDUL WAHAB 1',
          code: 'M3-ISL-001',
          address: 'Blue Area, Islamabad',
          city: 'Islamabad',
          province: 'ICT',
          postalCode: '44000',
          phone: '+92-51-1234567',
          email: 'shop1@mrmobile.pk',
          databaseUrl: process.env.DATABASE_URL || '',
          databaseName: 'main_db',
          ownerId: shopOwner.id,
          isInitialized: true,
          status: 'ACTIVE'
        }
      })
      console.log('✅ Shop created:', shop.name)
    }

    console.log(`📱 Seeding products for shop: ${shop.name} (${shop.code})`)
    console.log('🔒 Using SHOP ISOLATION with shopId fields')

    // Create Categories (WITH shopId for isolation)
    console.log('📂 Creating shop-specific categories...')
    
    const smartphoneCategory = await prisma.category.upsert({
      where: { 
        code_shopId: { 
          code: 'SMARTPHONES',
          shopId: shop.id 
        }
      },
      update: {},
      create: {
        name: 'Smartphones',
        code: 'SMARTPHONES',
        description: 'Mobile phones and smartphones',
        shopId: shop.id
      }
    })

    const accessoryCategory = await prisma.category.upsert({
      where: { 
        code_shopId: { 
          code: 'ACCESSORIES',
          shopId: shop.id 
        }
      },
      update: {},
      create: {
        name: 'Accessories',
        code: 'ACCESSORIES',
        description: 'Mobile phone accessories',
        shopId: shop.id
      }
    })

    console.log('✅ Shop-specific categories created')

    // Create Brands (WITH shopId for isolation)
    console.log('🏷️ Creating shop-specific brands...')
    
    const brandsData = [
      { name: 'Apple', code: 'APPLE', description: 'Apple iPhones and accessories' },
      { name: 'Samsung', code: 'SAMSUNG', description: 'Samsung Galaxy series' },
      { name: 'Xiaomi', code: 'XIAOMI', description: 'Xiaomi and Redmi phones' },
      { name: 'Oppo', code: 'OPPO', description: 'Oppo smartphones' },
      { name: 'Vivo', code: 'VIVO', description: 'Vivo smartphones' },
      { name: 'OnePlus', code: 'ONEPLUS', description: 'OnePlus smartphones' }
    ]

    const createdBrands = []
    for (const brandData of brandsData) {
      const brand = await prisma.brand.upsert({
        where: { 
          code_shopId: { 
            code: brandData.code,
            shopId: shop.id 
          }
        },
        update: {},
        create: {
          ...brandData,
          shopId: shop.id
        }
      })
      createdBrands.push(brand)
    }

    console.log('✅ Shop-specific brands created')

    // Create Suppliers (WITH shopId for isolation)
    console.log('🏢 Creating shop-specific suppliers...')
    
    const suppliersData = [
      {
        name: 'Mobile World Distributors',
        contactPerson: 'Ahmed Khan',
        phone: '+92-21-34567890',
        email: 'ahmed@mobileworld.pk',
        address: 'Hall Road, Lahore',
        city: 'Lahore',
        province: 'Punjab',
        shopId: shop.id
      },
      {
        name: 'Tech Solutions Karachi',
        contactPerson: 'Ali Hassan',
        phone: '+92-21-98765432',
        email: 'ali@techsolutions.pk',
        address: 'Saddar, Karachi',
        city: 'Karachi',
        province: 'Sindh',
        shopId: shop.id
      }
    ]

    const createdSuppliers = []
    for (const supplierData of suppliersData) {
      const supplier = await prisma.supplier.create({
        data: supplierData
      })
      createdSuppliers.push(supplier)
    }

    console.log('✅ Shop-specific suppliers created')

    // Create Products (WITH shopId for isolation)
    console.log('📱 Creating shop-specific products...')
    
    const appleBrand = createdBrands.find(b => b.code === 'APPLE')!
    const samsungBrand = createdBrands.find(b => b.code === 'SAMSUNG')!
    const xiaomiBrand = createdBrands.find(b => b.code === 'XIAOMI')!

    const productsData = [
      {
        name: 'iPhone 14 Pro',
        model: 'A2894',
        sku: 'IP14P-128-BLK',
        barcode: '1234567890123',
        type: 'MOBILE_PHONE' as const,
        description: 'Latest iPhone with Pro camera system',
        costPrice: 180000,
        sellingPrice: 220000,
        minimumPrice: 200000,
        markupPercentage: 22.22,
        categoryId: smartphoneCategory.id,
        brandId: appleBrand.id,
        shopId: shop.id,
        lowStockThreshold: 2,
        reorderPoint: 5
      },
      {
        name: 'Samsung Galaxy S23',
        model: 'SM-S911B',
        sku: 'SGS23-256-WHT',
        barcode: '1234567890124',
        type: 'MOBILE_PHONE' as const,
        description: 'Samsung flagship with advanced camera',
        costPrice: 120000,
        sellingPrice: 145000,
        minimumPrice: 135000,
        markupPercentage: 20.83,
        categoryId: smartphoneCategory.id,
        brandId: samsungBrand.id,
        shopId: shop.id,
        lowStockThreshold: 3,
        reorderPoint: 6
      },
      {
        name: 'Xiaomi Redmi Note 12',
        model: 'RN12-4G',
        sku: 'XRN12-128-BLU',
        barcode: '1234567890125',
        type: 'MOBILE_PHONE' as const,
        description: 'Budget-friendly smartphone with great features',
        costPrice: 35000,
        sellingPrice: 42000,
        minimumPrice: 38000,
        markupPercentage: 20.00,
        categoryId: smartphoneCategory.id,
        brandId: xiaomiBrand.id,
        shopId: shop.id,
        lowStockThreshold: 5,
        reorderPoint: 10
      }
    ]

    const createdProducts = []
    for (const productData of productsData) {
      const product = await prisma.product.create({
        data: productData
      })
      createdProducts.push(product)
      console.log(`  ✓ Created: ${product.name} (${product.sku})`)
    }

    console.log('✅ Shop-specific products created')

    // Create Inventory Items (WITH shopId for isolation)
    console.log('📦 Creating shop-specific inventory...')
    
    let inventoryCount = 0
    for (const product of createdProducts) {
      // Create 3-5 inventory items per product
      const itemCount = Math.floor(Math.random() * 3) + 3
      
      for (let i = 0; i < itemCount; i++) {
        const imei = `${Date.now()}${inventoryCount.toString().padStart(6, '0')}`
        
        await prisma.inventoryItem.create({
          data: {
            productId: product.id,
            imei: imei,
            serialNumber: `SN${imei}`,
            status: 'IN_STOCK' as const,
            costPrice: product.costPrice,
            purchaseDate: new Date(),
            supplierId: createdSuppliers[0].id,
            shopId: shop.id
          }
        })
        inventoryCount++
      }
    }

    console.log(`✅ Created ${inventoryCount} inventory items`)

    // Create a sample customer (WITH shopId for isolation)
    console.log('👤 Creating sample customer...')
    
    const customer = await prisma.customer.create({
      data: {
        name: 'Muhammad Ahmad',
        phone: '+92-300-9876543',
        email: 'ahmad@example.com',
        address: 'F-8 Sector, Islamabad',
        city: 'Islamabad',
        cnic: '61101-1234567-1',
        creditLimit: 50000,
        shopId: shop.id
      }
    })

    console.log('✅ Sample customer created')

    // Summary
    const totalProducts = await prisma.product.count({
      where: { shopId: shop.id }
    })
    
    const totalInventory = await prisma.inventoryItem.count({
      where: { shopId: shop.id }
    })

    console.log(`
🎉 Shop isolation seeding completed successfully!

📊 Shop Summary for "${shop.name}" (${shop.code}):
---------------------------------------------------
🏷️ Categories: 2 (shop-specific)
🏪 Brands: ${createdBrands.length} (shop-specific)
🏢 Suppliers: ${createdSuppliers.length} (shop-specific)
📱 Products: ${totalProducts} (shop-specific)
📦 Inventory Items: ${totalInventory} (shop-specific)
👤 Customers: 1 (shop-specific)

🔐 Login Details:
📧 Email: ${shopOwner.email}
🔑 Password: password123
🌐 URL: http://localhost:3004/login

✅ All data is SHOP ISOLATED with shopId: ${shop.id}
⚠️  Note: This shop's data is completely isolated from other shops.
    `)

  } catch (error) {
    console.error('❌ Error in shop isolation seeding:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

// Run if called directly
if (require.main === module) {
  main()
    .then(() => {
      console.log('✅ Shop isolation seeding completed')
      process.exit(0)
    })
    .catch((error) => {
      console.error('❌ Shop isolation seeding failed:', error)
      process.exit(1)
    })
}

export { main as seedShopIsolatedData }

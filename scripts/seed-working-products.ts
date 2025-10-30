#!/usr/bin/env tsx
// WORKING Mobile Products Seeding Script
// Uses the current database structure WITHOUT shopId fields
// This is the SIMPLE approach that actually works

import { prisma } from '../src/lib/db'

async function main() {
  console.log('🚀 Starting WORKING mobile products seeding...')

  try {
    // First, check if we have any shops
    const shops = await prisma.shop.findMany()
    
    if (shops.length === 0) {
      console.log('❌ No shops found. Please create a shop first.')
      return
    }

    const firstShop = shops[0]
    console.log(`📱 Seeding products for shop: ${firstShop.name} (${firstShop.code})`)
    console.log('💡 Using SINGLE DATABASE approach (no shopId fields)')

    // Create Categories (NO shopId - shared across all shops)
    console.log('📂 Creating product categories...')
    
    const smartphoneCategory = await prisma.category.upsert({
      where: { code: 'SMARTPHONES' },
      update: {},
      create: {
        name: 'Smartphones',
        code: 'SMARTPHONES',
        description: 'Mobile phones and smartphones'
      }
    })

    const accessoryCategory = await prisma.category.upsert({
      where: { code: 'ACCESSORIES' },
      update: {},
      create: {
        name: 'Accessories',
        code: 'ACCESSORIES',
        description: 'Mobile phone accessories'
      }
    })

    console.log('✅ Categories created')

    // Create Brands (NO shopId - shared across all shops)
    console.log('🏷️ Creating brands...')
    
    const brands = [
      { name: 'Apple', code: 'APPLE', description: 'Apple iPhones and accessories' },
      { name: 'Samsung', code: 'SAMSUNG', description: 'Samsung Galaxy series' },
      { name: 'Xiaomi', code: 'XIAOMI', description: 'Xiaomi and Redmi phones' },
      { name: 'Oppo', code: 'OPPO', description: 'Oppo smartphones' },
      { name: 'Vivo', code: 'VIVO', description: 'Vivo smartphones' },
      { name: 'OnePlus', code: 'ONEPLUS', description: 'OnePlus smartphones' }
    ]

    const createdBrands = []
    for (const brandData of brands) {
      const brand = await prisma.brand.upsert({
        where: { code: brandData.code },
        update: {},
        create: brandData
      })
      createdBrands.push(brand)
    }

    console.log('✅ Brands created')

    // Create Suppliers (Check schema first)
    console.log('🏢 Creating suppliers...')
    
    const suppliers = [
      {
        name: 'Mobile World Distributors',
        contactPerson: 'Ahmed Khan',
        phone: '+92-21-34567890',
        email: 'ahmed@mobileworld.pk',
        address: 'Hall Road, Lahore',
        city: 'Lahore',
        province: 'Punjab'
      },
      {
        name: 'Tech Solutions Karachi',
        contactPerson: 'Ali Hassan',
        phone: '+92-21-98765432',
        email: 'ali@techsolutions.pk',
        address: 'Saddar, Karachi',
        city: 'Karachi',
        province: 'Sindh'
      }
    ]

    const createdSuppliers = []
    for (const supplierData of suppliers) {
      const supplier = await prisma.supplier.create({
        data: supplierData
      })
      createdSuppliers.push(supplier)
    }

    console.log('✅ Suppliers created')

    // Create Products (using actual schema fields)
    console.log('📱 Creating mobile phone products...')

    const products = [
      // iPhones
      {
        name: 'iPhone 15 Pro Max',
        model: 'iPhone 15 Pro Max 256GB',
        sku: 'IPH15PM256',
        barcode: '190199712345',
        type: 'MOBILE_PHONE' as const,
        brandId: createdBrands.find(b => b.code === 'APPLE')!.id,
        categoryId: smartphoneCategory.id,
        costPrice: 385000, // PKR
        sellingPrice: 420000,
        specifications: {
          storage: '256GB',
          color: 'Natural Titanium',
          display: '6.7" Super Retina XDR',
          camera: '48MP Main + 12MP Ultra Wide + 12MP Telephoto',
          battery: '4441mAh',
          os: 'iOS 17'
        },
        warranty: 12, // months
        status: 'ACTIVE'
      },
      {
        name: 'iPhone 14',
        model: 'iPhone 14 128GB',
        sku: 'IPH14128',
        barcode: '190199698765',
        type: 'MOBILE_PHONE',
        brandId: createdBrands.find(b => b.code === 'APPLE')!.id,
        categoryId: smartphoneCategory.id,
        costPrice: 185000,
        sellingPrice: 210000,
        specifications: {
          storage: '128GB',
          color: 'Blue',
          display: '6.1" Super Retina XDR',
          camera: '12MP Dual Camera',
          battery: '3279mAh',
          os: 'iOS 16'
        },
        warranty: 12,
        status: 'ACTIVE'
      },
      
      // Samsung Galaxy
      {
        name: 'Samsung Galaxy S24 Ultra',
        model: 'Galaxy S24 Ultra 512GB',
        sku: 'SGS24U512',
        barcode: '887276543210',
        type: 'MOBILE_PHONE',
        brandId: createdBrands.find(b => b.code === 'SAMSUNG')!.id,
        categoryId: smartphoneCategory.id,
        costPrice: 285000,
        sellingPrice: 320000,
        specifications: {
          storage: '512GB',
          color: 'Titanium Gray',
          display: '6.8" Dynamic AMOLED 2X',
          camera: '200MP + 50MP + 12MP + 10MP',
          battery: '5000mAh',
          os: 'Android 14'
        },
        warranty: 12,
        status: 'ACTIVE'
      },

      // Xiaomi
      {
        name: 'Xiaomi 14',
        model: 'Xiaomi 14 256GB',
        sku: 'XMI14256',
        barcode: '695412345678',
        type: 'MOBILE_PHONE',
        brandId: createdBrands.find(b => b.code === 'XIAOMI')!.id,
        categoryId: smartphoneCategory.id,
        costPrice: 85000,
        sellingPrice: 105000,
        specifications: {
          storage: '256GB',
          color: 'Black',
          display: '6.36" AMOLED',
          camera: '50MP Triple Camera',
          battery: '4610mAh',
          os: 'MIUI 15'
        },
        warranty: 12,
        status: 'ACTIVE'
      },

      // Accessories
      {
        name: 'iPhone 15 Pro Max Case',
        model: 'Silicone Case',
        sku: 'CASE15PM',
        barcode: '123456789012',
        type: 'ACCESSORY',
        brandId: createdBrands.find(b => b.code === 'APPLE')!.id,
        categoryId: accessoryCategory.id,
        costPrice: 2500,
        sellingPrice: 4000,
        specifications: {
          material: 'Silicone',
          color: 'Clear',
          compatibility: 'iPhone 15 Pro Max'
        },
        warranty: 3,
        status: 'ACTIVE'
      },

      {
        name: 'Samsung Fast Charger 25W',
        model: '25W USB-C Charger',
        sku: 'SAMFC25W',
        barcode: '987654321098',
        type: 'ACCESSORY',
        brandId: createdBrands.find(b => b.code === 'SAMSUNG')!.id,
        categoryId: accessoryCategory.id,
        costPrice: 3500,
        sellingPrice: 5500,
        specifications: {
          power: '25W',
          connector: 'USB-C',
          compatibility: 'Samsung Galaxy series'
        },
        warranty: 6,
        status: 'ACTIVE'
      }
    ]

    const createdProducts = []
    for (const productData of products) {
      const product = await prisma.product.create({
        data: productData
      })
      createdProducts.push(product)
    }

    console.log('✅ Products created')

    // Create Inventory Items for each product
    console.log('📦 Creating inventory items...')
    
    for (const product of createdProducts) {
      // Create 5-15 inventory items for each product
      const quantity = Math.floor(Math.random() * 11) + 5 // 5 to 15 items
      
      for (let i = 0; i < quantity; i++) {
        const inventoryData = {
          productId: product.id,
          supplierId: createdSuppliers[Math.floor(Math.random() * createdSuppliers.length)].id,
          costPrice: product.costPrice,
          status: 'IN_STOCK',
          location: `Shelf-${Math.floor(Math.random() * 10) + 1}`,
          purchaseDate: new Date(),
          ...(product.type === 'MOBILE_PHONE' 
            ? { imei: `${Date.now()}${i.toString().padStart(3, '0')}` } 
            : { serialNumber: `SN${Date.now()}${i.toString().padStart(3, '0')}` }
          )
        }

        await prisma.inventoryItem.create({
          data: inventoryData
        })
      }
    }

    console.log('✅ Inventory items created')

    // Summary
    const totalProducts = await prisma.product.count()
    const totalInventory = await prisma.inventoryItem.count()
    const totalCategories = await prisma.category.count()
    const totalBrands = await prisma.brand.count()
    const totalSuppliers = await prisma.supplier.count()

    console.log('\n🎉 Database seeding completed successfully!')
    console.log('═══════════════════════════════════════')
    console.log(`📱 Shop: ${firstShop.name}`)
    console.log(`📂 Categories: ${totalCategories}`)
    console.log(`🏷️  Brands: ${totalBrands}`)
    console.log(`🏢 Suppliers: ${totalSuppliers}`)
    console.log(`📦 Products: ${totalProducts}`)
    console.log(`📋 Inventory Items: ${totalInventory}`)
    console.log('═══════════════════════════════════════')
    console.log('✅ Ready for POS system testing!')
    console.log('💡 Note: Using single database approach - products are shared across shops')

  } catch (error) {
    console.error('❌ Seeding failed:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

main().catch((error) => {
  console.error('❌ Seeding script failed:', error)
  process.exit(1)
})

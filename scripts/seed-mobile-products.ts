#!/usr/bin/env tsx

/**
 * Mobile Shop Product Database Seeding Script
 * Seeds the database with realistic mobile phone products for testing
 * POS system, inventory management, and sales analytics
 */

import { PrismaClient } from '../src/generated/prisma'
import { getShopPrisma } from '../src/lib/db'

// Master database connection for shop registry
const masterDB = new PrismaClient()

async function main() {
  console.log('🚀 Starting mobile products database seeding...')

  try {
    // First, let's check if we have any shops in master database
    const shops = await masterDB.shop.findMany()
    
    if (shops.length === 0) {
      console.log('❌ No shops found in master database. Please create a shop first.')
      return
    }

    const firstShop = shops[0]
    console.log(`📱 Seeding products for shop: ${firstShop.name}`)
    console.log(`🔌 Using shop database: ${firstShop.databaseName}`)

    // Get shop-specific database connection
    const shopDB = getShopPrisma(firstShop.id)

    // Create Categories
    console.log('📂 Creating product categories...')
    
    const smartphoneCategory = await shopDB.category.upsert({
      where: { code: 'SMARTPHONES' },
      update: {},
      create: {
        name: 'Smartphones',
        code: 'SMARTPHONES',
        description: 'Mobile phones and smartphones'
      }
    })

    const accessoryCategory = await shopDB.category.upsert({
      where: { code: 'ACCESSORIES' },
      update: {},
      create: {
        name: 'Accessories', 
        code: 'ACCESSORIES',
        description: 'Mobile phone accessories'
      }
    })

    // Create Brands
    console.log('🏷️ Creating brands...')
    
    const brands = [
      { name: 'Apple', code: 'APPLE', description: 'Apple Inc. - iPhone manufacturer' },
      { name: 'Samsung', code: 'SAMSUNG', description: 'Samsung Electronics - Galaxy series' },
      { name: 'Xiaomi', code: 'XIAOMI', description: 'Xiaomi Corporation - Mi & Redmi series' },
      { name: 'Oppo', code: 'OPPO', description: 'Oppo Electronics - Find & A series' },
      { name: 'Vivo', code: 'VIVO', description: 'Vivo Mobile - V & Y series' },
      { name: 'OnePlus', code: 'ONEPLUS', description: 'OnePlus Technology - Flagship killers' },
      { name: 'Realme', code: 'REALME', description: 'Realme - Value for money smartphones' },
      { name: 'Infinix', code: 'INFINIX', description: 'Infinix Mobility - Budget smartphones' },
      { name: 'Tecno', code: 'TECNO', description: 'Tecno Mobile - Affordable smartphones' },
      { name: 'Huawei', code: 'HUAWEI', description: 'Huawei Technologies - P & Mate series' }
    ]

    const createdBrands = []
    for (const brandData of brands) {
      const brand = await shopDB.brand.upsert({
        where: { code: brandData.code },
        update: {},
        create: brandData
      })
      createdBrands.push(brand)
    }

    // Create Suppliers
    console.log('🏢 Creating suppliers...')
    
    const suppliers = [
      {
        name: 'Mobile World Distributors',
        email: 'orders@mobileworld.pk',
        phone: '+92-300-1234567',
        address: 'Hall Road, Lahore',
        city: 'Lahore',
        province: 'Punjab',
        contactPerson: 'Ahmad Ali',
        creditTerms: 30,
        status: 'ACTIVE'
      },
      {
        name: 'Tech Solutions Ltd',
        email: 'sales@techsolutions.pk', 
        phone: '+92-321-9876543',
        address: 'Saddar, Karachi',
        city: 'Karachi',
        province: 'Sindh',
        contactPerson: 'Fatima Khan',
        creditTerms: 45,
        status: 'ACTIVE'
      },
      {
        name: 'Digital Hub Suppliers',
        email: 'info@digitalhub.pk',
        phone: '+92-333-5555555',
        address: 'Blue Area, Islamabad',
        city: 'Islamabad',
        province: 'ICT',
        contactPerson: 'Hassan Sheikh',
        creditTerms: 60,
        status: 'ACTIVE'
      }
    ]

    const createdSuppliers = []
    for (const supplierData of suppliers) {
      const supplier = await shopDB.supplier.create({
        data: supplierData
      })
      createdSuppliers.push(supplier)
    }

    // Mobile Products Data
    console.log('📱 Creating mobile phone products...')
    
    const mobileProducts = [
      // Apple iPhones
      {
        name: 'iPhone 15 Pro Max',
        sku: 'APPLE-IP15PM-256-BLUE',
        barcode: '194253479789',
        model: 'A3108',
        brandName: 'Apple',
        categoryName: 'Smartphones',
        costPrice: 350000,
        sellingPrice: 385000,
        stockQuantity: 8,
        minStockLevel: 2,
        specifications: {
          storage: '256GB',
          color: 'Blue Titanium',
          display: '6.7" Super Retina XDR',
          processor: 'A17 Pro Bionic',
          camera: '48MP Triple Camera',
          battery: '4441mAh',
          os: 'iOS 17'
        }
      },
      {
        name: 'iPhone 15 Pro',
        sku: 'APPLE-IP15P-128-BLACK',
        barcode: '194253479123',
        model: 'A3104',
        brandName: 'Apple',
        categoryName: 'Smartphones',
        costPrice: 300000,
        sellingPrice: 335000,
        stockQuantity: 6,
        minStockLevel: 2,
        specifications: {
          storage: '128GB',
          color: 'Black Titanium',
          display: '6.1" Super Retina XDR',
          processor: 'A17 Pro Bionic',
          camera: '48MP Triple Camera',
          battery: '3274mAh',
          os: 'iOS 17'
        }
      },
      {
        name: 'iPhone 14',
        sku: 'APPLE-IP14-128-PURPLE',
        barcode: '194253001234',
        model: 'A2882',
        brandName: 'Apple',
        categoryName: 'Smartphones',
        costPrice: 210000,
        sellingPrice: 245000,
        stockQuantity: 12,
        minStockLevel: 3,
        specifications: {
          storage: '128GB',
          color: 'Purple',
          display: '6.1" Super Retina XDR',
          processor: 'A15 Bionic',
          camera: '12MP Dual Camera',
          battery: '3279mAh',
          os: 'iOS 16'
        }
      },

      // Samsung Galaxy
      {
        name: 'Samsung Galaxy S24 Ultra',
        sku: 'SAMSUNG-GS24U-256-BLACK',
        barcode: '194253479456',
        model: 'SM-S928B',
        brandName: 'Samsung',
        categoryName: 'Smartphones',
        costPrice: 280000,
        sellingPrice: 315000,
        stockQuantity: 10,
        minStockLevel: 2,
        specifications: {
          storage: '256GB',
          color: 'Titanium Black',
          display: '6.8" Dynamic AMOLED 2X',
          processor: 'Snapdragon 8 Gen 3',
          camera: '200MP Quad Camera',
          battery: '5000mAh',
          os: 'Android 14'
        }
      },
      {
        name: 'Samsung Galaxy S24',
        sku: 'SAMSUNG-GS24-128-VIOLET',
        barcode: '194253479789',
        model: 'SM-S921B',
        brandName: 'Samsung',
        categoryName: 'Smartphones',
        costPrice: 200000,
        sellingPrice: 235000,
        stockQuantity: 15,
        minStockLevel: 3,
        specifications: {
          storage: '128GB',
          color: 'Cobalt Violet',
          display: '6.2" Dynamic AMOLED 2X',
          processor: 'Exynos 2400',
          camera: '50MP Triple Camera',
          battery: '4000mAh',
          os: 'Android 14'
        }
      },
      {
        name: 'Samsung Galaxy A54',
        sku: 'SAMSUNG-GA54-128-WHITE',
        barcode: '194253479012',
        model: 'SM-A546B',
        brandName: 'Samsung',
        categoryName: 'Smartphones',
        costPrice: 65000,
        sellingPrice: 75000,
        stockQuantity: 25,
        minStockLevel: 5,
        specifications: {
          storage: '128GB',
          color: 'Awesome White',
          display: '6.4" Super AMOLED',
          processor: 'Exynos 1380',
          camera: '50MP Triple Camera',
          battery: '5000mAh',
          os: 'Android 13'
        }
      },

      // Xiaomi
      {
        name: 'Xiaomi 14 Pro',
        sku: 'XIAOMI-14P-256-BLACK',
        barcode: '194253479345',
        model: '2312DRA50G',
        brandName: 'Xiaomi',
        categoryName: 'Smartphones',
        costPrice: 105000,
        sellingPrice: 125000,
        stockQuantity: 18,
        minStockLevel: 4,
        specifications: {
          storage: '256GB',
          color: 'Black',
          display: '6.73" LTPO OLED',
          processor: 'Snapdragon 8 Gen 3',
          camera: '50MP Triple Camera',
          battery: '4880mAh',
          os: 'Android 14'
        }
      },
      {
        name: 'Redmi Note 13 Pro',
        sku: 'XIAOMI-RN13P-128-BLUE',
        barcode: '194253479678',
        model: '23124RN87G',
        brandName: 'Xiaomi',
        categoryName: 'Smartphones',
        costPrice: 45000,
        sellingPrice: 52000,
        stockQuantity: 30,
        minStockLevel: 8,
        specifications: {
          storage: '128GB',
          color: 'Ocean Blue',
          display: '6.67" AMOLED',
          processor: 'MediaTek Helio G99',
          camera: '200MP Triple Camera',
          battery: '5100mAh',
          os: 'Android 13'
        }
      },

      // Oppo
      {
        name: 'Oppo Find X7 Pro',
        sku: 'OPPO-FX7P-256-GOLD',
        barcode: '194253479901',
        model: 'CPH2515',
        brandName: 'Oppo',
        categoryName: 'Smartphones',
        costPrice: 85000,
        sellingPrice: 98000,
        stockQuantity: 12,
        minStockLevel: 3,
        specifications: {
          storage: '256GB',
          color: 'Desert Gold',
          display: '6.82" LTPO AMOLED',
          processor: 'Snapdragon 8 Gen 3',
          camera: '50MP Triple Camera',
          battery: '5400mAh',
          os: 'Android 14'
        }
      },
      {
        name: 'Oppo A78 5G',
        sku: 'OPPO-A78-128-PURPLE',
        barcode: '194253479234',
        model: 'CPH2565',
        brandName: 'Oppo',
        categoryName: 'Smartphones',
        costPrice: 35000,
        sellingPrice: 42000,
        stockQuantity: 22,
        minStockLevel: 6,
        specifications: {
          storage: '128GB',
          color: 'Glowing Purple',
          display: '6.56" IPS LCD',
          processor: 'MediaTek Dimensity 700',
          camera: '50MP Dual Camera',
          battery: '5000mAh',
          os: 'Android 13'
        }
      },

      // Vivo
      {
        name: 'Vivo V30 Pro',
        sku: 'VIVO-V30P-256-BLACK',
        barcode: '194253479567',
        model: 'V2329',
        brandName: 'Vivo',
        categoryName: 'Smartphones',
        costPrice: 75000,
        sellingPrice: 87000,
        stockQuantity: 14,
        minStockLevel: 3,
        specifications: {
          storage: '256GB',
          color: 'Andaman Blue',
          display: '6.78" AMOLED',
          processor: 'MediaTek Dimensity 8050',
          camera: '50MP Triple Camera',
          battery: '5000mAh',
          os: 'Android 14'
        }
      },

      // OnePlus
      {
        name: 'OnePlus 12',
        sku: 'ONEPLUS-12-256-GREEN',
        barcode: '194253479890',
        model: 'CPH2573',
        brandName: 'OnePlus',
        categoryName: 'Smartphones',
        costPrice: 95000,
        sellingPrice: 110000,
        stockQuantity: 9,
        minStockLevel: 2,
        specifications: {
          storage: '256GB',
          color: 'Flowy Emerald',
          display: '6.82" LTPO AMOLED',
          processor: 'Snapdragon 8 Gen 3',
          camera: '50MP Triple Camera',
          battery: '5400mAh',
          os: 'Android 14'
        }
      },

      // Realme
      {
        name: 'Realme GT 5 Pro',
        sku: 'REALME-GT5P-256-SILVER',
        barcode: '194253479123',
        model: 'RMX3851',
        brandName: 'Realme',
        categoryName: 'Smartphones',
        costPrice: 65000,
        sellingPrice: 76000,
        stockQuantity: 16,
        minStockLevel: 4,
        specifications: {
          storage: '256GB',
          color: 'Moon White Silver',
          display: '6.78" AMOLED',
          processor: 'Snapdragon 8 Gen 2',
          camera: '50MP Triple Camera',
          battery: '5240mAh',
          os: 'Android 14'
        }
      },

      // Budget phones
      {
        name: 'Infinix Hot 40 Pro',
        sku: 'INFINIX-H40P-128-BLACK',
        barcode: '194253479456',
        model: 'X6871',
        brandName: 'Infinix',
        categoryName: 'Smartphones',
        costPrice: 25000,
        sellingPrice: 30000,
        stockQuantity: 35,
        minStockLevel: 10,
        specifications: {
          storage: '128GB',
          color: 'Starlit Black',
          display: '6.78" IPS LCD',
          processor: 'MediaTek Helio G88',
          camera: '108MP Dual Camera',
          battery: '5000mAh',
          os: 'Android 13'
        }
      },
      {
        name: 'Tecno Spark 20 Pro',
        sku: 'TECNO-S20P-128-BLUE',
        barcode: '194253479789',
        model: 'KJ7',
        brandName: 'Tecno',
        categoryName: 'Smartphones',
        costPrice: 22000,
        sellingPrice: 27000,
        stockQuantity: 40,
        minStockLevel: 12,
        specifications: {
          storage: '128GB',
          color: 'Glossy Blue',
          display: '6.78" IPS LCD',
          processor: 'MediaTek Helio G85',
          camera: '48MP Dual Camera',
          battery: '5000mAh',
          os: 'Android 14'
        }
      }
    ]

    // Create products
    for (const productData of mobileProducts) {
      const { brandName, categoryName, specifications, ...productInfo } = productData
      
      const brand = createdBrands.find(b => b.name === brandName)
      const category = smartphoneCategory
      const supplier = createdSuppliers[Math.floor(Math.random() * createdSuppliers.length)]

      try {
        const product = await prisma.product.create({
          data: {
            name: productInfo.name,
            model: productInfo.model,
            sku: productInfo.sku,
            barcode: productInfo.barcode,
            type: 'SMARTPHONE', // ProductType enum value
            status: 'ACTIVE',
            costPrice: productInfo.costPrice,
            sellingPrice: productInfo.sellingPrice,
            specifications: specifications as any,
            warranty: 12, // 12 months warranty
            categoryId: category.id,
            brandId: brand?.id || createdBrands[0].id,
            lowStockThreshold: productData.minStockLevel,
            reorderPoint: productData.minStockLevel + 5
          }
        })

        // Create inventory records for stock quantity
        for (let i = 0; i < productData.stockQuantity; i++) {
          await prisma.inventoryItem.create({
            data: {
              productId: product.id,
              costPrice: productData.costPrice,
              purchaseDate: new Date(),
              status: 'IN_STOCK',
              location: 'MAIN-STORE',
              supplierId: supplier.id,
              // Add IMEI for smartphones (simulate realistic IMEI numbers)
              imei: productData.categoryName === 'Smartphones' ? 
                `86${Math.floor(Math.random() * 900000000000000) + 100000000000000}` : 
                undefined
            }
          })
        }

        console.log(`✅ Created product: ${product.name} (Stock: ${productData.stockQuantity})`)
      } catch (error) {
        console.error(`❌ Error creating product ${productData.name}:`, error)
      }
    }

    // Create some accessories
    console.log('🎧 Creating accessories...')
    
    const accessories = [
      {
        name: 'iPhone 15 Pro Max Case - Clear',
        sku: 'ACC-IP15PM-CASE-CLR',
        barcode: '194253480001',
        categoryName: 'Accessories',
        costPrice: 2500,
        sellingPrice: 3500,
        stockQuantity: 50,
        minStockLevel: 15
      },
      {
        name: 'Samsung Galaxy S24 Ultra Screen Protector',
        sku: 'ACC-GS24U-SCREEN-PROT',
        barcode: '194253480002',
        categoryName: 'Accessories',
        costPrice: 800,
        sellingPrice: 1200,
        stockQuantity: 100,
        minStockLevel: 25
      },
      {
        name: 'Universal Fast Charger 65W',
        sku: 'ACC-CHARGER-65W-UNIV',
        barcode: '194253480003',
        categoryName: 'Accessories',
        costPrice: 3000,
        sellingPrice: 4500,
        stockQuantity: 30,
        minStockLevel: 8
      },
      {
        name: 'Wireless Bluetooth Earbuds',
        sku: 'ACC-EARBUDS-BT-WHT',
        barcode: '194253480004',
        categoryName: 'Accessories',
        costPrice: 5000,
        sellingPrice: 7500,
        stockQuantity: 25,
        minStockLevel: 6
      },
      {
        name: 'Power Bank 20000mAh',
        sku: 'ACC-PWRBNK-20K-BLK',
        barcode: '194253480005',
        categoryName: 'Accessories',
        costPrice: 4000,
        sellingPrice: 6000,
        stockQuantity: 20,
        minStockLevel: 5
      }
    ]

    for (const accessoryData of accessories) {
      const { categoryName, ...accessoryInfo } = accessoryData
      const supplier = createdSuppliers[Math.floor(Math.random() * createdSuppliers.length)]

      try {
        const product = await prisma.product.create({
          data: {
            name: accessoryInfo.name,
            model: 'ACC-MODEL', // Generic model for accessories
            sku: accessoryInfo.sku,
            barcode: accessoryInfo.barcode,
            type: 'ACCESSORY', // ProductType enum value
            status: 'ACTIVE',
            costPrice: accessoryInfo.costPrice,
            sellingPrice: accessoryInfo.sellingPrice,
            specifications: {},
            warranty: 6, // 6 months warranty for accessories
            categoryId: accessoryCategory.id,
            brandId: createdBrands[0].id, // Use first brand as default
            lowStockThreshold: accessoryData.minStockLevel,
            reorderPoint: accessoryData.minStockLevel + 5
          }
        })

        // Create inventory records for stock quantity
        for (let i = 0; i < accessoryData.stockQuantity; i++) {
          await prisma.inventoryItem.create({
            data: {
              productId: product.id,
              costPrice: accessoryData.costPrice,
              purchaseDate: new Date(),
              status: 'IN_STOCK',
              location: 'ACCESSORY-SECTION',
              supplierId: supplier.id,
              // Add serial numbers for accessories
              serialNumber: `${accessoryData.sku}-${String(i + 1).padStart(4, '0')}`
            }
          })
        }

        console.log(`✅ Created accessory: ${product.name} (Stock: ${accessoryData.stockQuantity})`)
      } catch (error) {
        console.error(`❌ Error creating accessory ${accessoryData.name}:`, error)
      }
    }

    console.log('\n🎉 Database seeding completed successfully!')
    console.log('\n📊 Summary:')
    
    const totalProducts = await prisma.product.count({
      where: { shopId: firstShop.id }
    })
    
    const totalInventoryValue = await prisma.product.aggregate({
      where: { shopId: firstShop.id },
      _sum: {
        sellingPrice: true
      }
    })

    console.log(`   📱 Total Products: ${totalProducts}`)
    console.log(`   💰 Total Inventory Value: PKR ${totalInventoryValue._sum.sellingPrice?.toLocaleString() || 0}`)
    console.log(`   🏪 Shop: ${firstShop.name}`)
    console.log(`   📂 Categories: ${smartphoneCategory.name}, ${accessoryCategory.name}`)
    console.log(`   🏷️ Brands: ${createdBrands.length}`)
    console.log(`   🏢 Suppliers: ${createdSuppliers.length}`)
    
    console.log('\n🚀 Ready for testing:')
    console.log('   1. POS System - Search and add products to cart')
    console.log('   2. Inventory Management - View stock levels')
    console.log('   3. Sales Analytics - Make sales and view reports')
    console.log('   4. Low Stock Alerts - Products with minimum stock levels')
    console.log('   5. Barcode Scanning - Products have barcodes for testing')

  } catch (error) {
    console.error('❌ Error during seeding:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e)
    process.exit(1)
  })

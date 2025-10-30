import { PrismaClient } from '../src/generated/prisma'
import bcrypt from 'bcryptjs'
import { UserRole, UserStatus, ShopStatus } from '@/types'

const prisma = new PrismaClient()

async function initDemoUsers() {
  console.log('🚀 Starting demo user initialization...')

  try {
    // Check if users already exist
    const existingUsers = await prisma.user.count()
    if (existingUsers > 0) {
      console.log(`⚠️  Found ${existingUsers} existing users. Skipping initialization.`)
      console.log('To reinitialize, run: npm run db:reset')
      return
    }

    // Hash passwords
    const hashedPassword = await bcrypt.hash('password123', 12)

    // Create Super Admin
    const superAdmin = await prisma.user.create({
      data: {
        name: 'Super Admin',
        email: 'admin@mrmobile.pk',
        password: hashedPassword,
        phone: '+92-300-1234567',
        role: UserRole.SUPER_ADMIN,
        status: UserStatus.ACTIVE,
      },
    })
    console.log('✅ Created Super Admin:', superAdmin.email)

    // Create Demo Shops
    const shop1 = await prisma.shop.create({
      data: {
        name: 'Mr. Mobile Lahore',
        code: 'MRM-LHR-001',
        address: 'Hall Road, Lahore',
        city: 'Lahore',
        province: 'Punjab',
        postalCode: '54000',
        phone: '+92-42-1234567',
        email: 'lahore@mrmobile.pk',
        status: ShopStatus.ACTIVE,
        databaseUrl: process.env.DATABASE_URL || 'postgresql://localhost:5432/mrmobile_shop1',
        ownerId: superAdmin.id, // Temporarily assign to superadmin, will reassign later
        settings: {
          currency: 'PKR',
          taxRate: 17,
          timezone: 'Asia/Karachi',
          language: 'en'
        },
      },
    })

    const shop2 = await prisma.shop.create({
      data: {
        name: 'Mr. Mobile Karachi',
        code: 'MRM-KHI-001',
        address: 'Saddar, Karachi',
        city: 'Karachi',
        province: 'Sindh',
        postalCode: '74400',
        phone: '+92-21-1234567',
        email: 'karachi@mrmobile.pk',
        status: ShopStatus.ACTIVE,
        databaseUrl: process.env.DATABASE_URL || 'postgresql://localhost:5432/mrmobile_shop2',
        ownerId: superAdmin.id, // Temporarily assign to superadmin, will reassign later
        settings: {
          currency: 'PKR',
          taxRate: 17,
          timezone: 'Asia/Karachi',
          language: 'en'
        },
      },
    })

    console.log('✅ Created Demo Shops:', shop1.name, shop2.name)

    // Create Shop Owner
    const shopOwner = await prisma.user.create({
      data: {
        name: 'Ahmed Khan',
        email: 'owner@mrmobile.pk',
        password: hashedPassword,
        phone: '+92-300-2345678',
        role: UserRole.SHOP_OWNER,
        status: UserStatus.ACTIVE,
        createdById: superAdmin.id,
      },
    })

    // Assign shop to owner
    await prisma.shop.update({
      where: { id: shop1.id },
      data: { ownerId: shopOwner.id },
    })

    console.log('✅ Created Shop Owner:', shopOwner.email)

    // Create Shop Worker
    const shopWorker = await prisma.user.create({
      data: {
        name: 'Ali Hassan',
        email: 'worker@mrmobile.pk',
        password: hashedPassword,
        phone: '+92-300-3456789',
        role: UserRole.SHOP_WORKER,
        status: UserStatus.ACTIVE,
        createdById: shopOwner.id,
      },
    })

    // Create shop worker relationship
    await prisma.shopWorker.create({
      data: {
        shopId: shop1.id,
        userId: shopWorker.id,
        permissions: {
          canCreateSales: true,
          canViewReports: true,
          canManageInventory: false,
          canManageSuppliers: false,
          canAccessFinancials: false,
        },
      },
    })

    console.log('✅ Created Shop Worker:', shopWorker.email)

    // Create some sample data for better testing
    
    // Create categories
    const mobileCategory = await prisma.category.create({
      data: {
        name: 'Mobile Phones',
        code: 'MOBILE',
        description: 'Smartphones and feature phones',
        parentId: null,
        isActive: true,
      },
    })

    const smartphoneCategory = await prisma.category.create({
      data: {
        name: 'Smartphones',
        code: 'SMARTPHONE',
        description: 'Android and iOS smartphones',
        parentId: mobileCategory.id,
        isActive: true,
      },
    })

    console.log('✅ Created Categories')

    // Create suppliers
    const supplier = await prisma.supplier.create({
      data: {
        name: 'Tech Distributors Pakistan',
        email: 'sales@techdist.pk',
        phone: '+92-21-9876543',
        address: 'I.I. Chundrigar Road, Karachi',
        city: 'Karachi',
        province: 'Punjab',
        contactPerson: 'Muhammad Tariq',
        status: 'ACTIVE',
        creditLimit: 500000,
        creditDays: 30,
      },
    })

    console.log('✅ Created Supplier')

    // Create brands first
    const appleBrand = await prisma.brand.create({
      data: {
        name: 'Apple',
        code: 'APPLE',
        description: 'Apple Inc. mobile devices',
        isActive: true,
      },
    })

    const samsungBrand = await prisma.brand.create({
      data: {
        name: 'Samsung',
        code: 'SAMSUNG',
        description: 'Samsung Electronics mobile devices',
        isActive: true,
      },
    })

    console.log('✅ Created Brands')

    // Create sample products
    const iphone15 = await prisma.product.create({
      data: {
        name: 'iPhone 15 Pro Max',
        model: 'iPhone 15 Pro Max',
        sku: 'APPLE-IP15PM-256',
        barcode: '194253000000',
        type: 'MOBILE_PHONE',
        status: 'ACTIVE',
        description: 'Apple iPhone 15 Pro Max 256GB Natural Titanium',
        specifications: {
          storage: '256GB',
          color: 'Natural Titanium',
          display: '6.7" Super Retina XDR',
          camera: '48MP Pro camera system',
          processor: 'A17 Pro chip',
          battery: 'Up to 29 hours video playback',
        },
        warranty: 12,
        costPrice: 350000,
        sellingPrice: 385000,
        minimumPrice: 340000,
        markupPercentage: 10,
        categoryId: smartphoneCategory.id,
        brandId: appleBrand.id,
        lowStockThreshold: 2,
        reorderPoint: 5,
      },
    })

    const galaxyS24 = await prisma.product.create({
      data: {
        name: 'Samsung Galaxy S24 Ultra',
        model: 'Galaxy S24 Ultra',
        sku: 'SAMSUNG-GS24U-256',
        barcode: '887276000000',
        type: 'MOBILE_PHONE',
        status: 'ACTIVE',
        description: 'Samsung Galaxy S24 Ultra 256GB Titanium Black',
        specifications: {
          storage: '256GB',
          color: 'Titanium Black',
          display: '6.8" Dynamic AMOLED 2X',
          camera: '200MP Pro camera system',
          processor: 'Snapdragon 8 Gen 3',
          battery: '5000mAh',
        },
        warranty: 12,
        costPrice: 280000,
        sellingPrice: 310000,
        minimumPrice: 270000,
        markupPercentage: 11,
        categoryId: smartphoneCategory.id,
        brandId: samsungBrand.id,
        lowStockThreshold: 3,
        reorderPoint: 6,
      },
    })

    console.log('✅ Created Products')

    // Create inventory items for the products
    await prisma.inventoryItem.create({
      data: {
        productId: iphone15.id,
        imei: '356938035643809',
        status: 'IN_STOCK',
        costPrice: 350000,
        purchaseDate: new Date(),
        location: 'Shop Floor A1',
        supplierId: supplier.id,
      },
    })

    await prisma.inventoryItem.create({
      data: {
        productId: iphone15.id,
        imei: '356938035643810',
        status: 'IN_STOCK',
        costPrice: 350000,
        purchaseDate: new Date(),
        location: 'Shop Floor A2',
        supplierId: supplier.id,
      },
    })

    await prisma.inventoryItem.create({
      data: {
        productId: galaxyS24.id,
        imei: '356938035643811',
        status: 'IN_STOCK',
        costPrice: 280000,
        purchaseDate: new Date(),
        location: 'Shop Floor B1',
        supplierId: supplier.id,
      },
    })

    await prisma.inventoryItem.create({
      data: {
        productId: galaxyS24.id,
        imei: '356938035643812',
        status: 'IN_STOCK',
        costPrice: 280000,
        purchaseDate: new Date(),
        location: 'Shop Floor B2',
        supplierId: supplier.id,
      },
    })

    console.log('✅ Created Inventory Items')

    console.log(`
🎉 Demo data initialization completed successfully!

📋 Created Users:
-------------------
👨‍💼 Super Admin: admin@mrmobile.pk (password: password123)
🏪 Shop Owner: owner@mrmobile.pk (password: password123)
👷 Shop Worker: worker@mrmobile.pk (password: password123)

🏢 Created Shops:
-------------------
📍 Mr. Mobile Lahore (MRM-LHR-001)
📍 Mr. Mobile Karachi (MRM-KHI-001)

📱 Sample Products:
-------------------
🍎 iPhone 15 Pro Max (2 units in stock)
📱 Samsung Galaxy S24 Ultra (2 units in stock)

🔐 All passwords: password123
🌐 Access: http://localhost:3004/login

⚠️  Note: This is demo data for development only.
    `)

  } catch (error) {
    console.error('❌ Error initializing demo users:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

// Run if called directly
if (require.main === module) {
  initDemoUsers()
    .then(() => {
      console.log('✅ Demo initialization completed')
      process.exit(0)
    })
    .catch((error) => {
      console.error('❌ Demo initialization failed:', error)
      process.exit(1)
    })
}

export { initDemoUsers }

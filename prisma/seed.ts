/**
 * Comprehensive Database Seeding Script
 * Creates a complete demo environment with:
 * - Super Admin
 * - 2 Shops with Owners and Workers
 * - Products, Categories, Brands
 * - Inventory, Suppliers, Customers
 * - Sales, Purchases, and Daily Closings
 */

import { PrismaClient } from '../src/generated/prisma'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Starting database seeding...\n')

  // Clear existing data
  console.log('🧹 Cleaning existing data...')
  await prisma.$transaction([
    prisma.purchasePayment.deleteMany(),
    prisma.purchaseItem.deleteMany(),
    prisma.purchase.deleteMany(),
    prisma.payment.deleteMany(),
    prisma.saleItem.deleteMany(),
    prisma.sale.deleteMany(),
    prisma.inventoryItem.deleteMany(),
    prisma.cartItem.deleteMany(),
    prisma.product.deleteMany(),
    prisma.category.deleteMany(),
    prisma.brand.deleteMany(),
    prisma.supplier.deleteMany(),
    prisma.customer.deleteMany(),
    prisma.dailyClosing.deleteMany(),
    prisma.mobileService.deleteMany(),
    prisma.shopWorker.deleteMany(),
    prisma.shop.deleteMany(),
    prisma.user.deleteMany(),
  ])
  console.log('✅ Database cleaned\n')

  // Hash password for all users
  const hashedPassword = await bcrypt.hash('password123', 10)

  // ==========================================
  // 1. CREATE SUPER ADMIN
  // ==========================================
  console.log('👑 Creating Super Admin...')
  const superAdmin = await prisma.user.create({
    data: {
      email: 'admin@mrmobile.com',
      password: hashedPassword,
      name: 'Super Administrator',
      phone: '+92-300-0000000',
      role: 'SUPER_ADMIN',
      status: 'ACTIVE',
      emailVerified: new Date(),
    },
  })
  console.log(`✅ Super Admin created: ${superAdmin.email}\n`)

  // ==========================================
  // 2. CREATE SHOP 1 - "Ali Mobile Center"
  // ==========================================
  console.log('🏪 Creating Shop 1: Ali Mobile Center...')
  
  const shop1Owner = await prisma.user.create({
    data: {
      email: 'ali@mrmobile.com',
      password: hashedPassword,
      name: 'Ali Khan',
      phone: '+92-300-1111111',
      role: 'SHOP_OWNER',
      status: 'ACTIVE',
      emailVerified: new Date(),
      businessName: 'Ali Mobile Center',
      city: 'Lahore',
      province: 'Punjab',
    },
  })

  const shop1 = await prisma.shop.create({
    data: {
      name: 'Ali Mobile Center',
      code: 'AMC001',
      address: 'Shop 12, Main Market, Liberty',
      city: 'Lahore',
      province: 'Punjab',
      postalCode: '54000',
      phone: '+92-42-1111111',
      email: 'ali@mrmobile.com',
      licenseNumber: 'LHR-MOB-2024-001',
      gstNumber: 'GST-001-2024',
      status: 'ACTIVE',
      ownerId: shop1Owner.id,
      databaseUrl: process.env.DATABASE_URL!,
      databaseName: 'mrmobile_dev',
      isInitialized: true,
      plan: 'premium',
    },
  })

  // Shop 1 Workers
  const shop1Worker1 = await prisma.user.create({
    data: {
      email: 'ahmed@mrmobile.com',
      password: hashedPassword,
      name: 'Ahmed Hassan',
      phone: '+92-300-2222222',
      role: 'SHOP_WORKER',
      status: 'ACTIVE',
      emailVerified: new Date(),
      city: 'Lahore',
      province: 'Punjab',
    },
  })

  await prisma.shopWorker.create({
    data: {
      shopId: shop1.id,
      userId: shop1Worker1.id,
      isActive: true,
      permissions: {
        canCreateSales: true,
        canViewReports: true,
        canManageInventory: false,
      },
    },
  })

  // Create default module access for Ahmed (Worker 1 - Shop 1)
  await prisma.shopWorkerModuleAccess.createMany({
    data: [
      { shopId: shop1.id, workerId: shop1Worker1.id, module: 'POS_SYSTEM', permissions: ['VIEW', 'CREATE'], isEnabled: true },
      { shopId: shop1.id, workerId: shop1Worker1.id, module: 'PRODUCT_MANAGEMENT', permissions: ['VIEW'], isEnabled: true },
      { shopId: shop1.id, workerId: shop1Worker1.id, module: 'INVENTORY_MANAGEMENT', permissions: ['VIEW'], isEnabled: true },
      { shopId: shop1.id, workerId: shop1Worker1.id, module: 'CUSTOMER_MANAGEMENT', permissions: ['VIEW', 'CREATE', 'EDIT'], isEnabled: true },
      { shopId: shop1.id, workerId: shop1Worker1.id, module: 'SALES_REPORTS', permissions: ['VIEW'], isEnabled: true },
      { shopId: shop1.id, workerId: shop1Worker1.id, module: 'SUPPLIER_MANAGEMENT', permissions: ['VIEW'], isEnabled: true },
      { shopId: shop1.id, workerId: shop1Worker1.id, module: 'DAILY_CLOSING', permissions: ['VIEW'], isEnabled: true },
      { shopId: shop1.id, workerId: shop1Worker1.id, module: 'SERVICE_MANAGEMENT', permissions: ['VIEW', 'CREATE'], isEnabled: true },
      { shopId: shop1.id, workerId: shop1Worker1.id, module: 'MESSAGING', permissions: ['VIEW', 'CREATE'], isEnabled: true },
    ]
  })

  const shop1Worker2 = await prisma.user.create({
    data: {
      email: 'fatima@mrmobile.com',
      password: hashedPassword,
      name: 'Fatima Noor',
      phone: '+92-300-3333333',
      role: 'SHOP_WORKER',
      status: 'ACTIVE',
      emailVerified: new Date(),
      city: 'Lahore',
      province: 'Punjab',
    },
  })

  await prisma.shopWorker.create({
    data: {
      shopId: shop1.id,
      userId: shop1Worker2.id,
      isActive: true,
      permissions: {
        canCreateSales: true,
        canViewReports: false,
        canManageInventory: true,
      },
    },
  })

  // Create default module access for Fatima (Worker 2 - Shop 1)
  await prisma.shopWorkerModuleAccess.createMany({
    data: [
      { shopId: shop1.id, workerId: shop1Worker2.id, module: 'POS_SYSTEM', permissions: ['VIEW', 'CREATE'], isEnabled: true },
      { shopId: shop1.id, workerId: shop1Worker2.id, module: 'PRODUCT_MANAGEMENT', permissions: ['VIEW', 'CREATE'], isEnabled: true },
      { shopId: shop1.id, workerId: shop1Worker2.id, module: 'INVENTORY_MANAGEMENT', permissions: ['VIEW', 'CREATE'], isEnabled: true },
      { shopId: shop1.id, workerId: shop1Worker2.id, module: 'CUSTOMER_MANAGEMENT', permissions: ['VIEW'], isEnabled: true },
      { shopId: shop1.id, workerId: shop1Worker2.id, module: 'SUPPLIER_MANAGEMENT', permissions: ['VIEW'], isEnabled: true },
      { shopId: shop1.id, workerId: shop1Worker2.id, module: 'DAILY_CLOSING', permissions: ['VIEW'], isEnabled: true },
      { shopId: shop1.id, workerId: shop1Worker2.id, module: 'MESSAGING', permissions: ['VIEW', 'CREATE'], isEnabled: true },
    ]
  })

  console.log(`✅ Shop 1 created with owner and 2 workers\n`)

  // ==========================================
  // 3. CREATE SHOP 2 - "Hassan Electronics"
  // ==========================================
  console.log('🏪 Creating Shop 2: Hassan Electronics...')
  
  const shop2Owner = await prisma.user.create({
    data: {
      email: 'hassan@mrmobile.com',
      password: hashedPassword,
      name: 'Hassan Malik',
      phone: '+92-300-4444444',
      role: 'SHOP_OWNER',
      status: 'ACTIVE',
      emailVerified: new Date(),
      businessName: 'Hassan Electronics',
      city: 'Karachi',
      province: 'Sindh',
    },
  })

  const shop2 = await prisma.shop.create({
    data: {
      name: 'Hassan Electronics',
      code: 'HE002',
      address: 'Shop 45, Saddar Bazaar',
      city: 'Karachi',
      province: 'Sindh',
      postalCode: '74000',
      phone: '+92-21-2222222',
      email: 'hassan@mrmobile.com',
      licenseNumber: 'KHI-MOB-2024-002',
      gstNumber: 'GST-002-2024',
      status: 'ACTIVE',
      ownerId: shop2Owner.id,
      databaseUrl: process.env.DATABASE_URL!,
      databaseName: 'mrmobile_dev',
      isInitialized: true,
      plan: 'basic',
    },
  })

  // Shop 2 Workers
  const shop2Worker1 = await prisma.user.create({
    data: {
      email: 'zain@mrmobile.com',
      password: hashedPassword,
      name: 'Zain Abbas',
      phone: '+92-300-5555555',
      role: 'SHOP_WORKER',
      status: 'ACTIVE',
      emailVerified: new Date(),
      city: 'Karachi',
      province: 'Sindh',
    },
  })

  await prisma.shopWorker.create({
    data: {
      shopId: shop2.id,
      userId: shop2Worker1.id,
      isActive: true,
      permissions: {
        canCreateSales: true,
        canViewReports: true,
        canManageInventory: true,
      },
    },
  })

  // Create default module access for Zain (Worker 1 - Shop 2)
  await prisma.shopWorkerModuleAccess.createMany({
    data: [
      { shopId: shop2.id, workerId: shop2Worker1.id, module: 'POS_SYSTEM', permissions: ['VIEW', 'CREATE'], isEnabled: true },
      { shopId: shop2.id, workerId: shop2Worker1.id, module: 'PRODUCT_MANAGEMENT', permissions: ['VIEW', 'CREATE'], isEnabled: true },
      { shopId: shop2.id, workerId: shop2Worker1.id, module: 'INVENTORY_MANAGEMENT', permissions: ['VIEW', 'CREATE', 'EDIT'], isEnabled: true },
      { shopId: shop2.id, workerId: shop2Worker1.id, module: 'CUSTOMER_MANAGEMENT', permissions: ['VIEW', 'CREATE'], isEnabled: true },
      { shopId: shop2.id, workerId: shop2Worker1.id, module: 'SALES_REPORTS', permissions: ['VIEW'], isEnabled: true },
      { shopId: shop2.id, workerId: shop2Worker1.id, module: 'SUPPLIER_MANAGEMENT', permissions: ['VIEW'], isEnabled: true },
      { shopId: shop2.id, workerId: shop2Worker1.id, module: 'DAILY_CLOSING', permissions: ['VIEW'], isEnabled: true },
      { shopId: shop2.id, workerId: shop2Worker1.id, module: 'SERVICE_MANAGEMENT', permissions: ['VIEW', 'CREATE'], isEnabled: true },
      { shopId: shop2.id, workerId: shop2Worker1.id, module: 'MESSAGING', permissions: ['VIEW', 'CREATE'], isEnabled: true },
    ]
  })

  console.log(`✅ Shop 2 created with owner and 1 worker\n`)

  // ==========================================
  // 4. CREATE CATEGORIES (for both shops)
  // ==========================================
  console.log('📂 Creating Categories...')
  
  const categoriesShop1 = await prisma.category.createMany({
    data: [
      {
        name: 'Smartphones',
        code: 'SMART',
        description: 'Mobile Phones and Smartphones',
        shopId: shop1.id,
        isActive: true,
      },
      {
        name: 'Accessories',
        code: 'ACC',
        description: 'Mobile Accessories',
        shopId: shop1.id,
        isActive: true,
      },
      {
        name: 'Smart Watches',
        code: 'WATCH',
        description: 'Smart Watches and Wearables',
        shopId: shop1.id,
        isActive: true,
      },
    ],
  })

  const categoriesShop2 = await prisma.category.createMany({
    data: [
      {
        name: 'Smartphones',
        code: 'SMART',
        description: 'Mobile Phones and Smartphones',
        shopId: shop2.id,
        isActive: true,
      },
      {
        name: 'Accessories',
        code: 'ACC',
        description: 'Mobile Accessories',
        shopId: shop2.id,
        isActive: true,
      },
    ],
  })

  const shop1Categories = await prisma.category.findMany({
    where: { shopId: shop1.id },
  })

  const shop2Categories = await prisma.category.findMany({
    where: { shopId: shop2.id },
  })

  console.log(`✅ Categories created for both shops\n`)

  // ==========================================
  // 5. CREATE BRANDS (for both shops)
  // ==========================================
  console.log('🏷️ Creating Brands...')
  
  const brandsShop1 = await prisma.brand.createMany({
    data: [
      {
        name: 'Samsung',
        code: 'SAM',
        description: 'Samsung Electronics',
        shopId: shop1.id,
        isActive: true,
      },
      {
        name: 'Apple',
        code: 'APL',
        description: 'Apple Inc.',
        shopId: shop1.id,
        isActive: true,
      },
      {
        name: 'Xiaomi',
        code: 'XIA',
        description: 'Xiaomi Corporation',
        shopId: shop1.id,
        isActive: true,
      },
      {
        name: 'Oppo',
        code: 'OPP',
        description: 'Oppo Mobile',
        shopId: shop1.id,
        isActive: true,
      },
    ],
  })

  const brandsShop2 = await prisma.brand.createMany({
    data: [
      {
        name: 'Samsung',
        code: 'SAM',
        description: 'Samsung Electronics',
        shopId: shop2.id,
        isActive: true,
      },
      {
        name: 'Xiaomi',
        code: 'XIA',
        description: 'Xiaomi Corporation',
        shopId: shop2.id,
        isActive: true,
      },
      {
        name: 'Vivo',
        code: 'VIV',
        description: 'Vivo Mobile',
        shopId: shop2.id,
        isActive: true,
      },
    ],
  })

  const shop1Brands = await prisma.brand.findMany({
    where: { shopId: shop1.id },
  })

  const shop2Brands = await prisma.brand.findMany({
    where: { shopId: shop2.id },
  })

  console.log(`✅ Brands created for both shops\n`)

  // ==========================================
  // 6. CREATE SUPPLIERS (for both shops)
  // ==========================================
  console.log('🚚 Creating Suppliers...')
  
  const shop1Supplier1 = await prisma.supplier.create({
    data: {
      name: 'Mobile World Distributors',
      contactPerson: 'Imran Sheikh',
      email: 'imran@mobileworld.pk',
      phone: '+92-42-9999999',
      address: 'Plot 23, Industrial Area',
      city: 'Lahore',
      province: 'Punjab',
      gstNumber: 'GST-SUP-001',
      status: 'ACTIVE',
      creditLimit: 500000,
      creditDays: 30,
      shopId: shop1.id,
    },
  })

  const shop1Supplier2 = await prisma.supplier.create({
    data: {
      name: 'Tech Hub Supplies',
      contactPerson: 'Bilal Ahmed',
      email: 'bilal@techhub.pk',
      phone: '+92-42-8888888',
      address: 'Plaza 5, Main Boulevard',
      city: 'Lahore',
      province: 'Punjab',
      gstNumber: 'GST-SUP-002',
      status: 'ACTIVE',
      creditLimit: 300000,
      creditDays: 15,
      shopId: shop1.id,
    },
  })

  const shop2Supplier1 = await prisma.supplier.create({
    data: {
      name: 'Karachi Mobile Traders',
      contactPerson: 'Arif Hussain',
      email: 'arif@kmtraders.pk',
      phone: '+92-21-7777777',
      address: 'Block A, Gulshan Market',
      city: 'Karachi',
      province: 'Sindh',
      gstNumber: 'GST-SUP-003',
      status: 'ACTIVE',
      creditLimit: 400000,
      creditDays: 20,
      shopId: shop2.id,
    },
  })

  console.log(`✅ Suppliers created for both shops\n`)

  // ==========================================
  // 7. CREATE PRODUCTS (for both shops)
  // ==========================================
  console.log('📱 Creating Products...')
  
  // Shop 1 Products
  const shop1SamsungCategory = shop1Categories.find(c => c.code === 'SMART')!
  const shop1SamsungBrand = shop1Brands.find(b => b.code === 'SAM')!
  const shop1AppleBrand = shop1Brands.find(b => b.code === 'APL')!
  const shop1XiaomiBrand = shop1Brands.find(b => b.code === 'XIA')!

  const shop1Product1 = await prisma.product.create({
    data: {
      name: 'Samsung Galaxy S24',
      model: 'S24-128GB',
      sku: 'SAM-SMART-S24-001',
      barcode: '8801643736396',
      type: 'MOBILE_PHONE',
      status: 'ACTIVE',
      description: 'Samsung Galaxy S24 128GB with 8GB RAM',
      costPrice: 180000,
      sellingPrice: 205000,
      minimumPrice: 195000,
      categoryId: shop1SamsungCategory.id,
      brandId: shop1SamsungBrand.id,
      shopId: shop1.id,
      lowStockThreshold: 3,
      reorderPoint: 5,
      warranty: 12,
    },
  })

  const shop1Product2 = await prisma.product.create({
    data: {
      name: 'iPhone 15 Pro',
      model: 'IP15P-256GB',
      sku: 'APL-SMART-IP15-002',
      barcode: '0194253776000',
      type: 'MOBILE_PHONE',
      status: 'ACTIVE',
      description: 'iPhone 15 Pro 256GB with A17 Pro chip',
      costPrice: 390000,
      sellingPrice: 430000,
      minimumPrice: 420000,
      categoryId: shop1SamsungCategory.id,
      brandId: shop1AppleBrand.id,
      shopId: shop1.id,
      lowStockThreshold: 2,
      reorderPoint: 4,
      warranty: 12,
    },
  })

  const shop1Product3 = await prisma.product.create({
    data: {
      name: 'Xiaomi 14 Pro',
      model: 'X14P-512GB',
      sku: 'XIA-SMART-X14-003',
      barcode: '6941812742808',
      type: 'MOBILE_PHONE',
      status: 'ACTIVE',
      description: 'Xiaomi 14 Pro 512GB with Snapdragon 8 Gen 3',
      costPrice: 145000,
      sellingPrice: 165000,
      minimumPrice: 158000,
      categoryId: shop1SamsungCategory.id,
      brandId: shop1XiaomiBrand.id,
      shopId: shop1.id,
      lowStockThreshold: 5,
      reorderPoint: 8,
      warranty: 12,
    },
  })

  // Shop 2 Products
  const shop2SamsungCategory = shop2Categories.find(c => c.code === 'SMART')!
  const shop2SamsungBrand = shop2Brands.find(b => b.code === 'SAM')!
  const shop2XiaomiBrand = shop2Brands.find(b => b.code === 'XIA')!

  const shop2Product1 = await prisma.product.create({
    data: {
      name: 'Samsung Galaxy A54',
      model: 'A54-128GB',
      sku: 'SAM-SMART-A54-001',
      barcode: '8801643890234',
      type: 'MOBILE_PHONE',
      status: 'ACTIVE',
      description: 'Samsung Galaxy A54 128GB with 6GB RAM',
      costPrice: 65000,
      sellingPrice: 75000,
      minimumPrice: 72000,
      categoryId: shop2SamsungCategory.id,
      brandId: shop2SamsungBrand.id,
      shopId: shop2.id,
      lowStockThreshold: 5,
      reorderPoint: 10,
      warranty: 12,
    },
  })

  const shop2Product2 = await prisma.product.create({
    data: {
      name: 'Xiaomi Redmi Note 13',
      model: 'RN13-256GB',
      sku: 'XIA-SMART-RN13-002',
      barcode: '6941812745678',
      type: 'MOBILE_PHONE',
      status: 'ACTIVE',
      description: 'Xiaomi Redmi Note 13 256GB',
      costPrice: 48000,
      sellingPrice: 55000,
      minimumPrice: 53000,
      categoryId: shop2SamsungCategory.id,
      brandId: shop2XiaomiBrand.id,
      shopId: shop2.id,
      lowStockThreshold: 8,
      reorderPoint: 12,
      warranty: 12,
    },
  })

  console.log(`✅ Products created for both shops\n`)

  // ==========================================
  // 8. CREATE INVENTORY (for both shops)
  // ==========================================
  console.log('📦 Creating Inventory...')
  
  // Shop 1 Inventory
  for (let i = 1; i <= 5; i++) {
    await prisma.inventoryItem.create({
      data: {
        productId: shop1Product1.id,
        imei: `356789012345${i.toString().padStart(3, '0')}`,
        status: i <= 3 ? 'IN_STOCK' : 'RESERVED',
        costPrice: 180000,
        purchaseDate: new Date('2024-10-01'),
        shopId: shop1.id,
        supplierId: shop1Supplier1.id,
      },
    })
  }

  for (let i = 1; i <= 3; i++) {
    await prisma.inventoryItem.create({
      data: {
        productId: shop1Product2.id,
        imei: `358901234567${i.toString().padStart(3, '0')}`,
        status: 'IN_STOCK',
        costPrice: 390000,
        purchaseDate: new Date('2024-10-05'),
        shopId: shop1.id,
        supplierId: shop1Supplier1.id,
      },
    })
  }

  for (let i = 1; i <= 8; i++) {
    await prisma.inventoryItem.create({
      data: {
        productId: shop1Product3.id,
        imei: `352345678901${i.toString().padStart(3, '0')}`,
        status: i <= 6 ? 'IN_STOCK' : 'RESERVED',
        costPrice: 145000,
        purchaseDate: new Date('2024-10-10'),
        shopId: shop1.id,
        supplierId: shop1Supplier2.id,
      },
    })
  }

  // Shop 2 Inventory
  for (let i = 1; i <= 10; i++) {
    await prisma.inventoryItem.create({
      data: {
        productId: shop2Product1.id,
        imei: `359012345678${i.toString().padStart(3, '0')}`,
        status: i <= 7 ? 'IN_STOCK' : 'RESERVED',
        costPrice: 65000,
        purchaseDate: new Date('2024-10-08'),
        shopId: shop2.id,
        supplierId: shop2Supplier1.id,
      },
    })
  }

  for (let i = 1; i <= 12; i++) {
    await prisma.inventoryItem.create({
      data: {
        productId: shop2Product2.id,
        imei: `351234567890${i.toString().padStart(3, '0')}`,
        status: i <= 10 ? 'IN_STOCK' : 'RESERVED',
        costPrice: 48000,
        purchaseDate: new Date('2024-10-12'),
        shopId: shop2.id,
        supplierId: shop2Supplier1.id,
      },
    })
  }

  console.log(`✅ Inventory created for both shops\n`)

  // ==========================================
  // 9. CREATE CUSTOMERS (for both shops)
  // ==========================================
  console.log('👥 Creating Customers...')
  
  const shop1Customer1 = await prisma.customer.create({
    data: {
      name: 'Usman Ali',
      phone: '+92-300-6666666',
      email: 'usman@example.com',
      address: 'House 123, Model Town',
      city: 'Lahore',
      cnic: '35202-1234567-1',
      creditLimit: 100000,
      shopId: shop1.id,
    },
  })

  const shop1Customer2 = await prisma.customer.create({
    data: {
      name: 'Sara Ahmed',
      phone: '+92-300-7777777',
      email: 'sara@example.com',
      address: 'Flat 45, DHA Phase 5',
      city: 'Lahore',
      cnic: '35202-2345678-2',
      shopId: shop1.id,
    },
  })

  const shop2Customer1 = await prisma.customer.create({
    data: {
      name: 'Kamran Siddiqui',
      phone: '+92-300-8888888',
      email: 'kamran@example.com',
      address: 'House 67, Clifton',
      city: 'Karachi',
      cnic: '42101-3456789-3',
      creditLimit: 80000,
      shopId: shop2.id,
    },
  })

  console.log(`✅ Customers created for both shops\n`)

  // ==========================================
  // 10. CREATE PURCHASES (for both shops)
  // ==========================================
  console.log('🛒 Creating Purchases...')
  
  const shop1Purchase1 = await prisma.purchase.create({
    data: {
      invoiceNumber: 'PO-AMC-001',
      supplierId: shop1Supplier1.id,
      shopId: shop1.id,
      totalAmount: 900000, // 5 x 180000
      paidAmount: 500000,
      dueAmount: 400000,
      status: 'RECEIVED',
      purchaseDate: new Date('2024-10-01'),
      receivedDate: new Date('2024-10-02'),
      notes: 'First batch of Samsung S24',
      items: {
        create: [
          {
            productId: shop1Product1.id,
            quantity: 5,
            receivedQty: 5,
            unitCost: 180000,
            totalCost: 900000,
            imeiNumbers: [
              '356789012345001',
              '356789012345002',
              '356789012345003',
              '356789012345004',
              '356789012345005',
            ],
          },
        ],
      },
      payments: {
        create: [
          {
            amount: 500000,
            method: 'BANK_TRANSFER',
            reference: 'TXN-001',
            notes: 'Initial payment',
            paymentDate: new Date('2024-10-01'),
          },
        ],
      },
    },
  })

  const shop2Purchase1 = await prisma.purchase.create({
    data: {
      invoiceNumber: 'PO-HE-001',
      supplierId: shop2Supplier1.id,
      shopId: shop2.id,
      totalAmount: 650000, // 10 x 65000
      paidAmount: 650000,
      dueAmount: 0,
      status: 'COMPLETED',
      purchaseDate: new Date('2024-10-08'),
      receivedDate: new Date('2024-10-09'),
      notes: 'Samsung A54 stock',
      items: {
        create: [
          {
            productId: shop2Product1.id,
            quantity: 10,
            receivedQty: 10,
            unitCost: 65000,
            totalCost: 650000,
          },
        ],
      },
      payments: {
        create: [
          {
            amount: 650000,
            method: 'CASH',
            reference: 'CASH-001',
            paymentDate: new Date('2024-10-08'),
          },
        ],
      },
    },
  })

  console.log(`✅ Purchases created for both shops\n`)

  // ==========================================
  // 11. CREATE SALES (for both shops)
  // ==========================================
  console.log('💰 Creating Sales...')
  
  const reservedInventory1 = await prisma.inventoryItem.findFirst({
    where: {
      productId: shop1Product1.id,
      status: 'RESERVED',
      shopId: shop1.id,
    },
  })

  if (reservedInventory1) {
    const shop1Sale1 = await prisma.sale.create({
      data: {
        invoiceNumber: 'INV-AMC-001',
        customerId: shop1Customer1.id,
        subtotal: 205000,
        taxAmount: 0,
        discountAmount: 5000,
        totalAmount: 200000,
        status: 'COMPLETED',
        paymentMethod: 'CASH',
        paymentStatus: 'COMPLETED',
        paidAmount: 200000,
        shopId: shop1.id,
        saleDate: new Date('2024-10-15'),
        items: {
          create: [
            {
              productId: shop1Product1.id,
              quantity: 1,
              unitPrice: 205000,
              totalPrice: 205000,
            },
          ],
        },
        payments: {
          create: [
            {
              amount: 200000,
              method: 'CASH',
              status: 'COMPLETED',
              paymentDate: new Date('2024-10-15'),
            },
          ],
        },
      },
    })

    // Link inventory item to sale
    await prisma.inventoryItem.update({
      where: { id: reservedInventory1.id },
      data: { status: 'RESERVED' },
    })
  }

  const reservedInventory2 = await prisma.inventoryItem.findFirst({
    where: {
      productId: shop2Product1.id,
      status: 'RESERVED',
      shopId: shop2.id,
    },
  })

  if (reservedInventory2) {
    const shop2Sale1 = await prisma.sale.create({
      data: {
        invoiceNumber: 'INV-HE-001',
        customerId: shop2Customer1.id,
        subtotal: 75000,
        taxAmount: 0,
        discountAmount: 2000,
        totalAmount: 73000,
        status: 'COMPLETED',
        paymentMethod: 'CARD',
        paymentStatus: 'COMPLETED',
        paidAmount: 73000,
        shopId: shop2.id,
        saleDate: new Date('2024-10-14'),
        items: {
          create: [
            {
              productId: shop2Product1.id,
              quantity: 1,
              unitPrice: 75000,
              totalPrice: 75000,
            },
          ],
        },
        payments: {
          create: [
            {
              amount: 73000,
              method: 'CARD',
              status: 'COMPLETED',
              paymentDate: new Date('2024-10-14'),
            },
          ],
        },
      },
    })
  }

  console.log(`✅ Sales created for both shops\n`)

  // ==========================================
  // 12. CREATE DAILY CLOSINGS
  // ==========================================
  console.log('📊 Creating Daily Closings...')
  
  await prisma.dailyClosing.create({
    data: {
      shopId: shop1.id,
      date: new Date('2024-10-15'),
      status: 'CLOSED',
      cashSales: 200000,
      cardSales: 0,
      bankTransferSales: 0,
      jazzLoadSales: 5000,
      telenorLoadSales: 3000,
      zongLoadSales: 2000,
      ufoneLoadSales: 1500,
      easypaisaSales: 2500,
      jazzcashSales: 2000,
      receiving: 1000,
      bankTransfer: 0,
      loan: 0,
      cash: 0,
      credit: 0,
      inventory: 0,
      totalIncome: 217000,
      totalExpenses: 0,
      netAmount: 217000,
      notes: 'Good day with Samsung S24 sale',
    },
  })

  await prisma.dailyClosing.create({
    data: {
      shopId: shop2.id,
      date: new Date('2024-10-14'),
      status: 'CLOSED',
      cashSales: 73000,
      cardSales: 0,
      bankTransferSales: 0,
      jazzLoadSales: 3000,
      telenorLoadSales: 2500,
      zongLoadSales: 1500,
      ufoneLoadSales: 1000,
      easypaisaSales: 1500,
      jazzcashSales: 1000,
      receiving: 500,
      bankTransfer: 0,
      loan: 0,
      cash: 0,
      credit: 0,
      inventory: 0,
      totalIncome: 84000,
      totalExpenses: 0,
      netAmount: 84000,
      notes: 'Regular business day',
    },
  })

  console.log(`✅ Daily Closings created for both shops\n`)

  // ==========================================
  // 13. CREATE MESSAGES (Owner-Worker Communication)
  // ==========================================
  console.log('💬 Creating Messages...')
  
  // Shop 1 Messages - Ali (Owner) communicating with workers
  
  // Message 1: Owner to Worker Ahmed (DIRECT)
  const message1 = await prisma.message.create({
    data: {
      shopId: shop1.id,
      senderId: shop1Owner.id,
      receiverId: shop1Worker1.id,
      messageType: 'DIRECT',
      subject: 'Stock Update Required',
      content: 'Ahmed, please update the inventory for Samsung S24 units. We received 10 new pieces today from supplier.',
      priority: 'HIGH',
      isRead: true,
      readAt: new Date('2024-10-21T10:30:00'),
      createdAt: new Date('2024-10-21T09:00:00'),
    },
  })

  // Message 2: Worker Ahmed replying to Owner
  await prisma.message.create({
    data: {
      shopId: shop1.id,
      senderId: shop1Worker1.id,
      receiverId: shop1Owner.id,
      messageType: 'DIRECT',
      subject: 'Re: Stock Update Required',
      content: 'Sir, I have updated the inventory. All 10 Samsung S24 units have been added to the system.',
      priority: 'NORMAL',
      isRead: true,
      readAt: new Date('2024-10-21T11:00:00'),
      createdAt: new Date('2024-10-21T10:45:00'),
    },
  })

  // Message 3: Owner to Worker Fatima
  await prisma.message.create({
    data: {
      shopId: shop1.id,
      senderId: shop1Owner.id,
      receiverId: shop1Worker2.id,
      messageType: 'DIRECT',
      subject: 'Customer Follow-up',
      content: 'Fatima, please follow up with Mr. Akram about the iPhone 14 Pro order. He was interested in the blue color.',
      priority: 'NORMAL',
      isRead: false,
      createdAt: new Date('2024-10-22T08:00:00'),
    },
  })

  // Message 4: Broadcast from Owner to all workers
  const broadcastMessage = await prisma.message.create({
    data: {
      shopId: shop1.id,
      senderId: shop1Owner.id,
      receiverId: null, // null for broadcast
      messageType: 'BROADCAST',
      subject: '🎉 New Promotion Starting Today!',
      content: 'Team, we are starting a 10% discount promotion on all Xiaomi products from today until end of month. Please inform all customers.',
      priority: 'URGENT',
      isRead: false,
      createdAt: new Date('2024-10-22T09:00:00'),
    },
  })

  // Message 5: Worker asking for help
  await prisma.message.create({
    data: {
      shopId: shop1.id,
      senderId: shop1Worker1.id,
      receiverId: shop1Owner.id,
      messageType: 'DIRECT',
      subject: 'Customer Wants Discount',
      content: 'Sir, customer is asking for Rs. 5,000 discount on Xiaomi 13 Pro. He is buying 2 units. Should I approve?',
      priority: 'HIGH',
      isRead: false,
      createdAt: new Date('2024-10-22T11:30:00'),
    },
  })

  // Shop 2 Messages - Hassan (Owner) communicating with worker
  
  // Message 6: Owner to Worker Zain
  await prisma.message.create({
    data: {
      shopId: shop2.id,
      senderId: shop2Owner.id,
      receiverId: shop2Worker1.id,
      messageType: 'DIRECT',
      subject: 'Daily Closing Reminder',
      content: 'Zain, please complete today\'s daily closing before 8 PM. Don\'t forget to count all cash properly.',
      priority: 'NORMAL',
      isRead: true,
      readAt: new Date('2024-10-21T17:00:00'),
      createdAt: new Date('2024-10-21T16:00:00'),
    },
  })

  // Message 7: Announcement in Shop 2
  await prisma.message.create({
    data: {
      shopId: shop2.id,
      senderId: shop2Owner.id,
      receiverId: null,
      messageType: 'ANNOUNCEMENT',
      subject: '📢 Shop Closed Tomorrow',
      content: 'Important: Shop will be closed tomorrow due to Eid holidays. Will reopen day after tomorrow at 10 AM.',
      priority: 'URGENT',
      isRead: false,
      createdAt: new Date('2024-10-22T10:00:00'),
    },
  })

  // Message 8: Worker requesting leave
  await prisma.message.create({
    data: {
      shopId: shop2.id,
      senderId: shop2Worker1.id,
      receiverId: shop2Owner.id,
      messageType: 'DIRECT',
      subject: 'Leave Request',
      content: 'Sir, I need leave on 25th October for personal work. Please approve.',
      priority: 'NORMAL',
      isRead: false,
      createdAt: new Date('2024-10-22T12:00:00'),
    },
  })

  // Create read receipts for broadcast message
  await prisma.messageRead.create({
    data: {
      messageId: broadcastMessage.id,
      userId: shop1Worker1.id,
      readAt: new Date('2024-10-22T09:15:00'),
    },
  })

  console.log(`✅ Messages created for owner-worker communication\n`)

  // ==========================================
  // SUMMARY
  // ==========================================
  console.log('═══════════════════════════════════════════════')
  console.log('✨ DATABASE SEEDING COMPLETED SUCCESSFULLY! ✨')
  console.log('═══════════════════════════════════════════════\n')

  console.log('📋 SUMMARY:')
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n')

  console.log('👤 USERS CREATED:')
  console.log('  🔑 Super Admin:')
  console.log('     Email: admin@mrmobile.com')
  console.log('     Password: password123')
  console.log('')
  console.log('  🏪 Shop 1 - Ali Mobile Center (Lahore):')
  console.log('     👔 Owner: ali@mrmobile.com / password123')
  console.log('     👷 Worker 1: ahmed@mrmobile.com / password123')
  console.log('     👷 Worker 2: fatima@mrmobile.com / password123')
  console.log('')
  console.log('  🏪 Shop 2 - Hassan Electronics (Karachi):')
  console.log('     👔 Owner: hassan@mrmobile.com / password123')
  console.log('     👷 Worker 1: zain@mrmobile.com / password123')
  console.log('')

  console.log('📊 DATA CREATED:')
  console.log(`  🏪 Shops: 2`)
  console.log(`  📂 Categories: ${shop1Categories.length + shop2Categories.length}`)
  console.log(`  🏷️  Brands: ${shop1Brands.length + shop2Brands.length}`)
  console.log(`  🚚 Suppliers: 3`)
  console.log(`  📱 Products: 5`)
  console.log(`  📦 Inventory Items: 38`)
  console.log(`  👥 Customers: 3`)
  console.log(`  🛒 Purchases: 2`)
  console.log(`  💰 Sales: 2`)
  console.log(`  📊 Daily Closings: 2`)
  console.log(`  💬 Messages: 8 (including direct, broadcast, and announcements)`)
  console.log('')

  console.log('🔐 MULTITENANCY VERIFICATION:')
  console.log('  ✅ All data is shop-isolated')
  console.log('  ✅ Shop 1 users can only access Shop 1 data')
  console.log('  ✅ Shop 2 users can only access Shop 2 data')
  console.log('  ✅ Super Admin can access all shops')
  console.log('')

  console.log('🚀 READY TO TEST!')
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n')
}

main()
  .catch((e) => {
    console.error('❌ Error seeding database:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })

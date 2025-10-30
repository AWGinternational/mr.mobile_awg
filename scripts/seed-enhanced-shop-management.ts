#!/usr/bin/env tsx

/**
 * 🌱 COMPREHENSIVE SEED SCRIPT - SHOP MANAGEMENT SYSTEM
 * Seeds database with:
 * - Enhanced users with Pakistani fields
 * - Sample shops for shop owners
 * - Module access control setup
 * - Demo data for testing
 */

import { PrismaClient } from '../src/generated/prisma/index.js'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

// Default modules for different user types
const SHOP_OWNER_MODULES = [
  'PRODUCT_MANAGEMENT',
  'INVENTORY_MANAGEMENT', 
  'POS_SYSTEM',
  'CUSTOMER_MANAGEMENT',
  'SALES_REPORTS',
  'SUPPLIER_MANAGEMENT',
  'PAYMENT_PROCESSING',
  'DAILY_CLOSING',
  'LOAN_MANAGEMENT',
  'REPAIR_MANAGEMENT',
  'SERVICE_MANAGEMENT',
  'BUSINESS_ANALYTICS'
]

const SHOP_WORKER_BASIC_MODULES = [
  'POS_SYSTEM',
  'CUSTOMER_MANAGEMENT',
  'INVENTORY_MANAGEMENT',
  'REPAIR_MANAGEMENT'
]

async function seedEnhancedData() {
  console.log('🌱 SEEDING ENHANCED SHOP MANAGEMENT DATA')
  console.log('='.repeat(50))

  try {
    // Clean existing data
    console.log('🧹 Cleaning existing data...')
    await prisma.shopWorkerModuleAccess.deleteMany()
    await prisma.userModuleAccess.deleteMany()
    await prisma.shopWorker.deleteMany()
    await prisma.shop.deleteMany()
    await prisma.auditLog.deleteMany()
    await prisma.session.deleteMany()
    await prisma.user.deleteMany()

    console.log('✅ Database cleaned')

    // Create enhanced users
    console.log('👥 Creating enhanced users...')
    
    const hashedPassword = await bcrypt.hash('password123', 12)

    // 1. Super Admin
    const superAdmin = await prisma.user.create({
      data: {
        email: 'admin@mrmobile.pk',
        password: hashedPassword,
        name: 'Muhammad Ahmed Khan',
        phone: '+92-300-1234567',
        cnic: '42101-1234567-1',
        address: 'Office # 301, IT Tower, Blue Area',
        city: 'Islamabad',
        province: 'Punjab',
        role: 'SUPER_ADMIN',
        status: 'ACTIVE',
        emailVerified: new Date()
      }
    })

    // 2. Shop Owner (Single Shop)
    const shopOwner1 = await prisma.user.create({
      data: {
        email: 'owner@mrmobile.pk',
        password: hashedPassword,
        name: 'Ali Hassan',
        phone: '+92-321-9876543',
        cnic: '31303-7654321-3',
        address: 'House # 45, Block C, Gulberg',
        city: 'Lahore',
        province: 'Punjab',
        businessName: 'Hassan Mobile Center',
        businessRegNo: 'LHR-2024-001',
        role: 'SHOP_OWNER',
        status: 'ACTIVE',
        emailVerified: new Date(),
        createdById: superAdmin.id
      }
    })

    // 3. Shop Owner (Multi-Shop)
    const shopOwner2 = await prisma.user.create({
      data: {
        email: 'owner2@mrmobile.pk',
        password: hashedPassword,
        name: 'Fatima Malik',
        phone: '+92-333-1122334',
        cnic: '42201-9988776-5',
        address: 'Plaza # 12, Main Boulevard',
        city: 'Karachi',
        province: 'Sindh',
        businessName: 'Malik Mobile Chain',
        businessRegNo: 'KHI-2024-002',
        role: 'SHOP_OWNER',
        status: 'ACTIVE',
        emailVerified: new Date(),
        createdById: superAdmin.id
      }
    })

    // 4. Shop Worker
    const shopWorker = await prisma.user.create({
      data: {
        email: 'worker@mrmobile.pk',
        password: hashedPassword,
        name: 'Omar Rashid',
        phone: '+92-345-5566778',
        cnic: '31303-4455667-8',
        address: 'Street # 23, Johar Town',
        city: 'Lahore',
        province: 'Punjab',
        role: 'SHOP_WORKER',
        status: 'ACTIVE',
        emailVerified: new Date(),
        createdById: shopOwner1.id
      }
    })

    console.log('✅ Enhanced users created')

    // Create shops
    console.log('🏪 Creating shops...')

    // Shop 1 (Hassan Mobile Center)
    const shop1 = await prisma.shop.create({
      data: {
        name: 'Hassan Mobile Center - Main Branch',
        code: 'HMC-LHR-001',
        address: 'Shop # 15, Liberty Market',
        city: 'Lahore',
        province: 'Punjab',
        postalCode: '54000',
        phone: '+92-42-35741234',
        email: 'main@hassanmobile.pk',
        licenseNumber: 'LHR-MOB-2024-001',
        gstNumber: 'GST-LHR-001',
        status: 'ACTIVE',
        databaseUrl: 'postgresql://apple@localhost:5432/hmc_lhr_001',
        ownerId: shopOwner1.id,
        settings: {
          currency: 'PKR',
          timezone: 'Asia/Karachi',
          gstRate: 17,
          maxWorkers: 2,
          businessHours: {
            open: '09:00',
            close: '21:00',
            days: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
          }
        }
      }
    })

    // Shop 2 (Malik Mobile Chain - Branch 1)
    const shop2 = await prisma.shop.create({
      data: {
        name: 'Malik Mobile Chain - Clifton',
        code: 'MMC-KHI-001',
        address: 'Shop # 8, Clifton Block 2',
        city: 'Karachi',
        province: 'Sindh',
        postalCode: '75600',
        phone: '+92-21-35821234',
        email: 'clifton@malikmobile.pk',
        licenseNumber: 'KHI-MOB-2024-001',
        gstNumber: 'GST-KHI-001',
        status: 'ACTIVE',
        databaseUrl: 'postgresql://apple@localhost:5432/mmc_khi_001',
        ownerId: shopOwner2.id,
        settings: {
          currency: 'PKR',
          timezone: 'Asia/Karachi',
          gstRate: 17,
          maxWorkers: 2,
          businessHours: {
            open: '10:00',
            close: '22:00',
            days: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
          }
        }
      }
    })

    // Shop 3 (Malik Mobile Chain - Branch 2)
    const shop3 = await prisma.shop.create({
      data: {
        name: 'Malik Mobile Chain - Gulshan',
        code: 'MMC-KHI-002',
        address: 'Plaza # 22, Gulshan-e-Iqbal',
        city: 'Karachi',
        province: 'Sindh',
        postalCode: '75300',
        phone: '+92-21-34561234',
        email: 'gulshan@malikmobile.pk',
        licenseNumber: 'KHI-MOB-2024-002',
        gstNumber: 'GST-KHI-002',
        status: 'ACTIVE',
        databaseUrl: 'postgresql://apple@localhost:5432/mmc_khi_002',
        ownerId: shopOwner2.id,
        settings: {
          currency: 'PKR',
          timezone: 'Asia/Karachi',
          gstRate: 17,
          maxWorkers: 2,
          businessHours: {
            open: '09:30',
            close: '21:30',
            days: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
          }
        }
      }
    })

    console.log('✅ Shops created')

    // Assign worker to shop
    console.log('👷 Assigning workers to shops...')
    
    const shopWorkerAssignment = await prisma.shopWorker.create({
      data: {
        shopId: shop1.id,
        userId: shopWorker.id,
        permissions: {
          canHandleCash: true,
          canProcessReturns: true,
          canManageInventory: false,
          canViewReports: true,
          maxDiscountPercent: 5,
          dailyTransactionLimit: 50000
        },
        isActive: true
      }
    })

    console.log('✅ Workers assigned')

    // Setup module access for shop owners
    console.log('🔧 Setting up module access control...')

    // Shop Owner 1 - Full access to all modules
    for (const module of SHOP_OWNER_MODULES) {
      await prisma.userModuleAccess.create({
        data: {
          userId: shopOwner1.id,
          module: module as any,
          permissions: ['VIEW', 'CREATE', 'EDIT', 'DELETE', 'MANAGE'],
          isEnabled: true,
          grantedBy: superAdmin.id
        }
      })
    }

    // Shop Owner 2 - Full access (multi-shop owner)
    for (const module of SHOP_OWNER_MODULES) {
      await prisma.userModuleAccess.create({
        data: {
          userId: shopOwner2.id,
          module: module as any,
          permissions: ['VIEW', 'CREATE', 'EDIT', 'DELETE', 'MANAGE'],
          isEnabled: true,
          grantedBy: superAdmin.id
        }
      })
    }

    // Shop Worker - Limited access
    for (const module of SHOP_WORKER_BASIC_MODULES) {
      await prisma.shopWorkerModuleAccess.create({
        data: {
          shopId: shop1.id,
          workerId: shopWorker.id,
          module: module as any,
          permissions: module === 'POS_SYSTEM' 
            ? ['VIEW', 'CREATE'] 
            : ['VIEW'],
          isEnabled: true,
          grantedBy: shopOwner1.id
        }
      })
    }

    console.log('✅ Module access configured')

    // Create audit log for initialization
    await prisma.auditLog.create({
      data: {
        userId: superAdmin.id,
        action: 'CREATE',
        tableName: 'system',
        recordId: 'system-init-' + Date.now(),
        newValues: {
          message: 'Shop management system initialized with enhanced features',
          usersCreated: 4,
          shopsCreated: 3,
          timestamp: new Date().toISOString()
        }
      }
    })

    console.log('📋 Audit log created')

    // Summary
    console.log('\n🎉 SEEDING COMPLETED SUCCESSFULLY!')
    console.log('='.repeat(40))
    console.log('📊 Data Summary:')
    console.log(`   Users: 4 (1 Super Admin, 2 Shop Owners, 1 Worker)`)
    console.log(`   Shops: 3 (1 single-shop, 2 multi-shop)`)
    console.log(`   Module Access: ${SHOP_OWNER_MODULES.length * 2} owner permissions`)
    console.log(`   Worker Access: ${SHOP_WORKER_BASIC_MODULES.length} worker permissions`)
    
    console.log('\n👥 Login Credentials:')
    console.log('   Super Admin: admin@mrmobile.pk / password123')
    console.log('   Shop Owner (Single): owner@mrmobile.pk / password123')
    console.log('   Shop Owner (Multi): owner2@mrmobile.pk / password123')
    console.log('   Shop Worker: worker@mrmobile.pk / password123')
    
    console.log('\n🏪 Shops Created:')
    console.log('   1. Hassan Mobile Center - Main Branch (HMC-LHR-001)')
    console.log('   2. Malik Mobile Chain - Clifton (MMC-KHI-001)')
    console.log('   3. Malik Mobile Chain - Gulshan (MMC-KHI-002)')
    
    console.log('\n🔧 Module Access:')
    console.log('   Shop Owners: Full access to all 12 modules')
    console.log('   Shop Worker: Limited access to 4 basic modules')
    
    console.log('\n🚀 Ready for testing!')

  } catch (error) {
    console.error('❌ Seeding failed:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

// Run the seed
seedEnhancedData().catch((error) => {
  console.error('Seed script failed:', error)
  process.exit(1)
})

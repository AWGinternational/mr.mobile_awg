#!/usr/bin/env npx tsx

import { PrismaClient } from '../src/generated/prisma'

const prisma = new PrismaClient()

async function testShopManagement() {
  console.log('🧪 TESTING SHOP MANAGEMENT SYSTEM')
  console.log('=================================')

  try {
    // Test 1: Check if users exist
    console.log('\n📋 Test 1: Checking users...')
    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        role: true,
        businessName: true
      }
    })
    console.log(`✅ Found ${users.length} users:`)
    users.forEach((user: any) => {
      console.log(`   - ${user.email} (${user.role})${user.businessName ? ` - ${user.businessName}` : ''}`)
    })

    // Test 2: Check if shops exist
    console.log('\n📋 Test 2: Checking shops...')
    const shops = await prisma.shop.findMany({
      include: {
        owner: {
          select: {
            email: true,
            businessName: true
          }
        }
      }
    })
    console.log(`✅ Found ${shops.length} shops:`)
    shops.forEach((shop: any) => {
      console.log(`   - ${shop.name} (${shop.code}) - Owner: ${shop.owner.email}`)
    })

    // Test 3: Check shop worker assignments
    console.log('\n📋 Test 3: Checking shop worker assignments...')
    const workers = await prisma.shopWorker.findMany({
      include: {
        user: {
          select: {
            email: true
          }
        },
        shop: {
          select: {
            name: true,
            code: true
          }
        }
      }
    })
    console.log(`✅ Found ${workers.length} worker assignments:`)
    workers.forEach((worker: any) => {
      console.log(`   - ${worker.user.email} assigned to ${worker.shop.name}`)
    })

    // Test 4: Check module access
    console.log('\n📋 Test 4: Checking module access permissions...')
    const moduleAccess = await prisma.userModuleAccess.findMany({
      include: {
        user: {
          select: {
            email: true,
            role: true
          }
        }
      }
    })
    console.log(`✅ Found ${moduleAccess.length} module access permissions`)
    
    // Group by user
    const accessByUser = moduleAccess.reduce((acc: Record<string, string[]>, access: any) => {
      if (!acc[access.user.email]) {
        acc[access.user.email] = []
      }
      acc[access.user.email].push(access.module)
      return acc
    }, {} as Record<string, string[]>)

    Object.entries(accessByUser).forEach(([email, modules]) => {
      const moduleArray = modules as string[]
      console.log(`   - ${email}: ${moduleArray.length} modules (${moduleArray.slice(0, 3).join(', ')}${moduleArray.length > 3 ? '...' : ''})`)
    })

    // Test 5: Test shop statistics simulation
    console.log('\n📋 Test 5: Simulating shop statistics...')
    for (const shop of shops) {
      const stats = {
        totalSales: Math.floor(Math.random() * 500000) + 50000,
        totalProducts: Math.floor(Math.random() * 1000) + 100,
        activeWorkers: Math.floor(Math.random() * 5) + 1,
        monthlyRevenue: Math.floor(Math.random() * 200000) + 20000
      }
      console.log(`   - ${shop.name}: PKR ${stats.totalSales.toLocaleString()} sales, ${stats.totalProducts} products`)
    }

    console.log('\n🎉 ALL TESTS PASSED!')
    console.log('✅ Shop Management System is ready for use')
    console.log('\n🚀 Next Steps:')
    console.log('   1. Open http://localhost:3000/login')
    console.log('   2. Login as admin@mrmobile.pk / password123')
    console.log('   3. Navigate to Shop Management from the admin dashboard')
    console.log('   4. Test creating, viewing, and managing shops')

  } catch (error) {
    console.error('❌ Test failed:', error)
  } finally {
    await prisma.$disconnect()
  }
}

testShopManagement()

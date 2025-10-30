#!/usr/bin/env tsx
// Debug User-Shop Access Issue

import { prisma } from '../src/lib/db'

async function debugUserShopAccess() {
  console.log('🔍 Debugging User-Shop Access Issue...')

  try {
    // Get all users
    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        ownedShops: {
          select: {
            id: true,
            name: true,
            code: true,
            status: true
          }
        },
        workerShops: {
          select: {
            shopId: true,
            isActive: true,
            shop: {
              select: {
                id: true,
                name: true,
                code: true,
                status: true
              }
            }
          }
        }
      }
    })

    console.log('\n👥 Users and their shop access:')
    console.log('═════════════════════════════════════')

    for (const user of users) {
      console.log(`\n${user.name} (${user.email}) - ${user.role}`)
      console.log(`  User ID: ${user.id}`)
      
      if (user.role === 'SHOP_OWNER') {
        console.log(`  Owned Shops: ${user.ownedShops.length}`)
        user.ownedShops.forEach(shop => {
          console.log(`    - ${shop.name} (${shop.code}) - ${shop.status}`)
        })
      }
      
      if (user.role === 'SHOP_WORKER') {
        console.log(`  Worker Shops: ${user.workerShops.length}`)
        user.workerShops.forEach(ws => {
          console.log(`    - ${ws.shop.name} (${ws.shop.code}) - Active: ${ws.isActive}`)
        })
      }
    }

    // Get all shops with their owners
    console.log('\n🏪 All shops:')
    console.log('═════════════════════════════════════')
    const shops = await prisma.shop.findMany({
      select: {
        id: true,
        name: true,
        code: true,
        status: true,
        isInitialized: true,
        ownerId: true,
        owner: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true
          }
        }
      }
    })

    shops.forEach(shop => {
      console.log(`\n${shop.name} (${shop.code})`)
      console.log(`  Shop ID: ${shop.id}`)
      console.log(`  Status: ${shop.status}`)
      console.log(`  Initialized: ${shop.isInitialized}`)
      console.log(`  Owner: ${shop.owner.name} (${shop.owner.email})`)
      console.log(`  Owner ID: ${shop.ownerId}`)
    })

    // Test specific user access
    console.log('\n🧪 Testing ABDUL WAHAB access:')
    console.log('═════════════════════════════════════')
    
    const abdulWahab = users.find(u => u.email === 'abdulwahab0156@gmail.com')
    if (abdulWahab) {
      console.log(`✅ Found ABDUL WAHAB: ${abdulWahab.id}`)
      console.log(`   Role: ${abdulWahab.role}`)
      console.log(`   Owned Shops: ${abdulWahab.ownedShops.length}`)
      
      if (abdulWahab.ownedShops.length === 0) {
        console.log('❌ ISSUE: ABDUL WAHAB has no owned shops!')
        
        // Check if there's a shop that should belong to him
        const hisShop = shops.find(s => s.owner.email === 'abdulwahab0156@gmail.com')
        if (hisShop) {
          console.log(`🔧 Found shop that should belong to him: ${hisShop.name}`)
          console.log(`   Current owner ID: ${hisShop.ownerId}`)
          console.log(`   ABDUL WAHAB ID: ${abdulWahab.id}`)
          console.log(`   MATCH: ${hisShop.ownerId === abdulWahab.id ? 'YES' : 'NO'}`)
        }
      } else {
        console.log('✅ ABDUL WAHAB has owned shops:')
        abdulWahab.ownedShops.forEach(shop => {
          console.log(`   - ${shop.name} (${shop.code})`)
        })
      }
    } else {
      console.log('❌ ABDUL WAHAB user not found!')
    }

  } catch (error) {
    console.error('❌ Debug failed:', error)
  } finally {
    await prisma.$disconnect()
  }
}

debugUserShopAccess()

#!/usr/bin/env tsx

import { PrismaClient } from '../src/generated/prisma'

const prisma = new PrismaClient()

async function checkDatabase() {
  try {
    console.log('🔍 Checking current database state...')
    console.log('Database URL:', process.env.DATABASE_URL?.substring(0, 50) + '...')
    
    const shops = await prisma.shop.findMany()
    const users = await prisma.user.findMany()
    
    console.log(`📊 Found ${shops.length} shops`)
    console.log(`👤 Found ${users.length} users`)
    
    if (shops.length > 0) {
      console.log('\n🏪 Shops:')
      shops.forEach((shop, index) => {
        console.log(`  ${index + 1}. ${shop.name} (${shop.code})`)
        console.log(`     Database: ${shop.databaseName}`)
        console.log(`     Status: ${shop.status}`)
        console.log(`     Initialized: ${shop.isInitialized}`)
      })
    }
    
    if (users.length > 0) {
      console.log('\n👥 Users:')
      users.forEach((user, index) => {
        console.log(`  ${index + 1}. ${user.name} (${user.email}) - ${user.role}`)
      })
    }
    
    if (shops.length === 0) {
      console.log('\n❌ No shops found. You need to run user seeding first:')
      console.log('   npm run db:seed')
    }
    
  } catch (error) {
    console.error('❌ Error checking database:', error)
  } finally {
    await prisma.$disconnect()
  }
}

checkDatabase()

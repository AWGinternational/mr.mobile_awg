// Check PostgreSQL database content
import { PrismaClient } from '../src/generated/prisma/index.js'

const prisma = new PrismaClient()

async function checkDatabaseContent() {
  console.log('🔍 Checking PostgreSQL database content...\n')
  
  try {
    // Check connection
    await prisma.$connect()
    console.log('✅ Database connection successful')
    
    // Check users table
    console.log('\n📊 Users table:')
    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        status: true,
        createdAt: true
      }
    })
    
    if (users.length === 0) {
      console.log('❌ No users found in database')
    } else {
      console.log(`✅ Found ${users.length} users:`)
      users.forEach((user, index) => {
        console.log(`  ${index + 1}. ${user.email} (${user.role}) - ${user.status}`)
      })
    }
    
    // Check shops table
    console.log('\n🏪 Shops table:')
    const shops = await prisma.shop.findMany({
      select: {
        id: true,
        name: true,
        code: true,
        status: true,
        ownerId: true
      }
    })
    
    if (shops.length === 0) {
      console.log('❌ No shops found in database')
    } else {
      console.log(`✅ Found ${shops.length} shops:`)
      shops.forEach((shop, index) => {
        console.log(`  ${index + 1}. ${shop.name} (${shop.code}) - ${shop.status}`)
      })
    }
    
    // Check audit logs
    console.log('\n📋 Recent audit logs:')
    const auditLogs = await prisma.auditLog.findMany({
      take: 5,
      orderBy: {
        createdAt: 'desc'
      },
      select: {
        action: true,
        tableName: true,
        createdAt: true,
        newValues: true
      }
    })
    
    if (auditLogs.length === 0) {
      console.log('❌ No audit logs found')
    } else {
      console.log(`✅ Found ${auditLogs.length} recent audit logs:`)
      auditLogs.forEach((log, index) => {
        console.log(`  ${index + 1}. ${log.action} on ${log.tableName} at ${log.createdAt.toISOString()}`)
      })
    }
    
    // Test a simple query to verify connection is working
    console.log('\n🧪 Testing database query...')
    const testResult = await prisma.$queryRaw`SELECT current_database(), current_user, version()`
    console.log('✅ Query successful:', testResult)
    
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error)
    console.error('❌ Database error:', errorMessage)
    
    if (errorMessage.includes('User was denied access')) {
      console.log('\n🔧 Troubleshooting suggestions:')
      console.log('1. Check if PostgreSQL is running: brew services list | grep postgresql')
      console.log('2. Try connecting with different user: postgres, your username, etc.')
      console.log('3. Check database exists: createdb mrmobile_dev')
      console.log('4. Reset and recreate database: npm run db:reset')
    }
  } finally {
    await prisma.$disconnect()
  }
}

checkDatabaseContent().catch(console.error)

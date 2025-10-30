const { PrismaClient } = require('../src/generated/prisma')

const prisma = new PrismaClient()

async function checkShops() {
  try {
    console.log('🔍 Checking available shops...')
    
    const shops = await prisma.shop.findMany({
      select: {
        id: true,
        name: true,
        address: true,
        status: true
      }
    })
    
    console.log('📋 Available shops:')
    shops.forEach((shop, index) => {
      console.log(`${index + 1}. ID: ${shop.id}`)
      console.log(`   Name: ${shop.name}`)
      console.log(`   Address: ${shop.address}`)
      console.log(`   Status: ${shop.status}`)
      console.log('')
    })
    
    if (shops.length > 0) {
      console.log(`✅ Found ${shops.length} shops. Use the first shop ID for testing.`)
      console.log(`🎯 Recommended shop ID: ${shops[0].id}`)
    } else {
      console.log('❌ No shops found in database.')
    }
    
  } catch (error) {
    console.error('❌ Error checking shops:', error)
  } finally {
    await prisma.$disconnect()
  }
}

checkShops()

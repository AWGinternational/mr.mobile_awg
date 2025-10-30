import { PrismaClient } from '../src/generated/prisma/index.js'

const prisma = new PrismaClient()

async function checkOwners() {
  const owners = await prisma.user.findMany({
    where: { 
      role: 'SHOP_OWNER' 
    },
    select: {
      id: true,
      name: true,
      email: true,
      password: true,
      status: true,
      createdAt: true,
      ownedShops: {
        select: {
          id: true,
          name: true,
          code: true,
          status: true
        }
      }
    }
  })

  console.log('\n📋 Shop Owners Credentials:\n')
  console.log('='.repeat(100))
  
  if (owners.length === 0) {
    console.log('❌ No shop owners found in database.')
  } else {
    owners.forEach((owner, index) => {
      console.log(`\n👤 Owner #${index + 1}`)
      console.log(`   ID:       ${owner.id}`)
      console.log(`   Name:     ${owner.name}`)
      console.log(`   Email:    ${owner.email}`)
      console.log(`   Password: ${owner.password}`)
      console.log(`   Status:   ${owner.status}`)
      console.log(`   Created:  ${owner.createdAt.toLocaleString()}`)
      console.log(`   Shops:    ${owner.ownedShops.length}`)
      
      if (owner.ownedShops.length > 0) {
        console.log(`\n   📍 Owned Shops:`)
        owner.ownedShops.forEach(shop => {
          console.log(`      - ${shop.name} (${shop.code}) - ${shop.status}`)
        })
      }
      console.log('\n   ' + '-'.repeat(96))
    })
  }
  
  console.log('\n' + '='.repeat(100))
  console.log(`\n✅ Total Shop Owners: ${owners.length}\n`)
  
  await prisma.$disconnect()
}

checkOwners().catch((error) => {
  console.error('Error checking owners:', error)
  process.exit(1)
})


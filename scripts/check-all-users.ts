import { PrismaClient } from '../src/generated/prisma/index.js'

const prisma = new PrismaClient()

async function checkAllUsers() {
  const users = await prisma.user.findMany({
    select: {
      id: true,
      name: true,
      email: true,
      password: true,
      role: true,
      status: true,
      createdAt: true,
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
          shop: {
            select: {
              name: true,
              code: true
            }
          }
        }
      }
    },
    orderBy: {
      role: 'asc'
    }
  })

  console.log('\n📋 All Users in Database:\n')
  console.log('='.repeat(100))
  
  // Group by role
  const byRole = {
    SUPER_ADMIN: users.filter(u => u.role === 'SUPER_ADMIN'),
    SHOP_OWNER: users.filter(u => u.role === 'SHOP_OWNER'),
    SHOP_WORKER: users.filter(u => u.role === 'SHOP_WORKER')
  }

  if (users.length === 0) {
    console.log('❌ No users found in database.')
  } else {

    // Display Super Admins
    if (byRole.SUPER_ADMIN.length > 0) {
      console.log('\n🔐 SUPER ADMINS:')
      console.log('-'.repeat(100))
      byRole.SUPER_ADMIN.forEach((user, index) => {
        console.log(`\n   ${index + 1}. ${user.name}`)
        console.log(`      Email:    ${user.email}`)
        console.log(`      Password: ${user.password}`)
        console.log(`      Status:   ${user.status}`)
        console.log(`      Created:  ${user.createdAt.toLocaleString()}`)
      })
    }

    // Display Shop Owners
    if (byRole.SHOP_OWNER.length > 0) {
      console.log('\n\n👤 SHOP OWNERS:')
      console.log('-'.repeat(100))
      byRole.SHOP_OWNER.forEach((user, index) => {
        console.log(`\n   ${index + 1}. ${user.name}`)
        console.log(`      Email:    ${user.email}`)
        console.log(`      Password: ${user.password}`)
        console.log(`      Status:   ${user.status}`)
        console.log(`      Created:  ${user.createdAt.toLocaleString()}`)
        if (user.ownedShops.length > 0) {
          console.log(`      Shops:`)
          user.ownedShops.forEach(shop => {
            console.log(`        - ${shop.name} (${shop.code}) - ${shop.status}`)
          })
        } else {
          console.log(`      Shops:    None`)
        }
      })
    }

    // Display Shop Workers
    if (byRole.SHOP_WORKER.length > 0) {
      console.log('\n\n👷 SHOP WORKERS:')
      console.log('-'.repeat(100))
      byRole.SHOP_WORKER.forEach((user, index) => {
        console.log(`\n   ${index + 1}. ${user.name}`)
        console.log(`      Email:    ${user.email}`)
        console.log(`      Password: ${user.password}`)
        console.log(`      Status:   ${user.status}`)
        console.log(`      Created:  ${user.createdAt.toLocaleString()}`)
        if (user.workerShops.length > 0) {
          console.log(`      Works at:`)
          user.workerShops.forEach(ws => {
            console.log(`        - ${ws.shop.name} (${ws.shop.code})`)
          })
        } else {
          console.log(`      Works at: None`)
        }
      })
    }
  }
  
  console.log('\n\n' + '='.repeat(100))
  console.log(`\n📊 Summary:`)
  console.log(`   Super Admins:  ${byRole.SUPER_ADMIN?.length || 0}`)
  console.log(`   Shop Owners:   ${byRole.SHOP_OWNER?.length || 0}`)
  console.log(`   Shop Workers:  ${byRole.SHOP_WORKER?.length || 0}`)
  console.log(`   Total Users:   ${users.length}`)
  console.log('')
  
  await prisma.$disconnect()
}

checkAllUsers().catch((error) => {
  console.error('Error checking users:', error)
  process.exit(1)
})


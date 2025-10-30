// Simple seed script that works in Docker container
// Use the Prisma Client that Next.js server uses
const prisma = require('../server.js').prisma || (() => {
  const { PrismaClient } = require('../node_modules/.prisma/client')
  return new PrismaClient()
})()

async function main() {
  console.log('🌱 Starting database seeding...')

  // Pre-hashed password for 'password123'
  const hashedPassword = '$2b$10$QgVEzbqZw4jXF7VFkmOsy.omuaYNsgSKv2hHiDbMpyjwYdqBXTWla'

  // Create Super Admin
  console.log('👑 Creating Super Admin...')
  const admin = await prisma.user.upsert({
    where: { email: 'admin@mrmobile.com' },
    update: {},
    create: {
      id: 'super-admin-001',
      name: 'Super Admin',
      email: 'admin@mrmobile.com',
      password: hashedPassword,
      role: 'SUPER_ADMIN',
      status: 'ACTIVE', // Set to ACTIVE so user can login immediately
    },
  })
  console.log('✅ Super Admin created:', admin.email)

  // Create Shop 1
  console.log('🏪 Creating Shop 1: Ali Mobile Center...')
  const shop1 = await prisma.shop.upsert({
    where: { id: 'shop-001' },
    update: {},
    create: {
      id: 'shop-001',
      name: 'Ali Mobile Center',
      address: 'Main Market, Lahore',
      phone: '+92-300-1234567',
      email: 'ali.shop@mrmobile.com',
      city: 'Lahore',
      province: 'Punjab',
      country: 'Pakistan',
      taxRate: 18.0,
    },
  })

  // Create Shop Owner
  const owner1 = await prisma.user.upsert({
    where: { email: 'ali@mrmobile.com' },
    update: {},
    create: {
      id: 'user-owner-001',
      name: 'Ali Hassan',
      email: 'ali@mrmobile.com',
      password: hashedPassword,
      role: 'SHOP_OWNER',
      status: 'ACTIVE', // Set to ACTIVE so user can login immediately
    },
  })

  // Link owner to shop
  await prisma.shop.update({
    where: { id: 'shop-001' },
    data: { ownerId: owner1.id },
  })

  // Create Worker 1
  const worker1 = await prisma.user.upsert({
    where: { email: 'ahmed@mrmobile.com' },
    update: {},
    create: {
      id: 'user-worker-001',
      name: 'Ahmed Khan',
      email: 'ahmed@mrmobile.com',
      password: hashedPassword,
      role: 'SHOP_WORKER',
      status: 'ACTIVE', // Set to ACTIVE so user can login immediately
    },
  })

  // Link worker to shop
  await prisma.shopWorker.create({
    data: {
      userId: worker1.id,
      shopId: shop1.id,
    },
  }).catch(() => {}) // Ignore if already exists

  console.log('✅ Shop 1 created with owner and worker')

  console.log('\n═══════════════════════════════════════════════')
  console.log('✨ DATABASE SEEDING COMPLETED SUCCESSFULLY! ✨')
  console.log('═══════════════════════════════════════════════')
  console.log('\n📋 LOGIN CREDENTIALS (Password: password123):')
  console.log('  🔑 Super Admin: admin@mrmobile.com')
  console.log('  👔 Shop Owner: ali@mrmobile.com')
  console.log('  👷 Worker: ahmed@mrmobile.com')
  console.log('\n🚀 READY TO TEST!\n')
}

main()
  .catch((e) => {
    console.error('❌ Error seeding database:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })

import { PrismaClient } from '../src/generated/prisma/index.js'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function initDemoUsers() {
  console.log('🚀 Starting demo user initialization...')

  try {
    // Check if users already exist
    const existingUsers = await prisma.user.count()
    if (existingUsers > 0) {
      console.log(`⚠️  Found ${existingUsers} existing users. Skipping initialization.`)
      console.log('To reinitialize, run: npm run db:reset')
      return
    }

    // Hash passwords
    const hashedPassword = await bcrypt.hash('password123', 12)

    // Create Super Admin
    const superAdmin = await prisma.user.create({
      data: {
        name: 'Super Admin',
        email: 'admin@mrmobile.pk',
        password: hashedPassword,
        phone: '+92-300-1234567',
        role: 'SUPER_ADMIN',
        status: 'ACTIVE',
      },
    })
    console.log('✅ Created Super Admin:', superAdmin.email)

    // Create Shop Owner
    const shopOwner = await prisma.user.create({
      data: {
        name: 'Ahmed Khan',
        email: 'owner@mrmobile.pk',
        password: hashedPassword,
        phone: '+92-300-2345678',
        role: 'SHOP_OWNER',
        status: 'ACTIVE',
      },
    })
    console.log('✅ Created Shop Owner:', shopOwner.email)

    // Create Shop Worker
    const shopWorker = await prisma.user.create({
      data: {
        name: 'Ali Hassan',
        email: 'worker@mrmobile.pk',
        password: hashedPassword,
        phone: '+92-300-3456789',
        role: 'SHOP_WORKER',
        status: 'ACTIVE',
      },
    })
    console.log('✅ Created Shop Worker:', shopWorker.email)

    console.log(`
🎉 Demo data initialization completed successfully!

📋 Created Users:
-------------------
👨‍💼 Super Admin: admin@mrmobile.pk (password: password123)
🏪 Shop Owner: owner@mrmobile.pk (password: password123)
👷 Shop Worker: worker@mrmobile.pk (password: password123)

🔐 All passwords: password123
🌐 Access: http://localhost:3004/login

⚠️  Note: This is demo data for development only.
    `)

  } catch (error) {
    console.error('❌ Error initializing demo users:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

// Run the function
initDemoUsers()
  .then(() => {
    console.log('✅ Demo initialization completed')
    process.exit(0)
  })
  .catch((error) => {
    console.error('❌ Demo initialization failed:', error)
    process.exit(1)
  })

export { initDemoUsers }

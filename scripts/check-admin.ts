#!/usr/bin/env ts-node
/**
 * Check if admin account exists in the database
 */
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function checkAdmin() {
  try {
    console.log('🔍 Checking for admin account...\n')
    
    const admin = await prisma.user.findUnique({
      where: { email: 'admin@mrmobile.com' },
      select: { 
        email: true, 
        name: true, 
        role: true, 
        status: true,
        password: true,
        createdAt: true
      }
    })
    
    if (admin) {
      console.log('✅ Admin account found!')
      console.log('   Email:', admin.email)
      console.log('   Name:', admin.name)
      console.log('   Role:', admin.role)
      console.log('   Status:', admin.status)
      console.log('   Password hash exists:', admin.password ? 'YES ✓' : 'NO ✗')
      console.log('   Created:', admin.createdAt.toISOString())
      console.log('\n🔑 Use these credentials to login:')
      console.log('   ┌─────────────────────────────────┐')
      console.log('   │ Email:    admin@mrmobile.com    │')
      console.log('   │ Password: password123           │')
      console.log('   └─────────────────────────────────┘')
      console.log('\n⚠️  IMPORTANT: Use .com NOT .pk\n')
    } else {
      console.log('❌ Admin account NOT found!')
      console.log('\n💡 Run this command to create it:')
      console.log('   npm run db:setup:complete\n')
    }
  } catch (error) {
    console.error('❌ Error checking admin account:', error)
  } finally {
    await prisma.$disconnect()
  }
}

checkAdmin()

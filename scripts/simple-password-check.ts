// Simple password verification test
import { PrismaClient } from '../src/generated/prisma/index.js'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function simplePasswordCheck() {
  try {
    console.log('Testing admin user password...')
    
    const adminUser = await prisma.user.findUnique({
      where: { email: 'admin@mrmobile.pk' },
      select: { email: true, password: true }
    })
    
    if (!adminUser) {
      console.log('❌ Admin user not found')
      return
    }
    
    console.log('✅ Admin user found')
    console.log('Hash starts with:', adminUser.password.substring(0, 10))
    
    // Test the expected password
    const testPassword = 'password123'
    const isValid = await bcrypt.compare(testPassword, adminUser.password)
    
    console.log(`Password "${testPassword}" is: ${isValid ? 'VALID ✅' : 'INVALID ❌'}`)
    
    // If invalid, test a few other possibilities
    if (!isValid) {
      const otherPasswords = ['admin123', 'password', 'test123']
      for (const pwd of otherPasswords) {
        const test = await bcrypt.compare(pwd, adminUser.password)
        console.log(`Password "${pwd}" is: ${test ? 'VALID ✅' : 'INVALID ❌'}`)
      }
    }
    
  } catch (error) {
    console.error('Error:', error instanceof Error ? error.message : String(error))
  } finally {
    await prisma.$disconnect()
  }
}

simplePasswordCheck()

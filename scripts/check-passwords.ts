// Check user passwords in the database
import { PrismaClient } from '../src/generated/prisma/index.js'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function checkUserPasswords() {
  console.log('🔍 Checking user passwords in database...\n')
  
  try {
    await prisma.$connect()
    console.log('✅ Database connection successful\n')
    
    // Get all users with their passwords
    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        name: true,
        password: true,
        role: true,
        status: true
      }
    })
    
    if (users.length === 0) {
      console.log('❌ No users found in database')
      return
    }
    
    console.log(`Found ${users.length} users. Testing passwords...\n`)
    
    // Test common passwords
    const testPasswords = ['password123', 'admin123', 'test123', 'password', '123456']
    
    for (const user of users) {
      console.log(`👤 User: ${user.email} (${user.role})`)
      console.log(`   Password hash: ${user.password.substring(0, 20)}...`)
      
      // Test each password
      let foundPassword = false
      for (const testPassword of testPasswords) {
        try {
          const isMatch = await bcrypt.compare(testPassword, user.password)
          if (isMatch) {
            console.log(`   ✅ Password is: "${testPassword}"`)
            foundPassword = true
            break
          }
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : String(error)
          console.log(`   ❌ Error testing password "${testPassword}": ${errorMessage}`)
        }
      }
      
      if (!foundPassword) {
        console.log(`   ⚠️  Password not found among common passwords`)
        console.log(`   💡 Try these passwords manually:`)
        testPasswords.forEach(pwd => console.log(`      - ${pwd}`))
      }
      
      console.log('') // Empty line
    }
    
    // Also show the raw bcrypt hash format info
    console.log('📋 Additional Information:')
    console.log('   - All passwords are hashed with bcrypt')
    console.log('   - Salt rounds: 12 (as configured in the demo setup)')
    console.log('   - Demo passwords should be: "password123"')
    console.log('')
    
    // Test the specific admin user password verification
    const adminUser = users.find(u => u.email === 'admin@mrmobile.pk')
    if (adminUser) {
      console.log('🧪 Testing admin@mrmobile.pk with "password123":')
      try {
        const isValid = await bcrypt.compare('password123', adminUser.password)
        console.log(`   Result: ${isValid ? '✅ VALID' : '❌ INVALID'}`)
        
        if (!isValid) {
          console.log('   🔧 Troubleshooting:')
          console.log('   1. Password might be different than expected')
          console.log('   2. Hash might be corrupted')
          console.log('   3. Try re-seeding the database')
        }
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error)
        console.log(`   ❌ Error: ${errorMessage}`)
      }
    }
    
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error)
    console.error('❌ Database error:', errorMessage)
  } finally {
    await prisma.$disconnect()
  }
}

checkUserPasswords().catch(console.error)

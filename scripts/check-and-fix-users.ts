import { PrismaClient } from '../src/generated/prisma'

const prisma = new PrismaClient()

async function checkAndFixUsers() {
  try {
    console.log('🔍 Checking existing users...')
    
    const users = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        status: true
      }
    })
    
    console.log('📋 Existing users:')
    users.forEach((user, index) => {
      console.log(`${index + 1}. ${user.name} (${user.email}) - Role: ${user.role}`)
    })
    
    if (users.length === 0) {
      console.log('❌ No users found. Please run user creation script first.')
      return
    }
    
    // Update the first user to be a shop owner if they're not
    const firstUser = users[0]
    if (firstUser.role !== 'SHOP_OWNER') {
      console.log(`🔄 Updating ${firstUser.email} to SHOP_OWNER role...`)
      
      await prisma.user.update({
        where: { id: firstUser.id },
        data: { role: 'SHOP_OWNER' }
      })
      
      console.log('✅ User role updated to SHOP_OWNER')
    }
    
    // Now create shop
    console.log('🏪 Creating shop...')
    
    const shop = await prisma.shop.create({
      data: {
        name: 'Mr. Mobile Shop',
        code: 'MRM-001',
        address: '123 Main Street, Karachi',
        city: 'Karachi',
        province: 'Sindh',
        postalCode: '75000',
        phone: '+92-21-1234567',
        email: 'shop@mrmobile.pk',
        licenseNumber: 'LIC-001',
        gstNumber: 'GST-001',
        status: 'ACTIVE',
        ownerId: firstUser.id,
        plan: 'BASIC',
        subdomain: 'mrmobile',
        databaseName: 'mrmobile_dev',
        databaseUrl: process.env.DATABASE_URL || 'postgresql://apple@localhost:5432/mrmobile_dev'
      }
    })
    
    console.log(`✅ Shop created: ${shop.name} (${shop.id})`)
    
    // Create some basic categories
    console.log('📁 Creating basic categories...')
    const categories = [
      { name: 'Smartphones', code: 'SMT' },
      { name: 'Accessories', code: 'ACC' },
      { name: 'SIM Cards', code: 'SIM' },
      { name: 'Services', code: 'SRV' }
    ]
    
    for (const category of categories) {
      const createdCategory = await prisma.category.create({
        data: {
          name: category.name,
          code: category.code,
          shopId: shop.id
        }
      })
      console.log(`✅ Category created: ${createdCategory.name}`)
    }
    
    // Create some basic brands
    console.log('🏷️ Creating basic brands...')
    const brands = [
      { name: 'Apple', code: 'APP' },
      { name: 'Samsung', code: 'SAM' },
      { name: 'Xiaomi', code: 'XIA' },
      { name: 'Oppo', code: 'OPP' },
      { name: 'Vivo', code: 'VIV' },
      { name: 'Huawei', code: 'HUA' }
    ]
    
    for (const brand of brands) {
      const createdBrand = await prisma.brand.create({
        data: {
          name: brand.name,
          code: brand.code,
          shopId: shop.id
        }
      })
      console.log(`✅ Brand created: ${createdBrand.name}`)
    }
    
    console.log('')
    console.log('🎉 Setup complete!')
    console.log(`🏪 Shop ID: ${shop.id}`)
    console.log(`👤 Owner: ${firstUser.email}`)
    console.log('✅ You can now test the product import functionality!')
    
  } catch (error) {
    console.error('❌ Error:', error)
  } finally {
    await prisma.$disconnect()
  }
}

checkAndFixUsers()

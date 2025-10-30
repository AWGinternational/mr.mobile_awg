const { PrismaClient } = require('../src/generated/prisma')
const bcrypt = require('bcryptjs')

const prisma = new PrismaClient()

async function setupBasicData() {
  try {
    console.log('🚀 Setting up basic data...')
    
    // Create a shop first
    console.log('🏪 Creating shop...')
    const shop = await prisma.shop.create({
      data: {
        name: 'Test Mobile Shop',
        address: '123 Main Street, Karachi',
        city: 'Karachi',
        province: 'Sindh',
        postalCode: '75000',
        phone: '+92-21-1234567',
        email: 'shop@testmobile.com',
        licenseNumber: 'LIC-001',
        gstNumber: 'GST-001',
        status: 'ACTIVE',
        ownerId: null, // Will update after creating user
        plan: 'BASIC',
        subdomain: 'testshop'
      }
    })
    console.log('✅ Shop created:', shop.id)
    
    // Create a shop owner user
    console.log('👤 Creating shop owner...')
    const hashedPassword = await bcrypt.hash('password123', 10)
    const shopOwner = await prisma.user.create({
      data: {
        name: 'Ahmed Khan',
        email: 'ahmed@testmobile.com',
        password: hashedPassword,
        role: 'SHOP_OWNER',
        isActive: true,
        emailVerified: new Date()
      }
    })
    console.log('✅ Shop owner created:', shopOwner.id)
    
    // Update shop with owner ID
    await prisma.shop.update({
      where: { id: shop.id },
      data: { ownerId: shopOwner.id }
    })
    console.log('✅ Shop updated with owner')
    
    // Create a shop worker user
    console.log('👷 Creating shop worker...')
    const workerHashedPassword = await bcrypt.hash('password123', 10)
    const shopWorker = await prisma.user.create({
      data: {
        name: 'Ali Hassan',
        email: 'ali@testmobile.com',
        password: workerHashedPassword,
        role: 'SHOP_WORKER',
        isActive: true,
        emailVerified: new Date()
      }
    })
    console.log('✅ Shop worker created:', shopWorker.id)
    
    // Create shop worker relationship
    await prisma.shopWorker.create({
      data: {
        userId: shopWorker.id,
        shopId: shop.id,
        position: 'Sales Associate',
        salary: 50000,
        isActive: true,
        permissions: ['PRODUCT_VIEW', 'PRODUCT_EDIT', 'SALE_CREATE', 'CUSTOMER_VIEW']
      }
    })
    console.log('✅ Shop worker relationship created')
    
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
    
    console.log('🎉 Basic data setup complete!')
    console.log('')
    console.log('📋 Summary:')
    console.log(`🏪 Shop ID: ${shop.id}`)
    console.log(`👤 Shop Owner: ${shopOwner.email} (password: password123)`)
    console.log(`👷 Shop Worker: ${shopWorker.email} (password: password123)`)
    console.log('')
    console.log('✅ You can now test the product import functionality!')
    
  } catch (error) {
    console.error('❌ Setup failed:', error)
    console.error('Error details:', error.message)
  } finally {
    await prisma.$disconnect()
  }
}

setupBasicData()

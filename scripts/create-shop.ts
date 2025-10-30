import { PrismaClient } from '../src/generated/prisma'
import { ShopStatus } from '@/types'

const prisma = new PrismaClient()

async function createShop() {
  try {
    console.log('🏪 Creating shop for existing user...')
    
    // Get the first user (shop owner)
    const user = await prisma.user.findFirst({
      where: { role: 'SHOP_OWNER' }
    })
    
    if (!user) {
      console.error('❌ No shop owner found. Please run user creation script first.')
      return
    }
    
    console.log(`👤 Found shop owner: ${user.email}`)
    
    // Check if shop already exists
    const existingShop = await prisma.shop.findFirst({
      where: { ownerId: user.id }
    })
    
    if (existingShop) {
      console.log(`⚠️  Shop already exists: ${existingShop.name} (${existingShop.id})`)
      return
    }
    
    // Create shop
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
        status: ShopStatus.ACTIVE,
        ownerId: user.id,
        plan: 'BASIC',
        subdomain: 'mrmobile',
        databaseName: 'mrmobile_dev'
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
    console.log(`👤 Owner: ${user.email}`)
    console.log('✅ You can now test the product import functionality!')
    
  } catch (error) {
    console.error('❌ Error creating shop:', error)
  } finally {
    await prisma.$disconnect()
  }
}

createShop()

#!/usr/bin/env tsx

import { PrismaClient } from '../src/generated/prisma'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function createShopOwner() {
  try {
    // Create a shop owner user
    const hashedPassword = await bcrypt.hash('owner123', 12)
    
    const shopOwner = await prisma.user.create({
      data: {
        email: 'owner@mrmobile.pk',
        password: hashedPassword,
        name: 'Ahmed Ali Khan',
        phone: '+92-300-9876543',
        cnic: '42101-9876543-2',
        address: 'Shop Owner Address, Lahore',
        city: 'Lahore',
        province: 'Punjab',
        businessName: 'Ali Mobile Center',
        businessRegNo: 'LHR-BUS-2024-001',
        role: 'SHOP_OWNER',
        status: 'ACTIVE',
        emailVerified: new Date()
      }
    })

    console.log('✅ Shop owner created successfully:')
    console.log('📧 Email:', shopOwner.email)
    console.log('🔑 Password: owner123')
    console.log('👤 Name:', shopOwner.name)
    console.log('🆔 ID:', shopOwner.id)
    console.log('🏢 Business:', shopOwner.businessName)
    
    console.log('\n🎯 You can now use this Owner ID in the shop creation form:', shopOwner.id)

  } catch (error) {
    console.error('❌ Error creating shop owner:', error)
  } finally {
    await prisma.$disconnect()
  }
}

createShopOwner()

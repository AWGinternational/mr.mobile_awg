import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function checkData() {
  console.log('\n📊 Checking Categories...')
  const categories = await prisma.category.findMany({
    select: {
      id: true,
      name: true,
      code: true,
      shopId: true,
      isActive: true,
      _count: {
        select: { products: true }
      }
    },
    orderBy: { createdAt: 'desc' },
    take: 20
  })
  
  console.log(`\nTotal categories found: ${categories.length}`)
  console.table(categories.map(c => ({
    name: c.name,
    code: c.code,
    shopId: c.shopId?.substring(0, 8) + '...',
    active: c.isActive,
    products: c._count.products
  })))

  console.log('\n📱 Checking Brands...')
  const brands = await prisma.brand.findMany({
    select: {
      id: true,
      name: true,
      code: true,
      shopId: true,
      isActive: true,
      _count: {
        select: { products: true }
      }
    },
    orderBy: { createdAt: 'desc' },
    take: 20
  })
  
  console.log(`\nTotal brands found: ${brands.length}`)
  console.table(brands.map(b => ({
    name: b.name,
    code: b.code,
    shopId: b.shopId?.substring(0, 8) + '...',
    active: b.isActive,
    products: b._count.products
  })))

  await prisma.$disconnect()
}

checkData().catch(console.error)

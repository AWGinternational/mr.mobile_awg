const { PrismaClient } = require('../../src/generated/prisma');
const prisma = new PrismaClient();

async function checkAuth() {
  console.log('🔍 Checking Authentication State...');
  
  const users = await prisma.user.findMany({
    where: { status: 'ACTIVE' },
    select: {
      id: true,
      email: true,
      role: true,
      name: true,
    }
  });
  
  console.log('\nActive Users:', users.length);
  users.forEach(user => {
    console.log(`  - ${user.email} (${user.role})`);
  });
  
  const shops = await prisma.shop.findMany({
    where: { status: 'ACTIVE' },
    include: {
      _count: {
        select: {
          products: true,
          customers: true
        }
      }
    }
  });
  
  console.log('\nActive Shops:', shops.length);
  shops.forEach(shop => {
    console.log(`  - ${shop.name} (Owner: ${shop.ownerId}) - Products: ${shop._count.products}`);
  });
  
  await prisma.$disconnect();
}

checkAuth().catch(console.error);

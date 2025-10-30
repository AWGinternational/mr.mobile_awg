import { PrismaClient } from '@/generated/prisma'

const connectionStrings = [
  'postgresql://apple:@localhost:5432/mrmobile_dev?schema=public',
  'postgresql://apple@localhost:5432/mrmobile_dev?schema=public',
  'postgresql://postgres:@localhost:5432/mrmobile_dev?schema=public',
  'postgresql://postgres@localhost:5432/mrmobile_dev?schema=public',
  'postgresql://localhost:5432/mrmobile_dev?schema=public'
]

async function testConnections() {
  console.log('🔍 Testing database connections...')
  
  for (let i = 0; i < connectionStrings.length; i++) {
    const url = connectionStrings[i]
    console.log(`\n${i + 1}. Testing: ${url}`)
    
    try {
      const prisma = new PrismaClient({
        datasources: {
          db: {
            url: url
          }
        }
      })
      
      await prisma.$connect()
      const result = await prisma.$queryRaw`SELECT current_database(), current_user;`
      console.log('✅ SUCCESS!', result)
      
      await prisma.$disconnect()
      
      console.log(`\n🎉 Working connection string: ${url}`)
      return url
      
    } catch (error) {
      console.log('❌ FAILED:', (error as Error).message)
    }
  }
  
  console.log('\n💥 All connection attempts failed')
  return null
}

testConnections().then(workingUrl => {
  if (workingUrl) {
    console.log('\n📝 Update your .env files with:')
    console.log(`DATABASE_URL="${workingUrl}"`)
  }
  process.exit(0)
}).catch(console.error)

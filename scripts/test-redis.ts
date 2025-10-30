import { Redis } from '@upstash/redis'

async function testRedis() {
  console.log('🧪 Testing Redis connection...')
  
  const redisUrl = process.env.UPSTASH_REDIS_REST_URL
  const redisToken = process.env.UPSTASH_REDIS_REST_TOKEN
  
  if (!redisUrl || !redisToken) {
    console.log('❌ Redis credentials not found in environment variables')
    console.log('Please set UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN in your .env file')
    return
  }
  
  if (!redisUrl.startsWith('https://')) {
    console.log('❌ Invalid Redis URL format. Must start with https://')
    console.log('Current URL:', redisUrl)
    return
  }
  
  try {
    const redis = new Redis({
      url: redisUrl,
      token: redisToken,
    })
    
    // Test basic operations
    console.log('📝 Testing SET operation...')
    await redis.set('test-key', 'Hello from Mr. Mobile!')
    
    console.log('📖 Testing GET operation...')
    const value = await redis.get('test-key')
    console.log('✅ Retrieved value:', value)
    
    console.log('🗑️ Cleaning up test data...')
    await redis.del('test-key')
    
    console.log('🎉 Redis connection test successful!')
    console.log('✅ Your Redis is properly configured and working!')
    
  } catch (error) {
    console.log('❌ Redis connection failed:')
    console.error(error)
    console.log('\n🔧 Troubleshooting steps:')
    console.log('1. Check your UPSTASH_REDIS_REST_URL format')
    console.log('2. Verify your UPSTASH_REDIS_REST_TOKEN is correct')
    console.log('3. Ensure your Upstash database is active')
    console.log('4. Check your internet connection')
  }
}

// Run the test
if (require.main === module) {
  // Load environment variables
  require('dotenv').config()
  
  testRedis()
    .then(() => {
      console.log('\n🏁 Redis test completed')
      process.exit(0)
    })
    .catch((error) => {
      console.error('💥 Test failed:', error)
      process.exit(1)
    })
}

export { testRedis }

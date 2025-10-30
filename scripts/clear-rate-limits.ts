import { Redis } from '@upstash/redis'

async function clearRateLimits() {
  console.log('🔄 Clearing rate limit data...')
  
  if (!process.env.UPSTASH_REDIS_REST_URL || !process.env.UPSTASH_REDIS_REST_TOKEN) {
    console.log('❌ Redis credentials not found')
    return
  }

  try {
    const redis = new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL,
      token: process.env.UPSTASH_REDIS_REST_TOKEN,
    })

    // Clear rate limiting keys
    const keys = await redis.keys('rl:*')
    console.log(`Found ${keys.length} rate limit keys to clear`)
    
    if (keys.length > 0) {
      await redis.del(...keys)
      console.log('✅ Rate limit data cleared successfully')
    } else {
      console.log('ℹ️ No rate limit data found to clear')
    }
    
  } catch (error) {
    console.error('❌ Failed to clear rate limits:', error)
  }
}

clearRateLimits()

#!/usr/bin/env tsx

/**
 * Rate Limit Test Script
 * Tests if the rate limiting exports are working correctly
 */

async function testRateLimit() {
  console.log('🧪 Testing Rate Limit Module...\n')

  try {
    // Test import
    console.log('1️⃣ Testing import...')
    const { rateLimit } = await import('../src/lib/rate-limit')
    console.log('✅ Rate limit module imported successfully')
    console.log('   rateLimit object:', typeof rateLimit)
    console.log('   rateLimit.login:', typeof rateLimit.login)
    
    // Check if rateLimit.login has check method (safe property access)
    const loginRateLimit = rateLimit.login
    if ('check' in loginRateLimit) {
      console.log('   rateLimit.login.check:', typeof loginRateLimit.check)
    }

    // Test function call
    console.log('\n2️⃣ Testing rate limit check...')
    // Cast to ensure we have the check method available
    const result = await (rateLimit.login as any).check('test-ip-address')
    console.log('✅ Rate limit check successful')
    console.log('   Result:', result)

    console.log('\n🎉 Rate limiting is working correctly!')

  } catch (error) {
    console.error('❌ Rate limit test failed:', error)
    if (error instanceof Error) {
      console.error('Error details:', {
        name: error.name,
        message: error.message,
        stack: error.stack
      })
    } else {
      console.error('Unknown error:', String(error))
    }
  }
}

testRateLimit().catch((error) => {
  console.error('Failed to run test:', error instanceof Error ? error.message : String(error))
})

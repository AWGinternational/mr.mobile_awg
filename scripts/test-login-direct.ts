#!/usr/bin/env tsx

/**
 * Test Login API directly
 */

async function testLogin() {
  console.log('🧪 Testing Login API directly...')
  
  try {
    // Test with admin credentials
    console.log('1️⃣ Testing admin login...')
    const response = await fetch('http://localhost:3000/api/auth/signin/credentials', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        email: 'admin@mrmobile.pk',
        password: 'password123',
        csrfToken: 'test',
        callbackUrl: '/dashboard',
      }),
    })

    console.log('Response status:', response.status)
    console.log('Response headers:', Object.fromEntries(response.headers.entries()))
    
    const responseText = await response.text()
    console.log('Response body (first 500 chars):', responseText.substring(0, 500))

  } catch (error) {
    console.error('❌ Login test failed:', error)
  }
}

testLogin().catch(console.error)

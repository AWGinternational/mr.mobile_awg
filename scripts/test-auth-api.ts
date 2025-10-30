#!/usr/bin/env tsx

/**
 * Test Authentication API Script
 * Tests the authentication flow via HTTP requests to the running server
 */

async function testAuthAPI() {
  const baseUrl = 'http://localhost:3000';
  
  console.log('🧪 Testing Authentication API...\n');

  try {
    // Test 1: Login with valid credentials
    console.log('📝 Test 1: Valid Login');
    const loginResponse = await fetch(`${baseUrl}/api/auth/signin`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: 'admin@mrmobile.pk',
        password: 'password123',
        callbackUrl: '/',
      }),
    });

    console.log('Login Response Status:', loginResponse.status);
    console.log('Login Response Headers:', Object.fromEntries(loginResponse.headers.entries()));
    
    if (loginResponse.ok) {
      const loginData = await loginResponse.text();
      console.log('✅ Login successful!');
      console.log('Response:', loginData.substring(0, 200) + '...');
    } else {
      const errorText = await loginResponse.text();
      console.log('❌ Login failed');
      console.log('Error:', errorText);
    }

  } catch (error) {
    console.error('❌ Error testing authentication:', error);
  }

  // Test 2: Check if our API debug endpoint works
  try {
    console.log('\n📝 Test 2: Debug Environment');
    const debugResponse = await fetch(`${baseUrl}/api/debug-env`);
    
    if (debugResponse.ok) {
      const debugData = await debugResponse.json();
      console.log('✅ Debug endpoint working');
      console.log('Environment check:', debugData);
    } else {
      console.log('❌ Debug endpoint failed');
    }
  } catch (error) {
    console.error('❌ Error testing debug endpoint:', error);
  }

  // Test 3: Check if database connection works in API context
  try {
    console.log('\n📝 Test 3: Database Connection via API');
    const usersResponse = await fetch(`${baseUrl}/api/users`);
    
    if (usersResponse.ok) {
      const usersData = await usersResponse.json();
      console.log('✅ Users API working');
      console.log('Users found:', usersData.length || 'Unknown count');
    } else {
      const errorText = await usersResponse.text();
      console.log('❌ Users API failed');
      console.log('Error:', errorText);
    }
  } catch (error) {
    console.error('❌ Error testing users API:', error);
  }
}

// Run the test
testAuthAPI().then(() => {
  console.log('\n🏁 Authentication API test completed');
}).catch(console.error);

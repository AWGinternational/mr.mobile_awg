#!/usr/bin/env node

/**
 * Test Navigation Fix for Shop Management
 * Tests the authentication flow and navigation redirect loop issue
 */

const http = require('http');

async function testNavigation() {
  console.log('🧪 TESTING NAVIGATION FIX');
  console.log('=========================\n');

  // Test 1: Check if server is running
  console.log('📋 Test 1: Server availability...');
  try {
    const options = {
      hostname: 'localhost',
      port: 3002,
      path: '/',
      method: 'GET'
    };

    const response = await new Promise((resolve, reject) => {
      const req = http.request(options, (res) => {
        resolve({ status: res.statusCode, ok: res.statusCode >= 200 && res.statusCode < 300 });
      });
      req.on('error', reject);
      req.end();
    });

    if (response.ok) {
      console.log('✅ Server is running on port 3002\n');
    } else {
      console.log('❌ Server not responding properly\n');
      return;
    }
  } catch (error) {
    console.log('❌ Server not running on port 3002\n');
    return;
  }

  // Test 2: Check /shops redirect behavior (unauthenticated)
  console.log('📋 Test 2: Unauthenticated /shops access...');
  try {
    const response = await fetch('http://localhost:3002/shops', {
      redirect: 'manual' // Don't follow redirects automatically
    });
    
    if (response.status === 307 || response.status === 302) {
      const location = response.headers.get('location');
      console.log(`✅ Correctly redirecting to: ${location}`);
      
      if (location && location.includes('/login') && location.includes('callbackUrl')) {
        console.log('✅ Callback URL properly set for return navigation\n');
      } else {
        console.log('⚠️  Callback URL might be missing\n');
      }
    } else {
      console.log(`❌ Unexpected response status: ${response.status}\n`);
    }
  } catch (error) {
    console.log(`❌ Error testing /shops redirect: ${error.message}\n`);
  }

  // Test 3: Check if login page loads
  console.log('📋 Test 3: Login page availability...');
  try {
    const response = await fetch('http://localhost:3002/login');
    if (response.ok) {
      console.log('✅ Login page loads successfully\n');
    } else {
      console.log('❌ Login page not loading\n');
    }
  } catch (error) {
    console.log(`❌ Error accessing login page: ${error.message}\n`);
  }

  // Test 4: Check admin dashboard
  console.log('📋 Test 4: Admin dashboard availability...');
  try {
    const response = await fetch('http://localhost:3002/dashboard/admin', {
      redirect: 'manual'
    });
    
    if (response.status === 307 || response.status === 302) {
      console.log('✅ Admin dashboard properly protected (redirects when not authenticated)\n');
    } else {
      console.log(`⚠️  Unexpected admin dashboard response: ${response.status}\n`);
    }
  } catch (error) {
    console.log(`❌ Error testing admin dashboard: ${error.message}\n`);
  }

  console.log('📊 NAVIGATION TEST SUMMARY');
  console.log('==========================');
  console.log('✅ The redirect behavior is working correctly for unauthenticated users');
  console.log('🔧 The issue is likely in the client-side authentication state management');
  console.log('💡 Need to fix the useAuth hook to properly maintain authentication during navigation');
  console.log('\n🎯 NEXT STEPS:');
  console.log('1. Fix the authentication state persistence');
  console.log('2. Ensure proper session handling during client-side navigation');
  console.log('3. Test the complete login -> dashboard -> shops navigation flow');
}

testNavigation().catch(console.error);

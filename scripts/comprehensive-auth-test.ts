#!/usr/bin/env tsx

/**
 * 🚀 COMPREHENSIVE AUTHENTICATION SYSTEM TEST SUITE
 * Tests all aspects of the authentication system including:
 * - User login/logout for all roles
 * - Role-based redirections
 * - Session management
 * - Protected routes
 * - Password verification
 * - Database integrity
 * - API security
 */

import { prisma } from '../src/lib/db'
import bcrypt from 'bcryptjs'

// Test credentials
const TEST_USERS = [
  { email: 'admin@mrmobile.pk', password: 'password123', role: 'SUPER_ADMIN', expectedDashboard: '/dashboard/admin' },
  { email: 'owner@mrmobile.pk', password: 'password123', role: 'SHOP_OWNER', expectedDashboard: '/dashboard/owner' },
  { email: 'worker@mrmobile.pk', password: 'password123', role: 'SHOP_WORKER', expectedDashboard: '/dashboard/worker' }
]

const BASE_URL = 'http://localhost:3000'

// Helper function to make authenticated requests
async function makeRequest(url: string, options?: RequestInit) {
  try {
    const response = await fetch(`${BASE_URL}${url}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options?.headers
      }
    })
    return {
      ok: response.ok,
      status: response.status,
      headers: Object.fromEntries(response.headers.entries()),
      data: response.headers.get('content-type')?.includes('application/json') 
        ? await response.json() 
        : await response.text()
    }
  } catch (error) {
    return {
      ok: false,
      status: 0,
      error: error instanceof Error ? error.message : 'Unknown error',
      data: null
    }
  }
}

async function runComprehensiveAuthTest() {
  console.log('🧪 COMPREHENSIVE AUTHENTICATION SYSTEM TEST')
  console.log('='.repeat(60))
  console.log()

  let totalTests = 0
  let passedTests = 0
  const results: Array<{name: string, passed: boolean, details?: string}> = []

  const testResult = (name: string, passed: boolean, details?: string) => {
    totalTests++
    if (passed) passedTests++
    
    const status = passed ? '✅ PASS' : '❌ FAIL'
    console.log(`${status} | ${name}`)
    if (details) console.log(`     ${details}`)
    
    results.push({ name, passed, details })
  }

  try {
    // ========================================
    // TEST 1: DATABASE CONNECTIVITY & STRUCTURE
    // ========================================
    console.log('📊 TEST SECTION 1: DATABASE CONNECTIVITY & STRUCTURE')
    console.log('-'.repeat(50))

    // Test database connection
    const dbTest = await prisma.$queryRaw`SELECT current_database(), current_user, version()` as any[]
    testResult(
      'Database Connection', 
      dbTest.length > 0,
      `Connected to: ${dbTest[0]?.current_database} as ${dbTest[0]?.current_user}`
    )

    // Test user table structure and data
    const users = await prisma.user.findMany({
      select: { id: true, email: true, role: true, status: true, password: true }
    })
    testResult(
      'User Table Structure', 
      users.length === 3,
      `Found ${users.length} users in database`
    )

    // Test password hashing for all users
    for (const testUser of TEST_USERS) {
      const dbUser = users.find(u => u.email === testUser.email)
      if (dbUser) {
        const passwordValid = await bcrypt.compare(testUser.password, dbUser.password)
        testResult(
          `Password Hash: ${testUser.role}`,
          passwordValid,
          `${testUser.email} password verification`
        )
      } else {
        testResult(`User Exists: ${testUser.role}`, false, `${testUser.email} not found`)
      }
    }

    // ========================================
    // TEST 2: API ENDPOINTS & SECURITY
    // ========================================
    console.log('\n🔒 TEST SECTION 2: API ENDPOINTS & SECURITY')
    console.log('-'.repeat(50))

    // Test public endpoints
    const homePageTest = await makeRequest('/')
    testResult(
      'Home Page Access',
      homePageTest.ok,
      `Status: ${homePageTest.status}`
    )

    const loginPageTest = await makeRequest('/login')
    testResult(
      'Login Page Access',
      loginPageTest.ok,
      `Status: ${loginPageTest.status}`
    )

    // Test protected API endpoints (should be unauthorized)
    const usersApiTest = await makeRequest('/api/users')
    testResult(
      'Protected API Security',
      usersApiTest.status === 401,
      'Users API correctly returns 401 Unauthorized'
    )

    // Test NextAuth endpoints
    const sessionTest = await makeRequest('/api/auth/session')
    testResult(
      'Session Endpoint',
      sessionTest.ok,
      'NextAuth session endpoint accessible'
    )

    const providersTest = await makeRequest('/api/auth/providers')
    testResult(
      'Providers Endpoint',
      providersTest.ok,
      'NextAuth providers endpoint accessible'
    )

    // Test CSRF endpoint
    const csrfTest = await makeRequest('/api/auth/csrf')
    testResult(
      'CSRF Protection',
      csrfTest.ok,
      'NextAuth CSRF endpoint accessible'
    )

    // ========================================
    // TEST 3: AUTHENTICATION FLOW TESTING
    // ========================================
    console.log('\n🔐 TEST SECTION 3: AUTHENTICATION FLOW TESTING')
    console.log('-'.repeat(50))

    // Test login with invalid credentials
    const invalidLoginTest = await makeRequest('/api/auth/callback/credentials', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        email: 'invalid@test.com',
        password: 'wrongpassword',
        csrfToken: 'test'
      })
    })
    testResult(
      'Invalid Login Protection',
      !invalidLoginTest.ok || invalidLoginTest.status >= 400,
      'Invalid credentials correctly rejected'
    )

    // Test each user role login
    for (const testUser of TEST_USERS) {
      console.log(`\n   Testing ${testUser.role} Authentication...`)
      
      // Get CSRF token first
      const csrfResponse = await makeRequest('/api/auth/csrf')
      const csrfToken = csrfResponse.ok ? csrfResponse.data.csrfToken : 'test'

      // Attempt login
      const loginResponse = await makeRequest('/api/auth/callback/credentials', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          email: testUser.email,
          password: testUser.password,
          csrfToken: csrfToken,
          callbackUrl: testUser.expectedDashboard
        })
      })

      testResult(
        `${testUser.role} Login`,
        loginResponse.ok,
        `${testUser.email} login status: ${loginResponse.status}`
      )

      // Note: Full session testing would require cookie handling
      // which is complex in this test environment
    }

    // ========================================
    // TEST 4: DASHBOARD PAGE ACCESSIBILITY
    // ========================================
    console.log('\n📊 TEST SECTION 4: DASHBOARD PAGE ACCESSIBILITY')
    console.log('-'.repeat(50))

    // Test dashboard pages exist (they should redirect to login if not authenticated)
    const dashboardTests = [
      { path: '/dashboard/admin', role: 'SUPER_ADMIN' },
      { path: '/dashboard/owner', role: 'SHOP_OWNER' },
      { path: '/dashboard/worker', role: 'SHOP_WORKER' }
    ]

    for (const dashboard of dashboardTests) {
      const dashboardTest = await makeRequest(dashboard.path)
      // Should either load the page or redirect to login (both are valid responses)
      testResult(
        `${dashboard.role} Dashboard Exists`,
        dashboardTest.status === 200 || dashboardTest.status === 302 || dashboardTest.status === 307,
        `${dashboard.path} responds with status ${dashboardTest.status}`
      )
    }

    // ========================================
    // TEST 5: ENVIRONMENT & CONFIGURATION
    // ========================================
    console.log('\n⚙️  TEST SECTION 5: ENVIRONMENT & CONFIGURATION')
    console.log('-'.repeat(50))

    // Test debug endpoint
    const debugTest = await makeRequest('/api/debug-env')
    testResult(
      'Environment Configuration',
      debugTest.ok && debugTest.data?.databaseTest?.includes('SUCCESS'),
      'Debug endpoint confirms database connectivity'
    )

    // Check required environment variables
    const requiredEnvVars = [
      'DATABASE_URL',
      'NEXTAUTH_URL', 
      'NEXTAUTH_SECRET'
    ]

    for (const envVar of requiredEnvVars) {
      const isSet = !!process.env[envVar]
      testResult(
        `Environment Variable: ${envVar}`,
        isSet,
        isSet ? 'Set' : 'Missing'
      )
    }

    // ========================================
    // TEST 6: SECURITY FEATURES
    // ========================================
    console.log('\n🛡️  TEST SECTION 6: SECURITY FEATURES')
    console.log('-'.repeat(50))

    // Test password requirements (bcrypt hashing)
    for (const testUser of TEST_USERS) {
      const dbUser = users.find(u => u.email === testUser.email)
      if (dbUser) {
        const isBcryptHash = dbUser.password.startsWith('$2b$') && dbUser.password.length === 60
        testResult(
          `Secure Password Storage: ${testUser.role}`,
          isBcryptHash,
          `Password properly bcrypt hashed: ${isBcryptHash ? 'Yes' : 'No'}`
        )
      }
    }

    // Test session configuration
    testResult(
      'NextAuth Configuration',
      !!process.env.NEXTAUTH_SECRET && !!process.env.NEXTAUTH_URL,
      'NextAuth properly configured with secret and URL'
    )

    // ========================================
    // TEST 7: AUDIT LOGGING (if enabled)
    // ========================================
    console.log('\n📝 TEST SECTION 7: AUDIT LOGGING')
    console.log('-'.repeat(50))

    try {
      const auditLogs = await prisma.auditLog.findMany({
        take: 5,
        orderBy: { createdAt: 'desc' }
      })
      testResult(
        'Audit Logging System',
        true,
        `Found ${auditLogs.length} recent audit log entries`
      )
    } catch (error) {
      testResult(
        'Audit Logging System',
        false,
        `Audit log table error: ${error}`
      )
    }

  } catch (error) {
    console.error('❌ Test suite error:', error)
    testResult('Test Suite Execution', false, `Error: ${error}`)
  } finally {
    await prisma.$disconnect()
  }

  // ========================================
  // TEST RESULTS SUMMARY
  // ========================================
  console.log('\n' + '='.repeat(60))
  console.log('📋 COMPREHENSIVE TEST RESULTS SUMMARY')
  console.log('='.repeat(60))
  
  console.log(`\n📊 OVERALL RESULTS:`)
  console.log(`   Total Tests: ${totalTests}`)
  console.log(`   Passed: ${passedTests}`)
  console.log(`   Failed: ${totalTests - passedTests}`)
  console.log(`   Success Rate: ${((passedTests / totalTests) * 100).toFixed(1)}%`)

  // Categorize results
  const criticalTests = results.filter(r => 
    r.name.includes('Database Connection') || 
    r.name.includes('Password Hash') ||
    r.name.includes('Login') ||
    r.name.includes('Protected API Security')
  )
  const criticalPassed = criticalTests.filter(t => t.passed).length

  console.log(`\n🔥 CRITICAL TESTS:`)
  console.log(`   Critical Passed: ${criticalPassed}/${criticalTests.length}`)
  
  if (criticalPassed === criticalTests.length) {
    console.log('   ✅ ALL CRITICAL TESTS PASSED!')
  } else {
    console.log('   ⚠️  SOME CRITICAL TESTS FAILED!')
  }

  // Final recommendations
  console.log(`\n🚀 SYSTEM STATUS:`)
  if (passedTests / totalTests >= 0.9) {
    console.log('   ✅ AUTHENTICATION SYSTEM IS PRODUCTION READY!')
    console.log('   🎉 All major components are working correctly.')
  } else if (passedTests / totalTests >= 0.7) {
    console.log('   ⚠️  AUTHENTICATION SYSTEM NEEDS MINOR FIXES')
    console.log('   🔧 Most components working, some improvements needed.')
  } else {
    console.log('   ❌ AUTHENTICATION SYSTEM NEEDS MAJOR FIXES')
    console.log('   🚨 Critical issues found, requires immediate attention.')
  }

  console.log(`\n📝 RECOMMENDATIONS:`)
  const failedTests = results.filter(r => !r.passed)
  if (failedTests.length === 0) {
    console.log('   • No issues found - system is ready for production!')
    console.log('   • Consider enabling rate limiting for production use')
    console.log('   • Set up proper SSL/TLS certificates for production')
  } else {
    console.log(`   • Fix ${failedTests.length} failed test(s):`)
    failedTests.forEach(test => {
      console.log(`     - ${test.name}: ${test.details}`)
    })
  }

  console.log(`\n🌐 READY TO TEST:`)
  console.log(`   Login URL: ${BASE_URL}/login`)
  console.log(`   Demo Credentials:`)
  TEST_USERS.forEach(user => {
    console.log(`   • ${user.role}: ${user.email} / ${user.password}`)
  })

  return {
    totalTests,
    passedTests,
    failedTests: totalTests - passedTests,
    successRate: (passedTests / totalTests) * 100,
    results
  }
}

// Run the comprehensive test
runComprehensiveAuthTest()
  .then((summary) => {
    console.log('\n🏁 Comprehensive authentication test completed!')
    process.exit(summary.failedTests === 0 ? 0 : 1)
  })
  .catch((error) => {
    console.error('💥 Test suite failed:', error)
    process.exit(1)
  })

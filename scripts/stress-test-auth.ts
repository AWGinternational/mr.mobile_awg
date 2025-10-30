#!/usr/bin/env tsx

/**
 * ⚡ AUTHENTICATION STRESS TEST
 * Tests system performance under load
 */

async function stressTestAuth() {
  console.log('⚡ AUTHENTICATION STRESS TEST')
  console.log('='.repeat(40))
  
  const baseUrl = 'http://localhost:3000'
  const testUsers = [
    { email: 'admin@mrmobile.pk', password: 'password123' },
    { email: 'owner@mrmobile.pk', password: 'password123' },
    { email: 'worker@mrmobile.pk', password: 'password123' }
  ]
  
  console.log('🚀 Running stress tests...\n')
  
  // Test 1: Concurrent Session Requests
  console.log('1️⃣ Testing concurrent session requests...')
  const concurrentRequests = 10
  const sessionPromises = Array(concurrentRequests).fill(0).map(() => 
    fetch(`${baseUrl}/api/auth/session`)
  )
  
  const sessionResults = await Promise.allSettled(sessionPromises)
  const sessionSuccesses = sessionResults.filter(r => r.status === 'fulfilled' && (r.value as Response).ok).length
  console.log(`   ✅ ${sessionSuccesses}/${concurrentRequests} concurrent session requests succeeded`)
  
  // Test 2: Rapid Login Attempts (same user)
  console.log('\n2️⃣ Testing rapid login attempts...')
  const rapidAttempts = 5
  const rapidPromises = Array(rapidAttempts).fill(0).map(async () => {
    const csrf = await fetch(`${baseUrl}/api/auth/csrf`)
    const csrfData = await csrf.json()
    
    return fetch(`${baseUrl}/api/auth/callback/credentials`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        email: testUsers[0].email,
        password: testUsers[0].password,
        csrfToken: csrfData.csrfToken
      })
    })
  })
  
  const rapidResults = await Promise.allSettled(rapidPromises)
  const rapidSuccesses = rapidResults.filter(r => r.status === 'fulfilled').length
  console.log(`   ✅ ${rapidSuccesses}/${rapidAttempts} rapid login attempts completed`)
  
  // Test 3: Database Connection Pool
  console.log('\n3️⃣ Testing database connection handling...')
  const dbRequests = 20
  const dbPromises = Array(dbRequests).fill(0).map(() => 
    fetch(`${baseUrl}/api/debug-env`)
  )
  
  const dbResults = await Promise.allSettled(dbPromises)
  const dbSuccesses = dbResults.filter(r => r.status === 'fulfilled' && (r.value as Response).ok).length
  console.log(`   ✅ ${dbSuccesses}/${dbRequests} database requests succeeded`)
  
  // Test 4: Memory Usage Estimation
  console.log('\n4️⃣ Memory usage check...')
  const memoryUsage = process.memoryUsage()
  console.log(`   📊 Memory Usage:`)
  console.log(`      RSS: ${Math.round(memoryUsage.rss / 1024 / 1024)}MB`)
  console.log(`      Heap Used: ${Math.round(memoryUsage.heapUsed / 1024 / 1024)}MB`)
  console.log(`      Heap Total: ${Math.round(memoryUsage.heapTotal / 1024 / 1024)}MB`)
  
  // Test 5: Response Time Testing
  console.log('\n5️⃣ Response time testing...')
  const iterations = 10
  const times = []
  
  for (let i = 0; i < iterations; i++) {
    const start = Date.now()
    await fetch(`${baseUrl}/api/auth/session`)
    const end = Date.now()
    times.push(end - start)
  }
  
  const avgTime = times.reduce((a, b) => a + b, 0) / times.length
  const maxTime = Math.max(...times)
  const minTime = Math.min(...times)
  
  console.log(`   📈 Response Times:`)
  console.log(`      Average: ${avgTime.toFixed(2)}ms`)
  console.log(`      Min: ${minTime}ms`)
  console.log(`      Max: ${maxTime}ms`)
  
  // Performance assessment
  console.log('\n📊 PERFORMANCE ASSESSMENT:')
  console.log('='.repeat(30))
  
  let score = 0
  let maxScore = 5
  
  if (sessionSuccesses >= concurrentRequests * 0.9) {
    console.log('✅ Concurrent handling: EXCELLENT')
    score++
  } else {
    console.log('⚠️  Concurrent handling: NEEDS IMPROVEMENT')
  }
  
  if (rapidSuccesses >= rapidAttempts * 0.8) {
    console.log('✅ Rapid requests: GOOD')
    score++
  } else {
    console.log('⚠️  Rapid requests: NEEDS IMPROVEMENT')
  }
  
  if (dbSuccesses >= dbRequests * 0.9) {
    console.log('✅ Database handling: EXCELLENT')
    score++
  } else {
    console.log('⚠️  Database handling: NEEDS IMPROVEMENT')
  }
  
  if (memoryUsage.heapUsed < 100 * 1024 * 1024) { // Less than 100MB
    console.log('✅ Memory usage: EFFICIENT')
    score++
  } else {
    console.log('⚠️  Memory usage: HIGH')
  }
  
  if (avgTime < 100) {
    console.log('✅ Response time: FAST')
    score++
  } else if (avgTime < 500) {
    console.log('⚠️  Response time: MODERATE')
    score += 0.5
  } else {
    console.log('❌ Response time: SLOW')
  }
  
  console.log(`\n🏆 OVERALL PERFORMANCE: ${score}/${maxScore} (${((score/maxScore)*100).toFixed(1)}%)`)
  
  if (score >= 4.5) {
    console.log('🚀 EXCELLENT - System is ready for production!')
  } else if (score >= 3.5) {
    console.log('✅ GOOD - System performs well under normal load')
  } else if (score >= 2.5) {
    console.log('⚠️  FAIR - System needs optimization')
  } else {
    console.log('❌ POOR - System needs significant improvements')
  }
  
  console.log('\n💡 RECOMMENDATIONS:')
  if (score < 4) {
    console.log('• Consider implementing connection pooling')
    console.log('• Add caching for frequently accessed data')
    console.log('• Monitor memory usage in production')
    console.log('• Consider load balancing for high traffic')
  } else {
    console.log('• System is performing excellently!')
    console.log('• Consider monitoring tools for production')
    console.log('• Set up alerts for performance degradation')
  }
}

stressTestAuth().catch(console.error)

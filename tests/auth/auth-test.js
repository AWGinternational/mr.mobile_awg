// Test authentication flow
const testAuth = async () => {
  console.log('Testing authentication with demo accounts...')
  
  const testAccounts = [
    { email: 'admin@mrmobile.pk', role: 'SUPER_ADMIN' },
    { email: 'owner@karachi.shop', role: 'SHOP_OWNER' },
    { email: 'worker@karachi.shop', role: 'SHOP_WORKER' }
  ]
  
  for (const account of testAccounts) {
    try {
      const response = await fetch('/api/auth/signin/credentials', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: account.email,
          password: 'demo123',
          redirect: false
        })
      })
      
      const result = await response.json()
      console.log(`${account.email} (${account.role}):`, result.ok ? '✅ Success' : '❌ Failed', result)
    } catch (error) {
      console.log(`${account.email}:`, '❌ Error', error)
    }
  }
}

// Run test
testAuth()

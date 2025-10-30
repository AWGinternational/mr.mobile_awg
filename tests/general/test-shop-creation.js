#!/usr/bin/env node

// Test shop creation with valid data
const testShopCreation = async () => {
  const shopData = {
    name: "Test Mobile Shop",
    address: "Main Market, Commercial Area",
    city: "Lahore",
    province: "Punjab",
    postalCode: "54000",
    phone: "+92-300-1234567",
    email: "test@mrmobile.pk",
    licenseNumber: "LHR-TRADE-2024-001",
    gstNumber: "17-PKR-GST-001-2024",
    ownerId: "cmd36f5k90002oh95bfzmcapp", // Ali Hassan
    settings: {
      currency: "PKR",
      timezone: "Asia/Karachi",
      gstRate: 17,
      maxWorkers: 2,
      businessHours: {
        open: "09:00",
        close: "21:00",
        days: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"]
      }
    }
  }

  try {
    console.log('🧪 Testing shop creation API...')
    console.log('📝 Shop data:', JSON.stringify(shopData, null, 2))
    
    const response = await fetch('http://localhost:3001/api/shops', {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        // Note: In real app, this would need authentication
      },
      body: JSON.stringify(shopData)
    })

    console.log('\n📊 Response Status:', response.status)
    console.log('📊 Response Status Text:', response.statusText)

    const result = await response.json()
    console.log('📊 Response Body:', JSON.stringify(result, null, 2))

    if (response.ok) {
      console.log('\n✅ Shop creation API test successful!')
    } else {
      console.log('\n❌ Shop creation API test failed')
      if (response.status === 401) {
        console.log('🔒 Authentication required - this is expected')
        console.log('💡 Try this test after logging in as SUPER_ADMIN')
      }
    }

  } catch (error) {
    console.error('\n❌ Error testing API:', error.message)
  }
}

testShopCreation()

console.log('\n📋 Manual Testing Steps:')
console.log('1. Open http://localhost:3001/login')
console.log('2. Login as admin@mrmobile.pk / password123')
console.log('3. Go to Shop Management')
console.log('4. Click "Add New Shop"')
console.log('5. Fill the form with the test data above')
console.log('6. Select "Ali Hassan" as shop owner')
console.log('7. Submit and verify it works')

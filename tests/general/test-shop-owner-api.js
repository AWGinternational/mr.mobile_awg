/**
 * Test Shop Owner Creation API
 * This script tests the POST /api/users/shop-owners endpoint
 */

const testShopOwnerCreation = async () => {
  console.log('🧪 Testing Shop Owner Creation API...\n');

  const testData = {
    name: "Test Owner",
    email: "testowner@example.com",
    phone: "+92-300-1234567",
    cnic: "42101-1234567-8",
    address: "Test Address",
    city: "Lahore",
    province: "Punjab",
    businessName: "Test Mobile Shop",
    password: "temp123"
  };

  try {
    console.log('📤 Sending POST request to /api/users/shop-owners');
    console.log('Data:', JSON.stringify(testData, null, 2));

    const response = await fetch('http://localhost:3001/api/users/shop-owners', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(testData)
    });

    console.log('\n📊 Response Status:', response.status);
    console.log('📊 Response Status Text:', response.statusText);

    const result = await response.json();
    console.log('📊 Response Body:', JSON.stringify(result, null, 2));

    if (response.ok) {
      console.log('\n✅ Shop Owner Creation API is working correctly!');
    } else {
      console.log('\n❌ Shop Owner Creation API returned an error');
      if (response.status === 403) {
        console.log('🔒 This is expected - authentication is required');
        console.log('💡 Try this test after logging in as SUPER_ADMIN');
      }
    }

  } catch (error) {
    console.error('\n❌ Error testing API:', error);
  }
};

// Note: This test will fail with 403 without authentication
// But it confirms the endpoint exists and responds correctly
testShopOwnerCreation();

console.log('\n📋 Manual Testing Steps:');
console.log('1. Login as admin@mrmobile.pk / admin123');
console.log('2. Go to Shop Management');
console.log('3. Click "Create New Shop"');
console.log('4. Click "Create New Shop Owner"');
console.log('5. Fill the form with the data from the error message');
console.log('6. Submit and verify it works\n');

console.log('🎯 Expected Result: Shop owner should be created successfully!');

// Test Products API to debug the "Failed to load products" error
console.log('🧪 Testing Products API...');

async function testProductsAPI() {
  try {
    // Test direct API call
    const response = await fetch('http://localhost:3000/api/products');
    console.log('Response status:', response.status);
    console.log('Response headers:', [...response.headers.entries()]);
    
    if (response.ok) {
      const data = await response.json();
      console.log('✅ Products API Success:', data);
    } else {
      const errorText = await response.text();
      console.log('❌ Products API Error:', response.status, errorText);
    }
  } catch (error) {
    console.error('❌ Network Error:', error.message);
  }
}

testProductsAPI();

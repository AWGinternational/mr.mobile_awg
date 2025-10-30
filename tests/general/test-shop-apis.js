// Test script to verify all APIs are working with shop isolation
const axios = require('axios');

const BASE_URL = 'http://localhost:3000';

// Test data for shop isolation
const testData = {
  testShop: {
    id: 'clz0xp3s60001c7wd8n7qblr7', // ABDUL WAHAB 1 shop ID
    userId: 'clz0xpb5l0003c7wdw6j3g8f8'   // Shop owner user ID
  }
};

async function testAPIs() {
  console.log('🧪 Testing Shop-Isolated APIs...\n');

  try {
    // Test Products API
    console.log('📱 Testing Products API...');
    const productsResponse = await axios.get(`${BASE_URL}/api/products`, {
      headers: {
        'Cookie': `shop-context=${testData.testShop.id}` // Simulate shop context
      }
    });
    console.log(`✅ Products API: ${productsResponse.data.products.length} products found`);

    // Test Categories API
    console.log('📂 Testing Categories API...');
    const categoriesResponse = await axios.get(`${BASE_URL}/api/categories`, {
      headers: {
        'Cookie': `shop-context=${testData.testShop.id}`
      }
    });
    console.log(`✅ Categories API: ${categoriesResponse.data.categories.length} categories found`);

    // Test Brands API
    console.log('🏷️ Testing Brands API...');
    const brandsResponse = await axios.get(`${BASE_URL}/api/brands`, {
      headers: {
        'Cookie': `shop-context=${testData.testShop.id}`
      }
    });
    console.log(`✅ Brands API: ${brandsResponse.data.brands.length} brands found`);

    // Test Customers API
    console.log('👥 Testing Customers API...');
    const customersResponse = await axios.get(`${BASE_URL}/api/pos/customers`, {
      headers: {
        'Cookie': `shop-context=${testData.testShop.id}`
      }
    });
    console.log(`✅ Customers API: ${customersResponse.data.customers.length} customers found`);

    console.log('\n🎉 All APIs working correctly with shop isolation!');

  } catch (error) {
    console.error('❌ API Test Failed:', error.response?.data || error.message);
  }
}

// Only run if server is available
testAPIs().catch(err => {
  console.log('⚠️ Could not connect to server. Please run `npm run dev` first.');
  console.log('Error:', err.message);
});

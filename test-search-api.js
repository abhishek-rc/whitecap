// Test the actual search API with unit detection
const http = require('http');

async function testSearchAPI(query) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'localhost',
      port: 3000, // Adjust port if different
      path: `/api/search?q=${encodeURIComponent(query)}&limit=5`,
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      }
    };

    const req = http.request(options, (res) => {
      let data = '';

      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        try {
          const result = JSON.parse(data);
          resolve({ status: res.statusCode, data: result });
        } catch (error) {
          resolve({ status: res.statusCode, data: data });
        }
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    req.end();
  });
}

async function runTests() {
  console.log('🧪 Testing Search API with Unit Detection...\n');

  const testQueries = [
    '1/4',
    '1/4 in drill bit',
    'wooden box',
    '1/2 socket'
  ];

  for (const query of testQueries) {
    console.log(`\n🔍 Testing query: "${query}"`);
    console.log('─'.repeat(50));
    
    try {
      const result = await testSearchAPI(query);
      
      console.log('📊 API Response:');
      console.log('  - Status:', result.status);
      
      if (result.status === 200 && result.data) {
        console.log('  - Success:', result.data.success);
        console.log('  - Total Results:', result.data.data?.total || 0);
        console.log('  - Products Found:', result.data.data?.products?.length || 0);
        console.log('  - Source:', result.data.source);
        
        if (result.data.data?.products?.length > 0) {
          console.log('  - First Product Title:', result.data.data.products[0].title);
          console.log('  ✅ Unit filtering appears to be working!');
        } else {
          console.log('  ❌ No products found - check unit detection or filter');
        }
      } else {
        console.log('  - Error Response:', result.data);
      }
      
    } catch (error) {
      console.error('❌ Error testing query:', error.message);
      console.log('  💡 Make sure your dev server is running on localhost:3000');
    }
    
    // Wait a bit between requests
    await new Promise(resolve => setTimeout(resolve, 1000));
  }

  console.log('\n' + '='.repeat(60));
  console.log('🎯 TEST COMPLETE');
  console.log('Check the console logs in your dev server for unit detection details!');
  console.log('='.repeat(60));
}

// Run the tests
runTests().catch(console.error);

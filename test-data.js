// Test script to verify data loading
import { dataService } from './src/lib/data.js';
import { fastSearch } from './src/lib/fast-search.js';

async function testDataLoading() {
  console.log('🧪 Testing data loading...');
  
  try {
    // Test data service initialization
    console.log('1️⃣ Testing data service initialization...');
    await dataService.initialize();
    
    // Test basic search
    console.log('2️⃣ Testing basic search...');
    const result = await dataService.search('apple', {}, 0, 10);
    console.log('Data service search result:', {
      productsCount: result.products.length,
      total: result.total,
      firstProduct: result.products[0]
    });
    
    // Test fast search
    console.log('3️⃣ Testing fast search...');
    const fastResult = await fastSearch.search({
      query: 'apple',
      filters: {},
      offset: 0,
      limit: 10
    });
    
    console.log('Fast search result:', {
      productsCount: fastResult.products.length,
      total: fastResult.total,
      firstProduct: fastResult.products[0]
    });
    
    console.log('✅ All tests passed!');
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

testDataLoading();

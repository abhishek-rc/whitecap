// Test script to verify the optimized search performance
const testUrl = 'https://vertex-ai-search-nextjs-arobx3mrx.vercel.app/api/search';

async function testSearchPerformance() {
  console.log('🚀 Testing optimized search performance...');
  
  const queries = [
    'apple',
    'chicken',
    'juice',
    'bread',
    'water'
  ];
  
  for (const query of queries) {
    const startTime = Date.now();
    
    try {
      const response = await fetch(`${testUrl}?q=${encodeURIComponent(query)}&limit=10`);
      const data = await response.json();
      const endTime = Date.now();
      
      console.log(`Query: "${query}"`);
      console.log(`  Response time: ${endTime - startTime}ms`);
      console.log(`  Results: ${data.results?.length || 0}`);
      console.log(`  Total: ${data.totalSize || 0}`);
      console.log(`  Source: ${data.source || 'unknown'}`);
      console.log(`  Query time: ${data.queryTime || 0}ms`);
      console.log('---');
    } catch (error) {
      console.error(`Error testing query "${query}":`, error);
    }
  }
}

async function testAutocompletePerformance() {
  console.log('🚀 Testing optimized autocomplete performance...');
  
  const queries = [
    'ap',
    'ch',
    'ju',
    'br',
    'wa'
  ];
  
  for (const query of queries) {
    const startTime = Date.now();
    
    try {
      const response = await fetch(`https://vertex-ai-search-nextjs-arobx3mrx.vercel.app/api/autocomplete?q=${encodeURIComponent(query)}&limit=5`);
      const data = await response.json();
      const endTime = Date.now();
      
      console.log(`Query: "${query}"`);
      console.log(`  Response time: ${endTime - startTime}ms`);
      console.log(`  Suggestions: ${data.suggestions?.length || 0}`);
      console.log(`  Source: ${data.source || 'unknown'}`);
      console.log('---');
    } catch (error) {
      console.error(`Error testing autocomplete "${query}":`, error);
    }
  }
}

// Run tests
testSearchPerformance().then(() => {
  console.log('\n');
  return testAutocompletePerformance();
}).then(() => {
  console.log('✅ Performance tests completed!');
}).catch(error => {
  console.error('❌ Test failed:', error);
});

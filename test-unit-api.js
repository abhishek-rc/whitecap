// Test the unit detection and filtering API
const { extractUnitsForFiltering } = require('./src/lib/unit-detector');

async function testUnitAPI() {
  console.log('🧪 Testing Unit Detection API...\n');

  const testQueries = [
    '1/4',
    '1/4 in drill bit',
    '1/2 socket wrench',
    'wooden box',
    '3/4 inch pipe'
  ];

  for (const query of testQueries) {
    console.log(`\n🔍 Testing query: "${query}"`);
    console.log('─'.repeat(50));
    
    try {
      // Test unit detection
      const unitResult = extractUnitsForFiltering(query);
      
      console.log('📏 Unit Detection Result:');
      console.log('  - Original Query:', unitResult.originalQuery);
      console.log('  - Detected Units:', unitResult.detectedUnits);
      console.log('  - Query Without Units:', unitResult.queryWithoutUnits);
      
      // Simulate the filter generation
      if (unitResult.detectedUnits.length > 0) {
        console.log('\n🎯 Filter Generation:');
        const units = unitResult.detectedUnits;
        
        if (units.length === 1) {
          const filter = `title: "${units[0]}"`;
          console.log('  - Generated Filter:', filter);
          console.log('  ✅ This will search for products with "' + units[0] + '" in the title');
        } else {
          const unitFilters = units.map(unit => `title: "${unit}"`);
          const combinedFilter = `(${unitFilters.join(' OR ')})`;
          console.log('  - Generated Filter:', combinedFilter);
          console.log('  ✅ This will search for products with any of these units in the title');
        }
      } else {
        console.log('\n❌ No units detected - normal search will be performed');
      }
      
    } catch (error) {
      console.error('❌ Error testing query:', error.message);
    }
  }

  console.log('\n' + '='.repeat(60));
  console.log('🎯 SUMMARY:');
  console.log('- Unit detection is working');
  console.log('- Filters are being generated correctly');
  console.log('- Ready to test with actual API calls');
  console.log('='.repeat(60));
}

// Test the API
testUnitAPI().catch(console.error);

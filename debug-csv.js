import { dataService } from '../src/lib/data';

async function testCSVParsing() {
  console.log('Testing CSV parsing...');
  
  try {
    // Initialize the data service
    await dataService.initialize();
    
    // Test search for some products
    const searchResults = await dataService.search('ANCHW200');
    console.log('Search results for ANCHW200:', searchResults.total);
    
    // Test direct product lookup
    const product = await dataService.getProduct('ANCHW200');
    console.log('Direct lookup for ANCHW200:', product ? 'Found' : 'Not found');
    
    // Test another SKU
    const product2 = await dataService.getProduct('AGART');
    console.log('Direct lookup for AGART:', product2 ? 'Found' : 'Not found');
    
    // Get all products and check their SKUs
    const allProducts = await dataService.search('');
    console.log(`Total products loaded: ${allProducts.total}`);
    
    // Look for SKUs that contain "ANCHW"
    const anchResults = await dataService.search('ANCHW');
    console.log(`Products containing "ANCHW": ${anchResults.total}`);
    if (anchResults.products && Array.isArray(anchResults.products)) {
      anchResults.products.slice(0, 3).forEach(p => {
        console.log(`- ${p.sku}: ${p.displayName}`);
      });
    } else {
      console.log('No products found or products is not an array');
    }
    
  } catch (error) {
    console.error('Error:', error);
  }
}

testCSVParsing();

import { NextResponse } from 'next/server';
import { dataService } from '@/lib/data';

export async function GET() {
  try {
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
    
    return NextResponse.json({
      success: true,
      data: {
        anchw200_search: searchResults.total,
        anchw200_direct: product ? 'Found' : 'Not found',
        agart_direct: product2 ? 'Found' : 'Not found',
        total_products: allProducts.total,
        anchw_search_results: anchResults.total,
        sample_anchw_products: anchResults.products.slice(0, 3).map(p => ({
          sku: p.sku,
          displayName: p.displayName
        })),
        // Get first 10 products to see their SKUs
        first_10_products: allProducts.products.slice(0, 10).map(p => ({
          sku: p.sku,
          displayName: p.displayName
        }))
      }
    });
  } catch (error) {
    console.error('Debug error:', error);
    return NextResponse.json(
      { success: false, error: (error as Error).message },
      { status: 500 }
    );
  }
}

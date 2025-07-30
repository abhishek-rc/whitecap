import { NextRequest, NextResponse } from 'next/server';
import { dataService } from '@/lib/data';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || '';
    
    // Initialize data service
    await dataService.initialize();
    
    // Get search results
    const results = await dataService.search(search);
    
    // Get first few products for debugging
    const firstProducts = results.products.slice(0, 10);
    
    return NextResponse.json({
      success: true,
      searchQuery: search,
      totalProducts: results.total,
      sampleProducts: firstProducts.map(p => ({
        sku: p.sku,
        displayName: p.displayName,
        isActive: p.isActive,
        isDeleted: p.isDeleted
      }))
    });
  } catch (error) {
    console.error('Product debug error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

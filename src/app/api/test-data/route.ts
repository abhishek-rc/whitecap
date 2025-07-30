import { NextRequest, NextResponse } from 'next/server';
import { dataService } from '@/lib/data';

export async function GET(request: NextRequest) {
  try {
    console.log('🧪 Testing data service...');
    
    // Initialize data service
    await dataService.initialize();
    
    // Test basic search
    const result = await dataService.search('apple', {}, 0, 5);
    
    console.log('Data service test result:', {
      productsCount: result.products.length,
      total: result.total,
      firstProduct: result.products[0]
    });
    
    return NextResponse.json({
      status: 'success',
      productsCount: result.products.length,
      total: result.total,
      firstProduct: result.products[0],
      facets: result.facets
    });
  } catch (error) {
    console.error('Data service test failed:', error);
    return NextResponse.json({
      status: 'error',
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined
    }, { status: 500 });
  }
}

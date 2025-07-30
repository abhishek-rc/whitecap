import { NextRequest, NextResponse } from 'next/server';
import { retailAPIDirect } from '@/lib/retail-api-direct';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const sku = searchParams.get('sku');
    const limit = parseInt(searchParams.get('limit') || '10');
    const visitorId = searchParams.get('visitorId') || `similar-${Date.now()}`;

    if (!sku) {
      return NextResponse.json(
        { error: 'Product SKU is required' },
        { status: 400 }
      );
    }

    console.log('🔍 Direct Similar Items API called:', {
      sku,
      limit,
      visitorId
    });

    // Use direct Retail API call
    const apiResponse = await retailAPIDirect.getSimilarItems(sku, visitorId, limit);
    
    // Transform to our app format
    const transformedResponse = retailAPIDirect.transformToAppFormat(apiResponse, 'similar-items');

    console.log('✅ Direct Similar Items response:', {
      productCount: transformedResponse.products.length,
      score: transformedResponse.score
    });

    return NextResponse.json(transformedResponse);

  } catch (error) {
    console.error('❌ Direct Similar Items API error:', error);
    
    return NextResponse.json(
      { 
        error: 'Failed to get similar items from Direct Retail API',
        products: [],
        count: 0,
        type: 'similar-items',
        score: 0,
        reason: 'Direct Retail API error',
        metadata: {
          model: 'similar-items',
          source: 'retail-api-direct',
          error: error instanceof Error ? error.message : 'Unknown error',
          timestamp: new Date().toISOString()
        }
      },
      { status: 500 }
    );
  }
}

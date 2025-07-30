import { NextRequest, NextResponse } from 'next/server';
import { retailAPIDirect } from '@/lib/retail-api-direct';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '10');
    const visitorId = searchParams.get('visitorId') || `onsale-${Date.now()}`;
    const categoryFilter = searchParams.get('category');

    console.log('🏷️ Direct On-Sale API called:', {
      limit,
      visitorId,
      categoryFilter
    });

    // Use direct Retail API call
    const apiResponse = await retailAPIDirect.getOnSaleItems(visitorId, limit, categoryFilter || undefined);
    
    // Transform to our app format
    const transformedResponse = retailAPIDirect.transformToAppFormat(apiResponse, 'on-sale');

    console.log('✅ Direct On-Sale response:', {
      productCount: transformedResponse.products.length,
      score: transformedResponse.score
    });

    return NextResponse.json(transformedResponse);

  } catch (error) {
    console.error('❌ Direct On-Sale API error:', error);
    
    return NextResponse.json(
      { 
        error: 'Failed to get on-sale items from Direct Retail API',
        products: [],
        count: 0,
        type: 'on-sale',
        score: 0,
        reason: 'Direct Retail API error',
        metadata: {
          model: 'on-sale',
          source: 'retail-api-direct',
          error: error instanceof Error ? error.message : 'Unknown error',
          timestamp: new Date().toISOString()
        }
      },
      { status: 500 }
    );
  }
}

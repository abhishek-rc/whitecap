import { NextResponse } from 'next/server';
import { vertexAICommerceService } from '@/lib/vertex-ai-commerce';

export async function GET() {
  try {
    // Get configuration details
    const config = {
      projectId: process.env.GOOGLE_CLOUD_PROJECT_ID || 'gwa-vertex',
      location: process.env.VERTEX_AI_LOCATION || 'global',
      catalogId: process.env.VERTEX_AI_CATALOG_ID || 'default_catalog',
      branchId: process.env.VERTEX_AI_BRANCH_ID || '0',
      placementId: process.env.VERTEX_AI_PLACEMENT_ID || 'recently_viewed_default'
    };

    // Test prediction call
    const testUserEvent = {
      eventType: 'detail-page-view' as const,
      visitorId: 'debug-user',
      eventTime: new Date().toISOString(),
      uri: '/debug',
      productDetails: [{
        product: {
          id: 'TEST001',
          type: 'PRIMARY' as const,
          categories: ['TEST'],
          title: 'Test Product',
          languageCode: 'en',
          availability: 'IN_STOCK' as const
        },
        quantity: 1
      }]
    };

    // Try different placement calls
    const testPlacements = ['similar-items', 'most_popular_items_default', 'trending', 'recently_viewed_default'];
    const placementResults: Record<string, unknown> = {};

    for (const placement of testPlacements) {
      try {
        const result = await vertexAICommerceService.predict(
          placement,
          testUserEvent,
          3
        );
        placementResults[placement] = {
          success: true,
          resultCount: result.results?.length || 0,
          hasResults: !!result.results,
          sampleResult: result.results?.[0] || null // Add sample result to see the structure
        };
      } catch (error) {
        placementResults[placement] = {
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error'
        };
      }
    }

    return NextResponse.json({
      success: true,
      config,
      predictionTest: placementResults,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Debug config error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}

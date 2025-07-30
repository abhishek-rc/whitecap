import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const testSku = searchParams.get('sku') || 'FLOUC';
    const baseUrl = new URL(request.url).origin;

    console.log('🧪 Testing new Vertex AI recommendation models...');

    // Test the new recommendation models
    const tests = [
      {
        name: 'On Sale Recommendations',
        url: `${baseUrl}/api/recommendations/on-sale?limit=5`,
        expectedFields: ['products', 'score', 'reason', 'type', 'metadata']
      },
      {
        name: 'Similar Items Recommendations', 
        url: `${baseUrl}/api/recommendations/similar-items?sku=${testSku}&limit=5`,
        expectedFields: ['products', 'score', 'reason', 'type', 'metadata']
      }
    ];

    const results = await Promise.all(
      tests.map(async (test) => {
        try {
          console.log(`🔍 Testing: ${test.name}`);
          const response = await fetch(test.url, {
            headers: { 'User-Agent': 'test-api' }
          });
          
          const data = await response.json();
          
          // Validate response structure
          const hasAllFields = test.expectedFields.every(field => 
            data.hasOwnProperty(field)
          );
          
          return {
            name: test.name,
            status: response.status,
            success: response.ok,
            hasAllFields,
            productCount: data.products?.length || 0,
            score: data.score || 0,
            source: data.metadata?.source || 'unknown',
            model: data.metadata?.model || 'unknown',
            reason: data.reason || 'No reason provided',
            error: !response.ok ? data.error : null
          };
        } catch (error) {
          return {
            name: test.name,
            status: 500,
            success: false,
            hasAllFields: false,
            productCount: 0,
            score: 0,
            source: 'error',
            model: 'error',
            reason: 'Test failed',
            error: error instanceof Error ? error.message : 'Unknown error'
          };
        }
      })
    );

    // Calculate overall test results
    const overallSuccess = results.every(r => r.success);
    const totalProductsFound = results.reduce((sum, r) => sum + r.productCount, 0);

    const testSummary = {
      timestamp: new Date().toISOString(),
      testSku,
      overallSuccess,
      totalTests: results.length,
      passedTests: results.filter(r => r.success).length,
      totalProductsFound,
      results,
      recommendations: {
        'on-sale': {
          configured: true,
          placementId: 'on-sale',
          description: 'Vertex AI model for on-sale product recommendations'
        },
        'similar-items': {
          configured: true,
          placementId: 'similar-items', 
          description: 'Vertex AI model for similar items recommendations'
        }
      },
      notes: [
        'Both models use live Vertex AI API data only',
        'No fallback to local recommendation engine',
        'Models are configured with placement IDs: on-sale, similar-items',
        'API endpoints: /api/recommendations/on-sale, /api/recommendations/similar-items'
      ]
    };

    console.log('✅ Test completed:', testSummary);

    return NextResponse.json(testSummary);

  } catch (error) {
    console.error('❌ Test API error:', error);
    return NextResponse.json(
      { 
        error: 'Test API failed',
        message: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
}

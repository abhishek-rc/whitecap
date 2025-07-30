import { NextResponse } from 'next/server';
import { vertexAICommerceService } from '@/lib/vertex-ai-commerce';

export async function GET() {
  try {
    console.log('🔍 Vertex AI Debug endpoint called');
    
    const startTime = Date.now();
    
    // Test basic connectivity and authentication
    const debugInfo = {
      timestamp: new Date().toISOString(),
      environment: {
        NODE_ENV: process.env.NODE_ENV,
        isVercel: !!process.env.VERCEL,
        hasCredentials: !!process.env.GOOGLE_APPLICATION_CREDENTIALS,
        credentialsLength: process.env.GOOGLE_APPLICATION_CREDENTIALS?.length || 0,
        projectId: process.env.GOOGLE_CLOUD_PROJECT_ID,
        location: process.env.VERTEX_AI_LOCATION,
        catalogId: process.env.VERTEX_AI_CATALOG_ID,
        branchId: process.env.VERTEX_AI_BRANCH_ID
      },
      serverInfo: {
        platform: process.platform,
        nodeVersion: process.version,
        memory: process.memoryUsage(),
        uptime: process.uptime()
      }
    };

    // Try to perform a simple search to test connectivity
    try {
      console.log('🧪 Testing Vertex AI connectivity with simple search...');
      const testSearchResponse = await vertexAICommerceService.search({
        query: 'test',
        visitorId: 'debug-test',
        pageSize: 1,
        offset: 0
      });
      
      const searchTime = Date.now() - startTime;
      
      return NextResponse.json({
        success: true,
        status: 'healthy',
        debugInfo,
        testResults: {
          searchConnectivity: 'success',
          searchTime: searchTime,
          searchResults: testSearchResponse.totalSize,
          facets: testSearchResponse.facets?.length || 0
        }
      });
    } catch (searchError) {
      console.error('❌ Vertex AI connectivity test failed:', searchError);
      
      return NextResponse.json({
        success: false,
        status: 'error',
        debugInfo,
        testResults: {
          searchConnectivity: 'failed',
          searchError: searchError instanceof Error ? searchError.message : String(searchError),
          searchTime: Date.now() - startTime
        }
      });
    }
  } catch (error) {
    console.error('❌ Debug endpoint error:', error);
    
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    
    return NextResponse.json({
      success: false,
      status: 'error',
      error: errorMessage,
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}

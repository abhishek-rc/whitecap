import { NextRequest, NextResponse } from 'next/server';
import { vertexAICommerceService } from '@/lib/vertex-ai-commerce';

interface VertexAIResult {
  id: string;
  metadata?: {
    title?: string;
    description?: string;
    categories?: string[];
    images?: { uri: string }[];
    attributes?: {
      brand?: { text?: string[] };
      vendor?: { text?: string[] };
      vendorName?: { text?: string[] };
      units?: { text?: string[] };
      isSFPreferred?: { text?: string[] };
    };
    availability?: string;
    score?: number;
  };
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '10');
    const visitorId = searchParams.get('visitorId') || 'anonymous-user';
    const categoryFilter = searchParams.get('category');

    // Build user event for context
    const userEvent = {
      eventType: 'home-page-view' as const,
      visitorId,
      eventTime: new Date().toISOString(),
      uri: '/'
    };

    // Build filter for categories if provided
    let filter = '';
    if (categoryFilter) {
      filter = `categories: ANY("${categoryFilter}")`;
    }

    // Get trending products from Vertex AI
    const predictionResponse = await vertexAICommerceService.predict(
      'most_popular_items_default',
      userEvent,
      limit,
      filter
    );

    // Transform results to our format
    const products = (predictionResponse.results || []).map((result: VertexAIResult) => ({
      id: result.id,
      sku: result.id,
      displayName: result.metadata?.title || result.id,
      description: result.metadata?.description || '',
      category: result.metadata?.categories?.[0] || '',
      brand: result.metadata?.attributes?.brand?.text?.[0] || '',
      vendor: result.metadata?.attributes?.vendor?.text?.[0] || '',
      vendorName: result.metadata?.attributes?.vendorName?.text?.[0] || '',
      units: result.metadata?.attributes?.units?.text?.[0] || '',
      isSFPreferred: result.metadata?.attributes?.isSFPreferred?.text?.[0] === 'true',
      imageURL: result.metadata?.images?.[0]?.uri || '',
      availability: result.metadata?.availability || 'UNKNOWN',
      categoryDesc: result.metadata?.categories?.[0] || '',
      urlSlug: result.id.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
      price: 0,
      accset: 'VERTEX_AI',
      keywords: [],
      orderLastMonth: 0,
      isActive: true,
      isDeleted: false,
      webCategory: result.metadata?.categories?.[0] || '',
      // Stock information from Vertex AI
      availableQuantity: (result.metadata as any)?.availableQuantity || 0,
      totalStock: (result.metadata as any)?.attributes?.totalStock?.numbers?.[0] || (result.metadata as any)?.availableQuantity || 0,
      stockWarehouses: (result.metadata as any)?.attributes?.stockWarehouses?.numbers?.[0] || 0,
      score: result.metadata?.score || 0.9,
      reason: 'Trending products from Vertex AI'
    }));

    // If no results from Vertex AI, fall back to local recommendation engine
    if (products.length === 0) {
      console.log('🔄 No Vertex AI results, falling back to local recommendation engine...');
      try {
        const { recommendationEngine } = await import('@/lib/recommendations');
        const localResult = await recommendationEngine.getTrendingProducts(
          categoryFilter ? [categoryFilter] : undefined, 
          limit
        );
        
        const localProducts = localResult.products.map(product => ({
          id: product.id,
          sku: product.sku,
          displayName: product.displayName,
          description: product.description,
          category: product.category,
          brand: product.brand,
          vendor: product.vendor,
          vendorName: product.vendorName,
          units: product.units,
          isSFPreferred: product.isSFPreferred,
          imageURL: product.imageURL,
          availability: product.availability,
          categoryDesc: product.categoryDesc,
          urlSlug: product.urlSlug,
          price: product.price || 0,
          accset: product.accset,
          keywords: product.keywords,
          orderLastMonth: product.orderLastMonth || 0,
          isActive: product.isActive,
          isDeleted: product.isDeleted,
          webCategory: product.webCategory,
          score: localResult.score,
          reason: 'Trending products from local engine (Vertex AI fallback)'
        }));

        return NextResponse.json({
          products: localProducts,
          score: localResult.score,
          reason: 'Trending products from local engine (Vertex AI fallback)',
          count: localProducts.length,
          type: 'trending'
        });
      } catch (fallbackError) {
        console.error('❌ Local fallback also failed:', fallbackError);
      }
    }

    return NextResponse.json({
      products,
      score: products.length > 0 ? 0.9 : 0,
      reason: products.length > 0 ? 'Trending products from Vertex AI' : 'No trending products found',
      count: products.length,
      type: 'trending'
    });

  } catch (error) {
    console.error('Trending products API error:', error);
    return NextResponse.json(
      { error: 'Failed to get trending products' },
      { status: 500 }
    );
  }
}

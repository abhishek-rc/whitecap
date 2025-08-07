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
    product?: {
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
    };
  };
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '10');
    const visitorId = searchParams.get('visitorId') || 'anonymous-user';
    const categoryFilter = searchParams.get('category');
    const brandFilter = searchParams.get('brand');
    const userId = searchParams.get('userId');

    // Build user event for buy-it-again context
    const userEvent = {
      eventType: 'purchase-complete' as const,
      visitorId,
      eventTime: new Date().toISOString(),
      uri: '/recommendations/buy-it-again',
      pageCategories: categoryFilter ? [categoryFilter] : [],
      userInfo: userId ? { userId } : undefined,
      attributes: {
        context: {
          text: ['buy-it-again', 'repeat-purchase', 'recommendation'],
          searchable: true,
          indexable: true
        }
      }
    };

    // Build filter for buy-it-again if category or brand is specified
    let filter = '';
    const filters: string[] = [];
    
    if (categoryFilter) {
      filters.push(`categories:"${categoryFilter}"`);
    }
    
    if (brandFilter) {
      filters.push(`attributes.brand:"${brandFilter}"`);
    }
    
    if (filters.length > 0) {
      filter = filters.join(' AND ');
    }

    // Get buy-it-again products from Vertex AI using the new buy-it-again model
    const predictionResponse = await vertexAICommerceService.predict(
      'buy-it-again', // Working: v3-buy-it-_buy-it-aga_1754470934568
      userEvent,
      limit,
      filter
    );

    // Transform results to our format
    const products = (predictionResponse.results || []).map((result: VertexAIResult) => {
      // Check if product data is nested under metadata.product
      const productData = result.metadata?.product || result.metadata;
      
      return {
        id: result.id,
        sku: result.id,
        displayName: productData?.title || result.id,
        description: productData?.description || '',
        category: productData?.categories?.[0] || '',
        brand: productData?.attributes?.brand?.text?.[0] || '',
        vendor: productData?.attributes?.vendor?.text?.[0] || '',
        vendorName: productData?.attributes?.vendorName?.text?.[0] || '',
        units: productData?.attributes?.units?.text?.[0] || '',
        isSFPreferred: productData?.attributes?.isSFPreferred?.text?.[0] === 'true',
        imageURL: productData?.images?.[0]?.uri || '',
        availability: productData?.availability || 'UNKNOWN',
        categoryDesc: productData?.categories?.[0] || '',
        urlSlug: result.id.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
        price: 0,
        accset: 'VERTEX_AI',
        keywords: ['buy-it-again', 'repeat-purchase', 'recommendation'],
        orderLastMonth: 0,
        isActive: true,
        isDeleted: false,
        webCategory: productData?.categories?.[0] || '',
        webSubCategory: productData?.categories?.[1] || '',
        webCategoryDesc: productData?.categories?.[0] || '',
        webDesc: productData?.description || '',
        webSubDesc: productData?.description || '',
        // Stock information from Vertex AI
        availableQuantity: (result.metadata as any)?.availableQuantity || (productData as any)?.availableQuantity || 0,
        totalStock: (productData as any)?.attributes?.totalStock?.numbers?.[0] || (result.metadata as any)?.availableQuantity || 0,
        stockWarehouses: (productData as any)?.attributes?.stockWarehouses?.numbers?.[0] || 0,
        score: result.metadata?.score || 0.90,
        reason: 'Buy it again recommendations from Vertex AI model'
      };
    });

    const responseData = {
      products,
      score: products.length > 0 ? 0.90 : 0,
      reason: products.length > 0 
        ? 'Buy it again recommendations from Vertex AI model' 
        : 'No buy it again recommendations found',
      count: products.length,
      type: 'buy-it-again',
      metadata: {
        model: 'buy-it-again',
        placementId: 'buy-it-again',
        source: 'vertex-ai-live',
        timestamp: new Date().toISOString(),
        filters: {
          category: categoryFilter,
          brand: brandFilter
        },
        userContext: {
          userId: userId,
          visitorId: visitorId
        }
      }
    };

    return NextResponse.json(responseData);

  } catch (error) {
    console.error('❌ Buy-it-again recommendations API error:', error);
    
    // Return error response without fallback to local data
    return NextResponse.json(
      { 
        error: 'Failed to get buy-it-again recommendations from Vertex AI',
        products: [],
        count: 0,
        type: 'buy-it-again',
        score: 0,
        reason: 'Vertex AI API error',
        metadata: {
          model: 'buy-it-again',
          source: 'vertex-ai-live',
          error: error instanceof Error ? error.message : 'Unknown error',
          timestamp: new Date().toISOString()
        }
      },
      { status: 500 }
    );
  }
}

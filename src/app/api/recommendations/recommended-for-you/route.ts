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

    // Build user event for recommended-for-you context
    const userEvent = {
      eventType: 'home-page-view' as const,
      visitorId,
      eventTime: new Date().toISOString(),
      uri: '/recommendations/recommended-for-you',
      pageCategories: categoryFilter ? [categoryFilter] : [],
      userInfo: userId ? { userId } : undefined,
      attributes: {
        context: {
          text: ['recommended-for-you', 'personalized', 'recommendation'],
          searchable: true,
          indexable: true
        }
      }
    };

    // Build filter for recommended-for-you if category or brand is specified
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

    console.log('✨ Getting recommended-for-you recommendations:', {
      visitorId,
      userId,
      limit,
      categoryFilter,
      brandFilter,
      filter
    });

    // Get recommended-for-you products from Vertex AI using the recommended-for-you model
    const predictionResponse = await vertexAICommerceService.predict(
      'recommended-for-you',
      userEvent,
      limit,
      filter
    );

    console.log('📊 Recommended-for-you prediction response:', {
      resultCount: predictionResponse.results?.length || 0,
      hasResults: !!predictionResponse.results
    });

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
        keywords: ['recommended-for-you', 'personalized', 'recommendation'],
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
        score: result.metadata?.score || 0.95,
        reason: 'Personalized recommendations from Vertex AI recommendation model'
      };
    });

    const responseData = {
      products,
      score: products.length > 0 ? 0.95 : 0,
      reason: products.length > 0 
        ? 'Personalized recommendations from Vertex AI recommendation model' 
        : 'No personalized recommendations found',
      count: products.length,
      type: 'recommended-for-you',
      metadata: {
        model: 'recommended-for-you',
        placementId: 'recommended-for-you',
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

    console.log('✅ Recommended-for-you recommendations response:', {
      productCount: products.length,
      score: responseData.score,
      userId: userId
    });

    return NextResponse.json(responseData);

  } catch (error) {
    console.error('❌ Recommended-for-you recommendations API error:', error);
    
    // Return error response without fallback to local data
    return NextResponse.json(
      { 
        error: 'Failed to get recommended-for-you recommendations from Vertex AI',
        products: [],
        count: 0,
        type: 'recommended-for-you',
        score: 0,
        reason: 'Vertex AI API error',
        metadata: {
          model: 'recommended-for-you',
          source: 'vertex-ai-live',
          error: error instanceof Error ? error.message : 'Unknown error',
          timestamp: new Date().toISOString()
        }
      },
      { status: 500 }
    );
  }
} 
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
    const sku = searchParams.get('sku');
    const limit = parseInt(searchParams.get('limit') || '10');
    const visitorId = searchParams.get('visitorId') || 'anonymous-user';
    const categoryFilter = searchParams.get('category');
    const brandFilter = searchParams.get('brand');

    if (!sku) {
      return NextResponse.json(
        { error: 'SKU parameter is required for similar items recommendations' },
        { status: 400 }
      );
    }

    // Build user event for similar items context
    const userEvent = {
      eventType: 'detail-page-view' as const,
      visitorId,
      eventTime: new Date().toISOString(),
      uri: `/product/${sku}`,
      productDetails: [{
        product: {
          id: sku,
          type: 'PRIMARY' as const,
          categories: categoryFilter ? [categoryFilter] : [],
          title: '',
          languageCode: 'en',
          availability: 'IN_STOCK' as const,
          attributes: brandFilter ? {
            brand: {
              text: [brandFilter],
              searchable: true,
              indexable: true
            }
          } : undefined
        },
        quantity: 1
      }],
      attributes: {
        context: {
          text: ['similar-items', 'related', 'recommendation'],
          searchable: true,
          indexable: true
        }
      }
    };

    // Build filter for similar items if category or brand is specified
    let filter = '';
    const filters: string[] = [];
    
    if (categoryFilter) {
      filters.push(`categories:"${categoryFilter}"`);
    }
    
    if (brandFilter) {
      filters.push(`attributes.brand:"${brandFilter}"`);
    }
    
    // Note: We'll exclude the current product using placement logic rather than filter
    // as the NOT syntax is not supported in this context
    
    if (filters.length > 0) {
      filter = filters.join(' AND ');
    }

    console.log('🔗 Getting similar items recommendations:', {
      sku,
      visitorId,
      limit,
      categoryFilter,
      brandFilter,
      filter
    });

    // Get similar items from Vertex AI using the new similar-items model
    const predictionResponse = await vertexAICommerceService.predict(
      'similar-items',
      userEvent,
      limit,
      filter
    );

    console.log('📊 Similar items prediction response:', {
      resultCount: predictionResponse.results?.length || 0,
      hasResults: !!predictionResponse.results
    });

    // Transform results to our format and exclude the base SKU
    const products = (predictionResponse.results || [])
      .filter((result: VertexAIResult) => result.id !== sku) // Exclude the base product
      .map((result: VertexAIResult) => {
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
          keywords: ['similar-items', 'related', 'recommendation'],
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
          score: result.metadata?.score || 0.85,
          reason: `Similar items to ${sku} from Vertex AI recommendation model`
        };
      });

    const responseData = {
      products,
      score: products.length > 0 ? 0.85 : 0,
      reason: products.length > 0 
        ? `Similar items to ${sku} from Vertex AI recommendation model` 
        : `No similar items found for ${sku}`,
      count: products.length,
      type: 'similar-items',
      metadata: {
        model: 'similar-items',
        placementId: 'similar-items',
        source: 'vertex-ai-live',
        baseSku: sku,
        timestamp: new Date().toISOString(),
        filters: {
          category: categoryFilter,
          brand: brandFilter,
          excludedSku: sku
        }
      }
    };

    console.log('✅ Similar items recommendations response:', {
      baseSku: sku,
      productCount: products.length,
      score: responseData.score
    });

    return NextResponse.json(responseData);

  } catch (error) {
    console.error('❌ Similar items recommendations API error:', error);
    
    // Return error response without fallback to local data
    return NextResponse.json(
      { 
        error: 'Failed to get similar items recommendations from Vertex AI',
        products: [],
        count: 0,
        type: 'similar-items',
        score: 0,
        reason: 'Vertex AI API error',
        metadata: {
          model: 'similar-items',
          source: 'vertex-ai-live',
          error: error instanceof Error ? error.message : 'Unknown error',
          timestamp: new Date().toISOString()
        }
      },
      { status: 500 }
    );
  }
}

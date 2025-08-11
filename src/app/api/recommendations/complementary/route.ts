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
    availableQuantity?: number;
  };
}

interface EnrichedProduct {
  id?: string;
  sku?: string;
  displayName?: string;
  title?: string;
  description?: string;
  category?: string;
  brand?: string;
  vendor?: string;
  vendorName?: string;
  units?: string;
  isSFPreferred?: boolean;
  imageURL?: string;
  availability?: string;
  categoryDesc?: string;
  urlSlug?: string;
  price?: number;
  accset?: string;
  keywords?: string[];
  orderLastMonth?: number;
  isActive?: boolean;
  isDeleted?: boolean;
  webCategory?: string;
  webSubCategory?: string;
  webCategoryDesc?: string;
  webDesc?: string;
  webSubDesc?: string;
  availableQuantity?: number;
  totalStock?: number;
  stockWarehouses?: number;
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const sku = searchParams.get('sku');
    const limit = parseInt(searchParams.get('limit') || '10');
    const visitorId = searchParams.get('visitorId') || 'anonymous-user';

    if (!sku) {
      return NextResponse.json(
        { error: 'SKU parameter is required' },
        { status: 400 }
      );
    }

    // Build user event for context
    const userEvent = {
      eventType: 'add-to-cart' as const,
      visitorId,
      eventTime: new Date().toISOString(),
      uri: `/product/${sku}`,
      productDetails: [{
        product: {
          id: sku,
          type: 'PRIMARY' as const,
          categories: [],
          title: '',
          languageCode: 'en',
          availability: 'IN_STOCK' as const
        },
        quantity: 1
      }]
    };

    // Get complementary products from Vertex AI using the new freq-bought-together model
    const predictionResponse = await vertexAICommerceService.predict(
      'freq-bought-together', // Working: v5-freq-bo_frequently_1754470790176
      userEvent,
      limit
    );

    // Transform results to our format and enrich with full product data
    const productIds = (predictionResponse.results || []).map((result: VertexAIResult) => result.id);
    
    let enrichedProducts = [];
    
    if (productIds.length > 0) {
      try {
        // Try to get full product data using search API for better product information
        const baseUrl = request.url.replace(/\/api\/recommendations\/complementary.*/, '');
        const searchPromises = productIds.map(async (productId: string) => {
          try {
            const searchResponse = await fetch(`${baseUrl}/api/search?q=${encodeURIComponent(productId)}&exact=true&limit=1`, {
              headers: {
                'User-Agent': 'Internal-API-Call',
                'Accept': 'application/json',
                'Content-Type': 'application/json'
              }
            });
            
            if (searchResponse.ok) {
              const searchData = await searchResponse.json();
              if (searchData.success && searchData.data.products.length > 0) {
                return searchData.data.products[0];
              }
            }
          } catch (error) {
            console.error(`Error enriching product ${productId}:`, error);
          }
          return null;
        });
        
        const searchResults: (EnrichedProduct | null)[] = await Promise.all(searchPromises);
        
        // Combine Vertex AI results with enriched product data
        enrichedProducts = (predictionResponse.results || []).map((result: VertexAIResult, index: number) => {
          const enrichedProduct: EnrichedProduct | null = searchResults[index];
          
          if (enrichedProduct) {
            // Use enriched product data with Vertex AI metadata
            return {
              id: enrichedProduct.id || result.id,
              sku: enrichedProduct.sku || result.id,
              displayName: enrichedProduct.displayName || enrichedProduct.title || result.metadata?.title || result.id,
              description: enrichedProduct.description || result.metadata?.description || '',
              category: enrichedProduct.category || result.metadata?.categories?.[0] || '',
              brand: enrichedProduct.brand || result.metadata?.attributes?.brand?.text?.[0] || '',
              vendor: enrichedProduct.vendor || result.metadata?.attributes?.vendor?.text?.[0] || '',
              vendorName: enrichedProduct.vendorName || result.metadata?.attributes?.vendorName?.text?.[0] || '',
              units: enrichedProduct.units || result.metadata?.attributes?.units?.text?.[0] || '',
              isSFPreferred: enrichedProduct.isSFPreferred || result.metadata?.attributes?.isSFPreferred?.text?.[0] === 'true',
              imageURL: enrichedProduct.imageURL || result.metadata?.images?.[0]?.uri || '',
              availability: enrichedProduct.availability || result.metadata?.availability || 'IN_STOCK',
              categoryDesc: enrichedProduct.categoryDesc || result.metadata?.categories?.[0] || '',
              urlSlug: enrichedProduct.urlSlug || result.id.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
              price: enrichedProduct.price || 0,
              accset: enrichedProduct.accset || 'VERTEX_AI',
              keywords: enrichedProduct.keywords || [],
              orderLastMonth: enrichedProduct.orderLastMonth || 0,
              isActive: enrichedProduct.isActive !== undefined ? enrichedProduct.isActive : true,
              isDeleted: enrichedProduct.isDeleted || false,
              webCategory: enrichedProduct.webCategory || result.metadata?.categories?.[0] || '',
              webSubCategory: enrichedProduct.webSubCategory || result.metadata?.categories?.[1] || '',
              webCategoryDesc: enrichedProduct.webCategoryDesc || result.metadata?.categories?.[0] || '',
              webDesc: enrichedProduct.webDesc || result.metadata?.description || '',
              webSubDesc: enrichedProduct.webSubDesc || result.metadata?.categories?.[1] || '',
              // Stock information from enriched data or Vertex AI
              availableQuantity: enrichedProduct.availableQuantity || (result.metadata as VertexAIResult['metadata'] & { availableQuantity?: number })?.availableQuantity || 0,
              totalStock: enrichedProduct.totalStock || (result.metadata as VertexAIResult['metadata'] & { availableQuantity?: number })?.availableQuantity || 0,
              stockWarehouses: enrichedProduct.stockWarehouses || 1,
              score: result.metadata?.score || 0.85,
              reason: `Frequently bought together with ${sku} from Vertex AI recommendation model`
            };
          } else {
            // Fallback to basic Vertex AI data
            return {
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
              score: result.metadata?.score || 0.7,
              reason: 'Frequently bought together products from Vertex AI'
            };
          }
        });
      } catch (enrichmentError) {
        console.error('Error enriching products with search data:', enrichmentError);
        // Fallback to basic transformation
        enrichedProducts = (predictionResponse.results || []).map((result: VertexAIResult) => ({
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
          score: result.metadata?.score || 0.7,
          reason: 'Frequently bought together products from Vertex AI'
        }));
      }
    } else {
      enrichedProducts = [];
    }

    const products = enrichedProducts;

    // If no results from Vertex AI, fall back to local recommendation engine
    if (products.length === 0) {
      console.log('🔄 No Vertex AI results, falling back to local recommendation engine...');
      try {
        const { recommendationEngine } = await import('@/lib/recommendations');
        const localResult = await recommendationEngine.getComplementaryProducts(sku, limit);
        
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
          reason: 'Complementary products from local engine (Vertex AI fallback)'
        }));

        return NextResponse.json({
          products: localProducts,
          score: localResult.score,
          reason: 'Complementary products from local engine (Vertex AI fallback)',
          count: localProducts.length,
          type: 'frequently-bought-together'
        });
      } catch (fallbackError) {
        console.error('❌ Local fallback also failed:', fallbackError);
      }
    }

    return NextResponse.json({
      products,
      score: products.length > 0 ? 0.7 : 0,
      reason: products.length > 0 ? 'Frequently bought together products from Vertex AI' : 'No frequently bought together products found',
      count: products.length,
      type: 'frequently-bought-together'
    });

  } catch (error) {
    console.error('Complementary products API error:', error);
    return NextResponse.json(
      { error: 'Failed to get complementary products' },
      { status: 500 }
    );
  }
}

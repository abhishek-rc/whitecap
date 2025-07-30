import { NextRequest, NextResponse } from 'next/server';
import { vertexAICommerceService } from '@/lib/vertex-ai-commerce';
import { cache } from '@/lib/cache';

interface RecommendationProduct {
  SKU: string;
  DisplayName: string;
  Description: string;
  Category: string;
  Brand: string;
  Vendor: string;
  VendorName: string;
  Units: string;
  SFPreferred: boolean;
  ImageURL: string;
  availability: string;
  availableQuantity: number;
  score: number;
  reason: string;
}

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
    availableQuantity?: number;
    score?: number;
    reason?: string;
  };
}

export async function GET(request: NextRequest) {
  // Set overall function timeout for Vercel (must complete within 8 seconds)
  const overallTimeout = new Promise<never>((_, reject) => {
    setTimeout(() => reject(new Error('Function timeout - using fallback')), 8000);
  });

  try {
    return await Promise.race([
      processRecommendations(request),
      overallTimeout
    ]);
  } catch (error) {
    console.error('Overall function timeout, using fallback:', error);
    return await handleFallback(request);
  }
}

async function handleFallback(request: NextRequest) {
  try {
    const { recommendationEngine } = await import('@/lib/recommendations');
    const { searchParams } = new URL(request.url);
    const sku = searchParams.get('sku') || '';
    const type = searchParams.get('type') || 'similar-items';
    const limit = parseInt(searchParams.get('limit') || '10');
    
    let recommendationResult;

    switch (type) {
      case 'similar-items':
        recommendationResult = await recommendationEngine.getSimilarProducts(sku, limit);
        break;
      case 'trending':
        recommendationResult = await recommendationEngine.getTrendingProducts(undefined, limit);
        break;
      default:
        recommendationResult = await recommendationEngine.getSimilarProducts(sku, limit);
    }

    const recommendations = recommendationResult.products.map(product => ({
      SKU: product.sku,
      DisplayName: product.displayName,
      Description: product.description,
      Category: product.category,
      Brand: product.brand,
      Vendor: product.vendor,
      VendorName: product.vendorName,
      Units: product.units,
      SFPreferred: product.isSFPreferred,
      ImageURL: product.imageURL,
      availability: product.availability,
      availableQuantity: 1,
      score: recommendationResult.score,
      reason: recommendationResult.reason
    }));

    return NextResponse.json({
      recommendations,
      type,
      sku,
      fallback: true,
      metadata: {
        totalResults: recommendations.length,
        source: 'local-engine',
        recommendationType: recommendationResult.type
      }
    });
  } catch (fallbackError) {
    console.error('Fallback recommendations error:', fallbackError);
    return NextResponse.json(
      { 
        recommendations: [],
        error: 'Recommendations service unavailable',
        fallback: true 
      },
      { status: 200 } // Return 200 with empty array instead of 500
    );
  }
}

async function processRecommendations(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const sku = searchParams.get('sku') || '';
    const type = searchParams.get('type') || 'similar-items';
    const limit = parseInt(searchParams.get('limit') || '10');
    const visitorId = searchParams.get('visitorId') || 'anonymous-user';

    // Generate cache key for recommendations
    const cacheKey = `recommendations:${sku}:${type}:${limit}:${visitorId}`;

    // Check cache first
    const cachedResult = cache.get(cacheKey);
    if (cachedResult) {
      return NextResponse.json(cachedResult);
    }

    // Set timeout for recommendations to avoid blocking (reduced for Vercel)
    const timeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(() => reject(new Error('Recommendations timeout')), 4000); // 4 seconds for Vercel
    });

    // Map recommendation types to Vertex AI placement IDs
    const placementMap: { [key: string]: string } = {
      'similar-items': 'recently_viewed_default',
      'frequently-bought-together': 'others_you_may_like_default',
      'recommended-for-you': 'recommended_for_you_default',
      'trending': 'most_popular_items_default',
      'recently-viewed': 'recently_viewed_default'
    };

    const placementId = placementMap[type] || 'recently_viewed_default';

    // Build user event for context
    const userEvent = {
      eventType: 'detail-page-view' as const,
      visitorId,
      eventTime: new Date().toISOString(),
      uri: `/product/${sku}`,
      productDetails: sku ? [{
        product: {
          id: sku,
          type: 'PRIMARY' as const,
          categories: [],
          title: '',
          languageCode: 'en',
          availability: 'IN_STOCK' as const
        },
        quantity: 1
      }] : undefined
    };

    // Get recommendations from Vertex AI Commerce with timeout
    let predictionResponse;
    try {
      console.log('🔮 Requesting predictions from Vertex AI:', { placementId, visitorId, sku, type });
      
      // Use shorter timeout for Vercel deployment
      const vertexAIPromise = vertexAICommerceService.predict(
        placementId,
        userEvent,
        limit
      );
      
      predictionResponse = await Promise.race([
        vertexAIPromise,
        timeoutPromise
      ]);
      
      console.log('✅ Predictions received:', { 
        resultCount: predictionResponse.results?.length || 0,
        hasAttributionToken: !!predictionResponse.attributionToken
      });
    } catch (error) {
      console.error('❌ Prediction request failed:', error);
      
      // If prediction fails, return empty results to trigger fallback
      predictionResponse = { results: [] };
    }

    // Transform results to our frontend format
    let recommendations = (predictionResponse.results || []).map((result: VertexAIResult) => ({
      SKU: result.id,
      DisplayName: result.metadata?.title || result.id,
      Description: result.metadata?.description || '',
      Category: result.metadata?.categories?.[0] || '',
      Brand: result.metadata?.attributes?.brand?.text?.[0] || '',
      Vendor: result.metadata?.attributes?.vendor?.text?.[0] || '',
      VendorName: result.metadata?.attributes?.vendorName?.text?.[0] || '',
      Units: result.metadata?.attributes?.units?.text?.[0] || '',
      SFPreferred: result.metadata?.attributes?.isSFPreferred?.text?.[0] === 'true',
      ImageURL: result.metadata?.images?.[0]?.uri || '',
      availability: result.metadata?.availability || 'UNKNOWN',
      availableQuantity: result.metadata?.availableQuantity || 0,
      score: result.metadata?.score || 0,
      reason: result.metadata?.reason || ''
    }));

    // If no recommendations from Vertex AI, try local fallback
    if (recommendations.length === 0) {
      console.log('🔄 No Vertex AI recommendations, trying local fallback...');
      try {
        const { recommendationEngine } = await import('@/lib/recommendations');
        
        let recommendationResult;
        switch (type) {
          case 'similar-items':
            recommendationResult = await recommendationEngine.getSimilarProducts(sku, limit);
            break;
          case 'trending':
            recommendationResult = await recommendationEngine.getTrendingProducts(undefined, limit);
            break;
          default:
            recommendationResult = await recommendationEngine.getSimilarProducts(sku, limit);
        }

        recommendations = recommendationResult.products.map(product => ({
          SKU: product.sku,
          DisplayName: product.displayName,
          Description: product.description,
          Category: product.category,
          Brand: product.brand,
          Vendor: product.vendor,
          VendorName: product.vendorName,
          Units: product.units,
          SFPreferred: product.isSFPreferred,
          ImageURL: product.imageURL,
          availability: product.availability,
          availableQuantity: 1,
          score: recommendationResult.score,
          reason: recommendationResult.reason
        }));
        
        console.log('✅ Local fallback provided:', recommendations.length, 'recommendations');
      } catch (fallbackError) {
        console.error('❌ Local fallback also failed:', fallbackError);
      }
    }

    // Record user event for analytics (non-blocking, fire-and-forget)
    Promise.resolve().then(() => {
      vertexAICommerceService.writeUserEvent({
        eventType: 'recommendation-view',
        visitorId,
        eventTime: new Date().toISOString(),
        productDetails: sku ? [{
          product: {
            id: sku,
            type: 'PRIMARY' as const,
            categories: [],
            title: '',
            languageCode: 'en',
            availability: 'IN_STOCK' as const
          },
          quantity: 1
        }] : undefined,
        attributes: {
          recommendationType: { text: [type], searchable: false, indexable: true },
          placementId: { text: [placementId], searchable: false, indexable: true }
        },
        uri: request.url
      }).catch(error => {
        console.warn('User event recording failed:', error);
      });
    });

    // Cache the result for 15 minutes
    const response = {
      recommendations,
      type,
      sku,
      attributionToken: predictionResponse.attributionToken,
      metadata: {
        placementId,
        totalResults: recommendations.length,
        requestId: predictionResponse.requestId
      }
    };

    cache.set(cacheKey, response, 15 * 60 * 1000);

    return NextResponse.json(response);

  } catch (error) {
    console.error('Recommendations API error:', error);
    
    // Use the centralized fallback handler
    return await handleFallback(request);
  }
}


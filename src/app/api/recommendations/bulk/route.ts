import { NextRequest, NextResponse } from 'next/server';

interface ProductResponse {
  id: string;
  sku: string;
  displayName: string;
  description: string;
  category: string;
  brand: string;
  vendor: string;
  vendorName: string;
  units: string;
  isSFPreferred: boolean;
  imageURL: string;
  availability: string;
  categoryDesc: string;
  urlSlug: string;
  price?: number;
  accset: string;
  keywords: string[];
  orderLastMonth?: number;
  isActive: boolean;
  isDeleted: boolean;
  webCategory: string;
  score: number;
  reason: string;
}

interface RecommendationSection {
  products: ProductResponse[];
  score: number;
  reason: string;
  count: number;
}

interface RecommendationsResults {
  [key: string]: RecommendationSection;
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const productSku = searchParams.get('sku') || 'FLOUC';
  const limit = parseInt(searchParams.get('limit') || '3');
  const visitorId = searchParams.get('visitorId') || 'anonymous-user';
  const categoryFilter = searchParams.get('category');
  const brandFilter = searchParams.get('brand');
  
  // Parse models parameter - default to similar and trending for backward compatibility
  const modelsParam = searchParams.get('models') || 'similar,trending';
  const requestedModels = modelsParam.split(',').map(m => m.trim());
  
  const startTime = Date.now();
  
  try {
    const baseUrl = new URL(request.url).origin;
    const promises = [];
    
    // Build requests based on requested models
    for (const model of requestedModels) {
      switch (model) {
        case 'similar':
        case 'similar-items':
          // Try with filters first, then fallback without filters if no results
          promises.push(
            fetch(`${baseUrl}/api/recommendations/similar-items?sku=${productSku}&limit=${limit}&visitorId=${visitorId}${categoryFilter ? `&category=${categoryFilter}` : ''}${brandFilter ? `&brand=${brandFilter}` : ''}`, {
              headers: { 'User-Agent': 'bulk-api' }
            })
              .then(res => res.json())
              .then(async data => {
                // If no results and we had filters, try without filters
                if (data.count === 0 && (categoryFilter || brandFilter)) {
                  console.log('🔄 No similar-items found with filters, trying without filters...');
                  const fallbackRes = await fetch(`${baseUrl}/api/recommendations/similar-items?sku=${productSku}&limit=${limit}&visitorId=${visitorId}`, {
                    headers: { 'User-Agent': 'bulk-api-fallback' }
                  });
                  const fallbackData = await fallbackRes.json();
                  return { type: 'similar-items', data: fallbackData };
                }
                return { type: 'similar-items', data };
              })
              .catch(error => ({ type: 'similar-items', error: error.message }))
          );
          break;
          
        case 'on-sale':
          // Try with filters first, then fallback without filters if no results
          promises.push(
            fetch(`${baseUrl}/api/recommendations/on-sale?limit=${limit}&visitorId=${visitorId}${categoryFilter ? `&category=${categoryFilter}` : ''}${brandFilter ? `&brand=${brandFilter}` : ''}`, {
              headers: { 'User-Agent': 'bulk-api' }
            })
              .then(res => res.json())
              .then(async data => {
                // If no results and we had filters, try without filters
                if (data.count === 0 && (categoryFilter || brandFilter)) {
                  console.log('🔄 No on-sale found with filters, trying without filters...');
                  const fallbackRes = await fetch(`${baseUrl}/api/recommendations/on-sale?limit=${limit}&visitorId=${visitorId}`, {
                    headers: { 'User-Agent': 'bulk-api-fallback' }
                  });
                  const fallbackData = await fallbackRes.json();
                  return { type: 'on-sale', data: fallbackData };
                }
                return { type: 'on-sale', data };
              })
              .catch(error => ({ type: 'on-sale', error: error.message }))
          );
          break;
          
        case 'trending':
          // Try trending with fallback to similar-items if no results
          promises.push(
            fetch(`${baseUrl}/api/recommendations?type=trending&limit=${limit}`, {
              headers: { 'User-Agent': 'bulk-api' }
            })
              .then(res => res.json())
              .then(async data => {
                // If no results from trending, try getting popular similar items
                if ((!data.recommendations || data.recommendations.length === 0)) {
                  console.log('🔄 No trending found, using similar-items as fallback...');
                  const fallbackRes = await fetch(`${baseUrl}/api/recommendations/similar-items?sku=${productSku}&limit=${limit}&visitorId=${visitorId}`, {
                    headers: { 'User-Agent': 'bulk-api-trending-fallback' }
                  });
                  const fallbackData = await fallbackRes.json();
                  // Modify the response to indicate it's trending-style
                  if (fallbackData.products) {
                    fallbackData.products = fallbackData.products.map((p: ProductResponse) => ({
                      ...p,
                      reason: 'Trending products (similar to viewed items)',
                      keywords: ['trending', 'popular', 'recommendation']
                    }));
                    fallbackData.reason = 'Trending products (similar to viewed items)';
                    fallbackData.type = 'trending';
                  }
                  return { type: 'trending', data: fallbackData };
                }
                return { type: 'trending', data };
              })
              .catch(error => ({ type: 'trending', error: error.message }))
          );
          break;
          
        case 'recommended-for-you':
          // Try with filters first, then fallback without filters if no results
          promises.push(
            fetch(`${baseUrl}/api/recommendations/recommended-for-you?limit=${limit}&visitorId=${visitorId}${categoryFilter ? `&category=${categoryFilter}` : ''}${brandFilter ? `&brand=${brandFilter}` : ''}&userId=${searchParams.get('userId') || ''}`, {
              headers: { 'User-Agent': 'bulk-api' }
            })
              .then(res => res.json())
              .then(async data => {
                // If no results and we had filters, try without filters
                if (data.count === 0 && (categoryFilter || brandFilter)) {
                  console.log('🔄 No recommended-for-you found with filters, trying without filters...');
                  const fallbackRes = await fetch(`${baseUrl}/api/recommendations/recommended-for-you?limit=${limit}&visitorId=${visitorId}&userId=${searchParams.get('userId') || ''}`, {
                    headers: { 'User-Agent': 'bulk-api-fallback' }
                  });
                  const fallbackData = await fallbackRes.json();
                  return { type: 'recommended-for-you', data: fallbackData };
                }
                return { type: 'recommended-for-you', data };
              })
              .catch(error => ({ type: 'recommended-for-you', error: error.message }))
          );
          break;
          
        default:
          // Fallback to old API for other types
          promises.push(
            fetch(`${baseUrl}/api/recommendations?sku=${productSku}&type=${model}&limit=${limit}`, {
              headers: { 'User-Agent': 'bulk-api' }
            })
              .then(res => res.json())
              .then(data => ({ type: model, data }))
              .catch(error => ({ type: model, error: error.message }))
          );
          break;
      }
    }

    // Execute all requests concurrently with timeout
    const results = await Promise.race([
      Promise.all(promises),
      new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout')), 8000))
    ]) as Array<{type: string; data?: { recommendations?: unknown[]; products?: ProductResponse[]; score?: number; reason?: string }; error?: string}>;
    
    // Process results
    const recommendations: RecommendationsResults = {};
    let totalProducts = 0;
    
    results.forEach(result => {
      if ('error' in result) {
        console.error(`Error getting ${result.type} recommendations:`, result.error);
        recommendations[result.type] = {
          products: [],
          score: 0,
          reason: `Error: ${result.error}`,
          count: 0
        };
      } else if (result.data) {
        let products: ProductResponse[];
        
        if (result.data.products) {
          // New format - products are already in the correct format
          products = result.data.products;
        } else if (result.data.recommendations) {
          // Old format - transform from recommendations format
          products = (result.data.recommendations as {
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
            score: number;
            reason: string;
          }[]).map((rec) => ({
            id: rec.SKU,
            sku: rec.SKU,
            displayName: rec.DisplayName,
            description: rec.Description,
            category: rec.Category,
            brand: rec.Brand,
            vendor: rec.Vendor,
            vendorName: rec.VendorName,
            units: rec.Units,
            isSFPreferred: rec.SFPreferred,
            imageURL: rec.ImageURL,
            availability: rec.availability,
            categoryDesc: rec.Category,
            urlSlug: rec.SKU.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
            price: 0,
            accset: 'API',
            keywords: [],
            orderLastMonth: 0,
            isActive: true,
            isDeleted: false,
            webCategory: rec.Category,
            score: rec.score,
            reason: rec.reason
          }));
        } else {
          products = [];
        }
        
        recommendations[result.type] = {
          products,
          score: result.data.score || 0.8,
          reason: result.data.reason || `${result.type} recommendations`,
          count: products.length
        };
        totalProducts += products.length;
      }
    });

    const response = {
      success: true,
      data: {
        productSku,
        categoryFilter: categoryFilter || null,
        recommendations,
        totalTypes: Object.keys(recommendations).length,
        totalProducts,
        executionTime: Date.now() - startTime,
        note: 'Using new Vertex AI recommendation models'
      }
    };

    console.log(`Bulk recommendations completed in ${Date.now() - startTime}ms`);
    return NextResponse.json(response);

  } catch (error) {
    console.error('Bulk recommendations error:', error);
    return NextResponse.json({
      success: false,
      error: 'Internal server error',
      executionTime: Date.now() - startTime
    }, { status: 500 });
  }
}

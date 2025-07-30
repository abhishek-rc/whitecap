import { NextRequest, NextResponse } from 'next/server';
import { vertexAICommerceService } from '@/lib/vertex-ai-commerce';
import { cache } from '@/lib/cache';

export async function GET(request: NextRequest) {
  // Extract parameters outside try block for error handling
  const { searchParams } = new URL(request.url);
  const query = searchParams.get('q') || '';
  const page = parseInt(searchParams.get('page') || '1');
  const offset = parseInt(searchParams.get('offset') || '0');
  const limit = parseInt(searchParams.get('limit') || '20');
  const categories = searchParams.getAll('category');
  const brands = searchParams.getAll('brand');
  const sfPreferred = searchParams.get('sfPreferred') === 'true';
  const availabilities = searchParams.getAll('availability');
  const warehouses = searchParams.getAll('warehouse');
  const accsets = searchParams.getAll('accset');
  const allergens = searchParams.getAll('allergens');
  const priceMin = searchParams.get('priceMin') ? parseFloat(searchParams.get('priceMin')!) : undefined;
  const priceMax = searchParams.get('priceMax') ? parseFloat(searchParams.get('priceMax')!) : undefined;
  const sortBy = searchParams.get('sortBy') || '';
  const visitorId = searchParams.get('visitorId') || 'anonymous-user';
  const userId = searchParams.get('userId');
  const exact = searchParams.get('exact') === 'true';
  try {

    // Generate cache key
    const cacheKey = cache.generateSearchKey({
      query,
      page,
      offset,
      limit,
      category: categories.join(','),
      brand: brands.join(','),
      sfPreferred,
      availability: availabilities.join(','),
      warehouse: warehouses.join(','),
      accset: accsets.join(','),
      allergens: allergens.join(','),
      priceMin,
      priceMax,
      sortBy
    });

    // Check cache first
    const cachedResult = cache.get(cacheKey);
    if (cachedResult) {
      console.log('🎯 Cache hit for search query:', query);
      return NextResponse.json({
        success: true,
        data: cachedResult,
        nextPageToken: null,
        source: 'cache'
      });
    }

    // Build filters
    const filters: Record<string, unknown> = {};
    if (categories.length > 0) filters.category = categories;
    if (brands.length > 0) filters.brand = brands;
    if (sfPreferred) filters.sfPreferred = true;
    if (availabilities.length > 0) filters.availability = availabilities;
    if (warehouses.length > 0) filters.warehouse = warehouses;
    if (accsets.length > 0) filters.accset = accsets;
    if (allergens.length > 0) filters.allergens = allergens;
    if (priceMin !== undefined && priceMax !== undefined) {
      filters.priceRange = { min: priceMin, max: priceMax };
    }

    // **PRIMARY STRATEGY: Vertex AI Search**
    console.log('🚀 Starting Vertex AI search for:', query);
    const startTime = Date.now();
    
    const filter = vertexAICommerceService.buildFilter(filters);
    let orderBy = '';
    switch (sortBy) {
      case 'price_asc':
        orderBy = 'price';
        break;
      case 'price_desc':
        orderBy = 'price desc';
        break;
      case 'name_asc':
        orderBy = 'title';
        break;
      case 'name_desc':
        orderBy = 'title desc';
        break;
      case 'availability':
        // Note: availability is a textual field, but we can't directly sort by it
        // Will handle this in post-processing
        orderBy = '';
        break;
      case 'text_match_desc':
        // Use default relevance which is based on text matching
        orderBy = '';
        break;
      case 'rating_desc':
        // Handle rating sorts in post-processing for custom logic (rating + review count)
        orderBy = '';
        break;
      case 'rating_asc':
        // Handle rating sorts in post-processing for custom logic (rating + review count)
        orderBy = '';
        break;
      case 'discount_desc':
        orderBy = 'discount desc';
        break;
      case 'discount_asc':
        orderBy = 'discount';
        break;
      case 'recently_purchased':
        // This would require user event data integration
        orderBy = '';
        break;
      case 'relevance':
      default:
        orderBy = ''; // Use default relevance ranking
    }

    try {
      // Extended timeout for Vertex AI - give it more time to respond
      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => reject(new Error('Vertex AI timeout')), 15000); // 15 second timeout
      });

      console.log('🔍 Making Vertex AI search request with:', {
        query: query || '',
        visitorId,
        pageSize: limit,
        offset: offset,
        filter,
        orderBy
      });

      const searchPromise = vertexAICommerceService.search({
        query: exact ? `"${query}"` : (query || ''), // Use exact match with quotes if exact=true
        // visitorId,
        // ...(userId ? { userInfo: { userId } } : {}),
        pageSize: limit,
        offset: offset,
        // filter,
        // orderBy,
        // facetSpecs: [
        //   { facetKey: { key: 'attributes.brand' }, limit: 20 },
        //   { facetKey: { key: 'categories' }, limit: 20 },
        //   { facetKey: { key: 'availability' }, limit: 4 },
        //   { facetKey: { key: 'attributes.vendor' }, limit: 20 },
        //   { facetKey: { key: 'attributes.vendorName' }, limit: 20 },
        //   { facetKey: { key: 'attributes.accset' }, limit: 20 },
        //   { facetKey: { key: 'attributes.allergens' }, limit: 20 },
        //   { facetKey: { key: 'priceInfo.price' }, limit: 10 }
        // ]
      });

      const searchResponse = await Promise.race([searchPromise, timeoutPromise]);
      
      console.log('✅ Vertex AI search response:', {
        totalSize: searchResponse.totalSize,
        resultsCount: searchResponse.results?.length || 0,
        facetsCount: searchResponse.facets?.length || 0,
        nextPageToken: searchResponse.nextPageToken
      });

      // Debug facets
      if (searchResponse.facets) {
        console.log('🔍 Available facets:', searchResponse.facets.map(f => ({ key: f.key, valueCount: f.values?.length || 0 })));
        searchResponse.facets.forEach(facet => {
          console.log(`📊 Facet "${facet.key}":`, facet.values?.slice(0, 3));
        });
      }

      if (searchResponse.results && searchResponse.results.length > 0) {
        console.log('📦 First result sample:', JSON.stringify(searchResponse.results[0], null, 2));
      }
      
      // Get full product details for each result
      const productIds = (searchResponse.results || []).map((result: any) => result.id);
      console.log(`🔍 Fetching full product details for ${productIds.length} products`);
      
      const fullProducts = await vertexAICommerceService.getProducts(productIds);
      console.log(`✅ Retrieved ${fullProducts.length} full product details`);
      
      if (fullProducts.length > 0) {
        console.log(`📦 First full product sample:`, JSON.stringify(fullProducts[0], null, 2));
      }

      // Map full product data to our format
      const products = fullProducts.map((product: any) => {
        const resultId = product.id || '';
        
        // Enhanced product mapping with full product data
        const title = product.title || product.name || product.displayName || resultId;
        const description = product.description || product.summary || '';
        const brand = product.attributes?.brand?.text?.[0] || 
                     product.attributes?.brand?.textValue?.[0] || 
                     product.brand || '';
        const category = product.categories?.[0] || 
                        product.primaryCategory || 
                        product.category || '';
        const imageUrl = product.images?.[0]?.uri || 
                        product.images?.[0]?.url || 
                        product.imageUrl || 
                        product.imageURL || '';
        const price = product.priceInfo?.price || 
                     product.priceInfo?.originalPrice || 
                     product.price || 0;
        const availability = product.availability || 'IN_STOCK';
        const isSFPreferred = product.attributes?.isSFPreferred?.text?.[0] === 'true' ||
                             product.attributes?.isSFPreferred?.textValue?.[0] === 'true' ||
                             product.isSFPreferred === true;
        
        // Extract additional fields from attributes
        const attributes = product.attributes || {};
        const vendor = attributes.vendor?.text?.[0] || attributes.vendor?.textValue?.[0] || '';
        const vendorName = attributes.vendorName?.text?.[0] || attributes.vendorName?.textValue?.[0] || vendor;
        const units = attributes.units?.text?.[0] || attributes.units?.textValue?.[0] || '';
        const accset = attributes.accset?.text?.[0] || attributes.accset?.textValue?.[0] || '';
        const allergens = attributes.allergens?.text || attributes.allergens?.textValue || [];
        const sku = attributes.sku?.text?.[0] || attributes.sku?.textValue?.[0] || resultId;
        
        return {
          id: resultId,
          sku: sku,
          displayName: title,
          title: title,
          description: description,
          brand: brand,
          category: category,
          imageURL: imageUrl,
          isSFPreferred: isSFPreferred,
          price: price,
          availability: availability,
          uri: product.uri || `/product/${resultId}`,
          vendor: vendor,
          vendorName: vendorName,
          units: units,
          accset: accset,
          allergens: allergens,
          webCategory: category,
          webSubCategory: product.categories?.[1] || '',
          keywords: product.tags || [],
          // Stock information from Vertex AI
          availableQuantity: (product as any)?.availableQuantity || (attributes as any)?.availableQuantity?.numbers?.[0] || 0,
          totalStock: (attributes as any)?.totalStock?.numbers?.[0] || (product as any)?.availableQuantity || 0,
          stockWarehouses: (attributes as any)?.stockWarehouses?.numbers?.[0] || 0,
          // Raw data for debugging
          images: product.images || [],
          attributes: attributes,
          priceInfo: product.priceInfo || {},
          rating: product.rating || {},
          tags: product.tags || [],
          categories: product.categories || [],
          variants: product.variants || []
        };
      });

      // Generate facets from actual product data when Vertex AI doesn't provide them
      const generateFacetsFromProducts = (products: any[]) => {
        const categoryCount: { [key: string]: number } = {};
        const brandCount: { [key: string]: number } = {};
        const availabilityCount: { [key: string]: number } = {};
        const accsetCount: { [key: string]: number } = {};
        const allergenCount: { [key: string]: number } = {};
        const vendorCount: { [key: string]: number } = {};

        products.forEach(product => {
          // Count categories
          if (product.category) {
            categoryCount[product.category] = (categoryCount[product.category] || 0) + 1;
          }
          
          // Count brands
          if (product.brand) {
            brandCount[product.brand] = (brandCount[product.brand] || 0) + 1;
          }
          
          // Count availability
          if (product.availability) {
            availabilityCount[product.availability] = (availabilityCount[product.availability] || 0) + 1;
          }
          
          // Count accsets
          if (product.accset) {
            accsetCount[product.accset] = (accsetCount[product.accset] || 0) + 1;
          }
          
          // Count allergens
          if (product.allergens && Array.isArray(product.allergens)) {
            product.allergens.forEach((allergen: string) => {
              allergenCount[allergen] = (allergenCount[allergen] || 0) + 1;
            });
          }
          
          // Count vendors (warehouses)
          if (product.vendorName) {
            vendorCount[product.vendorName] = (vendorCount[product.vendorName] || 0) + 1;
          }
        });

        return {
          categories: Object.entries(categoryCount)
            .map(([value, count]) => ({ value, count }))
            .sort((a, b) => b.count - a.count),
          brands: Object.entries(brandCount)
            .map(([value, count]) => ({ value, count }))
            .sort((a, b) => b.count - a.count),
          availability: Object.entries(availabilityCount)
            .map(([value, count]) => ({ value, count }))
            .sort((a, b) => b.count - a.count),
          accsets: Object.entries(accsetCount)
            .map(([value, count]) => ({ value, count }))
            .sort((a, b) => b.count - a.count),
          allergens: Object.entries(allergenCount)
            .map(([value, count]) => ({ value, count }))
            .sort((a, b) => b.count - a.count),
          warehouses: Object.entries(vendorCount)
            .map(([value, count]) => ({ value, count }))
            .sort((a, b) => b.count - a.count),
        };
      };

      // Check if Vertex AI provided facets, if not generate them from products
      const hasFacets = searchResponse.facets && searchResponse.facets.length > 0;
      console.log(`📊 Vertex AI facets available: ${hasFacets}, generating from products: ${!hasFacets}`);
      
      const facets = hasFacets ? {
        categories: searchResponse.facets?.find(f => f.key === 'categories')?.values?.map((v: any) => ({ value: v.value, count: v.count })) || [],
        brands: searchResponse.facets?.find(f => f.key === 'attributes.brand')?.values?.map((v: any) => ({ value: v.value, count: v.count })) || [],
        availability: searchResponse.facets?.find(f => f.key === 'availability')?.values?.map((v: any) => ({ value: v.value, count: v.count })) || [],
        accsets: searchResponse.facets?.find(f => f.key === 'attributes.accset')?.values?.map((v: any) => ({ value: v.value, count: v.count })) || [],
        allergens: searchResponse.facets?.find(f => f.key === 'attributes.allergens')?.values?.map((v: any) => ({ value: v.value, count: v.count })) || [],
        warehouses: searchResponse.facets?.find(f => f.key === 'attributes.vendor')?.values?.map((v: any) => ({ value: v.value, count: v.count })) || 
                   searchResponse.facets?.find(f => f.key === 'attributes.vendorName')?.values?.map((v: any) => ({ value: v.value, count: v.count })) || [],
        // Allergen facets
        allergenFree: searchResponse.facets?.find(f => f.key === 'attributes.allergenFree')?.values?.map((v: any) => ({ value: v.value, count: v.count })) || [],
        hasMilk: searchResponse.facets?.find(f => f.key === 'attributes.hasMilk')?.values?.map((v: any) => ({ value: v.value, count: v.count })) || [],
        hasEggs: searchResponse.facets?.find(f => f.key === 'attributes.hasEggs')?.values?.map((v: any) => ({ value: v.value, count: v.count })) || [],
        hasNuts: searchResponse.facets?.find(f => f.key === 'attributes.hasNuts')?.values?.map((v: any) => ({ value: v.value, count: v.count })) || [],
        hasGluten: searchResponse.facets?.find(f => f.key === 'attributes.hasGluten')?.values?.map((v: any) => ({ value: v.value, count: v.count })) || [],
        hasSoy: searchResponse.facets?.find(f => f.key === 'attributes.hasSoy')?.values?.map((v: any) => ({ value: v.value, count: v.count })) || [],
        hasFish: searchResponse.facets?.find(f => f.key === 'attributes.hasFish')?.values?.map((v: any) => ({ value: v.value, count: v.count })) || [],
        hasShellfish: searchResponse.facets?.find(f => f.key === 'attributes.hasShellfish')?.values?.map((v: any) => ({ value: v.value, count: v.count })) || []
      } : generateFacetsFromProducts(products);

      // Apply post-processing sorting for unsupported Vertex AI sorts or textual fields
      if (sortBy === 'availability' || sortBy === 'text_match_desc' || sortBy === 'recently_purchased' || sortBy === 'rating_desc' || sortBy === 'rating_asc') {
        console.log(`🔄 Applying post-processing sort: ${sortBy}`);
        
        // Helper functions for rating sorts
        const getRatingValue = (product: any) => {
          if (typeof product.rating === 'number') {
            return product.rating;
          } else if (product.rating && typeof product.rating === 'object') {
            return product.rating.averageRating || 0;
          }
          return 0;
        };
        
        const getReviewCount = (product: any) => {
          if (product.reviewCount) return product.reviewCount;
          if (product.rating && typeof product.rating === 'object' && product.rating.ratingCount) {
            return product.rating.ratingCount;
          }
          return 0;
        };
        
        products.sort((a, b) => {
          switch (sortBy) {
            case 'availability':
              // Sort by availability: IN_STOCK -> OUT_OF_STOCK -> PREORDER -> BACKORDER
              const availOrder = { 'IN_STOCK': 4, 'OUT_OF_STOCK': 3, 'PREORDER': 2, 'BACKORDER': 1 };
              const aAvail = availOrder[a.availability as keyof typeof availOrder] || 0;
              const bAvail = availOrder[b.availability as keyof typeof availOrder] || 0;
              return bAvail - aAvail;
            case 'text_match_desc':
              // Calculate text match score based on query relevance
              const getTextMatchScore = (product: any) => {
                if (!query) return 0;
                let score = 0;
                const queryLower = query.toLowerCase();
                
                // Exact SKU match gets highest score
                if (product.sku?.toLowerCase() === queryLower) score += 100;
                
                // Title/display name matches
                const productTitle = product.title || product.displayName || '';
                if (productTitle.toLowerCase().includes(queryLower)) {
                  score += 50;
                  // Boost if query appears at start of title
                  if (productTitle.toLowerCase().startsWith(queryLower)) score += 25;
                }
                
                // Brand matches
                if (product.brand?.toLowerCase().includes(queryLower)) score += 30;
                
                // Category matches
                if (product.category?.toLowerCase().includes(queryLower)) score += 20;
                
                // Description matches
                if (product.description?.toLowerCase().includes(queryLower)) score += 10;
                
                return score;
              };
              
              return getTextMatchScore(b) - getTextMatchScore(a);
            case 'recently_purchased':
              // Sort by SF Preferred first, then by order frequency if available
              if (a.isSFPreferred && !b.isSFPreferred) return -1;
              if (!a.isSFPreferred && b.isSFPreferred) return 1;
              
              // Finally by alphabetical order
              return (a.title || a.displayName || '').localeCompare(b.title || b.displayName || '');
            case 'rating_desc':
              // Sort by rating (high to low), then by review count (high to low) as tiebreaker
              const aRating = getRatingValue(a);
              const bRating = getRatingValue(b);
              
              // First sort by rating (high to low)
              if (aRating !== bRating) {
                return bRating - aRating;
              }
              
              // If ratings are equal, sort by review count (high to low)
              const aReviews = getReviewCount(a);
              const bReviews = getReviewCount(b);
              return bReviews - aReviews;
              
            case 'rating_asc':
              // Sort by rating (low to high), then by review count (high to low) as tiebreaker
              const aRatingAsc = getRatingValue(a);
              const bRatingAsc = getRatingValue(b);
              
              // First sort by rating (low to high)
              if (aRatingAsc !== bRatingAsc) {
                return aRatingAsc - bRatingAsc;
              }
              
              // If ratings are equal, sort by review count (high to low)
              const aReviewsAsc = getReviewCount(a);
              const bReviewsAsc = getReviewCount(b);
              return bReviewsAsc - aReviewsAsc;
              
            default:
              return 0;
          }
        });
      }

      const response = {
        success: true,
        data: {
          products: products,
          facets: {
            ...facets,
            priceRanges: searchResponse.facets?.find(f => f.key === 'priceInfo.price')?.values?.map((v: any) => ({ 
              min: parseFloat(v.value) || 0, 
              max: parseFloat(v.value) || 0, 
              count: v.count 
            })) || [
              { min: 0, max: 25, count: 0 },
              { min: 25, max: 50, count: 0 },
              { min: 50, max: 100, count: 0 },
              { min: 100, max: 200, count: 0 },
              { min: 200, max: 500, count: 0 },
              { min: 500, max: 1000, count: 0 }
            ],
          },
          total: searchResponse.totalSize || 0,
          queryTime: Date.now() - startTime,
        },
        nextPageToken: searchResponse.nextPageToken || null,
        source: 'vertex-ai'
      };

      cache.set(cacheKey, response.data, 5 * 60 * 1000);
      return NextResponse.json(response);
    } catch (vertexError) {
      console.error('❌ Vertex AI search failed:', vertexError);
      console.error('Error details:', {
        message: vertexError instanceof Error ? vertexError.message : String(vertexError),
        stack: vertexError instanceof Error ? vertexError.stack : undefined,
        name: vertexError instanceof Error ? vertexError.name : 'Unknown',
        query,
        filter,
        orderBy,
        timestamp: new Date().toISOString(),
        requestParams: {
          query,
          page,
          limit,
          category: categories.join(','),
          brand: brands.join(','),
          sfPreferred,
          availability: availabilities.join(','),
          sortBy,
          visitorId
        },
        serverInfo: {
          nodeEnv: process.env.NODE_ENV,
          platform: process.platform,
          nodeVersion: process.version,
          memory: process.memoryUsage(),
          uptime: process.uptime()
        }
      });
      
      // **FALLBACK: Return empty but valid response**
      const response = {
        success: false,
        data: {
          products: [],
          facets: {
            categories: [],
            brands: [],
            priceRanges: [],
            warehouses: [],
            accsets: [],
            availability: [],
          },
          total: 0,
          queryTime: Date.now() - startTime,
        },
        nextPageToken: null,
        source: 'vertex-ai-error',
        error: vertexError instanceof Error ? vertexError.message : String(vertexError),
        errorType: 'vertex-ai-failure',
        timestamp: new Date().toISOString()
      };

      return NextResponse.json(response);
    }
  } catch (error) {
    console.error('❌ Search API error:', error);
    
    // More detailed error logging
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    const errorStack = error instanceof Error ? error.stack : '';
    const errorName = error instanceof Error ? error.name : 'UnknownError';
    
    console.error('❌ Error details:', {
      message: errorMessage,
      stack: errorStack,
      name: errorName,
      cause: error instanceof Error ? error.cause : undefined,
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
      requestParams: {
        query,
        page,
        limit,
        category: categories.join(','),
        brand: brands.join(','),
        sfPreferred,
        availability: availabilities.join(','),
        sortBy,
        visitorId
      },
      serverInfo: {
        platform: process.platform,
        nodeVersion: process.version,
        memory: process.memoryUsage(),
        uptime: process.uptime(),
        timestamp: new Date().toISOString()
      }
    });

    // Return structured error response
    const errorResponse = {
      success: false,
      data: {
        products: [],
        facets: { 
          categories: [], 
          brands: [], 
          priceRanges: [], 
          warehouses: [],
          accsets: [],
          availability: [],
        },
        total: 0,
        queryTime: 0,
      },
      nextPageToken: null,
      source: 'error',
      error: errorMessage,
      errorType: errorName,
      timestamp: new Date().toISOString(),
      requestId: `search-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    };
    
    return NextResponse.json(errorResponse, { status: 500 });
  }
}

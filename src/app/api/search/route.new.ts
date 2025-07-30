import { NextRequest, NextResponse } from 'next/server';
import { vertexAICommerceService } from '@/lib/vertex-ai-commerce';
import { fastSearch } from '@/lib/fast-search';
import { cache } from '@/lib/cache';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q') || '';
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const category = searchParams.get('category') || '';
    const brand = searchParams.get('brand') || '';
    const sfPreferred = searchParams.get('sfPreferred') === 'true';
    const availability = searchParams.get('availability') || '';
    const sortBy = searchParams.get('sortBy') || '';
    const visitorId = searchParams.get('visitorId') || 'anonymous-user';

    // Generate cache key
    const cacheKey = cache.generateSearchKey({
      query,
      page,
      limit,
      category,
      brand,
      sfPreferred,
      availability,
      sortBy
    });

    // Check cache first
    const cachedResult = cache.get(cacheKey);
    if (cachedResult) {
      console.log('🎯 Cache hit for search query:', query);
      return NextResponse.json(cachedResult);
    }

    // Build filters
    const filters: Record<string, unknown> = {};
    if (category) filters.category = category;
    if (brand) filters.brand = brand;
    if (sfPreferred) filters.sfPreferred = true;
    if (availability) filters.availability = availability;

    // **PRIMARY STRATEGY: Fast Local Search**
    console.log('🚀 Starting fast local search for:', query);
    const localStartTime = Date.now();
    
    try {
      const localResult = await fastSearch.search({
        query,
        filters,
        offset: (page - 1) * limit,
        limit,
        sortBy
      });

      const localTime = Date.now() - localStartTime;
      console.log(`✅ Fast local search completed in ${localTime}ms`);

      const response = {
        results: localResult.products,
        facets: {
          categories: localResult.facets.categories,
          brands: localResult.facets.brands,
          availability: localResult.facets.availability,
        },
        totalSize: localResult.total,
        nextPageToken: page * limit < localResult.total ? `page-${page + 1}` : null,
        queryTime: localTime,
        source: 'local'
      };

      // Cache for 5 minutes
      cache.set(cacheKey, response, 5 * 60 * 1000);
      
      return NextResponse.json(response);
    } catch (localError) {
      console.error('Fast local search failed:', localError);
      
      // **FALLBACK STRATEGY: Try Vertex AI with very short timeout**
      console.log('🔄 Falling back to Vertex AI search...');
      
      const filter = vertexAICommerceService.buildFilter(filters);
      let orderBy = '';
      switch (sortBy) {
        case 'price_asc':
          orderBy = 'priceInfo.price asc';
          break;
        case 'price_desc':
          orderBy = 'priceInfo.price desc';
          break;
        case 'name_asc':
          orderBy = 'title asc';
          break;
        case 'name_desc':
          orderBy = 'title desc';
          break;
        case 'availability':
          orderBy = 'availability desc';
          break;
        default:
          orderBy = '';
      }

      try {
        // Very short timeout for Vertex AI
        const timeoutPromise = new Promise<never>((_, reject) => {
          setTimeout(() => reject(new Error('Vertex AI timeout')), 2000); // 2 second timeout
        });

        const searchPromise = vertexAICommerceService.search({
          query: query || '*',
          visitorId,
          pageSize: limit,
          offset: (page - 1) * limit,
          filter,
          orderBy,
          facetSpecs: [
            { facetKey: { key: 'attributes.brand' }, limit: 20 },
            { facetKey: { key: 'categories' }, limit: 20 },
            { facetKey: { key: 'availability' }, limit: 4 }
          ]
        });

        const searchResponse = await Promise.race([searchPromise, timeoutPromise]);
        
        const products = (searchResponse.results || []).map((result: any) => {
          const product = result.product || {};
          return {
            id: product.id,
            sku: product.id,
            title: product.title,
            description: product.description,
            brand: product.attributes?.brand?.text?.[0] || '',
            category: product.categories?.[0] || '',
            imageURL: product.images?.[0]?.uri || '',
            isSFPreferred: product.attributes?.isSFPreferred?.text?.[0] === 'true',
            price: product.priceInfo?.price || 0,
            availability: product.availability,
            uri: product.uri,
            images: product.images || [],
            attributes: product.attributes || {},
            priceInfo: product.priceInfo || {},
            rating: product.rating || {},
            tags: product.tags || [],
            categories: product.categories || [],
            variants: product.variants || []
          };
        });

        const response = {
          results: products,
          facets: {
            categories: searchResponse.facets?.find(f => f.key === 'categories')?.values?.map((v: any) => ({ value: v.value, count: v.count })) || [],
            brands: searchResponse.facets?.find(f => f.key === 'attributes.brand')?.values?.map((v: any) => ({ value: v.value, count: v.count })) || [],
            availability: searchResponse.facets?.find(f => f.key === 'availability')?.values?.map((v: any) => ({ value: v.value, count: v.count })) || [],
          },
          totalSize: searchResponse.totalSize || 0,
          nextPageToken: searchResponse.nextPageToken || null,
          queryTime: Date.now() - localStartTime,
          source: 'vertex-ai'
        };

        cache.set(cacheKey, response, 5 * 60 * 1000);
        return NextResponse.json(response);
      } catch (vertexError) {
        console.error('Vertex AI search also failed:', vertexError);
        
        // **ULTIMATE FALLBACK: Return empty but valid response**
        const response = {
          results: [],
          facets: {
            categories: [],
            brands: [],
            availability: [
              { value: 'IN_STOCK', count: 0 },
              { value: 'OUT_OF_STOCK', count: 0 }
            ],
          },
          totalSize: 0,
          nextPageToken: null,
          queryTime: Date.now() - localStartTime,
          source: 'empty-fallback'
        };

        return NextResponse.json(response);
      }
    }
  } catch (error) {
    console.error('Search API error:', error);
    return NextResponse.json({ 
      error: 'Internal server error',
      results: [],
      facets: { categories: [], brands: [], availability: [] },
      totalSize: 0,
      nextPageToken: null,
      queryTime: 0,
      source: 'error'
    }, { status: 500 });
  }
}

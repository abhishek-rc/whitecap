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

    // Build filter string for Vertex AI Search
    const filters: { [key: string]: any } = {};
    if (category) filters.category = category;
    if (brand) filters.brand = brand;
    if (sfPreferred) filters.sfPreferred = true;
    if (availability) filters.availability = availability;

    const filter = vertexAICommerceService.buildFilter(filters);

    // Build order by string
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
        orderBy = ''; // Use default relevance ranking
    }

    // Perform search using Vertex AI Search for Commerce with aggressive timeout
    let searchResponse;
    try {
      // For very short queries (1-2 characters), use wildcard search
      let searchQuery = query;
      if (query.length > 0 && query.length <= 2) {
        searchQuery = `${query}*`;
      }
      
      // If no query, search for all products using wildcard
      if (!searchQuery || searchQuery.trim() === '') {
        console.log('🔍 Empty query detected, searching for all products');
        searchQuery = '*';
      }

      // Set extremely aggressive timeout - fail fast if Vertex AI is slow
      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => reject(new Error('Vertex AI timeout - falling back to local search')), 3000); // 3 second timeout
      });

      const searchPromise = vertexAICommerceService.search({
        query: searchQuery || " ",
        visitorId,
        pageSize: limit,
        offset: (page - 1) * limit,
        filter,
        orderBy,
        facetSpecs: [
          {
            facetKey: { key: 'attributes.brand' },
            limit: 20
          },
          {
            facetKey: { key: 'categories' },
            limit: 20
          },
          {
            facetKey: { key: 'availability' },
            limit: 4
          }
        ],
        boostSpec: {
          conditionBoostSpecs: [
            {
              condition: 'availability: ANY("IN_STOCK")',
              boost: 0.5
            }
          ]
        }
      });

      // Race between search and timeout
      searchResponse = await Promise.race([searchPromise, timeoutPromise]);
      
      // Debug: Log the actual search response structure
      console.log('🔍 Search response structure:');
      console.log('Total results:', searchResponse.totalSize);
      console.log('Results count:', searchResponse.results?.length || 0);
      if (searchResponse.results && searchResponse.results.length > 0) {
        console.log('First result structure:', JSON.stringify(searchResponse.results[0], null, 2));
      }
      
      // If Vertex AI returns no results but has a total count, fall back to local search
      if (searchResponse.totalSize > 0 && (!searchResponse.results || searchResponse.results.length === 0)) {
        console.log('⚠️ Vertex AI returned total count but no results, falling back to local search');
        // Don't throw error, just fall through to catch block to trigger fallback
        const fallbackError = new Error('No results returned from Vertex AI despite total count');
        throw fallbackError;
      }
    } catch (vertexError) {
      console.log('Vertex AI search failed, falling back to local search:', vertexError instanceof Error ? vertexError.message : String(vertexError));
      
      // Fast fallback to local search
      try {
        const { dataService } = await import('@/lib/data');
        await dataService.initialize();
        
        const localSearchResult = await dataService.search(query, filters, (page - 1) * limit, limit);
        
        // Transform local results to match expected format
        const localProducts = localSearchResult.products.map((product: any) => ({
          id: product.SKU,
          sku: product.SKU,
          displayName: product.DisplayName,
          description: product.Description,
          category: product.Category,
          brand: product.Brand,
          vendor: product.Vendor,
          vendorName: product.VendorName,
          units: product.Units,
          isSFPreferred: product.SFPreferred,
          imageURL: product.ImageURL,
          availability: product.availability,
          availableQuantity: product.availableQuantity,
          totalStock: product.totalStock || 0,
          stockWarehouses: product.stockWarehouses || 0,
          categoryDesc: product.categoryDesc || '',
          price: product.price || 0,
          urlSlug: product.urlSlug || '',
          accset: product.accset || '',
          keywords: product.keywords || [],
          orderLastMonth: product.orderLastMonth || 0,
          isActive: product.isActive !== false,
          isDeleted: product.isDeleted === true,
          webCategory: product.webCategory || '',
          webSubCategory: product.webSubCategory || '',
          webCategoryDesc: product.webCategoryDesc || '',
          webDesc: product.webDesc || '',
          webSubDesc: product.webSubDesc || ''
        }));

        const response = {
          success: true,
          data: {
            products: localProducts,
            facets: {
              brands: localSearchResult.facets.brands || [],
              categories: localSearchResult.facets.categories || [],
              availability: [
                { value: 'Available', count: localProducts.filter(p => p.availability === 'Available').length },
                { value: 'Not Available', count: localProducts.filter(p => p.availability === 'Not Available').length }
              ],
              sfPreferred: [
                { value: true, count: localProducts.filter(p => p.isSFPreferred).length },
                { value: false, count: localProducts.filter(p => !p.isSFPreferred).length }
              ]
            },
            total: localSearchResult.total,
            queryTime: 0,
            pagination: {
              page,
              limit,
              total: localSearchResult.total,
              totalPages: Math.ceil(localSearchResult.total / limit)
            },
            query,
            fallback: true
          }
        };

        // Cache the fallback response for 2 minutes
        cache.set(cacheKey, response, 2 * 60 * 1000);
        
        return NextResponse.json(response);
      } catch (fallbackError) {
        console.error('Local search fallback failed:', fallbackError);
        // Return empty results rather than error
        return NextResponse.json({
          success: false,
          data: {
            products: [],
            facets: { brands: [], categories: [], availability: [], sfPreferred: [] },
            total: 0,
            queryTime: 0,
            pagination: { page, limit, total: 0, totalPages: 0 },
            query,
            error: 'Search service temporarily unavailable'
          }
        });
      }
    }

    // Transform results to our frontend format
    const products = (searchResponse.results || []).map((result: any) => {
      // Use the product data directly without additional API calls
      const product = result.product || {};
      return {
        id: product.id || '',
        sku: product.id || '',
        displayName: product.title || '',
        description: product.description || '',
        category: (product.categories || [])[0] || '',
        brand: product.attributes?.brand?.text?.[0] || '',
        vendor: product.attributes?.vendor?.text?.[0] || '',
        vendorName: product.attributes?.vendorName?.text?.[0] || '',
        units: product.attributes?.units?.text?.[0] || '',
        isSFPreferred: product.attributes?.isSFPreferred?.text?.[0] === 'true',
        imageURL: product.images?.[0]?.uri || '',
        availability: product.availability === 'IN_STOCK' ? 'Available' : 'Not Available',
        availableQuantity: product.availableQuantity || 0,
        totalStock: product.attributes?.totalStock?.numbers?.[0] || 0,
        stockWarehouses: product.attributes?.stockWarehouses?.numbers?.[0] || 0,
        categoryDesc: product.attributes?.categoryDesc?.text?.[0] || '',
        price: product.priceInfo?.price || 0,
        urlSlug: product.attributes?.urlSlug?.text?.[0] || '',
        accset: product.attributes?.accset?.text?.[0] || '',
        keywords: product.attributes?.keywords?.text || [],
        orderLastMonth: product.attributes?.orderLastMonth?.numbers?.[0] || 0,
        isActive: product.attributes?.isActive?.text?.[0] === 'true',
        isDeleted: product.attributes?.isDeleted?.text?.[0] === 'true',
        webCategory: product.attributes?.webCategory?.text?.[0] || '',
        webSubCategory: product.attributes?.webSubCategory?.text?.[0] || '',
        webCategoryDesc: product.attributes?.webCategoryDesc?.text?.[0] || '',
        webDesc: product.attributes?.webDesc?.text?.[0] || '',
        webSubDesc: product.attributes?.webSubDesc?.text?.[0] || ''
      };
    });

    // Extract facets for filtering
    const facetData = {
      brands: (searchResponse.facets || [])
        .find((f: any) => f.key === 'attributes.brand')?.values
        ?.map((v: any) => ({ value: v.value, count: v.count })) || [],
      categories: (searchResponse.facets || [])
        .find((f: any) => f.key === 'categories')?.values
        ?.map((v: any) => ({ value: v.value, count: v.count })) || [],
      availability: (searchResponse.facets || [])
        .find((f: any) => f.key === 'availability')?.values
        ?.map((v: any) => ({ value: v.value, count: v.count })) || [],
      sfPreferred: [
        // Calculate sfPreferred from products since facet is disabled
        { value: true, count: products.filter(p => p.isSFPreferred).length },
        { value: false, count: products.filter(p => !p.isSFPreferred).length }
      ]
    };

    // Record user event for analytics and personalization
    if (query && query.trim() !== '') {
      
      await vertexAICommerceService.writeUserEvent({
        eventType: 'search',
        visitorId,
        eventTime: new Date().toISOString(),
        searchQuery: query,
        filter,
        orderBy,
        pageCategories: category ? [category] : [],
        uri: request.url
      });
    }

    // Cache the search result
    const response = {
      success: true,
      data: {
        products,
        facets: facetData,
        total: searchResponse.totalSize || 0,
        queryTime: Date.now() - Date.now(), // Simple placeholder for now
        pagination: {
          page,
          limit,
          total: searchResponse.totalSize || 0,
          totalPages: Math.ceil((searchResponse.totalSize || 0) / limit)
        },
        query,
        correctedQuery: searchResponse.correctedQuery,
        attributionToken: searchResponse.attributionToken,
        appliedControls: searchResponse.appliedControls || []
      }
    };

    // Cache the response for 5 minutes
    cache.set(cacheKey, response, 5 * 60 * 1000);

    return NextResponse.json(response);

  } catch (error) {
    console.error('Search API error:', error);
    
    // Fallback to local search if Vertex AI is not available
    try {
      const { dataService } = await import('@/lib/data');
      const { searchParams } = new URL(request.url);
      const query = searchParams.get('q') || '';
      const page = parseInt(searchParams.get('page') || '1');
      const limit = parseInt(searchParams.get('limit') || '20');
      const offset = (page - 1) * limit;
      
      const results = await dataService.search(query, {
        category: searchParams.get('category') ? [searchParams.get('category')!] : undefined,
        brand: searchParams.get('brand') ? [searchParams.get('brand')!] : undefined,
        sfPreferred: searchParams.get('sfPreferred') === 'true' ? true : undefined,
      }, offset, limit);

      // Transform to match our expected format
      const transformedProducts = results.products.map(product => ({
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
        availableQuantity: 0, // Will be calculated from stock
        totalStock: 0,
        stockWarehouses: 0,
        categoryDesc: product.categoryDesc,
        price: product.price,
        urlSlug: product.urlSlug,
        accset: product.accset,
        keywords: product.keywords,
        orderLastMonth: product.orderLastMonth,
        isActive: product.isActive,
        isDeleted: product.isDeleted,
        webCategory: product.webCategory,
        webSubCategory: product.webSubCategory,
        webCategoryDesc: product.webCategoryDesc,
        webDesc: product.webDesc,
        webSubDesc: product.webSubDesc
      }));

      return NextResponse.json({
        success: true,
        data: {
          products: transformedProducts,
          facets: {
            brands: results.facets.brands,
            categories: results.facets.categories,
            availability: [
              { value: 'Available', count: transformedProducts.filter(p => p.availability === 'Available').length },
              { value: 'Not Available', count: transformedProducts.filter(p => p.availability === 'Not Available').length }
            ],
            sfPreferred: [
              { value: true, count: transformedProducts.filter(p => p.isSFPreferred).length },
              { value: false, count: transformedProducts.filter(p => !p.isSFPreferred).length }
            ]
          },
          total: results.total,
          queryTime: results.queryTime,
          pagination: {
            page,
            limit,
            total: results.total,
            totalPages: Math.ceil(results.total / limit)
          },
          query,
          fallback: true
        }
      });
    } catch (fallbackError) {
      console.error('Fallback search error:', fallbackError);
      return NextResponse.json(
        { success: false, error: 'Search service unavailable' },
        { status: 500 }
      );
    }
  }
}

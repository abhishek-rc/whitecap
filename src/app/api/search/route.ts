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
  const attributesCategories = searchParams.getAll('attributesCategory');

  const availabilities = searchParams.getAll('availability');
  const warehouses = searchParams.getAll('warehouse');
  const accsets = searchParams.getAll('accset');
  
  // Comprehensive product attribute filters
  const materials = searchParams.getAll('material');
  const driveDesigns = searchParams.getAll('driveDesign');
  const bitSizes = searchParams.getAll('bitSizes');
  const warranties = searchParams.getAll('warranty');
  const pieces = searchParams.getAll('pieces');
  const hasDiscounts = searchParams.getAll('hasDiscount');
  const discountPercents = searchParams.getAll('discountPercent');
  const bitMaterials = searchParams.getAll('bitMaterial');
  const screwdriverBitTypes = searchParams.getAll('screwdriverBitType');
  const drillBitTypes = searchParams.getAll('drillBitType');
  const bitTypes = searchParams.getAll('bitType');
  const chuckSizes = searchParams.getAll('chuckSize');
  const shankDiameters = searchParams.getAll('shankDiameter');
  const assembledWeights = searchParams.getAll('assembledWeight');
  const assembledHeights = searchParams.getAll('assembledHeight');
  const assembledWidths = searchParams.getAll('assembledWidth');
  const assembledDepths = searchParams.getAll('assembledDepth');
  const vendorNames = searchParams.getAll('vendorName');
  const units = searchParams.getAll('units');

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
      attributesCategory: attributesCategories.join(','),
      availability: availabilities.join(','),
      warehouse: warehouses.join(','),
      accset: accsets.join(','),
      // Comprehensive filters for cache key
      material: materials.join(','),
      driveDesign: driveDesigns.join(','),
      bitSizes: bitSizes.join(','),
      warranty: warranties.join(','),
      pieces: pieces.join(','),
      hasDiscount: hasDiscounts.join(','),
      discountPercent: discountPercents.join(','),
      bitMaterial: bitMaterials.join(','),
      screwdriverBitType: screwdriverBitTypes.join(','),
      drillBitType: drillBitTypes.join(','),
      bitType: bitTypes.join(','),
      chuckSize: chuckSizes.join(','),
      shankDiameter: shankDiameters.join(','),
      assembledWeight: assembledWeights.join(','),
      assembledHeight: assembledHeights.join(','),
      assembledWidth: assembledWidths.join(','),
      assembledDepth: assembledDepths.join(','),
      vendorName: vendorNames.join(','),
      units: units.join(','),
      priceMin,
      priceMax,
      sortBy
    });

    // Check cache first
    const cachedResult = cache.get(cacheKey);
    if (cachedResult) {
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
    if (attributesCategories.length > 0) filters.attributesCategory = attributesCategories;

    if (availabilities.length > 0) filters.availability = availabilities;
    if (warehouses.length > 0) filters.warehouse = warehouses;
    if (accsets.length > 0) filters.accset = accsets;
    if (priceMin !== undefined && priceMax !== undefined) {
      filters.priceRange = { min: priceMin, max: priceMax };
    }

    // Add comprehensive product attribute filters
    if (materials.length > 0) filters.material = materials;
    if (driveDesigns.length > 0) filters.driveDesign = driveDesigns;
    if (bitSizes.length > 0) filters.bitSizes = bitSizes;
    if (warranties.length > 0) filters.warranty = warranties;
    if (pieces.length > 0) filters.pieces = pieces;
    if (hasDiscounts.length > 0) filters.hasDiscount = hasDiscounts;
    if (discountPercents.length > 0) filters.discountPercent = discountPercents;
    if (bitMaterials.length > 0) filters.bitMaterial = bitMaterials;
    if (screwdriverBitTypes.length > 0) filters.screwdriverBitType = screwdriverBitTypes;
    if (drillBitTypes.length > 0) filters.drillBitType = drillBitTypes;
    if (bitTypes.length > 0) filters.bitType = bitTypes;
    if (chuckSizes.length > 0) filters.chuckSize = chuckSizes;
    if (shankDiameters.length > 0) filters.shankDiameter = shankDiameters;
    if (assembledWeights.length > 0) filters.assembledWeight = assembledWeights;
    if (assembledHeights.length > 0) filters.assembledHeight = assembledHeights;
    if (assembledWidths.length > 0) filters.assembledWidth = assembledWidths;
    if (assembledDepths.length > 0) filters.assembledDepth = assembledDepths;
    if (vendorNames.length > 0) filters.vendorName = vendorNames;
    if (units.length > 0) filters.units = units;

    // **PRIMARY STRATEGY: Vertex AI Search**
    const startTime = Date.now();
    
    // Debug URL parameters
    console.log('🔍 URL Parameters Debug:');
    console.log('  - query:', query);
    console.log('  - categories:', categories);
    console.log('  - brands:', brands);
    console.log('  - attributesCategories:', attributesCategories);
    console.log('  - materials:', materials);
    console.log('  - availabilities:', availabilities);
    console.log('  - warehouses:', warehouses);
    console.log('  - accsets:', accsets);
    console.log('  - warranties:', warranties);
    console.log('  - hasDiscounts:', hasDiscounts);
    console.log('  - discountPercents:', discountPercents);
    console.log('  - All searchParams:', Object.fromEntries(searchParams.entries()));
    
    console.log('🔍 Filters object passed to buildFilter:', JSON.stringify(filters, null, 2));
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


      const searchPromise = vertexAICommerceService.search({
        query: exact ? `"${query}"` : (query || ''), // Use exact match with quotes if exact=true
        visitorId,
        ...(userId ? { userInfo: { userId } } : {}),
        pageSize: limit,
        offset: offset,
        filter,
        orderBy,
        // Try both specific facets AND dynamic facets to see what works
        facetSpecs: [
          { facetKey: { key: 'attributes.brand' }, limit: 20 },
          { facetKey: { key: 'categories' }, limit: 20 },
          { facetKey: { key: 'availability' }, limit: 4 }
        ],
        // Also enable dynamic facets
        dynamicFacetSpec: {
          mode: 'ENABLED'
        }
      });

      const searchResponse = await Promise.race([searchPromise, timeoutPromise]);
      
      // Debug facets
      console.log('🔍 Facets Debug Information:');
      console.log(`   - searchResponse.facets exists: ${!!searchResponse.facets}`);
      console.log(`   - searchResponse.facets type: ${typeof searchResponse.facets}`);
      console.log(`   - searchResponse.facets array: ${Array.isArray(searchResponse.facets)}`);
      if (searchResponse.facets) {
        console.log(`   - searchResponse.facets length: ${searchResponse.facets.length}`);
        console.log(`   - searchResponse.facets content:`, JSON.stringify(searchResponse.facets, null, 2));
      }
      
      if (searchResponse.facets && searchResponse.facets.length > 0) {
        console.log('✅ Vertex AI returned facets!');
        console.log(`🎯 Facet count: ${searchResponse.facets.length}`);
        searchResponse.facets.forEach((facet: any, index: number) => {
          console.log(`   ${index + 1}. ${facet.key}: ${facet.values?.length || 0} values`);
          if (facet.values && facet.values.length > 0) {
            console.log(`      Sample values: ${facet.values.slice(0, 3).map((v: any) => `${v.value} (${v.count})`).join(', ')}`);
          }
        });
      } else {
        console.log('❌ No facets returned by Vertex AI');
        console.log('Response keys:', Object.keys(searchResponse));
      }

      if (searchResponse.results && searchResponse.results.length > 0) {
        console.log(`📦 Search results: ${searchResponse.results.length} products`);
        console.log(`📈 Total available: ${searchResponse.totalSize || 0} products`);
      }
      
      // Get full product details for each result
      const productIds = (searchResponse.results || []).map((result: any) => result.id);
      
      const fullProducts = await vertexAICommerceService.getProducts(productIds);
      
      if (fullProducts.length > 0) {

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
          

          
          // Count vendors (warehouses)
          if (product.vendorName) {
            vendorCount[product.vendorName] = (vendorCount[product.vendorName] || 0) + 1;
          }
        });

        // Ensure standard availability options are always present
        const standardAvailability = ['IN_STOCK', 'LOW_STOCK', 'OUT_OF_STOCK'];
        const availabilityFacets = standardAvailability.map(status => ({
          value: status,
          count: availabilityCount[status] || 0
        }));
        
        // Add any other availability statuses that exist in the data
        Object.entries(availabilityCount).forEach(([status, count]) => {
          if (!standardAvailability.includes(status)) {
            availabilityFacets.push({ value: status, count });
          }
        });

        return {
          categories: Object.entries(categoryCount)
            .map(([value, count]) => ({ value, count }))
            .sort((a, b) => b.count - a.count),
          brands: Object.entries(brandCount)
            .map(([value, count]) => ({ value, count }))
            .sort((a, b) => b.count - a.count),
          availability: availabilityFacets.sort((a, b) => b.count - a.count),
          accsets: Object.entries(accsetCount)
            .map(([value, count]) => ({ value, count }))
            .sort((a, b) => b.count - a.count),
          warehouses: Object.entries(vendorCount)
            .map(([value, count]) => ({ value, count }))
            .sort((a, b) => b.count - a.count),
        };
      };

      // Check if Vertex AI provided facets, if not generate them from products
      const hasFacets = searchResponse.facets && searchResponse.facets.length > 0;
      
      // Enhanced facet mapping with comprehensive dynamic facet support
      const mapVertexFacetsToOurFormat = (vertexFacets: any[]) => {
        const facets: any = {
          categories: [],
          brands: [],
          attributesCategory: [],
          availability: [],
          accsets: [],
          warehouses: [],
          // Extended comprehensive facets
          materials: [],
          driveDesign: [],
          bitSizes: [],
          warranty: [],
          pieces: [],
          hasDiscount: [],
          discountPercent: [],
          bitMaterial: [],
          screwdriverBitType: [],
          drillBitType: [],
          bitType: [],
          chuckSize: [],
          shankDiameter: [],
          assembledWeight: [],
          assembledHeight: [],
          assembledWidth: [],
          assembledDepth: [],
          vendorName: [],
          units: []
        };

        // Log all available facets from Vertex AI for debugging
        console.log('🔍 Available Vertex AI Facets:', vertexFacets.map(f => ({ key: f.key, valueCount: f.values?.length })));

        // Map each facet from Vertex AI to our format
        vertexFacets.forEach((facet: any) => {
          const key = facet.key;
          const values = facet.values?.map((v: any) => ({ value: v.value, count: v.count })) || [];
          
          // Map based on facet key patterns
          switch (key) {
            case 'categories':
            case 'category':
              facets.categories = values;
              break;
            case 'attributes.brand':
            case 'attributes.brand.text':
            case 'brand':
              facets.brands = values;
              break;
            case 'attributes.category':
            case 'attributes.category.text':
            case 'attributesCategory':
              facets.attributesCategory = values;
              break;
            case 'availability':
              facets.availability = values;
              break;
            case 'attributes.accset':
            case 'accset':
              facets.accsets = values;
              break;
            case 'attributes.vendor':
            case 'attributes.vendor.text':
            case 'attributes.vendorName':
            case 'vendorName':
            case 'vendor':
              facets.warehouses = values;
              break;
            // Material facets
            case 'attributes.cs_material.text':
            case 'attributes.cs_material':
            case 'attributes.ga_material.text':
            case 'attributes.ga_material':
            case 'attributes.material.text':
            case 'material':
              facets.materials = [...facets.materials, ...values];
              break;
            // Drive design
            case 'attributes.cs_drive_design.text':
            case 'attributes.ga_drive_design.text':
            case 'driveDesign':
              facets.driveDesign = values;
              break;
            // Bit materials
            case 'attributes.cs_bit_material.text':
            case 'attributes.ga_bit_material.text':
            case 'bitMaterial':
              facets.bitMaterial = values;
              break;
            // Bit types
            case 'attributes.cs_bit_type.text':
            case 'attributes.ga_bit_type.text':
            case 'bitType':
              facets.bitType = values;
              break;
            // Chuck size
            case 'attributes.cs_chuck_size.text':
            case 'attributes.ga_chuck_size.text':
            case 'chuckSize':
              facets.chuckSize = values;
              break;
            // Warranty
            case 'attributes.ga_warranty.text':
            case 'attributes.ga_warranty':
            case 'warranty':
              facets.warranty = values;
              break;
            // Discount info
            case 'attributes.hasDiscount.text':
            case 'attributes.hasDiscount':
            case 'hasDiscount':
              facets.hasDiscount = values;
              break;
            case 'attributes.discountPercent.numbers':
            case 'attributes.discountPercent':
            case 'discountPercent':
              facets.discountPercent = values;
              break;
            // Physical dimensions
            case 'attributes.assembledWeight.text':
              facets.assembledWeight = values;
              break;
            case 'attributes.assembledHeight.text':
              facets.assembledHeight = values;
              break;
            case 'attributes.assembledWidth.text':
              facets.assembledWidth = values;
              break;
            case 'attributes.assembledDepth.text':
              facets.assembledDepth = values;
              break;
            // Units
            case 'units':
              facets.units = values;
              break;
            // Shank diameter
            case 'attributes.cs_shank_diameter.text':
              facets.shankDiameter = values;
              break;
            // Color facets  
            case 'attributes.cs_color':
            case 'attributes.cs_color.text':
            case 'color':
              // Map colors to bitSizes for now (temporary)
              facets.bitSizes = values;
              break;
            default:
              // For any unrecognized facets, try to map them to a reasonable category
              console.log(`🤔 Unmapped facet key: ${key} with ${values.length} values`);
              break;
          }
        });

        // Deduplicate and sort facets
        Object.keys(facets).forEach(key => {
          if (Array.isArray(facets[key])) {
            // Remove duplicates and sort by count (desc) then by value (asc)
            const uniqueValues = new Map();
            facets[key].forEach((item: any) => {
              if (uniqueValues.has(item.value)) {
                uniqueValues.set(item.value, {
                  value: item.value,
                  count: uniqueValues.get(item.value).count + item.count
                });
              } else {
                uniqueValues.set(item.value, item);
              }
            });
            facets[key] = Array.from(uniqueValues.values())
              .sort((a, b) => b.count - a.count || a.value.localeCompare(b.value));
          }
        });

        return facets;
      };
      
      const facets = hasFacets ? mapVertexFacetsToOurFormat(searchResponse.facets) : generateFacetsFromProducts(products);

      // Apply post-processing sorting for unsupported Vertex AI sorts or textual fields
      if (sortBy === 'availability' || sortBy === 'text_match_desc' || sortBy === 'recently_purchased' || sortBy === 'rating_desc' || sortBy === 'rating_asc') {
            
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
      
      // **FALLBACK: Try local data service with filtering**
      console.log('🔄 Vertex AI failed, falling back to local data service with filtering...');
      try {
        const { dataService } = await import('@/lib/data');
        await dataService.initialize();
        
        const localFilters: any = {};
        if (categories.length > 0) localFilters.category = categories;
        if (brands.length > 0) localFilters.brand = brands;
    
        if (availabilities.length > 0) localFilters.availability = availabilities;
        if (warehouses.length > 0) localFilters.warehouse = warehouses;
        if (accsets.length > 0) localFilters.accset = accsets;
        if (priceMin !== undefined && priceMax !== undefined) {
          localFilters.priceRange = { min: priceMin, max: priceMax };
        }
        
        const localSearchResult = await dataService.search(query, localFilters, offset, limit, sortBy);
        
        // Transform local results to match expected format
        const localProducts = localSearchResult.products.map((product: any) => ({
          id: product.sku,
          sku: product.sku,
          displayName: product.displayName,
          title: product.displayName,
          description: product.description,
          category: product.category,
          brand: product.brand,
          vendor: product.vendor,
          vendorName: product.vendorName,
          units: product.units,
          isSFPreferred: product.isSFPreferred,
          imageURL: product.imageURL,
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
          webSubDesc: product.webSubDesc || '',
          warehouse: product.warehouse || [],
          // Raw data for consistency
          images: [],
          attributes: {},
          priceInfo: { price: product.price || 0 },
          rating: {},
          tags: product.keywords || [],
          categories: [product.category].filter(Boolean),
          variants: []
        }));

        const response = {
          success: true,
          data: {
            products: localProducts,
            facets: localSearchResult.facets,
            total: localSearchResult.total,
            queryTime: Date.now() - startTime,
          },
          nextPageToken: null,
          source: 'local-fallback'
        };

        console.log(`✅ Local fallback successful: ${localProducts.length} products with filters`);
        cache.set(cacheKey, response.data, 2 * 60 * 1000); // Cache for 2 minutes
        return NextResponse.json(response);
      } catch (localError) {
        console.error('❌ Local fallback also failed:', localError);
        
        // **ULTIMATE FALLBACK: Return empty but valid response**
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
              availability: [
                { value: 'IN_STOCK', count: 0 },
                { value: 'LOW_STOCK', count: 0 },
                { value: 'OUT_OF_STOCK', count: 0 }
              ]
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
          availability: [
            { value: 'IN_STOCK', count: 0 },
            { value: 'LOW_STOCK', count: 0 },
            { value: 'OUT_OF_STOCK', count: 0 }
          ]
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

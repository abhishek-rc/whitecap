import { NextRequest, NextResponse } from 'next/server';
import { cache } from '@/lib/cache';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const nocache = searchParams.get('nocache') === 'true';
    
    // Generate cache key for vertex AI filters
    const cacheKey = 'vertex-ai-filters';
    
    // Check cache first (unless nocache is specified)
    if (!nocache) {
      const cachedResult = cache.get(cacheKey);
      if (cachedResult) {
        return NextResponse.json({
          success: true,
          data: cachedResult,
          source: 'cache'
        });
      }
    }

    // Use the same approach as the search page - call our own search API internally
    // This ensures we get the same facets format and logic
    const searchTerms = ['milwaukee', 'tool', 'power', 'equipment', 'drill'];
    const allFilters = {
      categories: new Map(),
      brands: new Map(),
      availability: new Map(),
      warehouses: new Map(),
      accsets: new Map(),
      // Add comprehensive filters for all product attributes
      attributesCategory: new Map(),
      materials: new Map(),
      driveDesign: new Map(),
      bitSizes: new Map(),
      warranty: new Map(),
      pieces: new Map(),
      hasDiscount: new Map(),
      discountPercent: new Map(),
      bitMaterial: new Map(),
      screwdriverBitType: new Map(),
      drillBitType: new Map(),
      bitType: new Map(),
      chuckSize: new Map(),
      shankDiameter: new Map(),
      assembledWeight: new Map(),
      assembledHeight: new Map(),
      assembledWidth: new Map(),
      assembledDepth: new Map(),
      vendorName: new Map(),
      units: new Map()
    };

    // Perform multiple searches to get comprehensive facets
    for (const term of searchTerms) {
      try {
        
        // Call our own search API internally
        const searchUrl = new URL('/api/search', request.url);
        searchUrl.searchParams.set('q', term);
        searchUrl.searchParams.set('limit', '50');
        
        const searchResponse = await fetch(searchUrl.toString(), {
          headers: {
            'User-Agent': 'Internal-Vertex-Filters-API'
          }
        });
        
        if (!searchResponse.ok) {          continue;
        }
        
        const searchData = await searchResponse.json();
        
        if (searchData.success && searchData.data) {
          const { facets, products } = searchData.data;
          
          
          // Merge standard facets from this search
          if (facets?.categories) {
            facets.categories.forEach((cat: any) => {
              const existing = allFilters.categories.get(cat.value);
              allFilters.categories.set(cat.value, {
                value: cat.value,
                count: existing ? existing.count + cat.count : cat.count
              });
            });
          }
          
          if (facets?.brands) {
            facets.brands.forEach((brand: any) => {
              const existing = allFilters.brands.get(brand.value);
              allFilters.brands.set(brand.value, {
                value: brand.value,
                count: existing ? existing.count + brand.count : brand.count
              });
            });
          }
          
          if (facets?.availability) {
            facets.availability.forEach((avail: any) => {
              const existing = allFilters.availability.get(avail.value);
              allFilters.availability.set(avail.value, {
                value: avail.value,
                count: existing ? existing.count + avail.count : avail.count
              });
            });
          }
          
          if (facets?.warehouses) {
            facets.warehouses.forEach((warehouse: any) => {
              const existing = allFilters.warehouses.get(warehouse.value);
              allFilters.warehouses.set(warehouse.value, {
                value: warehouse.value,
                count: existing ? existing.count + warehouse.count : warehouse.count
              });
            });
          }
          
          if (facets?.accsets) {
            facets.accsets.forEach((accset: any) => {
              const existing = allFilters.accsets.get(accset.value);
              allFilters.accsets.set(accset.value, {
                value: accset.value,
                count: existing ? existing.count + accset.count : accset.count
              });
            });
          }

          // Extract ALL possible filters from product attributes
          if (products) {
            products.forEach((product: any) => {
              const attrs = product.attributes || {};
              
              // Helper function to add attribute value to filter map
              const addToFilter = (filterMap: Map<string, any>, values: string[]) => {
                values.forEach(value => {
                  if (value && value.trim()) {
                    const existing = filterMap.get(value);
                    filterMap.set(value, {
                      value: value,
                      count: existing ? existing.count + 1 : 1
                    });
                  }
                });
              };

              // Extract comprehensive attributes
              if (attrs.category?.text) addToFilter(allFilters.attributesCategory, attrs.category.text);
              if (attrs.cs_material?.text) addToFilter(allFilters.materials, attrs.cs_material.text);
              if (attrs.ga_material?.text) addToFilter(allFilters.materials, attrs.ga_material.text);
              if (attrs.cs_drive_design?.text) addToFilter(allFilters.driveDesign, attrs.cs_drive_design.text);
              if (attrs.cs_bit_sizes?.text) addToFilter(allFilters.bitSizes, attrs.cs_bit_sizes.text);
              if (attrs.ga_warranty?.text) addToFilter(allFilters.warranty, attrs.ga_warranty.text);
              if (attrs.cs_pieces?.text) addToFilter(allFilters.pieces, attrs.cs_pieces.text);
              if (attrs.hasDiscount?.text) addToFilter(allFilters.hasDiscount, attrs.hasDiscount.text);
              if (attrs.cs_bit_material?.text) addToFilter(allFilters.bitMaterial, attrs.cs_bit_material.text);
              if (attrs.cs_screwdriver_bit_type?.text) addToFilter(allFilters.screwdriverBitType, attrs.cs_screwdriver_bit_type.text);
              if (attrs.cs_drill_bit_type?.text) addToFilter(allFilters.drillBitType, attrs.cs_drill_bit_type.text);
              if (attrs.cs_bit_type?.text) addToFilter(allFilters.bitType, attrs.cs_bit_type.text);
              if (attrs.cs_chuck_size?.text) addToFilter(allFilters.chuckSize, attrs.cs_chuck_size.text);
              if (attrs.cs_minimum_chuck_size?.text) addToFilter(allFilters.chuckSize, attrs.cs_minimum_chuck_size.text);
              if (attrs.cs_shank_diameter?.text) addToFilter(allFilters.shankDiameter, attrs.cs_shank_diameter.text);
              if (attrs.cs_assembled_weight_lbs?.text) addToFilter(allFilters.assembledWeight, attrs.cs_assembled_weight_lbs.text);
              if (attrs.cs_assembled_height_in?.text) addToFilter(allFilters.assembledHeight, attrs.cs_assembled_height_in.text);
              if (attrs.cs_assembled_width_in?.text) addToFilter(allFilters.assembledWidth, attrs.cs_assembled_width_in.text);
              if (attrs.cs_assembled_depth_in?.text) addToFilter(allFilters.assembledDepth, attrs.cs_assembled_depth_in.text);
              if (product.vendorName) addToFilter(allFilters.vendorName, [product.vendorName]);
              if (product.units) addToFilter(allFilters.units, [product.units]);

              // Handle discount percentages (numbers)
              if (attrs.discountPercent?.numbers) {
                attrs.discountPercent.numbers.forEach((discount: number) => {
                  const range = discount < 10 ? '0-10%' : 
                              discount < 20 ? '10-20%' :
                              discount < 30 ? '20-30%' :
                              discount < 50 ? '30-50%' : '50%+';
                  const existing = allFilters.discountPercent.get(range);
                  allFilters.discountPercent.set(range, {
                    value: range,
                    count: existing ? existing.count + 1 : 1
                  });
                });
              }
            });
          }
        }
      } catch (error) {
        console.log(`❌ Error searching for term ${term}:`, error);
      }
    }

    // Convert Maps to arrays and sort by count (descending)
    const filters = {
      // Standard filters
      categories: Array.from(allFilters.categories.values()).sort((a, b) => b.count - a.count),
      brands: Array.from(allFilters.brands.values()).sort((a, b) => b.count - a.count),
      availability: Array.from(allFilters.availability.values()).sort((a, b) => b.count - a.count),
      warehouses: Array.from(allFilters.warehouses.values()).sort((a, b) => b.count - a.count),
      accsets: Array.from(allFilters.accsets.values()).sort((a, b) => b.count - a.count),
      
      // Comprehensive product attribute filters
      attributesCategory: Array.from(allFilters.attributesCategory.values()).sort((a, b) => b.count - a.count),
      materials: Array.from(allFilters.materials.values()).sort((a, b) => b.count - a.count),
      driveDesign: Array.from(allFilters.driveDesign.values()).sort((a, b) => b.count - a.count),
      bitSizes: Array.from(allFilters.bitSizes.values()).sort((a, b) => b.count - a.count),
      warranty: Array.from(allFilters.warranty.values()).sort((a, b) => b.count - a.count),
      pieces: Array.from(allFilters.pieces.values()).sort((a, b) => b.count - a.count),
      hasDiscount: Array.from(allFilters.hasDiscount.values()).sort((a, b) => b.count - a.count),
      discountPercent: Array.from(allFilters.discountPercent.values()).sort((a, b) => b.count - a.count),
      bitMaterial: Array.from(allFilters.bitMaterial.values()).sort((a, b) => b.count - a.count),
      screwdriverBitType: Array.from(allFilters.screwdriverBitType.values()).sort((a, b) => b.count - a.count),
      drillBitType: Array.from(allFilters.drillBitType.values()).sort((a, b) => b.count - a.count),
      bitType: Array.from(allFilters.bitType.values()).sort((a, b) => b.count - a.count),
      chuckSize: Array.from(allFilters.chuckSize.values()).sort((a, b) => b.count - a.count),
      shankDiameter: Array.from(allFilters.shankDiameter.values()).sort((a, b) => b.count - a.count),
      assembledWeight: Array.from(allFilters.assembledWeight.values()).sort((a, b) => b.count - a.count),
      assembledHeight: Array.from(allFilters.assembledHeight.values()).sort((a, b) => b.count - a.count),
      assembledWidth: Array.from(allFilters.assembledWidth.values()).sort((a, b) => b.count - a.count),
      assembledDepth: Array.from(allFilters.assembledDepth.values()).sort((a, b) => b.count - a.count),
      vendorName: Array.from(allFilters.vendorName.values()).sort((a, b) => b.count - a.count),
      units: Array.from(allFilters.units.values()).sort((a, b) => b.count - a.count),
      
      // Price ranges (static for now)
      priceRanges: [
        { min: 0, max: 25, count: 100 },
        { min: 25, max: 50, count: 150 },
        { min: 50, max: 100, count: 200 },
        { min: 100, max: 200, count: 120 },
        { min: 200, max: 500, count: 80 }
      ]
    };
    const response = {
      success: true,
      data: filters,
      source: 'vertex-ai-aggregated-search',
      totalFacets: filters.categories.length + filters.brands.length + filters.availability.length,
      searchTermsUsed: searchTerms.length
    };

    // Cache the result for 15 minutes since filters don't change frequently
    cache.set(cacheKey, filters, 15 * 60 * 1000);
    
      

    return NextResponse.json(response);

  } catch (error) {
    console.error('❌ Error fetching filters from Vertex AI:', error);
    
    // Return fallback filters if Vertex AI fails
    const fallbackFilters = {
      categories: [
        { value: 'General Products', count: 0 },
        { value: 'Tools & Hardware', count: 0 },
        { value: 'Electrical', count: 0 }
      ],
      brands: [
        { value: 'Milwaukee', count: 0 },
        { value: 'DEWALT', count: 0 },
        { value: 'Bosch', count: 0 }
      ],
      availability: [
        { value: 'Available', count: 0 },
        { value: 'Not Available', count: 0 }
      ],
      attributesCategory: [
        { value: 'Hand Tools', count: 0 },
        { value: 'Power Tools and Equipment', count: 0 },
        { value: 'Anchoring and Fasteners', count: 0 }
      ],
      priceRanges: [],
      warehouses: [],
      accsets: [],
      vendors: [],
      vendorNames: [],
      webCategories: [],
      webSubCategories: []
    };

    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      data: fallbackFilters,
      source: 'fallback'
    }, { status: 500 });
  }
}
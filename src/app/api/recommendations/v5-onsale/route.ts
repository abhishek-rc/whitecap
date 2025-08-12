import { NextRequest, NextResponse } from 'next/server';
import { vertexAICommerceService } from '@/lib/vertex-ai-commerce';

interface FullProduct {
  id: string;
  name?: string;
  title?: string;
  displayName?: string;
  description?: string;
  summary?: string;
  categories?: string[];
  primaryCategory?: string;
  category?: string;
  images?: Array<{ uri?: string; url?: string }>;
  imageUrl?: string;
  imageURL?: string;
  priceInfo?: {
    price?: number;
    originalPrice?: number;
    currencyCode?: string;
  };
  price?: number;
  availability?: string;
  availableQuantity?: number;
  attributes?: {
    [key: string]: {
      text?: string[];
      textValue?: string[];
      numbers?: number[];
    };
  };
  tags?: string[];
  brand?: string;
  isSFPreferred?: boolean;
}

interface VertexAIResult {
  id: string;
  priceInfo?: {
    price?: number;
    originalPrice?: number;
    currencyCode?: string;
  };
  price?: number;
  availableQuantity?: number;
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
      totalStock?: { numbers?: number[] };
      stockWarehouses?: { numbers?: number[] };
    };
    availability?: string;
    score?: number;
    priceInfo?: {
      price?: number;
      originalPrice?: number;
      currencyCode?: string;
    };
    price?: number;
    availableQuantity?: number;
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
        totalStock?: { numbers?: number[] };
        stockWarehouses?: { numbers?: number[] };
      };
      availability?: string;
      priceInfo?: {
        price?: number;
        originalPrice?: number;
        currencyCode?: string;
      };
      price?: number;
      availableQuantity?: number;
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

    // Build user event for v5-onsale products context
    const userEvent = {
      eventType: 'detail-page-view' as const,
      visitorId,
      eventTime: new Date().toISOString(),
      uri: '/recommendations/v5-onsale',
      pageCategories: categoryFilter ? [categoryFilter] : [],
      productDetails: [{
        product: {
          id: 'v5-onsale-context',
          type: 'PRIMARY' as const,
          categories: categoryFilter ? [categoryFilter] : [],
          title: 'V5 On Sale Products Context',
          languageCode: 'en',
          availability: 'IN_STOCK' as const
        },
        quantity: 1
      }],
      attributes: {
        context: {
          text: ['v5-onsale', 'on-sale', 'promotion', 'discount'],
          searchable: true,
          indexable: true
        }
      }
    };

    // Build filter for v5-onsale products if category or brand is specified
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

    console.log('🏷️ Getting v5-onsale recommendations:', {
      visitorId,
      limit,
      categoryFilter,
      brandFilter,
      filter
    });

    // Get v5-onsale products from Vertex AI using the new v5-onsale model
    const predictionResponse = await vertexAICommerceService.predict(
      'v5-onsale',
      userEvent,
      limit,
      filter
    );

    console.log('📊 V5-onsale prediction response:', {
      resultCount: predictionResponse.results?.length || 0,
      hasResults: !!predictionResponse.results
    });

    // Get full product details for each result (like search API does)
    const productIds = (predictionResponse.results || []).map((result: VertexAIResult) => result.id);
    const fullProducts = await vertexAICommerceService.getProducts(productIds);
    
    console.log('📦 Full product details fetched for v5-onsale:', {
      requestedIds: productIds.length,
      receivedProducts: fullProducts.length
    });

    // Transform results using full product data (like search API does)
    const products = fullProducts.map((product: FullProduct) => {
      const title = product.title || product.name || product.displayName || product.id;
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
      const sku = attributes.sku?.text?.[0] || attributes.sku?.textValue?.[0] || product.id;

      return {
        id: product.id,
        sku: sku,
        displayName: title,
        description: description,
        category: category,
        brand: brand,
        vendor: vendor,
        vendorName: vendorName,
        units: units,
        isSFPreferred: isSFPreferred,
        imageURL: imageUrl,
        availability: availability,
        categoryDesc: category,
        urlSlug: product.id.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
        price: price, // Now using actual product pricing data
        accset: 'VERTEX_AI',
        keywords: ['v5-onsale', 'on-sale', 'promotion', 'discount'],
        orderLastMonth: 0,
        isActive: true,
        isDeleted: false,
        webCategory: category,
        webSubCategory: product.categories?.[1] || '',
        webCategoryDesc: category,
        webDesc: description,
        webSubDesc: description,
        // Stock information from full product data
        availableQuantity: product.availableQuantity || attributes.availableQuantity?.numbers?.[0] || 0,
        totalStock: attributes.totalStock?.numbers?.[0] || product.availableQuantity || 0,
        stockWarehouses: attributes.stockWarehouses?.numbers?.[0] || 0,
        score: 0.9,
        reason: 'V5 on-sale products from enhanced Vertex AI recommendation model with full product data'
      };
    });

    const responseData = {
      products,
      score: products.length > 0 ? 0.9 : 0,
      reason: products.length > 0 
        ? 'V5 on-sale products from enhanced Vertex AI recommendation model' 
        : 'No v5-onsale products found',
      count: products.length,
      totalPages: Math.ceil(products.length / limit),
      currentPage: 1,
      type: 'v5-onsale',
      model: 'v5-onsale',
      placement: 'v5-onsale'
    };

    console.log('✅ V5-onsale recommendations response:', {
      productCount: products.length,
      score: responseData.score
    });

    return NextResponse.json(responseData);

  } catch (error) {
    console.error('❌ V5-onsale recommendations error:', error);
    
    return NextResponse.json({
      products: [],
      score: 0,
      reason: 'Error fetching v5-onsale recommendations',
      count: 0,
      totalPages: 0,
      currentPage: 1,
      type: 'v5-onsale',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

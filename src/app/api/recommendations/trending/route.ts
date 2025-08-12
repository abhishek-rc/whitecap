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
  };
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '10');
    const visitorId = searchParams.get('visitorId') || 'anonymous-user';
    const categoryFilter = searchParams.get('category');

    // Build user event for context
    const userEvent = {
      eventType: 'home-page-view' as const,
      visitorId,
      eventTime: new Date().toISOString(),
      uri: '/'
    };

    // Build filter for categories if provided
    let filter = '';
    if (categoryFilter) {
      filter = `categories: ANY("${categoryFilter}")`;
    }

    console.log('🔥 Getting trending products from Vertex AI:', {
      visitorId,
      limit,
      categoryFilter,
      filter
    });

    // Get trending products from Vertex AI
    const predictionResponse = await vertexAICommerceService.predict(
      'trending',
      userEvent,
      limit,
      filter
    );

    console.log('📊 Trending prediction response:', {
      resultCount: predictionResponse.results?.length || 0,
      hasResults: !!predictionResponse.results
    });

    // Debug: Log raw result structure to understand pricing data location
    if (predictionResponse.results && predictionResponse.results.length > 0) {
      console.log('🔍 First trending result structure:', JSON.stringify(predictionResponse.results[0], null, 2));
    }

    // Get full product details for each result (like search API does)
    const productIds = (predictionResponse.results || []).map((result: VertexAIResult) => result.id);
    const fullProducts = await vertexAICommerceService.getProducts(productIds);
    
    console.log('📦 Full product details fetched:', {
      requestedIds: productIds.length,
      receivedProducts: fullProducts.length,
      firstProductStructure: fullProducts[0] ? JSON.stringify(fullProducts[0], null, 2) : 'No products'
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
        keywords: product.tags || [],
        orderLastMonth: 0,
        isActive: true,
        isDeleted: false,
        webCategory: category,
        // Stock information from full product data
        availableQuantity: product.availableQuantity || attributes.availableQuantity?.numbers?.[0] || 0,
        totalStock: attributes.totalStock?.numbers?.[0] || product.availableQuantity || 0,
        stockWarehouses: attributes.stockWarehouses?.numbers?.[0] || 0,
        score: 0.9,
        reason: 'Trending products from Vertex AI with full product data'
      };
    });

    // If no results from Vertex AI trending, try using v5-onsale as fallback for trending-style results
    if (products.length === 0) {
      console.log('🔄 No Vertex AI trending results, trying v5-onsale as fallback...');
      
      try {
        // Try v5-onsale model as fallback for trending
        const fallbackResponse = await vertexAICommerceService.predict(
          'v5-onsale',
          userEvent,
          limit,
          filter
        );

        console.log('📊 V5-onsale fallback response:', {
          resultCount: fallbackResponse.results?.length || 0,
          hasResults: !!fallbackResponse.results
        });

        // Get full product details for fallback results
        const fallbackProductIds = (fallbackResponse.results || []).map((result: VertexAIResult) => result.id);
        const fallbackFullProducts = await vertexAICommerceService.getProducts(fallbackProductIds);

        // Transform fallback results with trending-style labeling
        const fallbackProducts = fallbackFullProducts.map((product: FullProduct) => {
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
            price: price,
            accset: 'VERTEX_AI',
            keywords: ['trending', 'popular', 'recommendation'], // Trending-style keywords
            orderLastMonth: 0,
            isActive: true,
            isDeleted: false,
            webCategory: category,
            availableQuantity: product.availableQuantity || attributes.availableQuantity?.numbers?.[0] || 0,
            totalStock: attributes.totalStock?.numbers?.[0] || product.availableQuantity || 0,
            stockWarehouses: attributes.stockWarehouses?.numbers?.[0] || 0,
            score: 0.9,
            reason: 'Trending products from v5-onsale model (trending placement fallback)'
          };
        });

        if (fallbackProducts.length > 0) {
          return NextResponse.json({
            products: fallbackProducts,
            score: 0.9,
            reason: 'Trending products from v5-onsale model (trending placement fallback)',
            count: fallbackProducts.length,
            type: 'trending'
          });
        }
      } catch (fallbackError) {
        console.error('❌ V5-onsale fallback also failed:', fallbackError);
      }
      
      return NextResponse.json({
        products: [],
        score: 0,
        reason: 'No trending products available from Vertex AI at this time',
        count: 0,
        type: 'trending'
      });
    }

    return NextResponse.json({
      products,
      score: products.length > 0 ? 0.9 : 0,
      reason: products.length > 0 ? 'Trending products from Vertex AI' : 'No trending products found',
      count: products.length,
      type: 'trending'
    });

  } catch (error) {
    console.error('Trending products API error:', error);
    return NextResponse.json(
      { error: 'Failed to get trending products' },
      { status: 500 }
    );
  }
}

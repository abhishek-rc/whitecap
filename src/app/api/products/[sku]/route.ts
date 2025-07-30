import { NextRequest, NextResponse } from 'next/server';

interface VertexProduct {
  id?: string;
  sku?: string;
  title?: string;
  displayName?: string;
  name?: string;
  description?: string;
  summary?: string;
  brand?: string;
  brands?: string[];
  category?: string;
  categories?: string[];
  imageURL?: string;
  images?: Array<{ uri: string }>;
  image?: string;
  isSFPreferred?: boolean;
  units?: string;
  unit?: string;
  urlSlug?: string;
  availability?: string;
  availableQuantity?: number;
  accset?: string;
  keywords?: string[];
  vendor?: string;
  vendorName?: string;
  webCategory?: string;
  webSubCategory?: string;
  priceInfo?: {
    price?: number;
    currencyCode?: string;
  };
  price?: number;
  gtin?: string;
  mpn?: string;
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ sku: string }> }
) {
  try {
    const { sku } = await params;

    // Debug logging
    console.log('Product API called with SKU:', sku);
    console.log('SKU type:', typeof sku);
    console.log('SKU length:', sku?.length);

    if (!sku) {
      return NextResponse.json(
        { success: false, error: 'SKU parameter is required' },
        { status: 400 }
      );
    }

    // Get product data directly from Vertex AI
    console.log(`Fetching product ${sku} from Vertex AI...`);
    
    try {
      // Get the correct base URL for internal API calls
      const host = request.headers.get('host');
      const protocol = request.headers.get('x-forwarded-proto') || 'https';
      const baseUrl = `${protocol}://${host}`;
      
      console.log(`Using baseUrl: ${baseUrl}`);
      
      // Try exact search first
      console.log(`Trying exact search for SKU: ${sku}`);
      let vertexResponse = await fetch(`${baseUrl}/api/search?q=${encodeURIComponent(sku)}&exact=true&limit=20`, {
        headers: {
          'User-Agent': 'Internal-API-Call',
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        }
      });
      
      let vertexData = null;
      if (vertexResponse.ok) {
        vertexData = await vertexResponse.json();
        console.log(`Exact search response:`, vertexData?.success ? 'Success' : 'Failed', `Products found: ${vertexData?.data?.products?.length || 0}`);
      } else {
        console.log(`Exact search failed with status: ${vertexResponse.status}`);
      }
      
      // If exact search doesn't work or returns no results, try regular search
      if (!vertexData?.success || !vertexData?.data?.products?.length) {
        console.log(`Exact search failed for ${sku}, trying regular search...`);
        vertexResponse = await fetch(`${baseUrl}/api/search?q=${encodeURIComponent(sku)}&limit=20`, {
          headers: {
            'User-Agent': 'Internal-API-Call',
            'Accept': 'application/json',
            'Content-Type': 'application/json'
          }
        });
        
        if (vertexResponse.ok) {
          vertexData = await vertexResponse.json();
          console.log(`Regular search response:`, vertexData?.success ? 'Success' : 'Failed', `Products found: ${vertexData?.data?.products?.length || 0}`);
        } else {
          console.log(`Regular search failed with status: ${vertexResponse.status}`);
        }
      }
      
      if (vertexData?.success && vertexData.data.products.length > 0) {
        // Look for exact SKU match first
        let vertexProduct = vertexData.data.products.find((p: VertexProduct) => p.sku === sku);
        
        // If no exact match, try case-insensitive
        if (!vertexProduct) {
          vertexProduct = vertexData.data.products.find((p: VertexProduct) => 
            p.sku?.toLowerCase() === sku.toLowerCase()
          );
        }
        
        // If still no match, try to find by product ID or other identifiers
        if (!vertexProduct) {
          vertexProduct = vertexData.data.products.find((p: VertexProduct) => 
            p.id === sku || p.gtin === sku || p.mpn === sku
          );
        }
        
        // If still no match, take the first result if it's similar enough
        if (!vertexProduct && vertexData.data.products.length > 0) {
          const firstProduct = vertexData.data.products[0];
          if (firstProduct.sku && (
            firstProduct.sku.includes(sku) || 
            sku.includes(firstProduct.sku) ||
            firstProduct.title?.toLowerCase().includes(sku.toLowerCase()) ||
            firstProduct.displayName?.toLowerCase().includes(sku.toLowerCase())
          )) {
            vertexProduct = firstProduct;
            console.log(`Using similar product match: ${firstProduct.sku} for requested SKU: ${sku}`);
          }
        }
        
        if (vertexProduct) {
          console.log(`Found product in Vertex AI: ${vertexProduct.sku || vertexProduct.id}`);
          
          // Convert Vertex AI product to standardized format
          const product = {
            id: vertexProduct.id || sku,
            sku: vertexProduct.sku || sku,
            displayName: vertexProduct.displayName || vertexProduct.title || vertexProduct.name || 'Unknown Product',
            description: vertexProduct.description || vertexProduct.summary || '',
            brand: vertexProduct.brand || vertexProduct.brands?.[0] || '',
            category: vertexProduct.category || vertexProduct.categories?.[0] || '',
            categoryDesc: vertexProduct.categories?.join(' > ') || '',
            imageURL: vertexProduct.imageURL || vertexProduct.images?.[0]?.uri || vertexProduct.image || '',
            isSFPreferred: vertexProduct.isSFPreferred || false,
            units: vertexProduct.units || vertexProduct.unit || 'each',
            urlSlug: vertexProduct.urlSlug || '',
            availability: vertexProduct.availability || (vertexProduct.availableQuantity && vertexProduct.availableQuantity > 0 ? 'Available' : 'Out of Stock'),
            accset: vertexProduct.accset || '',
            keywords: Array.isArray(vertexProduct.keywords) ? vertexProduct.keywords : [],
            isActive: true,
            isDeleted: false,
            vendor: vertexProduct.vendor || '',
            vendorName: vertexProduct.vendorName || '',
            webCategory: vertexProduct.webCategory || vertexProduct.category || '',
            webSubCategory: vertexProduct.webSubCategory || '',
            webCategoryDesc: vertexProduct.categories?.[0] || '',
            webDesc: vertexProduct.description || '',
            webSubDesc: vertexProduct.categories?.[1] || '',
            price: vertexProduct.priceInfo?.price || vertexProduct.price || 0,
            currency: vertexProduct.priceInfo?.currencyCode || 'USD'
          };
          
          // Create stock info based on Vertex AI data
          const stockInfo = [{
            productCode: product.sku,
            productName: product.displayName,
            availableQuantity: vertexProduct.availableQuantity || 0,
            warehouse: 'vertex-ai-commerce',
            status: product.availability,
            averageCost: product.price || 0,
            lastCost: product.price || 0,
            standardCost: product.price || 0,
            costUnit: product.units,
            isActive: true
          }];
          
          return NextResponse.json({
            success: true,
            data: {
              product,
              stock: stockInfo
            },
            source: 'vertex-ai-commerce',
            matchType: vertexProduct.sku === sku ? 'exact' : 'similar'
          });
        }
      }
      
      // If we have search results but no good matches, show suggestions
      if (vertexData?.success && vertexData.data.products.length > 0) {
        const suggestions = vertexData.data.products.slice(0, 5).map((p: VertexProduct) => ({
          sku: p.sku || p.id,
          displayName: p.displayName || p.title || p.name,
          description: p.description || p.summary || ''
        }));
        
        return NextResponse.json({
          success: false,
          error: 'Product not found',
          searchedFor: sku,
          suggestions,
          note: 'Exact product not found, but here are some similar products from Vertex AI.'
        }, { status: 404 });
      }
      
    } catch (error) {
      console.error('Error fetching from Vertex AI:', error);
    }
    
    // No product found anywhere
    return NextResponse.json(
      { 
        success: false, 
        error: 'Product not found',
        searchedFor: sku,
        note: 'Product not found in Vertex AI Commerce. The product may not exist or may not be indexed yet.'
      },
      { status: 404 }
    );
    
  } catch (error) {
    console.error('Product API error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

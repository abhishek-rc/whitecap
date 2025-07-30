/**
 * Direct Google Retail API Implementation
 * Using the exact same API calls that work in GCP Dashboard
 */

import { GoogleAuth } from 'google-auth-library';

interface RetailAPIProduct {
  id: string;
  name?: string;
  title?: string;
  description?: string;
  categories?: string[];
  images?: { uri: string }[];
  attributes?: {
    [key: string]: {
      text?: string[];
      numbers?: number[];
    };
  };
  availability?: string;
  priceInfo?: {
    price?: number;
    originalPrice?: number;
    cost?: number;
    currencyCode?: string;
  };
}

interface RetailAPIPredictResponse {
  results?: {
    id: string;
    product?: RetailAPIProduct;
    metadata?: RetailAPIProduct;
  }[];
  attributionToken?: string;
  missingIds?: string[];
  validateOnly?: boolean;
}

class RetailAPIDirect {
  private auth: GoogleAuth;
  private projectId: string;
  private catalogId: string;

  constructor() {
    this.auth = new GoogleAuth({
      scopes: ['https://www.googleapis.com/auth/cloud-platform'],
      keyFilename: process.env.GOOGLE_APPLICATION_CREDENTIALS || './vertex-ai-key.json'
    });
    this.projectId = process.env.GOOGLE_CLOUD_PROJECT_ID || '1053628646950';
    this.catalogId = process.env.VERTEX_AI_CATALOG_ID || 'default_catalog';
  }

  async getAuthHeaders(): Promise<{ [key: string]: string }> {
    const client = await this.auth.getClient();
    const accessToken = await client.getAccessToken();
    
    return {
      'Authorization': `Bearer ${accessToken.token}`,
      'Content-Type': 'application/json'
    };
  }

  /**
   * Get similar items using the exact API call from GCP Dashboard
   */
  async getSimilarItems(productId: string, visitorId?: string, limit: number = 10): Promise<RetailAPIPredictResponse> {
    const placementId = 'similar-items';
    const endpoint = `https://retail.googleapis.com/v2alpha/projects/${this.projectId}/locations/global/catalogs/${this.catalogId}/placements/${placementId}:predict`;
    
    const payload = {
      userEvent: {
        eventType: "shopping-cart-page-view",
        visitorId: visitorId || `widget-${Date.now()}`,
        productDetails: [
          {
            product: {
              id: productId
            }
          }
        ]
      },
      useMostRecentServingConfig: true,
      params: {
        returnProduct: true
      }
    };

    console.log('🔍 Direct Retail API call:', {
      endpoint,
      productId,
      visitorId,
      limit
    });

    try {
      const headers = await this.getAuthHeaders();
      
      const response = await fetch(endpoint, {
        method: 'POST',
        headers,
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ Retail API error:', {
          status: response.status,
          statusText: response.statusText,
          body: errorText
        });
        throw new Error(`Retail API error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      console.log('✅ Direct Retail API response:', {
        resultCount: data.results?.length || 0,
        hasResults: !!data.results
      });

      return data;
    } catch (error) {
      console.error('❌ Retail API request failed:', error);
      throw error;
    }
  }

  /**
   * Get on-sale items using the direct API
   */
  async getOnSaleItems(visitorId?: string, limit: number = 10, categoryFilter?: string): Promise<RetailAPIPredictResponse> {
    const placementId = 'on-sale';
    const endpoint = `https://retail.googleapis.com/v2alpha/projects/${this.projectId}/locations/global/catalogs/${this.catalogId}/placements/${placementId}:predict`;
    
    const payload = {
      userEvent: {
        eventType: "detail-page-view",
        visitorId: visitorId || `widget-${Date.now()}`,
        uri: "/recommendations/on-sale",
        pageCategories: categoryFilter ? [categoryFilter] : [],
        productDetails: [
          {
            product: {
              id: "on-sale-context",
              type: "PRIMARY",
              categories: categoryFilter ? [categoryFilter] : [],
              title: "On Sale Products Context",
              languageCode: "en",
              availability: "IN_STOCK"
            },
            quantity: 1
          }
        ]
      },
      useMostRecentServingConfig: true,
      params: {
        returnProduct: true,
        "maxReturn": limit.toString()
      }
    };

    if (categoryFilter) {
      (payload.params as Record<string, unknown>).filter = `categories:"${categoryFilter}"`;
    }

    console.log('🏷️ Direct Retail API call for on-sale:', {
      endpoint,
      visitorId,
      limit,
      categoryFilter
    });

    try {
      const headers = await this.getAuthHeaders();
      
      const response = await fetch(endpoint, {
        method: 'POST',
        headers,
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ Retail API error (on-sale):', {
          status: response.status,
          statusText: response.statusText,
          body: errorText
        });
        throw new Error(`Retail API error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      console.log('✅ Direct Retail API response (on-sale):', {
        resultCount: data.results?.length || 0,
        hasResults: !!data.results
      });

      return data;
    } catch (error) {
      console.error('❌ Retail API request failed (on-sale):', error);
      throw error;
    }
  }

  /**
   * Transform Retail API response to our app's format
   */
  transformToAppFormat(apiResponse: RetailAPIPredictResponse, type: 'similar-items' | 'on-sale' = 'similar-items') {
    const products = (apiResponse.results || []).map(result => {
      const product = result.product || result.metadata || {} as RetailAPIProduct;
      
      return {
        id: result.id || product.id || '',
        sku: result.id || product.id || '',
        displayName: product.title || product.name || result.id || '',
        description: product.description || '',
        category: product.categories?.[0] || '',
        brand: product.attributes?.brand?.text?.[0] || product.attributes?.Brand?.text?.[0] || '',
        vendor: product.attributes?.vendor?.text?.[0] || product.attributes?.Vendor?.text?.[0] || '',
        vendorName: product.attributes?.vendorName?.text?.[0] || product.attributes?.VendorName?.text?.[0] || '',
        units: product.attributes?.units?.text?.[0] || product.attributes?.Units?.text?.[0] || '',
        isSFPreferred: product.attributes?.isSFPreferred?.text?.[0] === 'true' || product.attributes?.SFPreferred?.text?.[0] === 'true',
        imageURL: product.images?.[0]?.uri || '',
        availability: product.availability || 'UNKNOWN',
        categoryDesc: product.categories?.[0] || '',
        urlSlug: (result.id || '').toLowerCase().replace(/[^a-z0-9]+/g, '-'),
        price: product.priceInfo?.price || 0,
        accset: 'RETAIL_API_DIRECT',
        keywords: type === 'similar-items' ? ['similar-items', 'related', 'recommendation'] : ['on-sale', 'promotion', 'discount'],
        orderLastMonth: 0,
        isActive: true,
        isDeleted: false,
        webCategory: product.categories?.[0] || '',
        webSubCategory: product.categories?.[1] || '',
        webCategoryDesc: product.categories?.[0] || '',
        webDesc: product.description || '',
        webSubDesc: product.description || '',
        score: 0.9,
        reason: type === 'similar-items' 
          ? `Similar items from Direct Retail API` 
          : `On-sale products from Direct Retail API`
      };
    });

    return {
      products,
      score: products.length > 0 ? 0.9 : 0,
      reason: products.length > 0 
        ? `${type} from Direct Google Retail API` 
        : `No ${type} found`,
      count: products.length,
      type,
      metadata: {
        model: type,
        placementId: type,
        source: 'retail-api-direct',
        timestamp: new Date().toISOString(),
        attributionToken: apiResponse.attributionToken
      }
    };
  }
}

export const retailAPIDirect = new RetailAPIDirect();

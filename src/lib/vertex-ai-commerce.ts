/**
 * Vertex AI Search for Commerce Implementation
 * Based on official Google Cloud Retail API documentation
 * https://cloud.google.com/retail/docs
 */

import { GoogleAuth } from 'google-auth-library';
import * as fs from 'fs';
import * as path from 'path';

// Configuration
const PROJECT_ID = process.env.GOOGLE_CLOUD_PROJECT_ID || 'whitecap-us';
const LOCATION = process.env.VERTEX_AI_LOCATION || 'global';
const CATALOG_ID = process.env.VERTEX_AI_CATALOG_ID || 'default_catalog';
const BRANCH_ID = process.env.VERTEX_AI_BRANCH_ID || '0';
const PLACEMENT_ID = process.env.VERTEX_AI_PLACEMENT_ID || 'recently_viewed_default';

// Retail API endpoints
const RETAIL_API_BASE = 'https://retail.googleapis.com';
const API_VERSION = 'v2';

interface Product {
  name?: string;
  id: string;
  type: 'PRIMARY' | 'VARIANT' | 'COLLECTION';
  primaryProductId?: string;
  categories: string[];
  title: string;
  description?: string;
  languageCode: string;
  attributes?: { [key: string]: CustomAttribute };
  tags?: string[];
  priceInfo?: PriceInfo;
  rating?: Rating;
  expireTime?: string;
  ttl?: string;
  availability: 'IN_STOCK' | 'OUT_OF_STOCK' | 'PREORDER' | 'BACKORDER';
  availableQuantity?: number;
  fulfillmentInfo?: FulfillmentInfo[];
  uri?: string;
  images?: Image[];
  audience?: Audience;
  colorInfo?: ColorInfo;
  sizes?: string[];
  materials?: string[];
  patterns?: string[];
  conditions?: string[];
  promotions?: Promotion[];
  publishTime?: string;
  retrievableFields?: string;
  variants?: Product[];
  localInventories?: LocalInventory[];
}

interface CustomAttribute {
  text?: string[];
  numbers?: number[];
  searchable?: boolean;
  indexable?: boolean;
}

interface PriceInfo {
  currencyCode: string;
  price?: number;
  originalPrice?: number;
  cost?: number;
  priceEffectiveTime?: string;
  priceExpireTime?: string;
  priceRange?: PriceRange;
}

interface PriceRange {
  price: Interval;
  originalPrice?: Interval;
}

interface Interval {
  minimum?: number;
  exclusiveMinimum?: number;
  maximum?: number;
  exclusiveMaximum?: number;
}

interface Rating {
  ratingCount?: number;
  averageRating?: number;
  ratingHistogram?: number[];
}

interface FulfillmentInfo {
  type: string;
  placeIds?: string[];
}

interface Image {
  uri: string;
  height?: number;
  width?: number;
}

interface Audience {
  genders?: string[];
  ageGroups?: string[];
}

interface ColorInfo {
  colorFamilies?: string[];
  colors?: string[];
}

interface Promotion {
  promotionId: string;
}

interface LocalInventory {
  placeId: string;
  priceInfo?: PriceInfo;
  attributes?: { [key: string]: CustomAttribute };
  fulfillmentTypes?: string[];
}

interface UserEvent {
  eventType: string;
  visitorId: string;
  sessionId?: string;
  eventTime: string;
  experimentIds?: string[];
  attributionToken?: string;
  productDetails?: ProductDetail[];
  attributes?: { [key: string]: CustomAttribute };
  cartId?: string;
  purchaseTransaction?: PurchaseTransaction;
  searchQuery?: string;
  filter?: string;
  orderBy?: string;
  offset?: number;
  pageCategories?: string[];
  userInfo?: UserInfo;
  uri?: string;
  referrerUri?: string;
  pageViewId?: string;
}

interface ProductDetail {
  product: Product;
  quantity?: number;
}

interface PurchaseTransaction {
  id?: string;
  revenue: number;
  tax?: number;
  cost?: number;
  currencyCode: string;
}

interface UserInfo {
  userId?: string;
  ipAddress?: string;
  userAgent?: string;
  directUserRequest?: boolean;
}

interface SearchRequest {
  placement: string;
  branch?: string;
  query?: string;
  visitorId: string;
  userInfo?: UserInfo;
  pageSize?: number;
  offset?: number;
  filter?: string;
  canonicalFilter?: string;
  orderBy?: string;
  facetSpecs?: FacetSpec[];
  dynamicFacetSpec?: DynamicFacetSpec;
  boostSpec?: BoostSpec;
  queryExpansionSpec?: QueryExpansionSpec;
  variantRollupKeys?: string[];
  pageCategories?: string[];
  searchMode?: 'PRODUCT_SEARCH_ONLY' | 'FACETED_SEARCH_ONLY';
  personalizationSpec?: PersonalizationSpec;
  labels?: { [key: string]: string };
  spellCorrectionSpec?: SpellCorrectionSpec;
  entity?: string;
}

interface FacetSpec {
  facetKey: FacetKey;
  limit?: number;
  excludedValues?: string[];
  enableDynamicPosition?: boolean;
}

interface FacetKey {
  key: string;
  intervals?: Interval[];
  restrictedValues?: string[];
  prefixes?: string[];
  contains?: string[];
  caseInsensitive?: boolean;
  orderBy?: string;
  query?: string;
  returnMinMax?: boolean;
}

interface DynamicFacetSpec {
  mode: 'UNKNOWN' | 'DISABLED' | 'ENABLED';
}

interface BoostSpec {
  conditionBoostSpecs?: ConditionBoostSpec[];
  skipBoostSpecValidation?: boolean;
}

interface ConditionBoostSpec {
  condition: string;
  boost: number;
}

interface QueryExpansionSpec {
  condition: 'CONDITION_UNSPECIFIED' | 'DISABLED' | 'AUTO';
  pinUnexpandedResults?: boolean;
}

interface PersonalizationSpec {
  mode: 'MODE_UNSPECIFIED' | 'AUTO' | 'DISABLED';
}

interface SpellCorrectionSpec {
  mode: 'MODE_UNSPECIFIED' | 'SUGGESTION_ONLY' | 'AUTO';
}

interface SearchResponse {
  results: SearchResult[];
  facets: SearchFacet[];
  totalSize: number;
  attributionToken: string;
  nextPageToken?: string;
  correctedQuery?: string;
  appliedControls?: string[];
}

interface SearchResult {
  id: string;
  product: Product;
  matchingVariantCount: number;
  matchingVariantFields?: { [key: string]: any };
  variantRollupValues?: { [key: string]: any };
}

interface SearchFacet {
  key: string;
  values: FacetValue[];
  dynamicFacet: boolean;
}

interface FacetValue {
  value: string;
  count: number;
}

interface ExperimentInfo {
  servingConfigExperiment?: ServingConfigExperiment;
  experiment?: string;
}

interface ServingConfigExperiment {
  experimentServingConfig?: string;
  originalServingConfig?: string;
}

class VertexAICommerceService {
  private auth: GoogleAuth;
  private projectPath: string;
  private catalogPath: string;
  private branchPath: string;

  constructor() {
    console.log('🚀 Initializing VertexAICommerceService...');
    console.log('📊 Environment variables:', {
      PROJECT_ID,
      LOCATION,
      CATALOG_ID,
      BRANCH_ID,
      hasCredentials: !!process.env.GOOGLE_APPLICATION_CREDENTIALS,
      credentialsLength: process.env.GOOGLE_APPLICATION_CREDENTIALS?.length || 0,
      nodeEnv: process.env.NODE_ENV,
      isVercel: !!process.env.VERCEL,
      credentialsPreview: process.env.GOOGLE_APPLICATION_CREDENTIALS?.substring(0, 50) + '...'
    });

    // Handle both local development and production environments
    const authConfig: any = {
      scopes: ['https://www.googleapis.com/auth/cloud-platform'],
    };

    if (process.env.GOOGLE_APPLICATION_CREDENTIALS) {
      try {
        console.log('🔑 Configuring authentication...');
        // In production (Vercel), credentials might be base64 encoded or JSON string
        if (process.env.GOOGLE_APPLICATION_CREDENTIALS.includes('{')) {
          // Direct JSON string
          console.log('📝 Using direct JSON credentials');
          authConfig.credentials = JSON.parse(process.env.GOOGLE_APPLICATION_CREDENTIALS);
        } else if (process.env.GOOGLE_APPLICATION_CREDENTIALS.length > 100) {
          // Base64 encoded JSON
          console.log('📝 Using base64 encoded credentials');
          const decoded = Buffer.from(process.env.GOOGLE_APPLICATION_CREDENTIALS, 'base64').toString();
          authConfig.credentials = JSON.parse(decoded);
        } else {
          // File path (local development) - check if file exists
          console.log('📝 Using file path credentials');
          const credentialsPath = path.resolve(process.env.GOOGLE_APPLICATION_CREDENTIALS);
          
          if (fs.existsSync(credentialsPath)) {
            authConfig.keyFilename = credentialsPath;
            console.log('✅ Credentials file found at:', credentialsPath);
          } else {
            // Fallback: try to read from project root
            const projectRoot = path.resolve(process.cwd(), process.env.GOOGLE_APPLICATION_CREDENTIALS);
            if (fs.existsSync(projectRoot)) {
              authConfig.keyFilename = projectRoot;
              console.log('✅ Credentials file found at project root:', projectRoot);
            } else {
              console.error('❌ Credentials file not found at:', credentialsPath, 'or', projectRoot);
              throw new Error(`Credentials file not found at ${credentialsPath} or ${projectRoot}`);
            }
          }
        }
        console.log('✅ Authentication configured successfully');
      } catch (error) {
        console.error('❌ Error configuring Google Auth:', error);
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        throw new Error(`Failed to configure Google Auth: ${errorMessage}`);
      }
    } else {
      // No credentials provided - this will fail in production
      console.error('❌ GOOGLE_APPLICATION_CREDENTIALS environment variable is not set');
      throw new Error('GOOGLE_APPLICATION_CREDENTIALS environment variable is not set');
    }

    this.auth = new GoogleAuth(authConfig);

    this.projectPath = `projects/${PROJECT_ID}`;
    this.catalogPath = `${this.projectPath}/locations/${LOCATION}/catalogs/${CATALOG_ID}`;
    this.branchPath = `${this.catalogPath}/branches/${BRANCH_ID}`;
    
    console.log('📍 Service paths configured:', {
      projectPath: this.projectPath,
      catalogPath: this.catalogPath,
      branchPath: this.branchPath
    });
    console.log('✅ VertexAICommerceService initialized successfully');
  }

  private async getAccessToken(): Promise<string> {
    try {
      console.log('🔐 Getting access token...');
      const startTime = Date.now();
      
      // Add timeout to prevent hanging
      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => reject(new Error('Access token timeout after 30 seconds')), 30000);
      });
      
      const tokenPromise = (async () => {
        const client = await this.auth.getClient();
        const accessToken = await client.getAccessToken();
        return accessToken.token || '';
      })();
      
      const token = await Promise.race([tokenPromise, timeoutPromise]);
      const duration = Date.now() - startTime;
      
      console.log(`✅ Access token obtained successfully in ${duration}ms`);
      return token;
    } catch (error) {
      console.error('❌ Error getting access token:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      
      // Log additional context for debugging
      console.error('🔍 Auth error context:', {
        hasAuth: !!this.auth,
        credentialsType: process.env.GOOGLE_APPLICATION_CREDENTIALS?.includes('{') ? 'json' : 
                        (process.env.GOOGLE_APPLICATION_CREDENTIALS?.length || 0) > 100 ? 'base64' : 'file',
        projectId: PROJECT_ID,
        nodeEnv: process.env.NODE_ENV,
        timestamp: new Date().toISOString()
      });
      
      throw new Error(`Failed to get access token: ${errorMessage}`);
    }
  }

  private getApiUrl(endpoint: string): string {
    return `${RETAIL_API_BASE}/${API_VERSION}/${endpoint}`;
  }

  /**
   * Transform our product data to Retail API Product format
   */
  transformToRetailProduct(productData: any, stockData: any[] = []): Product {
    // Calculate availability based on stock
    const productStock = stockData.filter(stock => stock.SKU === productData.SKU);
    const totalStock = productStock.reduce((sum, stock) => {
      return sum + (parseInt(stock.AvailableQuantity) || 0);
    }, 0);

    let availability: Product['availability'] = 'OUT_OF_STOCK';
    if (totalStock > 0) {
      availability = 'IN_STOCK';
    } else if (productStock.length > 0) {
      availability = 'OUT_OF_STOCK';
    }

    // Build categories array
    const categories: string[] = [];
    if (productData.Category) categories.push(productData.Category);
    if (productData.WebCategory && productData.WebCategory !== productData.Category) {
      categories.push(productData.WebCategory);
    }
    if (productData.WebSubCategory) categories.push(productData.WebSubCategory);

    // Build custom attributes
    const attributes: { [key: string]: CustomAttribute } = {
      brand: {
        text: [productData.Brand || ''],
        searchable: true,
        indexable: true
      },
      sku: {
        text: [productData.SKU],
        searchable: true,
        indexable: true
      },
      vendor: {
        text: [productData.Vendor || ''],
        searchable: true,
        indexable: true
      },
      vendorName: {
        text: [productData.VendorName || productData.Vendor || ''],
        searchable: true,
        indexable: true
      },
      units: {
        text: [productData.Units || ''],
        searchable: false,
        indexable: true
      },
      accset: {
        text: [productData.Accset || ''],
        searchable: false,
        indexable: true
      },
      isSFPreferred: {
        text: [(productData.SFPreferred || '').toLowerCase() === 'true' ? 'true' : 'false'],
        searchable: true,
        indexable: true
      },
      totalStock: {
        numbers: [totalStock],
        searchable: false,
        indexable: true
      },
      stockWarehouses: {
        numbers: [productStock.length],
        searchable: false,
        indexable: true
      }
    };

    // Add warehouse-specific stock info
    productStock.forEach((stock, index) => {
      if (index < 10) { // Limit to first 10 warehouses
        attributes[`warehouse_${stock.Warehouse}`] = {
          numbers: [parseInt(stock.AvailableQuantity) || 0],
          searchable: false,
          indexable: true
        };
      }
    });

    const product: Product = {
      name: `${this.branchPath}/products/${productData.SKU}`,
      id: productData.SKU,
      type: 'PRIMARY',
      categories,
      title: productData.DisplayName || productData.SKU,
      description: productData.Description || '',
      languageCode: 'en',
      attributes,
      tags: [
        ...(productData.Brand ? [productData.Brand] : []),
        ...(productData.Category ? [productData.Category] : []),
        ...(productData.SFPreferred === 'true' ? ['SF Preferred'] : []),
        availability.toLowerCase().replace('_', ' ')
      ],
      availability,
      availableQuantity: totalStock,
      uri: `/product/${productData.SKU}`,
      images: productData.ImageURL ? [{
        uri: productData.ImageURL,
        height: 300,
        width: 300
      }] : [],
      publishTime: new Date().toISOString(),
      retrievableFields: 'name,id,title,description,categories,attributes,tags,priceInfo,availability,availableQuantity,uri,images'
    };

    return product;
  }

  /**
   * Import products to Retail API catalog
   */
  async importProducts(products: Product[]): Promise<void> {
    try {
      const accessToken = await this.getAccessToken();
      const endpoint = `${this.branchPath}/products:import`;
      const url = this.getApiUrl(endpoint);

      const importRequest = {
        inputConfig: {
          productInlineSource: {
            products
          }
        },
        reconciliationMode: 'INCREMENTAL',
        updateMask: 'title,description,categories,attributes,tags,availability,availableQuantity,uri,images',
        notificationPubsubTopic: process.env.PUBSUB_TOPIC // Optional
      };

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(importRequest),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Product import failed: ${response.status} ${response.statusText} - ${errorText}`);
      }

      const operation = await response.json();
      console.log('Product import operation started:', operation.name);
    } catch (error) {
      console.error('Product import error:', error);
      throw error;
    }
  }

  /**
   * Search products using Retail API
   */
  async search(searchRequest: Partial<SearchRequest>): Promise<SearchResponse> {
    try {
      console.log('🔍 Starting search with request:', {
        query: searchRequest.query,
        pageSize: searchRequest.pageSize,
        offset: searchRequest.offset,
        visitorId: searchRequest.visitorId
      });

      const accessToken = await this.getAccessToken();
      const endpoint = `${this.catalogPath}/placements/default_search:search`;
      const url = this.getApiUrl(endpoint);
      
      console.log('🌐 Search URL:', url);

      // Build the base request
      const request: SearchRequest = {
        placement: `${this.catalogPath}/placements/default_search`,
        branch: this.branchPath,
        query: searchRequest.query || '',
        visitorId: searchRequest.visitorId || 'anonymous-user',
        pageSize: Math.min(searchRequest.pageSize || 20, 100),
        offset: searchRequest.offset || 0,
        filter: searchRequest.filter || '',
        facetSpecs: searchRequest.facetSpecs || [
          {
            facetKey: { key: 'attributes.brand' },
            limit: 20
          },
          {
            facetKey: { key: 'categories' },
            limit: 20
          },
          {
            facetKey: { key: 'attributes.isSFPreferred' },
            limit: 2
          },
          {
            facetKey: { key: 'availability' },
            limit: 4
          }
        ],
        boostSpec: searchRequest.boostSpec || {
          conditionBoostSpecs: [
            {
              condition: 'availability: ANY("IN_STOCK")',
              boost: 0.5
            }
          ]
        },
        queryExpansionSpec: {
          condition: 'AUTO',
          pinUnexpandedResults: true // Pin original results to ensure they appear first
        },
        spellCorrectionSpec: {
          mode: 'AUTO'
        },
        // Remove variant rollup to avoid configuration issues
        searchMode: 'PRODUCT_SEARCH_ONLY',
        ...searchRequest
      };

      // Add userInfo if provided and contains userId
      if (searchRequest.userInfo && searchRequest.userInfo.userId) {
        request.userInfo = searchRequest.userInfo;
      }

      console.log('📋 Final search request:', JSON.stringify(request, null, 2));

      // Create AbortController for timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout

      try {
        console.log('🚀 Making search API call...');
        const requestStartTime = Date.now();
        
        const response = await fetch(url, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(request),
          signal: controller.signal,
        });

        clearTimeout(timeoutId);
        const requestDuration = Date.now() - requestStartTime;
        console.log(`📡 Search API response status: ${response.status} (${requestDuration}ms)`);

        if (!response.ok) {
          const errorText = await response.text();
          console.error('❌ Search API error response:', {
            status: response.status,
            statusText: response.statusText,
            headers: Object.fromEntries(response.headers.entries()),
            body: errorText,
            url: url,
            requestDuration: requestDuration,
            requestSize: JSON.stringify(request).length,
            timestamp: new Date().toISOString()
          });
          
          // Enhanced error message with more context
          const errorPrefix = response.status >= 500 ? 'Server Error' : 
                             response.status >= 400 ? 'Client Error' : 'API Error';
          
          throw new Error(`${errorPrefix}: ${response.status} ${response.statusText} - ${errorText}`);
        }

        const data = await response.json();
        console.log('📊 Raw search response:', JSON.stringify(data, null, 2));
        
        // Debug: Log the raw API response structure
        console.log('🔍 Raw Vertex AI API Response:', JSON.stringify(data, null, 2));
        
        const transformedResponse = this.transformSearchResponse(data);
        console.log('✅ Search completed successfully, results:', transformedResponse.totalSize);
        
        return transformedResponse;
      } catch (error) {
        clearTimeout(timeoutId);
        console.error('❌ Search request failed:', error);
        
        // Enhanced error logging
        if (error instanceof Error) {
          console.error('🔍 Search error details:', {
            message: error.message,
            stack: error.stack,
            name: error.name,
            cause: error.cause,
            searchQuery: request.query,
            searchParams: {
              pageSize: request.pageSize,
              offset: request.offset,
              filter: request.filter,
              visitorId: request.visitorId
            },
            timestamp: new Date().toISOString()
          });
        }
        
        throw error;
      }
    } catch (error) {
      console.error('❌ Commerce search error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      throw new Error(`Commerce search failed: ${errorMessage}`);
    }
  }

  /**
   * Get autocomplete suggestions
   */
  async completeQuery(query: string, maxSuggestions: number = 8): Promise<{ completionResults: any[]; attributionToken?: string }> {
    try {
      const accessToken = await this.getAccessToken();
      const endpoint = `${this.catalogPath}:completeQuery`;
      // Use 'user-data' for auto-learned dataset (per docs)
      const url = `${this.getApiUrl(endpoint)}?query=${encodeURIComponent(query)}&maxSuggestions=${maxSuggestions}&dataset=user-data`;
      console.log("=====accessToken", accessToken);

      // Create AbortController for timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 2000); // 2 second timeout for autocomplete

      try {
        const response = await fetch(url, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
          },
          signal: controller.signal,
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
          const errorText = await response.text();
          console.warn(`Autocomplete failed here: ${response.status} ${response.statusText} - ${errorText}`);
          return { completionResults: [], attributionToken: undefined };
        }

        const data = await response.json();
        // Return the full completionResults array for API mapping
        return {
          completionResults: (data.completionResults || []).slice(0, maxSuggestions),
          attributionToken: data.attributionToken
        };
      } catch (error) {
        clearTimeout(timeoutId);
        throw error;
      }
    } catch (error) {
      console.error('Autocomplete error:', error);
      return { completionResults: [], attributionToken: undefined };
    }
  }

  /**
   * Record user events for personalization and analytics
   */
  async writeUserEvent(userEvent: UserEvent): Promise<void> {
    try {
      
      const accessToken = await this.getAccessToken();
      const endpoint = `${this.catalogPath}/userEvents:write`;
      const url = this.getApiUrl(endpoint);

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(userEvent),
      });

      if (!response.ok) {
        console.warn(`User event recording failed: ${response.status} ${response.statusText}`);
      }
    } catch (error) {
      console.error('User event error:', error);
    }
  }

  /**
   * Get product recommendations
   */
  async predict(
    placementId: string,
    userEvent: Partial<UserEvent>,
    pageSize: number = 10,
    filter?: string
  ): Promise<any> {
    try {
      console.log('🔮 Starting prediction request:', { placementId, pageSize, visitorId: userEvent.visitorId });
      
      const accessToken = await this.getAccessToken();
      const endpoint = `${this.catalogPath}/placements/${placementId}:predict`;
      const url = this.getApiUrl(endpoint);

      console.log('📡 Prediction URL:', url);

      const request = {
        placement: `${this.catalogPath}/placements/${placementId}`,
        userEvent: {
          eventType: 'page-view',
          visitorId: 'anonymous-user',
          eventTime: new Date().toISOString(),
          ...userEvent
        },
        pageSize,
        filter,
        validateOnly: false,
        params: {
          returnProduct: true,
          strictFiltering: false
        }
      };

      console.log('📋 Prediction request:', JSON.stringify(request, null, 2));

      // Create AbortController for timeout (reduced for Vercel)
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 3000); // 3 second timeout for predictions

      try {
        console.log('🚀 Making prediction API call...');
        const requestStartTime = Date.now();
        
        const response = await fetch(url, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(request),
          signal: controller.signal,
        });

        clearTimeout(timeoutId);
        const requestDuration = Date.now() - requestStartTime;
        console.log(`📊 Prediction API response: ${response.status} (${requestDuration}ms)`);

        if (!response.ok) {
          const errorText = await response.text();
          console.error('❌ Prediction API error:', {
            status: response.status,
            statusText: response.statusText,
            error: errorText,
            url: url,
            placementId: placementId,
            requestDuration: requestDuration
          });
          return { results: [] };
        }

        const data = await response.json();
        console.log('✅ Prediction successful:', { 
          resultCount: data.results?.length || 0,
          hasAttributionToken: !!data.attributionToken
        });
        
        return data;
      } catch (error) {
        clearTimeout(timeoutId);
        console.error('❌ Prediction request failed:', error);
        
        if (error instanceof Error) {
          console.error('🔍 Prediction error details:', {
            message: error.message,
            name: error.name,
            placementId: placementId,
            url: url,
            timestamp: new Date().toISOString()
          });
        }
        
        throw error;
      }
    } catch (error) {
      console.error('❌ Prediction error:', error);
      return { results: [] };
    }
  }

  /**
   * Build filter string for search
   */
  buildFilter(filters: { [key: string]: any }): string {
    const filterParts: string[] = [];

    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        if (key === 'sfPreferred' && value === true) {
          // Skip sfPreferred filter for now due to indexing issues
          // filterParts.push('attributes.isSFPreferred: ANY("true")');
        } else if (key === 'allergens') {
          // Skip allergens filter - not supported by Vertex AI, will be handled locally
          console.log('🚫 Skipping allergens filter for Vertex AI (not supported):', value);
        } else if (key === 'availability' && value) {
          if (Array.isArray(value)) {
            const valueStr = value.map(v => `"${v}"`).join(',');
            filterParts.push(`availability: ANY(${valueStr})`);
          } else {
            filterParts.push(`availability: ANY("${value}")`);
          }
        } else if (key === 'category' && value) {
          filterParts.push(`categories: ANY("${value}")`);
        } else if (key === 'brand' && value) {
          filterParts.push(`attributes.brand: ANY("${value}")`);
        } else if (Array.isArray(value)) {
          const valueStr = value.map(v => `"${v}"`).join(',');
          filterParts.push(`${key}: ANY(${valueStr})`);
        }
      }
    });

    return filterParts.join(' AND ');
  }

  /**
   * Get a single product by ID
   */
  async getProduct(productId: string): Promise<Product | null> {
    try {
      const accessToken = await this.getAccessToken();
      const endpoint = `${this.branchPath}/products/${productId}`;
      const url = this.getApiUrl(endpoint);

      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        if (response.status === 404) {
          console.warn(`Product ${productId} not found`);
          return null;
        }
        const errorText = await response.text();
        throw new Error(`Get product failed: ${response.status} ${response.statusText} - ${errorText}`);
      }

      const productData = await response.json();
      return productData;
    } catch (error) {
      console.error(`Error fetching product ${productId}:`, error);
      return null;
    }
  }

  /**
   * Get multiple products by IDs
   */
  async getProducts(productIds: string[]): Promise<Product[]> {
    const promises = productIds.map(id => this.getProduct(id));
    const results = await Promise.all(promises);
    return results.filter(product => product !== null) as Product[];
  }

  /**
   * Transform search response from Retail API format
   */
  private transformSearchResponse(apiResponse: any): SearchResponse {
    return {
      results: (apiResponse.results || []).map((result: any) => ({
        id: result.id,
        product: result.product || {},
        matchingVariantCount: result.matchingVariantCount || 0,
        matchingVariantFields: result.matchingVariantFields || {},
        variantRollupValues: result.variantRollupValues || {}
      })),
      facets: (apiResponse.facets || []).map((facet: any) => ({
        key: facet.key,
        values: (facet.values || []).map((value: any) => ({
          value: value.value,
          count: value.count
        })),
        dynamicFacet: facet.dynamicFacet || false
      })),
      totalSize: apiResponse.totalSize || 0,
      attributionToken: apiResponse.attributionToken || '',
      nextPageToken: apiResponse.nextPageToken,
      correctedQuery: apiResponse.correctedQuery,
      appliedControls: apiResponse.appliedControls || []
    };
  }

  /**
   * Get experiment info
   */
  async getExperimentInfo(): Promise<ExperimentInfo[]> {
    try {
      const accessToken = await this.getAccessToken();
      const endpoint = `${this.catalogPath}/servingConfigs`;
      const url = this.getApiUrl(endpoint);

      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Get experiment info failed: ${response.status} ${response.statusText} - ${errorText}`);
      }

      const data = await response.json();
      return data.servingConfigs || [];
    } catch (error) {
      console.error('Get experiment info error:', error);
      throw error;
    }
  }
}

export const vertexAICommerceService = new VertexAICommerceService();
export { VertexAICommerceService, type Product, type SearchRequest, type SearchResponse, type UserEvent };


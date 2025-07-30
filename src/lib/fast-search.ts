/**
 * Fast Local Search Implementation
 * Optimized for speed and instant response
 */

import { dataService } from './data';

interface FastSearchOptions {
  query: string;
  filters?: Record<string, any>;
  offset?: number;
  limit?: number;
  sortBy?: string;
}

interface FastSearchResult {
  products: any[];
  facets: {
    categories: Array<{ value: string; count: number }>;
    brands: Array<{ value: string; count: number }>;
    availability: Array<{ value: string; count: number }>;
  };
  total: number;
  queryTime: number;
}

class FastSearch {
  private static instance: FastSearch;
  private isInitialized = false;

  static getInstance(): FastSearch {
    if (!FastSearch.instance) {
      FastSearch.instance = new FastSearch();
    }
    return FastSearch.instance;
  }

  async initialize() {
    if (this.isInitialized) return;
    
    try {
      await dataService.initialize();
      this.isInitialized = true;
      console.log('Fast search initialized');
    } catch (error) {
      console.error('Failed to initialize fast search:', error);
    }
  }

  async search(options: FastSearchOptions): Promise<FastSearchResult> {
    const startTime = Date.now();
    
    if (!this.isInitialized) {
      await this.initialize();
    }

    const { query, filters = {}, offset = 0, limit = 20, sortBy } = options;

    try {
      // Use the existing data service search with improved error handling
      const result = await dataService.search(query, filters, offset, limit, sortBy || 'relevance');
      
      // Transform to match expected API format
      const transformedProducts = result.products.map((product: any) => ({
        id: product.sku || product.id,
        sku: product.sku || product.id,
        title: product.displayName || product.title,
        description: product.description || product.webDesc,
        brand: product.brand,
        category: product.category,
        categoryDesc: product.categoryDesc,
        imageURL: product.imageURL,
        isSFPreferred: product.isSFPreferred,
        price: product.price,
        units: product.units,
        urlSlug: product.urlSlug,
        availability: product.availability,
        accset: product.accset,
        keywords: product.keywords,
        orderLastMonth: product.orderLastMonth,
        isActive: product.isActive,
        isDeleted: product.isDeleted,
        vendor: product.vendor,
        vendorName: product.vendorName,
        webCategory: product.webCategory,
        webSubCategory: product.webSubCategory,
        webCategoryDesc: product.webCategoryDesc,
        webDesc: product.webDesc,
        webSubDesc: product.webSubDesc,
      }));

      const queryTime = Date.now() - startTime;

      return {
        products: transformedProducts,
        facets: {
          categories: result.facets?.categories || [],
          brands: result.facets?.brands || [],
          availability: [
            { value: 'IN_STOCK', count: result.products.filter(p => p.availability === 'IN_STOCK').length },
            { value: 'OUT_OF_STOCK', count: result.products.filter(p => p.availability === 'OUT_OF_STOCK').length },
          ],
        },
        total: result.total,
        queryTime,
      };
    } catch (error) {
      console.error('Fast search error:', error);
      
      // Return empty result on error
      return {
        products: [],
        facets: {
          categories: [],
          brands: [],
          availability: [
            { value: 'IN_STOCK', count: 0 },
            { value: 'OUT_OF_STOCK', count: 0 },
          ],
        },
        total: 0,
        queryTime: Date.now() - startTime,
      };
    }
  }

  async getAutocompleteSuggestions(query: string, limit: number = 8): Promise<string[]> {
    if (!this.isInitialized) {
      await this.initialize();
    }

    try {
      const result = await dataService.search(query, {}, 0, limit * 2);
      
      // Extract unique product names and brands as suggestions
      const suggestions = new Set<string>();
      
      result.products.forEach((product: any) => {
        if (product.displayName) {
          suggestions.add(product.displayName);
        }
        if (product.brand) {
          suggestions.add(product.brand);
        }
      });

      return Array.from(suggestions)
        .filter(s => s.toLowerCase().includes(query.toLowerCase()))
        .slice(0, limit);
    } catch (error) {
      console.error('Fast autocomplete error:', error);
      return [];
    }
  }
}

export const fastSearch = FastSearch.getInstance();

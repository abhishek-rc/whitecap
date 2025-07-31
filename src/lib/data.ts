import fs from 'fs';
import path from 'path';

export interface Rating {
  ratingCount?: number;
  averageRating?: number;
  ratingHistogram?: number[];
}

export interface Product {
  id: string;
  sku: string;
  displayName: string;
  description: string;
  brand: string;
  category: string;
  categoryDesc: string;
  imageURL: string;
  isSFPreferred: boolean;
  price?: number;
  discountedPrice?: number;
  rating?: number | Rating;
  reviewCount?: number;
  units: string;
  urlSlug: string;
  availability: string;
  accset: string;
  keywords: string[];
  allergens?: string[];
  orderLastMonth?: number;
  isActive: boolean;
  isDeleted: boolean;
  vendor: string;
  vendorName: string;
  webCategory: string;
  webSubCategory: string;
  webCategoryDesc: string;
  webDesc: string;
  webSubDesc: string;
  /**
   * Optional: available quantity for this product (for low stock warnings in UI)
   */
  stock?: number;
}

export interface Stock {
  productCode: string;
  productName: string;
  availableQuantity: number;
  warehouse: string;
  status: string;
  averageCost: number;
  lastCost: number;
  standardCost: number;
  costUnit: string;
  isActive: boolean;
}

export interface SearchFilters {
  categories?: string[];
  brand?: string[];
  priceRange?: {
    min?: number;
    max?: number;
  };
  availability?: string[];
  accset?: string[];
  sfPreferred?: boolean;
  warehouse?: string[];
  allergens?: string[];
  sortBy?: string;
}

export interface SearchResult {
  products: Product[];
  facets: {
    categories: Array<{ value: string; count: number }>;
    brands: Array<{ value: string; count: number }>;
    priceRanges: Array<{ min: number; max: number; count: number }>;
    warehouses: Array<{ value: string; count: number }>;
    accsets: Array<{ value: string; count: number }>;
    availability: Array<{ value: string; count: number }>;
    allergens: Array<{ value: string; count: number }>;
  };
  total: number;
  queryTime: number;
}

class DataService {
  private products: Product[] = [];
  private stocks: Stock[] = [];
  private initialized = false;

  async initialize() {
    if (this.initialized) return;

    try {
      // Load and parse product data
      const productCsvPath = path.join(process.cwd(), 'Productextract.csv');
      const stockCsvPath = path.join(process.cwd(), 'Stockextract.csv');

      if (fs.existsSync(productCsvPath)) {
        this.products = await this.parseProductCsv(productCsvPath);
        console.log(`✅ Loaded ${this.products.length} products from ${productCsvPath}`);
      } else {
        console.warn(`⚠️ Product CSV file not found: ${productCsvPath}`);
        console.warn('Application will rely on Vertex AI for product data');
      }

      if (fs.existsSync(stockCsvPath)) {
        this.stocks = await this.parseStockCsv(stockCsvPath);
        console.log(`✅ Loaded ${this.stocks.length} stock records from ${stockCsvPath}`);
      } else {
        console.warn(`⚠️ Stock CSV file not found: ${stockCsvPath}`);
      }

      // Populate sample allergen data for testing
      this.populateSampleAllergenData();

      this.initialized = true;
      console.log(`🚀 Data service initialized with ${this.products.length} products and ${this.stocks.length} stock records`);
    } catch (error) {
      console.error('❌ Error initializing data service:', error);
      this.initialized = true; // Mark as initialized to prevent retry loops
    }
  }

  private async parseProductCsv(filePath: string): Promise<Product[]> {
    const content = fs.readFileSync(filePath, 'utf-8');
    const lines = content.split('\n');
    const headers = this.parseCsvLine(lines[0]);
    const products: Product[] = [];

    for (let i = 1; i < lines.length; i++) {
      if (lines[i].trim() === '') continue;
      
      try {
        const values = this.parseCsvLine(lines[i]);
        if (values.length < headers.length) continue;

        // Extract pricing information
        const vendorCost = parseFloat(values[headers.indexOf('Vendor_Cost__c')] || '0');
        const listPrice = parseFloat(values[headers.indexOf('LISTPRICOPT_List_Price_Optimised__c')] || '0');
        
        // Generate sample rating and review data (in real app, this would come from reviews service)
        const sampleRating = Math.random() * 2 + 3; // Random rating between 3-5
        const sampleReviews = Math.floor(Math.random() * 200) + 5; // Random review count
        
        const product: Product = {
          id: values[headers.indexOf('Id')] || '',
          sku: values[headers.indexOf('ITEM_NO__c')] || values[headers.indexOf('ProductCode')] || '',
          displayName: values[headers.indexOf('Description')] || values[headers.indexOf('Name')] || '',
          description: values[headers.indexOf('WEB_DESC__c')] || values[headers.indexOf('Description')] || '',
          brand: values[headers.indexOf('BRAND__c')] || '',
          category: values[headers.indexOf('Category__c')] || '',
          categoryDesc: values[headers.indexOf('Categ_Desc_c__c')] || '',
          imageURL: this.extractImageUrl(values[headers.indexOf('Image__c')] || ''),
          isSFPreferred: values[headers.indexOf('SFPREF_SF_preferred_item__c')] === 'true',
          price: listPrice > 0 ? listPrice : (vendorCost > 0 ? vendorCost * 1.3 : Math.random() * 100 + 10), // Use list price or calculate from vendor cost
          discountedPrice: listPrice > 0 && Math.random() > 0.3 ? listPrice * (0.8 + Math.random() * 0.15) : undefined, // 30% chance of discount
          rating: Number(sampleRating.toFixed(1)),
          reviewCount: sampleReviews,
          units: values[headers.indexOf('Unit_Of_Measure__c')] || '',
          urlSlug: values[headers.indexOf('DisplayUrl')] || '',
          availability: values[headers.indexOf('IsActive')] === 'true' ? 'Available' : 'Not Available',
          accset: values[headers.indexOf('Account_Set_Code__c')] || '',
          keywords: this.parseKeywords(values[headers.indexOf('Comment_1__c')] || ''),
          isActive: values[headers.indexOf('IsActive')] === 'true',
          isDeleted: values[headers.indexOf('IsDeleted')] === 'true',
          vendor: values[headers.indexOf('VENDOR_ID__c')] || '',
          vendorName: values[headers.indexOf('VEND_NAME__c')] || '',
          webCategory: values[headers.indexOf('WEBCATEGORY__c')] || '',
          webSubCategory: values[headers.indexOf('WEBSUBCATEG__c')] || '',
          webCategoryDesc: values[headers.indexOf('WEB_CATEG_DESC__c')] || '',
          webDesc: values[headers.indexOf('WEB_DESC__c')] || '',
          webSubDesc: values[headers.indexOf('WEB_SUB_DESC__c')] || '',
        };

        // Only include active, non-deleted products
        if (product.isActive && !product.isDeleted && product.sku) {
          products.push(product);
        }
      } catch (error) {
        console.warn(`Error parsing product line ${i}:`, error);
      }
    }

    return products;
  }

  private async parseStockCsv(filePath: string): Promise<Stock[]> {
    const content = fs.readFileSync(filePath, 'utf-8');
    const lines = content.split('\n');
    const headers = this.parseCsvLine(lines[0]);
    const stocks: Stock[] = [];

    for (let i = 1; i < lines.length; i++) {
      if (lines[i].trim() === '') continue;
      
      try {
        const values = this.parseCsvLine(lines[i]);
        if (values.length < headers.length) continue;

        const stock: Stock = {
          productCode: values[headers.indexOf('Product_Code__c')] || '',
          productName: values[headers.indexOf('Product_Name__c')] || '',
          availableQuantity: parseFloat(values[headers.indexOf('Available_Quantity__c')] || '0'),
          warehouse: values[headers.indexOf('Warehouse__c')] || '',
          status: values[headers.indexOf('Status__c')] || '',
          averageCost: parseFloat(values[headers.indexOf('Average_Cost__c')] || '0'),
          lastCost: parseFloat(values[headers.indexOf('Last_Cost__c')] || '0'),
          standardCost: parseFloat(values[headers.indexOf('Standard_Cost__c')] || '0'),
          costUnit: values[headers.indexOf('Cost_Unit__c')] || '',
          isActive: values[headers.indexOf('Active__c')] === 'true',
        };

        if (stock.productCode) {
          stocks.push(stock);
        }
      } catch (error) {
        console.warn(`Error parsing stock line ${i}:`, error);
      }
    }

    return stocks;
  }

  private parseCsvLine(line: string): string[] {
    const result: string[] = [];
    let current = '';
    let inQuotes = false;
    
    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      
      if (char === '"') {
        if (inQuotes && line[i + 1] === '"') {
          current += '"';
          i++; // Skip next quote
        } else {
          inQuotes = !inQuotes;
        }
      } else if (char === ',' && !inQuotes) {
        result.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }
    
    result.push(current.trim());
    return result;
  }

  private extractImageUrl(imageHtml: string): string {
    if (!imageHtml) return '';
    const match = imageHtml.match(/src="([^"]+)"/);
    return match ? match[1].replace('&lt;ReandomString&gt;', '') : '';
  }

  private parseKeywords(comment: string): string[] {
    if (!comment) return [];
    return comment.split(/[,;]/).map(k => k.trim()).filter(k => k.length > 0);
  }

  private populateSampleAllergenData(): void {
    // Add sample allergen data to products for testing
    const commonAllergens = ['Gluten', 'Dairy', 'Nuts', 'Soy', 'Eggs', 'Fish', 'Shellfish', 'Sesame'];
    
    this.products.forEach((product, index) => {
      // Assign allergens based on product category and random distribution
      const allergenCount = Math.floor(Math.random() * 3); // 0-2 allergens per product
      const productAllergens: string[] = [];
      
      // Assign allergens based on product type/category
      if (product.category?.includes('DAIR') || product.displayName.toLowerCase().includes('milk') || 
          product.displayName.toLowerCase().includes('cheese') || product.displayName.toLowerCase().includes('cream')) {
        productAllergens.push('Dairy');
      }
      
      if (product.category?.includes('BAK') || product.displayName.toLowerCase().includes('bread') || 
          product.displayName.toLowerCase().includes('flour') || product.displayName.toLowerCase().includes('wheat')) {
        productAllergens.push('Gluten');
      }
      
      if (product.displayName.toLowerCase().includes('nut') || product.displayName.toLowerCase().includes('almond') || 
          product.displayName.toLowerCase().includes('peanut') || product.displayName.toLowerCase().includes('walnut')) {
        productAllergens.push('Nuts');
      }
      
      if (product.displayName.toLowerCase().includes('soy') || product.displayName.toLowerCase().includes('tofu')) {
        productAllergens.push('Soy');
      }
      
      if (product.displayName.toLowerCase().includes('egg')) {
        productAllergens.push('Eggs');
      }
      
      if (product.displayName.toLowerCase().includes('fish') || product.displayName.toLowerCase().includes('salmon') || 
          product.displayName.toLowerCase().includes('tuna')) {
        productAllergens.push('Fish');
      }
      
      if (product.displayName.toLowerCase().includes('shrimp') || product.displayName.toLowerCase().includes('crab') || 
          product.displayName.toLowerCase().includes('lobster')) {
        productAllergens.push('Shellfish');
      }
      
      if (product.displayName.toLowerCase().includes('sesame')) {
        productAllergens.push('Sesame');
      }
      
      // Add some random allergens for variety (but avoid duplicates)
      while (productAllergens.length < allergenCount) {
        const randomAllergen = commonAllergens[Math.floor(Math.random() * commonAllergens.length)];
        if (!productAllergens.includes(randomAllergen)) {
          productAllergens.push(randomAllergen);
        }
      }
      
      // Assign allergens to product (remove duplicates)
      product.allergens = [...new Set(productAllergens)];
    });
    
    console.log('✅ Sample allergen data populated for', this.products.length, 'products');
  }

  async search(query: string, filters: SearchFilters = {}, offset: number = 0, limit: number = 20, sortBy: string = 'relevance'): Promise<{
    products: Product[];
    facets: {
      categories: Array<{ value: string; count: number }>;
      brands: Array<{ value: string; count: number }>;
      priceRanges: Array<{ min: number; max: number; count: number }>;
      warehouses: Array<{ value: string; count: number }>;
      accsets: Array<{ value: string; count: number }>;
      availability: Array<{ value: string; count: number }>;
      allergens: Array<{ value: string; count: number }>;
    };
    total: number;
    queryTime: number;
  }> {
    const startTime = Date.now();
    await this.initialize();

    let filteredProducts = [...this.products];

    // Apply search query
    if (query && query.trim() !== '' && query !== '*') {
      const searchTerms = query.toLowerCase().split(/\s+/).filter(term => term.length > 0);
      
      filteredProducts = filteredProducts.filter(product => {
        const searchableText = [
          product.displayName,
          product.description,
          product.brand,
          product.category,
          product.webCategory,
          product.webSubCategory,
          product.sku,
          product.webDesc,
          product.webSubDesc,
          ...(product.keywords || [])
        ].join(' ').toLowerCase();

        // For very short queries, be more lenient with partial matches
        if (searchTerms.length === 1 && searchTerms[0].length <= 3) {
          const term = searchTerms[0];
          const words = searchableText.split(/\s+/);
          return words.some(word => word.startsWith(term));
        }

        // Check if all search terms are found (for longer queries)
        return searchTerms.every(term => searchableText.includes(term));
      });

      // Note: Sorting is now handled by applySorting method after filtering
    }

    // Apply filters
    if (filters.categories?.length) {
      filteredProducts = filteredProducts.filter(p => 
        filters.categories!.includes(p.category) || filters.categories!.includes(p.webCategory)
      );
    }

    if (filters.brand?.length) {
      filteredProducts = filteredProducts.filter(p => 
        filters.brand!.includes(p.brand)
      );
    }

    if (filters.sfPreferred) {
      filteredProducts = filteredProducts.filter(p => p.isSFPreferred);
    }

    if (filters.availability?.length) {
      filteredProducts = filteredProducts.filter(p => 
        filters.availability!.includes(p.availability)
      );
    }

    if (filters.accset?.length) {
      filteredProducts = filteredProducts.filter(p => 
        filters.accset!.includes(p.accset)
      );
    }

    if (filters.warehouse?.length) {
      filteredProducts = filteredProducts.filter(p => {
        const stockRecords = this.stocks.filter(s => s.productCode === p.sku);
        return stockRecords.some(stock => filters.warehouse!.includes(stock.warehouse));
      });
    }

    if (filters.allergens?.length) {
      filteredProducts = filteredProducts.filter(p => {
        if (!p.allergens || p.allergens.length === 0) return false;
        return filters.allergens!.some(allergen => p.allergens!.includes(allergen));
      });
    }

    // Apply sorting (after filtering but before pagination)
    this.applySorting(filteredProducts, sortBy, query);

    const total = filteredProducts.length;
    const paginatedProducts = filteredProducts.slice(offset, offset + limit);

    // Generate facets from filtered results
    const facets = this.generateFacets(filteredProducts);

    return {
      products: paginatedProducts,
      facets,
      total,
      queryTime: Date.now() - startTime
    };
  }

  private generateFacets(products: Product[]): {
    categories: Array<{ value: string; count: number }>;
    brands: Array<{ value: string; count: number }>;
    priceRanges: Array<{ min: number; max: number; count: number }>;
    warehouses: Array<{ value: string; count: number }>;
    accsets: Array<{ value: string; count: number }>;
    availability: Array<{ value: string; count: number }>;
    allergens: Array<{ value: string; count: number }>;
  } {
    const categories = new Map<string, number>();
    const brands = new Map<string, number>();
    const warehouses = new Map<string, number>();
    const accsets = new Map<string, number>();
    const availability = new Map<string, number>();
    const allergens = new Map<string, number>();

    products.forEach(product => {
      // Count categories
      if (product.category) {
        categories.set(product.category, (categories.get(product.category) || 0) + 1);
      }
      if (product.webCategory) {
        categories.set(product.webCategory, (categories.get(product.webCategory) || 0) + 1);
      }

      // Count brands
      if (product.brand) {
        brands.set(product.brand, (brands.get(product.brand) || 0) + 1);
      }

      // Count accsets
      if (product.accset) {
        accsets.set(product.accset, (accsets.get(product.accset) || 0) + 1);
      }

      // Count availability
      if (product.availability) {
        availability.set(product.availability, (availability.get(product.availability) || 0) + 1);
      }

      // Count allergens
      if (product.allergens && product.allergens.length > 0) {
        product.allergens.forEach(allergen => {
          allergens.set(allergen, (allergens.get(allergen) || 0) + 1);
        });
      }

      // Get warehouse info from stock data
      const stockRecords = this.stocks.filter(s => s.productCode === product.sku);
      stockRecords.forEach(stock => {
        if (stock.warehouse) {
          warehouses.set(stock.warehouse, (warehouses.get(stock.warehouse) || 0) + 1);
        }
      });
    });

    return {
      categories: Array.from(categories.entries())
        .map(([value, count]) => ({ value, count }))
        .sort((a, b) => b.count - a.count),
      brands: Array.from(brands.entries())
        .map(([value, count]) => ({ value, count }))
        .sort((a, b) => b.count - a.count),
      priceRanges: [
        { min: 0, max: 10, count: 0 },
        { min: 10, max: 50, count: 0 },
        { min: 50, max: 100, count: 0 },
        { min: 100, max: 500, count: 0 },
        { min: 500, max: Infinity, count: 0 }
      ],
      warehouses: Array.from(warehouses.entries())
        .map(([value, count]) => ({ value, count }))
        .sort((a, b) => b.count - a.count),
      accsets: Array.from(accsets.entries())
        .map(([value, count]) => ({ value, count }))
        .sort((a, b) => b.count - a.count),
      availability: Array.from(availability.entries())
        .map(([value, count]) => ({ value, count }))
        .sort((a, b) => b.count - a.count),
      allergens: Array.from(allergens.entries())
        .map(([value, count]) => ({ value, count }))
        .sort((a, b) => b.count - a.count)
    };
  }

  async getProduct(sku: string): Promise<Product | null> {
    await this.initialize();
    return this.products.find(p => p.sku === sku) || null;
  }

  async getStockInfo(sku: string): Promise<Stock[]> {
    await this.initialize();
    return this.stocks.filter(s => s.productCode === sku);
  }

  async getRecommendations(sku: string, type: 'similar' | 'trending' | 'complementary' = 'similar'): Promise<Product[]> {
    await this.initialize();
    
    const product = await this.getProduct(sku);
    if (!product) return [];

    let recommendations: Product[] = [];

    switch (type) {
      case 'similar':
        // Find products in same category or with same brand
        recommendations = this.products.filter(p => 
          p.sku !== sku && 
          (p.category === product.category || p.brand === product.brand)
        );
        break;
      
      case 'trending':
        // Return SF Preferred products or products with good availability
        recommendations = this.products.filter(p => 
          p.sku !== sku && p.isSFPreferred
        );
        break;
      
      case 'complementary':
        // Find products that might complement this one (same category but different subcategory)
        recommendations = this.products.filter(p => 
          p.sku !== sku && 
          p.category === product.category &&
          p.webSubCategory !== product.webSubCategory
        );
        break;
    }

    return recommendations.slice(0, 10);
  }

  private applySorting(products: Product[], sortBy: string, query: string = ''): void {
    switch (sortBy) {
      case 'name_asc':
        products.sort((a, b) => a.displayName.localeCompare(b.displayName));
        break;
      case 'name_desc':
        products.sort((a, b) => b.displayName.localeCompare(a.displayName));
        break;
      case 'price_asc':
        products.sort((a, b) => (a.price || 0) - (b.price || 0));
        break;
      case 'price_desc':
        products.sort((a, b) => (b.price || 0) - (a.price || 0));
        break;
      case 'availability':
        products.sort((a, b) => {
          const availOrder = { 'IN_STOCK': 3, 'LOW_STOCK': 2, 'OUT_OF_STOCK': 1 };
          return (availOrder[b.availability as keyof typeof availOrder] || 0) - 
                 (availOrder[a.availability as keyof typeof availOrder] || 0);
        });
        break;
      case 'text_match_desc':
        products.sort((a, b) => {
          // Calculate text match score based on query relevance
          const getTextMatchScore = (product: Product) => {
            if (!query) return 0;
            let score = 0;
            const queryLower = query.toLowerCase();
            
            // Exact SKU match gets highest score
            if (product.sku.toLowerCase() === queryLower) score += 100;
            
            // Title/display name matches
            if (product.displayName.toLowerCase().includes(queryLower)) {
              score += 50;
              // Boost if query appears at start of title
              if (product.displayName.toLowerCase().startsWith(queryLower)) score += 25;
            }
            
            // Brand matches
            if (product.brand.toLowerCase().includes(queryLower)) score += 30;
            
            // Category matches
            if (product.category.toLowerCase().includes(queryLower)) score += 20;
            
            // Description matches
            if (product.description?.toLowerCase().includes(queryLower)) score += 10;
            
            return score;
          };
          
          return getTextMatchScore(b) - getTextMatchScore(a);
        });
        break;
      case 'recently_purchased':
        // Sort by SF Preferred first, then by order frequency if available
        products.sort((a, b) => {
          // Prioritize SF Preferred products
          if (a.isSFPreferred && !b.isSFPreferred) return -1;
          if (!a.isSFPreferred && b.isSFPreferred) return 1;
          
          // Then by order frequency (if we had purchase history)
          const aOrders = a.orderLastMonth || 0;
          const bOrders = b.orderLastMonth || 0;
          if (aOrders !== bOrders) return bOrders - aOrders;
          
          // Finally by alphabetical order
          return a.displayName.localeCompare(b.displayName);
        });
        break;
      case 'rating_desc':
        // Sort by rating (high to low), then by review count (high to low) as tiebreaker
        products.sort((a, b) => {
          const getRatingValue = (product: Product) => {
            if (typeof product.rating === 'number') {
              return product.rating;
            } else if (product.rating && typeof product.rating === 'object') {
              return product.rating.averageRating || 0;
            }
            return 0;
          };
          
          const getReviewCount = (product: Product) => {
            if (product.reviewCount) return product.reviewCount;
            if (product.rating && typeof product.rating === 'object' && product.rating.ratingCount) {
              return product.rating.ratingCount;
            }
            return 0;
          };
          
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
        });
        break;
      case 'rating_asc':
        // Sort by rating (low to high), then by review count (high to low) as tiebreaker
        products.sort((a, b) => {
          const getRatingValue = (product: Product) => {
            if (typeof product.rating === 'number') {
              return product.rating;
            } else if (product.rating && typeof product.rating === 'object') {
              return product.rating.averageRating || 0;
            }
            return 0;
          };
          
          const getReviewCount = (product: Product) => {
            if (product.reviewCount) return product.reviewCount;
            if (product.rating && typeof product.rating === 'object' && product.rating.ratingCount) {
              return product.rating.ratingCount;
            }
            return 0;
          };
          
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
        });
        break;
      case 'relevance':
      default:
        // Apply default relevance sorting (existing logic)
        if (query && query.trim() !== '' && query !== '*') {
          products.sort((a, b) => {
            // SKU exact match first
            if (a.sku.toLowerCase() === query.toLowerCase()) return -1;
            if (b.sku.toLowerCase() === query.toLowerCase()) return 1;

            // For short queries, prioritize words that start with the query
            if (query.length <= 3) {
              const aStartsWithQuery = a.displayName.toLowerCase().split(/\s+/).some(word => word.startsWith(query.toLowerCase()));
              const bStartsWithQuery = b.displayName.toLowerCase().split(/\s+/).some(word => word.startsWith(query.toLowerCase()));
              if (aStartsWithQuery && !bStartsWithQuery) return -1;
              if (!aStartsWithQuery && bStartsWithQuery) return 1;
            }

            // SF Preferred products next
            if (a.isSFPreferred && !b.isSFPreferred) return -1;
            if (!a.isSFPreferred && b.isSFPreferred) return 1;

            // Brand exact match
            if (a.brand.toLowerCase() === query.toLowerCase()) return -1;
            if (b.brand.toLowerCase() === query.toLowerCase()) return 1;

            // Display name relevance
            const aNameMatch = a.displayName.toLowerCase().includes(query.toLowerCase());
            const bNameMatch = b.displayName.toLowerCase().includes(query.toLowerCase());
            if (aNameMatch && !bNameMatch) return -1;
            if (!aNameMatch && bNameMatch) return 1;

            return 0;
          });
        } else {
          // Default sort when no query - SF Preferred first, then alphabetical
          products.sort((a, b) => {
            if (a.isSFPreferred && !b.isSFPreferred) return -1;
            if (!a.isSFPreferred && b.isSFPreferred) return 1;
            return a.displayName.localeCompare(b.displayName);
          });
        }
        break;
    }
  }
}

export const dataService = new DataService();


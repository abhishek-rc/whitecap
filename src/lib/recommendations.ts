import { Product, Stock, dataService } from './data';

export interface RecommendationResult {
  type: 'similar' | 'trending' | 'complementary' | 'frequently_bought_together' | 'category_trending';
  products: Product[];
  score: number;
  reason: string;
}

export interface RecommendationRequest {
  productSku?: string;
  categoryFilter?: string[];
  brandFilter?: string[];
  userPreferences?: {
    sfPreferred?: boolean;
    priceRange?: { min?: number; max?: number };
  };
  limit?: number;
}

class RecommendationEngine {
  private products: Product[] = [];
  private stocks: Stock[] = [];
  private categoryScores: Map<string, number> = new Map();
  private brandScores: Map<string, number> = new Map();
  private initialized = false;
  private initializationPromise: Promise<void> | null = null;

  async initialize() {
    if (this.initialized) return;
    
    // Prevent multiple simultaneous initializations
    if (this.initializationPromise) {
      return this.initializationPromise;
    }
    
    this.initializationPromise = this.performInitialization();
    await this.initializationPromise;
  }

  private async performInitialization() {
    try {
      await dataService.initialize();
      this.products = await this.getAllProducts();
      this.stocks = await this.getAllStocks();
      this.calculatePopularityScores();
      this.initialized = true;
      console.log('Recommendation engine initialized with', this.products.length, 'products');
    } catch (error) {
      console.error('Failed to initialize recommendation engine:', error);
      this.initializationPromise = null; // Allow retry
      throw error;
    }
  }

  private async getAllProducts(): Promise<Product[]> {
    // Get all products from the data service
    const searchResult = await dataService.search('', {}, 0, 10000);
    return searchResult.products;
  }

  private async getAllStocks(): Promise<Stock[]> {
    // This would typically come from the data service
    // For now, we'll use the existing stock data
    return [];
  }

  private calculatePopularityScores() {
    // Calculate category popularity based on product count and SF Preferred status
    const categoryStats = new Map<string, { count: number; sfPreferredCount: number }>();
    const brandStats = new Map<string, { count: number; sfPreferredCount: number }>();

    this.products.forEach(product => {
      // Category stats
      if (product.category) {
        const stats = categoryStats.get(product.category) || { count: 0, sfPreferredCount: 0 };
        stats.count++;
        if (product.isSFPreferred) stats.sfPreferredCount++;
        categoryStats.set(product.category, stats);
      }

      // Brand stats
      if (product.brand) {
        const stats = brandStats.get(product.brand) || { count: 0, sfPreferredCount: 0 };
        stats.count++;
        if (product.isSFPreferred) stats.sfPreferredCount++;
        brandStats.set(product.brand, stats);
      }
    });

    // Calculate scores (SF Preferred weight + product count)
    categoryStats.forEach((stats, category) => {
      const score = (stats.sfPreferredCount * 2) + stats.count;
      this.categoryScores.set(category, score);
    });

    brandStats.forEach((stats, brand) => {
      const score = (stats.sfPreferredCount * 2) + stats.count;
      this.brandScores.set(brand, score);
    });
  }

  async getSimilarProducts(productSku: string, limit: number = 10): Promise<RecommendationResult> {
    await this.initialize();
    
    const product = this.products.find(p => p.sku === productSku);
    if (!product) {
      return {
        type: 'similar',
        products: [],
        score: 0,
        reason: 'Product not found'
      };
    }

    const similarProducts = this.products
      .filter(p => p.sku !== productSku)
      .map(p => ({
        product: p,
        score: this.calculateSimilarityScore(product, p)
      }))
      .filter(item => item.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, limit)
      .map(item => item.product);

    return {
      type: 'similar',
      products: similarProducts,
      score: similarProducts.length > 0 ? 0.8 : 0,
      reason: `Products similar to ${product.displayName} based on category, brand, and attributes`
    };
  }

  private calculateSimilarityScore(product1: Product, product2: Product): number {
    let score = 0;

    // Same category (high weight)
    if (product1.category === product2.category) {
      score += 0.4;
    }

    // Same brand (medium weight)
    if (product1.brand === product2.brand) {
      score += 0.3;
    }

    // Same web category (medium weight)
    if (product1.webCategory === product2.webCategory) {
      score += 0.2;
    }

    // Same subcategory (low weight)
    if (product1.webSubCategory === product2.webSubCategory) {
      score += 0.1;
    }

    // SF Preferred bonus
    if (product2.isSFPreferred) {
      score += 0.1;
    }

    // Keyword overlap
    const keywordOverlap = this.calculateKeywordOverlap(product1.keywords, product2.keywords);
    score += keywordOverlap * 0.2;

    return Math.min(score, 1.0);
  }

  private calculateKeywordOverlap(keywords1: string[], keywords2: string[]): number {
    if (keywords1.length === 0 || keywords2.length === 0) return 0;
    
    const set1 = new Set(keywords1.map(k => k.toLowerCase()));
    const set2 = new Set(keywords2.map(k => k.toLowerCase()));
    const intersection = new Set([...set1].filter(k => set2.has(k)));
    
    return intersection.size / Math.max(set1.size, set2.size);
  }

  async getTrendingProducts(categoryFilter?: string[], limit: number = 10): Promise<RecommendationResult> {
    await this.initialize();
    
    let trendingProducts = this.products
      .filter(p => p.isSFPreferred && p.isActive)
      .filter(p => !categoryFilter || categoryFilter.includes(p.category) || categoryFilter.includes(p.webCategory));

    // Sort by category popularity and SF Preferred status
    trendingProducts = trendingProducts
      .map(p => ({
        product: p,
        score: this.calculateTrendingScore(p)
      }))
      .sort((a, b) => b.score - a.score)
      .slice(0, limit)
      .map(item => item.product);

    return {
      type: 'trending',
      products: trendingProducts,
      score: 0.9,
      reason: 'SF Preferred products from popular categories'
    };
  }

  private calculateTrendingScore(product: Product): number {
    let score = 0;

    // SF Preferred bonus
    if (product.isSFPreferred) {
      score += 0.5;
    }

    // Category popularity
    const categoryScore = this.categoryScores.get(product.category) || 0;
    score += (categoryScore / 1000) * 0.3; // Normalize category score

    // Brand popularity
    const brandScore = this.brandScores.get(product.brand) || 0;
    score += (brandScore / 1000) * 0.2; // Normalize brand score

    return score;
  }

  async getComplementaryProducts(productSku: string, limit: number = 10): Promise<RecommendationResult> {
    await this.initialize();
    
    const product = this.products.find(p => p.sku === productSku);
    if (!product) {
      return {
        type: 'complementary',
        products: [],
        score: 0,
        reason: 'Product not found'
      };
    }

    // Find products that complement this one
    const complementaryProducts = this.products
      .filter(p => p.sku !== productSku)
      .map(p => ({
        product: p,
        score: this.calculateComplementaryScore(product, p)
      }))
      .filter(item => item.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, limit)
      .map(item => item.product);

    return {
      type: 'complementary',
      products: complementaryProducts,
      score: complementaryProducts.length > 0 ? 0.7 : 0,
      reason: `Products that complement ${product.displayName}`
    };
  }

  private calculateComplementaryScore(product1: Product, product2: Product): number {
    let score = 0;

    // Same category but different subcategory
    if (product1.category === product2.category && 
        product1.webSubCategory !== product2.webSubCategory) {
      score += 0.4;
    }

    // Related categories (food pairing logic)
    score += this.calculateCategoryComplementarity(product1.category, product2.category);

    // SF Preferred bonus
    if (product2.isSFPreferred) {
      score += 0.1;
    }

    return Math.min(score, 1.0);
  }

  private calculateCategoryComplementarity(category1: string, category2: string): number {
    // Define complementary category relationships
    const complementaryPairs: { [key: string]: string[] } = {
      'DAIRY (CHILLED)': ['BAKING GOODS', 'BREAD', 'FRUIT FRESH'],
      'MEAT FRESH': ['VEGETABLES FRESH', 'HERBS FRESH', 'CONDIMENTS'],
      'POULTRY FRESH': ['VEGETABLES FRESH', 'HERBS FRESH', 'CONDIMENTS'],
      'SEAFOOD FRESH': ['VEGETABLES FRESH', 'HERBS FRESH', 'CONDIMENTS'],
      'BAKING GOODS': ['DAIRY (CHILLED)', 'FRUIT FRESH', 'NUTS'],
      'VEGETABLES FRESH': ['MEAT FRESH', 'POULTRY FRESH', 'SEAFOOD FRESH'],
      'FRUIT FRESH': ['DAIRY (CHILLED)', 'BAKING GOODS'],
      'BEVERAGES': ['SNACKS', 'BAKING GOODS'],
      'CONDIMENTS': ['MEAT FRESH', 'POULTRY FRESH', 'SEAFOOD FRESH', 'VEGETABLES FRESH']
    };

    const complements = complementaryPairs[category1] || [];
    return complements.includes(category2) ? 0.3 : 0;
  }

  async getCategoryTrending(category: string, limit: number = 10): Promise<RecommendationResult> {
    await this.initialize();
    
    const categoryProducts = this.products
      .filter(p => p.category === category || p.webCategory === category)
      .filter(p => p.isActive)
      .map(p => ({
        product: p,
        score: this.calculateTrendingScore(p)
      }))
      .sort((a, b) => b.score - a.score)
      .slice(0, limit)
      .map(item => item.product);

    return {
      type: 'category_trending',
      products: categoryProducts,
      score: 0.8,
      reason: `Trending products in ${category} category`
    };
  }

  async getRecommendations(request: RecommendationRequest): Promise<RecommendationResult[]> {
    await this.initialize();
    
    const recommendations: RecommendationResult[] = [];
    const limit = request.limit || 10;

    if (request.productSku) {
      // Product-based recommendations
      const similar = await this.getSimilarProducts(request.productSku, limit);
      if (similar.products.length > 0) {
        recommendations.push(similar);
      }

      const complementary = await this.getComplementaryProducts(request.productSku, limit);
      if (complementary.products.length > 0) {
        recommendations.push(complementary);
      }
    }

    // Category-based trending
    if (request.categoryFilter && request.categoryFilter.length > 0) {
      for (const category of request.categoryFilter.slice(0, 2)) { // Limit to 2 categories
        const categoryTrending = await this.getCategoryTrending(category, limit);
        if (categoryTrending.products.length > 0) {
          recommendations.push(categoryTrending);
        }
      }
    }

    // General trending
    const trending = await this.getTrendingProducts(request.categoryFilter, limit);
    if (trending.products.length > 0) {
      recommendations.push(trending);
    }

    // Apply user preferences filter
    if (request.userPreferences) {
      recommendations.forEach(rec => {
        rec.products = this.applyUserPreferences(rec.products, request.userPreferences!);
      });
    }

    return recommendations.filter(rec => rec.products.length > 0);
  }

  private applyUserPreferences(products: Product[], preferences: NonNullable<RecommendationRequest['userPreferences']>): Product[] {
    let filtered = products;

    if (preferences.sfPreferred !== undefined) {
      filtered = filtered.filter(p => p.isSFPreferred === preferences.sfPreferred);
    }

    // Price range filtering would go here if we had price data
    // if (preferences.priceRange) {
    //   filtered = filtered.filter(p => {
    //     // Price filtering logic
    //   });
    // }

    return filtered;
  }
}

export const recommendationEngine = new RecommendationEngine();


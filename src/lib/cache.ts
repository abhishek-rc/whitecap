/**
 * Simple in-memory cache for API responses
 */

interface CacheItem<T> {
  data: T;
  timestamp: number;
  expiresAt: number;
}

class SimpleCache {
  private cache = new Map<string, CacheItem<any>>();
  private defaultTTL = 5 * 60 * 1000; // 5 minutes in milliseconds

  set<T>(key: string, data: T, ttl: number = this.defaultTTL): void {
    const now = Date.now();
    this.cache.set(key, {
      data,
      timestamp: now,
      expiresAt: now + ttl
    });
  }

  get<T>(key: string): T | null {
    const item = this.cache.get(key);
    if (!item) {
      return null;
    }

    if (Date.now() > item.expiresAt) {
      this.cache.delete(key);
      return null;
    }

    return item.data;
  }

  has(key: string): boolean {
    const item = this.cache.get(key);
    if (!item) {
      return false;
    }

    if (Date.now() > item.expiresAt) {
      this.cache.delete(key);
      return false;
    }

    return true;
  }

  delete(key: string): boolean {
    return this.cache.delete(key);
  }

  clear(): void {
    this.cache.clear();
  }

  size(): number {
    return this.cache.size;
  }

  // Clean up expired items
  cleanup(): void {
    const now = Date.now();
    for (const [key, item] of this.cache.entries()) {
      if (now > item.expiresAt) {
        this.cache.delete(key);
      }
    }
  }

  // Generate cache key from search parameters
  generateSearchKey(params: {
    query: string;
    page: number;
    offset?: number;
    limit: number;
    category?: string;
    brand?: string;
  
    availability?: string;
    warehouse?: string;
      accset?: string;
  priceMin?: number;
    priceMax?: number;
    sortBy?: string;
  }): string {
    const normalized = {
      query: params.query.toLowerCase().trim(),
      page: params.page,
      offset: params.offset || 0,
      limit: params.limit,
      category: params.category || '',
      brand: params.brand || '',
  
      availability: params.availability || '',
      warehouse: params.warehouse || '',
      accset: params.accset || '',
      priceMin: params.priceMin || 0,
      priceMax: params.priceMax || 0,
      sortBy: params.sortBy || ''
    };
    
    return `search:${JSON.stringify(normalized)}`;
  }
}

export const cache = new SimpleCache();

// Clean up expired cache entries every 10 minutes
setInterval(() => {
  cache.cleanup();
}, 10 * 60 * 1000);

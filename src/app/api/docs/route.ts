import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const apiDocs = {
    title: "Whitecap - Vertex AI Search API",
    version: "1.0.0",
    description: "API for searching and discovering foodservice products for the Australian hospitality industry",
    baseUrl: "http://localhost:3000/api",
    endpoints: {
      health: {
        method: "GET",
        path: "/health",
        description: "Health check endpoint to verify API status",
        response: {
          success: "boolean",
          status: "string",
          timestamp: "string",
          data: {
            totalProducts: "number",
            responseTime: "string",
            services: "object",
            version: "string",
            environment: "string"
          }
        }
      },
      search: {
        method: "GET",
        path: "/search",
        description: "Search for products with advanced filtering and pagination",
        parameters: {
          q: "string - Search query (optional)",
          offset: "number - Pagination offset (default: 0)",
          limit: "number - Results per page (default: 20, max: 100)",
          sfPreferred: "boolean - Filter for SF Preferred products only",
          category: "string - Filter by category",
          brand: "string - Filter by brand",
          availability: "string - Filter by availability status"
        },
        response: {
          success: "boolean",
          data: {
            products: "Product[]",
            total: "number",
            offset: "number",
            limit: "number",
            query: "string",
            filters: "object",
            responseTime: "string"
          }
        }
      },
      autocomplete: {
        method: "GET",
        path: "/autocomplete",
        description: "Get autocomplete suggestions for search queries",
        parameters: {
          q: "string - Partial search query (required)",
          limit: "number - Number of suggestions (default: 8, max: 20)"
        },
        response: {
          success: "boolean",
          data: {
            suggestions: "string[]",
            query: "string",
            count: "number"
          }
        }
      },
      productDetails: {
        method: "GET",
        path: "/products/{sku}",
        description: "Get detailed information for a specific product",
        parameters: {
          sku: "string - Product SKU (required, in URL path)"
        },
        response: {
          success: "boolean",
          data: {
            product: "Product",
            stock: "Stock[]"
          }
        }
      },
      recommendations: {
        method: "GET",
        path: "/recommendations",
        description: "Get product recommendations by type",
        parameters: {
          sku: "string - Product SKU for similar/complementary recommendations",
          type: "string - Recommendation type: 'similar', 'trending', 'complementary', 'category_trending'",
          limit: "number - Number of recommendations (default: 10)",
          category: "string - Category filter for trending recommendations"
        },
        response: {
          success: "boolean",
          data: {
            type: "string",
            sku: "string|null",
            category: "string|null",
            recommendations: "Product[]",
            score: "number",
            reason: "string",
            count: "number"
          }
        }
      },
      bulkRecommendations: {
        method: "POST",
        path: "/recommendations/bulk",
        description: "Get multiple types of recommendations in a single request",
        requestBody: {
          productSku: "string - Product SKU (optional)",
          categoryFilter: "string[] - Categories to filter by",
          brandFilter: "string[] - Brands to filter by",
          userPreferences: {
            sfPreferred: "boolean - Prefer SF Preferred products"
          },
          limit: "number - Results per recommendation type (default: 8)",
          includeTypes: "string[] - Types to include: ['similar', 'trending', 'complementary', 'category_trending']"
        },
        response: {
          success: "boolean",
          data: {
            productSku: "string|null",
            categoryFilter: "string[]|null",
            recommendations: {
              similar: "RecommendationSection",
              complementary: "RecommendationSection",
              trending: "RecommendationSection",
              categoryTrending: "object"
            },
            totalTypes: "number",
            totalProducts: "number",
            errors: "string[]"
          }
        }
      }
    },
    dataModels: {
      Product: {
        id: "string",
        sku: "string",
        displayName: "string",
        description: "string",
        brand: "string",
        category: "string",
        webCategory: "string",
        webSubCategory: "string",
        units: "string",
        imageURL: "string",
        isSFPreferred: "boolean",
        isActive: "boolean",
        availability: "string",
        accset: "string",
        vendor: "string",
        vendorName: "string",
        keywords: "string[]"
      },
      Stock: {
        sku: "string",
        warehouse: "string",
        availableQuantity: "number",
        costUnit: "string"
      },
      RecommendationSection: {
        products: "Product[]",
        score: "number",
        reason: "string",
        count: "number"
      }
    },
    industryContext: {
      targetMarket: "Australian foodservice industry",
      customerTypes: [
        "Restaurants",
        "Cafes", 
        "Pubs",
        "Clubs",
        "Hotels",
        "Contract caterers",
        "QSR chains",
        "Commercial kitchens"
      ],
      totalMarketSize: "81,500 foodservice outlets in Australia",
      keyFeatures: [
        "Semantic search with autocomplete",
        "SF Preferred product highlighting",
        "Multi-warehouse stock visibility",
        "AI-powered product recommendations",
        "Category-based filtering",
        "Brand-based filtering",
        "Real-time availability status"
      ]
    },
    usage: {
      authentication: "None required for POC",
      rateLimit: "No limits for POC",
      cors: "Enabled for all origins",
      contentType: "application/json"
    }
  };

  return NextResponse.json(apiDocs, {
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
    }
  });
}


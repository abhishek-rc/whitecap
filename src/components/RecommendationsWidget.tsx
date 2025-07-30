'use client';

import { useState, useEffect } from 'react';
import { Product } from '@/lib/data';
import ProductCard from './ProductCard';

interface RecommendationSection {
  products: Product[];
  score: number;
  reason: string;
  count: number;
}

interface RecommendationsData {
  similar?: RecommendationSection;
  complementary?: RecommendationSection;
  trending?: RecommendationSection;
  'on-sale'?: RecommendationSection;
  'similar-items'?: RecommendationSection;
  'recommended-for-you'?: RecommendationSection;
  categoryTrending?: { [category: string]: RecommendationSection };
}

interface RecommendationsWidgetProps {
  productSku?: string;
  categories?: string[];
  userPreferences?: {
    sfPreferred?: boolean;
  };
  limit?: number;
  className?: string;
  visitorId?: string;
  userId?: string;
}

export default function RecommendationsWidget({
  productSku,
  categories,
  userPreferences, // Currently not used in GET requests
  limit = 8,
  className = '',
  visitorId = 'widget-user',
  userId
}: RecommendationsWidgetProps) {
  console.log('🎨 RecommendationsWidget rendered with props:', {
    productSku,
    categories,
    limit,
    className
  });

  const [recommendations, setRecommendations] = useState<RecommendationsData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    console.log('🔥 RecommendationsWidget - useEffect triggered', {
      productSku,
      categories,
      limit
    });

    const makeDirectFetch = async () => {
      console.log('🚀 fetchRecommendations called (direct)', { productSku, categories, limit });
      
      setLoading(true);
      setError(null);

      try {
        // Build query parameters for GET request
        const searchParams = new URLSearchParams();
        
        if (productSku) {
          searchParams.set('sku', productSku);
          searchParams.set('models', 'similar-items,on-sale,trending,recommended-for-you');
        } else {
          searchParams.set('models', 'trending,on-sale,recommended-for-you');
        }
        
        searchParams.set('limit', limit.toString());
        searchParams.set('visitorId', visitorId);
        
        if (userId) {
          searchParams.set('userId', userId);
        }
        
        if (categories && categories.length > 0) {
          searchParams.set('category', categories[0]);
        }

        const url = `/api/recommendations/bulk?${searchParams.toString()}`;
        console.log('🌐 About to fetch (direct):', url);

        const response = await fetch(url, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        });

        console.log('📡 Response received (direct):', response.status, response.statusText);

        const data = await response.json();

        console.log('🎯 RecommendationsWidget - API Response (direct):', {
          success: data.success,
          totalTypes: data.data?.totalTypes,
          totalProducts: data.data?.totalProducts,
          recommendationKeys: Object.keys(data.data?.recommendations || {}),
          fullData: data
        });

        if (data.success) {
          const recommendationsData = data.data.recommendations;
          console.log('✅ RecommendationsWidget - About to set state with (direct):', {
            recommendationsData,
            hasData: !!recommendationsData,
            keys: recommendationsData ? Object.keys(recommendationsData) : [],
            similarItemsProducts: recommendationsData?.['similar-items']?.products?.length || 0,
            onSaleProducts: recommendationsData?.['on-sale']?.products?.length || 0
          });
          
          setRecommendations(recommendationsData);
          
          // Force a small delay to ensure state is set
          setTimeout(() => {
            console.log('✅ RecommendationsWidget - State after timeout:', recommendationsData);
          }, 100);
        } else {
          setError(data.error || 'Failed to fetch recommendations');
        }
      } catch (err) {
        setError('Network error while fetching recommendations');
        console.error('❌ Recommendations fetch error (direct):', err);
      } finally {
        setLoading(false);
      }
    };

    makeDirectFetch();
  }, [productSku, categories, limit, visitorId, userId]);

  // Debug render state
  console.log('🎨 RecommendationsWidget - Current render state:', {
    loading,
    error,
    hasRecommendations: !!recommendations,
    recommendationsKeys: recommendations ? Object.keys(recommendations) : [],
    recommendationsObject: recommendations
  });

  const RecommendationSection = ({ 
    title, 
    products, 
    reason, 
    score 
  }: { 
    title: string; 
    products: Product[]; 
    reason: string; 
    score: number;
  }) => (
    <div className="mb-8 bg-gray-50 rounded-lg p-6 border border-gray-100">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
        <div className="flex items-center space-x-2">
          <span className="text-xs text-gray-500">Score: {(score * 100).toFixed(0)}%</span>
          <div className="w-16 h-2 bg-gray-200 rounded-full">
            <div 
              className="h-2 bg-blue-500 rounded-full transition-all duration-300" 
              style={{ width: `${score * 100}%` }}
            ></div>
          </div>
        </div>
      </div>
      <p className="text-sm text-gray-600 mb-4 italic">💡 {reason}</p>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 gap-4">
        {products && Array.isArray(products) && products.slice(0, 4).map((product, index) => {
          console.log(`Rendering product ${index}:`, product);
          return <ProductCard key={product.id} product={product} />;
        })}
      </div>
      {products && Array.isArray(products) && products.length > 4 && (
        <div className="mt-4 text-center">
          <button className="px-4 py-2 text-blue-600 hover:text-white hover:bg-blue-600 text-sm font-medium border border-blue-600 rounded-md transition-colors duration-200">
            View {products.length - 4} more products
          </button>
        </div>
      )}
    </div>
  );

  if (loading) {
    return (
      <div className={`${className}`}>
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 gap-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="bg-gray-200 rounded-lg h-64"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`${className}`}>
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex">
            <svg className="w-5 h-5 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">
                Error loading recommendations
              </h3>
              <p className="text-sm text-red-700 mt-1">{error}</p>
              <button
                onClick={() => window.location.reload()}
                className="mt-2 text-sm text-red-600 hover:text-red-800 font-medium"
              >
                Try again
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!recommendations || Object.keys(recommendations).length === 0) {
    console.log('🚫 RecommendationsWidget - No recommendations to show:', {
      recommendations,
      hasRecommendations: !!recommendations,
      keyCount: recommendations ? Object.keys(recommendations).length : 0,
      loading,
      error,
      recommendationsType: typeof recommendations,
      recommendationsStringified: JSON.stringify(recommendations)
    });
    
    return (
      <div className={`${className} bg-white rounded-lg shadow-sm border border-gray-200 p-6`}>
        <div className="text-center py-8">
          <div className="text-6xl mb-4">🤔</div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No recommendations available at the moment</h3>
          <p className="text-sm text-gray-500 mb-4">
            {productSku 
              ? "We're working on finding great products related to this item." 
              : "Try browsing products to get personalized recommendations."
            }
          </p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 transition-colors"
          >
            🔄 Refresh Recommendations
          </button>
        </div>
      </div>
    );
  }

  console.log('🔍 RecommendationsWidget - Rendering sections:', {
    similarItems: !!recommendations['similar-items']?.products,
    onSale: !!recommendations['on-sale']?.products,
    trending: !!recommendations.trending?.products,
    allKeys: Object.keys(recommendations)
  });

  return (
    <div className={`${className} bg-white rounded-lg shadow-sm border border-gray-200 p-6`}>
      {/* <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">🎯 Recommendations for You</h2>
        <p className="text-sm text-gray-600">
          Personalized product suggestions based on your search and preferences
        </p>
        <div className="mt-2 text-xs text-gray-400">
          Debug: {Object.keys(recommendations).length} sections available: {Object.keys(recommendations).join(', ')}
        </div>
      </div> */}

      {recommendations.similar && recommendations.similar.products && (
        <RecommendationSection
          title="🔍 Similar Products"
          products={recommendations.similar.products}
          reason={recommendations.similar.reason || 'Similar products found'}
          score={recommendations.similar.score || 0}
        />
      )}

      {recommendations.complementary && recommendations.complementary.products && (
        <RecommendationSection
          title="🤝 Complementary Products"
          products={recommendations.complementary.products}
          reason={recommendations.complementary.reason || 'Complementary products found'}
          score={recommendations.complementary.score || 0}
        />
      )}

      {recommendations.trending && recommendations.trending.products && (
        <RecommendationSection
          title="🔥 Trending Products"
          products={recommendations.trending.products}
          reason={recommendations.trending.reason || 'Trending products found'}
          score={recommendations.trending.score || 0}
        />
      )}

      {recommendations['similar-items'] && recommendations['similar-items'].products && (
        <RecommendationSection
          title="🔗 Similar Items"
          products={recommendations['similar-items'].products}
          reason={recommendations['similar-items'].reason || 'Similar items found using Vertex AI'}
          score={recommendations['similar-items'].score || 0}
        />
      )}

      {recommendations['on-sale'] && recommendations['on-sale'].products && (
        <RecommendationSection
          title="🏷️ On Sale"
          products={recommendations['on-sale'].products}
          reason={recommendations['on-sale'].reason || 'On-sale products found using Vertex AI'}
          score={recommendations['on-sale'].score || 0}
        />
      )}

      {recommendations['recommended-for-you'] && recommendations['recommended-for-you'].products && (
        <RecommendationSection
          title="🎯 Recommended For You"
          products={recommendations['recommended-for-you'].products}
          reason={recommendations['recommended-for-you'].reason || 'Personalized recommendations found using Vertex AI'}
          score={recommendations['recommended-for-you'].score || 0}
        />
      )}

      {recommendations.categoryTrending && Object.entries(recommendations.categoryTrending).map(([category, data]) => (
        data && data.products && (
          <RecommendationSection
            key={category}
            title={`📈 Trending in ${category}`}
            products={data.products}
            reason={data.reason || 'Category trending products found'}
            score={data.score || 0}
          />
        )
      ))}
    </div>
  );
}


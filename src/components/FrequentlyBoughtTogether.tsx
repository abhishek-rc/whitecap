'use client';

import { useState, useEffect } from 'react';
import { Product } from '@/lib/data';
import ProductCard from './ProductCard';
import { useCart } from './CartContext';

interface FrequentlyBoughtTogetherProps {
  cartItems: Array<{ product: Product; quantity: number }>;
  visitorId?: string;
  userId?: string;
  limit?: number;
  className?: string;
}

interface FrequentlyBoughtProduct extends Product {
  score?: number;
  reason?: string;
}

interface FrequentlyBoughtResponse {
  products: FrequentlyBoughtProduct[];
  score: number;
  reason: string;
  count: number;
  type: string;
}

export default function FrequentlyBoughtTogether({
  cartItems,
  visitorId = 'cart-user',
  userId,
  limit = 6,
  className = ''
}: FrequentlyBoughtTogetherProps) {
  const [recommendations, setRecommendations] = useState<FrequentlyBoughtProduct[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { addToCart } = useCart();

  useEffect(() => {
    if (cartItems.length === 0) {
      setRecommendations([]);
      return;
    }

    const fetchFrequentlyBoughtTogether = async () => {
      setLoading(true);
      setError(null);

      try {
        // Use the primary item in cart for recommendations
        const primarySku = cartItems[0].product.sku;
        
        const searchParams = new URLSearchParams({
          sku: primarySku,
          limit: limit.toString(),
          visitorId: visitorId
        });

        if (userId) {
          searchParams.set('userId', userId);
        }

        const response = await fetch(`/api/recommendations/complementary?${searchParams.toString()}`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data: FrequentlyBoughtResponse = await response.json();

        // Filter out products already in cart
        const cartSkus = cartItems.map(item => item.product.sku);
        const filteredProducts = data.products.filter(product => 
          !cartSkus.includes(product.sku)
        );

        setRecommendations(filteredProducts);
      } catch (err) {
        console.error('Error fetching frequently bought together:', err);
        setError(err instanceof Error ? err.message : 'Failed to load recommendations');
      } finally {
        setLoading(false);
      }
    };

    fetchFrequentlyBoughtTogether();
  }, [cartItems, visitorId, userId, limit]);

  const handleAddToCart = (product: FrequentlyBoughtProduct) => {
    addToCart(product);
  };

  const handleAddAllToCart = () => {
    recommendations.forEach(product => {
      addToCart(product);
    });
  };

  if (cartItems.length === 0) {
    return null;
  }

  if (loading) {
    return (
      <div className={`${className} bg-white rounded-lg shadow-sm border border-gray-200 p-6`}>
        <div className="animate-pulse">
          <div className="flex items-center justify-between mb-4">
            <div className="h-6 bg-gray-200 rounded w-1/3"></div>
            <div className="h-8 bg-gray-200 rounded w-24"></div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="bg-gray-200 rounded-lg h-64"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`${className} bg-white rounded-lg shadow-sm border border-gray-200 p-6`}>
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
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (recommendations.length === 0) {
    return (
      <div className={`${className} bg-white rounded-lg shadow-sm border border-gray-200 p-6`}>
        <div className="text-center py-8">
          <div className="text-4xl mb-4">🛒</div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No additional recommendations</h3>
          <p className="text-sm text-gray-500">
            We couldn&apos;t find products frequently bought with your current items.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className={`${className} bg-white rounded-lg shadow-sm border border-gray-200 p-6`}>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-bold text-gray-900 mb-1">
            🤝 Frequently Bought Together
          </h2>
          <p className="text-sm text-gray-600">
            Customers who bought &quot;{cartItems[0].product.displayName}&quot; also purchased these items
          </p>
          {recommendations[0]?.score && (
            <div className="flex items-center mt-2">
              <span className="text-xs text-gray-500 mr-2">
                Confidence: {Math.round((recommendations[0].score || 0) * 100)}%
              </span>
              <div className="w-16 h-2 bg-gray-200 rounded-full">
                <div 
                  className="h-2 bg-green-500 rounded-full transition-all duration-300" 
                  style={{ width: `${(recommendations[0].score || 0) * 100}%` }}
                ></div>
              </div>
            </div>
          )}
        </div>
        {recommendations.length > 1 && (
          <button
            onClick={handleAddAllToCart}
            className="px-4 py-2 bg-yellow-500 text-black font-semibold rounded hover:bg-yellow-600 transition-colors duration-200 text-sm whitespace-nowrap"
          >
            Add All to Cart
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {recommendations.map((product) => (
          <div key={product.id} className="relative">
            <ProductCard product={product} />
            <div className="absolute top-2 right-2">
              <button
                onClick={() => handleAddToCart(product)}
                className="bg-yellow-500 hover:bg-yellow-600 text-black p-2 rounded-full shadow-lg transition-colors duration-200"
                title="Add to Cart"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
              </button>
            </div>
            {product.score && (
              <div className="absolute bottom-2 left-2 bg-black bg-opacity-75 text-white text-xs px-2 py-1 rounded">
                {Math.round(product.score * 100)}% match
              </div>
            )}
          </div>
        ))}
      </div>

      {recommendations.length >= limit && (
        <div className="mt-6 text-center">
          <button
            onClick={() => {
              // Could implement pagination or view more functionality
              console.log('View more clicked');
            }}
            className="px-6 py-2 text-yellow-600 hover:text-white hover:bg-yellow-600 text-sm font-medium border border-yellow-600 rounded-md transition-colors duration-200"
          >
            View More Recommendations
          </button>
        </div>
      )}
    </div>
  );
}

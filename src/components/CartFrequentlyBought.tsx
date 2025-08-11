'use client';

import { useState, useEffect } from 'react';
import { Product } from '@/lib/data';
import { useCart } from './CartContext';
import Image from 'next/image';

interface CartFrequentlyBoughtProps {
  cartItems: Array<{ product: Product; quantity: number }>;
  visitorId?: string;
  userId?: string;
  limit?: number;
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

export default function CartFrequentlyBought({
  cartItems,
  visitorId = 'cart-user',
  userId,
  limit = 3
}: CartFrequentlyBoughtProps) {
  const [recommendations, setRecommendations] = useState<FrequentlyBoughtProduct[]>([]);
  const [loading, setLoading] = useState(false);
  const [addedItems, setAddedItems] = useState<Set<string>>(new Set());
  const { addToCart } = useCart();

  useEffect(() => {
    if (cartItems.length === 0) {
      setRecommendations([]);
      return;
    }

    const fetchRecommendations = async () => {
      setLoading(true);

      try {
        const primarySku = cartItems[0].product.sku;
        
        const searchParams = new URLSearchParams({
          sku: primarySku,
          limit: limit.toString(),
          visitorId: visitorId
        });

        if (userId) {
          searchParams.set('userId', userId);
        }

        const response = await fetch(`/api/recommendations/complementary?${searchParams.toString()}`);
        
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data: FrequentlyBoughtResponse = await response.json();

        // Filter out products already in cart
        const cartSkus = cartItems.map(item => item.product.sku);
        const filteredProducts = data.products.filter(product => 
          !cartSkus.includes(product.sku)
        );

        setRecommendations(filteredProducts.slice(0, limit));
      } catch (err) {
        console.error('Error fetching recommendations:', err);
        setRecommendations([]);
      } finally {
        setLoading(false);
      }
    };

    fetchRecommendations();
  }, [cartItems, visitorId, userId, limit]);

  const handleAddToCart = (product: FrequentlyBoughtProduct) => {
    addToCart(product);
    setAddedItems(prev => new Set(prev).add(product.id));
    
    // Remove from recommendations after adding
    setTimeout(() => {
      setRecommendations(prev => prev.filter(p => p.id !== product.id));
    }, 1000);
  };

  if (cartItems.length === 0 || recommendations.length === 0) {
    return null;
  }

  if (loading) {
    return (
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mt-4">
        <div className="animate-pulse">
          <div className="h-5 bg-yellow-200 rounded w-1/2 mb-2"></div>
          <div className="flex space-x-3">
            {[...Array(2)].map((_, i) => (
              <div key={i} className="flex-1 h-20 bg-yellow-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mt-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-medium text-gray-900">
          🤝 Frequently bought together
        </h3>
        <span className="text-xs text-gray-500">
          {Math.round((recommendations[0]?.score || 0.8) * 100)}% confidence
        </span>
      </div>
      
      <div className="space-y-3">
        {recommendations.map((product) => (
          <div key={product.id} className="flex items-center justify-between bg-white rounded-lg p-3 shadow-sm">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 relative bg-gray-100 rounded flex-shrink-0">
                {product.imageURL ? (
                  <Image 
                    src={product.imageURL} 
                    alt={product.displayName} 
                    fill 
                    className="object-contain rounded"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-400 text-xs">
                    No image
                  </div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="text-sm font-medium text-gray-900 truncate">
                  {product.displayName}
                </h4>
                <p className="text-xs text-gray-500 truncate">
                  SKU: {product.sku}
                </p>
                <p className="text-sm font-semibold text-gray-900">
                  ${(product.price || 0).toFixed(2)}
                </p>
              </div>
            </div>
            
            <div className="flex-shrink-0">
              {addedItems.has(product.id) ? (
                <div className="flex items-center text-green-600 text-sm">
                  <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  Added
                </div>
              ) : (
                <button
                  onClick={() => handleAddToCart(product)}
                  className="px-3 py-1 bg-yellow-500 text-black text-sm font-medium rounded hover:bg-yellow-600 transition-colors duration-200"
                >
                  Add
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
      
      {recommendations.length > 0 && (
        <div className="mt-3 text-center">
          <p className="text-xs text-gray-500">
            Based on purchasing patterns from {cartItems[0]?.product.displayName}
          </p>
        </div>
      )}
    </div>
  );
}

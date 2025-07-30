'use client';

import { useCart } from './CartContext';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { getOrCreateVisitorId } from '@/lib/visitorId';
import { Product } from '@/lib/data';

interface ProductCardProps {
  product: Product & {
    availableQuantity?: number;
    totalStock?: number;
    stockWarehouses?: number;
  };
  userId?: string | null;
  visitorId?: string;
}

export default function ProductCard({ product, userId, visitorId }: ProductCardProps) {
  const [addLoading, setAddLoading] = useState(false);
  const [imageError, setImageError] = useState(false);
  const { addToCart } = useCart();
  const router = useRouter();

  const sendUserEvent = async (eventFields: Record<string, any>) => {
    try {
      const payload: Record<string, any> = {
        visitorId: visitorId || getOrCreateVisitorId(),
        eventTime: new Date().toISOString(),
        ...eventFields
      };
      if (userId) {
        payload.userInfo = { userId };
      }
      await fetch('/api/user-event', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
    } catch (err) {
      console.error('User event error:', err);
    }
  };

  const handleImageError = () => {
    setImageError(true);
  };

  const truncateText = (text: string, maxLength: number) => {
    if (!text) return '';
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
  };

  const getAvailabilityColor = (availability: string) => {
    switch (availability.toLowerCase()) {
      case 'available':
        return 'text-green-600 bg-green-100';
      case 'not available':
        return 'text-red-600 bg-red-100';
      default:
        return 'text-yellow-600 bg-yellow-100';
    }
  };

  const getStockInfo = () => {
    // Try to extract stock info from various possible sources
    const availableQuantity = product.availableQuantity || 0;
    const totalStock = product.totalStock || availableQuantity;
    const stockWarehouses = product.stockWarehouses || 0;
    
    return {
      quantity: totalStock,
      warehouses: stockWarehouses,
      hasStock: totalStock > 0
    };
  };

  const getStockDisplay = () => {
    const stockInfo = getStockInfo();
    
    if (stockInfo.quantity === 0) {
      return { text: 'Out of Stock', color: 'text-red-600 bg-red-50' };
    } else if (stockInfo.quantity < 10) {
      return { text: `${stockInfo.quantity} units`, color: 'text-yellow-600 bg-yellow-50' };
    } else {
      return { text: `${stockInfo.quantity} units`, color: 'text-green-600 bg-green-50' };
    }
  };

  return (
    <div className="border border-gray-200 rounded-lg overflow-hidden hover:shadow-md transition-shadow duration-200">
      {/* Product Image */}
      <div className="aspect-w-1 aspect-h-1 bg-gray-200">
        {product.imageURL && !imageError ? (
          <img
            src={product.imageURL}
            alt={product.displayName || 'Product'}
            className="w-full h-48 object-cover"
            onError={handleImageError}
          />
        ) : (
          <div className="flex items-center justify-center h-48">
            <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
        )}
      </div>

      {/* Product Info */}
      <div className="p-4">
        {/* Category */}
        <div className="text-sm text-gray-500 mb-1">{product.categoryDesc || product.category || 'Product'}</div>
        
        {/* Product Name */}
        <h3 className="text-lg font-medium text-gray-900 mb-2">{truncateText(product.displayName || 'Product', 60)}</h3>
        
        {/* SKU */}
        <div className="text-sm mb-2">SKU: {product.sku || 'N/A'}</div>
        
        {/* Pricing */}
        <div className="flex items-center justify-between">
          <div>
            {product.discountedPrice && product.price && product.discountedPrice < product.price ? (
              <>
                <div className="text-green-600 font-medium">Sale</div>
                <div className="text-xl font-bold text-gray-900">
                  ${product.discountedPrice.toFixed(2)} <span className="text-sm text-gray-500 line-through">${product.price.toFixed(2)}</span>
                </div>
              </>
            ) : (
              <div className="text-xl font-bold text-gray-900">${product.price?.toFixed(2) || 'N/A'}</div>
            )}
          </div>
          
          {/* Add to Cart Button */}
          <button 
            className="px-3 py-2 bg-yellow-500 text-white rounded hover:bg-yellow-600 transition-colors"
            onClick={async () => {
              setAddLoading(true);
              await sendUserEvent({
                eventType: 'add-to-cart',
                productDetails: [{ product, quantity: 1 }],
                uri: window.location.href
              });
              addToCart(product, 1);
              setAddLoading(false);
              // Removed navigation to product detail page
            }}
            disabled={addLoading}
          >
            {addLoading ? (
              <div className="flex items-center">
                <svg className="animate-spin h-4 w-4 mr-1 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"></path>
                </svg>
                <span>ADDING...</span>
              </div>
            ) : (
              'ADD TO CART'
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

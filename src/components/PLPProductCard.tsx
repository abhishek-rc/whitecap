'use client';

import { useCart } from './CartContext';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { getOrCreateVisitorId } from '@/lib/visitorId';
import { Product } from '@/lib/data';

interface PLPProductCardProps {
  product: Product & {
    availableQuantity?: number;
    totalStock?: number;
    stockWarehouses?: number;
  };
  userId?: string | null;
  visitorId?: string;
}

export default function PLPProductCard({ product, userId, visitorId }: PLPProductCardProps) {
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

  return (
    <div className="border border-gray-300 rounded-md overflow-hidden hover:shadow-md transition-shadow duration-200 bg-white mb-4">
      <div className="flex flex-col md:flex-row">
        {/* Product Image - Left side */}
        <div 
          className="md:w-1/4 p-4 flex items-center justify-center bg-white cursor-pointer"
          onClick={() => router.push(`/product/${product.id}`)}
        >
          {product.imageURL && !imageError ? (
            <img
              src={product.imageURL}
              alt={product.displayName || 'Product'}
              className="max-h-40 object-contain"
              onError={handleImageError}
            />
          ) : (
            <div className="flex items-center justify-center h-40 w-full">
              <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
          )}
        </div>

        {/* Product Info - Right side */}
        <div className="md:w-3/4 p-4 border-t md:border-t-0 md:border-l border-gray-300">
          {/* Brand */}
          <div className="text-blue-600 font-medium mb-1">
            {product.brand || product.categoryDesc || 'Brand'}
          </div>
          
          {/* Product Name */}
          <h3 
            className="text-lg font-medium text-gray-900 mb-2 cursor-pointer hover:text-blue-600"
            onClick={() => router.push(`/product/${product.id}`)}
          >
            {truncateText(product.displayName || 'Product', 60)}
          </h3>
          
          {/* SKU and MFG# */}
          <div className="flex flex-col sm:flex-row sm:space-x-6 mb-3">
            <div className="text-sm text-gray-600">SKU#
              <span className="font-bold">:{product.sku || 'N/A'}</span></div>
            <div className="text-sm text-gray-600">MFG#
              <span className="font-bold">:{(product as any).manufacturerSku || product.sku || 'N/A'}</span></div>
          </div>
          
          {/* Price and Availability */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4">
            <div>
              {product.discountedPrice && product.price && product.discountedPrice < product.price ? (
                <div className="text-xl font-bold text-gray-900">
                  ${product.discountedPrice.toFixed(2)} <span className="text-gray-500">(EACH)</span>
                  <div className="text-sm text-gray-500 line-through">${product.price.toFixed(2)}</div>
                </div>
              ) : (
                <div className="text-xl font-bold text-gray-900">
                  ${product.price?.toFixed(2) || 'N/A'} <span className="text-gray-500">(EACH)</span>
                </div>
              )}
            </div>
            
            {/* Stock Status */}
            <div className="mt-2 sm:mt-0">
              {getStockInfo().hasStock ? (
                <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
                  In Stock
                </span>
              ) : (
                <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-red-100 text-red-800">
                  <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                  Out of Stock
                </span>
              )}
            </div>
          </div>
          
          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-3">
            <button 
              className="px-4 py-2 border border-blue-600 text-blue-600 rounded hover:bg-blue-50 transition-colors text-sm font-medium"
              onClick={() => {
                // Add to list functionality would go here
                alert('Add to list feature not implemented yet');
              }}
            >
              Add to List
            </button>
            
            <button 
              className="px-4 py-2 bg-yellow-500 text-white rounded hover:bg-yellow-600 transition-colors text-sm font-medium"
              onClick={async () => {
                setAddLoading(true);
                await sendUserEvent({
                  eventType: 'add-to-cart',
                  productDetails: [{ product, quantity: 1 }],
                  uri: window.location.href
                });
                addToCart(product, 1);
                setAddLoading(false);
              }}
              disabled={addLoading || !getStockInfo().hasStock}
            >
              {addLoading ? (
                <div className="flex items-center justify-center">
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
    </div>
  );
}

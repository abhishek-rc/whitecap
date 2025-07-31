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
  cardType?: 'small' | 'tall';
}

export default function PLPProductCard({ product, userId, visitorId, cardType = 'small' }: PLPProductCardProps) {
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
    <div className={`bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-shadow duration-200 ${cardType === 'tall' ? 'row-span-2' : ''}`}>
      {/* Product Image */}
      <div 
        className={`bg-gray-50 cursor-pointer overflow-hidden relative ${cardType === 'tall' ? 'aspect-[4/5]' : 'aspect-square'}`}
        onClick={() => router.push(`/product/${product.id}`)}
      >
        {product.imageURL && !imageError ? (
          <img
            src={product.imageURL}
            alt={product.displayName || 'Product'}
            className="w-full h-full object-contain p-4 hover:scale-105 transition-transform duration-200"
            onError={handleImageError}
          />
        ) : (
          <div className="flex items-center justify-center h-full w-full">
            <svg className="w-12 h-12 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
        )}
        
        {/* Sponsored Label - Top Left */}
        {/* {product.brand && (product.brand.toLowerCase().includes('sponsored') || Math.random() > 0.7) && (
          <div className="absolute top-3 left-3">
            <span className="bg-white text-gray-700 text-xs px-2 py-1 rounded-full shadow-sm font-medium">
              Sponsored
            </span>
          </div>
        )} */}

        {/* Three dots menu - Top Right */}
        {/* <div className="absolute top-3 right-3">
          <button className="w-8 h-8 flex items-center justify-center text-gray-500 hover:text-gray-700 bg-white rounded-full shadow-sm hover:shadow-md transition-all duration-200">
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 8c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm0 2c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0 6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z"/>
            </svg>
          </button>
        </div> */}
      </div>

      {/* Product Info */}
      <div className="p-4">
        {/* Product Name */}
        <h3 
          className="text-sm font-semibold text-gray-900 mb-2 cursor-pointer hover:text-blue-600 leading-tight line-clamp-2"
          onClick={() => router.push(`/product/${product.id}`)}
          style={{ minHeight: '2rem' }}
        >
          {truncateText(product.displayName || 'Product Name', 55)}
        </h3>
        
        {/* Price */}
        <div className="mb-3">
          {product.discountedPrice && product.price && product.discountedPrice < product.price ? (
            <div>
              <div className="text-lg font-bold text-gray-900">
                ${product.discountedPrice.toFixed(2)}
              </div>
              <div className="text-sm text-gray-500 line-through">
                ${product.price.toFixed(2)}
              </div>
            </div>
          ) : (
            <div className="text-lg font-bold text-gray-900">
              ${product.price?.toFixed(2) || 'N/A'}
            </div>
          )}
        </div>
        
        {/* Brand */}
        <div className="text-sm text-gray-600 mb-4 font-medium">
          {product.brand || product.categoryDesc || 'Brand Name'}
        </div>
        
        {/* Stock Status - if out of stock */}
        {!getStockInfo().hasStock && (
          <div className="mb-3">
            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-50 text-red-700 border border-red-200">
              <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
              Out of Stock
            </span>
          </div>
        )}
        
        {/* Action Buttons */}
        <div className="space-y-2">
          <button 
            className="w-full px-4 py-2.5 bg-yellow-500 text-white rounded-xl hover:bg-yellow-600 transition-colors text-sm font-semibold disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
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
                <svg className="animate-spin h-4 w-4 mr-2 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"></path>
                </svg>
                <span>Adding...</span>
              </div>
            ) : (
              'ADD TO CART'
            )}
          </button>
          
          <button 
            className="w-full px-4 py-2.5 border border-gray-200 text-gray-700 rounded-xl hover:bg-gray-50 hover:border-gray-300 transition-all duration-200 text-sm font-semibold"
            onClick={() => {
              alert('Add to list feature not implemented yet');
            }}
          >
            Add to List
          </button>
        </div>
      </div>
    </div>
  );
}
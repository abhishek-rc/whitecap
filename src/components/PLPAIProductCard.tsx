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
  cardType?: 'small' | 'tall' | 'wide'; // New prop to control card size
}

export default function PLPAIProductCard({ product, userId, visitorId, cardType = 'small' }: PLPProductCardProps) {
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

  // Get card classes based on type
  const getCardClasses = () => {
    const baseClasses = "bg-gray-100 rounded-lg overflow-hidden relative";
    
    switch(cardType) {
      case 'tall':
        return `${baseClasses} row-span-2`; // Takes 2 rows
      case 'wide':
        return `${baseClasses} col-span-2`; // Takes 2 columns
      default:
        return baseClasses; // Regular size
    }
  };

  // Get image aspect ratio based on card type
  const getImageClasses = () => {
    switch(cardType) {
      case 'tall':
        return "aspect-[3/4] bg-gray-100 cursor-pointer overflow-hidden relative"; // Taller aspect ratio
      case 'wide':
        return "aspect-[2/1] bg-gray-100 cursor-pointer overflow-hidden relative"; // Wider aspect ratio
      default:
        return "aspect-square bg-gray-100 cursor-pointer overflow-hidden relative"; // Square
    }
  };

  return (
    <div className={getCardClasses()}>
      {/* Product Image */}
      <div 
        className={getImageClasses()}
        onClick={() => router.push(`/product/${product.id}`)}
      >
        {product.imageURL && !imageError ? (
          <img
            src={product.imageURL}
            alt={product.displayName || 'Product'}
            className="w-full h-full object-cover p-2"
            onError={handleImageError}
          />
        ) : (
          <div className="flex items-center justify-center h-full w-full">
            <svg className="w-16 h-16 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
        )}
        
        {/* Top Left Label - Sponsored or Stock Status */}
        <div className="absolute top-2 left-2">
          {!getStockInfo().hasStock ? (
            <span className="bg-red-500 text-white text-xs px-2 py-1 rounded">
              Out of Stock
            </span>
          ) : product.brand === 'Sponsored' ? (
            <span className="bg-white text-gray-700 text-xs px-2 py-1 rounded shadow">
              Sponsored
            </span>
          ) : null}
        </div>

        {/* Three dots menu - Top Right */}
        <div className="absolute top-2 right-2">
          <button className="w-6 h-6 flex items-center justify-center text-gray-600 hover:text-gray-800 bg-white rounded-full shadow-sm">
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 8c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm0 2c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0 6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z"/>
            </svg>
          </button>
        </div>
      </div>

      {/* Product Info - White Background */}
      <div className="bg-white p-3">
        {/* Product Name */}
        <h3 
          className="text-sm font-medium text-gray-900 mb-1 cursor-pointer hover:text-blue-600 leading-tight"
          onClick={() => router.push(`/product/${product.id}`)}
        >
          {truncateText(product.displayName || 'Product', cardType === 'wide' ? 60 : 45)}
        </h3>
        
        {/* Price */}
        <div className="mb-2">
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
        <div className="text-xs text-gray-600 mb-3">
          {product.brand || product.categoryDesc || 'Brand'}
        </div>
        
        {/* Action Buttons - Adjust layout for wide cards */}
        <div className={cardType === 'wide' ? 'flex space-x-2' : 'space-y-2'}>
          <button 
            className={`px-3 py-2 bg-yellow-500 text-white rounded hover:bg-yellow-600 transition-colors text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed ${cardType === 'wide' ? 'flex-1' : 'w-full'}`}
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
                <span>Adding...</span>
              </div>
            ) : (
              'ADD TO CART'
            )}
          </button>
          
          <button 
            className={`px-3 py-2 border border-gray-300 text-gray-700 rounded hover:bg-gray-50 transition-colors text-sm font-medium ${cardType === 'wide' ? 'flex-1' : 'w-full'}`}
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
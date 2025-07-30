'use client';

import { useCart } from './CartContext';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { getOrCreateVisitorId } from '@/lib/visitorId';
import { Product } from '@/lib/data';
import Image from 'next/image';

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


  const [imageError, setImageError] = useState(false);
  const [showDetails, setShowDetails] = useState(false);

  const handleImageError = () => {
    setImageError(true);
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

  const truncateText = (text: string, maxLength: number) => {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
  };

  // Helper function to get numeric rating value
  const getRatingValue = () => {
    if (typeof product.rating === 'number') {
      return product.rating;
    } else if (typeof product.rating === 'object' && product.rating?.averageRating) {
      return product.rating.averageRating;
    }
    return 0;
  };

  // Helper function to get review count
  const getReviewCount = () => {
    if (product.reviewCount) {
      return product.reviewCount;
    } else if (typeof product.rating === 'object' && product.rating?.ratingCount) {
      return product.rating.ratingCount;
    }
    return 0;
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
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow duration-200">
      {/* Product Image */}
      <div className="relative h-48 bg-gray-100 rounded-t-lg overflow-hidden">
        {product.imageURL && !imageError ? (
          <Image
            src={product.imageURL}
            alt={product.displayName}
            fill
            className="object-cover"
            onError={handleImageError}
          />
        ) : (
          <div className="flex items-center justify-center h-full">
            <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
        )}
        
        {/* SF Preferred Badge */}
        {product.isSFPreferred && (
          <div className="absolute top-2 left-2">
            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
              SF Preferred
            </span>
          </div>
        )}

        {/* Availability and Stock Badges */}
        <div className="absolute top-2 right-2 space-y-1">
          <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getAvailabilityColor(product.availability)}`}>
            {product.availability}
          </span>
          {getStockInfo().quantity > 0 && (
            <div className="flex justify-end">
              <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStockDisplay().color}`}>
                {getStockDisplay().text}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Product Info */}
      <div className="p-4">
        {/* SKU */}
        <div className="text-xs font-mono text-gray-500 mb-1">
          SKU: {product.sku}
        </div>

        {/* Product Name */}
        <h3 className="text-sm font-medium text-gray-900 mb-2 line-clamp-2">
          {truncateText(product.displayName, 60)}
        </h3>

        {/* Low Stock Warning */}
        {typeof product.stock === 'number' && product.stock <= 3 && (
          <div className="mb-2 text-xs font-bold text-red-600">Only {product.stock} left!</div>
        )}
        {/* Brand and Category */}
        <div className="flex items-center justify-between text-xs text-gray-600 mb-2">
          <span className="font-medium">{product.brand}</span>
          <span className="text-gray-400">•</span>
          <span>{product.category}</span>
        </div>

        {/* Rating */}
        {product.rating && getRatingValue() > 0 && (
          <div className="flex items-center mb-2">
            <div className="flex items-center">
              {[1, 2, 3, 4, 5].map((star) => (
                <svg
                  key={star}
                  className={`w-3 h-3 ${
                    star <= Math.floor(getRatingValue())
                      ? 'text-yellow-400 fill-current'
                      : star - 0.5 <= getRatingValue()
                      ? 'text-yellow-400 fill-current'
                      : 'text-gray-300'
                  }`}
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 20 20"
                >
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
              ))}
            </div>
            <span className="text-xs text-gray-600 ml-1">
              {getRatingValue().toFixed(1)} ({getReviewCount()} reviews)
            </span>
          </div>
        )}

        {/* Pricing */}
        {product.price && (
          <div className="flex items-center mb-3">
            {product.discountedPrice ? (
              <div className="flex items-center">
                <span className="text-lg font-bold text-red-600">
                  ${product.discountedPrice.toFixed(2)}
                </span>
                <span className="text-sm text-gray-500 line-through ml-2">
                  ${product.price.toFixed(2)}
                </span>
                <span className="text-xs bg-red-100 text-red-800 px-2 py-1 rounded-full ml-2">
                  Save ${(product.price - product.discountedPrice).toFixed(2)}
                </span>
              </div>
            ) : (
              <span className="text-lg font-bold text-gray-900">
                ${product.price.toFixed(2)}
              </span>
            )}
          </div>
        )}

        {/* Stock Information */}
        {(product.availableQuantity !== undefined || product.totalStock !== undefined) && (
          <div className="flex items-center justify-between text-xs mb-3">
            <div className="flex items-center space-x-2">
              <svg className="w-3 h-3 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
              </svg>
              <span className="text-gray-600">Stock:</span>
            </div>
            <span className={`font-medium ${getStockDisplay().color.split(' ')[0]}`}>
              {getStockDisplay().text}
              {getStockInfo().warehouses > 0 && (
                <span className="text-gray-500 ml-1">
                  ({getStockInfo().warehouses} locations)
                </span>
              )}
            </span>
          </div>
        )}

        {/* Description */}
        {product.description && (
          <p className="text-xs text-gray-600 mb-3 line-clamp-2">
            {truncateText(product.description, 80)}
          </p>
        )}

        {/* Units */}
        {product.units && (
          <div className="text-xs text-gray-500 mb-3">
            Unit: {product.units}
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex items-center justify-between">
          <button
            onClick={() => setShowDetails(!showDetails)}
            className="text-xs text-blue-600 hover:text-blue-800 font-medium"
          >
            {showDetails ? 'Hide Details' : 'View Details'}
          </button>
          
          <div className="flex space-x-2">
            <button
              type="button"
              className="px-2 py-1.5 bg-gray-100 text-gray-700 text-xs font-medium rounded hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
              onClick={async () => {
                await sendUserEvent({
                  eventType: 'view-product-details',
                  productDetails: [{ product }],
                  uri: window.location.href
                });
                router.push(`/product/${encodeURIComponent(product.sku)}`);
              }}
            >
              View
            </button>
            <button
              className="px-3 py-1.5 bg-blue-600 text-white text-xs font-medium rounded hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 flex items-center"
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
              disabled={addLoading}
            >
              {addLoading && (
                <svg className="animate-spin h-4 w-4 mr-1 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"></path>
                </svg>
              )}
              Add to Cart
            </button>
          </div>
        </div>

        {/* Expanded Details */}
        {showDetails && (
          <div className="mt-4 pt-4 border-t border-gray-200">
            <div className="space-y-2 text-xs">
              {product.accset && (
                <div>
                  <span className="font-medium text-gray-700">Account Set:</span>
                  <span className="ml-1 text-gray-600">{product.accset}</span>
                </div>
              )}
              
              {product.vendor && (
                <div>
                  <span className="font-medium text-gray-700">Vendor:</span>
                  <span className="ml-1 text-gray-600">{product.vendorName || product.vendor}</span>
                </div>
              )}
              
              {product.webCategory && product.webCategory !== product.category && (
                <div>
                  <span className="font-medium text-gray-700">Web Category:</span>
                  <span className="ml-1 text-gray-600">{product.webCategory}</span>
                </div>
              )}
              
              {product.webSubCategory && (
                <div>
                  <span className="font-medium text-gray-700">Subcategory:</span>
                  <span className="ml-1 text-gray-600">{product.webSubCategory}</span>
                </div>
              )}

              {product.keywords.length > 0 && (
                <div>
                  <span className="font-medium text-gray-700">Keywords:</span>
                  <div className="mt-1 flex flex-wrap gap-1">
                    {product.keywords.slice(0, 3).map((keyword, index) => (
                      <span
                        key={index}
                        className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800"
                      >
                        {keyword}
                      </span>
                    ))}
                    {product.keywords.length > 3 && (
                      <span className="text-gray-500">+{product.keywords.length - 3} more</span>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}


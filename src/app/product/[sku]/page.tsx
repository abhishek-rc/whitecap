'use client';

import { useState, useEffect, useCallback } from 'react';
import { useCart } from '@/components/CartContext';
import { useRouter } from 'next/navigation';
import { getOrCreateVisitorId } from '@/lib/visitorId';
import { Product as ProductType, Stock as StockType } from '@/lib/data';
import RecommendationsWidget from '@/components/RecommendationsWidget';
import Image from 'next/image';
import Link from 'next/link';
import LayoutWrapper from '@/components/LayoutWrapper';

const DEMO_USERS = [
  { id: "tahir", name: "Tahir", visitorId: "160463000" },
  { id: "tahsin", name: "Tahsin", visitorId: "95375000" },
  { id: "pooja", name: "Pooja", visitorId: "10000005743" },
  { id: "mahveer", name: "Mahveer", visitorId: "59092000" },];

interface Product {
  sku: string;
  displayName: string;
  description?: string;
  imageURL?: string;
  brand?: string;
  category?: string;
  webCategory?: string;
  webSubCategory?: string;
  units?: string;
  availability: string;
  isSFPreferred?: boolean;
  keywords: string[];
  accset?: string;
  vendor?: string;
  vendorName?: string;
  price?: number;
}

interface Stock {
  availableQuantity: number;
  branch?: string;
  // Add other properties as needed
}

interface ProductData {
  product: ProductType;
  stock: StockType[];
}

interface ProductSuggestion {
  sku: string;
  displayName: string;
}

function getStoredDemoUserId() {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('demoUserId');
}

function getCurrentVisitorId(selectedUserId: string | null): string {
  return selectedUserId 
    ? DEMO_USERS.find(user => user.id === selectedUserId)?.visitorId || getOrCreateVisitorId()
    : getOrCreateVisitorId();
}

interface ProductSuggestion {
  sku: string;
  displayName: string;
}

export default function ProductDetailPage({ params }: { params: Promise<{ sku: string }> }) {
  const { addToCart, cart } = useCart();
  const [addLoading, setAddLoading] = useState(false);
  const router = useRouter();
  const [sku, setSku] = useState<string>('');
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  
  const [productData, setProductData] = useState<ProductData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [suggestions, setSuggestions] = useState<ProductSuggestion[]>([]);
  const [imageError, setImageError] = useState(false);

  useEffect(() => {
    const getParams = async () => {
      const resolvedParams = await params;
      setSku(resolvedParams.sku);
    };
    getParams();
  }, [params]);

  // Load selected demo user from localStorage
  useEffect(() => {
    const stored = getStoredDemoUserId();
    if (stored) setSelectedUserId(stored);
  }, []);

  const fetchProductData = useCallback(async () => {
    if (!sku) return;
    
    setLoading(true);
    setError(null);
    setSuggestions([]);

    try {
      const response = await fetch(`/api/products/${encodeURIComponent(sku)}`);
      const data = await response.json();

      if (data.success) {
        setProductData(data.data);
      } else {
        setError(data.error || 'Product not found');
        if (data.suggestions) {
          setSuggestions(data.suggestions);
        }
      }
    } catch (err) {
      setError('Failed to load product data');
      console.error('Product fetch error:', err);
    } finally {
      setLoading(false);
    }
  }, [sku]);

  useEffect(() => {
    fetchProductData();
  }, [fetchProductData]);

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

  const getTotalStock = (stockRecords: StockType[]) => {
    return stockRecords.reduce((total: number, stock: StockType) => total + stock.availableQuantity, 0);
  };

  if (loading) {
    return (
      <LayoutWrapper>
        <div className="max-w-7xl mx-auto py-8">
          <div className="animate-pulse">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
              <div className="bg-gray-200 rounded-lg h-96"></div>
              <div className="space-y-4">
                <div className="h-8 bg-gray-200 rounded w-3/4"></div>
                <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                <div className="h-20 bg-gray-200 rounded"></div>
              </div>
            </div>
          </div>
        </div>
      </LayoutWrapper>
    );
  }

  if (error || !productData) {
    return (
      <LayoutWrapper>
        <div className="max-w-7xl mx-auto py-8">
          <div className="text-center">
            <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <h3 className="mt-2 text-sm font-medium text-gray-900">Product not found</h3>
            <p className="mt-1 text-sm text-gray-500">{error}</p>
            <p className="mt-1 text-xs text-gray-400">Looking for SKU: {sku}</p>
            
            {suggestions.length > 0 && (
              <div className="mt-6 max-w-md mx-auto">
                <p className="text-sm text-gray-700 mb-3">Did you mean one of these?</p>
                <div className="space-y-2">
                  {suggestions.map((suggestion) => (
                    <button
                      key={suggestion.sku}
                      onClick={() => router.push(`/product/${encodeURIComponent(suggestion.sku)}`)}
                      className="block w-full text-left p-3 border border-gray-200 rounded-md hover:bg-gray-50 hover:border-gray-300 transition-colors"
                    >
                      <div className="font-medium text-blue-600">{suggestion.sku}</div>
                      <div className="text-sm text-gray-600">{suggestion.displayName}</div>
                    </button>
                  ))}
                </div>
              </div>
            )}
            
            <button
              onClick={() => router.back()}
              className="mt-4 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700"
            >
              Go Back
            </button>
          </div>
        </div>
      </LayoutWrapper>
    );
  }

  const { product, stock } = productData;

  return (
    <LayoutWrapper>

      <div className="max-w-7xl mx-auto py-8">
        {/* Product Details */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-8">
          {/* Brand Logo */}
          {/* <div className="flex justify-end">
            {product.vendorName && (
              <div className="text-right">
                <img 
                  src={`https://d2ou5j4j4yi9kl.cloudfront.net/userfiles/vendors/${product.vendorName.toLowerCase().replace(/\s+/g, '_')}_logo.png`} 
                  alt={product.vendorName} 
                  className="h-8 inline-block"
                  onError={(e) => {
                    // Fallback to text if image fails to load
                    (e.target as HTMLImageElement).style.display = 'none';
                  }}
                />
              </div>
            )}
          </div> */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 p-6">
            {/* Product Image */}
            <div className="flex flex-col">
              <div className="border border-gray-200 p-4 rounded-md bg-white mb-4">
                <div className="flex justify-center items-center h-80">
                  {product.imageURL && !imageError ? (
                    <img
                      src={product.imageURL}
                      alt={product.displayName}
                      className="max-h-full max-w-full object-contain"
                      onError={handleImageError}
                    />
                  ) : (
                    <div className="flex items-center justify-center h-full w-full">
                      <svg className="w-24 h-24 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                    </div>
                  )}
                </div>
              </div>
              
              {/* Thumbnail Gallery */}
              <div className="flex space-x-2 justify-start">
                <div className="w-16 h-16 border border-yellow-500 rounded-md p-1 cursor-pointer">
                  {product.imageURL && !imageError ? (
                    <img
                      src={product.imageURL}
                      alt={product.displayName}
                      className="w-full h-full object-contain"
                    />
                  ) : (
                    <div className="flex items-center justify-center h-full w-full">
                      <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Product Information */}
            <div className="space-y-6">
              <div>
                <h1 className="text-3xl font-bold text-gray-900 mb-4">
                  {product.displayName}
                </h1>
                
                {/* SKU and MFG# */}
                <div className="flex flex-wrap gap-x-8 gap-y-2 text-sm text-gray-700 mb-6">
                  <div>
                    <span className="font-semibold">SKU#:</span> {product.sku}
                  </div>
                  <div>
                    <span className="font-semibold">MFG#:</span> {(product as any).manufacturerSku || 'SPJ100'}
                  </div>
                </div>
              </div>

              {/* Price */}
              <div>
                <div className="text-3xl font-bold text-gray-900">
                  ${product.price?.toFixed(2) || '0.00'} <span className="text-lg font-normal">(EACH)</span>
                </div>
              </div>

              {/* Ready to Ship */}
              <div>
                <div className="flex items-center text-green-700 mb-2">
                  <svg className="h-5 w-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span className="font-medium">Ready to Ship</span>
                </div>
                <button className="text-blue-600 hover:text-blue-800 text-sm font-medium">
                  View Availability by Branch
                </button>
              </div>
              
              {/* Quantity and Add to Cart */}
              <div>
                <div className="mb-2 text-sm font-medium text-gray-700">QTY</div>
                <div className="flex space-x-4">
                  <input 
                    type="number" 
                    min="1" 
                    defaultValue="1" 
                    className="w-24 border border-gray-300 rounded px-3 py-2 text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <button 
                    className="px-6 py-2 bg-yellow-500 text-white font-medium rounded hover:bg-yellow-600 transition-colors"
                    onClick={async () => {
                      setAddLoading(true);
                      await fetch('/api/user-event', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                          eventType: 'add-to-cart',
                          productDetails: [{ product, quantity: 1 }],
                          uri: window.location.href
                        })
                      });
                      addToCart(product, 1);
                      setAddLoading(false);
                    }}
                    disabled={addLoading}
                  >
                    {addLoading ? 'ADDING...' : 'ADD TO CART'}
                  </button>
                </div>
              </div>
              

              {/* Product Details */}
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-3">Product Details</h3>
                <div className="grid grid-cols-1 gap-3">
                  {product.accset && (
                    <div className="flex justify-between">
                      <span className="font-medium text-gray-700">Account Set:</span>
                      <span className="text-gray-600">{product.accset}</span>
                    </div>
                  )}
                  {product.vendor && (
                    <div className="flex justify-between">
                      <span className="font-medium text-gray-700">Vendor:</span>
                      <span className="text-gray-600">{product.vendorName || product.vendor}</span>
                    </div>
                  )}
                  {product.webCategory && product.webCategory !== product.category && (
                    <div className="flex justify-between">
                      <span className="font-medium text-gray-700">Web Category:</span>
                      <span className="text-gray-600">{product.webCategory}</span>
                    </div>
                  )}
                  {product.webSubCategory && (
                    <div className="flex justify-between">
                      <span className="font-medium text-gray-700">Subcategory:</span>
                      <span className="text-gray-600">{product.webSubCategory}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Keywords */}
              {product.keywords.length > 0 && (
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-3">Keywords</h3>
                  <div className="flex flex-wrap gap-2">
                    {product.keywords.map((keyword, index) => (
                      <span
                        key={index}
                        className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-gray-100 text-gray-800"
                      >
                        {keyword}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Add to List and Share */}
              <div className="flex space-x-4 pt-4">
              </div>
            </div>
          </div>
        </div>

        {/* Recommendations */}
        <RecommendationsWidget
          productSku={product.sku}
          categories={[product.category, product.webCategory].filter((cat): cat is string => Boolean(cat))}
          userPreferences={{ sfPreferred: true }}
          limit={8}
          visitorId={getCurrentVisitorId(selectedUserId)}
          userId={selectedUserId || undefined}
        />
      </div>
    </LayoutWrapper>
  );
}


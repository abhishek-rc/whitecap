'use client';

import { useState, useEffect, useCallback } from 'react';
import { useCart } from '@/components/CartContext';
import { useRouter } from 'next/navigation';
import { getOrCreateVisitorId } from '@/lib/visitorId';
import { Product, Stock } from '@/lib/data';
import RecommendationsWidget from '@/components/RecommendationsWidget';
import Image from 'next/image';

const DEMO_USERS = [
  { id: "tahir", name: "Tahir", visitorId: "42111579-af5d-4c39-a2e3-eea9baeeb985" },
  { id: "tahsin", name: "Tahsin", visitorId: "29b74c36-1c2b-4c73-92d9-c89b717fb1cb" },
  { id: "pooja", name: "Pooja", visitorId: "dd8e0ccc-9a95-4662-bdc3-208f708d8f4e" },
  { id: "mahveer", name: "Mahveer", visitorId: "40f2c915-d265-4312-b618-31c969b56cdb" },
];

function getStoredDemoUserId() {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('demoUserId');
}

function getCurrentVisitorId(selectedUserId: string | null): string {
  return selectedUserId 
    ? DEMO_USERS.find(user => user.id === selectedUserId)?.visitorId || getOrCreateVisitorId()
    : getOrCreateVisitorId();
}

interface ProductData {
  product: Product;
  stock: Stock[];
}

interface ProductSuggestion {
  sku: string;
  displayName: string;
}

export default function ProductDetailPage({ params }: { params: Promise<{ sku: string }> }) {
  const { addToCart } = useCart();
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

  const getTotalStock = (stockRecords: Stock[]) => {
    return stockRecords.reduce((total, stock) => total + stock.availableQuantity, 0);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
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
      </div>
    );
  }

  if (error || !productData) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
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
      </div>
    );
  }

  const { product, stock } = productData;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center">
              <button
                onClick={() => router.back()}
                className="mr-4 p-2 text-gray-600 hover:text-gray-900"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <h1 className="text-2xl font-bold text-gray-900">Whitecap</h1>
              <span className="ml-2 text-sm text-gray-500">Product Details</span>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Product Details */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 p-6">
            {/* Product Image */}
            <div className="relative h-96 bg-gray-100 rounded-lg overflow-hidden">
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
                  <svg className="w-24 h-24 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
              )}
              
              {/* Badges */}
              <div className="absolute top-4 left-4 space-y-2">
                {product.isSFPreferred && (
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
                    SF Preferred
                  </span>
                )}
                <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getAvailabilityColor(product.availability)}`}>
                  {product.availability}
                </span>
              </div>
            </div>

            {/* Product Information */}
            <div className="space-y-6">
              <div>
                <div className="text-sm font-mono text-gray-500 mb-2">
                  SKU: {product.sku}
                </div>
                <h1 className="text-3xl font-bold text-gray-900 mb-4">
                  {product.displayName}
                </h1>
                <div className="flex items-center space-x-4 text-sm text-gray-600 mb-4">
                  <span className="font-medium">{product.brand}</span>
                  <span className="text-gray-400">•</span>
                  <span>{product.category}</span>
                  {product.units && (
                    <>
                      <span className="text-gray-400">•</span>
                      <span>Unit: {product.units}</span>
                    </>
                  )}
                </div>
              </div>

              {/* Description */}
              {product.description && (
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Description</h3>
                  <p className="text-gray-700">{product.description}</p>
                </div>
              )}

              {/* Stock Information */}
              {stock.length > 0 && (
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-3">Stock Information</h3>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <div className="grid grid-cols-2 gap-4 mb-4">
                      <div>
                        <span className="text-sm font-medium text-gray-700">Total Available:</span>
                        <span className="ml-2 text-lg font-bold text-green-600">
                          {getTotalStock(stock)} {stock[0]?.costUnit || 'units'}
                        </span>
                      </div>
                      <div>
                        <span className="text-sm font-medium text-gray-700">Warehouses:</span>
                        <span className="ml-2 text-lg font-bold text-blue-600">
                          {stock.length}
                        </span>
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      {stock.slice(0, 3).map((stockItem, index) => (
                        <div key={index} className="flex justify-between items-center text-sm">
                          <span className="font-medium">{stockItem.warehouse}</span>
                          <span className="text-gray-600">
                            {stockItem.availableQuantity} {stockItem.costUnit}
                          </span>
                        </div>
                      ))}
                      {stock.length > 3 && (
                        <div className="text-sm text-gray-500 text-center pt-2">
                          +{stock.length - 3} more warehouses
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

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

              {/* Action Buttons */}
              <div className="flex space-x-4 pt-4">
                <button
    className="flex-1 px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 flex items-center justify-center"
    disabled={addLoading}
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
  >
    {addLoading && (
      <svg className="animate-spin h-5 w-5 mr-2 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"></path>
      </svg>
    )}
    Add to Cart
  </button>
                <button className="px-6 py-3 border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2">
                  Add to Wishlist
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Recommendations */}
        <RecommendationsWidget
          productSku={product.sku}
          categories={[product.category, product.webCategory].filter(Boolean)}
          userPreferences={{ sfPreferred: true }}
          limit={8}
          visitorId={getCurrentVisitorId(selectedUserId)}
          userId={selectedUserId || undefined}
        />
      </div>
    </div>
  );
}


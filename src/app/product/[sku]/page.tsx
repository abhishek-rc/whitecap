'use client';

import { useState, useEffect, useCallback } from 'react';
import { useCart } from '@/components/CartContext';
import { useRouter } from 'next/navigation';
import { getOrCreateVisitorId } from '@/lib/visitorId';
import { Product as ProductType, Stock as StockType } from '@/lib/data';
import RecommendationsWidget from '@/components/RecommendationsWidget';
import Image from 'next/image';
import Link from 'next/link';

const DEMO_USERS = [
  { id: "tahir", name: "Tahir", visitorId: "42111579-af5d-4c39-a2e3-eea9baeeb985" },
  { id: "tahsin", name: "Tahsin", visitorId: "29b74c36-1c2b-4c73-92d9-c89b717fb1cb" },
  { id: "pooja", name: "Pooja", visitorId: "dd8e0ccc-9a95-4662-bdc3-208f708d8f4e" },
  { id: "mahveer", name: "Mahveer", visitorId: "40f2c915-d265-4312-b618-31c969b56cdb" },
];

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
      <header className="bg-gray-900 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Desktop Header */}
          <div className="hidden md:flex justify-between items-center h-16">
            <div className="flex items-center">
              <Link href="/" className="flex items-center">
                <img src="https://d2ou5j4j4yi9kl.cloudfront.net/userfiles/header/whitecap_header_logo.png" alt="WhiteCap Logo" className="h-10" />
              </Link>
            </div>
            <div className="flex items-center space-x-4 lg:space-x-6">
              <div className="relative">
                <input 
                  type="text" 
                  placeholder="Search by name, brand, product id..." 
                  className="w-48 text-white sm:w-64 lg:w-100 pl-3 pr-12 py-2 border border-gray-600 rounded-md focus:outline-none focus:ring-1 focus:ring-yellow-500 focus:border-yellow-500 text-gray-800"
                  onKeyDown={(e) => e.key === 'Enter' && router.push(`/search?q=${encodeURIComponent((e.target as HTMLInputElement).value)}`)}
                />
                <button 
                  className="absolute inset-y-0 right-0 px-3 bg-yellow-500 rounded-r-md flex items-center justify-center hover:bg-yellow-600 transition-colors"
                  onClick={(e) => {
                    const input = (e.currentTarget.parentNode as HTMLElement).querySelector('input');
                    if (input) {
                      router.push(`/search?q=${encodeURIComponent((input as HTMLInputElement).value)}`);
                    }
                  }}
                >
                  <svg className="h-5 w-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </button>
              </div>
              <a href="#" className="text-white hover:text-gray-300 flex items-center whitespace-nowrap">
                <svg className="h-5 w-5 mr-1 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
                <span>Sign In</span>
              </a>
              <div className="flex items-center text-white hover:text-gray-300 whitespace-nowrap">
                <svg className="h-5 w-5 mr-1 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                <div className="flex flex-col">
                  <span className="text-xs text-white">Selected Branch</span>
                  <div className="flex items-center">
                    <span className="text-white text-sm font-medium">Birmingham - </span>
                    <select
                      value={selectedUserId || ''}
                      onChange={(e) => setSelectedUserId(e.target.value || null)}
                      className="appearance-none bg-transparent text-sm font-medium focus:outline-none text-white"
                    >
                      <option value="" className="text-gray-900">Guest</option>
                      {DEMO_USERS.map((user) => (
                        <option key={user.id} value={user.id} className="text-gray-900">
                          {user.name}
                        </option>
                      ))}
                    </select>
                    <svg className="h-4 w-4 text-white ml-1 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                </div>
              </div>
              <div 
                onClick={() => router.push('/cart')} 
                className="flex items-center text-white hover:text-gray-300 cursor-pointer whitespace-nowrap"
              >
                <div className="relative">
                  <svg className="h-6 w-6 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                  <span className="absolute -top-2 -right-2 bg-yellow-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                    {cart.reduce((total: number, item: {quantity: number}) => total + item.quantity, 0)}
                  </span>
                </div>
                <span className="ml-1 font-medium">CART</span>
              </div>
            </div>
          </div>
          
          {/* Mobile Header */}
          <div className="md:hidden">
            <div className="flex justify-between items-center h-14">
              <div className="flex items-center">
                <Link href="/" className="flex items-center">
                  <img src="https://d2ou5j4j4yi9kl.cloudfront.net/userfiles/header/whitecap_header_logo.png" alt="WhiteCap Logo" className="h-8" />
                </Link>
              </div>
              
              <div className="flex items-center space-x-3">
                {/* Cart Icon - Always visible on mobile */}
                <div 
                  onClick={() => router.push('/cart')} 
                  className="flex items-center text-white hover:text-gray-300 cursor-pointer"
                >
                  <div className="relative">
                    <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                    <span className="absolute -top-2 -right-2 bg-yellow-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                      {cart.reduce((total: number, item: {quantity: number}) => total + item.quantity, 0)}
                    </span>
                  </div>
                </div>
                
                {/* Mobile Menu Button */}
                <button 
                  onClick={() => {
                    const mobileMenu = document.getElementById('mobile-menu');
                    if (mobileMenu) {
                      mobileMenu.classList.toggle('hidden');
                    }
                  }}
                  className="text-white p-2"
                >
                  <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                  </svg>
                </button>
              </div>
            </div>
            
            {/* Mobile Menu - Hidden by default */}
            <div id="mobile-menu" className="hidden pt-4 pb-2">
              {/* Mobile Search */}
              <div className="relative mb-4">
                <input 
                  type="text" 
                  placeholder="Search products..." 
                  className="w-full pl-3 pr-12 py-2 border border-gray-600 rounded-md focus:outline-none focus:ring-1 focus:ring-yellow-500 focus:border-yellow-500 text-gray-800"
                  onKeyDown={(e) => e.key === 'Enter' && router.push(`/search?q=${encodeURIComponent((e.target as HTMLInputElement).value)}`)}
                />
                <button 
                  className="absolute inset-y-0 right-0 px-3 bg-yellow-500 rounded-r-md flex items-center justify-center hover:bg-yellow-600 transition-colors"
                  onClick={(e) => {
                    const input = (e.currentTarget.parentNode as HTMLElement).querySelector('input');
                    if (input) {
                      router.push(`/search?q=${encodeURIComponent((input as HTMLInputElement).value)}`);
                    }
                  }}
                >
                  <svg className="h-5 w-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </button>
              </div>
              
              {/* Mobile Menu Items */}
              <div className="space-y-3">
                <a href="#" className="flex items-center text-white hover:text-gray-300 py-2">
                  <svg className="h-5 w-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                  <span>Sign In</span>
                </a>
                
                <div className="py-2">
                  <div className="flex items-center text-white mb-1">
                    <svg className="h-5 w-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    <span className="text-sm">Selected Branch</span>
                  </div>
                  <div className="pl-8">
                    <select
                      value={selectedUserId || ''}
                      onChange={(e) => setSelectedUserId(e.target.value || null)}
                      className="w-full appearance-none bg-gray-800 text-white py-1 px-2 rounded text-sm focus:outline-none focus:ring-1 focus:ring-yellow-500"
                    >
                      <option value="" className="text-gray-900">Guest</option>
                      {DEMO_USERS.map((user) => (
                        <option key={user.id} value={user.id} className="text-gray-900">
                          {user.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>
      
      {/* Navigation */}
      <nav className="bg-gray-100 border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-10">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => router.back()}
                className="text-gray-600 hover:text-gray-900 flex items-center"
              >
                <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                <span className="text-sm">Back</span>
              </button>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
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
      <footer className="bg-black text-white py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Logo and Contact */}
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8">
            <div className="mb-6 md:mb-0">
              <img src="https://d2ou5j4j4yi9kl.cloudfront.net/userfiles/header/whitecap_header_logo.png" alt="WHITE CAP" className="h-8 mb-4" />
              <div className="flex space-x-2 mb-4">
                <a href="#" className="text-white hover:text-yellow-500">
                  <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.878v-6.987h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.988C18.343 21.128 22 16.991 22 12z" />
                  </svg>
                </a>
                <a href="#" className="text-white hover:text-yellow-500">
                  <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 2c2.717 0 3.056.01 4.122.06 1.065.05 1.79.217 2.428.465.66.254 1.216.598 1.772 1.153.509.5.902 1.105 1.153 1.772.247.637.415 1.363.465 2.428.047 1.066.06 1.405.06 4.122 0 2.717-.01 3.056-.06 4.122-.05 1.065-.218 1.79-.465 2.428a4.883 4.883 0 01-1.153 1.772c-.5.509-1.105.902-1.772 1.153-.637.247-1.363.415-2.428.465-1.066.047-1.405.06-4.122.06-2.717 0-3.056-.01-4.122-.06-1.065-.05-1.79-.218-2.428-.465a4.89 4.89 0 01-1.772-1.153 4.904 4.904 0 01-1.153-1.772c-.247-.637-.415-1.363-.465-2.428C2.013 15.056 2 14.717 2 12c0-2.717.01-3.056.06-4.122.05-1.066.217-1.79.465-2.428a4.88 4.88 0 011.153-1.772A4.897 4.897 0 015.45 2.525c.638-.248 1.362-.415 2.428-.465C8.944 2.013 9.283 2 12 2zm0 1.802c-2.67 0-2.986.01-4.04.059-.976.045-1.505.207-1.858.344-.466.182-.8.398-1.15.748-.35.35-.566.683-.748 1.15-.137.353-.3.882-.344 1.857-.047 1.055-.059 1.37-.059 4.04 0 2.668.012 2.985.059 4.04.044.975.207 1.504.344 1.856.182.466.399.8.748 1.15.35.35.684.566 1.15.748.353.137.882.3 1.857.344 1.054.046 1.37.058 4.04.058 2.67 0 2.986-.012 4.04-.058.976-.045 1.505-.207 1.858-.344.466-.182.8-.398 1.15-.748.35-.35.566-.683.748-1.15.137-.352.3-.88.344-1.856.047-1.054.059-1.37.059-4.04 0-2.67-.012-2.986-.059-4.04-.044-.976-.207-1.505-.344-1.858a3.097 3.097 0 00-.748-1.15 3.098 3.098 0 00-1.15-.748c-.353-.137-.882-.3-1.857-.344-1.054-.048-1.37-.06-4.04-.06zm0 3.063a5.135 5.135 0 110 10.27 5.135 5.135 0 010-10.27zm0 8.468a3.333 3.333 0 100-6.666 3.333 3.333 0 000 6.666zm6.538-8.469a1.2 1.2 0 110-2.4 1.2 1.2 0 010 2.4z" />
                  </svg>
                </a>
                <a href="#" className="text-white hover:text-yellow-500">
                  <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M19.633 7.997c.013.175.013.349.013.523 0 5.325-4.053 11.461-11.46 11.461-2.282 0-4.402-.661-6.186-1.809.324.037.636.05.973.05a8.07 8.07 0 0 0 5.001-1.721 4.036 4.036 0 0 1-3.767-2.793c.249.037.499.062.761.062.361 0 .724-.05 1.061-.137a4.027 4.027 0 0 1-3.23-3.953v-.05c.537.299 1.16.486 1.82.511a4.022 4.022 0 0 1-1.796-3.354c0-.748.199-1.434.548-2.032a11.457 11.457 0 0 0 8.306 4.215c-.062-.3-.1-.611-.1-.923a4.026 4.026 0 0 1 4.028-4.028c1.16 0 2.207.486 2.943 1.272a7.957 7.957 0 0 0 2.556-.973 4.02 4.02 0 0 1-1.771 2.22 8.073 8.073 0 0 0 2.319-.624 8.645 8.645 0 0 1-2.019 2.083z" />
                  </svg>
                </a>
                <a href="#" className="text-white hover:text-yellow-500">
                  <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 0 1-2.063-2.065 2.064 2.064 0 1 1 2.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
                  </svg>
                </a>
              </div>
              <div className="text-yellow-500 text-xl font-bold">
                1-800-944-8322
              </div>
              <div className="text-xs mt-2">
                <span className="flex items-center">
                  <svg className="h-4 w-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 8h2a2 2 0 012 2v6a2 2 0 01-2 2h-2v4l-4-4H9a1.994 1.994 0 01-1.414-.586m0 0L11 14h4a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2v4l.586-.586z" />
                  </svg>
                  Canadian Customers
                </span>
                <div className="mt-1">Visit WhiteCapSupply.com</div>
              </div>
            </div>
          </div>
          
          {/* Main Footer Content */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
            {/* OUR COMPANY */}
            <div>
              <h3 className="text-sm font-bold mb-4">OUR COMPANY</h3>
              <ul className="space-y-2">
                <li><a href="#" className="text-gray-300 hover:text-white text-sm">About White Cap</a></li>
                <li><a href="#" className="text-gray-300 hover:text-white text-sm">Careers</a></li>
                <li><a href="#" className="text-gray-300 hover:text-white text-sm">Investors</a></li>
                <li><a href="#" className="text-gray-300 hover:text-white text-sm">Suppliers</a></li>
                <li><a href="#" className="text-gray-300 hover:text-white text-sm">Contractor Field Notes</a></li>
                <li><a href="#" className="text-gray-300 hover:text-white text-sm">Blog</a></li>
                <li><a href="#" className="text-gray-300 hover:text-white text-sm">Former Associates</a></li>
                <li><a href="#" className="text-gray-300 hover:text-white text-sm">Contact Us</a></li>
              </ul>
            </div>
            
            {/* HELP CENTER */}
            <div>
              <h3 className="text-sm font-bold mb-4">HELP CENTER</h3>
              <ul className="space-y-2">
                <li><a href="#" className="text-gray-300 hover:text-white text-sm">Customer Assistance Form</a></li>
                <li><a href="#" className="text-gray-300 hover:text-white text-sm">Invoices and Payments</a></li>
                <li><a href="#" className="text-gray-300 hover:text-white text-sm">Branch Locations</a></li>
                <li><a href="#" className="text-gray-300 hover:text-white text-sm">Request a Quote</a></li>
                <li><a href="#" className="text-gray-300 hover:text-white text-sm">Order Status Notifications</a></li>
                <li><a href="#" className="text-gray-300 hover:text-white text-sm">Create Business Account</a></li>
                <li><a href="#" className="text-gray-300 hover:text-white text-sm">Contact a Specialist</a></li>
                <li><a href="#" className="text-gray-300 hover:text-white text-sm">Return Policy</a></li>
                <li><a href="#" className="text-gray-300 hover:text-white text-sm">DOT Guidelines</a></li>
                <li><a href="#" className="text-gray-300 hover:text-white text-sm">SDS Publications</a></li>
              </ul>
            </div>
            
            {/* SERVICES */}
            <div>
              <h3 className="text-sm font-bold mb-4">SERVICES</h3>
              <ul className="space-y-2">
                <li><a href="#" className="text-gray-300 hover:text-white text-sm">Contractor Services</a></li>
                <li><a href="#" className="text-gray-300 hover:text-white text-sm">Apply for Credit</a></li>
              </ul>
              
              <h3 className="text-sm font-bold mt-6 mb-4">GOVERNMENT RESOURCES</h3>
              <ul className="space-y-2">
                <li><a href="#" className="text-gray-300 hover:text-white text-sm">Federal</a></li>
                <li><a href="#" className="text-gray-300 hover:text-white text-sm">State & Local</a></li>
              </ul>
            </div>
            
            {/* CATALOGS */}
            <div>
              <h3 className="text-sm font-bold mb-4">CATALOGS</h3>
              <ul className="space-y-2">
                <li><a href="#" className="text-gray-300 hover:text-white text-sm">Request a Catalog</a></li>
                <li><a href="#" className="text-gray-300 hover:text-white text-sm">E-Catalogs</a></li>
                <li><a href="#" className="text-gray-300 hover:text-white text-sm">Contractor Trader® Promotions</a></li>
              </ul>
              
              <h3 className="text-sm font-bold mt-6 mb-4">HABLAMOS TU IDIOMA</h3>
              <ul className="space-y-2">
                <li><a href="#" className="text-gray-300 hover:text-white text-sm">Financiación GreatAmerica</a></li>
              </ul>
            </div>
          </div>
          
          {/* Copyright */}
          <div className="border-t border-gray-800 pt-6">
            <p className="text-gray-400 text-xs text-center mb-2">© Copyright 2025 White Cap Supply Holdings, LLC. All Rights Reserved.</p>
            <p className="text-gray-400 text-xs text-center">
              Use of this site is subject to the White Cap Supply Holdings, LLC. Legal 
              <a href="#" className="text-yellow-500 hover:underline">Terms</a>, 
              <a href="#" className="text-yellow-500 hover:underline">Terms of Sale</a>, 
              <a href="#" className="text-yellow-500 hover:underline">Rental Agreement Terms and Conditions</a>, 
              <a href="#" className="text-yellow-500 hover:underline">Privacy</a>, and 
              <a href="#" className="text-yellow-500 hover:underline">Accessibility Statement</a>.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}


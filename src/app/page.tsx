'use client';

import { useState, useEffect, useCallback } from 'react';
import { getOrCreateVisitorId } from '@/lib/visitorId';
import { Product } from '@/lib/data';
import ProductCard from '@/components/ProductCard';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useCart } from '@/components/CartContext';

const DEMO_USERS = [
  { id: "tahir", name: "Tahir", visitorId: "42111579-af5d-4c39-a2e3-eea9baeeb985" },
  { id: "tahsin", name: "Tahsin", visitorId: "29b74c36-1c2b-4c73-92d9-c89b717fb1cb" },
  { id: "pooja", name: "Pooja", visitorId: "dd8e0ccc-9a95-4662-bdc3-208f708d8f4e" },
  { id: "mahveer", name: "Mahveer", visitorId: "40f2c915-d265-4312-b618-31c969b56cdb" },
];

interface RecommendationSection {
  products: Product[];
  score: number;
  reason: string;
  count: number;
}

interface RecommendationsData {
  trending?: RecommendationSection;
  'on-sale'?: RecommendationSection;
  'similar-items'?: RecommendationSection;
  'recommended-for-you'?: RecommendationSection;
}

function getStoredDemoUserId() {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('demoUserId');
}

function setStoredDemoUserId(id: string | null) {
  if (typeof window === 'undefined') return;
  if (id) localStorage.setItem('demoUserId', id);
  else localStorage.removeItem('demoUserId');
}

function getCurrentVisitorId(selectedUserId: string | null): string {
  return selectedUserId
    ? DEMO_USERS.find(user => user.id === selectedUserId)?.visitorId || getOrCreateVisitorId()
    : getOrCreateVisitorId();
}

export default function Home() {
  const router = useRouter();
  const { cart } = useCart();
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [recommendations, setRecommendations] = useState<RecommendationsData | null>(null);
  const [loading, setLoading] = useState(true);

  // On mount, load selected user from localStorage
  useEffect(() => {
    const stored = getStoredDemoUserId();
    if (stored) setSelectedUserId(stored);
  }, []);

  useEffect(() => {
    setStoredDemoUserId(selectedUserId);
  }, [selectedUserId]);

  const fetchRecommendations = useCallback(async () => {
    setLoading(true);
    try {
      const visitorId = getCurrentVisitorId(selectedUserId);
      const params = new URLSearchParams({
        models: 'trending,on-sale,similar-items,recommended-for-you',
        limit: '8',
        visitorId: visitorId,
      });

      if (selectedUserId) {
        params.append('userId', selectedUserId);
      }

      const response = await fetch(`/api/recommendations/bulk?${params.toString()}`);
      const data = await response.json();

      if (data.success) {
        setRecommendations(data.data.recommendations);
      } else {
        console.error('Failed to fetch recommendations:', data.error);
      }
    } catch (error) {
      console.error('Error fetching recommendations:', error);
    } finally {
      setLoading(false);
    }
  }, [selectedUserId]);

  useEffect(() => {
    fetchRecommendations();
  }, [fetchRecommendations]);

  const handleSearchQuery = (query: string) => {
    const params = new URLSearchParams({ q: query });
    if (selectedUserId) {
      params.append('userId', selectedUserId);
    }
    router.push(`/search?${params.toString()}`);
  };

  const handleCategorySearch = (category: string) => {
    const params = new URLSearchParams({ category });
    if (selectedUserId) {
      params.append('userId', selectedUserId);
    }
    router.push(`/search?${params.toString()}`);
  };

  const handleUserChange = (userId: string) => {
    setSelectedUserId(userId || null);
  };

  const RecommendationSection = ({
    title,
    products,
    viewAllAction
  }: {
    title: string;
    products: Product[];
    viewAllAction: () => void;
  }) => (
    <section className="mb-16">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">{title}</h2>
          <p className="text-gray-600 mt-1">Discover quality products for your establishment</p>
        </div>
        <button
          onClick={viewAllAction}
          className="px-6 py-2 border border-gray-300 text-gray-700 font-medium rounded hover:bg-gray-50 hover:border-gray-400 transition-all duration-200"
        >
          View All
        </button>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 gap-6">
        {products && products.slice(0, 8).map((product) => (
          <ProductCard
            key={product.id}
            product={product}
            userId={selectedUserId}
            visitorId={getCurrentVisitorId(selectedUserId)}
          />
        ))}
      </div>
    </section>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-black border-b border-gray-800 text-white py-4">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Desktop Header */}
          <div className="hidden md:flex justify-between items-center">
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
                  className="w-48 text-white sm:w-64 lg:w-80 pl-3 pr-12 py-2 border border-gray-600 rounded-md focus:outline-none focus:ring-1 focus:ring-yellow-500 focus:border-yellow-500 text-gray-800"
                  onKeyDown={(e) => e.key === 'Enter' && handleSearchQuery((e.target as HTMLInputElement).value)}
                />
                <button
                  className="absolute inset-y-0 right-0 px-3 bg-yellow-500 rounded-r-md flex items-center justify-center hover:bg-yellow-600 transition-colors"
                  onClick={() => {
                    const input = document.querySelector('.hidden.md\\:flex input[type="text"]') as HTMLInputElement;
                    handleSearchQuery(input?.value || '');
                  }}
                >
                  <svg className="h-5 w-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </button>

              </div>
              <button
                onClick={() => router.push('/ai-support')}
                className="ml-2 px-4 py-2 bg-yellow-500 text-white rounded-md hover:bg-yellow-600 transition-colors flex items-center space-x-2"
                title="AI Shopping Assistant"
              >
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                </svg>
                <span className="hidden sm:inline">AI Mode</span>
              </button>
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
                      onChange={(e) => handleUserChange(e.target.value)}
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
                    {cart.reduce((total, item) => total + item.quantity, 0)}
                  </span>
                </div>
                <span className="ml-1 font-medium">CART</span>
              </div>
            </div>
          </div>

          {/* Mobile Header */}
          <div className="md:hidden">
            <div className="flex justify-between items-center">
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
                      {cart.reduce((total, item) => total + item.quantity, 0)}
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
                  onKeyDown={(e) => e.key === 'Enter' && handleSearchQuery((e.target as HTMLInputElement).value)}
                />
                <button
                  className="absolute inset-y-0 right-0 px-3 bg-yellow-500 rounded-r-md flex items-center justify-center hover:bg-yellow-600 transition-colors"
                  onClick={() => {
                    const input = document.querySelector('#mobile-menu input[type="text"]') as HTMLInputElement;
                    handleSearchQuery(input?.value || '');
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
                      onChange={(e) => handleUserChange(e.target.value)}
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
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <button className="px-4 py-3 flex items-center hover:bg-gray-200 transition-colors uppercase text-sm font-medium">
                <svg className="h-5 w-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
                CATEGORIES
              </button>
              {/* <a href="#" className="px-4 py-3 hover:bg-gray-200 transition-colors uppercase text-sm font-medium">
                BRANDS
              </a>
              <a href="#" className="px-4 py-3 hover:bg-gray-200 transition-colors uppercase text-sm font-medium">
                LOCATIONS
              </a>
              <a href="#" className="px-4 py-3 hover:bg-gray-200 transition-colors uppercase text-sm font-medium">
                SERVICES
              </a>
              <a href="#" className="px-4 py-3 hover:bg-gray-200 transition-colors uppercase text-sm font-medium">
                REQUEST A QUOTE
              </a> */}
            </div>
            {/* <div className="flex items-center">
              <a href="#" className="px-4 py-3 hover:bg-gray-200 transition-colors uppercase text-sm font-medium">
                TOP DEALS
              </a>
              <a href="tel:+1-800-944-8322" className="px-4 py-3 hover:bg-gray-200 transition-colors uppercase text-sm font-medium">
                1-800-944-8322
              </a>
            </div> */}
          </div>
        </div>
      </nav>

      {/* Main Promotional Banner */}
      <section className="relative bg-yellow-500 overflow-hidden">
        <div className="max-w-7xl mx-auto">
          <div className="relative h-64 md:h-80 flex items-center">
            <div className="absolute inset-0 z-0">
              <img
                src="https://images.unsplash.com/photo-1504674900247-0877df9cc836?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1470&q=80"
                alt="Food Service Banner"
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-r from-yellow-500 via-yellow-500/80 to-transparent"></div>
            </div>
            <div className="relative z-10 px-4 sm:px-6 lg:px-8 max-w-2xl">
              <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">Premium Food Products</h2>
              <p className="text-xl text-gray-800 mb-6">Quality ingredients for professional kitchens</p>
              <a
                href="#"
                onClick={(e) => {
                  e.preventDefault();
                  handleSearchQuery('');
                }}
                className="inline-block bg-yellow-600 hover:bg-yellow-700 text-white font-medium px-8 py-3 rounded-md transition-colors duration-200"
              >
                SHOP NOW
                <svg className="inline-block ml-2 w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                </svg>
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Product Categories */}
      {/* <section className="bg-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between mb-10">
            <div>
              <div className="flex items-center mb-2">
                <div className="h-1 w-8 bg-blue-600 mr-3"></div>
                <span className="text-sm font-medium text-blue-600 uppercase tracking-wide">Browse By Category</span>
              </div>
              <h2 className="text-2xl lg:text-3xl font-bold text-gray-900">Our Product Categories</h2>
            </div>
            <div className="hidden md:block">
              <button
                onClick={() => handleSearchQuery('')}
                className="px-5 py-2 border border-gray-300 text-gray-700 font-medium rounded hover:bg-gray-50 hover:border-gray-400 transition-all duration-200 flex items-center"
              >
                View All Categories
                <svg className="ml-2 w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                </svg>
              </button>
            </div>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {[
              { 
                name: 'Produce', 
                description: 'Fresh vegetables & fruits',
                image: '/images/categories/produce.jpg',
                icon: (
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                  </svg>
                )
              },
              { 
                name: 'Butchery', 
                description: 'Premium cuts & meats',
                image: '/images/categories/butchery.jpg',
                icon: (
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4" />
                  </svg>
                )
              },
              { 
                name: 'Seafood', 
                description: 'Fresh fish & seafood',
                image: '/images/categories/seafood.jpg',
                icon: (
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                )
              },
              { 
                name: 'Essentials', 
                description: 'Pantry & ingredients',
                image: '/images/categories/essentials.jpg',
                icon: (
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                  </svg>
                )
              },
            ].map((category) => (
              <button
                key={category.name}
                onClick={() => handleCategorySearch(category.name)}
                className="bg-white rounded-lg border border-gray-200 overflow-hidden hover:shadow-lg hover:border-blue-200 transition-all duration-200 flex flex-col group"
              >
                <div className="bg-gray-50 p-6 flex items-center justify-center">
                  <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition-colors duration-200">
                    {category.icon}
                  </div>
                </div>
                <div className="p-4 text-center">
                  <h3 className="text-lg font-semibold text-gray-900 mb-1 group-hover:text-blue-600 transition-colors">{category.name}</h3>
                  <p className="text-sm text-gray-600">{category.description}</p>
                </div>
              </button>
            ))}
          </div>
          
          <div className="mt-10 md:hidden">
            <button
              onClick={() => handleSearchQuery('')}
              className="w-full px-5 py-2 border border-gray-300 text-gray-700 font-medium rounded hover:bg-gray-50 hover:border-gray-400 transition-all duration-200 flex items-center justify-center"
            >
              View All Categories
              <svg className="ml-2 w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
              </svg>
            </button>
          </div>
        </div>
      </section> */}

      {/* Recommendations Sections */}
      <div className="bg-gray-50 py-16 border-t border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <span className="ml-4 text-lg text-gray-700">Loading recommendations...</span>
            </div>
          ) : (
            <>
              {/* Trending Products */}
              {recommendations?.trending?.products && (
                <div className="mb-16">
                  <div className="flex items-center justify-between mb-8">
                    <div>
                      <div className="flex items-center mb-2">
                        <div className="h-1 w-8 bg-blue-600 mr-3"></div>
                        <span className="text-sm font-medium text-blue-600 uppercase tracking-wide">Top Picks</span>
                      </div>
                      <h2 className="text-2xl font-bold text-gray-900">Popular Products</h2>
                    </div>
                    <button
                      onClick={() => handleSearchQuery('trending')}
                      className="px-5 py-2 border border-gray-300 text-gray-700 font-medium rounded hover:bg-gray-50 hover:border-gray-400 transition-all duration-200 flex items-center"
                    >
                      View All
                      <svg className="ml-2 w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                      </svg>
                    </button>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                    {recommendations.trending.products.slice(0, 8).map((product) => (
                      <ProductCard
                        key={product.id}
                        product={product}
                        userId={selectedUserId}
                        visitorId={getCurrentVisitorId(selectedUserId)}
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* On Sale Products */}
              {recommendations?.['on-sale']?.products && (
                <div className="mb-16">
                  <div className="flex items-center justify-between mb-8">
                    <div>
                      <div className="flex items-center mb-2">
                        <div className="h-1 w-8 bg-red-600 mr-3"></div>
                        <span className="text-sm font-medium text-red-600 uppercase tracking-wide">Limited Time</span>
                      </div>
                      <h2 className="text-2xl font-bold text-gray-900">Special Offers</h2>
                    </div>
                    <button
                      onClick={() => handleSearchQuery('on sale')}
                      className="px-5 py-2 border border-gray-300 text-gray-700 font-medium rounded hover:bg-gray-50 hover:border-gray-400 transition-all duration-200 flex items-center"
                    >
                      View All
                      <svg className="ml-2 w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                      </svg>
                    </button>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                    {recommendations['on-sale'].products.slice(0, 8).map((product) => (
                      <ProductCard
                        key={product.id}
                        product={product}
                        userId={selectedUserId}
                        visitorId={getCurrentVisitorId(selectedUserId)}
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* You May Also Like */}
              {recommendations?.['similar-items']?.products && (
                <div className="mb-16">
                  <div className="flex items-center justify-between mb-8">
                    <div>
                      <div className="flex items-center mb-2">
                        <div className="h-1 w-8 bg-green-600 mr-3"></div>
                        <span className="text-sm font-medium text-green-600 uppercase tracking-wide">Recommendations</span>
                      </div>
                      <h2 className="text-2xl font-bold text-gray-900">You May Also Like</h2>
                    </div>
                    <button
                      onClick={() => handleSearchQuery('recommended')}
                      className="px-5 py-2 border border-gray-300 text-gray-700 font-medium rounded hover:bg-gray-50 hover:border-gray-400 transition-all duration-200 flex items-center"
                    >
                      View All
                      <svg className="ml-2 w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                      </svg>
                    </button>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                    {recommendations['similar-items'].products.slice(0, 8).map((product) => (
                      <ProductCard
                        key={product.id}
                        product={product}
                        userId={selectedUserId}
                        visitorId={getCurrentVisitorId(selectedUserId)}
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* Recommended For You */}
              {recommendations?.['recommended-for-you']?.products && (
                <div className="mb-16">
                  <div className="flex items-center justify-between mb-8">
                    <div>
                      <div className="flex items-center mb-2">
                        <div className="h-1 w-8 bg-purple-600 mr-3"></div>
                        <span className="text-sm font-medium text-purple-600 uppercase tracking-wide">Personalized</span>
                      </div>
                      <h2 className="text-2xl font-bold text-gray-900">Recommended For You</h2>
                    </div>
                    <button
                      onClick={() => handleSearchQuery('personalized')}
                      className="px-5 py-2 border border-gray-300 text-gray-700 font-medium rounded hover:bg-gray-50 hover:border-gray-400 transition-all duration-200 flex items-center"
                    >
                      View All
                      <svg className="ml-2 w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                      </svg>
                    </button>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                    {recommendations['recommended-for-you'].products.slice(0, 8).map((product) => (
                      <ProductCard
                        key={product.id}
                        product={product}
                        userId={selectedUserId}
                        visitorId={getCurrentVisitorId(selectedUserId)}
                      />
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Features Section */}
      {/* <section className="bg-white py-16 border-t border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-center mb-12">
            <div className="text-center max-w-3xl">
              <div className="flex items-center justify-center mb-2">
                <div className="h-1 w-8 bg-blue-600 mr-3"></div>
                <span className="text-sm font-medium text-blue-600 uppercase tracking-wide">Why Choose Us</span>
                <div className="h-1 w-8 bg-blue-600 ml-3"></div>
              </div>
              <h2 className="text-3xl font-bold text-gray-900 mb-4">Service Foods Advantages</h2>
              <p className="text-gray-600">
                We provide premium food products with exceptional service to help your business succeed
              </p>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-gray-50 p-8 rounded-lg border border-gray-200 hover:shadow-md transition-shadow duration-200">
              <div className="w-14 h-14 bg-blue-100 rounded-lg flex items-center justify-center mb-6">
                <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">Quality Guaranteed</h3>
              <p className="text-gray-600 mb-4">
                Premium sourcing, rigorous quality controls, and reliable delivery to support your culinary excellence.
              </p>
              <a href="#" className="text-blue-600 font-medium hover:text-blue-800 inline-flex items-center">
                Learn More
                <svg className="ml-2 w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                </svg>
              </a>
            </div>
            
            <div className="bg-gray-50 p-8 rounded-lg border border-gray-200 hover:shadow-md transition-shadow duration-200">
              <div className="w-14 h-14 bg-blue-100 rounded-lg flex items-center justify-center mb-6">
                <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">Fast Delivery</h3>
              <p className="text-gray-600 mb-4">
                Reliable and timely delivery to ensure your kitchen operations run smoothly without interruption.
              </p>
              <a href="#" className="text-blue-600 font-medium hover:text-blue-800 inline-flex items-center">
                Learn More
                <svg className="ml-2 w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                </svg>
              </a>
            </div>
            
            <div className="bg-gray-50 p-8 rounded-lg border border-gray-200 hover:shadow-md transition-shadow duration-200">
              <div className="w-14 h-14 bg-blue-100 rounded-lg flex items-center justify-center mb-6">
                <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">Easy Ordering</h3>
              <p className="text-gray-600 mb-4">
                Our AI-powered platform makes finding and ordering the products you need simple and efficient.
              </p>
              <a href="#" className="text-blue-600 font-medium hover:text-blue-800 inline-flex items-center">
                Learn More
                <svg className="ml-2 w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                </svg>
              </a>
            </div>
          </div>
        </div>
      </section> */}

      {/* Footer CTA */}
      {/* <section className="bg-blue-700 text-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl font-bold mb-4">Partner with Service Foods</h2>
              <p className="text-lg text-blue-100 mb-6 leading-relaxed">
                Join New Zealand&apos;s leading chefs and restaurateurs who trust Service Foods for their premium ingredients and exceptional service.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <button
                  onClick={() => handleSearchQuery('')}
                  className="px-8 py-3 bg-white text-blue-700 font-medium rounded hover:bg-blue-50 transition-colors duration-200"
                >
                  Browse Catalogue
                </button>
                <button
                  onClick={() => handleCategorySearch('Produce')}
                  className="px-8 py-3 border border-blue-300 text-white font-medium rounded hover:bg-blue-600 hover:border-blue-200 transition-colors duration-200"
                >
                  Contact Sales
                </button>
              </div>
            </div>
            <div className="bg-blue-600 rounded-lg p-8 border border-blue-500">
              <div className="flex items-center mb-6">
                <div className="flex-shrink-0">
                  <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center">
                    <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                    </svg>
                  </div>
                </div>
                <div className="ml-4">
                  <h3 className="text-xl font-bold mb-1">Need Help?</h3>
                  <p className="text-blue-100">Our team is here to assist you</p>
                </div>
              </div>
              <div className="border-t border-blue-500 pt-6">
                <a href="tel:+1-800-944-8322" className="text-lg font-bold text-white hover:text-blue-100 flex items-center justify-center">
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                  </svg>
                  1-800-944-8322
                </a>
              </div>
            </div>
          </div>
        </div>
      </section> */}

      {/* Footer */}
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
                    <path d="M12 2c2.717 0 3.056.01 4.122.06 1.065.05 1.79.217 2.428.465.66.254 1.216.598 1.772 1.153.509.5 0.902 1.105 1.153 1.772.247.637.415 1.363.465 2.428.047 1.066.06 1.405.06 4.122 0 2.717-.01 3.056-.06 4.122-.05 1.065-.218 1.79-.465 2.428a4.883 4.883 0 01-1.153 1.772c-.5.509-1.105.902-1.772 1.153-.637.247-1.363.415-2.428.465-1.066.047-1.405.06-4.122.06-2.717 0-3.056-.01-4.122-.06-1.065-.05-1.79-.218-2.428-.465a4.89 4.89 0 01-1.772-1.153 4.904 4.904 0 01-1.153-1.772c-.247-.637-.415-1.363-.465-2.428C2.013 15.056 2 14.717 2 12c0-2.717.01-3.056.06-4.122.05-1.066.217-1.79.465-2.428a4.88 4.88 0 011.153-1.772A4.897 4.897 0 015.45 2.525c.638-.248 1.362-.415 2.428-.465C8.944 2.013 9.283 2 12 2zm0 1.802c-2.67 0-2.986.01-4.04.059-.976.045-1.505.207-1.858.344-.466.182-.8.398-1.15.748-.35.35-.566.683-.748 1.15-.137.353-.3.882-.344 1.857-.047 1.055-.059 1.37-.059 4.04 0 2.668.012 2.985.059 4.04.044.975.207 1.504.344 1.856.182.466.399.8.748 1.15.35.35.684.566 1.15.748.353.137.882.3 1.857.344 1.054.046 1.37.058 4.04.058 2.67 0 2.986-.012 4.04-.058.976-.045 1.505-.207 1.858-.344.466-.182.8-.398 1.15-.748.35-.35.566-.683.748-1.15.137-.352.3-.88.344-1.856.047-1.054.059-1.37.059-4.04 0-2.67-.012-2.986-.059-4.04-.044-.976-.207-1.505-.344-1.858a3.097 3.097 0 00-.748-1.15 3.098 3.098 0 00-1.15-.748c-.353-.137-.882-.3-1.857-.344-1.054-.048-1.37-.06-4.04-.06zm0 3.063a5.135 5.135 0 110 10.27 5.135 5.135 0 010-10.27zm0 8.468a3.333 3.333 0 100-6.666 3.333 3.333 0 000 6.666zm6.538-8.469a1.2 1.2 0 110-2.4 1.2 1.2 0 010 2.4z" />
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
            <p className="text-gray-400 text-xs text-center mb-2"> 2025 White Cap Supply Holdings, LLC. All Rights Reserved.</p>
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

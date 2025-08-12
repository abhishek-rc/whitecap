'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useCart } from '@/components/CartContext';
import { getOrCreateVisitorId } from '@/lib/visitorId';

interface Suggestion {
  text: string;
  type: 'query' | 'sku' | 'product' | 'brand' | 'category';
  score?: number;
  metadata?: {
    displayName?: string;
    [key: string]: unknown;
  };
}

interface LayoutWrapperProps {
  children: React.ReactNode;
}

export default function LayoutWrapper({ children }: LayoutWrapperProps) {
  const router = useRouter();
  const { cart } = useCart();
  
  // Desktop search state
  const [desktopQuery, setDesktopQuery] = useState('');
  const [desktopSuggestions, setDesktopSuggestions] = useState<Suggestion[]>([]);
  const [showDesktopSuggestions, setShowDesktopSuggestions] = useState(false);
  const [desktopSelectedIndex, setDesktopSelectedIndex] = useState(-1);
  const [desktopLoading, setDesktopLoading] = useState(false);
  const desktopInputRef = useRef<HTMLInputElement>(null);
  const desktopSuggestionsRef = useRef<HTMLDivElement>(null);
  
  // Mobile search state
  const [mobileQuery, setMobileQuery] = useState('');
  const [mobileSuggestions, setMobileSuggestions] = useState<Suggestion[]>([]);
  const [showMobileSuggestions, setShowMobileSuggestions] = useState(false);
  const [mobileSelectedIndex, setMobileSelectedIndex] = useState(-1);
  const [mobileLoading, setMobileLoading] = useState(false);
  const mobileInputRef = useRef<HTMLInputElement>(null);
  const mobileSuggestionsRef = useRef<HTMLDivElement>(null);

  const handleSearchQuery = (query: string) => {
    const params = new URLSearchParams({ q: query });
    router.push(`/search?${params.toString()}`);
  };

  // Debounced autocomplete for desktop
  useEffect(() => {
    if (!desktopQuery.trim() || desktopQuery.length < 2) {
      setDesktopSuggestions([]);
      setShowDesktopSuggestions(false);
      return;
    }

    const timeoutId = setTimeout(() => {
      fetchSuggestions(desktopQuery, 'desktop');
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [desktopQuery]);

  // Debounced autocomplete for mobile
  useEffect(() => {
    if (!mobileQuery.trim() || mobileQuery.length < 2) {
      setMobileSuggestions([]);
      setShowMobileSuggestions(false);
      return;
    }

    const timeoutId = setTimeout(() => {
      fetchSuggestions(mobileQuery, 'mobile');
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [mobileQuery]);

  const fetchSuggestions = async (searchQuery: string, type: 'desktop' | 'mobile') => {
    if (!searchQuery.trim()) {
      if (type === 'desktop') {
        setDesktopSuggestions([]);
        setShowDesktopSuggestions(false);
      } else {
        setMobileSuggestions([]);
        setShowMobileSuggestions(false);
      }
      return;
    }

    if (type === 'desktop') {
      setDesktopLoading(true);
    } else {
      setMobileLoading(true);
    }

    try {
      const visitorId = getOrCreateVisitorId();
      const response = await fetch(`/api/autocomplete?q=${encodeURIComponent(searchQuery)}&limit=8&visitorId=${encodeURIComponent(visitorId)}`);
      const data = await response.json();
      
      if (Array.isArray(data.suggestions)) {
        if (type === 'desktop') {
          setDesktopSuggestions(data.suggestions);
          setShowDesktopSuggestions(true);
          setDesktopSelectedIndex(-1);
        } else {
          setMobileSuggestions(data.suggestions);
          setShowMobileSuggestions(true);
          setMobileSelectedIndex(-1);
        }
      }
    } catch (error) {
      console.error('Autocomplete error:', error);
    } finally {
      if (type === 'desktop') {
        setDesktopLoading(false);
      } else {
        setMobileLoading(false);
      }
    }
  };

  const handleSuggestionClick = (suggestion: Suggestion, type: 'desktop' | 'mobile') => {
    if (type === 'desktop') {
      setDesktopQuery(suggestion.text);
      setShowDesktopSuggestions(false);
      desktopInputRef.current?.focus();
    } else {
      setMobileQuery(suggestion.text);
      setShowMobileSuggestions(false);
      mobileInputRef.current?.focus();
    }
    handleSearchQuery(suggestion.text);
  };

  const handleKeyDown = (e: React.KeyboardEvent, type: 'desktop' | 'mobile') => {
    const suggestions = type === 'desktop' ? desktopSuggestions : mobileSuggestions;
    const selectedIndex = type === 'desktop' ? desktopSelectedIndex : mobileSelectedIndex;
    const showSuggestions = type === 'desktop' ? showDesktopSuggestions : showMobileSuggestions;

    if (e.key === 'Enter') {
      if (showSuggestions && suggestions.length > 0 && selectedIndex >= 0) {
        e.preventDefault();
        handleSuggestionClick(suggestions[selectedIndex], type);
      }
      return;
    }

    if (!showSuggestions || suggestions.length === 0) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        if (type === 'desktop') {
          setDesktopSelectedIndex(prev => prev < suggestions.length - 1 ? prev + 1 : prev);
        } else {
          setMobileSelectedIndex(prev => prev < suggestions.length - 1 ? prev + 1 : prev);
        }
        break;
      case 'ArrowUp':
        e.preventDefault();
        if (type === 'desktop') {
          setDesktopSelectedIndex(prev => prev > 0 ? prev - 1 : -1);
        } else {
          setMobileSelectedIndex(prev => prev > 0 ? prev - 1 : -1);
        }
        break;
      case 'Escape':
        if (type === 'desktop') {
          setShowDesktopSuggestions(false);
          setDesktopSelectedIndex(-1);
        } else {
          setShowMobileSuggestions(false);
          setMobileSelectedIndex(-1);
        }
        break;
    }
  };

  const getSuggestionIcon = (type: string) => {
    switch (type) {
      case 'query':
        return (
          <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        );
      case 'sku':
        return (
          <svg className="w-4 h-4 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 20l4-16m2 16l4-16M6 9h14M4 15h14" />
          </svg>
        );
      case 'product':
        return (
          <svg className="w-4 h-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
          </svg>
        );
      case 'brand':
        return (
          <svg className="w-4 h-4 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
          </svg>
        );
      case 'category':
        return (
          <svg className="w-4 h-4 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
          </svg>
        );
      default:
        return (
          <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        );
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-black border-b border-gray-800 text-white py-8">
        <div className="max-w-7xl mx-auto">
          {/* Desktop Header */}
          <div className="hidden md:flex justify-between items-center">
            <div className="flex items-center">
              <Link href="/" className="flex items-center">
                <img src="https://d2ou5j4j4yi9kl.cloudfront.net/userfiles/header/whitecap_header_logo.png" alt="WhiteCap Logo" className="h-10" />
              </Link>
            </div>
            <div className="flex items-center flex-1 space-x-2 lg:space-x-3">
              <div className="relative flex-1 ml-4">
                <input
                  ref={desktopInputRef}
                  type="text"
                  value={desktopQuery}
                  onChange={(e) => setDesktopQuery(e.target.value)}
                  onKeyDown={(e) => handleKeyDown(e, 'desktop')}
                  onFocus={() => desktopQuery && setShowDesktopSuggestions(true)}
                  onBlur={() => setTimeout(() => setShowDesktopSuggestions(false), 200)}
                  placeholder="Search by name, brand, product id."
                  className="w-full bg-white text-gray-800 pl-3 pr-12 py-2 border border-gray-600 rounded-md focus:outline-none focus:ring-1 focus:ring-yellow-500 focus:border-yellow-500"
                />
                {desktopLoading && (
                  <div className="absolute inset-y-0 right-12 pr-3 flex items-center">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-yellow-600"></div>
                  </div>
                )}
                <button
                  className="absolute inset-y-0 right-0 px-3 bg-yellow-500 rounded-r-md flex items-center justify-center hover:bg-yellow-600 transition-colors"
                  onClick={() => handleSearchQuery(desktopQuery)}
                >
                  <svg className="h-5 w-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </button>
                
                {/* Desktop Suggestions Dropdown */}
                {showDesktopSuggestions && desktopSuggestions.length > 0 && (
                  <div
                    ref={desktopSuggestionsRef}
                    className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-64 overflow-y-auto"
                  >
                    {desktopSuggestions.map((suggestion, index) => (
                      <div
                        key={index}
                        onClick={() => handleSuggestionClick(suggestion, 'desktop')}
                        className={`flex items-center px-4 py-3 cursor-pointer hover:bg-gray-50 ${
                          index === desktopSelectedIndex ? 'bg-blue-50 border-l-2 border-blue-500' : ''
                        }`}
                      >
                        <div className="flex-shrink-0 mr-3">
                          {getSuggestionIcon(suggestion.type)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-medium text-gray-900 truncate">
                            {suggestion.text}
                          </div>
                          <div className="text-xs text-gray-500 capitalize">
                            {suggestion.metadata?.displayName && suggestion.type === 'sku' && (
                              <span> • {suggestion.metadata.displayName}</span>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <button
                onClick={() => router.push('/ai-support')}
                className="px-4 py-2 bg-yellow-500 text-white rounded-md hover:bg-yellow-600 transition-colors flex items-center"
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
                    <span className="text-white text-sm font-medium">Birmingham</span>
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
                  ref={mobileInputRef}
                  type="text"
                  value={mobileQuery}
                  onChange={(e) => setMobileQuery(e.target.value)}
                  onKeyDown={(e) => handleKeyDown(e, 'mobile')}
                  onFocus={() => mobileQuery && setShowMobileSuggestions(true)}
                  onBlur={() => setTimeout(() => setShowMobileSuggestions(false), 200)}
                  placeholder="Search products..."
                  className="w-full pl-3 pr-12 py-2 border border-gray-600 rounded-md focus:outline-none focus:ring-1 focus:ring-yellow-500 focus:border-yellow-500 text-gray-800"
                />
                {mobileLoading && (
                  <div className="absolute inset-y-0 right-12 pr-3 flex items-center">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-yellow-600"></div>
                  </div>
                )}
                <button
                  className="absolute inset-y-0 right-0 px-3 bg-yellow-500 rounded-r-md flex items-center justify-center hover:bg-yellow-600 transition-colors"
                  onClick={() => handleSearchQuery(mobileQuery)}
                >
                  <svg className="h-5 w-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </button>
                
                {/* Mobile Suggestions Dropdown */}
                {showMobileSuggestions && mobileSuggestions.length > 0 && (
                  <div
                    ref={mobileSuggestionsRef}
                    className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-64 overflow-y-auto"
                  >
                    {mobileSuggestions.map((suggestion, index) => (
                      <div
                        key={index}
                        onClick={() => handleSuggestionClick(suggestion, 'mobile')}
                        className={`flex items-center px-4 py-3 cursor-pointer hover:bg-gray-50 ${
                          index === mobileSelectedIndex ? 'bg-blue-50 border-l-2 border-blue-500' : ''
                        }`}
                      >
                        <div className="flex-shrink-0 mr-3">
                          {getSuggestionIcon(suggestion.type)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-medium text-gray-900 truncate">
                            {suggestion.text}
                          </div>
                          <div className="text-xs text-gray-500 capitalize">
                            {suggestion.metadata?.displayName && suggestion.type === 'sku' && (
                              <span> • {suggestion.metadata.displayName}</span>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
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
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Navigation Bar */}
      <nav className="border-b border-gray-800">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-stretch h-[50px]">
            <button className="flex-1 px-4 py-3 flex items-center justify-center hover:bg-gray-300 transition-colors text-xs font-bold text-black bg-gray-300 border-r border-gray-300">
              <svg className="h-4 w-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
              CATEGORIES
            </button>
            <a href="#" className="flex-1 px-4 py-3 text-xs font-bold text-black hover:bg-gray-300 transition-colors flex items-center justify-center border-r border-gray-300">
              BRANDS
            </a>
            <a href="#" className="flex-1 px-4 py-3 text-xs font-bold text-black hover:bg-gray-300 transition-colors flex items-center justify-center border-r border-gray-300">
              LOCATIONS
            </a>
            <a href="#" className="flex-1 px-4 py-3 text-xs font-bold text-black hover:bg-gray-300 transition-colors flex items-center justify-center border-r border-gray-300">
              SERVICES
            </a>
            <a href="#" className="flex-1 px-4 py-3 text-xs font-bold text-black hover:bg-gray-300 transition-colors flex items-center justify-center border-r border-gray-300">
              REQUEST A QUOTE
            </a>
            <a href="#" className="flex-1 px-4 py-3 text-xs font-bold text-black hover:bg-gray-300 transition-colors flex items-center justify-center border-r border-gray-300">
              TOP DEALS
            </a>
            <div className="flex-1 px-4 py-3 flex items-center justify-center">
              <span className="text-xs font-bold text-black">1-800-944-8322</span>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main>
        {children}
      </main>
    </div>
  );
}

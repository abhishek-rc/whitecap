'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { SearchResult, SearchFilters, Product } from '@/lib/data';
import PLPProductCard from '@/components/PLPProductCard';
import { useCart } from '@/components/CartContext';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { getOrCreateVisitorId } from '@/lib/visitorId';
import PLPAIProductCard from '@/components/PLPAIProductCard';

const DEMO_USERS = [
  { id: "tahir", name: "Tahir", visitorId: "160463000" },
  { id: "tahsin", name: "Tahsin", visitorId: "95375000" },
  { id: "pooja", name: "Pooja", visitorId: "10000005743" },
  { id: "mahveer", name: "Mahveer", visitorId: "59092000" },];

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



interface Message {
  id: string;
  content: string;
  role: 'user' | 'assistant';
  timestamp: Date;
}

interface RecommendationsData {
  trending?: RecommendationSection;
  'on-sale'?: RecommendationSection;
  'similar-items'?: RecommendationSection;
  'recommended-for-you'?: RecommendationSection;
}

interface RecommendationSection {
  products: Product[];
  score: number;
  reason: string;
  count: number;
}

export default function AIDrawer() {
  const { cart } = useCart();
  const router = useRouter();
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      content: 'Hello! I can help you find products. What are you looking for today?',
      role: 'assistant',
      timestamp: new Date()
    }
  ]);
  const [inputMessage, setInputMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  // AI drawer search state - uses same API as PLP page but independent
  const [searchResult, setSearchResult] = useState<SearchResult | null>(null);
  const [loading, setLoading] = useState(false);
  // Dynamic text animation state
  const [currentTextIndex, setCurrentTextIndex] = useState(0);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [recommendations, setRecommendations] = useState<RecommendationsData | null>(null);

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

  // Dynamic text messages for empty state
  const dynamicMessages = [
    "Start a conversation to find products",
    "Looking for something specific?",
    "I can help you discover new products",
    "What's on your shopping list today?",
    "Need help finding the right products?"
  ];

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Perform search using the same API as PLP page with filters support
  const performAISearch = async (query: string, filters: SearchFilters = {}) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        q: query,
        offset: '0',
        limit: '20',
        sortBy: 'relevance',
      });

      // Add filters to params (same logic as search page)
      if (filters.category?.length) {
        filters.category.forEach(cat => params.append('category', cat));
      }
      if (filters.brand?.length) {
        filters.brand.forEach(brand => params.append('brand', brand));
      }
      if (filters.accset?.length) {
        filters.accset.forEach(accset => params.append('accset', accset));
      }
      if (filters.allergens?.length) {
        filters.allergens.forEach(allergen => params.append('allergens', allergen));
      }
      if (filters.sfPreferred !== undefined) {
        params.append('sfPreferred', filters.sfPreferred.toString());
      }
      if (filters.priceRange?.min !== undefined) {
        params.append('priceMin', filters.priceRange.min.toString());
      }
      if (filters.priceRange?.max !== undefined) {
        params.append('priceMax', filters.priceRange.max.toString());
      }

      const response = await fetch(`/api/search?${params.toString()}`);
      const data = await response.json();

      if (data.success) {
        setSearchResult(data.data);
        console.log('✅ AI Search successful with filters:', filters, 'found', data.data.total, 'products');
      } else {
        console.error('Search failed:', data.error);
        setSearchResult(null);
      }
    } catch (error) {
      console.error('Search error:', error);
      setSearchResult(null);
    } finally {
      setLoading(false);
    }
  };

  const handleSendMessage = async () => {
    if (!inputMessage.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      content: inputMessage,
      role: 'user',
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setIsTyping(true);

    try {
      // Call OpenAI API (you'll need to implement this endpoint)
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: inputMessage,
          context: 'product_search'
        }),
      });

      const data = await response.json();

      if (data.success) {
        const assistantMessage: Message = {
          id: (Date.now() + 1).toString(),
          content: data.message,
          role: 'assistant',
          timestamp: new Date()
        };

        setMessages(prev => [...prev, assistantMessage]);

        console.log("AI Response data:", data);
        console.log("Search Query:", data.searchQuery);
        console.log("Filters:", data.filters);

        // If the AI response includes a search query, update the internal AI search state with filters
        if (data.searchQuery) {
          console.log("Triggering search with query:", data.searchQuery, "and filters:", data.filters);
          await performAISearch(data.searchQuery, data.filters || {});
        } else {
          console.log("No search query returned from AI");
        }
      } else {
        throw new Error(data.error || 'Failed to get AI response');
      }
    } catch (error) {
      console.error('Chat error:', error);
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: 'Sorry, I encountered an error. Please try again.',
        role: 'assistant',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  useEffect(() => {
    const intervalId = setInterval(() => {
      setCurrentTextIndex((prevIndex) => (prevIndex + 1) % dynamicMessages.length);
    }, 2000);
    return () => clearInterval(intervalId);
  }, []);


  return (
    <div className="h-screen flex flex-col bg-gray-50">
      {/* Header */}
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
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      window.location.href = `/search?q=${encodeURIComponent((e.target as HTMLInputElement).value)}${selectedUserId ? `&userId=${selectedUserId}` : ''}`;
                    }
                  }}
                />
                <button
                  className="absolute inset-y-0 right-0 px-3 bg-yellow-500 rounded-r-md flex items-center justify-center hover:bg-yellow-600 transition-colors"
                  onClick={() => {
                    const input = document.querySelector('.hidden.md\:flex input[type="text"]') as HTMLInputElement;
                    if (input) {
                      window.location.href = `/search?q=${encodeURIComponent(input.value || '')}${selectedUserId ? `&userId=${selectedUserId}` : ''}`;
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
                      onChange={(e) => setSelectedUserId(e.target.value)}
                      className="appearance-none bg-transparent text-sm font-medium focus:outline-none focus:ring-1 focus:ring-yellow-500 focus:border-yellow-500 text-white"
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
                onClick={() => window.location.href = '/cart'}
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
                  onClick={() => window.location.href = '/cart'}
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
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      window.location.href = `/search?q=${encodeURIComponent((e.target as HTMLInputElement).value)}${selectedUserId ? `&userId=${selectedUserId}` : ''}`;
                    }
                  }}
                />
                <button
                  className="absolute inset-y-0 right-0 px-3 bg-yellow-500 rounded-r-md flex items-center justify-center hover:bg-yellow-600 transition-colors"
                  onClick={() => {
                    const input = document.querySelector('#mobile-menu input[type="text"]') as HTMLInputElement;
                    if (input) {
                      window.location.href = `/search?q=${encodeURIComponent(input.value || '')}${selectedUserId ? `&userId=${selectedUserId}` : ''}`;
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
                      onChange={(e) => setSelectedUserId(e.target.value)}
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
      {/* <div className="flex items-center justify-between p-4 border-b border-amber-200 bg-gradient-to-r from-amber-500 via-yellow-500 to-orange-500 flex-shrink-0">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm">
            <svg className="h-5 w-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-white drop-shadow-lg">AI Food Assistant</h2>
        </div>
      </div> */}

      {/* Content */}
      <div className="flex flex-1 min-h-0">
        {/* Chat Section - 1/3 */}
        <div className="w-1/3 border-r border-gray-200 flex flex-col">
          {/* Chat Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${message.role === 'user'
                    ? 'bg-blue-500 text-white'
                    : 'bg-gray-100 text-gray-900'
                    }`}
                >
                  <p className="text-sm">{message.content}</p>
                  <p className="text-xs mt-1 opacity-70" suppressHydrationWarning>
                    {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
              </div>
            ))}

            {isTyping && (
              <div className="flex justify-start">
                <div className="bg-gray-100 text-gray-900 px-4 py-2 rounded-lg">
                  <div className="flex space-x-1">
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Chat Input */}
          <div className="p-4 border-t border-gray-200 flex-shrink-0 bg-white">
            <div className="flex space-x-2">
              <textarea
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Ask me about products..."
                className="flex-1 p-3 border border-gray-300 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent min-h-[80px]"
                rows={2}
              />
              <button
                onClick={handleSendMessage}
                disabled={!inputMessage.trim() || isTyping}
                className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors self-end"
              >
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                </svg>
              </button>
            </div>
          </div>
        </div>

        {/* PLP Section - 2/3 */}
        <div className="w-2/3 flex flex-col min-h-0">
          <div className="p-4 border-b border-gray-200 bg-gray-50 flex-shrink-0">
            <h3 className="text-lg font-medium text-gray-900">
              {loading ? 'Searching...' : searchResult ? `${searchResult.total} Products Found` : 'No search results'}
            </h3>
          </div>

          <div className="flex-1 overflow-y-auto p-4 min-h-0">
            {loading ? (
              // PLP Skeleton Loader
              <div className="grid grid-cols-4 gap-4">
                {[1, 2, 3, 4, 5, 6, 7, 8].map((index) => (
                  <div key={index} className="bg-white rounded-lg shadow-sm border border-amber-100 p-4 animate-pulse">
                    <div className="space-y-3">
                      <div className="w-full h-32 bg-gradient-to-r from-amber-200 to-orange-200 rounded-lg"></div>
                      <div className="space-y-2">
                        <div className="h-4 bg-gradient-to-r from-amber-200 to-yellow-200 rounded w-full"></div>
                        <div className="h-3 bg-gradient-to-r from-yellow-200 to-orange-200 rounded w-3/4"></div>
                        <div className="h-3 bg-gradient-to-r from-orange-200 to-amber-200 rounded w-1/2"></div>
                        <div className="flex justify-between items-center mt-3">
                          <div className="h-6 bg-gradient-to-r from-amber-300 to-orange-300 rounded-full w-16"></div>
                          <div className="h-8 bg-gradient-to-r from-yellow-300 to-amber-300 rounded w-20"></div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : searchResult && searchResult.products.length > 0 ? (
              <div className="grid grid-cols-4 gap-4 auto-rows-max">
                {searchResult.products.map((product, index) => {
                  // Create a pattern for different card sizes
                  const cardType: 'small' | 'tall' | 'wide' = 'small';

                  // // Example pattern - you can customize this logic
                  // if (index % 8 === 2 || index % 8 === 5) {
                  //   cardType = 'tall'; // Every 3rd and 6th card in each set of 8
                  // } else if (index % 12 === 7) {
                  //   cardType = 'wide'; // Every 8th card in each set of 12
                  // }

                  return (
                    <PLPAIProductCard
                      key={product.id}
                      product={product}
                      cardType={cardType}
                    />
                  );
                })}
              </div>
            ) : (
              <div className="flex items-center justify-center h-64 text-gray-500">
                <div className="text-center">
                  <div className="relative mb-6">
                    <div className="absolute inset-0 rounded-full blur-xl opacity-30 animate-pulse"></div>
                    <div className="relative w-20 h-20 mx-auto bg-gradient-to-r from-amber-500 via-yellow-500 to-orange-500 rounded-full flex items-center justify-center shadow-2xl transform hover:scale-110 transition-all duration-300">
                      <svg className="h-10 w-10 text-white animate-bounce" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                      </svg>
                    </div>
                  </div>
                  <div className="relative h-16 mb-6 overflow-hidden">
                    <p
                      key={currentTextIndex}
                      className="flex items-center justify-center text-xl font-bold bg-gradient-to-r from-amber-600 via-yellow-600 to-orange-600 bg-clip-text text-transparent transition-all duration-1000 ease-out animate-slide-up"
                      style={{
                        animation: 'slideUpFade 1s ease-out',
                        textShadow: '0 4px 8px rgba(251, 191, 36, 0.3)',
                        filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.1))'
                      }}
                    >
                      {dynamicMessages[currentTextIndex]}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

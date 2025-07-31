'use client';

import { useCart } from '@/components/CartContext';
import { useState, useEffect, useCallback, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { getOrCreateVisitorId } from '@/lib/visitorId';
import { SearchResult, SearchFilters } from '@/lib/data';
import SearchBar from '@/components/SearchBar';
import PLPProductCard from '@/components/PLPProductCard';
import FilterSidebar from '@/components/FilterSidebar';
import SortDropdown from '@/components/SortDropdown';
import Pagination from '@/components/Pagination';
import RecommendationsWidget from '@/components/RecommendationsWidget';
import Link from 'next/link';

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

function SearchPageContent() {
  const { cart } = useCart();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [searchQuery, setSearchQuery] = useState('');
  const [displayedSearchQuery, setDisplayedSearchQuery] = useState('');
  const [searchResult, setSearchResult] = useState<SearchResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState<SearchFilters>({});
  const [currentPage, setCurrentPage] = useState(1);
  const [showFilters, setShowFilters] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState('relevance');
  
  // Autocomplete state
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedSuggestionIndex, setSelectedSuggestionIndex] = useState(-1);

  const itemsPerPage = 20;

  // Initialize from URL params
  useEffect(() => {
    const stored = getStoredDemoUserId();
    if (stored) setSelectedUserId(stored);

    const query = searchParams.get('q') || '';
    const category = searchParams.get('category');
    const userId = searchParams.get('userId');

    if (userId) setSelectedUserId(userId);
    if (query) setSearchQuery(query);
    if (category) {
      setFilters(prev => ({ ...prev, category: [category] }));
    }
  }, [searchParams]);

  useEffect(() => {
    setStoredDemoUserId(selectedUserId);
  }, [selectedUserId]);

  // Debounced autocomplete on keystroke
  useEffect(() => {
    if (!searchQuery.trim() || searchQuery.length < 2) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    const timeoutId = setTimeout(() => {
      fetchSuggestions(searchQuery);
    }, 300); // 300ms debounce

    return () => clearTimeout(timeoutId);
  }, [searchQuery]);

  const fetchSuggestions = async (searchQuery: string) => {
    if (!searchQuery.trim()) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    try {
      const visitorId = getCurrentVisitorId(selectedUserId);
      const response = await fetch(`/api/autocomplete?q=${encodeURIComponent(searchQuery)}&limit=8&visitorId=${encodeURIComponent(visitorId)}`);
      const data = await response.json();
      if (Array.isArray(data.suggestions)) {
        setSuggestions(data.suggestions);
        setShowSuggestions(true);
        setSelectedSuggestionIndex(-1);
      }
    } catch (error) {
      console.error('Autocomplete error:', error);
    }
  };

  const performSearch = useCallback(async (query: string, newFilters: SearchFilters = {}, page: number = 1, sort: string = 'relevance') => {
    console.log('🔍 Performing search with query:', query, 'filters:', newFilters, 'page:', page, 'sort:', sort);
    setLoading(true);
    try {
      const offset = (page - 1) * itemsPerPage;
      const params = new URLSearchParams({
        q: query,
        offset: offset.toString(),
        limit: itemsPerPage.toString(),
        sortBy: sort,
      });

      // Add filters to params
      if (newFilters.category?.length) {
        newFilters.category.forEach(cat => params.append('category', cat));
      }
      if (newFilters.brand?.length) {
        newFilters.brand.forEach(brand => params.append('brand', brand));
      }
      if (newFilters.accset?.length) {
        newFilters.accset.forEach(accset => params.append('accset', accset));
      }
      if (newFilters.sfPreferred !== undefined) {
        params.append('sfPreferred', newFilters.sfPreferred.toString());
      }
      if (newFilters.priceRange?.min !== undefined) {
        params.append('priceMin', newFilters.priceRange.min.toString());
      }
      if (newFilters.priceRange?.max !== undefined) {
        params.append('priceMax', newFilters.priceRange.max.toString());
      }

      // Add visitorId to params - use selected demo user's visitorId if available
      const currentVisitorId = getCurrentVisitorId(selectedUserId);
      params.append('visitorId', currentVisitorId);
      if (selectedUserId) {
        params.append('userId', selectedUserId);
      }
      const response = await fetch(`/api/search?${params.toString()}`);
      const data = await response.json();

      console.log('API Response:', data); // Debug log
      console.log('Search result facets:', data.data?.facets); // Debug facets

      if (data.success) {
        setSearchResult(data.data);
        console.log('✅ Search successful, found', data.data.total, 'products');
        console.log('🔍 Facets received:', data.data.facets);
      } else {
        console.error('❌ Search failed:', data.error);
        setSearchResult(null);
      }
    } catch (error) {
      console.error('❌ Search error:', error);
      setSearchResult(null);
    } finally {
      setLoading(false);
    }
  }, [selectedUserId, itemsPerPage]);

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    setDisplayedSearchQuery(query);
    setCurrentPage(1);
    performSearch(query, filters, 1, sortBy);
  };

  const handleFilterChange = (newFilters: SearchFilters) => {
    setFilters(newFilters);
    setCurrentPage(1);
    performSearch(searchQuery, newFilters, 1, sortBy);
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    performSearch(searchQuery, filters, page, sortBy);
  };

  const handleSortChange = (newSortBy: string) => {
    setSortBy(newSortBy);
    setCurrentPage(1);
    performSearch(searchQuery, filters, 1, newSortBy);
  };

  // Run search when filters, page, or sort change (but not searchQuery)
  useEffect(() => {
    performSearch(searchQuery, filters, currentPage, sortBy);
  }, [filters, performSearch, currentPage, sortBy]);

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
                  value={searchQuery}
                  onChange={(e) => setSearchQuery((e.target as HTMLInputElement).value)}
                  className="w-48 text-white sm:w-64 lg:w-100 pl-3 pr-12 py-2 border border-gray-600 rounded-md focus:outline-none focus:ring-1 focus:ring-yellow-500 focus:border-yellow-500 text-gray-800"
                  onKeyDown={(e) => e.key === 'Enter' && handleSearch((e.target as HTMLInputElement).value)}
                />
                <button
                  className="absolute inset-y-0 right-0 px-3 bg-yellow-500 rounded-r-md flex items-center justify-center hover:bg-yellow-600 transition-colors"
                  onClick={() => handleSearch(searchQuery)}
                >
                  <svg className="h-5 w-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </button>
              </div>
              <Link href="/ai-support" className="ml-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors flex items-center space-x-2">
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                </svg>
                <span className="hidden sm:inline">AI Mode</span>
              </Link>
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
                  value={searchQuery}
                  onChange={(e) => setSearchQuery((e.target as HTMLInputElement).value)}
                  className="w-full pl-3 pr-12 py-2 border border-gray-600 rounded-md focus:outline-none focus:ring-1 focus:ring-yellow-500 focus:border-yellow-500 text-gray-800"
                  onKeyDown={(e) => e.key === 'Enter' && handleSearch((e.target as HTMLInputElement).value)}
                />
                <button
                  className="absolute inset-y-0 right-0 px-3 bg-yellow-500 rounded-r-md flex items-center justify-center hover:bg-yellow-600 transition-colors"
                  onClick={() => handleSearch(searchQuery)}
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
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <button className="px-4 py-3 flex items-center hover:bg-gray-200 transition-colors uppercase text-sm font-medium">
                <svg className="h-5 w-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
                CATEGORIES
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex flex-col lg:flex-row gap-6">
          {/* Filter Sidebar */}
          <div className="lg:w-64 flex-shrink-0">
            <div className="lg:hidden mb-4">
              <button
                onClick={() => setShowFilters(!showFilters)}
                className="flex items-center justify-center w-full px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
              >
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
                </svg>
                Filters
              </button>
            </div>
            <div className={`${showFilters ? 'block' : 'hidden'} lg:block`}>
              <FilterSidebar
                key={`filters-${searchResult?.total || 0}-${JSON.stringify(searchResult?.facets)}`}
                facets={searchResult?.facets}
                filters={filters}
                onFilterChange={handleFilterChange}
              />
            </div>
          </div>

          {/* Results */}
          <div className="flex-1">
            {/* Results Header */}
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-lg font-medium text-gray-900">
                  {displayedSearchQuery ? `Search Results for "${displayedSearchQuery}"` : 'All Products'}
                </h2>
                {searchResult && (
                  <p className="text-sm text-gray-600 mt-1">
                    {searchResult.total} products found in {searchResult.queryTime}ms
                  </p>
                )}
              </div>
              <div className="flex items-center space-x-4">
                <SortDropdown
                  currentSort={sortBy}
                  onSortChange={handleSortChange}
                />
              </div>
            </div>

            {/* Loading State */}
            {loading && (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                <span className="ml-2 text-gray-600">Searching...</span>
              </div>
            )}

            {/* Results Grid */}
            {!loading && searchResult && (
              <>
                {searchResult.products.length > 0 ? (
                  <div className="flex flex-col space-y-4">
                    {searchResult.products.map((product) => (
                      <PLPProductCard
                        key={product.id}
                        product={product}
                        userId={selectedUserId}
                        visitorId={getCurrentVisitorId(selectedUserId)}
                      />
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                    <h3 className="mt-2 text-sm font-medium text-gray-900">No products found</h3>
                    <p className="mt-1 text-sm text-gray-500">Try adjusting your search or filters</p>
                    <button
                      onClick={() => {
                        setSearchQuery('');
                        setFilters({});
                        setCurrentPage(1);
                      }}
                      className="mt-4 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700"
                    >
                      Clear Search
                    </button>
                  </div>
                )}

                {/* Pagination */}
                {searchResult.total > itemsPerPage && (
                  <div className="mt-8">
                    <Pagination
                      currentPage={currentPage}
                      totalItems={searchResult.total}
                      itemsPerPage={itemsPerPage}
                      onPageChange={handlePageChange}
                    />
                  </div>
                )}
              </>
            )}

            {/* Recommendations Widget - Show when no search query or at the end */}
            {!loading && (!searchQuery || searchResult?.products.length === 0) && (
              <div className="mt-8">
                <RecommendationsWidget
                  categories={filters.category}
                  userPreferences={{ sfPreferred: filters.sfPreferred }}
                  limit={12}
                  visitorId={getCurrentVisitorId(selectedUserId)}
                  userId={selectedUserId || undefined}
                />
              </div>
            )}
          </div>
        </div>
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
                    <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 0 1-2.063-2.065 2.064 2.064 0 1 1 2.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
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

export default function SearchPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading search page...</p>
        </div>
      </div>
    }>
      <SearchPageContent />
    </Suspense>
  );
}
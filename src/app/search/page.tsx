'use client';

import { useCart } from '@/components/CartContext';
import { useState, useEffect, useCallback, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { getOrCreateVisitorId } from '@/lib/visitorId';
import { SearchResult, SearchFilters } from '@/lib/data';
import SearchBar from '@/components/SearchBar';
import ProductCard from '@/components/ProductCard';
import FilterSidebar from '@/components/FilterSidebar';
import SortDropdown from '@/components/SortDropdown';
import Pagination from '@/components/Pagination';
import RecommendationsWidget from '@/components/RecommendationsWidget';
import Link from 'next/link';

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
  const searchParams = useSearchParams();
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResult, setSearchResult] = useState<SearchResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState<SearchFilters>({});
  const [currentPage, setCurrentPage] = useState(1);
  const [showFilters, setShowFilters] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState('relevance');
  
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
      if (newFilters.allergens?.length) {
        newFilters.allergens.forEach(allergen => params.append('allergens', allergen));
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

  // Run search when params change
  useEffect(() => {
    performSearch(searchQuery, filters, currentPage, sortBy);
  }, [searchQuery, filters, performSearch, currentPage, sortBy]);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center">
              <Link href="/" className="text-2xl font-bold text-gray-900 hover:text-blue-600">Whitecap</Link>
              <span className="ml-2 text-sm text-gray-500">Search & Discovery</span>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-600">Vertex AI POC</span>
              <div>
                <label htmlFor="demo-user-dropdown" className="text-xs mr-1 text-gray-800">Demo User:</label>
                <select
                  id="demo-user-dropdown"
                  className="border border-gray-800 text-gray-800 rounded px-2 py-1 text-sm focus:ring-gray-800 focus:border-gray-800"
                  value={selectedUserId || ""}
                  onChange={e => setSelectedUserId(e.target.value || null)}
                >
                  <option value="" className="text-gray-800">(No user selected)</option>
                  {DEMO_USERS.map(user => (
                    <option key={user.id} value={user.id} className="text-gray-800">{user.name}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Search Bar */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between gap-4">
            <SearchBar onSearch={handleSearch} initialQuery={searchQuery} />
            <Link href="/cart" className="relative ml-4 group" aria-label="View cart">
              <svg className="w-7 h-7 text-gray-700 group-hover:text-blue-700 transition-colors" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path d="M3 3h2l.4 2M7 13h10l4-8H5.4" strokeLinecap="round" strokeLinejoin="round"/>
                <circle cx="9" cy="21" r="1"/>
                <circle cx="20" cy="21" r="1"/>
              </svg>
              {cart.length > 0 && (
                <span className="absolute -top-2 -right-2 bg-blue-600 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center border-2 border-white">{cart.length}</span>
              )}
            </Link>
          </div>
        </div>
      </div>

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
                  {searchQuery ? `Search Results for "${searchQuery}"` : 'All Products'}
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
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 gap-6">
                    {searchResult.products.map((product) => (
                      <ProductCard 
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
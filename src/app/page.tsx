'use client';

import { useState, useEffect, useCallback } from 'react';
import { getOrCreateVisitorId } from '@/lib/visitorId';
import { Product } from '@/lib/data';
import ProductCard from '@/components/ProductCard';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

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
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center">
              <Link href="/" className="flex items-center group">
                <h1 className="text-2xl font-bold text-gray-900 group-hover:text-blue-700 transition-colors">Whitecap</h1>
              </Link>
              <span className="ml-2 text-sm text-gray-500">Search & Discovery</span>
            </div>
            <div className="flex items-center space-x-6">
              <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">Vertex AI Demo</span>
              <div className="flex items-center">
                <label htmlFor="demo-user-dropdown" className="text-xs mr-2 text-gray-600 font-medium">User:</label>
                <select
                  id="demo-user-dropdown"
                  className="border border-gray-300 text-gray-700 rounded px-3 py-1 text-sm focus:ring-gray-500 focus:border-gray-500 bg-white"
                  value={selectedUserId || ""}
                  onChange={e => setSelectedUserId(e.target.value || null)}
                >
                  <option value="">Guest</option>
                  {DEMO_USERS.map(user => (
                    <option key={user.id} value={user.id}>{user.name}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Banner */}
      <section className="bg-gray-900 text-white relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900 opacity-90"></div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <div>
              <div className="text-sm font-medium text-gray-400 mb-4 tracking-wide uppercase">
                Whitecap
              </div>
              <h1 className="text-4xl lg:text-5xl font-bold mb-6 leading-tight">
                Behind Every
                <span className="block text-gray-300">Great Chef</span>
              </h1>
              <p className="text-xl mb-6 text-gray-300 leading-relaxed">
                Whitecap is dedicated to providing exceptional products and service excellence, helping our customers achieve their business goals through innovative solutions.
              </p>
              <p className="text-base mb-8 text-gray-400 leading-relaxed">
                Food service is a business of symbiotic relationships where the success of everyone involved is directly tied to the success of everyone else. Delivering food is just the first part; we also have to deliver quality, innovation, sustainability and differentiation while we&apos;re at it.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <button
                  onClick={() => handleSearchQuery('')}
                  className="px-8 py-3 bg-white text-gray-900 font-medium rounded hover:bg-gray-100 transition-colors duration-200"
                >
                  Browse Products
                </button>
                <button
                  onClick={() => handleCategorySearch('Produce')}
                  className="px-8 py-3 border border-gray-600 text-gray-300 font-medium rounded hover:bg-gray-800 hover:border-gray-500 transition-colors duration-200"
                >
                  View Produce
                </button>
              </div>
            </div>
            <div className="hidden lg:block">
              <div className="bg-gray-800/50 backdrop-blur-sm rounded-lg p-8 border border-gray-700">
                <div className="text-center">
                  <div className="w-16 h-16 mx-auto mb-6 bg-gray-700 rounded-full flex items-center justify-center">
                    <svg className="w-8 h-8 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </div>
                  <h3 className="text-xl font-semibold mb-3 text-white">Delivered to New Zealand&apos;s Best</h3>
                  <p className="text-gray-400 text-sm leading-relaxed">
                    That&apos;s what we aim to do, and that&apos;s why we&apos;re known as the company behind every great chef.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Quick Categories */}
      <section className="bg-gray-50 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Our Product Categories</h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Explore our comprehensive range of premium food service products, carefully curated for New Zealand&apos;s finest establishments.
            </p>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
            {[
              { 
                name: 'Produce', 
                description: 'Fresh vegetables & fruits',
                icon: (
                  <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                  </svg>
                )
              },
              { 
                name: 'Butchery', 
                description: 'Premium cuts & meats',
                icon: (
                  <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4" />
                  </svg>
                )
              },
              { 
                name: 'Seafood', 
                description: 'Fresh fish & seafood',
                icon: (
                  <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                )
              },
              { 
                name: 'Essentials', 
                description: 'Pantry & ingredients',
                icon: (
                  <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                  </svg>
                )
              },
            ].map((category) => (
              <button
                key={category.name}
                onClick={() => handleCategorySearch(category.name)}
                className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 hover:shadow-md hover:border-gray-300 transition-all duration-200 group text-left"
              >
                <div className="flex items-center justify-center w-12 h-12 bg-gray-100 rounded-lg mb-4 text-gray-600 group-hover:bg-gray-700 group-hover:text-white transition-colors duration-200">
                  {category.icon}
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-1">{category.name}</h3>
                <p className="text-sm text-gray-600">{category.description}</p>
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Recommendations Sections */}
      <div className="bg-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-600"></div>
              <span className="ml-4 text-lg text-gray-700">Loading recommendations...</span>
            </div>
          ) : (
            <>
              {/* Trending Products */}
              {recommendations?.trending?.products && (
                <RecommendationSection
                  title="Popular Products"
                  products={recommendations.trending.products}
                  viewAllAction={() => handleSearchQuery('trending')}
                />
              )}

              {/* On Sale Products */}
              {recommendations?.['on-sale']?.products && (
                <RecommendationSection
                  title="Special Offers"
                  products={recommendations['on-sale'].products}
                  viewAllAction={() => handleSearchQuery('on sale')}
                />
              )}

              {/* You May Also Like */}
              {recommendations?.['similar-items']?.products && (
                <RecommendationSection
                  title="You May Also Like"
                  products={recommendations['similar-items'].products}
                  viewAllAction={() => handleSearchQuery('recommended')}
                />
              )}

              {/* Recommended For You */}
              {recommendations?.['recommended-for-you']?.products && (
                <RecommendationSection
                  title="Recommended For You"
                  products={recommendations['recommended-for-you'].products}
                  viewAllAction={() => handleSearchQuery('personalized')}
                />
              )}
            </>
          )}
        </div>
      </div>

      {/* Footer CTA */}
      <section className="bg-gray-800 text-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl font-bold mb-4">Partner with Whitecap</h2>
              <p className="text-lg text-gray-300 mb-6 leading-relaxed">
                Join industry leaders who trust Whitecap for premium products and exceptional service delivery.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <button
                  onClick={() => handleSearchQuery('')}
                  className="px-8 py-3 bg-white text-gray-900 font-medium rounded hover:bg-gray-100 transition-colors duration-200"
                >
                  Browse Catalogue
                </button>
                <button
                  onClick={() => handleCategorySearch('Produce')}
                  className="px-8 py-3 border border-gray-600 text-gray-300 font-medium rounded hover:bg-gray-700 hover:border-gray-500 transition-colors duration-200"
                >
                  Contact Sales
                </button>
              </div>
            </div>
            <div className="bg-gray-700/50 rounded-lg p-8">
              <div className="flex items-start space-x-4">
                <div className="flex-shrink-0">
                  <div className="w-12 h-12 bg-gray-600 rounded-lg flex items-center justify-center">
                    <svg className="w-6 h-6 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                </div>
                <div>
                  <h3 className="text-lg font-semibold mb-2">Quality Guaranteed</h3>
                  <p className="text-gray-300 text-sm leading-relaxed">
                    Premium sourcing, rigorous quality controls, and reliable delivery to support your culinary excellence.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}


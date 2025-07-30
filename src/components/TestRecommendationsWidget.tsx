'use client';

import { useState, useEffect } from 'react';
import { Product } from '@/lib/data';
import ProductCard from './ProductCard';

interface RecommendationSection {
  products: Product[];
  score: number;
  reason: string;
  count: number;
}

export default function TestRecommendationsWidget() {
  const [showTestData, setShowTestData] = useState(false);
  
  // Create mock test data
  const mockProduct: Product = {
    id: 'TEST001',
    sku: 'TEST001',
    displayName: 'Test Product for Widget',
    description: 'This is a test product to verify widget rendering',
    brand: 'TestBrand',
    category: 'Test',
    categoryDesc: 'Test Category',
    imageURL: '',
    isSFPreferred: true,
    units: 'EA',
    urlSlug: 'test-product',
    availability: 'IN_STOCK',
    accset: 'TEST',
    keywords: ['test', 'widget'],
    orderLastMonth: 0,
    isActive: true,
    isDeleted: false,
    vendor: 'TestVendor',
    vendorName: 'Test Vendor Ltd',
    webCategory: 'Test',
    webSubCategory: 'Widget',
    webCategoryDesc: 'Test Category',
    webDesc: 'Test Description',
    webSubDesc: 'Test Sub Description'
  };

  const mockSection: RecommendationSection = {
    products: [mockProduct, mockProduct, mockProduct],
    score: 0.9,
    reason: 'Test recommendation section',
    count: 3
  };

  useEffect(() => {
    // Simulate loading delay
    const timer = setTimeout(() => {
      setShowTestData(true);
    }, 1000);
    
    return () => clearTimeout(timer);
  }, []);

  const RecommendationSection = ({ 
    title, 
    products, 
    reason, 
    score 
  }: { 
    title: string; 
    products: Product[]; 
    reason: string; 
    score: number;
  }) => (
    <div className="mb-8 bg-gray-50 rounded-lg p-6 border border-gray-100">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
        <div className="flex items-center space-x-2">
          <span className="text-xs text-gray-500">Score: {(score * 100).toFixed(0)}%</span>
          <div className="w-16 h-2 bg-gray-200 rounded-full">
            <div 
              className="h-2 bg-blue-500 rounded-full transition-all duration-300" 
              style={{ width: `${score * 100}%` }}
            ></div>
          </div>
        </div>
      </div>
      <p className="text-sm text-gray-600 mb-4 italic">💡 {reason}</p>
      <div className="text-xs text-gray-500 mb-2">
        Products to render: {products?.length || 0} | Array check: {Array.isArray(products) ? 'Yes' : 'No'}
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 gap-4">
        {products && Array.isArray(products) && products.slice(0, 4).map((product, index) => {
          console.log(`Rendering test product ${index}:`, product);
          return <ProductCard key={`${product.id}-${index}`} product={product} />;
        })}
      </div>
    </div>
  );

  if (!showTestData) {
    return (
      <div className="animate-pulse">
        <div className="h-6 bg-gray-200 rounded w-1/4 mb-4"></div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="bg-gray-200 rounded-lg h-64"></div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">🧪 Test Widget with Mock Data</h2>
        <p className="text-sm text-gray-600">
          Testing widget rendering with mock products
        </p>
      </div>

      <RecommendationSection
        title="🔗 Test Products"
        products={mockSection.products}
        reason={mockSection.reason}
        score={mockSection.score}
      />
    </div>
  );
}

'use client';

import { useState, useEffect } from 'react';
import { Product } from '@/lib/data';
import ProductCard from './ProductCard';

export default function HardcodedRecommendationsWidget() {
  const [showData, setShowData] = useState(false);

  useEffect(() => {
    // Simulate API delay
    setTimeout(() => {
      setShowData(true);
    }, 1000);
  }, []);

  // Hardcoded test data that matches our expected structure
  const hardcodedRecommendations = {
    'similar-items': {
      products: [
        {
          id: 'MACH013',
          sku: 'MACH013', 
          displayName: 'MACH013 Test Product',
          description: 'Test product from hardcoded data',
          brand: 'MACHI',
          category: 'MACHI',
          categoryDesc: 'MACHI',
          imageURL: '',
          isSFPreferred: false,
          units: 'CTN',
          urlSlug: 'mach013',
          availability: 'IN_STOCK' as const,
          accset: 'VERTEX_AI',
          keywords: ['similar-items', 'related', 'recommendation'],
          orderLastMonth: 0,
          isActive: true,
          isDeleted: false,
          vendor: 'MACHI',
          vendorName: 'MACHI',
          webCategory: 'MACHI',
          webSubCategory: 'FROZ',
          webCategoryDesc: 'MACHI',
          webDesc: 'Test product from hardcoded data',
          webSubDesc: 'FROZ'
        } as Product
      ],
      score: 0.85,
      reason: 'Hardcoded similar items for testing',
      count: 1
    },
    'on-sale': {
      products: [
        {
          id: 'SALE001',
          sku: 'SALE001',
          displayName: 'SALE001 On Sale Product', 
          description: 'Test on-sale product',
          brand: 'TestBrand',
          category: 'Test',
          categoryDesc: 'Test',
          imageURL: '',
          isSFPreferred: true,
          units: 'EA',
          urlSlug: 'sale001',
          availability: 'IN_STOCK' as const,
          accset: 'VERTEX_AI',
          keywords: ['on-sale', 'promotion', 'discount'],
          orderLastMonth: 0,
          isActive: true,
          isDeleted: false,
          vendor: 'TestVendor',
          vendorName: 'Test Vendor',
          webCategory: 'Test',
          webSubCategory: 'Sale',
          webCategoryDesc: 'Test',
          webDesc: 'Test on-sale product',
          webSubDesc: 'Sale'
        } as Product
      ],
      score: 0.9,
      reason: 'Hardcoded on-sale items for testing',
      count: 1
    }
  };

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
        </div>
      </div>
      <p className="text-sm text-gray-600 mb-4 italic">💡 {reason}</p>
      <div className="text-xs text-gray-500 mb-2">
        Products: {products?.length || 0}
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 gap-4">
        {products && Array.isArray(products) && products.map((product, index) => (
          <ProductCard key={`${product.id}-${index}`} product={product} />
        ))}
      </div>
    </div>
  );

  if (!showData) {
    return (
      <div className="animate-pulse">
        <div className="h-6 bg-gray-200 rounded w-1/4 mb-4"></div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 gap-4">
          <div className="bg-gray-200 rounded-lg h-64"></div>
          <div className="bg-gray-200 rounded-lg h-64"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">🔧 Hardcoded Test Widget</h2>
        <p className="text-sm text-gray-600">
          Testing with hardcoded data to verify rendering works
        </p>
      </div>

      {hardcodedRecommendations['similar-items'] && (
        <RecommendationSection
          title="🔗 Similar Items (Hardcoded)"
          products={hardcodedRecommendations['similar-items'].products}
          reason={hardcodedRecommendations['similar-items'].reason}
          score={hardcodedRecommendations['similar-items'].score}
        />
      )}

      {hardcodedRecommendations['on-sale'] && (
        <RecommendationSection
          title="🏷️ On Sale (Hardcoded)"
          products={hardcodedRecommendations['on-sale'].products}
          reason={hardcodedRecommendations['on-sale'].reason}
          score={hardcodedRecommendations['on-sale'].score}
        />
      )}
    </div>
  );
}

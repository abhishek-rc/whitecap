'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import categoriesData from '@/data/categories.json';

interface Category {
  name: string;
  id?: string;
  children: Category[];
}

interface CategoryDropdownProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function CategoryDropdown({ isOpen, onClose }: CategoryDropdownProps) {
  const [hoveredCategory, setHoveredCategory] = useState<string | null>(null);
  const [hoveredSubCategory, setHoveredSubCategory] = useState<string | null>(null);
  const router = useRouter();
  const dropdownRef = useRef<HTMLDivElement>(null);

  const categories = categoriesData as Category[];

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, onClose]);

  const handleCategoryClick = (category: Category) => {
    // Use category ID for search if available, otherwise use name
    const searchParam = category.id || category.name;
    router.push(`/search?category=${encodeURIComponent(searchParam)}`);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div
      ref={dropdownRef}
      className="absolute top-full left-0 right-0 bg-white border border-gray-300 shadow-2xl z-50 max-h-[500px] overflow-hidden rounded-b-lg"
      style={{ boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)' }}
    >
      <div className="flex min-h-[400px]">
        {/* Main Categories */}
        <div className="w-1/3 border-r border-gray-200 bg-gradient-to-b from-gray-50 to-gray-100">
          <div className="py-3">
            <div className="px-4 py-2 text-xs font-bold text-gray-500 uppercase tracking-wider border-b border-gray-200 bg-white">
              Categories
            </div>
            {categories.map((category) => (
              <div
                key={category.name}
                className={`px-4 py-3 text-sm cursor-pointer transition-all duration-200 ${
                  hoveredCategory === category.name
                    ? 'bg-yellow-400 text-black font-semibold border-l-4 border-yellow-600 shadow-md'
                    : 'text-gray-700 hover:bg-white hover:shadow-sm'
                }`}
                onMouseEnter={() => {
                  setHoveredCategory(category.name);
                  setHoveredSubCategory(null);
                }}
                onClick={() => handleCategoryClick(category)}
              >
                <div className="flex items-center justify-between">
                  <span className="truncate font-medium">{category.name}</span>
                  {category.children.length > 0 && (
                    <svg className={`w-4 h-4 transition-colors ${
                      hoveredCategory === category.name ? 'text-black' : 'text-gray-400'
                    }`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Subcategories */}
        {hoveredCategory && (
          <div className="w-1/3 border-r border-gray-200 bg-white">
            <div className="py-3">
              <div className="px-4 py-2 text-xs font-bold text-gray-500 uppercase tracking-wider border-b border-gray-100 bg-gray-50">
                {hoveredCategory}
              </div>
              {categories
                .find((cat) => cat.name === hoveredCategory)
                ?.children.map((subCategory) => (
                  <div
                    key={subCategory.name}
                    className={`px-4 py-3 text-sm cursor-pointer transition-all duration-150 ${
                      hoveredSubCategory === subCategory.name
                        ? 'bg-yellow-300 text-black font-semibold border-l-3 border-yellow-500'
                        : 'text-gray-600 hover:bg-gray-50 hover:text-gray-800'
                    }`}
                    onMouseEnter={() => setHoveredSubCategory(subCategory.name)}
                    onClick={() => handleCategoryClick(subCategory)}
                  >
                    <div className="flex items-center justify-between">
                      <span className="truncate">{subCategory.name}</span>
                      {subCategory.children.length > 0 && (
                        <svg className={`w-4 h-4 transition-colors ${
                          hoveredSubCategory === subCategory.name ? 'text-black' : 'text-gray-400'
                        }`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      )}
                    </div>
                  </div>
                ))}
            </div>
          </div>
        )}

        {/* Sub-subcategories */}
        {hoveredCategory && hoveredSubCategory && (
          <div className="w-1/3 bg-white">
            <div className="py-3">
              <div className="px-4 py-2 text-xs font-bold text-gray-500 uppercase tracking-wider border-b border-gray-100 bg-gray-50">
                {hoveredSubCategory}
              </div>
              {categories
                .find((cat) => cat.name === hoveredCategory)
                ?.children.find((subCat) => subCat.name === hoveredSubCategory)
                ?.children.map((subSubCategory) => (
                  <div
                    key={subSubCategory.name}
                    className="px-4 py-3 text-sm cursor-pointer text-gray-600 hover:bg-yellow-50 hover:text-yellow-800 transition-all duration-150 group"
                    onClick={() => handleCategoryClick(subSubCategory)}
                  >
                    <div className="flex items-center">
                      <div className="w-2 h-2 bg-yellow-400 rounded-full mr-3 opacity-0 group-hover:opacity-100 transition-opacity duration-150"></div>
                      <span className="truncate font-medium">{subSubCategory.name}</span>
                    </div>
                  </div>
                ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

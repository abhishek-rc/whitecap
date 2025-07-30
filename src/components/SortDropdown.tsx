'use client';

import { useState, useRef, useEffect } from 'react';

export interface SortOption {
  value: string;
  label: string;
}

interface SortDropdownProps {
  currentSort: string;
  onSortChange: (sortBy: string) => void;
}

const SORT_OPTIONS: SortOption[] = [
  { value: 'relevance', label: 'Recommended (default)' },
  { value: 'text_match_desc', label: 'Text Match Score' },
  { value: 'name_asc', label: 'Alphabetical (A–Z)' },
  { value: 'name_desc', label: 'Alphabetical (Z–A)' },
  { value: 'price_asc', label: 'Price (Low–High)' },
  { value: 'price_desc', label: 'Price (High–Low)' },
  { value: 'rating_desc', label: 'Rating (High–Low)' },
  { value: 'rating_asc', label: 'Rating (Low–High)' },
  { value: 'discount_desc', label: 'Discount (High–Low)' },
  { value: 'discount_asc', label: 'Discount (Low–High)' },
  { value: 'availability', label: 'Availability' },
  { value: 'recently_purchased', label: 'Previously Purchased' },
];

export default function SortDropdown({ currentSort, onSortChange }: SortDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const currentOption = SORT_OPTIONS.find(option => option.value === currentSort) || SORT_OPTIONS[0];

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleSortSelect = (sortValue: string) => {
    onSortChange(sortValue);
    setIsOpen(false);
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center justify-between w-full md:w-auto min-w-[200px] px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
      >
        <span className="flex items-center">
          <svg
            className="w-4 h-4 mr-2 text-gray-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M3 4h13M3 8h9m-9 4h6m4 0l4-4m0 0l4 4m-4-4v12"
            />
          </svg>
          Sort by: {currentOption.label}
        </span>
        <svg
          className={`w-4 h-4 ml-2 transition-transform ${isOpen ? 'rotate-180' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isOpen && (
        <div className="absolute right-0 z-10 mt-2 w-56 bg-white rounded-md shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none">
          <div className="py-1">
            {SORT_OPTIONS.map((option) => (
              <button
                key={option.value}
                onClick={() => handleSortSelect(option.value)}
                className={`${
                  currentSort === option.value
                    ? 'bg-blue-50 text-blue-700'
                    : 'text-gray-900 hover:bg-gray-50'
                } group flex items-center w-full px-4 py-2 text-sm transition-colors`}
              >
                {currentSort === option.value && (
                  <svg
                    className="w-4 h-4 mr-2 text-blue-600"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                      clipRule="evenodd"
                    />
                  </svg>
                )}
                <span className={currentSort === option.value ? '' : 'ml-6'}>
                  {option.label}
                </span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

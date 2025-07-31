'use client';

import { useState, useEffect, useRef } from 'react';
import { SearchFilters } from '@/lib/data';

interface Facets {
  categories: Array<{ value: string; count: number }>;
  brands: Array<{ value: string; count: number }>;
  priceRanges: Array<{ min: number; max: number; count: number }>;
  warehouses: Array<{ value: string; count: number }>;
  accsets: Array<{ value: string; count: number }>;
  availability: Array<{ value: string; count: number }>;
}

interface FilterSidebarProps {
  facets?: Facets;
  filters: SearchFilters;
  onFilterChange: (filters: SearchFilters) => void;
}

export default function FilterSidebar({ facets, filters, onFilterChange }: FilterSidebarProps) {
  console.log('FilterSidebar received facets:', facets); // Debug log
  console.log('FilterSidebar filters:', filters); // Debug log
  
  // Fallback static filters for testing
  const fallbackFacets = {
    categories: [
      { value: 'PACKPA', count: 45 },
      { value: 'DAIR', count: 32 },
      { value: 'PIE', count: 28 },
      { value: 'PACKPC', count: 23 },
      { value: 'PLANTP', count: 19 },
      { value: 'PACKTP', count: 15 },
      { value: 'BAK', count: 12 },
      { value: 'ZDELE', count: 8 }
    ],
    brands: [
      { value: 'CASTAWAY', count: 89 },
      { value: 'FOOD SNOB', count: 56 },
      { value: 'LEESPAC', count: 34 },
      { value: 'PAVILLION FOODS', count: 23 },
      { value: 'HARMLESS FOOD CO', count: 18 },
      { value: 'NEW WAY', count: 15 },
      { value: 'ANY BRAND', count: 12 }
    ],
    priceRanges: [
      { min: 0, max: 25, count: 45 },
      { min: 25, max: 50, count: 32 },
      { min: 50, max: 100, count: 28 },
      { min: 100, max: 200, count: 15 },
      { min: 200, max: 500, count: 8 }
    ],
    warehouses: [
      { value: 'MPM MARKETING SERVICE', count: 78 },
      { value: 'BLUEROCK FOOD SALES & MKTG', count: 45 },
      { value: 'GREENPAK LTD', count: 32 },
      { value: 'RICHMOND FOODS LTD', count: 28 },
      { value: 'FORMULA FOODS', count: 15 }
    ],
    accsets: [
      { value: 'DRY', count: 89 },
      { value: 'CHIL', count: 34 },
      { value: 'FZN', count: 23 }
    ],
    availability: [
      { value: 'IN_STOCK', count: 145 },
      { value: 'LOW_STOCK', count: 23 },
      { value: 'OUT_OF_STOCK', count: 5 }
    ]
  };

  // Always use provided facets if available, even if arrays are empty
  // This ensures filters update dynamically when search results change
  const activeFacets = facets ? facets : fallbackFacets;

  // Use ref to track previous facets to avoid infinite loops
  const prevFacetsRef = useRef<Facets | undefined>(undefined);

  // Monitor facets changes and clear invalid filters
  useEffect(() => {
    
    // Check if facets actually changed (deep comparison for key fields)
    const currentFacetsKey = facets ? JSON.stringify({
      categoriesCount: facets.categories?.length || 0,
      brandsCount: facets.brands?.length || 0,
      availabilityCount: facets.availability?.length || 0,
      accsetsCount: facets.accsets?.length || 0,
      warehousesCount: facets.warehouses?.length || 0,
    }) : 'null';
    
    const prevFacetsKey = prevFacetsRef.current ? JSON.stringify({
      categoriesCount: prevFacetsRef.current.categories?.length || 0,
      brandsCount: prevFacetsRef.current.brands?.length || 0,
      availabilityCount: prevFacetsRef.current.availability?.length || 0,
      accsetsCount: prevFacetsRef.current.accsets?.length || 0,
      warehousesCount: prevFacetsRef.current.warehouses?.length || 0,
    }) : 'null';
    
    // Only process if facets actually changed
    if (currentFacetsKey !== prevFacetsKey) {
      console.log('Facets structure changed, checking filter validity');
      
      // When facets change (new search results), clean up invalid filters
      if (facets && Object.keys(filters).length > 0) {
        const validFilters: SearchFilters = {};
        let hasChanges = false;
        
        // Check if current category filters are still valid
        if (filters.category?.length) {
          const validCategories = filters.category.filter(cat => 
            facets.categories?.some(f => f.value === cat)
          );
          if (validCategories.length !== filters.category.length) {
            hasChanges = true;
            console.log('Some category filters are no longer valid');
          }
          if (validCategories.length > 0) {
            validFilters.category = validCategories;
          }
        }
        
        // Check if current brand filters are still valid
        if (filters.brand?.length) {
          const validBrands = filters.brand.filter(brand => 
            facets.brands?.some(f => f.value === brand)
          );
          if (validBrands.length !== filters.brand.length) {
            hasChanges = true;
            console.log('Some brand filters are no longer valid');
          }
          if (validBrands.length > 0) {
            validFilters.brand = validBrands;
          }
        }
        
        // Check if current availability filters are still valid
        if (filters.availability?.length) {
          const validAvailability = filters.availability.filter(avail => 
            facets.availability?.some(f => f.value === avail)
          );
          if (validAvailability.length !== filters.availability.length) {
            hasChanges = true;
            console.log('Some availability filters are no longer valid');
          }
          if (validAvailability.length > 0) {
            validFilters.availability = validAvailability;
          }
        }
        
        // Check if current accset filters are still valid
        if (filters.accset?.length) {
          const validAccsets = filters.accset.filter(accset => 
            facets.accsets?.some(f => f.value === accset)
          );
          if (validAccsets.length !== filters.accset.length) {
            hasChanges = true;
            console.log('Some accset filters are no longer valid');
          }
          if (validAccsets.length > 0) {
            validFilters.accset = validAccsets;
          }
        }
        
        // Check if current warehouse filters are still valid
        if (filters.warehouse?.length) {
          const validWarehouses = filters.warehouse.filter(warehouse => 
            facets.warehouses?.some(f => f.value === warehouse)
          );
          if (validWarehouses.length !== filters.warehouse.length) {
            hasChanges = true;
            console.log('Some warehouse filters are no longer valid');
          }
          if (validWarehouses.length > 0) {
            validFilters.warehouse = validWarehouses;
          }
        }
        

        
        // Keep other filters that don't depend on facets
        if (filters.priceRange) {
          validFilters.priceRange = filters.priceRange;
        }
        
        // Update filters if there are changes
        if (hasChanges) {
          console.log('Clearing invalid filters, old:', filters, 'new:', validFilters);
          onFilterChange(validFilters);
        }
      }
      
      // Update the ref
      prevFacetsRef.current = facets || undefined;
    }
  }, [facets, filters, onFilterChange]);
  
  const [expandedSections, setExpandedSections] = useState({
    categories: true,
    brands: true,
    sfPreferred: true,
    warehouses: false,
    accsets: false,
    availability: false,
    priceRanges: false,
  });

  const toggleSection = (section: keyof typeof expandedSections) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  const handleCategoryChange = (category: string, checked: boolean) => {
    const currentCategories = filters.category || [];
    const newCategories = checked
      ? [...currentCategories, category]
      : currentCategories.filter(c => c !== category);
    
    onFilterChange({
      ...filters,
      category: newCategories.length > 0 ? newCategories : undefined
    });
  };

  const handleBrandChange = (brand: string, checked: boolean) => {
    const currentBrands = filters.brand || [];
    const newBrands = checked
      ? [...currentBrands, brand]
      : currentBrands.filter(b => b !== brand);
    
    onFilterChange({
      ...filters,
      brand: newBrands.length > 0 ? newBrands : undefined
    });
  };



  const handlePriceRangeChange = (min: number, max: number, checked: boolean) => {
    if (checked) {
      onFilterChange({
        ...filters,
        priceRange: { min, max }
      });
    } else {
      onFilterChange({
        ...filters,
        priceRange: undefined
      });
    }
  };

  const handleWarehouseChange = (warehouse: string, checked: boolean) => {
    const currentWarehouses = filters.warehouse || [];
    const newWarehouses = checked
      ? [...currentWarehouses, warehouse]
      : currentWarehouses.filter(w => w !== warehouse);
    
    onFilterChange({
      ...filters,
      warehouse: newWarehouses.length > 0 ? newWarehouses : undefined
    });
  };

  const handleAccsetChange = (accset: string, checked: boolean) => {
    const currentAccsets = filters.accset || [];
    const newAccsets = checked
      ? [...currentAccsets, accset]
      : currentAccsets.filter(a => a !== accset);
    
    onFilterChange({
      ...filters,
      accset: newAccsets.length > 0 ? newAccsets : undefined
    });
  };

  const handleAvailabilityChange = (availability: string, checked: boolean) => {
    const currentAvailability = filters.availability || [];
    const newAvailability = checked
      ? [...currentAvailability, availability]
      : currentAvailability.filter(a => a !== availability);
    
    onFilterChange({
      ...filters,
      availability: newAvailability.length > 0 ? newAvailability : undefined
    });
  };



  const clearAllFilters = () => {
    onFilterChange({});
  };

  const hasActiveFilters = () => {
    return !!(
      filters.category?.length ||
      filters.brand?.length ||

      filters.priceRange?.min ||
      filters.priceRange?.max ||
      filters.warehouse?.length ||
      filters.accset?.length ||
      filters.availability?.length
    );
  };

  const FilterSection = ({ 
    title, 
    isExpanded, 
    onToggle, 
    children 
  }: { 
    title: string; 
    isExpanded: boolean; 
    onToggle: () => void; 
    children: React.ReactNode;
  }) => (
    <div className="border-b border-gray-200 pb-4 mb-4">
      <button
        onClick={onToggle}
        className="flex items-center justify-between w-full text-left"
      >
        <h3 className="text-sm font-medium text-gray-900">{title}</h3>
        <svg
          className={`w-4 h-4 transform transition-transform ${isExpanded ? 'rotate-180' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      {isExpanded && <div className="mt-3">{children}</div>}
    </div>
  );

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-medium text-gray-900">Filters</h2>
        {hasActiveFilters() && (
          <button
            onClick={clearAllFilters}
            className="text-sm text-blue-600 hover:text-blue-800 font-medium"
          >
            Clear All
          </button>
        )}
      </div>



      {/* Categories Filter */}
      {activeFacets?.categories && activeFacets.categories.length > 0 && (
        <FilterSection
          title="Categories"
          isExpanded={expandedSections.categories}
          onToggle={() => toggleSection('categories')}
        >
          <div className="space-y-2 max-h-48 overflow-y-auto">
            {activeFacets.categories.slice(0, 10).map((category) => (
              <label key={category.value} className="flex items-center">
                <input
                  type="checkbox"
                  checked={filters.category?.includes(category.value) || false}
                  onChange={(e) => handleCategoryChange(category.value, e.target.checked)}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <span className="ml-2 text-sm text-gray-700 flex-1 truncate">
                  {category.value}
                </span>
              </label>
            ))}
          </div>
        </FilterSection>
      )}

      {/* Brands Filter */}
      {activeFacets?.brands && activeFacets.brands.length > 0 && (
        <FilterSection
          title="Brands"
          isExpanded={expandedSections.brands}
          onToggle={() => toggleSection('brands')}
        >
          <div className="space-y-2 max-h-48 overflow-y-auto">
            {activeFacets.brands.slice(0, 10).map((brand) => (
              <label key={brand.value} className="flex items-center">
                <input
                  type="checkbox"
                  checked={filters.brand?.includes(brand.value) || false}
                  onChange={(e) => handleBrandChange(brand.value, e.target.checked)}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <span className="ml-2 text-sm text-gray-700 flex-1 truncate">
                  {brand.value}
                </span>
              </label>
            ))}
          </div>
        </FilterSection>
      )}

      {/* Price Range Filter */}
      {activeFacets?.priceRanges && activeFacets.priceRanges.length > 0 && (
        <FilterSection
          title="Price Range"
          isExpanded={expandedSections.priceRanges}
          onToggle={() => toggleSection('priceRanges')}
        >
          <div className="space-y-2">
            {activeFacets.priceRanges.map((range, index) => (
              <label key={index} className="flex items-center">
                <input
                  type="radio"
                  name="priceRange"
                  checked={filters.priceRange?.min === range.min && filters.priceRange?.max === range.max}
                  onChange={(e) => handlePriceRangeChange(range.min, range.max, e.target.checked)}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                />
                <span className="ml-2 text-sm text-gray-700">
                  ${range.min} - ${range.max}
                </span>
              </label>
            ))}
          </div>
        </FilterSection>
      )}

      {/* Warehouses Filter */}
      {activeFacets?.warehouses && activeFacets.warehouses.length > 0 && (
        <FilterSection
          title="Warehouses"
          isExpanded={expandedSections.warehouses}
          onToggle={() => toggleSection('warehouses')}
        >
          <div className="space-y-2 max-h-32 overflow-y-auto">
            {activeFacets.warehouses.slice(0, 8).map((warehouse) => (
              <label key={warehouse.value} className="flex items-center">
                <input
                  type="checkbox"
                  checked={filters.warehouse?.includes(warehouse.value) || false}
                  onChange={(e) => handleWarehouseChange(warehouse.value, e.target.checked)}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <span className="ml-2 text-sm text-gray-700 flex-1 truncate">
                  {warehouse.value}
                </span>
              </label>
            ))}
          </div>
        </FilterSection>
      )}

      {/* Accsets Filter */}
      {activeFacets?.accsets && activeFacets.accsets.length > 0 && (
        <FilterSection
          title="Accsets"
          isExpanded={expandedSections.accsets}
          onToggle={() => toggleSection('accsets')}
        >
          <div className="space-y-2 max-h-32 overflow-y-auto">
            {activeFacets.accsets.slice(0, 10).map((accset) => (
              <label key={accset.value} className="flex items-center">
                <input
                  type="checkbox"
                  checked={filters.accset?.includes(accset.value) || false}
                  onChange={(e) => handleAccsetChange(accset.value, e.target.checked)}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <span className="ml-2 text-sm text-gray-700 flex-1 truncate">
                  {accset.value}
                </span>
              </label>
            ))}
          </div>
        </FilterSection>
      )}

      {/* Availability Filter */}
      {activeFacets?.availability && activeFacets.availability.length > 0 && (
        <FilterSection
          title="Availability"
          isExpanded={expandedSections.availability}
          onToggle={() => toggleSection('availability')}
        >
          <div className="space-y-2">
            {activeFacets.availability.map((availability) => (
              <label key={availability.value} className="flex items-center">
                <input
                  type="checkbox"
                  checked={filters.availability?.includes(availability.value) || false}
                  onChange={(e) => handleAvailabilityChange(availability.value, e.target.checked)}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <span className="ml-2 text-sm text-gray-700 flex-1 truncate">
                  {availability.value}
                </span>
              </label>
            ))}
          </div>
        </FilterSection>
      )}



      {/* Active Filters Summary */}
      {hasActiveFilters() && (
        <div className="mt-4 pt-4 border-t border-gray-200">
          <h4 className="text-sm font-medium text-gray-900 mb-2">Active Filters</h4>
          <div className="space-y-1">

            {filters.priceRange && (
              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800 mr-1 mb-1">
                ${filters.priceRange.min} - ${filters.priceRange.max}
                <button
                  onClick={() => handlePriceRangeChange(0, 0, false)}
                  className="ml-1 text-green-600 hover:text-green-800"
                >
                  ×
                </button>
              </span>
            )}
            {filters.category?.map((category) => (
              <span
                key={category}
                className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800 mr-1 mb-1"
              >
                {category}
                <button
                  onClick={() => handleCategoryChange(category, false)}
                  className="ml-1 text-gray-600 hover:text-gray-800"
                >
                  ×
                </button>
              </span>
            ))}
            {filters.brand?.map((brand) => (
              <span
                key={brand}
                className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800 mr-1 mb-1"
              >
                {brand}
                <button
                  onClick={() => handleBrandChange(brand, false)}
                  className="ml-1 text-gray-600 hover:text-gray-800"
                >
                  ×
                </button>
              </span>
            ))}
            {filters.warehouse?.map((warehouse) => (
              <span
                key={warehouse}
                className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800 mr-1 mb-1"
              >
                {warehouse}
                <button
                  onClick={() => handleWarehouseChange(warehouse, false)}
                  className="ml-1 text-purple-600 hover:text-purple-800"
                >
                  ×
                </button>
              </span>
            ))}
            {filters.accset?.map((accset) => (
              <span
                key={accset}
                className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800 mr-1 mb-1"
              >
                {accset}
                <button
                  onClick={() => handleAccsetChange(accset, false)}
                  className="ml-1 text-yellow-600 hover:text-yellow-800"
                >
                  ×
                </button>
              </span>
            ))}
            {filters.availability?.map((availability) => (
              <span
                key={availability}
                className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800 mr-1 mb-1"
              >
                {availability}
                <button
                  onClick={() => handleAvailabilityChange(availability, false)}
                  className="ml-1 text-red-600 hover:text-red-800"
                >
                  ×
                </button>
              </span>
            ))}

          </div>
        </div>
      )}
    </div>
  );
}


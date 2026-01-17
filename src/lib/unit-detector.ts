import fs from 'fs';
import path from 'path';

// Cache for units to avoid reading file repeatedly
let cachedUnits: string[] | null = null;

/**
 * Load units from the product-units-array.json file
 */
function loadUnits(): string[] {
  if (cachedUnits) {
    return cachedUnits;
  }

  try {
    const unitsFilePath = path.join(process.cwd(), 'data', 'product-units-array.json');
    const unitsData = fs.readFileSync(unitsFilePath, 'utf8');
    const units = JSON.parse(unitsData);
    
    // Extract unit strings from the JSON structure
    // Assuming the JSON contains an array of unit objects or strings
    cachedUnits = Array.isArray(units) ? units : Object.values(units);
    
    // Normalize units - remove extra spaces, convert to lowercase for matching
    cachedUnits = cachedUnits
      .map(unit => typeof unit === 'string' ? unit.trim() : String(unit).trim())
      .filter(unit => unit.length > 0);
    
    console.log(`📏 Loaded ${cachedUnits.length} units for detection`);
    return cachedUnits;
  } catch (error) {
    console.error('❌ Error loading units file:', error);
    return [];
  }
}

/**
 * Detect units in a search query
 * @param query - The search query string
 * @returns Array of detected unit terms
 */
export function detectUnitsInQuery(query: string): string[] {
  if (!query || typeof query !== 'string') {
    return [];
  }

  const units = loadUnits();
  if (units.length === 0) {
    return [];
  }

  const detectedUnits: string[] = [];
  const normalizedQuery = query.toLowerCase();

  // Sort units by length (descending) to match longer units first
  // This prevents "1/2" from matching before "1/2 in"
  const sortedUnits = [...units].sort((a, b) => b.length - a.length);

  // Find the FIRST (longest) matching unit and return only that one
  // This avoids multiple overlapping units like "1/4 in", "4 in", "1/4", "in"
  for (const unit of sortedUnits) {
    const normalizedUnit = unit.toLowerCase();
    
    // Check for exact word boundaries to avoid partial matches
    const regex = new RegExp(`\\b${escapeRegExp(normalizedUnit)}\\b`, 'i');
    
    if (regex.test(normalizedQuery)) {
      // Return only the first (longest/most specific) matching unit
      detectedUnits.push(unit);
      break; // Stop after finding the first match to avoid overlaps
    }
  }

  if (detectedUnits.length > 0) {
    console.log(`📏 Detected units in query "${query}":`, detectedUnits);
  }

  return detectedUnits;
}

/**
 * Escape special regex characters in a string
 */
function escapeRegExp(string: string): string {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Extract unit terms from a query for filtering
 * This function can be enhanced to handle complex unit patterns
 * @param query - The search query
 * @returns Object with detected units and cleaned query
 */
export function extractUnitsForFiltering(query: string): {
  detectedUnits: string[];
  originalQuery: string;
  queryWithoutUnits?: string;
} {
  const detectedUnits = detectUnitsInQuery(query);
  
  // Optionally, you could create a cleaned query with units removed
  // but for now, we'll keep the original query intact
  let queryWithoutUnits = query;
  
  // Remove detected units from query if needed
  for (const unit of detectedUnits) {
    const regex = new RegExp(`\\b${escapeRegExp(unit)}\\b`, 'gi');
    queryWithoutUnits = queryWithoutUnits.replace(regex, '').trim();
  }
  
  // Clean up extra spaces
  queryWithoutUnits = queryWithoutUnits.replace(/\s+/g, ' ').trim();

  return {
    detectedUnits,
    originalQuery: query,
    queryWithoutUnits: queryWithoutUnits !== query ? queryWithoutUnits : undefined
  };
}

/**
 * Clear the units cache (useful for testing or if units file is updated)
 */
export function clearUnitsCache(): void {
  cachedUnits = null;
}

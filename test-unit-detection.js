// Quick test to verify unit detection is working
const fs = require('fs');
const path = require('path');

// Simulate the unit detection logic
function loadUnits() {
  try {
    const unitsFilePath = path.join(process.cwd(), 'data', 'product-units-array.json');
    const unitsData = fs.readFileSync(unitsFilePath, 'utf8');
    const units = JSON.parse(unitsData);
    
    // Extract unit strings from the JSON structure
    const cachedUnits = Array.isArray(units) ? units : Object.values(units);
    
    // Normalize units - remove extra spaces, convert to lowercase for matching
    return cachedUnits
      .map(unit => typeof unit === 'string' ? unit.trim() : String(unit).trim())
      .filter(unit => unit.length > 0);
  } catch (error) {
    console.error('❌ Error loading units file:', error);
    return [];
  }
}

function detectUnitsInQuery(query) {
  const units = loadUnits();
  console.log(`📏 Loaded ${units.length} units from JSON file`);
  console.log('First 10 units:', units.slice(0, 10));
  
  if (units.length === 0) {
    return [];
  }

  const detectedUnits = [];
  const normalizedQuery = query.toLowerCase();
  console.log('🔍 Searching for units in query:', normalizedQuery);

  // Sort units by length (descending) to match longer units first
  const sortedUnits = [...units].sort((a, b) => b.length - a.length);

  for (const unit of sortedUnits) {
    const normalizedUnit = unit.toLowerCase();
    
    // Check for exact word boundaries to avoid partial matches
    const regex = new RegExp(`\\b${escapeRegExp(normalizedUnit)}\\b`, 'i');
    
    if (regex.test(normalizedQuery)) {
      console.log(`✅ Found unit match: "${unit}" in query "${query}"`);
      if (!detectedUnits.includes(unit)) {
        detectedUnits.push(unit);
      }
    }
  }

  return detectedUnits;
}

function escapeRegExp(string) {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

// Test cases
const testQueries = [
  '1/4',
  '1/4 in',
  '1/4 inch',
  '1/2 in drill bit',
  'wooden box',
  '3/4 socket'
];

console.log('🧪 Testing unit detection...\n');

testQueries.forEach(query => {
  console.log(`\n🔍 Testing query: "${query}"`);
  const detected = detectUnitsInQuery(query);
  console.log(`📏 Detected units:`, detected);
  console.log('---');
});

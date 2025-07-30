#!/usr/bin/env node

/**
 * Script to add an 'allergens' field to each product in Stockextract.json, based on product details.
 * Usage: node add-allergens-to-stock.js [inputJson] [outputJson]
 * Defaults: ./Stockextract.json -> ./Stockextract_with_allergens.json
 */

const fs = require('fs');
const path = require('path');

const inputJson = process.argv[2] || path.join(process.cwd(), 'Stockextract.json');
const outputJson = process.argv[3] || path.join(process.cwd(), 'Stockextract_with_allergens.json');

// Common allergens and their keywords
const allergenMap = [
  { keyword: /egg|eggs?/i, allergen: 'egg' },
  { keyword: /milk|cream|cheese|butter|yogurt|dairy/i, allergen: 'milk' },
  { keyword: /peanut|groundnut/i, allergen: 'peanut' },
  { keyword: /tree nut|almond|cashew|hazelnut|walnut|pecan|pistachio|macadamia/i, allergen: 'tree nut' },
  { keyword: /soy|soya|soybean/i, allergen: 'soy' },
  { keyword: /wheat|gluten|flour|bread|barley|rye|oats/i, allergen: 'wheat' },
  { keyword: /fish|salmon|tuna|cod|snapper|hoki/i, allergen: 'fish' },
  { keyword: /shellfish|crab|lobster|shrimp|prawn|scallop|clam|oyster|mussel/i, allergen: 'shellfish' },
  { keyword: /sesame/i, allergen: 'sesame' },
  { keyword: /mustard/i, allergen: 'mustard' },
  { keyword: /celery/i, allergen: 'celery' },
  { keyword: /sulphite|sulfite|sulphur dioxide/i, allergen: 'sulphite' },
  { keyword: /lupin/i, allergen: 'lupin' },
  { keyword: /mollusc|mollusk/i, allergen: 'mollusc' }
  // Add more as needed
];

function extractAllergens(details) {
  if (!details) return [];
  const found = allergenMap.filter(({ keyword }) => keyword.test(details));
  return found.map(({ allergen }) => allergen);
}

function enrichWithAllergens(products) {
  return products.map(product => {
    // Use relevant fields for matching
    const details = [product.Description, product.Name, product.Details, product.Product_Description__c, product.Product_Name__c]
      .filter(Boolean)
      .join(' ');
    const allergens = extractAllergens(details);
    if (allergens.length > 0) {
      return { ...product, allergens };
    } else {
      // Do not add the field if empty
      return { ...product };
    }
  });
}

try {
  const products = JSON.parse(fs.readFileSync(inputJson, 'utf-8'));
  const enriched = enrichWithAllergens(products);
  fs.writeFileSync(outputJson, JSON.stringify(enriched, null, 2), 'utf-8');
  console.log(`✅ Wrote ${enriched.length} records to ${outputJson}`);
} catch (err) {
  console.error('❌ Error processing file:', err);
  process.exit(1);
}

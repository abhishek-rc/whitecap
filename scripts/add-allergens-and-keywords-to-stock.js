#!/usr/bin/env node

/**
 * Script to add both 'allergens' and 'searchKeywords' fields to each product in Stockextract.json.
 * Usage: node add-allergens-and-keywords-to-stock.js [inputJson] [outputJson]
 * Defaults: ./Stockextract.json -> ./Stockextract_with_allergens_keywords.json
 */

const fs = require('fs');
const path = require('path');

const inputJson = process.argv[2] || path.join(process.cwd(), 'Stockextract.json');
const outputJson = process.argv[3] || path.join(process.cwd(), 'Stockextract_with_allergens_keywords.json');

// Allergen detection
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
];

function extractAllergens(details) {
  if (!details) return [];
  const found = allergenMap.filter(({ keyword }) => keyword.test(details));
  return found.map(({ allergen }) => allergen);
}

// Keyword enrichment
const synonymMap = [
  { match: /ajwain/i, add: ['carom', 'carom seeds', 'ajwain'] },
  { match: /carom/i, add: ['ajwain', 'carom', 'carom seeds'] },
  { match: /vegan cheese/i, add: ['dairy free cheese', 'nut cheese', 'vegan cheese'] },
  { match: /sugar[ -]?free/i, add: ['sugar free', 'no sugar', 'diabetic'] },
  { match: /gluten[ -]?free/i, add: ['gluten free', 'no gluten', 'celiac'] },
  { match: /organic/i, add: ['organic', 'natural', 'bio'] },
  { match: /oat/i, add: ['oat', 'oats', 'healthy grain'] },
  { match: /healthy/i, add: ['healthy', 'nutritious', 'wellness'] },
  { match: /cracker/i, add: ['cracker', 'crackers', 'biscuit', 'biscuits'] },
  { match: /cereal/i, add: ['cereal', 'breakfast cereal', 'grain'] },
  { match: /biscuit/i, add: ['biscuit', 'biscuits', 'cookie', 'cookies'] },
  { match: /cheese/i, add: ['cheese', 'dairy free cheese', 'nut cheese'] },
];

function enrichKeywords(product) {
  let keywords = [];
  if (Array.isArray(product.searchKeywords)) {
    keywords = [...product.searchKeywords];
  } else if (product.searchKeywords) {
    keywords = [product.searchKeywords];
  }
  if (product.SUGARFREE__c === 'true' || /sugar[ -]?free/i.test(product.Description || '')) {
    keywords.push('sugar free', 'no sugar', 'diabetic');
  }
  if (product.VEGAN__c === 'true' || /vegan/i.test(product.Description || '')) {
    keywords.push('vegan', 'dairy free', 'plant-based');
    if (/cheese/i.test(product.Name || product.Product_Name__c || '')) {
      keywords.push('dairy free cheese', 'nut cheese');
    }
  }
  if (product.GLUTENFREE__c === 'true' || /gluten[ -]?free/i.test(product.Description || '')) {
    keywords.push('gluten free', 'no gluten', 'celiac');
  }
  if (product.ORGANIC__c === 'true' || /organic/i.test(product.Description || '')) {
    keywords.push('organic', 'natural', 'bio');
  }
  const details = [product.Description, product.Name, product.Product_Name__c, product.Product_Description__c]
    .filter(Boolean)
    .join(' ');
  synonymMap.forEach(({ match, add }) => {
    if (match.test(details)) {
      keywords.push(...add);
    }
  });
  keywords = Array.from(new Set(keywords.map(k => k.toLowerCase().trim())));
  return keywords.length > 0 ? keywords : undefined;
}

function enrichProduct(product) {
  const details = [product.Description, product.Name, product.Details, product.Product_Description__c, product.Product_Name__c]
    .filter(Boolean)
    .join(' ');
  const allergens = extractAllergens(details);
  const searchKeywords = enrichKeywords(product);
  const enriched = { ...product };
  if (allergens.length > 0) enriched.allergens = allergens;
  if (searchKeywords && searchKeywords.length > 0) enriched.searchKeywords = searchKeywords;
  return enriched;
}

try {
  const products = JSON.parse(fs.readFileSync(inputJson, 'utf-8'));
  const enriched = products.map(enrichProduct);
  fs.writeFileSync(outputJson, JSON.stringify(enriched, null, 2), 'utf-8');
  console.log(`✅ Wrote ${enriched.length} records to ${outputJson}`);
} catch (err) {
  console.error('❌ Error processing file:', err);
  process.exit(1);
}

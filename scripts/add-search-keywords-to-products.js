#!/usr/bin/env node

/**
 * Script to enrich product data with searchKeywords for better semantic and synonym matching.
 * Usage: node add-search-keywords-to-products.js [inputJson] [outputJson]
 * Defaults: ./Stockextract.json -> ./Stockextract_with_keywords.json
 */

const fs = require('fs');
const path = require('path');

const inputJson = process.argv[2] || path.join(process.cwd(), 'Stockextract.json');
const outputJson = process.argv[3] || path.join(process.cwd(), 'Stockextract_with_keywords.json');

const synonymMap = [
  // Ajwain/Carom seeds
  { match: /ajwain/i, add: ['carom', 'carom seeds', 'ajwain'] },
  { match: /carom/i, add: ['ajwain', 'carom', 'carom seeds'] },
  // Vegan cheese
  { match: /vegan cheese/i, add: ['dairy free cheese', 'nut cheese', 'vegan cheese'] },
  // Sugar free
  { match: /sugar[ -]?free/i, add: ['sugar free', 'no sugar', 'diabetic'] },
  // Gluten free
  { match: /gluten[ -]?free/i, add: ['gluten free', 'no gluten', 'celiac'] },
  // Organic
  { match: /organic/i, add: ['organic', 'natural', 'bio'] },
  // Oat
  { match: /oat/i, add: ['oat', 'oats', 'healthy grain'] },
  // Healthy
  { match: /healthy/i, add: ['healthy', 'nutritious', 'wellness'] },
  // Crackers
  { match: /cracker/i, add: ['cracker', 'crackers', 'biscuit', 'biscuits'] },
  // Cereal
  { match: /cereal/i, add: ['cereal', 'breakfast cereal', 'grain'] },
  // Biscuits
  { match: /biscuit/i, add: ['biscuit', 'biscuits', 'cookie', 'cookies'] },
  // Cheese
  { match: /cheese/i, add: ['cheese', 'dairy free cheese', 'nut cheese'] },
];

function enrichKeywords(product) {
  // Start with existing searchKeywords or []
  let keywords = [];
  if (Array.isArray(product.searchKeywords)) {
    keywords = [...product.searchKeywords];
  } else if (product.searchKeywords) {
    keywords = [product.searchKeywords];
  }

  // Add from boolean tags
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

  // Synonym/semantic expansion from name/description
  const details = [product.Description, product.Name, product.Product_Name__c, product.Product_Description__c]
    .filter(Boolean)
    .join(' ');
  synonymMap.forEach(({ match, add }) => {
    if (match.test(details)) {
      keywords.push(...add);
    }
  });

  // Remove duplicates
  keywords = Array.from(new Set(keywords.map(k => k.toLowerCase().trim())));

  // Only add if non-empty
  if (keywords.length > 0) {
    return { ...product, searchKeywords: keywords };
  } else {
    return { ...product };
  }
}

try {
  const products = JSON.parse(fs.readFileSync(inputJson, 'utf-8'));
  const enriched = products.map(enrichKeywords);
  fs.writeFileSync(outputJson, JSON.stringify(enriched, null, 2), 'utf-8');
  console.log(`✅ Wrote ${enriched.length} records to ${outputJson}`);
} catch (err) {
  console.error('❌ Error processing file:', err);
  process.exit(1);
}

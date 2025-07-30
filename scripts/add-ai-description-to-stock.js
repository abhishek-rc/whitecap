#!/usr/bin/env node

/**
 * Script to add an AI-generated natural language description to each product, summarizing its attributes for better search.
 * Usage: node add-ai-description-to-stock.js [inputJson] [outputJson]
 * Defaults: ./Stockextract_with_allergens_keywords.json -> ./Stockextract_with_aidescription.json
 */

const fs = require('fs');
const path = require('path');

const inputJson = process.argv[2] || path.join(process.cwd(), 'Stockextract_with_allergens_keywords.json');
const outputJson = process.argv[3] || path.join(process.cwd(), 'Stockextract_with_aidescription.json');

function buildAIDescription(product) {
  const phrases = [];

  // Vegan
  if (product.VEGAN__c === 'true' || (product.searchKeywords && product.searchKeywords.includes('vegan'))) {
    phrases.push('Vegan');
  }
  // Gluten free
  if (product.GLUTENFREE__c === 'true' || (product.searchKeywords && product.searchKeywords.includes('gluten free'))) {
    phrases.push('Gluten free');
  }
  // Sugar free
  if (product.SUGARFREE__c === 'true' || (product.searchKeywords && product.searchKeywords.includes('sugar free'))) {
    phrases.push('Sugar free');
  }
  // Organic
  if (product.ORGANIC__c === 'true' || (product.searchKeywords && product.searchKeywords.includes('organic'))) {
    phrases.push('Organic');
  }
  // Nut free / Contains nuts
  if (product.allergens && product.allergens.some(a => a.includes('nut') || a === 'peanut' || a === 'tree nut')) {
    phrases.push('Contains nuts');
  } else if (product.searchKeywords && (product.searchKeywords.includes('nut free') || product.searchKeywords.includes('nutfree'))) {
    phrases.push('Nut free');
  }
  // Dairy free / Contains dairy
  if (product.searchKeywords && product.searchKeywords.includes('dairy free')) {
    phrases.push('Dairy free');
  } else if (product.allergens && product.allergens.includes('milk')) {
    phrases.push('Contains dairy');
  }
  // Contains egg
  if (product.allergens && product.allergens.includes('egg')) {
    phrases.push('Contains egg');
  }
  // Contains soy
  if (product.allergens && product.allergens.includes('soy')) {
    phrases.push('Contains soy');
  }
  // Contains wheat/gluten
  if (product.allergens && (product.allergens.includes('wheat') || product.allergens.includes('gluten'))) {
    phrases.push('Contains gluten');
  }

  // Main description
  let desc = '';
  if (product.Product_Description__c) desc = product.Product_Description__c;
  else if (product.Description) desc = product.Description;
  else if (product.Name) desc = product.Name;

  // Compose the AI description
  let aiDescription = '';
  if (phrases.length > 0) {
    aiDescription = phrases.join(', ') + '. ';
  }
  if (desc) {
    aiDescription += desc;
  }
  if (!aiDescription) {
    aiDescription = 'No detailed description available.';
  }
  return aiDescription;
}

try {
  const products = JSON.parse(fs.readFileSync(inputJson, 'utf-8'));
  const enriched = products.map(product => ({
    ...product,
    aiDescription: buildAIDescription(product)
  }));
  fs.writeFileSync(outputJson, JSON.stringify(enriched, null, 2), 'utf-8');
  console.log(`✅ Wrote ${enriched.length} records to ${outputJson}`);
} catch (err) {
  console.error('❌ Error processing file:', err);
  process.exit(1);
}

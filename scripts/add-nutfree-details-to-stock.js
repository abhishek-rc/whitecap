#!/usr/bin/env node

/**
 * Script to add nut/nut-free details to each product in Stockextract_with_allergens_keywords.json.
 * Usage: node add-nutfree-details-to-stock.js [inputJson] [outputJson]
 * Defaults: ./Stockextract_with_allergens_keywords.json -> ./Stockextract_with_nutfree_details.json
 */

const fs = require('fs');
const path = require('path');

const inputJson = process.argv[2] || path.join(process.cwd(), 'Stockextract_with_allergens_keywords.json');
const outputJson = process.argv[3] || path.join(process.cwd(), 'Stockextract_with_nutfree_details.json');

const nutKeywords = [
  'almond', 'cashew', 'hazelnut', 'walnut', 'pecan', 'pistachio', 'macadamia', 'brazil nut', 'peanut', 'tree nut', 'nut', 'nuts'
];

function hasNut(details) {
  if (!details) return false;
  return nutKeywords.some(kw => new RegExp(`\\b${kw}\\b`, 'i').test(details));
}

function addNutDetails(product) {
  const details = [product.Description, product.Name, product.Product_Name__c, product.Product_Description__c]
    .filter(Boolean)
    .join(' ');
  let nutDetail = '';
  if (hasNut(details)) {
    nutDetail = 'This product contains nuts or nut ingredients.';
  } else if ((/biscuit|cookie|cracker/i.test(details)) && !hasNut(details)) {
    nutDetail = 'This product is nut-free.';
  }
  // Only add if non-empty
  if (nutDetail) {
    return { ...product, nutInfo: nutDetail };
  } else {
    return { ...product };
  }
}

try {
  const products = JSON.parse(fs.readFileSync(inputJson, 'utf-8'));
  const enriched = products.map(addNutDetails);
  fs.writeFileSync(outputJson, JSON.stringify(enriched, null, 2), 'utf-8');
  console.log(`✅ Wrote ${enriched.length} records to ${outputJson}`);
} catch (err) {
  console.error('❌ Error processing file:', err);
  process.exit(1);
}

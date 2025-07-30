#!/usr/bin/env node

/**
 * Script to add an 'ingredients' field to each product in Stockextract.json, based on product details.
 * Usage: node add-ingredients-to-stock.js [inputJson] [outputJson]
 * Defaults: ./Stockextract.json -> ./Stockextract_with_ingredients.json
 */

const fs = require('fs');
const path = require('path');

const inputJson = process.argv[2] || path.join(process.cwd(), 'Stockextract.json');
const outputJson = process.argv[3] || path.join(process.cwd(), 'Stockextract_with_ingredients.json');

// Simple keyword-to-ingredient mapping (expand this as needed)
const ingredientMap = [
  { keyword: /chicken|poulet/i, ingredient: 'chicken' },
  { keyword: /beef|steak|angus/i, ingredient: 'beef' },
  { keyword: /lamb/i, ingredient: 'lamb' },
  { keyword: /pork|bacon|ham/i, ingredient: 'pork' },
  { keyword: /fish|salmon|snapper|cod|hoki|tuna/i, ingredient: 'fish' },
  { keyword: /shrimp|prawn/i, ingredient: 'shrimp' },
  { keyword: /egg/i, ingredient: 'egg' },
  { keyword: /cheese|cheddar|mozzarella|feta/i, ingredient: 'cheese' },
  { keyword: /milk|cream/i, ingredient: 'milk' },
  { keyword: /butter/i, ingredient: 'butter' },
  { keyword: /rice/i, ingredient: 'rice' },
  { keyword: /potato/i, ingredient: 'potato' },
  { keyword: /tomato/i, ingredient: 'tomato' },
  { keyword: /lettuce/i, ingredient: 'lettuce' },
  { keyword: /carrot/i, ingredient: 'carrot' },
  { keyword: /onion/i, ingredient: 'onion' },
  { keyword: /garlic/i, ingredient: 'garlic' },
  { keyword: /soy/i, ingredient: 'soy' },
  { keyword: /wheat|flour|bread/i, ingredient: 'wheat' },
  { keyword: /corn/i, ingredient: 'corn' },
  { keyword: /pea/i, ingredient: 'pea' },
  { keyword: /apple/i, ingredient: 'apple' },
  { keyword: /banana/i, ingredient: 'banana' },
  { keyword: /strawberry/i, ingredient: 'strawberry' },
  { keyword: /almond/i, ingredient: 'almond' },
  { keyword: /cashew/i, ingredient: 'cashew' },
  { keyword: /hazelnut/i, ingredient: 'hazelnut' },
  { keyword: /peanut/i, ingredient: 'peanut' },
  { keyword: /walnut/i, ingredient: 'walnut' },
  { keyword: /pistachio/i, ingredient: 'pistachio' },
  { keyword: /cocoa|chocolate/i, ingredient: 'cocoa' },
  { keyword: /vanilla/i, ingredient: 'vanilla' },
  // Add more as needed
];

function extractIngredients(details) {
  if (!details) return [];
  const found = ingredientMap.filter(({ keyword }) => keyword.test(details));
  return found.map(({ ingredient }) => ingredient);
}

function enrichWithIngredients(products) {
  return products.map(product => {
    // Try to use description, name, or details fields
    const details = [product.Description, product.Name, product.Details, product.Product_Description__c]
      .filter(Boolean)
      .join(' ');
    const ingredients = extractIngredients(details);
    if (ingredients.length > 0) {
      return { ...product, ingredients };
    } else {
      // Do not add the field if empty
      return { ...product };
    }
  });
}

try {
  const products = JSON.parse(fs.readFileSync(inputJson, 'utf-8'));
  const enriched = enrichWithIngredients(products);
  fs.writeFileSync(outputJson, JSON.stringify(enriched, null, 2), 'utf-8');
  console.log(`✅ Wrote ${enriched.length} records to ${outputJson}`);
} catch (err) {
  console.error('❌ Error processing file:', err);
  process.exit(1);
}

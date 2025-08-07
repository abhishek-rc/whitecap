#!/usr/bin/env node

/**
 * Utility script to verify that your product data has sufficient sale pricing
 * for Vertex AI Sale Model requirements (at least 10 items with price < originalPrice)
 */

const fs = require('fs');
const path = require('path');

function analyzePricingData(products) {
  const saleItems = [];
  const regularItems = [];
  const invalidItems = [];

  products.forEach((product, index) => {
    const { priceInfo } = product;
    
    if (!priceInfo || typeof priceInfo.price === 'undefined') {
      invalidItems.push({
        index,
        id: product.id,
        issue: 'Missing price information'
      });
      return;
    }

    if (priceInfo.originalPrice && priceInfo.price < priceInfo.originalPrice) {
      saleItems.push({
        index,
        id: product.id,
        price: priceInfo.price,
        originalPrice: priceInfo.originalPrice,
        discount: ((priceInfo.originalPrice - priceInfo.price) / priceInfo.originalPrice * 100).toFixed(1)
      });
    } else {
      regularItems.push({
        index,
        id: product.id,
        price: priceInfo.price,
        originalPrice: priceInfo.originalPrice || null
      });
    }
  });

  return {
    saleItems,
    regularItems,
    invalidItems,
    totalProducts: products.length
  };
}

function generateReport(analysis) {
  console.log('\n' + '='.repeat(60));
  console.log('🔍 VERTEX AI SALE PRICING ANALYSIS REPORT');
  console.log('='.repeat(60));
  
  console.log(`\n📊 SUMMARY:`);
  console.log(`   Total Products: ${analysis.totalProducts}`);
  console.log(`   ✅ Sale Items (price < originalPrice): ${analysis.saleItems.length}`);
  console.log(`   📦 Regular Items: ${analysis.regularItems.length}`);
  console.log(`   ❌ Invalid Items: ${analysis.invalidItems.length}`);
  
  // Check Vertex AI requirements
  const minRequired = 10;
  const hasEnoughSaleItems = analysis.saleItems.length >= minRequired;
  
  console.log(`\n🎯 VERTEX AI SALE MODEL REQUIREMENTS:`);
  console.log(`   Required minimum sale items: ${minRequired}`);
  console.log(`   Current sale items: ${analysis.saleItems.length}`);
  console.log(`   Status: ${hasEnoughSaleItems ? '✅ PASSED' : '❌ FAILED'}`);
  
  if (!hasEnoughSaleItems) {
    console.log(`   ⚠️  Need ${minRequired - analysis.saleItems.length} more sale items!`);
  }
  
  // Show sample sale items
  if (analysis.saleItems.length > 0) {
    console.log(`\n💰 SAMPLE SALE ITEMS (first 5):`);
    analysis.saleItems.slice(0, 5).forEach((item, i) => {
      console.log(`   ${i + 1}. ${item.id}: $${item.price} (was $${item.originalPrice}) - ${item.discount}% off`);
    });
  }
  
  // Show invalid items if any
  if (analysis.invalidItems.length > 0) {
    console.log(`\n❌ INVALID ITEMS:`);
    analysis.invalidItems.slice(0, 5).forEach((item, i) => {
      console.log(`   ${i + 1}. ${item.id}: ${item.issue}`);
    });
  }
  
  console.log('\n' + '='.repeat(60));
  
  return hasEnoughSaleItems;
}

async function main() {
  try {
    // Look for product JSON files in common locations
    const possibleFiles = [
      '../whitecap-vertex-ai-products.json',
      'transformed-products.json',
      'vertex-ai-products.json',
      'products.json',
      'data/products.json',
      'scripts/transformed-products.json'
    ];
    
    let productFile = null;
    for (const file of possibleFiles) {
      if (fs.existsSync(file)) {
        productFile = file;
        break;
      }
    }
    
    if (!productFile) {
      console.error('❌ No product JSON file found. Looking for one of:');
      possibleFiles.forEach(f => console.error(`   - ${f}`));
      console.error('\nPlease run your data transformation script first.');
      process.exit(1);
    }
    
    console.log(`📁 Reading product data from: ${productFile}`);
    const fileContent = JSON.parse(fs.readFileSync(productFile, 'utf8'));
    
    // Handle both direct array and structured format
    let products;
    if (Array.isArray(fileContent)) {
      products = fileContent;
    } else if (fileContent.products && Array.isArray(fileContent.products)) {
      products = fileContent.products;
      console.log(`📊 File contains ${fileContent.metadata?.totalProducts || products.length} products with metadata`);
    } else {
      console.error('❌ Product file does not contain a valid array of products');
      console.error('Expected either an array or an object with a "products" array property');
      process.exit(1);
    }
    
    const analysis = analyzePricingData(products);
    const isValid = generateReport(analysis);
    
    // Save detailed analysis
    const reportFile = `pricing-analysis-${Date.now()}.json`;
    fs.writeFileSync(reportFile, JSON.stringify(analysis, null, 2));
    console.log(`💾 Detailed analysis saved to: ${reportFile}`);
    
    if (!isValid) {
      console.log('\n🔧 RECOMMENDATION:');
      console.log('   Run your data transformation script again with the updated pricing logic');
      console.log('   The scripts have been modified to create more sale items (80% chance vs 70%)');
      process.exit(1);
    } else {
      console.log('\n🎉 Your data is ready for Vertex AI Sale Model!');
      process.exit(0);
    }
    
  } catch (error) {
    console.error('❌ Error analyzing pricing data:', error);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = { analyzePricingData, generateReport };
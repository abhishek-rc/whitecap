#!/usr/bin/env node

/**
 * Update product prices in Productextract.csv with random prices and overwrite the CSV.
 * To be run before upload-to-vertex-ai.js to update prices in Vertex AI.
 */
const fs = require('fs');
const path = require('path');
const csv = require('csv-parser');
const { parse } = require('json2csv');

const productDataPath = path.join(__dirname, '..', 'Productextract.csv');

function getRandomPrice() {
  // Generate a random price between 5 and 100, two decimals
  return (Math.random() * 95 + 5).toFixed(2);
}

async function updatePricesInCSV() {
  if (!fs.existsSync(productDataPath)) {
    throw new Error(`Product data file not found: ${productDataPath}`);
  }

  const products = [];
  // Read CSV
  await new Promise((resolve, reject) => {
    fs.createReadStream(productDataPath)
      .pipe(csv())
      .on('data', (row) => {
        // Update price fields if present
        if ('Price' in row) {
          row.Price = getRandomPrice();
        } else if ('price' in row) {
          row.price = getRandomPrice();
        }
        products.push(row);
      })
      .on('end', resolve)
      .on('error', reject);
  });

  // Write back to CSV
  const csvString = parse(products, { fields: Object.keys(products[0]) });
  fs.writeFileSync(productDataPath, csvString);
  console.log(`✅ Updated prices for ${products.length} products in Productextract.csv`);
}

if (require.main === module) {
  updatePricesInCSV().catch(console.error);
}

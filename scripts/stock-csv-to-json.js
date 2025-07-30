#!/usr/bin/env node

/**
 * Script to read Stockextract.csv and output a JSON file with its data.
 * Usage: node stock-csv-to-json.js [inputCsvPath] [outputJsonPath]
 * Defaults: ../Stockextract.csv -> ./Stockextract.json
 */

const fs = require('fs');
const path = require('path');
const csv = require('csv-parser');

const inputCsv = process.argv[2] || path.join(__dirname, '..', 'Stockextract.csv').replace('..', process.cwd());
const outputJson = process.argv[3] || path.join(process.cwd(), 'Stockextract.json');

const results = [];

fs.createReadStream(inputCsv)
  .pipe(csv())
  .on('data', (data) => results.push(data))
  .on('end', () => {
    fs.writeFileSync(outputJson, JSON.stringify(results, null, 2), 'utf-8');
    console.log(`✅ Wrote ${results.length} records to ${outputJson}`);
  })
  .on('error', (err) => {
    console.error('❌ Error reading CSV:', err);
    process.exit(1);
  });

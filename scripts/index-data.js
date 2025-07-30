#!/usr/bin/env node

/**
 * Data Indexing Script for Vertex AI Search
 * Uploads product data from CSV files to Google Cloud Vertex AI Search
 */

const fs = require('fs');
const path = require('path');
const csv = require('csv-parser');

// Configuration
const PROJECT_ID = process.env.GOOGLE_CLOUD_PROJECT_ID || 'whitecap-us';
const LOCATION = process.env.VERTEX_AI_LOCATION || 'global';
const DATA_STORE_ID = process.env.VERTEX_AI_DATA_STORE_ID || 'whitecap-products';
console.log(`Using Project ID: ${PROJECT_ID}`, `Location: ${LOCATION}`, `Data Store ID: ${DATA_STORE_ID}`);
// File paths
const PRODUCTS_CSV = path.join(__dirname, '../Productextract.csv');
const STOCK_CSV = path.join(__dirname, '../Stockextract.csv');

// ANSI color codes
const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  reset: '\x1b[0m',
  bold: '\x1b[1m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function logSuccess(message) {
  log(`✅ ${message}`, 'green');
}

function logError(message) {
  log(`❌ ${message}`, 'red');
}

function logInfo(message) {
  log(`ℹ️  ${message}`, 'blue');
}

function logWarning(message) {
  log(`⚠️  ${message}`, 'yellow');
}

async function readCSV(filePath) {
  return new Promise((resolve, reject) => {
    const results = [];
    
    if (!fs.existsSync(filePath)) {
      reject(new Error(`File not found: ${filePath}`));
      return;
    }
    
    fs.createReadStream(filePath)
      .pipe(csv())
      .on('data', (data) => results.push(data))
      .on('end', () => resolve(results))
      .on('error', reject);
  });
}

function transformProductForVertexAI(product, stockData = []) {
  // Clean and transform product data for Vertex AI Search
  const keywords = [];
  
  // Extract keywords from various fields
  if (product.DisplayName) {
    keywords.push(...product.DisplayName.toLowerCase().split(/\s+/));
  }
  if (product.Description) {
    keywords.push(...product.Description.toLowerCase().split(/\s+/));
  }
  if (product.Brand) {
    keywords.push(product.Brand.toLowerCase());
  }
  if (product.Category) {
    keywords.push(product.Category.toLowerCase());
  }
  
  // Remove duplicates and filter out short words
  const uniqueKeywords = [...new Set(keywords)]
    .filter(keyword => keyword.length > 2)
    .slice(0, 20); // Limit to 20 keywords
  
  // Calculate total stock across all warehouses
  const productStock = stockData.filter(stock => stock.SKU === product.SKU);
  const totalStock = productStock.reduce((sum, stock) => {
    return sum + (parseInt(stock.AvailableQuantity) || 0);
  }, 0);
  
  // Determine availability status
  let availability = 'Unknown';
  if (totalStock > 0) {
    availability = 'Available';
  } else if (productStock.length > 0) {
    availability = 'Out of Stock';
  } else {
    availability = 'Not Available';
  }
  
  return {
    // Core identifiers
    sku: product.SKU,
    id: product.SKU,
    
    // Product information
    displayName: product.DisplayName || '',
    description: product.Description || '',
    brand: product.Brand || '',
    category: product.Category || '',
    webCategory: product.WebCategory || product.Category || '',
    webSubCategory: product.WebSubCategory || '',
    
    // Product attributes
    units: product.Units || '',
    accset: product.Accset || '',
    vendor: product.Vendor || '',
    vendorName: product.VendorName || product.Vendor || '',
    
    // Status flags
    isSFPreferred: (product.SFPreferred || '').toLowerCase() === 'true' || 
                   (product.DisplayName || '').includes('SF') ||
                   (product.Brand || '').includes('SF'),
    isActive: (product.Active || 'true').toLowerCase() === 'true',
    availability: availability,
    
    // Stock information
    totalStock: totalStock,
    stockWarehouses: productStock.length,
    
    // Image
    imageURL: product.ImageURL || `https://sfostoragelive.blob.core.windows.net/assets/products/${product.SKU}.jpg`,
    
    // Search optimization
    keywords: uniqueKeywords,
    searchText: [
      product.DisplayName,
      product.Description,
      product.Brand,
      product.Category,
      product.WebCategory,
      product.WebSubCategory,
      product.SKU,
      ...uniqueKeywords
    ].filter(Boolean).join(' ').toLowerCase(),
    
    // Metadata
    lastUpdated: new Date().toISOString(),
    dataSource: 'csv_import'
  };
}

async function createVertexAIDataStore() {
  logInfo('Creating Vertex AI Search data store...');
  
  // This would typically be done via gcloud CLI or Cloud Console
  // For automation, you could use the Google Cloud Admin API
  
  const gcloudCommand = `
gcloud alpha discovery-engine data-stores create \\
  --data-store-id="${DATA_STORE_ID}" \\
  --display-name="Whitecap Products" \\
  --industry-vertical=GENERIC \\
  --content-config=CONTENT_REQUIRED \\
  --solution-type=SOLUTION_TYPE_SEARCH \\
  --location="${LOCATION}" \\
  --project="${PROJECT_ID}"
`;

  logInfo('To create the data store, run this gcloud command:');
  log(gcloudCommand, 'cyan');
  
  return true;
}

async function createVertexAISearchEngine() {
  logInfo('Creating Vertex AI Search engine...');
  
  const gcloudCommand = `
gcloud alpha discovery-engine engines create \\
      --engine-id="whitecap-us-engine" \\
    --display-name="Whitecap Search Engine" \\
  --data-store-ids="${DATA_STORE_ID}" \\
  --industry-vertical=GENERIC \\
  --location="${LOCATION}" \\
  --project="${PROJECT_ID}"
`;

  logInfo('To create the search engine, run this gcloud command:');
  log(gcloudCommand, 'cyan');
  
  return true;
}

async function uploadToVertexAI(documents, batchSize = 100) {
  logInfo(`Uploading ${documents.length} documents to Vertex AI Search...`);
  
  // For this POC, we'll create JSONL files that can be uploaded via gcloud
  const jsonlContent = documents.map(doc => JSON.stringify(doc)).join('\n');
  const outputFile = path.join(__dirname, '../vertex-ai-data.jsonl');
  
  fs.writeFileSync(outputFile, jsonlContent);
  logSuccess(`Created JSONL file: ${outputFile}`);
  
  // Generate gcloud import command
  const gcloudCommand = `
gcloud alpha discovery-engine documents import \\
  --data-store="${DATA_STORE_ID}" \\
  --location="${LOCATION}" \\
  --project="${PROJECT_ID}" \\
  --source-gcs-uri="gs://your-bucket/vertex-ai-data.jsonl" \\
  --reconciliation-mode=INCREMENTAL
`;

  logInfo('To upload the data to Vertex AI Search, first upload the JSONL file to Google Cloud Storage, then run:');
  log(gcloudCommand, 'cyan');
  
  // Also create a sample Cloud Storage upload command
  const gsutilCommand = `
# First, create a bucket and upload the file:
gsutil mb gs://whitecap-us-data
gsutil cp ${outputFile} gs://whitecap-us-data/

# Then run the import command above with the correct GCS URI
`;

  logInfo('Cloud Storage upload commands:');
  log(gsutilCommand, 'cyan');
  
  return true;
}

async function generateVertexAISetupScript() {
  const setupScript = `#!/bin/bash

# Vertex AI Search Setup Script for Whitecap
# This script sets up the complete Vertex AI Search infrastructure

set -e

PROJECT_ID="${PROJECT_ID}"
LOCATION="${LOCATION}"
DATA_STORE_ID="${DATA_STORE_ID}"
SEARCH_ENGINE_ID="whitecap-us-engine"
BUCKET_NAME="whitecap-us-data"

echo "🚀 Setting up Vertex AI Search for Whitecap..."

# 1. Enable required APIs
echo "📡 Enabling required APIs..."
gcloud services enable discoveryengine.googleapis.com --project=\$PROJECT_ID
gcloud services enable storage.googleapis.com --project=\$PROJECT_ID

# 2. Create Cloud Storage bucket
echo "🪣 Creating Cloud Storage bucket..."
gsutil mb gs://\$BUCKET_NAME || echo "Bucket already exists"

# 3. Upload data file
echo "📤 Uploading data to Cloud Storage..."
gsutil cp vertex-ai-data.jsonl gs://\$BUCKET_NAME/

# 4. Create data store
echo "🗄️  Creating Vertex AI data store..."
gcloud alpha discovery-engine data-stores create \\
  --data-store-id="\$DATA_STORE_ID" \\
  --display-name="Service Foods Products" \\
  --industry-vertical=GENERIC \\
  --content-config=CONTENT_REQUIRED \\
  --solution-type=SOLUTION_TYPE_SEARCH \\
  --location="\$LOCATION" \\
  --project="\$PROJECT_ID" || echo "Data store may already exist"

# 5. Import documents
echo "📥 Importing documents to data store..."
gcloud alpha discovery-engine documents import \\
  --data-store="\$DATA_STORE_ID" \\
  --location="\$LOCATION" \\
  --project="\$PROJECT_ID" \\
  --source-gcs-uri="gs://\$BUCKET_NAME/vertex-ai-data.jsonl" \\
  --reconciliation-mode=INCREMENTAL

# 6. Create search engine
echo "🔍 Creating search engine..."
gcloud alpha discovery-engine engines create \\
  --engine-id="\$SEARCH_ENGINE_ID" \\
  --display-name="Service Foods Search Engine" \\
  --data-store-ids="\$DATA_STORE_ID" \\
  --industry-vertical=GENERIC \\
  --location="\$LOCATION" \\
  --project="\$PROJECT_ID" || echo "Search engine may already exist"

echo "✅ Vertex AI Search setup complete!"
echo ""
echo "📋 Configuration Summary:"
echo "  Project ID: \$PROJECT_ID"
echo "  Location: \$LOCATION"
echo "  Data Store ID: \$DATA_STORE_ID"
echo "  Search Engine ID: \$SEARCH_ENGINE_ID"
echo "  Bucket: gs://\$BUCKET_NAME"
echo ""
echo "🔧 Next steps:"
echo "1. Update your .env file with these values:"
echo "   GOOGLE_CLOUD_PROJECT_ID=\$PROJECT_ID"
echo "   VERTEX_AI_LOCATION=\$LOCATION"
echo "   VERTEX_AI_DATA_STORE_ID=\$DATA_STORE_ID"
echo "   VERTEX_AI_SEARCH_ENGINE_ID=\$SEARCH_ENGINE_ID"
echo ""
echo "2. Set up authentication:"
echo "   gcloud auth application-default login"
echo "   # OR set GOOGLE_APPLICATION_CREDENTIALS to your service account key"
echo ""
echo "3. Test the search functionality in your application"
`;

  const scriptPath = path.join(__dirname, '../setup-vertex-ai.sh');
  fs.writeFileSync(scriptPath, setupScript);
  fs.chmodSync(scriptPath, '755');
  
  logSuccess(`Created setup script: ${scriptPath}`);
  return scriptPath;
}

async function main() {
  try {
    log('\n' + '='.repeat(60), 'bold');
    log('🔍 Whitecap - Vertex AI Search Data Indexing', 'bold');
    log('='.repeat(60), 'bold');
    
    // Read CSV files
    logInfo('Reading product data...');
    const products = await readCSV(PRODUCTS_CSV);
    logSuccess(`Loaded ${products.length} products`);
    
    logInfo('Reading stock data...');
    const stocks = await readCSV(STOCK_CSV);
    logSuccess(`Loaded ${stocks.length} stock records`);
    
    // Transform data for Vertex AI
    logInfo('Transforming data for Vertex AI Search...');
    const transformedProducts = products.map(product => 
      transformProductForVertexAI(product, stocks)
    );
    
    // Filter out products with missing essential data
    const validProducts = transformedProducts.filter(product => 
      product.sku && product.displayName
    );
    
    logSuccess(`Transformed ${validProducts.length} valid products`);
    
    if (validProducts.length !== transformedProducts.length) {
      logWarning(`Filtered out ${transformedProducts.length - validProducts.length} products with missing data`);
    }
    
    // Generate sample data for inspection
    logInfo('Sample transformed product:');
    console.log(JSON.stringify(validProducts[0], null, 2));
    
    // Create setup files
    await uploadToVertexAI(validProducts);
    const setupScript = await generateVertexAISetupScript();
    
    // Create environment file template
    const envTemplate = `# Vertex AI Search Configuration
GOOGLE_CLOUD_PROJECT_ID=${PROJECT_ID}
VERTEX_AI_LOCATION=${LOCATION}
VERTEX_AI_DATA_STORE_ID=${DATA_STORE_ID}
VERTEX_AI_SEARCH_ENGINE_ID=whitecap-us-engine

# Google Cloud Authentication
# Option 1: Use gcloud auth application-default login
# Option 2: Set path to service account key file
# GOOGLE_APPLICATION_CREDENTIALS=/path/to/service-account-key.json
`;

    const envPath = path.join(__dirname, '../.env.vertex-ai');
    fs.writeFileSync(envPath, envTemplate);
    logSuccess(`Created environment template: ${envPath}`);
    
    log('\n' + '='.repeat(60), 'bold');
    log('📋 Next Steps', 'bold');
    log('='.repeat(60), 'bold');
    
    logInfo('1. Set up Google Cloud project and authentication');
    logInfo('2. Run the setup script: ./setup-vertex-ai.sh');
    logInfo('3. Copy .env.vertex-ai to .env.local and configure');
    logInfo('4. Install Google Cloud dependencies: npm install google-auth-library');
    logInfo('5. Update your application to use Vertex AI Search');
    
    log('\n📊 Data Summary:', 'bold');
    logInfo(`Total products: ${validProducts.length}`);
    logInfo(`SF Preferred products: ${validProducts.filter(p => p.isSFPreferred).length}`);
    logInfo(`Available products: ${validProducts.filter(p => p.availability === 'Available').length}`);
    logInfo(`Unique categories: ${new Set(validProducts.map(p => p.category)).size}`);
    logInfo(`Unique brands: ${new Set(validProducts.map(p => p.brand)).size}`);
    
    logSuccess('Data indexing preparation complete! 🎉');
    
  } catch (error) {
    logError(`Data indexing failed: ${error.message}`);
    console.error(error);
    process.exit(1);
  }
}

// Run the script
if (require.main === module) {
  main();
}

module.exports = {
  transformProductForVertexAI,
  readCSV,
  uploadToVertexAI
};


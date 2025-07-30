#!/usr/bin/env node

/**
 * Upload Service Foods data to Vertex AI Search for Commerce
 * This script processes the CSV files and uploads them to Google Cloud Retail API
 */

const fs = require('fs');
const path = require('path');
const csv = require('csv-parser');
const { GoogleAuth } = require('google-auth-library');

// Configuration
const PROJECT_ID = process.env.GOOGLE_CLOUD_PROJECT_ID || 'gwa-vertex';
const LOCATION = process.env.VERTEX_AI_LOCATION || 'global';
const CATALOG_ID = process.env.VERTEX_AI_CATALOG_ID || 'default_catalog';
const BRANCH_ID = process.env.VERTEX_AI_BRANCH_ID || '0';

const RETAIL_API_BASE = 'https://retail.googleapis.com';
const API_VERSION = 'v2';

class VertexAIDataUploader {
  constructor() {
    this.auth = new GoogleAuth({
      scopes: ['https://www.googleapis.com/auth/cloud-platform'],
      keyFilename: process.env.GOOGLE_APPLICATION_CREDENTIALS || '../gwa-vertex-service-foods.json',
    });

    this.projectPath = `projects/gwa-vertex`;
    this.catalogPath = `${this.projectPath}/locations/global/catalogs/default_catalog`;
    this.branchPath = `${this.catalogPath}/branches/0`;
  }

  async getAccessToken() {
    const client = await this.auth.getClient();
    const accessToken = await client.getAccessToken();
    return accessToken.token;
  }

  getApiUrl(endpoint) {
    return `${RETAIL_API_BASE}/${API_VERSION}/${endpoint}`;
  }

  async readCSV(filePath) {
    return new Promise((resolve, reject) => {
      const results = [];
      fs.createReadStream(filePath)
        .pipe(csv())
        .on('data', (data) => results.push(data))
        .on('end', () => resolve(results))
        .on('error', reject);
    });
  }

  transformToRetailProduct(productData, stockData = []) {
    const productCode = productData.ProductCode || productData.Product_Code__c || '';
    
    // Calculate availability based on stock
    const productStock = stockData.filter(stock => stock.Product_Code__c === productCode);
    const totalStock = productStock.reduce((sum, stock) => {
      return sum + (parseInt(stock.Available_Quantity__c) || 0);
    }, 0);

    // Force all products to be IN_STOCK with available quantity
    let availability = 'IN_STOCK';
    const forceAvailableQuantity = totalStock > 0 ? totalStock : 100; // Use actual stock or default to 100

    // Build categories array
    const categories = [];
    if (productData.Category__c) categories.push(productData.Category__c);
    if (productData.WEBCATEGORY__c && productData.WEBCATEGORY__c !== productData.Category__c) {
      categories.push(productData.WEBCATEGORY__c);
    }
    if (productData.WEBSUBCATEG__c) categories.push(productData.WEBSUBCATEG__c);

    // Generate realistic random pricing with discount
    const generatePricingWithDiscount = () => {
      // Generate base price between $10 and $150
      const basePrice = Math.round((Math.random() * 140 + 10) * 100) / 100;
      
      // 70% chance of having a discount
      const hasDiscount = Math.random() < 0.7;
      
      if (hasDiscount) {
        // Discount between 10% and 40%
        const discountPercent = Math.random() * 0.3 + 0.1; // 10% to 40%
        const salePrice = Math.round(basePrice * (1 - discountPercent) * 100) / 100;
        
        return {
          price: salePrice,
          originalPrice: basePrice,
          currencyCode: 'USD'
        };
      } else {
        return {
          price: basePrice,
          currencyCode: 'USD'
        };
      }
    };

    // Generate random rating
    const generateRating = () => {
      // Generate rating between 3.0 and 5.0 (more realistic for products)
      const averageRating = Math.round((Math.random() * 2 + 3) * 10) / 10; // 3.0 to 5.0
      
      // Generate rating count between 5 and 500
      const ratingCount = Math.floor(Math.random() * 495 + 5);
      
      return {
        averageRating,
        ratingCount
      };
    };

    const pricingInfo = generatePricingWithDiscount();
    const ratingInfo = generateRating();

    // Build custom attributes
    const attributes = {
      brand: {
        text: [productData.BRAND__c || ''],
        searchable: true,
        indexable: true
      },
      sku: {
        text: [productCode],
        searchable: true,
        indexable: true
      },
      vendor: {
        text: [productData.VENDOR_ID__c || ''],
        searchable: true,
        indexable: true
      },
      vendorName: {
        text: [productData.VEND_NAME__c || ''],
        searchable: true,
        indexable: true
      },
      units: {
        text: [productData.Unit_Of_Measure__c || ''],
        searchable: true, // Make units searchable too
        indexable: true
      },
      accset: {
        text: [productData.Account_Set_Code__c || ''],
        searchable: true, // Make accset searchable
        indexable: true
      },
      isSFPreferred: {
        text: [(productData.SFPREF_SF_preferred_item__c || '').toLowerCase() === 'true' ? 'true' : 'false'],
        searchable: true,
        indexable: true
      },
      totalStock: {
        numbers: [forceAvailableQuantity],
        searchable: false,
        indexable: true
      },
      stockWarehouses: {
        numbers: [productStock.length],
        searchable: false,
        indexable: true
      },
      // Add discount information as attributes for filtering
      hasDiscount: {
        text: [pricingInfo.originalPrice ? 'true' : 'false'],
        searchable: true,
        indexable: true
      },
      discountPercent: {
        numbers: [pricingInfo.originalPrice ? 
          Math.round(((pricingInfo.originalPrice - pricingInfo.price) / pricingInfo.originalPrice) * 100) : 0],
        searchable: false,
        indexable: true
      },
      // Add searchable keywords for better partial matching
      searchKeywords: {
        text: [
          productCode,
          productData.BRAND__c || '',
          productData.Description || '',
          productData.Name || '',
          ...categories
        ].filter(Boolean),
        searchable: true,
        indexable: true
      }
    };

    // Add warehouse-specific stock info
    productStock.forEach((stock, index) => {
      if (index < 10) { // Limit to first 10 warehouses
        attributes[`warehouse_${stock.Warehouse__c}`] = {
          numbers: [parseInt(stock.Available_Quantity__c) || 0],
          searchable: false,
          indexable: true
        };
      }
    });

    const product = {
      id: productCode,
      type: 'PRIMARY',
      categories,
      title: productData.Description || productData.Name || productCode,
      description: productData.WEB_DESC__c || productData.Description || '',
      languageCode: 'en',
      attributes,
      tags: [
        ...(productData.BRAND__c ? [productData.BRAND__c] : []),
        ...(productData.Category__c ? [productData.Category__c] : []),
        ...(productData.SFPREF_SF_preferred_item__c === 'true' ? ['SF Preferred'] : []),
        ...(pricingInfo.originalPrice ? ['On Sale'] : []),
        'in stock' // Always show as in stock
      ],
      availability,
      availableQuantity: forceAvailableQuantity,
      uri: `/product/${productCode}`,
      images: this.extractImageUrl(productData.Image__c) ? [{
        uri: this.extractImageUrl(productData.Image__c),
        height: 300,
        width: 300
      }] : [],
      publishTime: new Date().toISOString(),
      priceInfo: pricingInfo,
      rating: ratingInfo
    };

    return product;
  }

  extractImageUrl(imageField) {
    if (!imageField) return '';
    // Extract URL from HTML img tag
    const match = imageField.match(/src="([^"]+)"/);
    return match ? match[1].replace('&lt;ReandomString&gt;', '') : '';
  }

  async importProducts(products) {
    try {
      const accessToken = await this.getAccessToken();
      const endpoint = `${this.branchPath}/products:import`;
      const url = this.getApiUrl(endpoint);

      const importRequest = {
        inputConfig: {
          productInlineSource: {
            products
          }
        },
        reconciliationMode: 'INCREMENTAL'
      };

      console.log(`Importing ${products.length} products to Vertex AI Search for Commerce...`);
      console.log(`Endpoint: ${url}`);

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(importRequest),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Product import failed: ${response.status} ${response.statusText} - ${errorText}`);
      }

      const operation = await response.json();
      console.log("operation", operation);
      
      // Check for errors in the operation
      if (operation.response && operation.response.errorSamples) {
        console.log('❌ Import errors detected:');
        operation.response.errorSamples.forEach((error, index) => {
          console.log(`Error ${index + 1}:`, JSON.stringify(error, null, 2));
        });
      }
      
      console.log('✅ Product import operation started:', operation.name);
      return operation;
    } catch (error) {
      console.error('❌ Product import error:', error);
      throw error;
    }
  }

  async createCatalog() {
    try {
      const accessToken = await this.getAccessToken();
      const endpoint = `${this.projectPath}/locations/${LOCATION}/catalogs`;
      const url = this.getApiUrl(endpoint);
console.log(`Creating catalog at ${url}...`);
      const catalogRequest = {
        catalogId: CATALOG_ID,
        displayName: 'Service Foods Product Catalog',
        productLevelConfig: {
          ingestionProductType: 'PRIMARY',
          merchantCenterProductIdField: 'id'
        }
      };

      console.log('Creating catalog...');
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(catalogRequest),
      });

      if (response.status === 409) {
        console.log('✅ Catalog already exists');
        return;
      }

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Catalog creation failed: ${response.status} ${response.statusText} - ${errorText}`);
      }

      const catalog = await response.json();
      console.log('✅ Catalog created:', catalog.name);
    } catch (error) {
      console.error('❌ Catalog creation error:', error);
      throw error;
    }
  }

  async setupServingConfigs() {
    try {
      const accessToken = await this.getAccessToken();
      
      // Create a default search placement for regular search
      const searchPlacement = {
        displayName: 'Default Search',
        searchSolutionUseCase: ['SEARCH_SOLUTION_USE_CASE_SEARCH'],
        solutionType: 'SOLUTION_TYPE_SEARCH'
      };

      const endpoint = `${this.catalogPath}/placements`;
      const url = this.getApiUrl(endpoint);

      console.log('Creating default search placement...');
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          placementId: 'default_search',
          ...searchPlacement
        }),
      });

      if (response.status === 409) {
        console.log('✅ Default search placement already exists');
      } else if (!response.ok) {
        const errorText = await response.text();
        console.warn(`⚠️ Search placement creation failed: ${response.status} ${response.statusText} - ${errorText}`);
      } else {
        const placement = await response.json();
        console.log('✅ Default search placement created:', placement.name);
      }
    } catch (error) {
      console.error('❌ Placement setup error:', error);
    }
  }

  async getProduct(productId) {
    try {
      const accessToken = await this.getAccessToken();
      const endpoint = `${this.branchPath}/products/${productId}`;
      const url = this.getApiUrl(endpoint);

      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Get product failed: ${response.status} ${response.statusText} - ${errorText}`);
      }

      const product = await response.json();
      console.log('Product details:', JSON.stringify(product, null, 2));
      return product;
    } catch (error) {
      console.error('Get product error:', error);
      throw error;
    }
  }

  async run() {
    try {
      console.log('🚀 Starting Vertex AI Search for Commerce data upload...');
      console.log(`Project: ${PROJECT_ID}`);
      console.log(`Location: ${LOCATION}`);
      console.log(`Catalog: ${CATALOG_ID}`);
      console.log(`Branch: ${BRANCH_ID}`);

      // Step 1: Create catalog if it doesn't exist
      // await this.createCatalog();

      // Step 2: Setup serving configs
      // await this.setupServingConfigs();

      // Step 3: Read CSV files
      console.log('📖 Reading CSV files...');
      const productDataPath = path.join(__dirname, '..', 'Productextract.csv');
      const stockDataPath = path.join(__dirname, '..', 'Stockextract.csv');

      if (!fs.existsSync(productDataPath)) {
        throw new Error(`Product data file not found: ${productDataPath}`);
      }

      if (!fs.existsSync(stockDataPath)) {
        throw new Error(`Stock data file not found: ${stockDataPath}`);
      }

      const [productData, stockData] = await Promise.all([
        this.readCSV(productDataPath),
        this.readCSV(stockDataPath)
      ]);

      console.log(`✅ Loaded ${productData.length} products and ${stockData.length} stock records`);

      // Step 4: Transform data to Retail API format
      console.log('🔄 Transforming data to Retail API format...');
      const retailProducts = productData
        .filter(product => {
          const isActive = product.IsActive === 'true';
          const isNotDeleted = product.IsDeleted === 'false';
          const hasProductCode = (product.ProductCode && product.ProductCode.trim() !== '') || 
                                (product.Product_Code__c && product.Product_Code__c.trim() !== '');
          const productCode = product.ProductCode || product.Product_Code__c || 'NO_CODE';
          return isActive && isNotDeleted && hasProductCode;
        })
        .map(product => this.transformToRetailProduct(product, stockData));

      console.log(`✅ Transformed ${retailProducts.length} products`);

      // Step 5: Upload in batches (Retail API has limits)
      const batchSize = 100; // Adjust based on API limits
      const batches = [];
      for (let i = 0; i < retailProducts.length; i += batchSize) {
        batches.push(retailProducts.slice(i, i + batchSize));
      }

      console.log(`📦 Uploading ${batches.length} batches of products...`);

      for (let i = 0; i < batches.length; i++) {
        const batch = batches[i];
        console.log(`📤 Uploading batch ${i + 1}/${batches.length} (${batch.length} products)...`);
        
        try {
          await this.importProducts(batch);
          console.log(`✅ Batch ${i + 1} uploaded successfully`);
          
          // Add delay between batches to avoid rate limiting
          if (i < batches.length - 1) {
            console.log('⏳ Waiting 5 seconds before next batch...');
            await new Promise(resolve => setTimeout(resolve, 5000));
          }
        } catch (error) {
          console.error(`❌ Failed to upload batch ${i + 1}:`, error);
          // Continue with next batch
        }
      }

      console.log('🎉 Data upload completed!');
      console.log('');
      
      // Step 6: Test get product to verify data structure
      console.log('🔍 Testing product retrieval...');
      try {
        await this.getProduct('CHE036');
      } catch (error) {
        console.error('❌ Product retrieval failed:', error);
      }
      
      console.log('📋 Next steps:');
      console.log('1. Wait for data indexing to complete (may take several hours)');
      console.log('2. Test search functionality in the application');
      console.log('3. Monitor the Google Cloud Console for indexing status');
      console.log('4. Set up user event tracking for personalization');

    } catch (error) {
      console.error('💥 Upload failed:', error);
      process.exit(1);
    }
  }
}

// Run the upload
if (require.main === module) {
  const uploader = new VertexAIDataUploader();
  uploader.run().catch(console.error);
}

module.exports = VertexAIDataUploader;


#!/usr/bin/env node

/**
 * Process Whitecap Data Files for Vertex AI Search
 * 
 * This script reads four Excel files:
 * - US_Products_1.xlsx: Product information
 * - US_Attribute_Values_1.xlsx: Product attributes
 * - US_Product_Warehouses_1.xlsx: Warehouse stock information
 * - US_Product_Images_1.xlsx: Product images
 * 
 * And combines them into a single JSON file ready for Vertex AI Search upload.
 * 
 * Usage: node process-whitecap-data.js
 */

const fs = require('fs');
const path = require('path');
const XLSX = require('xlsx');

// Configuration
const PROJECT_ID = process.env.GOOGLE_CLOUD_PROJECT_ID || 'whitecap-vertex-ai';
const LOCATION = process.env.VERTEX_AI_LOCATION || 'global';
const CATALOG_ID = process.env.VERTEX_AI_CATALOG_ID || 'default_catalog';
const BRANCH_ID = process.env.VERTEX_AI_BRANCH_ID || '0';

// Data limits for production processing
const MAX_PRODUCTS = 100000;         // Limit to 100K products
const MAX_ATTRIBUTES = 300000;       // Limit to 300K attributes
const MAX_WAREHOUSES = 500000;       // Limit to 500K warehouse records
const MAX_IMAGES = 500000;           // Limit to 500K image records

// For testing with smaller datasets, use these smaller limits:
// const MAX_PRODUCTS = 100;          // Limit to 100 products for testing
// const MAX_ATTRIBUTES = 500;        // Limit to 500 attributes for testing  
// const MAX_WAREHOUSES = 500;        // Limit to 500 warehouse records for testing
// const MAX_IMAGES = 1000;           // Limit to 1000 image records for testing

// File paths (relative to project root)
const PRODUCTS_FILE = path.join(__dirname, '..', 'US_Products_1.xlsx');
const ATTRIBUTES_FILE = path.join(__dirname, '..', 'US_Attribute_Values_1.xlsx');
const WAREHOUSES_FILE = path.join(__dirname, '..', 'US_Product_Warehouses_1.xlsx');
const IMAGES_FILE = path.join(__dirname, '..', 'US_Product_Images_1.xlsx');
const OUTPUT_FILE = path.join(__dirname, '..', 'whitecap-vertex-ai-products.json');

class WhitecapDataProcessor {
  constructor() {
    this.projectPath = `projects/${PROJECT_ID}`;
    this.catalogPath = `${this.projectPath}/locations/${LOCATION}/catalogs/${CATALOG_ID}`;
    this.branchPath = `${this.catalogPath}/branches/${BRANCH_ID}`;
  }

  /**
   * Helper function to create text attributes while filtering out empty strings
   */
  createTextAttribute(values, searchable = true, indexable = true) {
    const filteredValues = Array.isArray(values) 
      ? values.filter(v => v && typeof v === 'string' && v.trim() !== '')
      : [values].filter(v => v && typeof v === 'string' && v.trim() !== '');
    
    if (filteredValues.length === 0) {
      return null; // Don't create attribute if no valid values
    }
    
    return {
      text: filteredValues,
      searchable,
      indexable
    };
  }

  /**
   * Read Excel file and return JSON data (optimized to read only specified number of rows)
   */
  readExcelFile(filePath, sheetName = null, maxRecords = null) {
    try {
      console.log(`📖 Reading Excel file: ${filePath}`);
      
      if (!fs.existsSync(filePath)) {
        throw new Error(`File not found: ${filePath}`);
      }

      const workbook = XLSX.readFile(filePath);
      const sheetNameToUse = sheetName || workbook.SheetNames[0];
      
      if (!workbook.Sheets[sheetNameToUse]) {
        console.log(`Available sheets: ${workbook.SheetNames.join(', ')}`);
        throw new Error(`Sheet '${sheetNameToUse}' not found in ${filePath}`);
      }

      const worksheet = workbook.Sheets[sheetNameToUse];
      
      // If maxRecords is specified, limit the range to read only those rows
      if (maxRecords) {
        const range = XLSX.utils.decode_range(worksheet['!ref'] || 'A1');
        const limitedEndRow = Math.min(range.e.r, maxRecords + range.s.r); // +1 for header row
        
        console.log(`⚠️  Limiting read to first ${maxRecords} rows (plus header) for POC performance`);
        
        // Create a new range that only includes the limited rows
        const limitedRange = {
          s: { c: range.s.c, r: range.s.r }, // start from original start
          e: { c: range.e.c, r: limitedEndRow } // end at limited row
        };
        
        // Create a new worksheet with limited range
        const limitedWorksheet = {};
        for (let R = limitedRange.s.r; R <= limitedRange.e.r; ++R) {
          for (let C = limitedRange.s.c; C <= limitedRange.e.c; ++C) {
            const cellRef = XLSX.utils.encode_cell({ c: C, r: R });
            if (worksheet[cellRef]) {
              limitedWorksheet[cellRef] = worksheet[cellRef];
            }
          }
        }
        limitedWorksheet['!ref'] = XLSX.utils.encode_range(limitedRange);
        
        const data = XLSX.utils.sheet_to_json(limitedWorksheet);
        console.log(`✅ Successfully read ${data.length} records from ${filePath} (sheet: ${sheetNameToUse}) - LIMITED FOR POC`);
        return data;
      } else {
        // Read normally if no limit specified
        const data = XLSX.utils.sheet_to_json(worksheet);
        console.log(`✅ Successfully read ${data.length} records from ${filePath} (sheet: ${sheetNameToUse})`);
        return data;
      }
    } catch (error) {
      console.error(`❌ Error reading Excel file ${filePath}:`, error.message);
      throw error;
    }
  }

  /**
   * Generate search keywords from product data
   */
  generateSearchKeywords(product, attributes) {
    const keywords = new Set();
    
    // Add product identifiers (Product Number is the SKU)
    if (product['Product Number']) {
      keywords.add(product['Product Number']);
    }
    
    // Add product title
    if (product['Product title']) {
      keywords.add(product['Product title']);
    }
    
    // Add manufacturer item number
    if (product['Manufacturer Item']) {
      keywords.add(product['Manufacturer Item']);
    }
    
    // Add model number
    if (product['Model Number']) {
      keywords.add(product['Model Number']);
    }
    
    // Add brand
    if (product.Brand) {
      keywords.add(product.Brand);
    }
    
    // Add vendor
    if (product.Vendor) {
      keywords.add(product.Vendor);
    }
    
    // Add categories
    if (product.Category || product.CategoryName) {
      keywords.add(product.Category || product.CategoryName);
    }
    
    if (product.SubCategory || product.SubCategoryName) {
      keywords.add(product.SubCategory || product.SubCategoryName);
    }
    
    // Add attributes
    if (attributes && attributes.length > 0) {
      attributes.forEach(attr => {
        if (attr.Value || attr.AttributeValue) {
          keywords.add(attr.Value || attr.AttributeValue);
        }
      });
    }
    
    return Array.from(keywords).filter(Boolean);
  }

  /**
   * Extract categories from product data
   */
  extractCategories(product) {
    const categories = [];
    
    // Use Brand as primary category
    if (product.Brand) {
      categories.push(product.Brand);
    }
    
    // Use Product Line Name as secondary category
    if (product['Product Line.Name'] && product['Product Line.Name'] !== product.Brand) {
      categories.push(product['Product Line.Name']);
    }
    
    // Use Vendor as tertiary category if different from Brand
    if (product.Vendor && product.Vendor !== product.Brand) {
      categories.push(product.Vendor);
    }
    
    // Use Tax Category if available
    if (product['Tax Category']) {
      categories.push(product['Tax Category']);
    }
    
    // Fallback: if no categories found, use "General Products"
    if (categories.length === 0) {
      categories.push('General Products');
    }
    
    return categories.filter(Boolean);
  }

  /**
   * Generate pricing information with realistic values
   */
  generatePricing(product) {
    let price = 0;
    let originalPrice = 0;
    
    // Try to extract price from product data
    if (product.Price || product.UnitPrice || product.SellPrice) {
      price = parseFloat(product.Price || product.UnitPrice || product.SellPrice) || 0;
    }
    
    if (product.OriginalPrice || product.ListPrice || product.MSRP) {
      originalPrice = parseFloat(product.OriginalPrice || product.ListPrice || product.MSRP) || 0;
    }
    
    // If no price found, generate realistic random pricing
    if (price === 0) {
      price = Math.round((Math.random() * 140 + 10) * 100) / 100;
    }
    
    // Generate discount scenario (70% chance)
    const hasDiscount = Math.random() < 0.7;
    if (hasDiscount && originalPrice === 0) {
      // Create original price 10-40% higher than sale price
      const discountPercent = Math.random() * 0.3 + 0.1;
      originalPrice = Math.round((price / (1 - discountPercent)) * 100) / 100;
    }
    
    const pricingInfo = {
      currencyCode: 'USD',
      price: price,
      priceRange: {}
    };
    
    if (originalPrice > price) {
      pricingInfo.originalPrice = originalPrice;
    }
    
    return pricingInfo;
  }

  /**
   * Generate rating information
   */
  generateRating() {
    const averageRating = Math.round((Math.random() * 2 + 3) * 10) / 10; // 3.0 to 5.0
    const ratingCount = Math.floor(Math.random() * 495 + 5); // 5 to 500
    
    return {
      averageRating,
      ratingCount
    };
  }

  /**
   * Generate realistic random stock quantity
   */
  generateRandomStock() {
    // Generate different stock ranges based on product availability scenarios
    const scenario = Math.random();
    
    if (scenario < 0.1) {
      // 10% chance: Out of stock or very low stock (0-5)
      return Math.floor(Math.random() * 6);
    } else if (scenario < 0.3) {
      // 20% chance: Low stock (6-25)
      return Math.floor(Math.random() * 20) + 6;
    } else if (scenario < 0.6) {
      // 30% chance: Medium stock (26-100)
      return Math.floor(Math.random() * 75) + 26;
    } else if (scenario < 0.85) {
      // 25% chance: Good stock (101-500)
      return Math.floor(Math.random() * 400) + 101;
    } else {
      // 15% chance: High stock (501-2000)
      return Math.floor(Math.random() * 1500) + 501;
    }
  }

  /**
   * Process and organize product images by product ID and type
   */
  processImages(imagesData) {
    const imagesByProduct = new Map();
    
    imagesData.forEach(imageRow => {
      const columns = Object.keys(imageRow);
      
      // Based on the actual structure observed (CORRECTED):
      // Column 0: Product ID (101332, etc.) ← SWAPPED!
      // Column 1: Order (1, 2, 3, etc.) ← SWAPPED!
      // Column 3: Image Type (Hero Image, MAIN_IMAGE, etc.)
      // Column 4+: Image URLs (https://...)
      
      const order = parseInt(imageRow[columns[1]]) || 1; // CORRECTED: Column 1 is order
      const productId = imageRow[columns[0]]; // CORRECTED: Column 0 is product ID
      const imageType = imageRow[columns[3]]; // This is the image type
      
              // Image processing and product matching working correctly
      
      // Find the image URL column (should contain https://)
      let imageUrl = '';
      for (const col of columns) {
        if (imageRow[col] && typeof imageRow[col] === 'string' && imageRow[col].startsWith('https://')) {
          imageUrl = imageRow[col];
          break;
        }
      }
      
      if (productId && imageUrl && imageType) {
        if (!imagesByProduct.has(productId)) {
          imagesByProduct.set(productId, []);
        }
        
        imagesByProduct.get(productId).push({
          type: imageType,
          url: imageUrl,
          order: order
        });
      }
    });
    
    // Sort images by order for each product
    imagesByProduct.forEach((images, productId) => {
      images.sort((a, b) => a.order - b.order);
    });
    
    return imagesByProduct;
  }

  /**
   * Build images array for Vertex AI product from image data
   */
  buildProductImages(productImages) {
    if (!productImages || productImages.length === 0) {
      return [];
    }
    
    // Image processing working correctly
    
    const images = [];
    
    // Prioritize image types for better display
    const typePriority = {
      'MAIN_IMAGE': 1,
      'Hero Image': 2,
      'ALTERNATE_IMAGE': 3,
      'LIFESTYLE_IMAGE': 4,
      'DETAILED PRODUCT VIEW 1_IMAGE': 5,
      'DETAILED PRODUCT VIEW 2_IMAGE': 6,
      'DETAILED PRODUCT VIEW 3_IMAGE': 7,
      'DETAILED PRODUCT VIEW 4_IMAGE': 8,
      'TOP VIEW_IMAGE': 9,
      'RIGHT VIEW_IMAGE': 10,
      'BRAND NAME LOGO': 11
    };
    
    // Sort by priority then by order
    const sortedImages = productImages.sort((a, b) => {
      const priorityA = typePriority[a.type] || 99;
      const priorityB = typePriority[b.type] || 99;
      
      if (priorityA !== priorityB) {
        return priorityA - priorityB;
      }
      return a.order - b.order;
    });
    
    // Convert to Vertex AI format, limit to first 10 images
    sortedImages.slice(0, 10).forEach((img, index) => {
      images.push({
        uri: img.url,
        height: 300,
        width: 300
      });
    });
    
    return images;
  }

  /**
   * Transform data into Vertex AI Search format
   */
  transformToVertexAIProduct(product, productAttributes, warehouseData, productImages) {
    // Extract product ID from the actual column structure
    const columns = Object.keys(product);
    // Use the Product Number field directly instead of extracting from URL segment
    const productId = product['Product Number'];
    
    // Product ID extraction working correctly
    
    if (!productId) {
      console.warn('⚠️  Product missing Product ID, skipping:', product);
      return null;
    }

    const categories = this.extractCategories(product);
    const searchKeywords = this.generateSearchKeywords(product, productAttributes);
    const pricingInfo = this.generatePricing(product);
    const ratingInfo = this.generateRating();
    
    // Calculate total stock from warehouse data
    const totalStock = warehouseData.reduce((sum, warehouse) => {
      const quantity = parseInt(warehouse.Quantity || warehouse.Stock || warehouse.AvailableQuantity || 0);
      return sum + quantity;
    }, 0);
    
    // Use actual warehouse stock if available, otherwise generate realistic random stock
    const availableQuantity = totalStock > 0 ? totalStock : this.generateRandomStock();
    
    // Build attributes object
    const attributes = {
      sku: {
        text: [productId]
      },
      totalStock: {
        numbers: [availableQuantity]
      },
      stockWarehouses: {
        numbers: [warehouseData.length]
      },
      hasDiscount: {
        text: [pricingInfo.originalPrice ? 'true' : 'false']
      }
    };
    
    // Only add brand if it has a valid value
    const brandAttr = this.createTextAttribute([product.Brand || product.BRAND]);
    if (brandAttr) {
      attributes.brand = {
        ...brandAttr,
        catalogLevelSearchableSnapshot: true,
        catalogLevelIndexableSnapshot: true
      };
    }
    
    // Only add searchKeywords if they contain valid values
    const keywordsAttr = this.createTextAttribute(searchKeywords);
    if (keywordsAttr) {
      attributes.searchKeywords = {
        ...keywordsAttr,
        catalogLevelSearchableSnapshot: true,
        catalogLevelIndexableSnapshot: true
      };
    }
    
    // Add discount percentage if applicable
    if (pricingInfo.originalPrice) {
      const discountPercent = Math.round(((pricingInfo.originalPrice - pricingInfo.price) / pricingInfo.originalPrice) * 100);
      attributes.discountPercent = {
        numbers: [discountPercent]
      };
    }
    
    // Add product-specific attributes (only if they have valid values)
    const vendorAttr = this.createTextAttribute([product.Vendor || product.VendorId]);
    if (vendorAttr) {
      attributes.vendor = vendorAttr;
    }
    
    const vendorNameAttr = this.createTextAttribute([product.VendorName]);
    if (vendorNameAttr) {
      attributes.vendorName = vendorNameAttr;
    }
    
    const unitsAttr = this.createTextAttribute([product.Units || product.UOM || product.UnitOfMeasure]);
    if (unitsAttr) {
      attributes.units = unitsAttr;
    }
    
    const accsetAttr = this.createTextAttribute([product.AccountSet || product.AccSet]);
    if (accsetAttr) {
      attributes.accset = accsetAttr;
    }
    
    // Add custom attributes from attributes file (only if they have valid values)
    productAttributes.forEach((attr, index) => {
      if (index < 20) { // Limit to prevent too many attributes
        const attrName = (attr.AttributeName || attr.Name || `attribute_${index}`).toLowerCase().replace(/[^a-z0-9]/g, '_');
        const attrValue = attr.Value || attr.AttributeValue;
        
        const customAttr = this.createTextAttribute([attrValue]);
        if (customAttr && attrName) {
          attributes[attrName] = customAttr;
        }
      }
    });
    
    // Add warehouse-specific stock information
    warehouseData.forEach((warehouse, index) => {
      if (index < 10) { // Limit to first 10 warehouses
        const warehouseId = warehouse.WarehouseId || warehouse.WarehouseCode || warehouse.LocationId || `warehouse_${index}`;
        const quantity = parseInt(warehouse.Quantity || warehouse.Stock || warehouse.AvailableQuantity || 0);
        
        attributes[`warehouse_${warehouseId}`] = {
          numbers: [quantity]
        };
      }
    });
    
    // Build tags
    const tags = [];
    if (product.Brand || product.BRAND) tags.push(product.Brand || product.BRAND);
    tags.push(...categories);
    if (pricingInfo.originalPrice) tags.push('On Sale');
    tags.push('in stock');
    


    // Build the final product object
    const vertexProduct = {
      name: `${this.branchPath}/products/${productId}`,
      id: productId,
      type: 'PRIMARY',
      primaryProductId: productId,
      categories,
      title: product['Product title'] || product['Product Number'] || productId,
      description: product['Product title'] || product['Product Description'] || product.Description || '',
      languageCode: 'en',
      attributes,
      tags,
      priceInfo: pricingInfo,
      rating: ratingInfo,
      availability: availableQuantity > 0 ? 'IN_STOCK' : 'OUT_OF_STOCK',
      availableQuantity,
      uri: `/product/${productId}`,
      publishTime: new Date().toISOString()
    };
    
    // Add images from dedicated image data
    const images = this.buildProductImages(productImages);
    if (images.length > 0) {
      vertexProduct.images = images;
    }
    
    return vertexProduct;
  }

  /**
   * Main processing function
   */
  async process() {
    try {
      console.log('🚀 Starting Whitecap data processing for Vertex AI Search...');
      console.log(`Project: ${PROJECT_ID}`);
      console.log(`Location: ${LOCATION}`);
      console.log(`Catalog: ${CATALOG_ID}`);
      console.log(`Branch: ${BRANCH_ID}`);
      console.log('');

      // Step 1: Read all Excel files with limits
      console.log('📖 Reading Excel files (with limits for POC)...');
      const productsData = this.readExcelFile(PRODUCTS_FILE, null, MAX_PRODUCTS);
      const attributesData = this.readExcelFile(ATTRIBUTES_FILE, null, MAX_ATTRIBUTES);
      const warehousesData = this.readExcelFile(WAREHOUSES_FILE, null, MAX_WAREHOUSES);
      const imagesData = this.readExcelFile(IMAGES_FILE, null, MAX_IMAGES);
      
      console.log(`✅ Loaded ${productsData.length} products, ${attributesData.length} attributes, ${warehousesData.length} warehouse records, ${imagesData.length} image records`);
      console.log('');

      // Step 2: Group related data by product ID
      console.log('🔄 Processing and combining data...');
      
      // Create lookup maps for efficient data combination
      const attributesByProduct = new Map();
      const warehousesByProduct = new Map();
      
      // Group attributes by product
      attributesData.forEach(attr => {
        const productId = attr.ProductId || attr.ProductCode || attr.SKU || attr.Product_Id;
        if (productId) {
          if (!attributesByProduct.has(productId)) {
            attributesByProduct.set(productId, []);
          }
          attributesByProduct.get(productId).push(attr);
        }
      });
      
      // Group warehouses by product
      warehousesData.forEach(warehouse => {
        const productId = warehouse.ProductId || warehouse.ProductCode || warehouse.SKU || warehouse.Product_Id;
        if (productId) {
          if (!warehousesByProduct.has(productId)) {
            warehousesByProduct.set(productId, []);
          }
          warehousesByProduct.get(productId).push(warehouse);
        }
      });
      
      // Process and group images by product
      const imagesByProduct = this.processImages(imagesData);
      
      console.log(`📊 Grouped ${attributesByProduct.size} products with attributes`);
      console.log(`📊 Grouped ${warehousesByProduct.size} products with warehouse data`);
      console.log(`📊 Grouped ${imagesByProduct.size} products with images`);
      
      // Debug: Show some example products with images
      if (imagesByProduct.size > 0) {
        console.log(`📸 Sample products with images:`);
        let count = 0;
        for (const [productId, images] of imagesByProduct) {
          if (count < 3) {
            console.log(`   ${productId}: ${images.length} images (${images.map(img => img.type).join(', ')})`);
            count++;
          }
        }
      }
      console.log('');

      // Step 3: Transform each product
      console.log('🔄 Transforming products to Vertex AI format...');
      const vertexProducts = [];
      let processedCount = 0;
      let skippedCount = 0;
      
      for (const product of productsData) {
                            // Extract productId directly from Product Number field
          const productId = product['Product Number'];
        
        if (!productId) {
          skippedCount++;
          continue;
        }
        
        const productAttributes = attributesByProduct.get(productId) || [];
        const warehouseData = warehousesByProduct.get(productId) || [];
        const productImages = imagesByProduct.get(productId) || [];
        
        // Product and image data is now linked correctly
        
        const vertexProduct = this.transformToVertexAIProduct(product, productAttributes, warehouseData, productImages);
        
        if (vertexProduct) {
          vertexProducts.push(vertexProduct);
          processedCount++;
          
          if (processedCount % 100 === 0) {
            console.log(`   Processed ${processedCount} products...`);
          }
        } else {
          skippedCount++;
        }
      }
      
      console.log(`✅ Successfully transformed ${processedCount} products`);
      if (skippedCount > 0) {
        console.log(`⚠️  Skipped ${skippedCount} products (missing required data)`);
      }
      console.log('');

      // Step 4: Write output file
      console.log('💾 Writing output file...');
      const outputData = {
        metadata: {
          projectId: PROJECT_ID,
          location: LOCATION,
          catalogId: CATALOG_ID,
          branchId: BRANCH_ID,
          generatedAt: new Date().toISOString(),
          totalProducts: vertexProducts.length,
          sourceFiles: {
            products: PRODUCTS_FILE,
            attributes: ATTRIBUTES_FILE,
            warehouses: WAREHOUSES_FILE,
            images: IMAGES_FILE
          }
        },
        products: vertexProducts
      };
      
      fs.writeFileSync(OUTPUT_FILE, JSON.stringify(outputData, null, 2), 'utf-8');
      
      console.log(`✅ Successfully wrote ${vertexProducts.length} products to ${OUTPUT_FILE}`);
      console.log('');
      
      // Step 5: Display summary statistics
      console.log('📊 Summary Statistics:');
      console.log(`   Total products: ${vertexProducts.length}`);
      console.log(`   Products with discounts: ${vertexProducts.filter(p => p.attributes.hasDiscount?.text[0] === 'true').length}`);
      console.log(`   Products with warehouse data: ${vertexProducts.filter(p => p.attributes.stockWarehouses?.numbers[0] > 0).length}`);
      console.log(`   Products with images: ${vertexProducts.filter(p => p.images && p.images.length > 0).length}`);
      console.log(`   Average categories per product: ${(vertexProducts.reduce((sum, p) => sum + p.categories.length, 0) / vertexProducts.length).toFixed(1)}`);
      
      const brandsSet = new Set(vertexProducts.map(p => p.attributes.brand?.text[0]).filter(Boolean));
      console.log(`   Unique brands: ${brandsSet.size}`);
      
      console.log('');
      console.log('🎉 Data processing complete!');
      console.log(`📄 Output file: ${OUTPUT_FILE}`);
      console.log('');
      console.log('Next steps:');
      console.log('1. Review the generated JSON file');
      console.log('2. Upload to Vertex AI Search dashboard');
      console.log('3. Configure search and recommendations');

    } catch (error) {
      console.error('❌ Error during processing:', error.message);
      console.error(error.stack);
      process.exit(1);
    }
  }
}

// Check if required files exist
const requiredFiles = [PRODUCTS_FILE, ATTRIBUTES_FILE, WAREHOUSES_FILE, IMAGES_FILE];
const missingFiles = requiredFiles.filter(file => !fs.existsSync(file));

if (missingFiles.length > 0) {
  console.error('❌ Missing required files:');
  missingFiles.forEach(file => console.error(`   ${file}`));
  console.error('');
  console.error('Please ensure all four Excel files are in the project root:');
  console.error('   - US_Products_1.xlsx');
  console.error('   - US_Attribute_Values_1.xlsx');
  console.error('   - US_Product_Warehouses_1.xlsx');
  console.error('   - US_Product_Images_1.xlsx');
  process.exit(1);
}

// Run the processor
const processor = new WhitecapDataProcessor();
processor.process().catch(error => {
  console.error('❌ Fatal error:', error.message);
  process.exit(1);
}); 
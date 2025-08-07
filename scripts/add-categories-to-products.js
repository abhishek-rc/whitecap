#!/usr/bin/env node

/**
 * Add Category Data to Products
 * 
 * This script reads:
 * - Categories.xlsx: Category information with Name and Category Title
 * - CategoryProduct_Mapping.xlsx: Mapping between Product Number and Category Names
 * - whitecap-vertex-ai-products.json: Existing product data
 * 
 * And adds actual category information to products by:
 * 1. Getting product number from product file
 * 2. Finding category number in the mapping file
 * 3. Getting category data from category file using that ID
 * 4. Adding that category information to the product
 * 
 * Usage: node scripts/add-categories-to-products.js
 */

const fs = require('fs');
const path = require('path');
const XLSX = require('xlsx');

// File paths (relative to project root)
const CATEGORIES_FILE = path.join(__dirname, '..', 'Categories.xlsx');
const MAPPING_FILE = path.join(__dirname, '..', 'CategoryProduct_Mapping.xlsx');
const PRODUCTS_INPUT_FILE = path.join(__dirname, '..', 'whitecap-vertex-ai-products.json');
const PRODUCTS_OUTPUT_FILE = path.join(__dirname, '..', 'whitecap-vertex-ai-products-with-categories.json');

class CategoryProcessor {
  constructor() {
    this.categoriesMap = new Map(); // Map category name/ID to category data
    this.productCategoryMap = new Map(); // Map product number to category name
    this.stats = {
      totalProducts: 0,
      productsWithCategories: 0,
      productsWithoutCategories: 0,
      categoriesLoaded: 0,
      mappingsLoaded: 0
    };
  }

  /**
   * Read Excel file and return JSON data
   */
  readExcelFile(filePath, sheetName = null) {
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
      const data = XLSX.utils.sheet_to_json(worksheet);
      
      console.log(`✅ Successfully read ${data.length} records from ${filePath} (sheet: ${sheetNameToUse})`);
      return data;
    } catch (error) {
      console.error(`❌ Error reading Excel file ${filePath}:`, error.message);
      throw error;
    }
  }

  /**
   * Load category data from Categories.xlsx
   */
  loadCategories() {
    console.log('🏷️  Loading category data...');
    
    const categoriesData = this.readExcelFile(CATEGORIES_FILE);
    
    // Create a map of category names/IDs to category data
    categoriesData.forEach((category, index) => {
      // The category identifier could be in 'Name' field (like '312780')
      const categoryId = category.Name || category.Id;
      const categoryTitle = category['Category Title'];
      
      if (categoryId && categoryTitle) {
        this.categoriesMap.set(categoryId.toString(), {
          id: categoryId,
          title: categoryTitle,
          urlSegment: category['Url Segment'] || '',
          pageTitle: category['Page Title'] || categoryTitle,
          category1Name: category['Category1.Name'] || '',
          category2Name: category['Category2.Name'] || '',
          category3Name: category['Category3.Name'] || '',
          metaDescription: category['Meta Description'] || '',
          metaKeywords: category['Meta Keywords'] || '',
          sortOrder: category['Sort Order'] || 0,
          website: category.Website || 'whitecap',
          openGraphUrl: category['Open Graph Url'] || '',
          fullCategoryData: category // Store full category data for reference
        });
        this.stats.categoriesLoaded++;
      } else {
        console.warn(`⚠️  Category at index ${index} missing Name or Category Title:`, {
          name: categoryId,
          title: categoryTitle
        });
      }
    });
    
    console.log(`✅ Loaded ${this.stats.categoriesLoaded} categories`);
  }

  /**
   * Load product-category mapping from CategoryProduct_Mapping.xlsx
   */
  loadProductCategoryMapping() {
    console.log('🔗 Loading product-category mapping...');
    
    const mappingData = this.readExcelFile(MAPPING_FILE);
    
    // Create a map of product numbers to category names
    mappingData.forEach((mapping, index) => {
      const productNumber = mapping['Product Number'];
      const category1Name = mapping['Category.Category1.Name'];
      
      if (productNumber && category1Name) {
        // Store the mapping - one product can have multiple categories, but we'll use the first one
        const productKey = productNumber.toString();
        if (!this.productCategoryMap.has(productKey)) {
          this.productCategoryMap.set(productKey, {
            category1: category1Name,
            category2: mapping['Category.Category2.Name'] || '',
            category3: mapping['Category.Category3.Name'] || '',
            website: mapping['Category.Website'] || 'whitecap'
          });
          this.stats.mappingsLoaded++;
        }
      } else {
        if (index < 10) { // Only log first 10 warnings to avoid spam
          console.warn(`⚠️  Mapping at index ${index} missing Product Number or Category Name:`, {
            productNumber,
            category1Name
          });
        }
      }
    });
    
    console.log(`✅ Loaded ${this.stats.mappingsLoaded} product-category mappings`);
  }

  /**
   * Get category information for a product
   */
  getCategoryForProduct(productNumber) {
    if (!productNumber) return null;
    
    const productKey = productNumber.toString();
    const categoryMapping = this.productCategoryMap.get(productKey);
    
    if (!categoryMapping) {
      return null;
    }
    
    // Get the category data using the category1 name
    const categoryData = this.categoriesMap.get(categoryMapping.category1);
    
    if (!categoryData) {
      return null;
    }
    
    return {
      title: categoryData.title // Only return the category title
    };
  }

  /**
   * Add category information to a product
   */
  addCategoryToProduct(product) {
    // Try to get product number from various possible fields
    const productNumber = (
      product.id ||
      product.sku ||
      product.productNumber ||
      product['Product Number'] ||
      product.SKU ||
      product.productId ||
      product.ProductNumber ||
      (product.attributes && product.attributes.sku && product.attributes.sku.text && product.attributes.sku.text[0])
    );

    if (!productNumber) {
      console.warn(`⚠️  Product missing identifier:`, Object.keys(product));
      return product;
    }

    const categoryInfo = this.getCategoryForProduct(productNumber);
    
    // Create clean product by removing invalid fields
    const {
      primaryCategory,
      categoryId,
      categoryTitle,
      categoryUrlSegment,
      categoryPageTitle,
      categoryHierarchy,
      ...cleanProduct
    } = product;

    if (categoryInfo) {
      // Add category information to the clean product
      const updatedProduct = {
        ...cleanProduct,
        // Update existing categories array with actual category name
        categories: [categoryInfo.title], // Array format for Vertex AI
        
        // Update attributes with category information
        attributes: {
          ...cleanProduct.attributes,
          category: this.createTextAttribute([categoryInfo.title])
        }
      };

      this.stats.productsWithCategories++;
      return updatedProduct;
    } else {
      this.stats.productsWithoutCategories++;
      return cleanProduct; // Return clean product even without categories
    }
  }

  /**
   * Helper function to create text attributes (matching Whitecap processor format)
   */
  createTextAttribute(values, searchable = true, indexable = true) {
    const filteredValues = Array.isArray(values) 
      ? values.filter(v => v && typeof v === 'string' && v.trim() !== '')
      : [values].filter(v => v && typeof v === 'string' && v.trim() !== '');
    
    if (filteredValues.length === 0) {
      return null;
    }
    
    return {
      text: filteredValues,
      searchable,
      indexable
    };
  }

  /**
   * Process all products and add category information
   */
  async processProducts() {
    console.log('🔄 Processing products and adding category information...');
    
    // Read existing product data
    if (!fs.existsSync(PRODUCTS_INPUT_FILE)) {
      throw new Error(`Products file not found: ${PRODUCTS_INPUT_FILE}`);
    }
    
    console.log(`📖 Reading products from: ${PRODUCTS_INPUT_FILE}`);
    const fileData = JSON.parse(fs.readFileSync(PRODUCTS_INPUT_FILE, 'utf-8'));
    
    // Handle both array format and object format with products key
    let productsData;
    if (Array.isArray(fileData)) {
      productsData = fileData;
    } else if (fileData.products && Array.isArray(fileData.products)) {
      productsData = fileData.products;
    } else {
      throw new Error('Invalid products file format. Expected array or object with products array.');
    }
    
    this.stats.totalProducts = productsData.length;
    console.log(`✅ Loaded ${this.stats.totalProducts} products`);
    
    // Process each product
    const updatedProducts = productsData.map((product, index) => {
      if (index % 1000 === 0) {
        console.log(`📦 Processing product ${index + 1}/${this.stats.totalProducts}...`);
      }
      
      return this.addCategoryToProduct(product);
    });
    
    // Prepare output data in same format as input
    let outputData;
    if (Array.isArray(fileData)) {
      outputData = updatedProducts;
    } else {
      outputData = {
        ...fileData,
        products: updatedProducts
      };
    }
    
    // Save updated products
    console.log(`💾 Saving updated products to: ${PRODUCTS_OUTPUT_FILE}`);
    fs.writeFileSync(PRODUCTS_OUTPUT_FILE, JSON.stringify(outputData, null, 2));
    
    console.log('✅ Products processing complete!');
  }

  /**
   * Display processing statistics
   */
  displayStats() {
    console.log('\n📊 Processing Statistics:');
    console.log('========================');
    console.log(`Categories loaded: ${this.stats.categoriesLoaded}`);
    console.log(`Product-category mappings loaded: ${this.stats.mappingsLoaded}`);
    console.log(`Total products processed: ${this.stats.totalProducts}`);
    console.log(`Products with categories added: ${this.stats.productsWithCategories}`);
    console.log(`Products without categories: ${this.stats.productsWithoutCategories}`);
    
    const successRate = this.stats.totalProducts > 0 
      ? ((this.stats.productsWithCategories / this.stats.totalProducts) * 100).toFixed(1)
      : 0;
    console.log(`Success rate: ${successRate}%`);
    
    if (this.stats.productsWithoutCategories > 0) {
      console.log(`\n⚠️  ${this.stats.productsWithoutCategories} products could not be matched with categories.`);
      console.log('This could be due to:');
      console.log('- Product numbers not found in mapping file');
      console.log('- Category names in mapping not found in categories file');
      console.log('- Different identifier formats between files');
    }
  }

  /**
   * Main processing function
   */
  async process() {
    try {
      console.log('🚀 Starting category processing for Whitecap products...');
      console.log('');
      
      // Step 1: Load category data
      this.loadCategories();
      console.log('');
      
      // Step 2: Load product-category mapping
      this.loadProductCategoryMapping();
      console.log('');
      
      // Step 3: Process products and add category information
      await this.processProducts();
      console.log('');
      
      // Step 4: Display statistics
      this.displayStats();
      
      console.log('\n🎉 Category processing completed successfully!');
      console.log(`📁 Updated products saved to: ${PRODUCTS_OUTPUT_FILE}`);
      
    } catch (error) {
      console.error('❌ Error during category processing:', error);
      process.exit(1);
    }
  }
}

// Run the processor
const processor = new CategoryProcessor();
processor.process();
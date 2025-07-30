#!/usr/bin/env node

/**
 * Fix URL encoding by replacing spaces with %20 in image URLs
 */

const fs = require('fs');
const path = require('path');

class URLEncodingFixer {
  constructor() {
    this.fixedCount = 0;
    this.totalImages = 0;
  }

  /**
   * Properly encode URL by replacing spaces with %20 and other special characters
   */
  encodeImageUrl(url) {
    // Simple approach: just replace spaces and special characters manually
    // This avoids double-encoding issues with encodeURIComponent
    return url
      .replace(/ /g, '%20')           // Replace spaces with %20
      .replace(/,/g, '%2C')           // Replace commas with %2C
      .replace(/\(/g, '%28')          // Replace ( with %28
      .replace(/\)/g, '%29')          // Replace ) with %29
      .replace(/\[/g, '%5B')          // Replace [ with %5B
      .replace(/\]/g, '%5D')          // Replace ] with %5D
      .replace(/'/g, '%27')           // Replace ' with %27
      .replace(/"/g, '%22');          // Replace " with %22
  }

  /**
   * Check if URL needs encoding (contains spaces or other invalid chars)
   */
  needsEncoding(url) {
    return url.includes(' ') || 
           url.includes(',') || 
           url.includes('(') || 
           url.includes(')') ||
           /[^\x00-\x7F]/.test(url); // Non-ASCII characters
  }

  async fixUrlEncoding() {
    console.log('🔧 Fixing URL encoding in image URLs...\n');

    const jsonPath = path.join(__dirname, '..', 'whitecap-vertex-ai-products.json');
    
    if (!fs.existsSync(jsonPath)) {
      console.log('❌ JSON file not found');
      return;
    }

    console.log('📄 Loading JSON data...');
    const jsonData = JSON.parse(fs.readFileSync(jsonPath, 'utf-8'));
    const products = jsonData.products;

    console.log(`📊 Processing ${products.length} products...\n`);

    // Create backup first
    const backupPath = path.join(__dirname, '..', 'whitecap-vertex-ai-products-backup.json');
    fs.writeFileSync(backupPath, JSON.stringify(jsonData, null, 2));
    console.log(`✅ Backup created: ${backupPath}\n`);

    products.forEach((product, index) => {
      if (product.images && product.images.length > 0) {
        product.images.forEach((image, imageIndex) => {
          this.totalImages++;
          
          if (this.needsEncoding(image.uri)) {
            const originalUrl = image.uri;
            
            try {
              const encodedUrl = this.encodeImageUrl(originalUrl);
              image.uri = encodedUrl;
              this.fixedCount++;
              
              if (this.fixedCount <= 10) { // Show first 10 examples
                console.log(`🔧 Product ${product.id}: Fixed URL encoding`);
                console.log(`   Before: ${originalUrl.substring(0, 100)}...`);
                console.log(`   After:  ${encodedUrl.substring(0, 100)}...\n`);
              }
            } catch (error) {
              console.warn(`⚠️  Failed to encode URL for product ${product.id}: ${error.message}`);
            }
          }
        });
      }

      // Progress indicator
      if ((index + 1) % 5000 === 0) {
        console.log(`   Processed ${index + 1} products...`);
      }
    });

    console.log(`\n📊 Summary:`);
    console.log(`   Total products: ${products.length}`);
    console.log(`   Total images: ${this.totalImages}`);
    console.log(`   URLs fixed: ${this.fixedCount}`);
    console.log(`   URLs already valid: ${this.totalImages - this.fixedCount}`);

    // Save the fixed data
    console.log('\n💾 Saving fixed data...');
    fs.writeFileSync(jsonPath, JSON.stringify(jsonData, null, 2));
    console.log(`✅ Fixed data saved: ${jsonPath}`);

    console.log('\n🎉 URL encoding fixing completed!');
    console.log('\nNext steps:');
    console.log('1. Test a few URLs manually to verify they work');
    console.log('2. Re-upload to Vertex AI: node scripts/upload-to-vertex-ai.js');
    console.log('3. URLs should now be properly accessible');
    
    // Test a few URLs if fixed any
    if (this.fixedCount > 0) {
      console.log('\n🧪 Sample fixed URLs to test:');
      let sampleCount = 0;
      for (const product of products) {
        if (product.images && product.images.length > 0) {
          for (const image of product.images) {
            if (image.uri.includes('%20')) {
              console.log(`   ${image.uri}`);
              sampleCount++;
              if (sampleCount >= 3) break;
            }
          }
          if (sampleCount >= 3) break;
        }
      }
    }
  }
}

// Run the fixer
if (require.main === module) {
  const fixer = new URLEncodingFixer();
  fixer.fixUrlEncoding().catch(console.error);
}

module.exports = URLEncodingFixer; 
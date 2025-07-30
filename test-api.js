#!/usr/bin/env node

/**
 * Service Foods API Testing Script
 * Tests all API endpoints for the Vertex AI Search POC
 */

const baseUrl = 'http://localhost:3000/api';

// ANSI color codes for console output
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

function logTest(testName) {
  log(`\n${colors.bold}🧪 Testing: ${testName}${colors.reset}`, 'cyan');
}

function logSuccess(message) {
  log(`✅ ${message}`, 'green');
}

function logError(message) {
  log(`❌ ${message}`, 'red');
}

function logWarning(message) {
  log(`⚠️  ${message}`, 'yellow');
}

function logInfo(message) {
  log(`ℹ️  ${message}`, 'blue');
}

async function makeRequest(endpoint, options = {}) {
  const url = `${baseUrl}${endpoint}`;
  const startTime = Date.now();
  
  try {
    const response = await fetch(url, {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers
      },
      ...options
    });
    
    const endTime = Date.now();
    const responseTime = endTime - startTime;
    
    let data;
    try {
      data = await response.json();
    } catch (e) {
      data = await response.text();
    }
    
    return {
      status: response.status,
      ok: response.ok,
      data,
      responseTime,
      headers: Object.fromEntries(response.headers.entries())
    };
  } catch (error) {
    return {
      status: 0,
      ok: false,
      error: error.message,
      responseTime: Date.now() - startTime
    };
  }
}

async function testHealthEndpoint() {
  logTest('Health Check Endpoint');
  
  const result = await makeRequest('/health');
  
  if (result.ok && result.status === 200) {
    logSuccess(`Health check passed (${result.responseTime}ms)`);
    
    if (result.data.success && result.data.status === 'healthy') {
      logSuccess('Service is healthy');
      logInfo(`Total products: ${result.data.data?.totalProducts || 'N/A'}`);
      logInfo(`Response time: ${result.data.data?.responseTime || 'N/A'}`);
      logInfo(`Version: ${result.data.data?.version || 'N/A'}`);
    } else {
      logWarning('Health check returned unhealthy status');
    }
  } else {
    logError(`Health check failed: ${result.status} - ${result.error || 'Unknown error'}`);
  }
  
  return result.ok;
}

async function testSearchEndpoint() {
  logTest('Search Endpoint');
  
  // Test 1: Basic search without query
  logInfo('Testing basic search (no query)...');
  let result = await makeRequest('/search?limit=5');
  
  if (result.ok) {
    logSuccess(`Basic search passed (${result.responseTime}ms)`);
    if (result.data.success && result.data.data.products) {
      logInfo(`Found ${result.data.data.total} total products`);
      logInfo(`Returned ${result.data.data.products.length} products`);
    }
  } else {
    logError(`Basic search failed: ${result.status}`);
    return false;
  }
  
  // Test 2: Search with query
  logInfo('Testing search with query "cheese"...');
  result = await makeRequest('/search?q=cheese&limit=10');
  
  if (result.ok) {
    logSuccess(`Query search passed (${result.responseTime}ms)`);
    if (result.data.success) {
      logInfo(`Found ${result.data.data.total} cheese products`);
      logInfo(`Query: "${result.data.data.query}"`);
    }
  } else {
    logError(`Query search failed: ${result.status}`);
  }
  
  // Test 3: Search with filters
  logInfo('Testing search with SF Preferred filter...');
  result = await makeRequest('/search?sfPreferred=true&limit=5');
  
  if (result.ok) {
    logSuccess(`Filtered search passed (${result.responseTime}ms)`);
    if (result.data.success) {
      logInfo(`Found ${result.data.data.total} SF Preferred products`);
    }
  } else {
    logError(`Filtered search failed: ${result.status}`);
  }
  
  return true;
}

async function testAutocompleteEndpoint() {
  logTest('Autocomplete Endpoint');
  
  // Test 1: Basic autocomplete
  logInfo('Testing autocomplete with "chee"...');
  let result = await makeRequest('/autocomplete?q=chee&limit=5');
  
  if (result.ok) {
    logSuccess(`Autocomplete passed (${result.responseTime}ms)`);
    if (result.data.success && result.data.data.suggestions) {
      logInfo(`Found ${result.data.data.count} suggestions`);
      logInfo(`Suggestions: ${result.data.data.suggestions.slice(0, 3).join(', ')}...`);
    }
  } else {
    logError(`Autocomplete failed: ${result.status}`);
    return false;
  }
  
  // Test 2: Empty query
  logInfo('Testing autocomplete with empty query...');
  result = await makeRequest('/autocomplete?q=');
  
  if (result.ok) {
    logSuccess(`Empty query autocomplete handled gracefully`);
  } else {
    logWarning(`Empty query autocomplete failed: ${result.status}`);
  }
  
  return true;
}

async function testProductDetailsEndpoint() {
  logTest('Product Details Endpoint');
  
  // First get a product SKU from search
  const searchResult = await makeRequest('/search?limit=1');
  
  if (!searchResult.ok || !searchResult.data.success || !searchResult.data.data.products.length) {
    logError('Could not get product SKU for testing');
    return false;
  }
  
  const testSku = searchResult.data.data.products[0].sku;
  logInfo(`Testing product details for SKU: ${testSku}`);
  
  const result = await makeRequest(`/products/${encodeURIComponent(testSku)}`);
  
  if (result.ok) {
    logSuccess(`Product details passed (${result.responseTime}ms)`);
    if (result.data.success && result.data.data.product) {
      logInfo(`Product: ${result.data.data.product.displayName}`);
      logInfo(`Brand: ${result.data.data.product.brand}`);
      logInfo(`Category: ${result.data.data.product.category}`);
      logInfo(`Stock records: ${result.data.data.stock?.length || 0}`);
    }
  } else {
    logError(`Product details failed: ${result.status}`);
    return false;
  }
  
  return true;
}

async function testRecommendationsEndpoint() {
  logTest('Recommendations Endpoint');
  
  // First get a product SKU from search
  const searchResult = await makeRequest('/search?limit=1');
  
  if (!searchResult.ok || !searchResult.data.success || !searchResult.data.data.products.length) {
    logError('Could not get product SKU for testing');
    return false;
  }
  
  const testSku = searchResult.data.data.products[0].sku;
  
  // Test 1: Similar products
  logInfo(`Testing similar products for SKU: ${testSku}`);
  let result = await makeRequest(`/recommendations?sku=${encodeURIComponent(testSku)}&type=similar&limit=5`);
  
  if (result.ok) {
    logSuccess(`Similar products passed (${result.responseTime}ms)`);
    if (result.data.success) {
      logInfo(`Found ${result.data.data.count} similar products`);
      logInfo(`Reason: ${result.data.data.reason}`);
    }
  } else {
    logError(`Similar products failed: ${result.status}`);
  }
  
  // Test 2: Trending products
  logInfo('Testing trending products...');
  result = await makeRequest('/recommendations?type=trending&limit=5');
  
  if (result.ok) {
    logSuccess(`Trending products passed (${result.responseTime}ms)`);
    if (result.data.success) {
      logInfo(`Found ${result.data.data.count} trending products`);
    }
  } else {
    logError(`Trending products failed: ${result.status}`);
  }
  
  return true;
}

async function testBulkRecommendationsEndpoint() {
  logTest('Bulk Recommendations Endpoint');
  
  // First get a product SKU from search
  const searchResult = await makeRequest('/search?limit=1');
  
  if (!searchResult.ok || !searchResult.data.success || !searchResult.data.data.products.length) {
    logError('Could not get product SKU for testing');
    return false;
  }
  
  const testSku = searchResult.data.data.products[0].sku;
  const testCategory = searchResult.data.data.products[0].category;
  
  const requestBody = {
    productSku: testSku,
    categoryFilter: [testCategory],
    userPreferences: {
      sfPreferred: true
    },
    limit: 4,
    includeTypes: ['similar', 'trending', 'complementary']
  };
  
  logInfo(`Testing bulk recommendations for SKU: ${testSku}`);
  
  const result = await makeRequest('/recommendations/bulk', {
    method: 'POST',
    body: JSON.stringify(requestBody)
  });
  
  if (result.ok) {
    logSuccess(`Bulk recommendations passed (${result.responseTime}ms)`);
    if (result.data.success) {
      logInfo(`Total recommendation types: ${result.data.data.totalTypes}`);
      logInfo(`Total products: ${result.data.data.totalProducts}`);
      
      const recs = result.data.data.recommendations;
      if (recs.similar) logInfo(`Similar products: ${recs.similar.count}`);
      if (recs.trending) logInfo(`Trending products: ${recs.trending.count}`);
      if (recs.complementary) logInfo(`Complementary products: ${recs.complementary.count}`);
    }
  } else {
    logError(`Bulk recommendations failed: ${result.status}`);
    return false;
  }
  
  return true;
}

async function testApiDocumentation() {
  logTest('API Documentation Endpoint');
  
  const result = await makeRequest('/docs');
  
  if (result.ok) {
    logSuccess(`API documentation passed (${result.responseTime}ms)`);
    if (result.data.title && result.data.endpoints) {
      logInfo(`API Title: ${result.data.title}`);
      logInfo(`Version: ${result.data.version}`);
      logInfo(`Endpoints documented: ${Object.keys(result.data.endpoints).length}`);
      logInfo(`Target market: ${result.data.industryContext?.targetMarket || 'N/A'}`);
    }
  } else {
    logError(`API documentation failed: ${result.status}`);
    return false;
  }
  
  return true;
}

async function runAllTests() {
  log('\n' + '='.repeat(60), 'bold');
  log('🚀 Service Foods API Test Suite', 'bold');
  log('Testing Vertex AI Search POC APIs', 'cyan');
  log('='.repeat(60), 'bold');
  
  const tests = [
    { name: 'Health Check', fn: testHealthEndpoint },
    { name: 'API Documentation', fn: testApiDocumentation },
    { name: 'Search', fn: testSearchEndpoint },
    { name: 'Autocomplete', fn: testAutocompleteEndpoint },
    { name: 'Product Details', fn: testProductDetailsEndpoint },
    { name: 'Recommendations', fn: testRecommendationsEndpoint },
    { name: 'Bulk Recommendations', fn: testBulkRecommendationsEndpoint }
  ];
  
  const results = [];
  
  for (const test of tests) {
    try {
      const passed = await test.fn();
      results.push({ name: test.name, passed });
    } catch (error) {
      logError(`Test "${test.name}" threw an error: ${error.message}`);
      results.push({ name: test.name, passed: false, error: error.message });
    }
  }
  
  // Summary
  log('\n' + '='.repeat(60), 'bold');
  log('📊 Test Results Summary', 'bold');
  log('='.repeat(60), 'bold');
  
  const passed = results.filter(r => r.passed).length;
  const total = results.length;
  
  results.forEach(result => {
    if (result.passed) {
      logSuccess(`${result.name}: PASSED`);
    } else {
      logError(`${result.name}: FAILED${result.error ? ` (${result.error})` : ''}`);
    }
  });
  
  log(`\n📈 Overall: ${passed}/${total} tests passed`, passed === total ? 'green' : 'yellow');
  
  if (passed === total) {
    log('🎉 All tests passed! API is ready for production.', 'green');
  } else {
    log('⚠️  Some tests failed. Please review and fix issues.', 'yellow');
  }
  
  log('\n' + '='.repeat(60), 'bold');
}

// Run tests if this script is executed directly
if (require.main === module) {
  runAllTests().catch(error => {
    logError(`Test suite failed: ${error.message}`);
    process.exit(1);
  });
}

module.exports = {
  runAllTests,
  testHealthEndpoint,
  testSearchEndpoint,
  testAutocompleteEndpoint,
  testProductDetailsEndpoint,
  testRecommendationsEndpoint,
  testBulkRecommendationsEndpoint,
  testApiDocumentation
};


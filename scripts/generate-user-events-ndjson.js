#!/usr/bin/env node

/**
 * Generate synthetic user events NDJSON for Vertex AI Retail
 * Reads product IDs from Productextract.csv and outputs user-events.ndjson
 */

const fs = require('fs');
const path = require('path');
const csv = require('csv-parser');
const { v4: uuidv4 } = require('uuid');

// Config
const PRODUCT_CSV = path.join(__dirname, '..', 'Productextract.csv');
const OUTPUT_VISITOR_NDJSON = path.join(__dirname, '..', 'random-visitor-events.ndjson');
const OUTPUT_DEMO_NDJSON = path.join(__dirname, '..', 'demo-user-events.ndjson');
const NUM_EVENTS = 10000;
const NUM_VISITORS = 1000;
const DEMO_USERS = [
  { id: "tahir", name: "Tahir", visitorId: "160463000" },
  { id: "tahsin", name: "Tahsin", visitorId: "95375000" },
  { id: "pooja", name: "Pooja", visitorId: "10000005743" },
  { id: "mahveer", name: "Mahveer", visitorId: "59092000" },
];
const DEMO_USER_EVENTS = 50000; // Number of demo user events to generate
const EVENT_TYPES = [
  'detail-page-view',
  'add-to-cart',
  'purchase-complete',
  'search',
  'home-page-view',
  'shopping-cart-page-view'
];

// Helper: random date in last 60 days
function randomDate() {
  const now = new Date();
  const past = new Date(now.getTime() - Math.floor(Math.random() * 60 * 24 * 60 * 60 * 1000));
  return past.toISOString();
}

// Helper: random element from array
function pick(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

// Read and filter products (active, not deleted, has code)
function readProductIds() {
  return new Promise((resolve, reject) => {
    const ids = [];
    fs.createReadStream(PRODUCT_CSV)
      .pipe(csv())
      .on('data', (row) => {
        const isActive = row.IsActive === 'true';
        const isNotDeleted = row.IsDeleted === 'false';
        const code = row.ProductCode || row.Product_Code__c || '';
        if (isActive && isNotDeleted && code.trim() !== '') {
          ids.push(code.trim());
        }
      })
      .on('end', () => resolve(ids))
      .on('error', reject);
  });
}

async function main() {
  console.log('📖 Reading products from CSV...');
  const productIds = await readProductIds();
  if (productIds.length === 0) {
    console.error('❌ No valid product IDs found in CSV.');
    process.exit(1);
  }
  console.log(`✅ Found ${productIds.length} valid products.`);

  // Prepare visitor IDs (use UUIDs)
  const visitorIds = Array.from({length: NUM_VISITORS}, () => uuidv4());

  // Prepare NDJSON streams
  const outVisitor = fs.createWriteStream(OUTPUT_VISITOR_NDJSON, { flags: 'w' });
  const outDemo = fs.createWriteStream(OUTPUT_DEMO_NDJSON, { flags: 'w' });
  let writtenVisitor = 0;
  let writtenDemo = 0;

  console.log(`📝 Generating ${NUM_EVENTS} synthetic user events in NDJSON...`);
  for (let i = 0; i < NUM_EVENTS; i++) {
    const eventType = pick(EVENT_TYPES);
    const visitorId = pick(visitorIds);
    const eventTime = randomDate();
    let event = { eventType, visitorId, eventTime };

    if (["detail-page-view", "add-to-cart", "purchase-complete"].includes(eventType)) {
      event.productDetails = [{
        product: { id: pick(productIds) },
        quantity: Math.floor(Math.random() * 5) + 1 // required field: random 1-5
      }];
    } else if (eventType === "search") {
      // Use a product code or keyword as search query
      event.searchQuery = pick(productIds);
    }
    // home-page-view has no extra fields

    outVisitor.write(JSON.stringify(event) + '\n');
    writtenVisitor++;
    if (writtenVisitor % 1000 === 0) process.stdout.write(`...${writtenVisitor}`);
  }

  // Generate demo user events
  console.log(`\n📝 Generating ${DEMO_USER_EVENTS} demo user events...`);
  for (let i = 0; i < DEMO_USER_EVENTS; i++) {
    const eventType = pick(EVENT_TYPES);
    const demoUser = pick(DEMO_USERS);
    const eventTime = randomDate();
    // Generate a unique visitorId for each demo user event (use UUID)
    const demoVisitorId = uuidv4();
    let event = {
      eventType,
      visitorId: demoVisitorId,
      eventTime,
      userInfo: { userId: demoUser.id }
    };
    if (["detail-page-view", "add-to-cart", "purchase-complete"].includes(eventType)) {
      event.productDetails = [{
        product: { id: pick(productIds) },
        quantity: Math.floor(Math.random() * 5) + 1
      }];
    } else if (eventType === "search") {
      event.searchQuery = pick(productIds);
    }
    outDemo.write(JSON.stringify(event) + '\n');
    writtenDemo++;
    if (writtenDemo % 10000 === 0) process.stdout.write(`...${writtenDemo}`);
  }

  outVisitor.end();
  outDemo.end();
  console.log(`\n🎉 Done! Wrote ${writtenVisitor} random visitor events to ${OUTPUT_VISITOR_NDJSON}`);
  console.log(`🎉 Done! Wrote ${writtenDemo} demo user events to ${OUTPUT_DEMO_NDJSON}`);
}

async function generateDemoDetailPageViews() {
  console.log('📖 Reading products from CSV...');
  const productIds = await readProductIds();
  if (productIds.length < 100) {
    console.error('❌ Need at least 100 unique products in Productextract.csv.');
    process.exit(1);
  }
  const outFile = path.join(__dirname, '..', 'demo-detail-page-views.ndjson');
  const out = fs.createWriteStream(outFile, { flags: 'w' });
  let total = 0;
  for (const demoUser of DEMO_USERS) {
    // Shuffle products for each user
    const shuffledProducts = [...productIds].sort(() => Math.random() - 0.5);
    for (let i = 0; i < 100; i++) {
      const event = {
        eventType: 'detail-page-view',
        visitorId: uuidv4(),
        eventTime: randomDate(),
        userInfo: { userId: demoUser.id },
        productDetails: [{
          product: { id: shuffledProducts[i] },
          quantity: Math.floor(Math.random() * 5) + 1
        }]
      };
      out.write(JSON.stringify(event) + '\n');
      total++;
    }
    console.log(`✅ Generated 100 detail-page-view events for ${demoUser.id}`);
  }
  out.end();
  console.log(`🎉 Done! Wrote ${total} detail-page-view events to ${outFile}`);
}

if (require.main === module) {
  if (process.argv.includes('--generate-demo-detail-page-views')) {
    generateDemoDetailPageViews().catch(err => {
      console.error('💥 Failed:', err);
      process.exit(1);
    });
  } else {
    main().catch(err => {
      console.error('💥 Failed:', err);
      process.exit(1);
    });
  }
}

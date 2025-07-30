#!/usr/bin/env node

/**
 * Script to set up Vercel environment variables for Vertex AI Search
 * 
 * This script reads the service account key file and sets up the necessary
 * environment variables for Vercel deployment.
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Read the service account key file
const credentialsPath = path.join(__dirname, '..', 'vertex-ai-key.json');

if (!fs.existsSync(credentialsPath)) {
  console.error('❌ Service account key file not found at:', credentialsPath);
  process.exit(1);
}

try {
  const credentials = fs.readFileSync(credentialsPath, 'utf8');
  const parsedCredentials = JSON.parse(credentials);
  
  // Base64 encode the credentials for Vercel
  const base64Credentials = Buffer.from(credentials).toString('base64');
  
  console.log('🚀 Vercel Environment Variables Setup');
  console.log('=====================================');
  console.log('');
  console.log('Please set these environment variables in your Vercel dashboard:');
  console.log('');
  console.log('1. GOOGLE_CLOUD_PROJECT_ID=gwa-vertex');
  console.log('2. VERTEX_AI_LOCATION=global');
  console.log('3. VERTEX_AI_CATALOG_ID=default_catalog');
  console.log('4. VERTEX_AI_BRANCH_ID=0');
  console.log('5. VERTEX_AI_PLACEMENT_ID=recently_viewed_default');
  console.log('');
  console.log('6. GOOGLE_APPLICATION_CREDENTIALS=');
  console.log('   (Copy the base64 encoded string below)');
  console.log('');
  console.log('Base64 encoded credentials:');
  console.log('----------------------------');
  console.log(base64Credentials);
  console.log('----------------------------');
  console.log('');
  console.log('Alternatively, you can also use the JSON directly:');
  console.log('');
  console.log('GOOGLE_APPLICATION_CREDENTIALS=');
  console.log(JSON.stringify(parsedCredentials, null, 2));
  console.log('');
  console.log('✅ Setup complete!');
  console.log('');
  console.log('Next steps:');
  console.log('1. Go to your Vercel dashboard');
  console.log('2. Navigate to your project settings');
  console.log('3. Go to Environment Variables section');
  console.log('4. Add each variable listed above');
  console.log('5. Redeploy your application');
  
} catch (error) {
  console.error('❌ Error reading service account key:', error);
  process.exit(1);
}

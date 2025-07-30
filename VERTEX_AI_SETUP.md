# Vertex AI Search for Commerce Setup Guide

This guide walks you through setting up Google Cloud's Vertex AI Search for Commerce for the Service Foods search application.

## Overview

Vertex AI Search for Commerce (formerly Vertex AI Search for Retail) provides:
- **Recommendations AI**: Personalized product recommendations
- **Retail Search**: Google-quality search for e-commerce
- **Vision API Product Search**: Image-based product search

## Prerequisites

1. **Google Cloud Project**: Active GCP project with billing enabled
2. **APIs Enabled**: Retail API, Vertex AI API
3. **Service Account**: With appropriate permissions
4. **Sample Data**: Product and stock CSV files

## Step 1: Google Cloud Setup

### 1.1 Create or Select a Project

```bash
# Create a new project
gcloud projects create gwa-vertex --name="Service Foods Search"

# Set as default project
gcloud config set project gwa-vertex
```

### 1.2 Enable Required APIs

```bash
# Enable Retail API
gcloud services enable retail.googleapis.com

# Enable Vertex AI API
gcloud services enable aiplatform.googleapis.com

# Enable other supporting APIs
gcloud services enable cloudbuild.googleapis.com
gcloud services enable storage.googleapis.com
```

### 1.3 Create Service Account

```bash
# Create service account
gcloud iam service-accounts create vertex-ai-search \
    --display-name="Vertex AI Search Service Account" \
    --description="Service account for Vertex AI Search for Commerce"

# Grant necessary roles
gcloud projects add-iam-policy-binding gwa-vertex \
    --member="serviceAccount:vertex-ai-search@gwa-vertex.iam.gserviceaccount.com" \
    --role="roles/retail.admin"

gcloud projects add-iam-policy-binding gwa-vertex \
    --member="serviceAccount:vertex-ai-search@gwa-vertex.iam.gserviceaccount.com" \
    --role="roles/aiplatform.user"

# Create and download key
gcloud iam service-accounts keys create vertex-ai-key.json \
    --iam-account=vertex-ai-search@gwa-vertex.iam.gserviceaccount.com
```

## Step 2: Application Configuration

### 2.1 Environment Setup

```bash
# Copy environment template
cp .env.example .env.local

# Edit configuration
nano .env.local
```

Update `.env.local` with your values:

```env
GOOGLE_CLOUD_PROJECT_ID=gwa-vertex
GOOGLE_APPLICATION_CREDENTIALS=./vertex-ai-key.json
VERTEX_AI_LOCATION=global
VERTEX_AI_CATALOG_ID=default_catalog
VERTEX_AI_BRANCH_ID=default_branch
NEXT_PUBLIC_ENABLE_VERTEX_AI=true
```

### 2.2 Install Dependencies

```bash
# Install Google Cloud dependencies
npm install google-auth-library csv-parser

# Install development dependencies
npm install --save-dev @types/node
```

## Step 3: Data Upload

### 3.1 Prepare Data Files

Ensure your CSV files are in the project root:
- `Productextract.csv`: Product catalog data
- `Stockextract.csv`: Stock/inventory data

### 3.2 Upload to Vertex AI

```bash
# Make upload script executable
chmod +x scripts/upload-to-vertex-ai.js

# Run data upload
node scripts/upload-to-vertex-ai.js
```

The script will:
1. Create the catalog if it doesn't exist
2. Set up serving configurations
3. Transform CSV data to Retail API format
4. Upload products in batches
5. Handle rate limiting and errors

### 3.3 Monitor Upload Progress

```bash
# Check operation status in Google Cloud Console
# Navigate to: Vertex AI > Search for Commerce > Operations
```

## Step 4: Testing Integration

### 4.1 Start Development Server

```bash
npm run dev
```

### 4.2 Test Search Functionality

1. **Basic Search**: Try searching for "cheese" or "chocolate"
2. **Autocomplete**: Type partial product names
3. **Faceted Search**: Use filters for brand, category, availability
4. **Product Details**: Click on product cards to view details
5. **Recommendations**: Check related products on detail pages

### 4.3 Verify Vertex AI Integration

Check browser network tab for API calls to:
- `/api/search` - Should show Vertex AI responses
- `/api/autocomplete` - Should show suggestions from Vertex AI
- `/api/recommendations` - Should show personalized recommendations

## Step 5: Advanced Configuration

### 5.1 Custom Serving Configs

Create specialized serving configurations for different use cases:

```javascript
// Example: Create a serving config for trending products
const trendingConfig = {
  name: 'trending_products',
  displayName: 'Trending Products',
  modelId: 'most-popular-items',
  priceRerankingLevel: 'HIGH',
  diversityLevel: 'HIGH'
};
```

### 5.2 User Event Tracking

Implement comprehensive user event tracking:

```javascript
// Track product views
await vertexAICommerceService.writeUserEvent({
  eventType: 'detail-page-view',
  visitorId: userId,
  productDetails: [{ product: { id: productSku }, quantity: 1 }],
  eventTime: new Date().toISOString()
});

// Track purchases
await vertexAICommerceService.writeUserEvent({
  eventType: 'purchase-complete',
  visitorId: userId,
  productDetails: cartItems,
  purchaseTransaction: {
    id: orderId,
    revenue: totalAmount,
    currencyCode: 'AUD'
  },
  eventTime: new Date().toISOString()
});
```

### 5.3 A/B Testing Setup

Configure A/B testing for different search configurations:

```javascript
// Example: Test different boost configurations
const testConfig = {
  boostSpec: {
    conditionBoostSpecs: [
      {
        condition: 'attributes.isSFPreferred: ANY("true")',
        boost: experimentGroup === 'A' ? 1 : 0.5 // Different boost for A/B test
      }
    ]
  }
};
```

## Step 6: Monitoring and Analytics

### 6.1 Google Cloud Console

Monitor your implementation in the Google Cloud Console:

1. **Vertex AI Search for Commerce Dashboard**
   - Search analytics
   - Recommendation performance
   - User engagement metrics

2. **Operations Tab**
   - Data import status
   - Model training progress
   - Error logs

### 6.2 Application Metrics

Track key performance indicators:

```javascript
// Example metrics to track
const metrics = {
  searchLatency: responseTime,
  clickThroughRate: clicks / impressions,
  conversionRate: purchases / sessions,
  recommendationAccuracy: clickedRecommendations / totalRecommendations
};
```

## Step 7: Production Deployment

### 7.1 Environment Configuration

For production deployment:

```env
NODE_ENV=production
GOOGLE_CLOUD_PROJECT_ID=gwa-vertex-prod
VERTEX_AI_LOCATION=global
NEXT_PUBLIC_ENABLE_VERTEX_AI=true
NEXT_PUBLIC_ENABLE_FALLBACK_SEARCH=true
```

### 7.2 Security Considerations

1. **Service Account Keys**: Use Workload Identity in production
2. **API Rate Limits**: Implement proper rate limiting
3. **Data Privacy**: Ensure compliance with data protection regulations
4. **Access Control**: Restrict API access to authorized domains

### 7.3 Performance Optimization

1. **Caching**: Implement Redis caching for frequent queries
2. **CDN**: Use CDN for static assets and API responses
3. **Monitoring**: Set up alerting for API errors and latency

## Troubleshooting

### Common Issues

1. **Authentication Errors**
   ```bash
   # Verify service account permissions
   gcloud auth activate-service-account --key-file=vertex-ai-key.json
   gcloud auth list
   ```

2. **API Quota Exceeded**
   ```bash
   # Check quotas in Google Cloud Console
   # Request quota increases if needed
   ```

3. **Data Import Failures**
   ```bash
   # Check operation status
   gcloud retail operations list
   
   # View operation details
   gcloud retail operations describe OPERATION_ID
   ```

4. **Search Returns No Results**
   - Verify data indexing is complete
   - Check product data format
   - Ensure proper category and attribute mapping

### Debug Mode

Enable debug logging:

```env
NEXT_PUBLIC_DEBUG_VERTEX_AI=true
```

This will log detailed API requests and responses to the browser console.

## Best Practices

1. **Data Quality**: Ensure high-quality product data with complete attributes
2. **User Events**: Implement comprehensive user event tracking from day one
3. **Testing**: Use A/B testing to optimize search and recommendation performance
4. **Monitoring**: Set up comprehensive monitoring and alerting
5. **Fallback**: Always implement fallback search for reliability

## Support and Resources

- [Vertex AI Search for Commerce Documentation](https://cloud.google.com/retail/docs)
- [Google Cloud Support](https://cloud.google.com/support)
- [Community Forums](https://cloud.google.com/community)
- [Sample Code Repository](https://github.com/GoogleCloudPlatform/retail-common-services)

## Cost Optimization

1. **Monitor Usage**: Track API calls and data storage costs
2. **Optimize Queries**: Use efficient search parameters
3. **Cache Results**: Implement caching for repeated queries
4. **Data Lifecycle**: Set up data retention policies

---

For additional support or questions about this implementation, please refer to the official Google Cloud documentation or contact the development team.


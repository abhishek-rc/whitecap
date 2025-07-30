# New Vertex AI Recommendation Models Implementation

This document describes the implementation of new Vertex AI recommendation models for on-sale products and similar items.

## New Models

### 1. On Sale Model
- **Placement ID**: `on-sale`
- **Display Name**: "On Sale"
- **Description**: "on sale"
- **Type**: Recommendation
- **API Endpoint**: `/api/recommendations/on-sale`

### 2. Similar Items Model  
- **Placement ID**: `similar-items`
- **Display Name**: "Similar Items"
- **Description**: "Similar items"  
- **Type**: Recommendation
- **API Endpoint**: `/api/recommendations/similar-items`

## API Endpoints

### On Sale Recommendations
```
GET /api/recommendations/on-sale
```

**Parameters:**
- `limit` (optional): Number of products to return (default: 10)
- `visitorId` (optional): Visitor identifier (default: 'anonymous-user')
- `category` (optional): Filter by category
- `brand` (optional): Filter by brand

**Response:**
```json
{
  "products": [...],
  "score": 0.9,
  "reason": "On-sale products from Vertex AI recommendation model",
  "count": 10,
  "type": "on-sale",
  "metadata": {
    "model": "on-sale",
    "placementId": "on-sale",
    "source": "vertex-ai-live",
    "timestamp": "2025-07-21T...",
    "filters": {
      "category": null,
      "brand": null
    }
  }
}
```

### Similar Items Recommendations
```
GET /api/recommendations/similar-items
```

**Parameters:**
- `sku` (required): Product SKU to find similar items for
- `limit` (optional): Number of products to return (default: 10)
- `visitorId` (optional): Visitor identifier (default: 'anonymous-user')
- `category` (optional): Filter by category
- `brand` (optional): Filter by brand

**Response:**
```json
{
  "products": [...],
  "score": 0.85,
  "reason": "Similar items to {sku} from Vertex AI recommendation model",
  "count": 10,
  "type": "similar-items",
  "metadata": {
    "model": "similar-items",
    "placementId": "similar-items", 
    "source": "vertex-ai-live",
    "baseSku": "FLOUC",
    "timestamp": "2025-07-21T...",
    "filters": {
      "category": null,
      "brand": null,
      "excludedSku": "FLOUC"
    }
  }
}
```

## Implementation Details

### Key Features
1. **Live Data Only**: Both APIs use only live data from Vertex AI API, no local fallback
2. **Real-time Predictions**: Each request makes a fresh call to Vertex AI for current recommendations
3. **Filtering Support**: Both APIs support category and brand filtering
4. **Error Handling**: Comprehensive error handling with detailed error responses
5. **Metadata Tracking**: Detailed metadata in responses for debugging and monitoring

### Integration Points

#### Bulk Recommendations API
The bulk recommendations API (`/api/recommendations/bulk`) has been updated to include the new models:
- `on-sale`: Available for all requests
- `similar-items`: Available when `productSku` is provided

#### RecommendationsWidget Component
The React component has been updated to display:
- **🏷️ On Sale (AI)**: Shows on-sale products from the new model
- **🔗 Similar Items (AI)**: Shows similar items from the new model

### User Event Context
Both APIs send appropriate user events to Vertex AI for better recommendation context:

**On Sale Model:**
- Event type: `detail-page-view`
- URI: `/recommendations/on-sale`
- Search query: `'on sale products'`
- Context attributes: `['on-sale', 'promotion', 'discount']`

**Similar Items Model:**
- Event type: `detail-page-view`
- URI: `/product/{sku}`
- Product details: Information about the base product
- Context attributes: `['similar-items', 'related', 'recommendation']`

## Testing

A test API endpoint is available at `/api/test-new-models` to validate the implementation:

```
GET /api/test-new-models?sku=FLOUC
```

This endpoint tests both new models and returns a comprehensive report including:
- Success/failure status for each model
- Product counts returned
- Response validation
- Error details if any

## Usage Examples

### Get On-Sale Products
```javascript
const response = await fetch('/api/recommendations/on-sale?limit=8');
const data = await response.json();
console.log('On-sale products:', data.products);
```

### Get Similar Items for a Product
```javascript
const response = await fetch('/api/recommendations/similar-items?sku=FLOUC&limit=6');
const data = await response.json();
console.log('Similar items:', data.products);
```

### Use in Bulk Recommendations
```javascript
const response = await fetch('/api/recommendations/bulk', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    productSku: 'FLOUC',
    limit: 8,
    includeTypes: ['similar-items', 'on-sale', 'trending']
  })
});
const data = await response.json();
```

## Error Handling

Both APIs return structured error responses when Vertex AI fails:

```json
{
  "error": "Failed to get recommendations from Vertex AI",
  "products": [],
  "count": 0,
  "type": "on-sale",
  "score": 0,
  "reason": "Vertex AI API error",
  "metadata": {
    "model": "on-sale",
    "source": "vertex-ai-live",
    "error": "Detailed error message",
    "timestamp": "2025-07-21T..."
  }
}
```

## Monitoring

Each API call includes comprehensive logging:
- Request parameters
- Vertex AI API response details
- Product transformation results
- Performance metrics
- Error details

Look for log prefixes:
- `🏷️` for on-sale model logs
- `🔗` for similar-items model logs
- `📊` for prediction response logs
- `✅`/`❌` for success/error logs

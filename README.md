# Whitecap - Vertex AI Search for Commerce POC

A comprehensive proof-of-concept implementation demonstrating Google Cloud's Vertex AI Search for Commerce capabilities for the Whitecap ECommerce platform. This Next.js application showcases advanced search functionality, intelligent product recommendations, and seamless integration with Google Cloud's retail AI services.

## 🚀 Overview

This cutting-edge implementation leverages Google Cloud's advanced AI capabilities to deliver a superior e-commerce search and discovery experience. Built specifically for Whitecap, the application processes product catalogs and warehouse data to deliver intelligent search results and personalized recommendations.

### Key Features

- **🔍 Vertex AI Search Integration**: Real-time semantic search powered by Google Cloud's Retail API
- **🤖 Intelligent Recommendations**: AI-driven product suggestions based on user behavior and product relationships  
- **⚡ Advanced Autocomplete**: Smart query completion with real-time suggestions
- **🎯 Faceted Search**: Multi-dimensional filtering by brand, category, availability, and SF Preferred status
- **📱 Responsive Design**: Modern, mobile-first UI built with Next.js and Tailwind CSS
- **🔄 Fallback Architecture**: Robust local search fallback when cloud services are unavailable
- **📊 Analytics Ready**: Built-in user event tracking for personalization and analytics

## 🏗️ Architecture

The application follows a modern, scalable architecture designed for enterprise deployment:

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   Next.js App   │    │   Vertex AI      │    │   Whitecap      │
│   (Frontend)    │◄──►│   Search API     │◄──►│   Data Sources  │
└─────────────────┘    └──────────────────┘    └─────────────────┘
         │                       │                       │
         ▼                       ▼                       ▼
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   Local Search  │    │   Google Cloud   │    │   CSV Data      │
│   (Fallback)    │    │   Retail API     │    │   Processing    │
└─────────────────┘    └──────────────────┘    └─────────────────┘
```

### Technology Stack

- **Frontend**: Next.js 15, React 18, TypeScript, Tailwind CSS
- **Backend**: Next.js API Routes, Node.js
- **AI/ML**: Google Cloud Vertex AI Search for Commerce, Retail API
- **Data Processing**: CSV parsing, real-time indexing
- **Authentication**: Google Cloud Service Account authentication
- **Deployment**: Vercel-ready, Docker-compatible

## 📋 Prerequisites

Before setting up the application, ensure you have:

1. **Node.js 18+** and npm installed
2. **Google Cloud Project** with billing enabled
3. **Vertex AI Search for Commerce** API enabled
4. **Service Account** with appropriate permissions
5. **Product and Stock Data** in CSV format

## 🛠️ Quick Start

### 1. Clone and Install

```bash
git clone <repository-url>
cd vertex-ai-search-nextjs
npm install
```

### 2. Environment Configuration

```bash
cp .env.example .env.local
```

Edit `.env.local` with your configuration:

```env
GOOGLE_CLOUD_PROJECT_ID=your-project-id
GOOGLE_APPLICATION_CREDENTIALS=./path/to/service-account-key.json
VERTEX_AI_LOCATION=global
VERTEX_AI_CATALOG_ID=default_catalog
VERTEX_AI_BRANCH_ID=default_branch
NEXT_PUBLIC_ENABLE_VERTEX_AI=true
```

### 3. Data Setup

Place your Excel files in the project root:
- `US_Products_1.xlsx` - Product catalog data
- `US_Attribute_Values_1.xlsx` - Product attributes data  
- `US_Product_Warehouses_1.xlsx` - Inventory/stock data

### 4. Process Whitecap Data (Required)

First, process the Excel files into Vertex AI format:

```bash
node scripts/process-whitecap-data.js
```

### 5. Upload Data to Vertex AI (Optional)

```bash
node scripts/upload-to-vertex-ai.js
```

### 6. Start Development Server

```bash
npm run dev
```

Visit `http://localhost:3000` to see the application.

## 🔧 Configuration

### Environment Variables

| Variable | Description | Required | Default |
|----------|-------------|----------|---------|
| `GOOGLE_CLOUD_PROJECT_ID` | Google Cloud project ID | Yes | - |
| `GOOGLE_APPLICATION_CREDENTIALS` | Path to service account key | Yes | - |
| `VERTEX_AI_LOCATION` | Vertex AI location | No | `global` |
| `VERTEX_AI_CATALOG_ID` | Retail catalog ID | No | `default_catalog` |
| `VERTEX_AI_BRANCH_ID` | Retail branch ID | No | `default_branch` |
| `NEXT_PUBLIC_ENABLE_VERTEX_AI` | Enable Vertex AI integration | No | `true` |
| `NEXT_PUBLIC_ENABLE_FALLBACK_SEARCH` | Enable local search fallback | No | `true` |

### Google Cloud Setup

Detailed setup instructions are available in [VERTEX_AI_SETUP.md](./VERTEX_AI_SETUP.md).

---

### 🧪 Generating Dummy Historical User Events Data

To generate synthetic user events for model training, testing, or bulk ingestion into Vertex AI Retail:

1. **Run the Generator Script**

   This repository provides a script to create a large NDJSON file of realistic user events based on your product catalog:

   ```bash
   node scripts/generate-user-events-ndjson.js
   ```

   - The script reads processed Whitecap product data and generates realistic user events.
   - Events include types such as `detail-page-view`, `add-to-cart`, `purchase-complete`, `search`, and `home-page-view`.
   - Visitor IDs and event timestamps are randomized for realism.

---


## 📊 Data Schema

### Product Data Structure

The application expects product data with the following key fields:

```typescript
interface Product {
  SKU: string;                    // Unique product identifier
  DisplayName: string;            // Product display name
  Description: string;            // Product description
  Category: string;               // Primary category
  Brand: string;                  // Product brand
  Vendor: string;                 // Vendor ID
  VendorName: string;             // Vendor display name
  Units: string;                  // Unit of measure
  SFPreferred: boolean;           // SF Preferred status
  ImageURL: string;               // Product image URL
  availability: string;           // Stock availability
  availableQuantity: number;      // Available quantity
}
```

### Stock Data Structure

```typescript
interface Stock {
  SKU: string;                    // Product SKU reference
  Warehouse: string;              // Warehouse identifier
  AvailableQuantity: number;      // Available stock quantity
  Status: string;                 // Stock status
  AverageCost: number;            // Average cost
  LastCost: number;               // Last purchase cost
  StandardCost: number;           // Standard cost
}
```

## 🔍 API Reference

### Search API

**Endpoint**: `GET /api/search`

**Parameters**:
- `q` (string): Search query
- `page` (number): Page number (default: 1)
- `limit` (number): Results per page (default: 20)
- `category` (string): Filter by category
- `brand` (string): Filter by brand
- `sfPreferred` (boolean): Filter SF Preferred products
- `availability` (string): Filter by availability status
- `sortBy` (string): Sort order (price_asc, price_desc, name_asc, name_desc)

**Response**:
```json
{
  "products": [...],
  "facets": {
    "brands": [...],
    "categories": [...],
    "availability": [...]
  },
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 422,
    "totalPages": 22
  },
  "query": "cheese",
  "queryTime": 3393
}
```

### Autocomplete API

**Endpoint**: `GET /api/autocomplete`

**Parameters**:
- `q` (string): Partial query
- `limit` (number): Max suggestions (default: 8)

**Response**:
```json
{
  "suggestions": [
    "cheese cheddar",
    "cheese mozzarella",
    "cheese parmesan"
  ],
  "query": "chee"
}
```

### Recommendations API

**Endpoint**: `GET /api/recommendations`

**Parameters**:
- `sku` (string): Product SKU for context
- `type` (string): Recommendation type (similar-items, frequently-bought-together, recommended-for-you, trending)
- `limit` (number): Max recommendations (default: 10)
- `visitorId` (string): User identifier for personalization

**Response**:
```json
{
  "recommendations": [...],
  "type": "similar-items",
  "sku": "CHEESE001",
  "metadata": {
    "totalResults": 10,
    "source": "vertex-ai"
  }
}
```

## 🎨 UI Components

### SearchBar Component

Advanced search interface with autocomplete functionality:

```typescript
<SearchBar
  onSearch={(query) => handleSearch(query)}
  placeholder="Search products, SKUs, brands..."
  showAutocomplete={true}
  maxSuggestions={8}
/>
```

### ProductCard Component

Responsive product display with action buttons:

```typescript
<ProductCard
  product={product}
  onView={(sku) => navigateToProduct(sku)}
  onAddToCart={(sku) => addToCart(sku)}
  showAvailability={true}
  showSFPreferred={true}
/>
```

### FilterSidebar Component

Multi-faceted filtering interface:

```typescript
<FilterSidebar
  facets={searchResults.facets}
  selectedFilters={filters}
  onFilterChange={(filters) => updateFilters(filters)}
/>
```

### RecommendationsWidget Component

Intelligent product recommendations:

```typescript
<RecommendationsWidget
  productSku={currentProduct.sku}
  type="similar-items"
  limit={6}
  title="Similar Products"
/>
```

## 🚀 Deployment

### Vercel Deployment (Recommended)

1. **Connect Repository**:
   ```bash
   vercel --prod
   ```

2. **Configure Environment Variables** in Vercel dashboard

3. **Upload Service Account Key** as a file or use Vercel's secret management

### Docker Deployment

```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
RUN npm run build
EXPOSE 3000
CMD ["npm", "start"]
```

### Google Cloud Run Deployment

```bash
gcloud run deploy vertex-ai-search \
  --source . \
  --platform managed \
  --region global  \
  --allow-unauthenticated
```

## 📈 Performance Optimization

### Caching Strategy

The application implements multi-level caching:

1. **Browser Caching**: Static assets and API responses
2. **CDN Caching**: Global content delivery
3. **Application Caching**: Frequent search queries and product data
4. **Database Caching**: Vertex AI API responses

### Search Performance

- **Average Search Latency**: < 500ms (local fallback)
- **Vertex AI Latency**: < 2s (including network)
- **Autocomplete Response**: < 100ms
- **Recommendation Generation**: < 1s

### Scalability Considerations

- **Horizontal Scaling**: Stateless Next.js application
- **Database Scaling**: Vertex AI handles scaling automatically
- **CDN Integration**: Global content delivery
- **Load Balancing**: Multiple instance support

## 🔒 Security

### Authentication & Authorization

- **Service Account Authentication**: Secure Google Cloud access
- **API Key Management**: Environment-based configuration
- **CORS Configuration**: Restricted domain access
- **Rate Limiting**: API abuse prevention

### Data Privacy

- **PII Protection**: No personal data storage
- **Audit Logging**: Comprehensive access logs
- **Encryption**: Data in transit and at rest
- **Compliance**: GDPR and industry standards ready

## 📊 Analytics & Monitoring

### User Event Tracking

The application tracks key user interactions:

```typescript
// Search events
await trackUserEvent({
  eventType: 'search',
  query: searchQuery,
  resultsCount: results.length,
  timestamp: new Date()
});

// Product view events
await trackUserEvent({
  eventType: 'product-view',
  productSku: product.sku,
  source: 'search-results',
  timestamp: new Date()
});
```

### Key Metrics

- **Search Success Rate**: Percentage of searches returning results
- **Click-Through Rate**: Search result engagement
- **Conversion Rate**: Product view to action conversion
- **Recommendation Accuracy**: User engagement with recommendations
- **Search Latency**: Response time distribution
- **Error Rate**: API failure percentage

### Monitoring Dashboard

Integration with Google Cloud Monitoring provides:

- Real-time performance metrics
- Error tracking and alerting
- User behavior analytics
- Cost optimization insights

## 🧪 Testing

### Unit Tests

```bash
npm run test
```

### Integration Tests

```bash
npm run test:integration
```

### E2E Tests

```bash
npm run test:e2e
```

### Performance Tests

```bash
npm run test:performance
```

## 🐛 Troubleshooting

### Common Issues

1. **Authentication Errors**
   - Verify service account permissions
   - Check credential file path
   - Ensure APIs are enabled

2. **Search Not Working**
   - Check Vertex AI setup
   - Verify data indexing status
   - Test fallback search

3. **Performance Issues**
   - Enable caching
   - Optimize query parameters
   - Check network connectivity

### Debug Mode

Enable detailed logging:

```env
NEXT_PUBLIC_DEBUG_VERTEX_AI=true
NODE_ENV=development
```

### Support Resources

- [Vertex AI Documentation](https://cloud.google.com/retail/docs)
- [Next.js Documentation](https://nextjs.org/docs)
- [Project Issues](./issues)
- [Community Forum](./discussions)

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guide](./CONTRIBUTING.md) for details.

### Development Workflow

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests
5. Submit a pull request

### Code Standards

- TypeScript for type safety
- ESLint for code quality
- Prettier for formatting
- Conventional commits

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](./LICENSE) file for details.

## 🙏 Acknowledgments

- **Google Cloud Team** for Vertex AI Search for Commerce
- **Whitecap** for providing the business context and data
- **Next.js Team** for the excellent framework
- **Vercel** for deployment platform

## 📞 Support

For technical support or questions:

- **Email**: support@servicefoods.com.au
- **Documentation**: [VERTEX_AI_SETUP.md](./VERTEX_AI_SETUP.md)
- **Issues**: [GitHub Issues](./issues)

---

**Built with ❤️ by Manus AI for Whitecap**


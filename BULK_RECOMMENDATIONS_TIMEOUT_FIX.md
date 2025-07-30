# Bulk Recommendations API Timeout Fix

## Problem
The `/api/recommendations/bulk` endpoint was returning 504 Gateway Timeout errors on Vercel because:
- Multiple sequential async operations were taking too long
- No timeout handling for individual operations
- Sequential execution was inefficient for I/O operations
- Function exceeded Vercel's execution time limit

## Solution Applied

### 1. Overall Function Timeout Wrapper
```typescript
export async function POST(request: NextRequest) {
  // Set overall function timeout for Vercel (must complete within 8 seconds)
  const overallTimeout = new Promise<never>((_, reject) => {
    setTimeout(() => reject(new Error('Function timeout - using fallback')), 8000);
  });

  try {
    return await Promise.race([
      processBulkRecommendations(request),
      overallTimeout
    ]);
  } catch (error) {
    return await handleBulkFallback(request);
  }
}
```

### 2. Concurrent Execution Instead of Sequential
**Before**: Operations were executed one after another
```typescript
const similar = await recommendationEngine.getSimilarProducts(productSku, limit);
const complementary = await recommendationEngine.getComplementaryProducts(productSku, limit);
const trending = await recommendationEngine.getTrendingProducts(categoryFilter, limit);
```

**After**: Operations are executed concurrently
```typescript
const promises: Promise<void>[] = [];
// All operations are pushed to promises array and executed with Promise.all()
```

### 3. Individual Operation Timeouts
Each operation now has a 2-second timeout:
```typescript
Promise.race([
  recommendationEngine.getSimilarProducts(productSku, limit),
  new Promise((_, reject) => setTimeout(() => reject(new Error('Similar products timeout')), 2000))
])
```

### 4. Layered Timeout Strategy
- **Individual operations**: 2 seconds each
- **All operations combined**: 6 seconds  
- **Overall function**: 8 seconds
- **Vercel function limit**: 10 seconds (with buffer)

### 5. Centralized Fallback Handler
```typescript
async function handleBulkFallback(request: NextRequest) {
  return NextResponse.json({
    success: true,
    data: {
      recommendations: {},
      totalTypes: 0,
      totalProducts: 0,
      errors: ['Service temporarily unavailable - using fallback'],
      fallback: true
    }
  });
}
```

## Performance Improvements

### Sequential vs Concurrent Execution
- **Before**: 4 operations × 2s each = 8+ seconds (worst case)
- **After**: 4 operations running concurrently = 2-3 seconds (typical)

### Timeout Hierarchy
1. Individual operations timeout after 2s
2. All operations timeout after 6s  
3. Overall function timeout after 8s
4. Vercel kills function after 10s

## Files Modified
- `src/app/api/recommendations/bulk/route.ts` - Complete rewrite with timeout handling

## Testing
The bulk recommendations API should now:
1. ✅ Complete within 8 seconds or return fallback
2. ✅ Execute operations concurrently for better performance
3. ✅ Handle individual operation timeouts gracefully
4. ✅ Return partial results if some operations fail
5. ✅ Provide clear error messages and fallback indication

## Test URL
`POST https://vertex-ai-search-nextjs.vercel.app/api/recommendations/bulk`

### Sample Request Body:
```json
{
  "productSku": "BPC-0001",
  "categoryFilter": ["Canned Goods"],
  "limit": 5,
  "includeTypes": ["similar", "trending", "complementary"]
}
```

This should resolve the 504 Gateway Timeout errors you were experiencing!

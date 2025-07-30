# Recommendations API Timeout Fix Summary

## Problem
The recommendations API was timing out on Vercel with `FUNCTION_INVOCATION_TIMEOUT` errors because:
- Vercel serverless functions have execution time limits (10-30 seconds)
- The recommendations API was taking too long to process requests
- Multiple timeout layers were conflicting with each other

## Solution Applied

### 1. Reduced Timeouts for Vercel Environment
- **Overall function timeout**: 8 seconds (down from unlimited)
- **Recommendations API timeout**: 4 seconds (down from 8 seconds)
- **Vertex AI prediction timeout**: 3 seconds (down from 6 seconds)

### 2. Added Function-Level Timeout Wrapper
```typescript
export async function GET(request: NextRequest) {
  // Set overall function timeout for Vercel (must complete within 8 seconds)
  const overallTimeout = new Promise<never>((_, reject) => {
    setTimeout(() => reject(new Error('Function timeout - using fallback')), 8000);
  });

  try {
    return await Promise.race([
      processRecommendations(request),
      overallTimeout
    ]);
  } catch (error) {
    return await handleFallback(request);
  }
}
```

### 3. Centralized Fallback Handler
- Created `handleFallback()` function to provide consistent local recommendations
- Returns 200 status with empty array instead of 500 on complete failure
- Provides better error messages and debugging information

### 4. Non-Blocking User Event Recording
- Made user event recording completely fire-and-forget
- Wrapped in `Promise.resolve()` to prevent blocking the response
- Added error handling to prevent crashes

### 5. Improved Error Handling
- Better logging for production debugging
- Graceful degradation when Vertex AI is unavailable
- Consistent response format for both success and fallback cases

## Files Modified
- `src/app/api/recommendations/route.ts` - Main API endpoint
- `src/lib/vertex-ai-commerce.ts` - Vertex AI service timeouts

## Testing
After deployment, the recommendations API should:
1. ✅ Complete within 8 seconds or fallback to local recommendations
2. ✅ Return consistent JSON response format
3. ✅ Provide debug information in response metadata
4. ✅ Handle timeout gracefully without 500 errors

## Next Steps
1. Deploy to Vercel and test the recommendations API
2. Monitor function execution times in Vercel dashboard
3. Check if recommendations are working properly
4. If still timing out, we can further reduce timeouts or optimize the fallback logic

## Debug URLs
- Recommendations API: `https://vertex-ai-search-nextjs.vercel.app/api/recommendations?sku=BPC-0001&type=similar-items&limit=5`
- Health check: `https://vertex-ai-search-nextjs.vercel.app/api/health`
- Debug endpoint: `https://vertex-ai-search-nextjs.vercel.app/api/debug`

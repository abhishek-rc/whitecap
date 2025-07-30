import { NextRequest, NextResponse } from 'next/server';
import { vertexAICommerceService } from '@/lib/vertex-ai-commerce';
import { cache } from '@/lib/cache';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q') || '';
    const maxSuggestions = parseInt(searchParams.get('limit') || '8');

    if (!query || query.length < 2) {
      return NextResponse.json({ suggestions: [] });
    }

    // Generate cache key for autocomplete
    const cacheKey = `autocomplete:${query.toLowerCase().trim()}:${maxSuggestions}`;

    // Check cache first
    const cachedResult = cache.get(cacheKey);
    if (cachedResult) {
      return NextResponse.json(cachedResult);
    }

    // **PRIMARY STRATEGY: Vertex AI Autocomplete**
    console.log('🚀 Starting Vertex AI autocomplete for:', query);

    // Set timeout for autocomplete
    const timeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(() => reject(new Error('Autocomplete timeout')), 5000); // 5 second timeout
    });

    // Get autocomplete suggestions from Vertex AI Commerce with timeout
    const autocompletePromise = vertexAICommerceService.completeQuery(query, maxSuggestions);
    
    const { completionResults, attributionToken } = await Promise.race([
      autocompletePromise,
      timeoutPromise
    ]);
 
    // Map the completionResults array to a suggestions array
    const suggestions = (completionResults || []).map((result: any) => ({
      text: result.suggestion,
      type: 'query',
    }));

    const response = {
      suggestions,
      attributionToken,
      query,
      source: 'vertex-ai'
    };

    // Cache for 10 minutes
    cache.set(cacheKey, response, 10 * 60 * 1000);

    return NextResponse.json(response);

  } catch (error) {
    console.error('Autocomplete API error:', error);
    
    // Return empty suggestions on error to avoid blocking the UI
    const { searchParams } = new URL(request.url);
    return NextResponse.json({
      suggestions: [],
      query: searchParams.get('q') || '',
      source: 'error',
      fallback: true
    });
  }
}


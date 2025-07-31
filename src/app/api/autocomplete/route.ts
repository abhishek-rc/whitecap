import { NextRequest, NextResponse } from 'next/server';
import { vertexAICommerceService } from '@/lib/vertex-ai-commerce';
import { cache } from '@/lib/cache';
import fs from 'fs';
import path from 'path';

// Cache for loaded CSV suggestions
let csvSuggestions: string[] | null = null;
let csvLoadTime: number = 0;
const CSV_CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

// Load suggestions from CSV file
function loadSuggestionsFromCSV(): string[] {
  const now = Date.now();
  
  // Return cached suggestions if still valid
  if (csvSuggestions && (now - csvLoadTime) < CSV_CACHE_DURATION) {
    return csvSuggestions;
  }

  try {
    const csvPath = path.join(process.cwd(), 'autocomplete', 'autocomplete_suggestions_terms.csv');
    const csvContent = fs.readFileSync(csvPath, 'utf-8');
    
    // Parse CSV content - extract only the first column (before first comma)
    const suggestions = csvContent
      .split('\n')
      .map(line => {
        const trimmedLine = line.trim();
        // Extract only the first column (before first comma)
        const firstColumn = trimmedLine.split(',')[0].trim();
        return firstColumn;
      })
      .filter(line => line && !line.startsWith('#')) // Remove empty lines and comments
      .slice(0, 1000); // Limit to first 1000 suggestions for performance
    
    csvSuggestions = suggestions;
    csvLoadTime = now;
    
    console.log(`📁 Loaded ${suggestions.length} suggestions from CSV file`);
    return suggestions;
  } catch (error) {
    console.error('Error loading CSV suggestions:', error);
    
    // Fallback to basic suggestions if CSV fails to load
    const fallbackSuggestions = [
     ''
    ];
    
    csvSuggestions = fallbackSuggestions;
    csvLoadTime = now;
    
    return fallbackSuggestions;
  }
}

/**
 * Get local fallback suggestions based on query
 */
function getLocalSuggestions(query: string, maxSuggestions: number) {
  const lowerQuery = query.toLowerCase().trim();
  
  console.log('🔍 Local suggestions debug:', {
    originalQuery: query,
    lowerQuery,
    queryLength: lowerQuery.length,
    maxSuggestions
  });
  
  if (lowerQuery.length < 2) {
    console.log('❌ Query too short, returning empty array');
    return [];
  }
  
  // Load suggestions from CSV file
  const allSuggestions = loadSuggestionsFromCSV();
  
  // Find suggestions that start with or contain the query
  const startsWith = allSuggestions.filter((suggestion: string) => 
    suggestion.toLowerCase().startsWith(lowerQuery)
  );
  
  const contains = allSuggestions.filter((suggestion: string) => 
    suggestion.toLowerCase().includes(lowerQuery) && 
    !suggestion.toLowerCase().startsWith(lowerQuery)
  );
  
  console.log('🔍 Local suggestions matching:', {
    startsWith: startsWith.length,
    contains: contains.length,
    startsWithItems: startsWith,
    containsItems: contains
  });
  
  // Combine and limit results
  const combined = [...startsWith, ...contains]
    .slice(0, maxSuggestions)
    .map(text => ({
      text,
      type: 'query' as const
    }));
  
  console.log('✅ Local suggestions result:', combined);
  return combined;
}

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
    const vertexSuggestions = (completionResults || []).map((result: any) => ({
      text: result.suggestion,
      type: 'query',
    }));

    // If Vertex AI returns empty suggestions, use local fallback
    if (vertexSuggestions.length === 0) {
      console.log('🔄 Vertex AI returned empty suggestions, using local fallback for:', query);
      const localSuggestions = getLocalSuggestions(query, maxSuggestions);
      
      const fallbackResponse = {
        suggestions: localSuggestions,
        attributionToken,
        query,
        source: 'local'
      };

      // Cache local fallback for 5 minutes (shorter than Vertex AI)
      cache.set(cacheKey, fallbackResponse, 5 * 60 * 1000);
      return NextResponse.json(fallbackResponse);
    }

    const response = {
      suggestions: vertexSuggestions,
      attributionToken,
      query,
      source: 'vertex-ai'
    };

    // Cache for 10 minutes
    cache.set(cacheKey, response, 10 * 60 * 1000);

    return NextResponse.json(response);

  } catch (error) {
    console.error('Autocomplete API error:', error);
    
    // Use local fallback suggestions when Vertex AI fails
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q') || '';
    const maxSuggestions = parseInt(searchParams.get('limit') || '8');
    
    console.log('🔄 Vertex AI failed, using local fallback for:', query);
    const localSuggestions = getLocalSuggestions(query, maxSuggestions);
    
    return NextResponse.json({
      suggestions: localSuggestions,
      query,
      source: 'local-fallback',
      fallback: true
    });
  }
}


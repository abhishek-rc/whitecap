import { GoogleAuth } from 'google-auth-library';

// Vertex AI Search configuration
const PROJECT_ID = process.env.GOOGLE_CLOUD_PROJECT_ID || 'whitecap-us';
const LOCATION = process.env.VERTEX_AI_LOCATION || 'global';
const DATA_STORE_ID = process.env.VERTEX_AI_DATA_STORE_ID || 'whitecap-products';
const SEARCH_ENGINE_ID = process.env.VERTEX_AI_SEARCH_ENGINE_ID || 'whitecap-us-engine';

// Vertex AI Search API endpoints
const DISCOVERY_ENGINE_API = 'https://discoveryengine.googleapis.com';
const API_VERSION = 'v1';

interface VertexAISearchConfig {
  projectId: string;
  location: string;
  dataStoreId: string;
  searchEngineId: string;
}

interface SearchRequest {
  query: string;
  pageSize?: number;
  offset?: number;
  filter?: string;
  orderBy?: string;
  facetSpecs?: FacetSpec[];
  boostSpecs?: BoostSpec[];
  queryExpansionSpec?: QueryExpansionSpec;
  spellCorrectionSpec?: SpellCorrectionSpec;
}

interface FacetSpec {
  facetKey: {
    key: string;
  };
  limit?: number;
  excludedValues?: string[];
}

interface BoostSpec {
  conditionBoostSpecs?: ConditionBoostSpec[];
}

interface ConditionBoostSpec {
  condition: string;
  boost: number;
}

interface QueryExpansionSpec {
  condition: 'CONDITION_UNSPECIFIED' | 'DISABLED' | 'AUTO';
  pinUnexpandedResults?: boolean;
}

interface SpellCorrectionSpec {
  mode: 'MODE_UNSPECIFIED' | 'SUGGESTION_ONLY' | 'AUTO';
}

interface SearchResponse {
  results: SearchResult[];
  facets: Facet[];
  totalSize: number;
  attributionToken: string;
  nextPageToken?: string;
  correctedQuery?: string;
  summary?: SearchSummary;
}

interface SearchResult {
  id: string;
  document: {
    id: string;
    structData: any;
    jsonData: string;
  };
  modelScores?: { [key: string]: number };
}

interface Facet {
  key: string;
  values: FacetValue[];
  dynamicFacet: boolean;
}

interface FacetValue {
  value: string;
  count: number;
}

interface SearchSummary {
  summaryText: string;
  summarySkippedReasons: string[];
  safetyAttributes: {
    categories: string[];
    scores: number[];
  };
}

class VertexAISearchService {
  private config: VertexAISearchConfig;
  private auth: GoogleAuth;

  constructor(config?: Partial<VertexAISearchConfig>) {
    this.config = {
      projectId: config?.projectId || PROJECT_ID,
      location: config?.location || LOCATION,
      dataStoreId: config?.dataStoreId || DATA_STORE_ID,
      searchEngineId: config?.searchEngineId || SEARCH_ENGINE_ID,
    };

    // Handle both local development and production environments
    const authConfig: any = {
      scopes: ['https://www.googleapis.com/auth/cloud-platform'],
    };

    if (process.env.GOOGLE_APPLICATION_CREDENTIALS) {
      // In production (Vercel), credentials might be base64 encoded
      if (process.env.GOOGLE_APPLICATION_CREDENTIALS.includes('{')) {
        // Direct JSON string
        authConfig.credentials = JSON.parse(process.env.GOOGLE_APPLICATION_CREDENTIALS);
      } else if (process.env.GOOGLE_APPLICATION_CREDENTIALS.length > 100) {
        // Base64 encoded JSON
        const decoded = Buffer.from(process.env.GOOGLE_APPLICATION_CREDENTIALS, 'base64').toString();
        authConfig.credentials = JSON.parse(decoded);
      } else {
        // File path (local development)
        authConfig.keyFilename = process.env.GOOGLE_APPLICATION_CREDENTIALS;
      }
    }

    this.auth = new GoogleAuth(authConfig);
  }

  private async getAccessToken(): Promise<string> {
    const client = await this.auth.getClient();
    const accessToken = await client.getAccessToken();
    return accessToken.token || '';
  }

  private getSearchEndpoint(): string {
    return `${DISCOVERY_ENGINE_API}/${API_VERSION}/projects/${this.config.projectId}/locations/${this.config.location}/collections/default_collection/engines/${this.config.searchEngineId}/servingConfigs/default_config:search`;
  }

  private getDataStoreEndpoint(): string {
    return `${DISCOVERY_ENGINE_API}/${API_VERSION}/projects/${this.config.projectId}/locations/${this.config.location}/collections/default_collection/dataStores/${this.config.dataStoreId}`;
  }

  async search(request: SearchRequest): Promise<SearchResponse> {
    try {
      const accessToken = await this.getAccessToken();
      const endpoint = this.getSearchEndpoint();

      // Build facet specifications for product attributes
      const facetSpecs: FacetSpec[] = [
        { facetKey: { key: 'category' }, limit: 20 },
        { facetKey: { key: 'brand' }, limit: 20 },
        { facetKey: { key: 'isSFPreferred' }, limit: 2 },
        { facetKey: { key: 'availability' }, limit: 10 },
        { facetKey: { key: 'webCategory' }, limit: 20 },
      ];

      // Build boost specifications to prioritize SF Preferred products
      const boostSpecs: BoostSpec[] = [
        {
          conditionBoostSpecs: [
            {
              condition: 'isSFPreferred: true',
              boost: 1
            },
            {
              condition: 'availability: "Available"',
              boost: 1.5
            }
          ]
        }
      ];

      const searchPayload = {
        query: request.query || '',
        pageSize: Math.min(request.pageSize || 20, 100),
        offset: request.offset || 0,
        filter: request.filter || '',
        orderBy: request.orderBy || '',
        facetSpecs: request.facetSpecs || facetSpecs,
        boostSpecs: request.boostSpecs || boostSpecs,
        queryExpansionSpec: request.queryExpansionSpec || {
          condition: 'AUTO',
          pinUnexpandedResults: false
        },
        spellCorrectionSpec: request.spellCorrectionSpec || {
          mode: 'AUTO'
        },
        contentSearchSpec: {
          snippetSpec: {
            maxSnippetCount: 3,
            referenceOnly: false
          },
          summarySpec: {
            summaryResultCount: 5,
            includeCitations: true
          }
        }
      };

      // Create AbortController for timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 20000); // 20 second timeout

      try {
        const response = await fetch(endpoint, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(searchPayload),
          signal: controller.signal,
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
          throw new Error(`Vertex AI Search API error: ${response.status} ${response.statusText}`);
        }

        const data = await response.json();
        return this.transformSearchResponse(data);
      } catch (error) {
        clearTimeout(timeoutId);
        throw error;
      }
    } catch (error) {
      console.error('Vertex AI Search error:', error);
      throw error;
    }
  }

  private transformSearchResponse(apiResponse: any): SearchResponse {
    return {
      results: (apiResponse.results || []).map((result: any) => ({
        id: result.id,
        document: {
          id: result.document.id,
          structData: result.document.structData,
          jsonData: result.document.jsonData || JSON.stringify(result.document.structData)
        },
        modelScores: result.modelScores || {}
      })),
      facets: (apiResponse.facets || []).map((facet: any) => ({
        key: facet.key,
        values: (facet.values || []).map((value: any) => ({
          value: value.value,
          count: value.count
        })),
        dynamicFacet: facet.dynamicFacet || false
      })),
      totalSize: apiResponse.totalSize || 0,
      attributionToken: apiResponse.attributionToken || '',
      nextPageToken: apiResponse.nextPageToken,
      correctedQuery: apiResponse.correctedQuery,
      summary: apiResponse.summary ? {
        summaryText: apiResponse.summary.summaryText || '',
        summarySkippedReasons: apiResponse.summary.summarySkippedReasons || [],
        safetyAttributes: apiResponse.summary.safetyAttributes || { categories: [], scores: [] }
      } : undefined
    };
  }

  async autocomplete(query: string, maxSuggestions: number = 8): Promise<string[]> {
    try {
      const accessToken = await this.getAccessToken();
      const endpoint = `${DISCOVERY_ENGINE_API}/${API_VERSION}/projects/${this.config.projectId}/locations/${this.config.location}/collections/default_collection/engines/${this.config.searchEngineId}/servingConfigs/default_config:complete`;

      // Create AbortController for timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout

      try {
        const response = await fetch(endpoint, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            query,
            queryModel: 'projects/' + this.config.projectId + '/locations/' + this.config.location + '/collections/default_collection/engines/' + this.config.searchEngineId + '/queryModels/default_query_model',
            userPseudoId: 'anonymous-user',
            includeTailSuggestions: true
          }),
          signal: controller.signal,
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
          throw new Error(`Vertex AI Autocomplete API error: ${response.status} ${response.statusText}`);
        }

        const data = await response.json();
        const suggestions = (data.querySuggestions || [])
          .map((suggestion: any) => suggestion.suggestion)
          .slice(0, maxSuggestions);

        return suggestions;
      } catch (error) {
        clearTimeout(timeoutId);
        throw error;
      }
    } catch (error) {
      console.error('Vertex AI Autocomplete error:', error);
      // Fallback to empty array if autocomplete fails
      return [];
    }
  }

  async indexDocument(document: any): Promise<void> {
    try {
      const accessToken = await this.getAccessToken();
      const endpoint = `${this.getDataStoreEndpoint()}/branches/default_branch/documents`;

      const documentPayload = {
        id: document.sku,
        structData: document,
        jsonData: JSON.stringify(document)
      };

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(documentPayload),
      });

      if (!response.ok) {
        throw new Error(`Vertex AI Index API error: ${response.status} ${response.statusText}`);
      }
    } catch (error) {
      console.error('Vertex AI Index error:', error);
      throw error;
    }
  }

  async batchIndexDocuments(documents: any[]): Promise<void> {
    try {
      const accessToken = await this.getAccessToken();
      const endpoint = `${this.getDataStoreEndpoint()}/branches/default_branch/documents:import`;

      // Prepare documents for batch import
      const importDocuments = documents.map(doc => ({
        id: doc.sku,
        structData: doc,
        jsonData: JSON.stringify(doc)
      }));

      const importPayload = {
        inlineSource: {
          documents: importDocuments
        },
        reconciliationMode: 'INCREMENTAL',
        autoGenerateIds: false,
        idField: 'sku'
      };

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(importPayload),
      });

      if (!response.ok) {
        throw new Error(`Vertex AI Batch Index API error: ${response.status} ${response.statusText}`);
      }

      const operation = await response.json();
      console.log('Batch indexing operation started:', operation.name);
    } catch (error) {
      console.error('Vertex AI Batch Index error:', error);
      throw error;
    }
  }

  async deleteDocument(documentId: string): Promise<void> {
    try {
      const accessToken = await this.getAccessToken();
      const endpoint = `${this.getDataStoreEndpoint()}/branches/default_branch/documents/${documentId}`;

      const response = await fetch(endpoint, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
        },
      });

      if (!response.ok) {
        throw new Error(`Vertex AI Delete API error: ${response.status} ${response.statusText}`);
      }
    } catch (error) {
      console.error('Vertex AI Delete error:', error);
      throw error;
    }
  }

  // Helper method to build filters for search
  buildFilter(filters: { [key: string]: any }): string {
    const filterParts: string[] = [];

    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        if (typeof value === 'boolean') {
          filterParts.push(`${key}: ${value}`);
        } else if (typeof value === 'string') {
          filterParts.push(`${key}: "${value}"`);
        } else if (Array.isArray(value)) {
          const valueStr = value.map(v => `"${v}"`).join(' OR ');
          filterParts.push(`${key}: (${valueStr})`);
        }
      }
    });

    return filterParts.join(' AND ');
  }
}

export const vertexAISearchService = new VertexAISearchService();
export { VertexAISearchService, type SearchRequest, type SearchResponse, type SearchResult };


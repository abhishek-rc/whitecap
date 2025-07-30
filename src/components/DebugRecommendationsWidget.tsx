'use client';

import { useState, useEffect } from 'react';

export default function DebugRecommendationsWidget() {
  const [state, setState] = useState({
    loading: false,
    error: null as string | null,
    data: null as Record<string, unknown> | null,
    fetchAttempts: 0
  });
  
  console.log('🔍 DebugRecommendationsWidget render, state:', state);
  
  const makeFetch = async () => {
    console.log('🚀 DebugRecommendationsWidget - Starting fetch attempt', state.fetchAttempts + 1);
    
    setState(prev => ({ 
      ...prev, 
      loading: true, 
      error: null,
      fetchAttempts: prev.fetchAttempts + 1 
    }));
    
    try {
      const url = '/api/recommendations/bulk?sku=MACH030&models=similar-items,on-sale,trending&limit=8&visitorId=widget-user';
      console.log('🌐 DebugRecommendationsWidget - Fetching URL:', url);
      
      const response = await fetch(url);
      console.log('📡 DebugRecommendationsWidget - Response status:', response.status);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      console.log('📦 DebugRecommendationsWidget - Received data:', data);
      
      setState(prev => ({ 
        ...prev, 
        loading: false, 
        data,
        error: null 
      }));
      
    } catch (error) {
      console.error('❌ DebugRecommendationsWidget - Error:', error);
      setState(prev => ({ 
        ...prev, 
        loading: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      }));
    }
  };
  
  useEffect(() => {
    console.log('🔥 DebugRecommendationsWidget - useEffect triggered');
    setTimeout(() => makeFetch(), 100); // Small delay to ensure component is fully mounted
  }, []);
  
  return (
    <div className="p-4 border-2 border-blue-500 rounded">
      <h3 className="font-bold text-blue-600 mb-4">Debug Recommendations Widget</h3>
      
      <div className="space-y-2 text-sm">
        <p><strong>Fetch attempts:</strong> {state.fetchAttempts}</p>
        <p><strong>Loading:</strong> {state.loading ? 'Yes' : 'No'}</p>
        <p><strong>Error:</strong> {state.error || 'None'}</p>
        <p><strong>Has data:</strong> {state.data ? 'Yes' : 'No'}</p>
        
        {state.data && (
          <div className="mt-4 p-2 bg-gray-100 rounded">
            <p><strong>API Success:</strong> {(state.data as any).success ? 'Yes' : 'No'}</p>
            <p><strong>Total Products:</strong> {(state.data as any).data?.totalProducts || 0}</p>
            <p><strong>Recommendation Keys:</strong> {Object.keys((state.data as any).data?.recommendations || {}).join(', ')}</p>
          </div>
        )}
        
        <button 
          onClick={makeFetch}
          className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          disabled={state.loading}
        >
          {state.loading ? 'Fetching...' : 'Retry Fetch'}
        </button>
      </div>
    </div>
  );
}

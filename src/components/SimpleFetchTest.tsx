'use client';

import { useState, useEffect } from 'react';

export default function SimpleFetchTest() {
  const [status, setStatus] = useState('Not started');
  const [data, setData] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const testFetch = async () => {
    setStatus('Starting fetch...');
    setError(null);
    
    try {
      setStatus('About to call fetch()');
      const response = await fetch('/api/test-fetch');
      
      setStatus(`Response received: ${response.status}`);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      
      setStatus('Parsing JSON...');
      const result = await response.json();
      
      setStatus('Success!');
      setData(result);
      
    } catch (err) {
      setStatus('Error occurred');
      setError(err instanceof Error ? err.message : 'Unknown error');
    }
  };

  useEffect(() => {
    testFetch();
  }, []);

  return (
    <div className="p-4 border border-gray-300 rounded">
      <h3 className="font-bold mb-2">Simple Fetch Test</h3>
      <div className="space-y-2 text-sm">
        <p><strong>Status:</strong> {status}</p>
        {error && <p className="text-red-600"><strong>Error:</strong> {error}</p>}
        {data && (
          <div>
            <p><strong>Success:</strong> {data.success ? 'Yes' : 'No'}</p>
            <p><strong>Message:</strong> {data.message}</p>
            <p><strong>Products:</strong> {data.testData?.products?.length || 0}</p>
          </div>
        )}
        <button 
          onClick={testFetch}
          className="px-3 py-1 bg-blue-500 text-white rounded text-xs"
        >
          Test Again
        </button>
      </div>
    </div>
  );
}

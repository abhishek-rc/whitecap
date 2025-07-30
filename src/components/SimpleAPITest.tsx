'use client';

import { useState, useEffect } from 'react';

export default function SimpleAPITest() {
  const [data, setData] = useState<{
    apiResponse?: { success?: boolean; data?: { totalProducts?: number } };
    totalSectionsVisible?: number;
    widgetWouldShow?: Array<{ title: string; count: number }>;
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    console.log('🧪 SimpleAPITest - Starting fetch');
    
    const fetchData = async () => {
      try {
        const response = await fetch('/api/debug-widget?sku=MACH030');
        console.log('🧪 SimpleAPITest - Response:', response.status);
        
        const result = await response.json();
        console.log('🧪 SimpleAPITest - Data:', result);
        
        setData(result);
      } catch (err) {
        console.error('🧪 SimpleAPITest - Error:', err);
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) return <div>Loading simple API test...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <div className="p-4 border border-gray-300 rounded">
      <h3 className="font-bold mb-2">Simple API Test Results</h3>
      <div className="text-sm">
        <p><strong>Success:</strong> {data?.apiResponse?.success ? 'Yes' : 'No'}</p>
        <p><strong>Total Products:</strong> {data?.apiResponse?.data?.totalProducts || 0}</p>
        <p><strong>Sections:</strong> {data?.totalSectionsVisible || 0}</p>
        {data?.widgetWouldShow?.map((section: { title: string; count: number }, i: number) => (
          <div key={i} className="ml-4 mt-1">
            <span>{section.title}: {section.count} products</span>
          </div>
        ))}
      </div>
    </div>
  );
}

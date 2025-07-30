'use client';

import RecommendationsWidget from '@/components/RecommendationsWidget';
import SimpleAPITest from '@/components/SimpleAPITest';
import BasicTest from '@/components/BasicTest';
import DebugRecommendationsWidget from '@/components/DebugRecommendationsWidget';
import TestRecommendationsWidget from '@/components/TestRecommendationsWidget';
import HardcodedRecommendationsWidget from '@/components/HardcodedRecommendationsWidget';
import SimpleFetchTest from '@/components/SimpleFetchTest';

export default function TestWidgetPage() {
  console.log('🧪 TestWidget page rendered');
  
  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <h1 className="text-3xl font-bold mb-8">Widget Test Page</h1>
      
      <div className="space-y-8">
        <div className="bg-red-50 p-4 rounded-lg shadow border-l-4 border-red-500">
          <h2 className="text-xl mb-4 text-red-700">🚨 BASIC FETCH TEST</h2>
          <SimpleFetchTest />
        </div>
        
        <div className="bg-white p-4 rounded-lg shadow">
          <h2 className="text-xl mb-4">Hardcoded Widget Test (should definitely work)</h2>
          <HardcodedRecommendationsWidget />
        </div>
        
        <div className="bg-white p-4 rounded-lg shadow">
          <h2 className="text-xl mb-4">Basic JavaScript Test</h2>
          <BasicTest />
        </div>
        
        <div className="bg-white p-4 rounded-lg shadow">
          <h2 className="text-xl mb-4">Debug Recommendations Widget</h2>
          <DebugRecommendationsWidget />
        </div>
        
        <div className="bg-white p-4 rounded-lg shadow">
          <h2 className="text-xl mb-4">Full RecommendationsWidget Test</h2>
          <RecommendationsWidget
            productSku="MACH030"
            categories={["MACHI", "FROZ"]}
            userPreferences={{ sfPreferred: true }}
            limit={8}
          />
        </div>
      </div>
    </div>
  );
}

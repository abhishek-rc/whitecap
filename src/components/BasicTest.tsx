'use client';

import { useEffect, useState } from 'react';

export default function BasicTest() {
  const [count, setCount] = useState(0);
  
  useEffect(() => {
    console.log('🟢 BasicTest mounted, useEffect running');
    setCount(1);
    
    const timer = setInterval(() => {
      console.log('🟢 BasicTest timer tick');
      setCount(prev => prev + 1);
    }, 2000);
    
    return () => clearInterval(timer);
  }, []);
  
  console.log('🟢 BasicTest render, count:', count);
  
  return (
    <div className="p-4 border-2 border-green-500 rounded">
      <h3 className="font-bold text-green-600">Basic Test Component</h3>
      <p>Count: {count}</p>
      <p>If you see this updating every 2 seconds, JavaScript is working.</p>
    </div>
  );
}

import { NextRequest, NextResponse } from 'next/server';

export async function GET() {
  console.log('🔥 Test fetch endpoint called');
  
  return NextResponse.json({
    success: true,
    message: 'Simple test endpoint working',
    timestamp: new Date().toISOString(),
    testData: {
      products: [
        { id: 'TEST1', name: 'Test Product 1' },
        { id: 'TEST2', name: 'Test Product 2' }
      ]
    }
  });
}

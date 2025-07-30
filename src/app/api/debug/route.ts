import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const creds = process.env.GOOGLE_APPLICATION_CREDENTIALS;
    const credentialsType = creds?.includes('{') ? 'json' : 
                           (creds?.length || 0) > 100 ? 'base64' : 'file';
    
    return NextResponse.json({
      success: true,
      environment: {
        NODE_ENV: process.env.NODE_ENV,
        isVercel: !!process.env.VERCEL,
        hasCredentials: !!creds,
        credentialsLength: creds?.length || 0,
        credentialsType,
        projectId: process.env.GOOGLE_CLOUD_PROJECT_ID,
        location: process.env.VERTEX_AI_LOCATION,
        catalogId: process.env.VERTEX_AI_CATALOG_ID,
        branchId: process.env.VERTEX_AI_BRANCH_ID,
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('Debug API error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    }, { status: 500 });
  }
}

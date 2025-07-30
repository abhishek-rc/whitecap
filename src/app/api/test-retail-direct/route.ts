import { NextRequest, NextResponse } from 'next/server';
import { GoogleAuth } from 'google-auth-library';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const sku = searchParams.get('sku') || 'SPICE11';

    const auth = new GoogleAuth({
      scopes: ['https://www.googleapis.com/auth/cloud-platform'],
      keyFilename: process.env.GOOGLE_APPLICATION_CREDENTIALS || './vertex-ai-key.json'
    });

    const client = await auth.getClient();
    const accessToken = await client.getAccessToken();
    
    const projectId = '1053628646950';
    const endpoint = `https://retail.googleapis.com/v2alpha/projects/${projectId}/locations/global/catalogs/default_catalog/placements/similar-items:predict`;
    
    const payload = {
      userEvent: {
        eventType: "shopping-cart-page-view",
        visitorId: "test-visitor-123",
        productDetails: [
          {
            product: {
              id: sku
            }
          }
        ]
      },
      useMostRecentServingConfig: true,
      params: {
        returnProduct: true
      }
    };

    console.log('🧪 Testing exact API call:', {
      endpoint,
      payload: JSON.stringify(payload, null, 2)
    });

    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken.token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    const responseText = await response.text();
    
    console.log('📋 Full API Response:', {
      status: response.status,
      statusText: response.statusText,
      headers: Object.fromEntries(response.headers.entries()),
      body: responseText
    });

    let data;
    try {
      data = JSON.parse(responseText);
    } catch {
      data = { rawResponse: responseText };
    }

    return NextResponse.json({
      success: response.ok,
      status: response.status,
      statusText: response.statusText,
      endpoint,
      payload,
      response: data,
      rawResponse: responseText
    });

  } catch (error) {
    console.error('❌ Test API error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

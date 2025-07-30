import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const productSku = searchParams.get('sku') || 'FIS10049';
    
    // Make the same call the widget makes
    const baseUrl = new URL(request.url).origin;
    const widgetUrl = `${baseUrl}/api/recommendations/bulk?sku=${productSku}&models=similar-items,on-sale,trending&limit=8&visitorId=widget-user`;
    
    console.log('🔍 Widget Debug - Making call to:', widgetUrl);
    
    const response = await fetch(widgetUrl);
    const data = await response.json();
    
    console.log('📊 Widget Debug - Response received:', {
      success: data.success,
      totalTypes: data.data?.totalTypes,
      totalProducts: data.data?.totalProducts,
      recommendationKeys: Object.keys(data.data?.recommendations || {})
    });
    
    // Check what the widget would see
    const recommendations = data.data?.recommendations || {};
    const sections = [];
    
    // Similar items check
    if (recommendations['similar-items'] && recommendations['similar-items'].products) {
      sections.push({
        type: 'similar-items',
        count: recommendations['similar-items'].products.length,
        title: '🔗 Similar Items',
        reason: recommendations['similar-items'].reason
      });
    }
    
    // On-sale check
    if (recommendations['on-sale'] && recommendations['on-sale'].products) {
      sections.push({
        type: 'on-sale', 
        count: recommendations['on-sale'].products.length,
        title: '🏷️ On Sale',
        reason: recommendations['on-sale'].reason
      });
    }
    
    // Trending check
    if (recommendations.trending && recommendations.trending.products) {
      sections.push({
        type: 'trending',
        count: recommendations.trending.products.length,
        title: '🔥 Trending Products',
        reason: recommendations.trending.reason
      });
    }
    
    return NextResponse.json({
      widgetUrl,
      apiResponse: data,
      widgetWouldShow: sections,
      totalSectionsVisible: sections.length,
      summary: sections.length > 0 
        ? `Widget would show ${sections.length} section(s) with products`
        : 'Widget would show "No recommendations available"'
    });
    
  } catch (error) {
    console.error('❌ Widget debug error:', error);
    return NextResponse.json({
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

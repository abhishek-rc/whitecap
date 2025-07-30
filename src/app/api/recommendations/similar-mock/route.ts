import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const sku = searchParams.get('sku');
    const limit = parseInt(searchParams.get('limit') || '10');

    if (!sku) {
      return NextResponse.json(
        { error: 'SKU parameter is required' },
        { status: 400 }
      );
    }

    // Return mock data immediately
    const mockProducts = Array.from({ length: Math.min(limit, 3) }, (_, i) => ({
      id: `mock-${sku}-${i + 1}`,
      sku: `mock-${sku}-${i + 1}`,
      displayName: `Mock Product ${i + 1} for ${sku}`,
      description: `Mock description for product ${i + 1}`,
      category: 'Mock Category',
      brand: 'Mock Brand',
      vendor: 'Mock Vendor',
      vendorName: 'Mock Vendor Name',
      units: 'each',
      isSFPreferred: false,
      imageURL: '',
      availability: 'IN_STOCK',
      categoryDesc: 'Mock Category Description',
      urlSlug: `mock-${sku}-${i + 1}`,
      price: 99.99,
      accset: 'MOCK_DATA',
      keywords: [],
      orderLastMonth: 0,
      isActive: true,
      isDeleted: false,
      webCategory: 'Mock Web Category',
      score: 0.9,
      reason: 'Mock similar products for testing'
    }));

    return NextResponse.json({
      products: mockProducts,
      score: 0.9,
      reason: 'Mock similar products for testing',
      count: mockProducts.length,
      type: 'similar'
    });

  } catch (error) {
    console.error('Mock similar products API error:', error);
    return NextResponse.json(
      { error: 'Failed to get mock similar products' },
      { status: 500 }
    );
  }
}

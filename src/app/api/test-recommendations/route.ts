import { NextResponse } from 'next/server';

export async function GET() {
  try {
    // Return a simple test product in the correct format
    const testProduct = {
      id: "TEST001",
      sku: "TEST001", 
      displayName: "Test Product",
      description: "This is a test product",
      category: "Test Category",
      brand: "Test Brand",
      vendor: "Test Vendor",
      vendorName: "Test Vendor Name",
      units: "1 pc",
      isSFPreferred: false,
      imageURL: "",
      availability: "IN_STOCK",
      categoryDesc: "Test Category",
      urlSlug: "test001",
      price: 10.99,
      accset: "TEST",
      keywords: ["test", "product"],
      orderLastMonth: 5,
      isActive: true,
      isDeleted: false,
      webCategory: "Test Category",
      webSubCategory: "Test Sub Category", 
      webCategoryDesc: "Test Category Description",
      webDesc: "Test web description",
      webSubDesc: "Test web sub description",
      score: 0.95,
      reason: "Test product for debugging"
    };

    const response = {
      success: true,
      data: {
        productSku: "TEST001",
        categoryFilter: null,
        recommendations: {
          "test-section": {
            products: [testProduct],
            score: 0.95,
            reason: "Test products for debugging widget",
            count: 1
          }
        },
        totalTypes: 1,
        totalProducts: 1,
        executionTime: 10,
        note: "Test data for debugging"
      }
    };

    return NextResponse.json(response);

  } catch (error) {
    console.error('❌ Test recommendations error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

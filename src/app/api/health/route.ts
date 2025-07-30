import { NextRequest, NextResponse } from 'next/server';
import { dataService } from '@/lib/data';
import { performanceMonitor } from '@/lib/performance';
import { cache } from '@/lib/cache';

export async function GET(request: NextRequest) {
  try {
    const startTime = Date.now();
    
    // Check if data service is initialized
    await dataService.initialize();
    
    // Get basic stats
    const searchResult = await dataService.search('', {}, 0, 1);
    const totalProducts = searchResult.total;
    
    // Check cache health
    const cacheSize = cache.size();
    
    // Get performance stats
    const perfStats = performanceMonitor.getAllStats();
    
    const endTime = Date.now();
    const responseTime = endTime - startTime;
    
    return NextResponse.json({
      success: true,
      status: 'healthy',
      timestamp: new Date().toISOString(),
      data: {
        totalProducts,
        responseTime: `${responseTime}ms`,
        cache: {
          size: cacheSize,
          enabled: true
        },
        performance: perfStats,
        services: {
          dataService: 'operational',
          search: 'operational',
          recommendations: 'operational'
        },
        version: '1.0.0',
        environment: 'development'
      }
    });
  } catch (error) {
    console.error('Health check error:', error);
    return NextResponse.json(
      {
        success: false,
        status: 'unhealthy',
        timestamp: new Date().toISOString(),
        error: 'Service unavailable'
      },
      { status: 503 }
    );
  }
}


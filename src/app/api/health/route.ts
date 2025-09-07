import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db/connection';
import { getRedisConnection } from '@/lib/queue/redis';

export async function GET(request: NextRequest) {
  try {
    const startTime = Date.now();
    const health = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      version: process.env.npm_package_version || '1.0.0',
      environment: process.env.NODE_ENV || 'development',
      services: {
        database: 'unknown',
        redis: 'unknown',
        memory: 'unknown'
      },
      responseTime: 0
    };

    // Check database connection
    try {
      await connectDB();
      health.services.database = 'connected';
    } catch (error) {
      health.services.database = 'disconnected';
      health.status = 'unhealthy';
    }

    // Check Redis connection
    try {
      const redis = getRedisConnection();
      await redis.ping();
      health.services.redis = 'connected';
    } catch (error) {
      health.services.redis = 'disconnected';
      health.status = 'unhealthy';
    }

    // Check memory usage
    try {
      const memUsage = process.memoryUsage();
      const memUsageMB = {
        rss: Math.round(memUsage.rss / 1024 / 1024),
        heapTotal: Math.round(memUsage.heapTotal / 1024 / 1024),
        heapUsed: Math.round(memUsage.heapUsed / 1024 / 1024),
        external: Math.round(memUsage.external / 1024 / 1024)
      };
      
      health.services.memory = {
        ...memUsageMB,
        status: memUsageMB.heapUsed > 500 ? 'warning' : 'ok' // Warning if heap > 500MB
      };
    } catch (error) {
      health.services.memory = 'error';
    }

    health.responseTime = Date.now() - startTime;

    const statusCode = health.status === 'healthy' ? 200 : 503;
    
    return NextResponse.json(health, { status: statusCode });
  } catch (error) {
    console.error('Health check failed:', error);
    
    return NextResponse.json(
      {
        status: 'unhealthy',
        timestamp: new Date().toISOString(),
        error: 'Health check failed',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 503 }
    );
  }
}

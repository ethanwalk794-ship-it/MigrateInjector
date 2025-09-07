'use client';

import Redis from 'ioredis';

const REDIS_URL = process.env.REDIS_URL || 'redis://localhost:6379';
const REDIS_HOST = process.env.REDIS_HOST || 'localhost';
const REDIS_PORT = parseInt(process.env.REDIS_PORT || '6379');
const REDIS_PASSWORD = process.env.REDIS_PASSWORD || '';

let redis: Redis | null = null;

export function getRedisConnection(): Redis {
  if (!redis) {
    const config: any = {
      host: REDIS_HOST,
      port: REDIS_PORT,
      retryDelayOnFailover: 100,
      maxRetriesPerRequest: 3,
      lazyConnect: true,
      keepAlive: 30000,
      connectTimeout: 10000,
      commandTimeout: 5000,
    };

    if (REDIS_PASSWORD) {
      config.password = REDIS_PASSWORD;
    }

    if (REDIS_URL && REDIS_URL !== `redis://${REDIS_HOST}:${REDIS_PORT}`) {
      redis = new Redis(REDIS_URL, config);
    } else {
      redis = new Redis(config);
    }

    redis.on('connect', () => {
      console.log('✅ Connected to Redis');
    });

    redis.on('error', (error) => {
      console.error('❌ Redis connection error:', error);
    });

    redis.on('close', () => {
      console.log('🔌 Redis connection closed');
    });

    redis.on('reconnecting', () => {
      console.log('🔄 Reconnecting to Redis...');
    });
  }

  return redis;
}

export async function closeRedisConnection(): Promise<void> {
  if (redis) {
    await redis.quit();
    redis = null;
  }
}

export async function testRedisConnection(): Promise<boolean> {
  try {
    const connection = getRedisConnection();
    await connection.ping();
    return true;
  } catch (error) {
    console.error('Redis connection test failed:', error);
    return false;
  }
}

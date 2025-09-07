#!/usr/bin/env tsx

import { Worker, Job } from 'bullmq';
import { getRedisConnection } from '../src/lib/queue/redis';
import { processResumeJob } from '../src/lib/queue/processors/resume-processor';

// Create worker
const worker = new Worker(
  'resume-processing',
  processResumeJob,
  {
    connection: getRedisConnection(),
    concurrency: parseInt(process.env.QUEUE_CONCURRENCY || '5'),
  }
);

// Worker event handlers
worker.on('ready', () => {
  console.log('🚀 Resume processing worker is ready');
});

worker.on('completed', (job: Job) => {
  console.log(`✅ Resume processing job ${job.id} completed`);
});

worker.on('failed', (job: Job | undefined, err: Error) => {
  console.error(`❌ Resume processing job ${job?.id} failed:`, err.message);
});

worker.on('progress', (job: Job, progress: number) => {
  console.log(`📊 Resume processing job ${job.id} progress: ${progress}%`);
});

worker.on('error', (err: Error) => {
  console.error('❌ Resume processing worker error:', err);
});

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('🔄 Shutting down resume processing worker...');
  await worker.close();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('🔄 Shutting down resume processing worker...');
  await worker.close();
  process.exit(0);
});

console.log('📝 Resume processing worker started');

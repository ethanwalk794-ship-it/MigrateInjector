'use client';

import { Queue, Worker, Job } from 'bullmq';
import { getRedisConnection } from './redis';
import { processResumeJob } from './processors/resume-processor';
import { processEmailJob } from './processors/email-processor';
import { processBulkJob } from './processors/bulk-processor';

// Queue configurations
const queueConfig = {
  connection: getRedisConnection(),
  defaultJobOptions: {
    removeOnComplete: 100,
    removeOnFail: 50,
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 2000,
    },
  },
};

// Create queues
export const resumeProcessingQueue = new Queue('resume-processing', queueConfig);
export const emailSendingQueue = new Queue('email-sending', queueConfig);
export const bulkProcessingQueue = new Queue('bulk-processing', queueConfig);

// Create workers
export const resumeProcessingWorker = new Worker(
  'resume-processing',
  processResumeJob,
  {
    connection: getRedisConnection(),
    concurrency: parseInt(process.env.QUEUE_CONCURRENCY || '5'),
  }
);

export const emailSendingWorker = new Worker(
  'email-sending',
  processEmailJob,
  {
    connection: getRedisConnection(),
    concurrency: parseInt(process.env.QUEUE_CONCURRENCY || '3'),
  }
);

export const bulkProcessingWorker = new Worker(
  'bulk-processing',
  processBulkJob,
  {
    connection: getRedisConnection(),
    concurrency: parseInt(process.env.QUEUE_CONCURRENCY || '2'),
  }
);

// Worker event handlers
resumeProcessingWorker.on('completed', (job: Job) => {
  console.log(`✅ Resume processing job ${job.id} completed`);
});

resumeProcessingWorker.on('failed', (job: Job | undefined, err: Error) => {
  console.error(`❌ Resume processing job ${job?.id} failed:`, err.message);
});

resumeProcessingWorker.on('progress', (job: Job, progress: number | object) => {
  const pct = typeof progress === 'number' ? progress : 0;
  console.log(`📊 Resume processing job ${job.id} progress: ${pct}%`);
});

emailSendingWorker.on('completed', (job: Job) => {
  console.log(`✅ Email sending job ${job.id} completed`);
});

emailSendingWorker.on('failed', (job: Job | undefined, err: Error) => {
  console.error(`❌ Email sending job ${job?.id} failed:`, err.message);
});

emailSendingWorker.on('progress', (job: Job, progress: number | object) => {
  const pct = typeof progress === 'number' ? progress : 0;
  console.log(`📊 Email sending job ${job.id} progress: ${pct}%`);
});

bulkProcessingWorker.on('completed', (job: Job) => {
  console.log(`✅ Bulk processing job ${job.id} completed`);
});

bulkProcessingWorker.on('failed', (job: Job | undefined, err: Error) => {
  console.error(`❌ Bulk processing job ${job?.id} failed:`, err.message);
});

bulkProcessingWorker.on('progress', (job: Job, progress: number | object) => {
  const pct = typeof progress === 'number' ? progress : 0;
  console.log(`📊 Bulk processing job ${job.id} progress: ${pct}%`);
});

// Queue management functions
export async function addJobToQueue(
  queueName: string,
  jobData: any,
  options?: any
): Promise<Job> {
  let queue: Queue;

  switch (queueName) {
    case 'resume-processing':
      queue = resumeProcessingQueue;
      break;
    case 'email-sending':
      queue = emailSendingQueue;
      break;
    case 'bulk-processing':
      queue = bulkProcessingQueue;
      break;
    default:
      throw new Error(`Unknown queue: ${queueName}`);
  }

  return queue.add(queueName, jobData, options);
}

export async function getJobStatus(queueName: string, jobId: string): Promise<any> {
  let queue: Queue;

  switch (queueName) {
    case 'resume-processing':
      queue = resumeProcessingQueue;
      break;
    case 'email-sending':
      queue = emailSendingQueue;
      break;
    case 'bulk-processing':
      queue = bulkProcessingQueue;
      break;
    default:
      throw new Error(`Unknown queue: ${queueName}`);
  }

  const job = await queue.getJob(jobId);
  if (!job) {
    return null;
  }

  return {
    id: job.id,
    name: job.name,
    data: job.data,
    progress: job.progress,
    returnvalue: job.returnvalue,
    failedReason: job.failedReason,
    processedOn: job.processedOn,
    finishedOn: job.finishedOn,
    timestamp: job.timestamp,
    attemptsMade: job.attemptsMade,
    delay: job.delay,
    opts: job.opts,
  };
}

export async function cancelJob(queueName: string, jobId: string): Promise<boolean> {
  let queue: Queue;

  switch (queueName) {
    case 'resume-processing':
      queue = resumeProcessingQueue;
      break;
    case 'email-sending':
      queue = emailSendingQueue;
      break;
    case 'bulk-processing':
      queue = bulkProcessingQueue;
      break;
    default:
      throw new Error(`Unknown queue: ${queueName}`);
  }

  const job = await queue.getJob(jobId);
  if (!job) {
    return false;
  }

  await job.remove();
  return true;
}

export async function getQueueStats(queueName: string): Promise<any> {
  let queue: Queue;

  switch (queueName) {
    case 'resume-processing':
      queue = resumeProcessingQueue;
      break;
    case 'email-sending':
      queue = emailSendingQueue;
      break;
    case 'bulk-processing':
      queue = bulkProcessingQueue;
      break;
    default:
      throw new Error(`Unknown queue: ${queueName}`);
  }

  const waiting = await queue.getWaiting();
  const active = await queue.getActive();
  const completed = await queue.getCompleted();
  const failed = await queue.getFailed();

  return {
    waiting: waiting.length,
    active: active.length,
    completed: completed.length,
    failed: failed.length,
    total: waiting.length + active.length + completed.length + failed.length,
  };
}

export async function pauseQueue(queueName: string): Promise<void> {
  let queue: Queue;

  switch (queueName) {
    case 'resume-processing':
      queue = resumeProcessingQueue;
      break;
    case 'email-sending':
      queue = emailSendingQueue;
      break;
    case 'bulk-processing':
      queue = bulkProcessingQueue;
      break;
    default:
      throw new Error(`Unknown queue: ${queueName}`);
  }

  await queue.pause();
}

export async function resumeQueue(queueName: string): Promise<void> {
  let queue: Queue;

  switch (queueName) {
    case 'resume-processing':
      queue = resumeProcessingQueue;
      break;
    case 'email-sending':
      queue = emailSendingQueue;
      break;
    case 'bulk-processing':
      queue = bulkProcessingQueue;
      break;
    default:
      throw new Error(`Unknown queue: ${queueName}`);
  }

  await queue.resume();
}

export async function cleanQueue(queueName: string, grace: number = 0): Promise<void> {
  let queue: Queue;

  switch (queueName) {
    case 'resume-processing':
      queue = resumeProcessingQueue;
      break;
    case 'email-sending':
      queue = emailSendingQueue;
      break;
    case 'bulk-processing':
      queue = bulkProcessingQueue;
      break;
    default:
      throw new Error(`Unknown queue: ${queueName}`);
  }

  await queue.clean(grace, 100);
}

// Graceful shutdown
export async function closeAllQueues(): Promise<void> {
  console.log('🔄 Closing all queues...');

  await Promise.all([
    resumeProcessingQueue.close(),
    emailSendingQueue.close(),
    bulkProcessingQueue.close(),
  ]);

  await Promise.all([
    resumeProcessingWorker.close(),
    emailSendingWorker.close(),
    bulkProcessingWorker.close(),
  ]);

  console.log('✅ All queues closed');
}

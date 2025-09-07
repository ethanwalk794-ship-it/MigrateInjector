'use client';

import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db/connection';
import Resume from '@/lib/db/models/resume';
import Job from '@/lib/db/models/job';
import { getCurrentUser } from '@/lib/middleware/auth';
import { addJobToQueue } from '@/lib/queue/queues';
import { z } from 'zod';

const ProcessResumeSchema = z.object({
  resumeId: z.string().min(1, 'Resume ID is required'),
  techStacks: z.array(z.object({
    name: z.string().min(1, 'Tech stack name is required'),
    points: z.array(z.string().min(1, 'Point cannot be empty'))
  })).min(1, 'At least one tech stack is required'),
  processingOptions: z.object({
    maxWorkers: z.number().min(1).max(8).optional(),
    showProgress: z.boolean().optional(),
    performanceStats: z.boolean().optional()
  }).optional()
});

// Helper function to safely call Mongoose methods
const safeFindOne = async (model: any, query: any, projection: any = null) => {
  if (projection) {
    return model.findOne(query).select(projection).exec();
  }
  return model.findOne(query).exec();
};

const safeFind = async (model: any, query: any, options: any = {}) => {
  let queryBuilder = model.find(query);
  
  if (options.select) {
    queryBuilder = queryBuilder.select(options.select);
  }
  if (options.sort) {
    queryBuilder = queryBuilder.sort(options.sort);
  }
  if (options.limit) {
    queryBuilder = queryBuilder.limit(options.limit);
  }
  
  return queryBuilder.exec();
};

export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const user = await getCurrentUser(request);
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Connect to database
    await connectDB();

    // Parse and validate request body
    const body = await request.json();
    const validationResult = ProcessResumeSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        {
          error: 'Validation failed',
          details: validationResult.error.errors
        },
        { status: 400 }
      );
    }

    const { resumeId, techStacks, processingOptions } = validationResult.data;

    // Find resume using safe helper
    const resume = await safeFindOne(Resume, {
      _id: resumeId,
      userId: user._id
    });

    if (!resume) {
      return NextResponse.json(
        { error: 'Resume not found' },
        { status: 404 }
      );
    }

    // Check if resume is in a processable state
    if (resume.status === 'processing') {
      return NextResponse.json(
        { error: 'Resume is already being processed' },
        { status: 409 }
      );
    }

    if (resume.status === 'failed') {
      return NextResponse.json(
        { error: 'Resume processing previously failed' },
        { status: 409 }
      );
    }

    // Update resume with tech stacks
    resume.customization.techStacks = techStacks;
    resume.status = 'processing';
    resume.processing.version += 1;

    await resume.save();

    // Create processing job
    const job = new Job({
      userId: user._id,
      type: 'resume_processing',
      status: 'pending',
      priority: 'normal',
      data: {
        resumeId,
        techStacks,
        processingOptions: {
          maxWorkers: processingOptions?.maxWorkers || 4,
          showProgress: processingOptions?.showProgress || true,
          performanceStats: processingOptions?.performanceStats || false,
          bulkEmailMode: false
        }
      },
      progress: {
        current: 0,
        total: 100,
        percentage: 0,
        currentStep: 'Queued for processing',
        steps: [
          { name: 'Initialize processing', status: 'pending' },
          { name: 'Extract document content', status: 'pending' },
          { name: 'Distribute tech stack points', status: 'pending' },
          { name: 'Generate customized resume', status: 'pending' },
          { name: 'Create preview', status: 'pending' },
          { name: 'Finalize processing', status: 'pending' }
        ]
      },
      retry: {
        attempts: 0,
        maxAttempts: 3,
        backoffDelay: 1000
      }
    });

    await job.save();

    // Add job to processing queue
    await addJobToQueue('resume-processing', {
      jobId: job._id,
      resumeId,
      userId: user._id,
      techStacks,
      processingOptions: job.data.processingOptions
    });

    return NextResponse.json({
      success: true,
      data: {
        jobId: job._id,
        resumeId: resume._id,
        status: 'processing',
        message: 'Resume processing started'
      }
    });

  } catch (error) {
    console.error('Resume processing error:', error);

    return NextResponse.json(
      {
        error: 'Processing failed',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    // Check authentication
    const user = await getCurrentUser(request);
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Connect to database
    await connectDB();

    // Get query parameters
    const { searchParams } = new URL(request.url);
    const resumeId = searchParams.get('resumeId');
    const jobId = searchParams.get('jobId');

    if (resumeId) {
      // Get processing status for specific resume using safe helper
      const resume = await safeFindOne(Resume, {
        _id: resumeId,
        userId: user._id
      }, 'processing status');

      if (!resume) {
        return NextResponse.json(
          { error: 'Resume not found' },
          { status: 404 }
        );
      }

      return NextResponse.json({
        success: true,
        data: {
          resumeId: resume._id,
          status: resume.status,
          processing: resume.processing
        }
      });
    }

    if (jobId) {
      // Get processing status for specific job using safe helper
      const job = await safeFindOne(Job, {
        _id: jobId,
        userId: user._id
      });

      if (!job) {
        return NextResponse.json(
          { error: 'Job not found' },
          { status: 404 }
        );
      }

      return NextResponse.json({
        success: true,
        data: {
          jobId: job._id,
          type: job.type,
          status: job.status,
          progress: job.progress,
          result: job.result,
          error: job.error,
          createdAt: job.createdAt,
          startedAt: job.startedAt,
          completedAt: job.completedAt
        }
      });
    }

    // Get all processing jobs for user using safe helper
    const jobs = await safeFind(Job, {
      userId: user._id,
      type: 'resume_processing'
    }, {
      select: '-data',
      sort: { createdAt: -1 },
      limit: 20
    });

    return NextResponse.json({
      success: true,
      data: {
        jobs
      }
    });

  } catch (error) {
    console.error('Get processing status error:', error);

    return NextResponse.json(
      {
        error: 'Failed to get processing status',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
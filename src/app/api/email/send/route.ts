import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db/connection';
import Resume from '@/lib/db/models/resume';
import Job from '@/lib/db/models/job';
import { getCurrentUser } from '@/lib/middleware/auth';
import { addJobToQueue } from '@/lib/queue/queues';
import { EmailValidator } from '@/lib/services/email/email-validator';
import { z } from 'zod';

const SendEmailSchema = z.object({
  resumeId: z.string().min(1, 'Resume ID is required'),
  emailConfig: z.object({
    recipient: z.string().email('Invalid recipient email'),
    subject: z.string().min(1, 'Subject is required'),
    body: z.string().min(1, 'Body is required'),
    smtpServer: z.string().min(1, 'SMTP server is required'),
    smtpPort: z.number().min(1).max(65535, 'Invalid SMTP port'),
    senderEmail: z.string().email('Invalid sender email'),
    senderPassword: z.string().min(1, 'Sender password is required'),
    isSecure: z.boolean().optional()
  })
});

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
    const validationResult = SendEmailSchema.safeParse(body);
    
    if (!validationResult.success) {
      return NextResponse.json(
        { 
          error: 'Validation failed',
          details: validationResult.error.errors
        },
        { status: 400 }
      );
    }

    const { resumeId, emailConfig } = validationResult.data;

    // Find resume
    const resume = await Resume.findOne({ 
      _id: resumeId, 
      userId: user._id 
    });

    if (!resume) {
      return NextResponse.json(
        { error: 'Resume not found' },
        { status: 404 }
      );
    }

    // Check if resume is ready for email
    if (resume.status !== 'ready') {
      return NextResponse.json(
        { error: 'Resume is not ready for email sending' },
        { status: 409 }
      );
    }

    // Validate email configuration
    const emailValidator = new EmailValidator();
    const emailValidation = emailValidator.validateEmailConfig(emailConfig);
    
    if (!emailValidation.valid) {
      return NextResponse.json(
        { 
          error: 'Email configuration invalid',
          details: emailValidation.errors
        },
        { status: 400 }
      );
    }

    // Update resume with email config
    resume.emailConfig = emailConfig;
    await resume.save();

    // Create email sending job
    const job = new Job({
      userId: user._id,
      type: 'email_sending',
      status: 'pending',
      priority: 'normal',
      data: {
        resumeId,
        emailConfig
      },
      progress: {
        current: 0,
        total: 100,
        percentage: 0,
        currentStep: 'Queued for email sending',
        steps: [
          { name: 'Initialize email sending', status: 'pending' },
          { name: 'Validate email configuration', status: 'pending' },
          { name: 'Prepare resume attachment', status: 'pending' },
          { name: 'Send email', status: 'pending' },
          { name: 'Verify delivery', status: 'pending' }
        ]
      },
      retry: {
        attempts: 0,
        maxAttempts: 3,
        backoffDelay: 2000
      }
    });

    await job.save();

    // Add job to email queue
    await addJobToQueue('email-sending', {
      jobId: job._id,
      resumeId,
      userId: user._id,
      emailConfig
    });

    return NextResponse.json({
      success: true,
      data: {
        jobId: job._id,
        resumeId: resume._id,
        status: 'processing',
        message: 'Email sending started'
      }
    });

  } catch (error) {
    console.error('Email sending error:', error);
    
    return NextResponse.json(
      { 
        error: 'Email sending failed',
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
    const jobId = searchParams.get('jobId');

    if (jobId) {
      // Get email sending status for specific job
      const job = await Job.findOne({ 
        _id: jobId, 
        userId: user._id,
        type: 'email_sending'
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

    // Get all email sending jobs for user
    const jobs = await Job.find({ 
      userId: user._id,
      type: 'email_sending'
    })
    .select('-data')
    .sort({ createdAt: -1 })
    .limit(20);

    return NextResponse.json({
      success: true,
      data: {
        jobs
      }
    });

  } catch (error) {
    console.error('Get email status error:', error);
    
    return NextResponse.json(
      { 
        error: 'Failed to get email status',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

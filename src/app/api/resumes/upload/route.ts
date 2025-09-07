'use client';

import { NextRequest, NextResponse } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { v4 as uuidv4 } from 'uuid';
import connectDB from '@/lib/db/connection';
import Resume from '@/lib/db/models/resume';
import { FileValidator } from '@/lib/services/file/file-validator';
import { DocumentProcessor } from '@/lib/services/document/docx-processor';
import { getCurrentUser } from '@/lib/middleware/auth';

// Helper function to safely call Mongoose methods
const safeFind = async (model: any, query: any, options: any = {}) => {
  let queryBuilder = model.find(query);
  
  if (options.select) {
    queryBuilder = queryBuilder.select(options.select);
  }
  if (options.sort) {
    queryBuilder = queryBuilder.sort(options.sort);
  }
  if (options.skip) {
    queryBuilder = queryBuilder.skip(options.skip);
  }
  if (options.limit) {
    queryBuilder = queryBuilder.limit(options.limit);
  }
  
  return queryBuilder.exec();
};

const safeCountDocuments = async (model: any, query: any) => {
  return model.countDocuments(query).exec();
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

    // Parse form data
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const title = formData.get('title') as string;
    const description = formData.get('description') as string;

    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      );
    }

    // Validate file
    const fileValidator = new FileValidator();
    const validationResult = await fileValidator.validateFile(file);

    if (!validationResult.valid) {
      return NextResponse.json(
        {
          error: 'File validation failed',
          details: validationResult.errors
        },
        { status: 400 }
      );
    }

    // Generate unique filename
    const fileExtension = file.name.split('.').pop()?.toLowerCase() || 'docx';
    const uniqueFileName = `${uuidv4()}.${fileExtension}`;
    const uploadDir = join(process.cwd(), 'uploads', 'resumes');
    const filePath = join(uploadDir, uniqueFileName);

    // Ensure upload directory exists
    await mkdir(uploadDir, { recursive: true });

    // Save file to disk
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    await writeFile(filePath, buffer);

    // Process document to extract content
    const docProcessor = new DocumentProcessor();
    const processingResult = await docProcessor.extractContent(buffer);

    if (!processingResult.success || !processingResult.data) {
      // Clean up uploaded file
      await import('fs').then(fs => fs.promises.unlink(filePath).catch(() => { }));

      return NextResponse.json(
        {
          error: 'Document processing failed',
          details: processingResult.error || 'No data extracted from document'
        },
        { status: 400 }
      );
    }

    // Create resume record
    const resume = new Resume({
      userId: user._id,
      originalFilename: file.name,
      originalSize: file.size,
      originalMimeType: file.type,
      filePath,
      fileName: uniqueFileName,
      title: title || file.name.replace(/\.[^/.]+$/, ''),
      description: description || '',
      status: 'ready',
      content: {
        rawText: processingResult.data.rawText,
        projects: processingResult.data.projects || [],
        extractedTechStacks: processingResult.data.techStacks || [],
        sections: processingResult.data.sections || []
      },
      customization: {
        techStacks: [],
        manualPoints: [],
        selectedProjects: [],
        customSections: []
      },
      tags: [],
      isPublic: false,
      downloadCount: 0
    });

    await resume.save();

    return NextResponse.json({
      success: true,
      data: {
        resume,
      }
    });

  } catch (error) {
    console.error('Resume upload error:', error);

    return NextResponse.json(
      {
        error: 'Upload failed',
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
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const status = searchParams.get('status');
    const search = searchParams.get('search');

    // Build query
    const query: any = { userId: user._id };

    if (status) {
      query.status = status;
    }

    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { tags: { $in: [new RegExp(search, 'i')] } }
      ];
    }

    // Get resumes with pagination using safe helper
    const skip = (page - 1) * limit;
    const resumes = await safeFind(Resume, query, {
      select: '-content.rawText -customization -emailConfig',
      sort: { updatedAt: -1 },
      skip,
      limit
    });

    const total = await safeCountDocuments(Resume, query);

    return NextResponse.json({
      success: true,
      data: {
        resumes,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit)
        }
      }
    });

  } catch (error) {
    console.error('Get resumes error:', error);

    return NextResponse.json(
      {
        error: 'Failed to fetch resumes',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
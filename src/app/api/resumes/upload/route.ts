
import { NextRequest, NextResponse } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { validateFile } from '@/lib/utils/file-validator';
import { randomUUID } from 'crypto';

export async function POST(request: NextRequest) {
  try {
    // Reduce console logging in production for performance
    if (process.env.NODE_ENV === 'development') {
      console.log('Upload endpoint called');
    }

    // Parse form data
    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      );
    }

    // Convert file to buffer and extract properties
    const arrayBuffer = await file.arrayBuffer();
    const fileBuffer = Buffer.from(arrayBuffer);
    const fileForValidation = {
      filename: file.name,
      mimetype: file.type,
      size: file.size,
      buffer: fileBuffer,
    };

    if (process.env.NODE_ENV === 'development') {
      console.log('File received:', {
        name: file.name,
        size: file.size,
        type: file.type
      });
    }

  const validationResult = validateFile(fileForValidation);

    if (!validationResult.valid) {
      return NextResponse.json(
        {
          error: 'File validation failed',
          details: validationResult.errors
        },
        { status: 400 }
      );
    }

    // Generate a unique resumeId (UUID) first
    const resumeId = randomUUID();
    
    // Generate unique filename using resumeId
    const fileExtension = file.name.split('.').pop()?.toLowerCase() || 'docx';
    const uniqueFileName = `${resumeId}.${fileExtension}`;
    const uploadDir = join(process.cwd(), 'uploads', 'resumes');
    const filePath = join(uploadDir, uniqueFileName);

    // Ensure upload directory exists
    await mkdir(uploadDir, { recursive: true });

    // Save file to disk
    await writeFile(filePath, fileBuffer);

    if (process.env.NODE_ENV === 'development') {
      console.log('File saved to:', filePath);
    }

    // Also create a mapping file for easier lookup
    const mappingDir = join(process.cwd(), 'uploads', 'mapping');
    await mkdir(mappingDir, { recursive: true });
    const mappingFile = join(mappingDir, `${resumeId}.json`);
    
    const resumeData = {
      _id: resumeId,
      filename: file.name,
      size: file.size,
      type: file.type,
      savedAs: uniqueFileName,
      title: file.name.replace(/\.[^/.]+$/, ''),
      uploadedAt: new Date().toISOString(),
    };
    
    await writeFile(mappingFile, JSON.stringify(resumeData, null, 2));
    
    return NextResponse.json({
      success: true,
      message: 'File uploaded successfully',
      data: {
        resume: resumeData
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
    return NextResponse.json({
      success: true,
      message: 'Resume upload endpoint is working',
      supportedFormats: ['docx', 'doc', 'pdf', 'txt', 'html'],
      maxFileSize: '50MB'
    });
  } catch (error) {
    console.error('Get upload info error:', error);
    return NextResponse.json(
      {
        error: 'Failed to fetch upload info',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

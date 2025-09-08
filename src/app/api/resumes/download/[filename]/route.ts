import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';

interface Params {
  filename: string;
}

export async function GET(
  request: NextRequest,
  { params }: { params: Params }
) {
  try {
    const { filename } = params;
    
    // Security check: prevent path traversal
    if (filename.includes('..') || filename.includes('/') || filename.includes('\\')) {
      return NextResponse.json(
        { error: 'Invalid filename' },
        { status: 400 }
      );
    }
    
    const processedDir = path.join(process.cwd(), 'processed');
    const filePath = path.join(processedDir, filename);
    
    try {
      // Check if file exists
      await fs.access(filePath);
      
      // Read file
      const fileBuffer = await fs.readFile(filePath);
      
      // Set appropriate headers
      const headers = new Headers();
      headers.set('Content-Type', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document');
      headers.set('Content-Disposition', `attachment; filename="${filename}"`);
      headers.set('Content-Length', fileBuffer.length.toString());
      
      return new NextResponse(fileBuffer as unknown as BodyInit, {
        status: 200,
        headers
      });
      
    } catch (error) {
      return NextResponse.json(
        { error: 'File not found' },
        { status: 404 }
      );
    }
    
  } catch (error) {
    console.error('Download error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

import { NextRequest, NextResponse } from 'next/server';
import { FileManager } from '@/lib/utils/file-manager';

export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  try {
    const fileManager = FileManager.getInstance();
    const stats = await fileManager.getProcessingStats();

    return NextResponse.json({
      success: true,
      data: stats,
    });
  } catch (error) {
    console.error('Error fetching file stats:', error);
    return NextResponse.json(
      { error: 'Failed to fetch file statistics' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const fileId = searchParams.get('fileId');
    const cleanup = searchParams.get('cleanup');
    const daysOld = parseInt(searchParams.get('daysOld') || '30');

    const fileManager = FileManager.getInstance();

    if (cleanup === 'true') {
      // Cleanup old files
      const result = await fileManager.cleanupOldFiles(daysOld);
      return NextResponse.json({
        success: true,
        message: `Cleaned up ${result.deletedCount} old files`,
        data: result,
      });
    } else if (fileId) {
      // Delete specific file
      const result = await fileManager.deleteFile(fileId);
      if (result.success) {
        return NextResponse.json({
          success: true,
          message: 'File deleted successfully',
        });
      } else {
        return NextResponse.json(
          { error: result.error },
          { status: 400 }
        );
      }
    } else {
      return NextResponse.json(
        { error: 'Missing fileId or cleanup parameter' },
        { status: 400 }
      );
    }
  } catch (error) {
    console.error('Error in file deletion:', error);
    return NextResponse.json(
      { error: 'Failed to delete file(s)' },
      { status: 500 }
    );
  }
}

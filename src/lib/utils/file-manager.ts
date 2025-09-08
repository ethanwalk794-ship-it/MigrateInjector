import { promises as fs } from 'node:fs';
import path from 'node:path';
import { randomUUID } from 'crypto';

export interface FileMetadata {
  id: string;
  originalName: string;
  savedName: string;
  size: number;
  type: string;
  uploadedAt: string;
  processedAt?: string;
  status: 'uploaded' | 'processing' | 'processed' | 'error';
  processingHistory: ProcessingRecord[];
  tags: string[];
  userId?: string;
  checksum: string;
}

export interface ProcessingRecord {
  id: string;
  processedAt: string;
  techStack: Array<{
    technology: string;
    bullets: string[];
  }>;
  success: boolean;
  outputFile?: string;
  errorMessage?: string;
  relevanceScores: Array<{
    project: string;
    score: number;
  }>;
  emailSent: boolean;
  processingDuration: number; // in milliseconds
}

export class FileManager {
  private static instance: FileManager;
  private uploadsDir: string;
  private processedDir: string;
  private metadataDir: string;

  private constructor() {
    this.uploadsDir = path.join(process.cwd(), 'uploads', 'resumes');
    this.processedDir = path.join(process.cwd(), 'processed');
    this.metadataDir = path.join(process.cwd(), 'metadata');
    this.ensureDirectories();
  }

  public static getInstance(): FileManager {
    if (!FileManager.instance) {
      FileManager.instance = new FileManager();
    }
    return FileManager.instance;
  }

  private async ensureDirectories(): Promise<void> {
    try {
      await fs.mkdir(this.uploadsDir, { recursive: true });
      await fs.mkdir(this.processedDir, { recursive: true });
      await fs.mkdir(this.metadataDir, { recursive: true });
    } catch (error) {
      console.error('Failed to create directories:', error);
    }
  }

  // Calculate file checksum for duplicate detection
  private async calculateChecksum(buffer: Buffer): Promise<string> {
    const crypto = await import('crypto');
    return crypto.createHash('sha256').update(buffer).digest('hex');
  }

  // Save uploaded file with metadata
  public async saveUploadedFile(
    file: File,
    userId?: string
  ): Promise<{ success: boolean; fileId?: string; metadata?: FileMetadata; error?: string }> {
    try {
      const fileBuffer = Buffer.from(await file.arrayBuffer());
      const checksum = await this.calculateChecksum(fileBuffer);
      
      // Check for duplicates
      const existingFile = await this.findFileByChecksum(checksum);
      if (existingFile) {
        return {
          success: false,
          error: 'File already exists',
          fileId: existingFile.id,
          metadata: existingFile,
        };
      }

      // Generate unique file ID and name
      const fileId = randomUUID();
      const extension = path.extname(file.name);
      const savedName = `${fileId}${extension}`;
      const filePath = path.join(this.uploadsDir, savedName);

      // Save file
      await fs.writeFile(filePath, fileBuffer);

      // Create metadata
      const metadata: FileMetadata = {
        id: fileId,
        originalName: file.name,
        savedName: savedName,
        size: file.size,
        type: file.type,
        uploadedAt: new Date().toISOString(),
        status: 'uploaded',
        processingHistory: [],
        tags: this.extractTags(file.name, file.type),
        userId,
        checksum,
      };

      // Save metadata
      await this.saveMetadata(fileId, metadata);

      return {
        success: true,
        fileId,
        metadata,
      };
    } catch (error) {
      console.error('Error saving file:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  // Save processing record
  public async saveProcessingRecord(
    fileId: string,
    record: Omit<ProcessingRecord, 'id'>
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const metadata = await this.getFileMetadata(fileId);
      if (!metadata) {
        return { success: false, error: 'File not found' };
      }

      const processingRecord: ProcessingRecord = {
        id: randomUUID(),
        ...record,
      };

      metadata.processingHistory.push(processingRecord);
      metadata.status = record.success ? 'processed' : 'error';
      metadata.processedAt = record.processedAt;

      await this.saveMetadata(fileId, metadata);

      return { success: true };
    } catch (error) {
      console.error('Error saving processing record:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  // Get file metadata
  public async getFileMetadata(fileId: string): Promise<FileMetadata | null> {
    try {
      const metadataPath = path.join(this.metadataDir, `${fileId}.json`);
      const data = await fs.readFile(metadataPath, 'utf-8');
      return JSON.parse(data) as FileMetadata;
    } catch (error) {
      return null;
    }
  }

  // Save metadata to file
  private async saveMetadata(fileId: string, metadata: FileMetadata): Promise<void> {
    const metadataPath = path.join(this.metadataDir, `${fileId}.json`);
    await fs.writeFile(metadataPath, JSON.stringify(metadata, null, 2));
  }

  // Find file by checksum (duplicate detection)
  public async findFileByChecksum(checksum: string): Promise<FileMetadata | null> {
    try {
      const metadataFiles = await fs.readdir(this.metadataDir);
      
      for (const metadataFile of metadataFiles) {
        if (metadataFile.endsWith('.json')) {
          const filePath = path.join(this.metadataDir, metadataFile);
          const data = await fs.readFile(filePath, 'utf-8');
          const metadata = JSON.parse(data) as FileMetadata;
          
          if (metadata.checksum === checksum) {
            return metadata;
          }
        }
      }
      
      return null;
    } catch (error) {
      console.error('Error finding file by checksum:', error);
      return null;
    }
  }

  // Get all files with optional filters
  public async getAllFiles(filters?: {
    status?: FileMetadata['status'];
    userId?: string;
    tags?: string[];
    dateRange?: { start: string; end: string };
  }): Promise<FileMetadata[]> {
    try {
      const metadataFiles = await fs.readdir(this.metadataDir);
      const files: FileMetadata[] = [];

      for (const metadataFile of metadataFiles) {
        if (metadataFile.endsWith('.json')) {
          const filePath = path.join(this.metadataDir, metadataFile);
          const data = await fs.readFile(filePath, 'utf-8');
          const metadata = JSON.parse(data) as FileMetadata;
          
          // Apply filters
          if (filters?.status && metadata.status !== filters.status) continue;
          if (filters?.userId && metadata.userId !== filters.userId) continue;
          if (filters?.tags && !filters.tags.some(tag => metadata.tags.includes(tag))) continue;
          
          if (filters?.dateRange) {
            const uploadDate = new Date(metadata.uploadedAt);
            const startDate = new Date(filters.dateRange.start);
            const endDate = new Date(filters.dateRange.end);
            if (uploadDate < startDate || uploadDate > endDate) continue;
          }
          
          files.push(metadata);
        }
      }

      return files.sort((a, b) => new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime());
    } catch (error) {
      console.error('Error getting all files:', error);
      return [];
    }
  }

  // Get file buffer
  public async getFileBuffer(fileId: string): Promise<Buffer | null> {
    try {
      const metadata = await this.getFileMetadata(fileId);
      if (!metadata) return null;

      const filePath = path.join(this.uploadsDir, metadata.savedName);
      return await fs.readFile(filePath);
    } catch (error) {
      console.error('Error reading file buffer:', error);
      return null;
    }
  }

  // Get processed file buffer
  public async getProcessedFileBuffer(filename: string): Promise<Buffer | null> {
    try {
      const filePath = path.join(this.processedDir, filename);
      return await fs.readFile(filePath);
    } catch (error) {
      console.error('Error reading processed file buffer:', error);
      return null;
    }
  }

  // Delete file and its metadata
  public async deleteFile(fileId: string): Promise<{ success: boolean; error?: string }> {
    try {
      const metadata = await this.getFileMetadata(fileId);
      if (!metadata) {
        return { success: false, error: 'File not found' };
      }

      // Delete original file
      try {
        const originalPath = path.join(this.uploadsDir, metadata.savedName);
        await fs.unlink(originalPath);
      } catch (error) {
        console.warn('Original file not found, continuing with cleanup');
      }

      // Delete processed files
      for (const record of metadata.processingHistory) {
        if (record.outputFile) {
          try {
            const processedPath = path.join(this.processedDir, record.outputFile);
            await fs.unlink(processedPath);
          } catch (error) {
            console.warn(`Processed file ${record.outputFile} not found`);
          }
        }
      }

      // Delete metadata
      const metadataPath = path.join(this.metadataDir, `${fileId}.json`);
      await fs.unlink(metadataPath);

      return { success: true };
    } catch (error) {
      console.error('Error deleting file:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  // Get processing statistics
  public async getProcessingStats(): Promise<{
    totalFiles: number;
    uploadedFiles: number;
    processedFiles: number;
    errorFiles: number;
    totalProcessingJobs: number;
    averageProcessingTime: number;
    mostUsedTechnologies: Array<{ technology: string; count: number }>;
    filesPerDay: Array<{ date: string; count: number }>;
  }> {
    try {
      const allFiles = await this.getAllFiles();
      
      const totalFiles = allFiles.length;
      const uploadedFiles = allFiles.filter(f => f.status === 'uploaded').length;
      const processedFiles = allFiles.filter(f => f.status === 'processed').length;
      const errorFiles = allFiles.filter(f => f.status === 'error').length;
      
      const allProcessingJobs = allFiles.flatMap(f => f.processingHistory);
      const totalProcessingJobs = allProcessingJobs.length;
      
      const averageProcessingTime = totalProcessingJobs > 0 
        ? allProcessingJobs.reduce((sum, job) => sum + job.processingDuration, 0) / totalProcessingJobs
        : 0;

      // Count technology usage
      const techUsage = new Map<string, number>();
      for (const job of allProcessingJobs) {
        for (const tech of job.techStack) {
          techUsage.set(tech.technology, (techUsage.get(tech.technology) || 0) + 1);
        }
      }
      
      const mostUsedTechnologies = Array.from(techUsage.entries())
        .map(([technology, count]) => ({ technology, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 10);

      // Files per day (last 30 days)
      const filesPerDay: Array<{ date: string; count: number }> = [];
      const last30Days = Array.from({ length: 30 }, (_, i) => {
        const date = new Date();
        date.setDate(date.getDate() - i);
        return date.toISOString().split('T')[0] ?? '';
      }).reverse();

      for (const date of last30Days) {
        const count = allFiles.filter(f => 
          f.uploadedAt.startsWith(date)
        ).length;
        filesPerDay.push({ date, count });
      }

      return {
        totalFiles,
        uploadedFiles,
        processedFiles,
        errorFiles,
        totalProcessingJobs,
        averageProcessingTime: Math.round(averageProcessingTime),
        mostUsedTechnologies,
        filesPerDay,
      };
    } catch (error) {
      console.error('Error getting processing stats:', error);
      return {
        totalFiles: 0,
        uploadedFiles: 0,
        processedFiles: 0,
        errorFiles: 0,
        totalProcessingJobs: 0,
        averageProcessingTime: 0,
        mostUsedTechnologies: [],
        filesPerDay: [],
      };
    }
  }

  // Extract tags from filename and type
  private extractTags(filename: string, mimeType: string): string[] {
    const tags: string[] = [];
    
    // Add file type tag
    if (mimeType.includes('word')) tags.push('word');
    if (mimeType.includes('pdf')) tags.push('pdf');
    
    // Extract tags from filename
    const lowerName = filename.toLowerCase();
    if (lowerName.includes('resume') || lowerName.includes('cv')) tags.push('resume');
    if (lowerName.includes('cover')) tags.push('cover-letter');
    if (lowerName.includes('portfolio')) tags.push('portfolio');
    if (lowerName.includes('senior')) tags.push('senior');
    if (lowerName.includes('junior')) tags.push('junior');
    if (lowerName.includes('intern')) tags.push('intern');
    
    // Tech-related tags
    const techKeywords = ['developer', 'engineer', 'programmer', 'analyst', 'manager', 'architect'];
    for (const keyword of techKeywords) {
      if (lowerName.includes(keyword)) {
        tags.push(keyword);
        break;
      }
    }
    
    return [...new Set(tags)]; // Remove duplicates
  }

  // Clean up old files (older than specified days)
  public async cleanupOldFiles(daysOld: number = 30): Promise<{ deletedCount: number; errors: string[] }> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysOld);
    
    const allFiles = await this.getAllFiles();
    const oldFiles = allFiles.filter(f => new Date(f.uploadedAt) < cutoffDate);
    
    let deletedCount = 0;
    const errors: string[] = [];
    
    for (const file of oldFiles) {
      const result = await this.deleteFile(file.id);
      if (result.success) {
        deletedCount++;
      } else {
        errors.push(`Failed to delete ${file.originalName}: ${result.error}`);
      }
    }
    
    return { deletedCount, errors };
  }
}

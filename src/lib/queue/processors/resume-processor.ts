'use client';

import { Job } from 'bullmq';
import DocumentProcessor from '../../services/document/docx-processor';
import { Logger } from '../../utils/logger';

const logger = Logger.getInstance();

interface ResumeProcessingJobData {
    resumeId: string;
    userId: string;
    filePath: string;
    fileName: string;
    options: {
        bulletFormatting?: boolean;
        projectHighlighting?: boolean;
        techStackExtraction?: boolean;
        keywordOptimization?: boolean;
        customKeywords?: string[];
    };
}

export async function processResumeJob(job: Job<ResumeProcessingJobData>): Promise<any> {
    const { resumeId, filePath } = job.data;
    try {
        logger.info(`Starting resume processing for resume ${resumeId}`);

        await job.updateProgress(10);

        const fs = await import('fs/promises');
        const fileBuffer = await fs.readFile(filePath);

        await job.updateProgress(40);

        const processor = new DocumentProcessor();
        const extract = await processor.extractContent(fileBuffer);
        if (!extract.success) {
            throw new Error(extract.error || 'Document extraction failed');
        }

        await job.updateProgress(100);

        return {
            success: true,
            resumeId,
            projects: extract.data?.projects || [],
            techStacks: extract.data?.techStacks || [],
        };
    } catch (error) {
        logger.error(`Resume processing failed for resume ${resumeId}:`, error);
        throw error;
    }
}

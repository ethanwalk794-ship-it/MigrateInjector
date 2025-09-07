import { Worker, Job } from 'bullmq';
import { getRedisConnection } from '../redis';
import { DocxProcessor } from '../../services/document/docx-processor';
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
    const { resumeId, userId, filePath, fileName, options } = job.data;

    try {
        logger.info(`Starting resume processing for resume ${resumeId}`);

        // Update job progress
        await job.updateProgress(10);

        // Read file
        const fs = await import('fs/promises');
        const fileBuffer = await fs.readFile(filePath);

        await job.updateProgress(30);

        // Process document
        const docxProcessor = DocxProcessor.getInstance();
        const result = await docxProcessor.processDocument(fileBuffer, options);

        if (!result.success) {
            throw new Error(result.error || 'Document processing failed');
        }

        await job.updateProgress(70);

        // Save processed content
        const processedFilePath = filePath.replace('.docx', '_processed.docx');
        await fs.writeFile(processedFilePath, fileBuffer);

        await job.updateProgress(100);

        logger.info(`Resume processing completed for resume ${resumeId}`);

        return {
            success: true,
            resumeId,
            processedFilePath,
            projects: result.projects,
            techStacks: result.techStacks,
            processingTime: result.processingTime,
        };

    } catch (error) {
        logger.error(`Resume processing failed for resume ${resumeId}:`, error);
        throw error;
    }
}
        const { resumeId, userId, filePath, fileName, options } = job.data;

        try {
            logger.info(`Starting resume processing for resume ${resumeId}`);

            // Update job progress
            await job.updateProgress(10);

            // Read file
            const fs = await import('fs/promises');
            const fileBuffer = await fs.readFile(filePath);

            await job.updateProgress(30);

            // Process document
            const result = await this.docxProcessor.processDocument(fileBuffer, options);

            if (!result.success) {
                throw new Error(result.error || 'Document processing failed');
            }

            await job.updateProgress(70);

            // Save processed content (you would typically save to database here)
            const processedFilePath = filePath.replace('.docx', '_processed.docx');
            await fs.writeFile(processedFilePath, fileBuffer);

            await job.updateProgress(100);

            logger.info(`Resume processing completed for resume ${resumeId}`);

            return {
                success: true,
                resumeId,
                processedFilePath,
                projects: result.projects,
                techStacks: result.techStacks,
                processingTime: result.processingTime,
            };

        } catch (error) {
            logger.error(`Resume processing failed for resume ${resumeId}:`, error);
            throw error;
        }
    }

    public async close(): Promise<void> {
        await this.worker.close();
        logger.info('Resume processor worker closed');
    }
}

// Export singleton instance
export const resumeProcessor = new ResumeProcessor();

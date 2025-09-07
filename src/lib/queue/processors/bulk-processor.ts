import { Job } from 'bullmq';
import { Logger } from '../../utils/logger';
import { DocxProcessor } from '../../services/document/docx-processor';
import { EmailService } from '../../utils/email-service';

const logger = Logger.getInstance();

interface BulkJobData {
    resumeIds: string[];
    userId: string;
    emailConfig: {
        to: string[];
        subject: string;
        message: string;
        smtpConfig: {
            host: string;
            port: number;
            user: string;
            password: string;
        };
    };
    processingOptions: {
        bulletFormatting?: boolean;
        projectHighlighting?: boolean;
        techStackExtraction?: boolean;
        keywordOptimization?: boolean;
        customKeywords?: string[];
    };
}

export async function processBulkJob(job: Job<BulkJobData>): Promise<any> {
    const { resumeIds, userId, emailConfig, processingOptions } = job.data;

    try {
        logger.info(`Processing bulk job ${job.id} with ${resumeIds.length} resumes`);

        await job.updateProgress(5);

        const docxProcessor = DocxProcessor.getInstance();
        const emailService = EmailService.getInstance();

        // Initialize email service
        await emailService.initialize(emailConfig.smtpConfig);

        await job.updateProgress(10);

        const results = [];
        const errors = [];

        // Process each resume
        for (let i = 0; i < resumeIds.length; i++) {
            const resumeId = resumeIds[i];
            const progress = 10 + (i / resumeIds.length) * 70; // 10% to 80%

            try {
                await job.updateProgress(progress);

                // Read resume file (you would typically get this from database)
                const fs = await import('fs/promises');
                const filePath = `./uploads/${resumeId}.docx`;
                const fileBuffer = await fs.readFile(filePath);

                // Process document
                const processResult = await docxProcessor.processDocument(fileBuffer, processingOptions);

                if (!processResult.success) {
                    throw new Error(processResult.error || 'Document processing failed');
                }

                // Save processed file
                const processedFilePath = filePath.replace('.docx', '_processed.docx');
                await fs.writeFile(processedFilePath, fileBuffer);

                // Prepare email data
                const emailData = {
                    to: emailConfig.to[i] || emailConfig.to[0], // Use first email if not enough provided
                    subject: emailConfig.subject,
                    html: emailConfig.message,
                    text: emailConfig.message.replace(/<[^>]*>/g, ''),
                    attachments: [{
                        filename: `resume_${resumeId}_processed.docx`,
                        content: fileBuffer,
                        contentType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
                    }],
                };

                // Send email
                const emailResult = await emailService.sendEmail(emailData);

                if (emailResult.success) {
                    results.push({
                        resumeId,
                        success: true,
                        messageId: emailResult.messageId,
                        processedFilePath,
                        projects: processResult.projects,
                        techStacks: processResult.techStacks,
                    });
                } else {
                    throw new Error(emailResult.error || 'Email sending failed');
                }

            } catch (error) {
                logger.error(`Bulk processing failed for resume ${resumeId}:`, error);
                errors.push({
                    resumeId,
                    error: error instanceof Error ? error.message : 'Unknown error',
                });
            }
        }

        await job.updateProgress(90);

        // Cleanup temporary files
        try {
            const fs = await import('fs/promises');
            for (const result of results) {
                if (result.processedFilePath) {
                    await fs.unlink(result.processedFilePath);
                }
            }
        } catch (cleanupError) {
            logger.warn('Failed to cleanup temporary files:', cleanupError);
        }

        await job.updateProgress(100);

        logger.info(`Bulk job ${job.id} completed: ${results.length} successful, ${errors.length} failed`);

        return {
            success: true,
            processed: results.length,
            failed: errors.length,
            results,
            errors,
        };

    } catch (error) {
        logger.error(`Bulk job ${job.id} failed:`, error);
        throw error;
    }
}

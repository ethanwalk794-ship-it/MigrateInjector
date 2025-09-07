'use client';

import { Job } from 'bullmq';
import { Logger } from '../../utils/logger';
import { EmailService, EmailData } from '../../utils/email-service';

const logger = Logger.getInstance();

interface EmailJobData {
    to: string;
    subject: string;
    message: string;
    attachmentPath?: string;
    attachmentName?: string;
    smtpConfig: {
        host: string;
        port: number;
        user: string;
        password: string;
    };
}

export async function processEmailJob(job: Job<EmailJobData>): Promise<any> {
    const { to, subject, message, attachmentPath, attachmentName, smtpConfig } = job.data;

    try {
        logger.info(`Processing email job ${job.id} to ${to}`);

        await job.updateProgress(10);

        const emailService = EmailService.getInstance();

        // Initialize email service with mapped SMTP config
        await emailService.initialize({
            smtpHost: smtpConfig.host,
            smtpPort: smtpConfig.port,
            smtpUser: smtpConfig.user,
            smtpPassword: smtpConfig.password,
            fromEmail: 'no-reply@localhost',
            fromName: 'Resume Customizer',
            secure: smtpConfig.port === 465,
        });

        await job.updateProgress(30);

        // Prepare email data
        const emailData: EmailData = {
            to,
            subject,
            html: message,
            text: message.replace(/<[^>]*>/g, ''), // Strip HTML for text version
        };

        // Add attachment if provided
        if (attachmentPath && attachmentName) {
            const fs = await import('fs/promises');
            const attachmentBuffer = await fs.readFile(attachmentPath);

            emailData.attachments = [{
                filename: attachmentName,
                content: attachmentBuffer,
                contentType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            }];
        }

        await job.updateProgress(60);

        // Send email
        const result = await emailService.sendEmail(emailData);

        if (!result.success) {
            throw new Error(result.error || 'Failed to send email');
        }

        await job.updateProgress(100);

        logger.info(`Email job ${job.id} completed successfully`);

        return {
            success: true,
            messageId: result.messageId,
            to,
            subject,
        };

    } catch (error) {
        logger.error(`Email job ${job.id} failed:`, error);
        throw error;
    }
}

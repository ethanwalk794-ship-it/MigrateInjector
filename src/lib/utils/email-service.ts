'use client';

import nodemailer from 'nodemailer';
import { IEmailTemplate } from '@/lib/db/models/email-template';

export interface EmailConfig {
    smtpHost: string;
    smtpPort: number;
    smtpUser: string;
    smtpPassword: string;
    fromEmail: string;
    fromName: string;
    secure?: boolean;
}

export interface EmailData {
    to: string;
    subject: string;
    html: string;
    text?: string;
    attachments?: Array<{
        filename: string;
        content: Buffer;
        contentType: string;
    }>;
    fromName?: string;
    fromEmail?: string;
}

export interface EmailResult {
    success: boolean;
    messageId?: string;
    error?: string;
}

export class EmailService {
    private static instance: EmailService;
    private transporter: nodemailer.Transporter | null = null;

    public static getInstance(): EmailService {
        if (!EmailService.instance) {
            EmailService.instance = new EmailService();
        }
        return EmailService.instance;
    }

    /**
     * Initialize email transporter with configuration
     */
    async initialize(config: EmailConfig): Promise<void> {
        try {
            this.transporter = nodemailer.createTransport({
                host: config.smtpHost,
                port: config.smtpPort,
                secure: config.secure || config.smtpPort === 465,
                auth: {
                    user: config.smtpUser,
                    pass: config.smtpPassword,
                },
                tls: {
                    rejectUnauthorized: false
                }
            });

            // Verify connection
            await this.transporter.verify();
        } catch (error) {
            console.error('Error initializing email service:', error);
            throw new Error('Failed to initialize email service');
        }
    }

    /**
     * Send email with given data
     */
    async sendEmail(emailData: EmailData): Promise<EmailResult> {
        if (!this.transporter) {
            throw new Error('Email service not initialized');
        }

        try {
            const info = await this.transporter.sendMail({
                from: `"${emailData.fromName || 'Resume Customizer Pro'}" <${emailData.fromEmail}>`,
                to: emailData.to,
                subject: emailData.subject,
                html: emailData.html,
                text: emailData.text,
                attachments: emailData.attachments
            });

            return {
                success: true,
                messageId: info.messageId
            };
        } catch (error) {
            console.error('Error sending email:', error);
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Unknown error occurred'
            };
        }
    }

    /**
     * Send resume email with attachment
     */
    async sendResumeEmail(
        to: string,
        subject: string,
        message: string,
        resumeBuffer: Buffer,
        resumeFilename: string,
        config: EmailConfig
    ): Promise<EmailResult> {
        try {
            // Initialize if not already done
            if (!this.transporter) {
                await this.initialize(config);
            }

            const htmlContent = this.generateEmailHtml(message, resumeFilename);
            const textContent = this.generateEmailText(message, resumeFilename);

            const emailData: EmailData = {
                to,
                subject,
                html: htmlContent,
                text: textContent,
                attachments: [{
                    filename: resumeFilename,
                    content: resumeBuffer,
                    contentType: this.getContentType(resumeFilename)
                }]
            };

            return await this.sendEmail(emailData);
        } catch (error) {
            console.error('Error sending resume email:', error);
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Failed to send resume email'
            };
        }
    }

    /**
     * Send bulk emails
     */
    async sendBulkEmails(
        recipients: Array<{ email: string; name?: string; customMessage?: string }>,
        subject: string,
        template: IEmailTemplate,
        resumeBuffers: Array<{ buffer: Buffer; filename: string }>,
        config: EmailConfig
    ): Promise<{ success: number; failed: number; errors: Array<{ email: string; error: string }> }> {
        let success = 0;
        let failed = 0;
        const errors: Array<{ email: string; error: string }> = [];

        // Initialize if not already done
        if (!this.transporter) {
            await this.initialize(config);
        }

        // Process emails in batches to avoid overwhelming the SMTP server
        const batchSize = 5;
        for (let i = 0; i < recipients.length; i += batchSize) {
            const batch = recipients.slice(i, i + batchSize);

            const promises = batch.map(async (recipient) => {
                try {
                    const message = recipient.customMessage || template.body;
                    const personalizedSubject = this.personalizeTemplate(subject, recipient.name || '');
                    const personalizedMessage = this.personalizeTemplate(message, recipient.name || '');

                    // Find matching resume buffer (you might want to implement logic to match resumes)
                    const resumeBuffer = resumeBuffers[0]; // Simplified - in real app, match by criteria

                    if (!resumeBuffer) {
                        failed++;
                        errors.push({ email: recipient.email, error: 'Resume buffer not found' });
                        return;
                    }

                    const result = await this.sendResumeEmail(
                        recipient.email,
                        personalizedSubject,
                        personalizedMessage,
                        resumeBuffer.buffer,
                        resumeBuffer.filename,
                        config
                    );

                    if (result.success) {
                        success++;
                    } else {
                        failed++;
                        errors.push({ email: recipient.email, error: result.error || 'Unknown error' });
                    }
                } catch (error) {
                    failed++;
                    errors.push({
                        email: recipient.email,
                        error: error instanceof Error ? error.message : 'Unknown error'
                    });
                }
            });

            await Promise.all(promises);

            // Add delay between batches
            if (i + batchSize < recipients.length) {
                await new Promise(resolve => setTimeout(resolve, 1000));
            }
        }

        return { success, failed, errors };
    }

    /**
     * Generate HTML email content
     */
    private generateEmailHtml(message: string, resumeFilename: string): string {
        return `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Resume Submission</title>
        <style>
          body {
            font-family: Arial, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
          }
          .header {
            background: linear-gradient(45deg, #2196F3, #21CBF3);
            color: white;
            padding: 20px;
            text-align: center;
            border-radius: 8px 8px 0 0;
          }
          .content {
            background: #f9f9f9;
            padding: 30px;
            border-radius: 0 0 8px 8px;
          }
          .attachment {
            background: #e3f2fd;
            padding: 15px;
            border-radius: 4px;
            margin: 20px 0;
            border-left: 4px solid #2196F3;
          }
          .footer {
            text-align: center;
            margin-top: 30px;
            padding-top: 20px;
            border-top: 1px solid #ddd;
            color: #666;
            font-size: 14px;
          }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>Resume Customizer Pro</h1>
          <p>Professional Resume Submission</p>
        </div>
        <div class="content">
          <div style="white-space: pre-wrap;">${message}</div>
          
          <div class="attachment">
            <h3>📎 Attachment</h3>
            <p><strong>File:</strong> ${resumeFilename}</p>
            <p>Please find your customized resume attached to this email.</p>
          </div>
        </div>
        <div class="footer">
          <p>This email was sent by Resume Customizer Pro</p>
          <p>If you have any questions, please contact our support team.</p>
        </div>
      </body>
      </html>
    `;
    }

    /**
     * Generate plain text email content
     */
    private generateEmailText(message: string, resumeFilename: string): string {
        return `
Resume Customizer Pro - Professional Resume Submission

${message}

Attachment: ${resumeFilename}
Please find your customized resume attached to this email.

---
This email was sent by Resume Customizer Pro
If you have any questions, please contact our support team.
    `.trim();
    }

    /**
     * Personalize template with recipient data
     */
    private personalizeTemplate(template: string, recipientName: string): string {
        return template
            .replace(/\{recipientName\}/g, recipientName || 'Valued Professional')
            .replace(/\{senderName\}/g, 'Resume Customizer Pro Team')
            .replace(/\{companyName\}/g, 'Your Company')
            .replace(/\{date\}/g, new Date().toLocaleDateString())
            .replace(/\{time\}/g, new Date().toLocaleTimeString());
    }

    /**
     * Get content type based on file extension
     */
    private getContentType(filename: string): string {
        const extension = filename.split('.').pop()?.toLowerCase();

        switch (extension) {
            case 'pdf':
                return 'application/pdf';
            case 'docx':
                return 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
            case 'doc':
                return 'application/msword';
            case 'html':
                return 'text/html';
            default:
                return 'application/octet-stream';
        }
    }

    /**
     * Test email configuration
     */
    async testConfiguration(config: EmailConfig): Promise<{ success: boolean; error?: string }> {
        try {
            const testTransporter = nodemailer.createTransport({
                host: config.smtpHost,
                port: config.smtpPort,
                secure: config.secure || config.smtpPort === 465,
                auth: {
                    user: config.smtpUser,
                    pass: config.smtpPassword,
                },
                tls: {
                    rejectUnauthorized: false
                }
            });

            await testTransporter.verify();
            return { success: true };
        } catch (error) {
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Configuration test failed'
            };
        }
    }

    /**
     * Close transporter connection
     */
    async close(): Promise<void> {
        if (this.transporter) {
            this.transporter.close();
            this.transporter = null;
        }
    }
}

import { z } from 'zod';

export const emailSchema = z.object({
    to: z.string().email('Invalid email address'),
    subject: z.string().min(1, 'Subject is required').max(200, 'Subject too long'),
    body: z.string().min(1, 'Body is required'),
    from: z.string().email('Invalid sender email').optional(),
    replyTo: z.string().email('Invalid reply-to email').optional(),
});

export const smtpConfigSchema = z.object({
    host: z.string().min(1, 'SMTP host is required'),
    port: z.number().min(1).max(65535, 'Invalid port number'),
    secure: z.boolean().optional(),
    auth: z.object({
        user: z.string().email('Invalid SMTP user email'),
        pass: z.string().min(1, 'SMTP password is required'),
    }),
});

export function validateEmailData(data: unknown) {
    return emailSchema.safeParse(data);
}

export function validateSmtpConfig(config: unknown) {
    return smtpConfigSchema.safeParse(config);
}

export function isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

export function sanitizeEmail(email: string): string {
    return email.trim().toLowerCase();
}

export class EmailValidator {
    validateEmailConfig(config: any): { valid: boolean; errors: string[] } {
        const errors: string[] = [];
        
        if (!config.recipient || !this.isValidEmail(config.recipient)) {
            errors.push('Valid recipient email is required');
        }
        
        if (!config.subject || config.subject.trim().length === 0) {
            errors.push('Subject is required');
        }
        
        if (!config.body || config.body.trim().length === 0) {
            errors.push('Body is required');
        }
        
        if (!config.smtpServer || config.smtpServer.trim().length === 0) {
            errors.push('SMTP server is required');
        }
        
        if (!config.smtpPort || config.smtpPort < 1 || config.smtpPort > 65535) {
            errors.push('Valid SMTP port is required');
        }
        
        if (!config.senderEmail || !this.isValidEmail(config.senderEmail)) {
            errors.push('Valid sender email is required');
        }
        
        if (!config.senderPassword || config.senderPassword.trim().length === 0) {
            errors.push('Sender password is required');
        }
        
        return {
            valid: errors.length === 0,
            errors
        };
    }
    
    private isValidEmail(email: string): boolean {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }
}
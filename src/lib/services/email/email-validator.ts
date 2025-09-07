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

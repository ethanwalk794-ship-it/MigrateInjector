import { z } from 'zod';

// User validation schemas
export const userRegistrationSchema = z.object({
    firstName: z.string().min(1, 'First name is required').max(50, 'First name too long'),
    lastName: z.string().min(1, 'Last name is required').max(50, 'Last name too long'),
    email: z.string().email('Invalid email address'),
    password: z.string().min(8, 'Password must be at least 8 characters').max(100, 'Password too long'),
    company: z.string().min(1, 'Company is required').max(100, 'Company name too long'),
    jobTitle: z.string().min(1, 'Job title is required').max(100, 'Job title too long'),
    phone: z.string().optional(),
    role: z.enum(['user', 'admin', 'moderator']).optional().default('user')
});

export const userLoginSchema = z.object({
    email: z.string().email('Invalid email address'),
    password: z.string().min(1, 'Password is required')
});

export const userUpdateSchema = z.object({
    firstName: z.string().min(1, 'First name is required').max(50, 'First name too long').optional(),
    lastName: z.string().min(1, 'Last name is required').max(50, 'Last name too long').optional(),
    company: z.string().min(1, 'Company is required').max(100, 'Company name too long').optional(),
    jobTitle: z.string().min(1, 'Job title is required').max(100, 'Job title too long').optional(),
    phone: z.string().optional(),
    preferences: z.object({
        theme: z.enum(['light', 'dark', 'auto']).optional(),
        language: z.string().optional(),
        timezone: z.string().optional(),
        dateFormat: z.string().optional(),
        notifications: z.object({
            email: z.boolean().optional(),
            push: z.boolean().optional(),
            processing: z.boolean().optional(),
            errors: z.boolean().optional()
        }).optional()
    }).optional()
});

// Resume validation schemas
export const resumeUploadSchema = z.object({
    title: z.string().min(1, 'Title is required').max(100, 'Title too long'),
    description: z.string().max(500, 'Description too long').optional(),
    tags: z.array(z.string()).optional(),
    isPublic: z.boolean().optional().default(false)
});

export const resumeUpdateSchema = z.object({
    title: z.string().min(1, 'Title is required').max(100, 'Title too long').optional(),
    description: z.string().max(500, 'Description too long').optional(),
    tags: z.array(z.string()).optional(),
    isPublic: z.boolean().optional(),
    customizationOptions: z.object({
        bulletFormatting: z.boolean().optional(),
        projectHighlighting: z.boolean().optional(),
        techStackExtraction: z.boolean().optional(),
        keywordOptimization: z.boolean().optional()
    }).optional()
});

// Processing validation schemas
export const processingOptionsSchema = z.object({
    bulletFormatting: z.boolean().optional().default(true),
    projectHighlighting: z.boolean().optional().default(true),
    techStackExtraction: z.boolean().optional().default(true),
    keywordOptimization: z.boolean().optional().default(true),
    customKeywords: z.array(z.string()).optional().default([]),
    outputFormat: z.enum(['docx', 'pdf', 'html']).optional().default('docx'),
    emailNotification: z.boolean().optional().default(true)
});

export const resumeProcessingSchema = z.object({
    resumeIds: z.array(z.string().min(1, 'Resume ID is required')).min(1, 'At least one resume is required'),
    options: processingOptionsSchema
});

// Email validation schemas
export const emailConfigSchema = z.object({
    recipientEmail: z.string().email('Invalid recipient email'),
    subject: z.string().min(1, 'Subject is required').max(200, 'Subject too long'),
    message: z.string().min(1, 'Message is required').max(5000, 'Message too long'),
    attachmentFormat: z.enum(['docx', 'pdf', 'html']).optional().default('docx')
});

export const emailSendingSchema = z.object({
    resumeIds: z.array(z.string().min(1, 'Resume ID is required')).min(1, 'At least one resume is required'),
    emailConfig: emailConfigSchema
});

export const bulkEmailSchema = z.object({
    recipients: z.array(z.object({
        email: z.string().email('Invalid email address'),
        name: z.string().optional(),
        customMessage: z.string().optional()
    })).min(1, 'At least one recipient is required'),
    resumeIds: z.array(z.string().min(1, 'Resume ID is required')).min(1, 'At least one resume is required'),
    templateId: z.string().optional(),
    subject: z.string().min(1, 'Subject is required').max(200, 'Subject too long')
});

// Email template validation schemas
export const emailTemplateSchema = z.object({
    name: z.string().min(1, 'Template name is required').max(100, 'Template name too long'),
    description: z.string().max(500, 'Description too long').optional(),
    category: z.string().min(1, 'Category is required').max(50, 'Category too long'),
    subject: z.string().min(1, 'Subject is required').max(200, 'Subject too long'),
    body: z.string().min(1, 'Body is required').max(10000, 'Body too long'),
    variables: z.array(z.string()).optional().default([]),
    isPublic: z.boolean().optional().default(false),
    settings: z.object({
        autoSend: z.boolean().optional().default(false),
        trackOpens: z.boolean().optional().default(true),
        trackClicks: z.boolean().optional().default(true)
    }).optional()
});

export const emailTemplateUpdateSchema = emailTemplateSchema.partial();

// Job validation schemas
export const jobCreateSchema = z.object({
    type: z.enum(['resume_processing', 'email_sending', 'bulk_processing', 'data_export']),
    priority: z.enum(['low', 'normal', 'high', 'urgent']).optional().default('normal'),
    data: z.record(z.any()).optional(),
    scheduledFor: z.date().optional(),
    maxRetries: z.number().int().min(0).max(10).optional().default(3),
    retryDelay: z.number().int().min(1000).max(3600000).optional().default(5000)
});

// File validation schemas
export const fileUploadSchema = z.object({
    filename: z.string().min(1, 'Filename is required'),
    mimetype: z.string().min(1, 'MIME type is required'),
    size: z.number().int().min(1).max(50 * 1024 * 1024), // 50MB max
    buffer: z.instanceof(Buffer)
});

// Search and filter validation schemas
export const searchSchema = z.object({
    query: z.string().min(1, 'Search query is required').max(100, 'Query too long'),
    filters: z.object({
        status: z.array(z.string()).optional(),
        tags: z.array(z.string()).optional(),
        dateRange: z.object({
            start: z.date().optional(),
            end: z.date().optional()
        }).optional(),
        sortBy: z.string().optional(),
        sortOrder: z.enum(['asc', 'desc']).optional()
    }).optional(),
    page: z.number().int().min(1).optional().default(1),
    limit: z.number().int().min(1).max(100).optional().default(20)
});

// Settings validation schemas
export const userSettingsSchema = z.object({
    profile: z.object({
        firstName: z.string().min(1, 'First name is required').max(50, 'First name too long'),
        lastName: z.string().min(1, 'Last name is required').max(50, 'Last name too long'),
        email: z.string().email('Invalid email address'),
        company: z.string().min(1, 'Company is required').max(100, 'Company name too long'),
        jobTitle: z.string().min(1, 'Job title is required').max(100, 'Job title too long'),
        phone: z.string().optional()
    }),
    preferences: z.object({
        theme: z.enum(['light', 'dark', 'auto']).optional(),
        language: z.string().optional(),
        timezone: z.string().optional(),
        dateFormat: z.string().optional(),
        notifications: z.object({
            email: z.boolean().optional(),
            push: z.boolean().optional(),
            processing: z.boolean().optional(),
            errors: z.boolean().optional()
        }).optional()
    }),
    processing: z.object({
        defaultFormat: z.enum(['docx', 'pdf', 'html']).optional(),
        autoProcess: z.boolean().optional(),
        maxFileSize: z.number().int().min(1).max(100).optional(),
        concurrentJobs: z.number().int().min(1).max(10).optional(),
        retryAttempts: z.number().int().min(0).max(10).optional()
    }),
    email: z.object({
        smtpHost: z.string().optional(),
        smtpPort: z.number().int().min(1).max(65535).optional(),
        smtpUser: z.string().optional(),
        smtpPassword: z.string().optional(),
        fromEmail: z.string().email('Invalid email address').optional(),
        fromName: z.string().optional(),
        signature: z.string().optional()
    }),
    security: z.object({
        twoFactorEnabled: z.boolean().optional(),
        sessionTimeout: z.number().int().min(5).max(1440).optional(),
        passwordExpiry: z.number().int().min(30).max(365).optional(),
        loginNotifications: z.boolean().optional()
    })
});

// API response validation schemas
export const apiResponseSchema = z.object({
    success: z.boolean(),
    message: z.string().optional(),
    data: z.any().optional(),
    error: z.string().optional(),
    pagination: z.object({
        page: z.number().int().min(1),
        limit: z.number().int().min(1),
        total: z.number().int().min(0),
        pages: z.number().int().min(0)
    }).optional()
});

// Utility functions for validation
export function validateData<T>(schema: z.ZodSchema<T>, data: unknown): { success: true; data: T } | { success: false; errors: string[] } {
    try {
        const validatedData = schema.parse(data);
        return { success: true, data: validatedData };
    } catch (error) {
        if (error instanceof z.ZodError) {
            return {
                success: false,
                errors: error.errors.map(err => `${err.path.join('.')}: ${err.message}`)
            };
        }
        return {
            success: false,
            errors: ['Validation failed']
        };
    }
}

export function validateFileType(filename: string, allowedTypes: string[]): boolean {
    const extension = filename.split('.').pop()?.toLowerCase();
    return extension ? allowedTypes.includes(extension) : false;
}

export function validateFileSize(size: number, maxSize: number): boolean {
    return size <= maxSize;
}

export function sanitizeFilename(filename: string): string {
    return filename
        .replace(/[^a-zA-Z0-9.-]/g, '_')
        .replace(/_+/g, '_')
        .replace(/^_|_$/g, '');
}

export function validateEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

export function validatePassword(password: string): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (password.length < 8) {
        errors.push('Password must be at least 8 characters long');
    }

    if (!/[A-Z]/.test(password)) {
        errors.push('Password must contain at least one uppercase letter');
    }

    if (!/[a-z]/.test(password)) {
        errors.push('Password must contain at least one lowercase letter');
    }

    if (!/\d/.test(password)) {
        errors.push('Password must contain at least one number');
    }

    if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
        errors.push('Password must contain at least one special character');
    }

    return {
        valid: errors.length === 0,
        errors
    };
}

export function validateUrl(url: string): boolean {
    try {
        new URL(url);
        return true;
    } catch {
        return false;
    }
}

export function validatePhoneNumber(phone: string): boolean {
    const phoneRegex = /^[\+]?[1-9][\d]{0,15}$/;
    return phoneRegex.test(phone.replace(/[\s\-\(\)]/g, ''));
}

export function validateDate(date: string | Date): boolean {
    const d = new Date(date);
    return d instanceof Date && !isNaN(d.getTime());
}

export function validateUuid(uuid: string): boolean {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    return uuidRegex.test(uuid);
}

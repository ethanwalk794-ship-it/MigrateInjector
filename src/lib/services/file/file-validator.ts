import { z } from 'zod';

export const fileUploadSchema = z.object({
    filename: z.string().min(1, 'Filename is required'),
    mimetype: z.string().min(1, 'MIME type is required'),
    size: z.number().min(1, 'File size must be greater than 0'),
    buffer: z.instanceof(Buffer, 'Invalid file buffer'),
});

export const allowedMimeTypes = [
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document', // .docx
    'application/msword', // .doc
    'application/pdf', // .pdf
    'text/plain', // .txt
    'text/html', // .html
];

export const maxFileSize = 50 * 1024 * 1024; // 50MB

export function validateFile(file: {
    filename: string;
    mimetype: string;
    size: number;
    buffer: Buffer;
}) {
    const result = fileUploadSchema.safeParse(file);

    if (!result.success) {
        return {
            valid: false,
            errors: result.error.errors.map(err => err.message),
        };
    }

    // Check MIME type
    if (!allowedMimeTypes.includes(file.mimetype)) {
        return {
            valid: false,
            errors: [`File type ${file.mimetype} is not allowed. Allowed types: ${allowedMimeTypes.join(', ')}`],
        };
    }

    // Check file size
    if (file.size > maxFileSize) {
        return {
            valid: false,
            errors: [`File size ${file.size} bytes exceeds maximum allowed size of ${maxFileSize} bytes`],
        };
    }

    // Check filename
    if (!isValidFilename(file.filename)) {
        return {
            valid: false,
            errors: ['Invalid filename. Only alphanumeric characters, dots, hyphens, and underscores are allowed'],
        };
    }

    return {
        valid: true,
        errors: [],
    };
}

export function isValidFilename(filename: string): boolean {
    // Allow alphanumeric, dots, hyphens, underscores, and spaces
    const filenameRegex = /^[a-zA-Z0-9._\-\s]+$/;
    return filenameRegex.test(filename) && filename.length <= 255;
}

export function sanitizeFilename(filename: string): string {
    // Remove or replace invalid characters
    return filename
        .replace(/[^a-zA-Z0-9._\-\s]/g, '_')
        .replace(/\s+/g, '_')
        .substring(0, 255);
}

export function getFileExtension(filename: string): string {
    const lastDot = filename.lastIndexOf('.');
    return lastDot === -1 ? '' : filename.substring(lastDot + 1).toLowerCase();
}

export function isDocumentFile(filename: string): boolean {
    const extension = getFileExtension(filename);
    return ['docx', 'doc', 'pdf'].includes(extension);
}

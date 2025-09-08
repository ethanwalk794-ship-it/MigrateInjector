import { z } from 'zod';

export const fileUploadSchema = z.object({
  filename: z.string().min(1, 'Filename is required'),
  mimetype: z.string().min(1, 'MIME type is required'),
  size: z.number().min(1, 'File size must be greater than 0'),
  buffer: z.instanceof(Buffer, { message: 'Invalid file buffer' }),
});

export const allowedMimeTypes = [
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document', // .docx
  'application/msword', // .doc
  'application/pdf', // .pdf
  'text/plain', // .txt
  'text/html', // .html
];

export function validateFile({ filename, mimetype, size, buffer }: { filename: string; mimetype: string; size: number; buffer: Buffer }) {
  const errors: string[] = [];
  const maxSize = 10 * 1024 * 1024; // 10MB

  // Zod schema validation
  const schemaResult = fileUploadSchema.safeParse({ filename, mimetype, size, buffer });
  if (!schemaResult.success) {
    errors.push(...schemaResult.error.errors.map(e => e.message));
  }

  // Mime type validation
  if (!allowedMimeTypes.includes(mimetype)) {
    errors.push('Invalid file type');
  }

  // Size validation
  if (size > maxSize) {
    errors.push('File is too large');
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

// Class wrapper expected by API routes (accepts Web File)
export class FileValidator {
  async validateFile(file: File): Promise<{ valid: boolean; errors: string[] }> {
    try {
      const buffer = Buffer.from(await file.arrayBuffer());
      return validateFile({
        filename: file.name,
        mimetype: file.type,
        size: file.size,
        buffer,
      });
    } catch (error) {
      return {
        valid: false,
        errors: [error instanceof Error ? error.message : 'Failed to read file'],
      };
    }
  }
}

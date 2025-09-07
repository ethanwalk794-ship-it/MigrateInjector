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

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <ThemeProvider theme={theme}>
          <CssBaseline />
          <AuthProvider>
          {children}
          </AuthProvider>
          <Toaster
            position="top-right"
            toastOptions={{
              duration: 4000,
              style: {
                background: '#363636',
                color: '#fff',
              },
              success: {
                duration: 3000,
                iconTheme: {
                  primary: '#4ade80',
                  secondary: '#fff',
                },
              },
              error: {
                duration: 5000,
                iconTheme: {
                  primary: '#ef4444',
                  secondary: '#fff',
                },
              },
            }}
          />
        </ThemeProvider>
      </body>
    </html>
  );
}

// Class wrapper expected by API routes (accepts Web File)
export class FileValidator {
    async validateFile(file: File): Promise<{ valid: boolean; errors: string[] }> {
        try {
            const buffer = Buffer.from(await file.arrayBuffer());
            const result = validateFile({
                filename: file.name,
                mimetype: file.type,
                size: file.size,
                buffer,
            });
            return result;
        } catch (error) {
            return {
                valid: false,
                errors: [error instanceof Error ? error.message : 'Failed to read file'],
            };
        }
    }
}

export default FileValidator;

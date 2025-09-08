# WARP.md

This file provides guidance to WARP (warp.dev) when working with code in this repository.

## Project Overview

Resume Customizer Pro is a high-performance, AI-powered resume customization platform built with Next.js 14, TypeScript, and a queue-based architecture for bulk processing and automated email sending.

**Key Technologies:**

- Next.js 14 (App Router) with TypeScript
- MongoDB with Mongoose ODM
- Redis with BullMQ for job queues
- Tailwind CSS for styling
- NextAuth for authentication
- Nodemailer for email functionality
- Mammoth.js for DOCX processing

## Core Architecture

### Three-Layer Queue System

The application uses a sophisticated queue-based architecture with BullMQ and Redis:

1. **Resume Processing Queue** (`resume-processing`) - Handles document parsing, content extraction, and tech stack injection
2. **Email Sending Queue** (`email-sending`) - Manages bulk email operations with rate limiting
3. **Bulk Processing Queue** (`bulk-processing`) - Coordinates large-scale operations across multiple resumes

Queue workers run as separate processes and can be scaled independently. All queues support:

- Exponential backoff retry logic (3 attempts)
- Job progress tracking
- Graceful failure handling
- Configurable concurrency levels

### Document Processing Pipeline

The `DocumentProcessor` class handles the core resume processing workflow:

- DOCX text/HTML extraction using Mammoth.js
- Tech stack detection and highlighting
- Project extraction and formatting
- Keyword optimization with custom keywords
- Multiple output formats (DOCX, HTML, PDF)

### Path Resolution System

Custom path aliases are configured in both TypeScript and Jest:

- `@/*` → `./src/*`
- `@/components/*` → `./src/components/*`
- `@/lib/*` → `./src/lib/*`
- `@/types/*` → `./src/lib/types/*`
- `@/utils/*` → `./src/lib/utils/*`
- `@/hooks/*` → `./src/lib/hooks/*`
- `@/services/*` → `./src/lib/services/*`

## Development Commands

### Core Development

```bash
npm run dev                 # Start development server (Next.js)
npm run build              # Build for production
npm start                  # Start production server
npm run type-check         # TypeScript type checking without emit
```

### Code Quality

```bash
npm run lint               # Run ESLint with Next.js config
npm run format             # Format code with Prettier
npm run format:check       # Check Prettier formatting
```

### Testing

```bash
npm run test               # Run Jest tests
npm run test:watch         # Run tests in watch mode
npm run test:coverage      # Run tests with coverage report
```

### Background Workers

```bash
npm run worker             # Start resume processing worker
```

For production deployments, run workers as separate processes:

```bash
tsx workers/resume-processor.ts
```

### Running Single Tests

Jest is configured to run tests matching these patterns:

```bash
# Run specific test file
npm test -- src/components/ui/loading-spinner.test.tsx

# Run tests matching pattern
npm test -- --testNamePattern="DocumentProcessor"

# Run tests in specific directory
npm test -- src/lib/utils
```

## Environment Setup

### Required Services

- **MongoDB** (default: `mongodb://localhost:27017/resume-customizer-pro`)
- **Redis** (default: `redis://localhost:6379`)
- **Node.js** 18+ and npm 8+

### Environment Configuration

Copy `.env.example` to `.env.local` and configure:

- Database connections (MongoDB, Redis)
- JWT secrets for authentication
- SMTP settings for email functionality
- File upload limits and directories

### Development Workflow

1. Start MongoDB and Redis services
2. Install dependencies: `npm install`
3. Configure environment variables in `.env.local`
4. Start development server: `npm run dev`
5. In separate terminal, start worker: `npm run worker`

## Key Implementation Details

### Queue Management

The queue system supports runtime management through utility functions in `src/lib/queue/queues.ts`:

- Job status tracking and cancellation
- Queue statistics and monitoring
- Pause/resume queue operations
- Queue cleaning and maintenance

### File Processing

Document processing is handled through a singleton pattern with the `DocumentProcessor` class, supporting:

- Parallel processing of multiple resumes
- Configurable processing options (bullet formatting, project highlighting, etc.)
- Tech stack extraction using comprehensive keyword matching
- Custom keyword injection with natural placement

### API Structure

API routes follow Next.js 14 App Router conventions:

- `POST /api/auth/login` - JWT-based authentication
- `POST /api/auth/register` - User registration
- `POST /api/resumes/upload` - Resume file upload
- `POST /api/resumes/process` - Queue resume processing job
- `POST /api/email/send` - Queue bulk email sending

### Security Configuration

Next.js is configured with security headers and CORS policies in `next.config.js`:

- File upload size limits (50MB default)
- Security headers (X-Frame-Options, X-Content-Type-Options)
- CORS configuration for API routes
- Client-side fallbacks for Node.js modules

### Database Connection

MongoDB connection uses a global caching strategy to prevent connection exhaustion in serverless environments, implemented in `src/lib/db/connection.ts`.

## Debugging Queue Issues

When debugging queue-related problems:

1. **Check Redis connection**: Ensure Redis is running and accessible
2. **Monitor queue stats**: Use the queue management functions to check job counts
3. **Check worker logs**: Workers log job progress, completion, and failure details
4. **Verify concurrency settings**: Queue concurrency can be adjusted via `QUEUE_CONCURRENCY` environment variable

Common queue patterns:

- Jobs stuck in "waiting": Usually indicates worker not running
- Jobs failing repeatedly: Check job data validity and external dependencies
- High memory usage: Consider reducing concurrency or implementing job cleanup

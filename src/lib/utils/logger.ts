'use client';

import winston from 'winston';
import path from 'path';

// Define log levels
const levels = {
    error: 0,
    warn: 1,
    info: 2,
    http: 3,
    debug: 4,
};

// Define colors for each level
const colors = {
    error: 'red',
    warn: 'yellow',
    info: 'green',
    http: 'magenta',
    debug: 'white',
};

// Tell winston that you want to link the colors
winston.addColors(colors);

// Define which transports the logger must use
const transports = [
    // Console transport
    new winston.transports.Console({
        format: winston.format.combine(
            winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss:ms' }),
            winston.format.colorize({ all: true }),
            winston.format.printf(
                (info) => `${info.timestamp} ${info.level}: ${info.message}`
            )
        ),
    }),
    // File transport for errors
    new winston.transports.File({
        filename: path.join(process.cwd(), 'logs', 'error.log'),
        level: 'error',
        format: winston.format.combine(
            winston.format.timestamp(),
            winston.format.errors({ stack: true }),
            winston.format.json()
        ),
    }),
    // File transport for all logs
    new winston.transports.File({
        filename: path.join(process.cwd(), 'logs', 'combined.log'),
        format: winston.format.combine(
            winston.format.timestamp(),
            winston.format.errors({ stack: true }),
            winston.format.json()
        ),
    }),
];

// Create the logger
const logger = winston.createLogger({
    level: process.env.NODE_ENV === 'development' ? 'debug' : 'warn',
    levels,
    transports,
    exitOnError: false,
});

// Create a stream object with a 'write' function that will be used by morgan
export const morganStream = {
    write: (message: string) => {
        logger.http(message.substring(0, message.lastIndexOf('\n')));
    },
};

// Custom logging methods
export class Logger {
    private static instance: Logger;
    private logger: winston.Logger;

    private constructor() {
        this.logger = logger;
    }

    public static getInstance(): Logger {
        if (!Logger.instance) {
            Logger.instance = new Logger();
        }
        return Logger.instance;
    }

    // Error logging
    public error(message: string, meta?: any): void {
        this.logger.error(message, meta);
    }

    // Warning logging
    public warn(message: string, meta?: any): void {
        this.logger.warn(message, meta);
    }

    // Info logging
    public info(message: string, meta?: any): void {
        this.logger.info(message, meta);
    }

    // HTTP logging
    public http(message: string, meta?: any): void {
        this.logger.http(message, meta);
    }

    // Debug logging
    public debug(message: string, meta?: any): void {
        this.logger.debug(message, meta);
    }

    // API request logging
    public apiRequest(method: string, url: string, statusCode: number, responseTime: number, userAgent?: string): void {
        this.logger.info('API Request', {
            method,
            url,
            statusCode,
            responseTime: `${responseTime}ms`,
            userAgent,
            timestamp: new Date().toISOString()
        });
    }

    // API error logging
    public apiError(method: string, url: string, error: Error, statusCode: number = 500): void {
        this.logger.error('API Error', {
            method,
            url,
            error: error.message,
            stack: error.stack,
            statusCode,
            timestamp: new Date().toISOString()
        });
    }

    // Database operation logging
    public dbOperation(operation: string, collection: string, duration: number, success: boolean, error?: Error): void {
        const level = success ? 'info' : 'error';
        this.logger[level]('Database Operation', {
            operation,
            collection,
            duration: `${duration}ms`,
            success,
            error: error?.message,
            timestamp: new Date().toISOString()
        });
    }

    // Job processing logging
    public jobStart(jobId: string, jobType: string, data: any): void {
        this.logger.info('Job Started', {
            jobId,
            jobType,
            data,
            timestamp: new Date().toISOString()
        });
    }

    public jobComplete(jobId: string, jobType: string, duration: number, result?: any): void {
        this.logger.info('Job Completed', {
            jobId,
            jobType,
            duration: `${duration}ms`,
            result,
            timestamp: new Date().toISOString()
        });
    }

    public jobError(jobId: string, jobType: string, error: Error, duration: number): void {
        this.logger.error('Job Failed', {
            jobId,
            jobType,
            error: error.message,
            stack: error.stack,
            duration: `${duration}ms`,
            timestamp: new Date().toISOString()
        });
    }

    // Email logging
    public emailSent(to: string, subject: string, messageId: string, duration: number): void {
        this.logger.info('Email Sent', {
            to,
            subject,
            messageId,
            duration: `${duration}ms`,
            timestamp: new Date().toISOString()
        });
    }

    public emailError(to: string, subject: string, error: Error): void {
        this.logger.error('Email Failed', {
            to,
            subject,
            error: error.message,
            stack: error.stack,
            timestamp: new Date().toISOString()
        });
    }

    // File operation logging
    public fileUpload(filename: string, size: number, userId: string, success: boolean, error?: Error): void {
        const level = success ? 'info' : 'error';
        this.logger[level]('File Upload', {
            filename,
            size: `${size} bytes`,
            userId,
            success,
            error: error?.message,
            timestamp: new Date().toISOString()
        });
    }

    public fileProcess(filename: string, processType: string, duration: number, success: boolean, error?: Error): void {
        const level = success ? 'info' : 'error';
        this.logger[level]('File Process', {
            filename,
            processType,
            duration: `${duration}ms`,
            success,
            error: error?.message,
            timestamp: new Date().toISOString()
        });
    }

    // User activity logging
    public userLogin(userId: string, email: string, ip: string, userAgent: string): void {
        this.logger.info('User Login', {
            userId,
            email,
            ip,
            userAgent,
            timestamp: new Date().toISOString()
        });
    }

    public userLogout(userId: string, email: string): void {
        this.logger.info('User Logout', {
            userId,
            email,
            timestamp: new Date().toISOString()
        });
    }

    public userAction(userId: string, action: string, resource: string, details?: any): void {
        this.logger.info('User Action', {
            userId,
            action,
            resource,
            details,
            timestamp: new Date().toISOString()
        });
    }

    // Security logging
    public securityEvent(event: string, userId?: string, ip?: string, details?: any): void {
        this.logger.warn('Security Event', {
            event,
            userId,
            ip,
            details,
            timestamp: new Date().toISOString()
        });
    }

    // Performance logging
    public performance(operation: string, duration: number, memoryUsage: NodeJS.MemoryUsage): void {
        this.logger.info('Performance', {
            operation,
            duration: `${duration}ms`,
            memoryUsage: {
                rss: `${Math.round(memoryUsage.rss / 1024 / 1024)}MB`,
                heapTotal: `${Math.round(memoryUsage.heapTotal / 1024 / 1024)}MB`,
                heapUsed: `${Math.round(memoryUsage.heapUsed / 1024 / 1024)}MB`,
                external: `${Math.round(memoryUsage.external / 1024 / 1024)}MB`
            },
            timestamp: new Date().toISOString()
        });
    }

    // System logging
    public systemStart(port: number, environment: string): void {
        this.logger.info('System Started', {
            port,
            environment,
            nodeVersion: process.version,
            platform: process.platform,
            timestamp: new Date().toISOString()
        });
    }

    public systemShutdown(reason: string): void {
        this.logger.info('System Shutdown', {
            reason,
            timestamp: new Date().toISOString()
        });
    }

    // Custom logging with context
    public logWithContext(level: string, message: string, context: any): void {
        this.logger[level as keyof winston.Logger](message, {
            ...context,
            timestamp: new Date().toISOString()
        });
    }
}

// Export default logger instance
export default Logger.getInstance();

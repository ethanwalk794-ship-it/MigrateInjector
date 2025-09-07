'use client';

import mongoose, { Document, Schema } from 'mongoose';

export interface IJob extends Document {
    _id: string;
    userId: string;
    type: 'resume_processing' | 'email_sending' | 'bulk_processing' | 'file_upload' | 'preview_generation';
    status: 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled';
    priority: 'low' | 'normal' | 'high' | 'urgent';

    // Job data
    data: {
        resumeId?: string;
        resumeIds?: string[];
        filePath?: string;
        fileName?: string;
        techStacks?: Array<{
            name: string;
            points: string[];
        }>;
        emailConfig?: {
            recipient: string;
            subject: string;
            body: string;
            smtpServer: string;
            smtpPort: number;
            senderEmail: string;
            senderPassword: string;
        };
        processingOptions?: {
            maxWorkers?: number;
            showProgress?: boolean;
            performanceStats?: boolean;
            bulkEmailMode?: boolean;
        };
    };

    // Progress tracking
    progress: {
        current: number;
        total: number;
        percentage: number;
        currentStep: string;
        steps: Array<{
            name: string;
            status: 'pending' | 'processing' | 'completed' | 'failed';
            startedAt?: Date;
            completedAt?: Date;
            error?: string;
        }>;
    };

    // Results
    result?: {
        success: boolean;
        message: string;
        data?: any;
        files?: Array<{
            name: string;
            path: string;
            size: number;
            mimeType: string;
        }>;
        metrics?: {
            processingTime: number;
            filesProcessed: number;
            pointsAdded: number;
            emailsSent: number;
            errors: number;
        };
    };

    // Error handling
    error?: {
        message: string;
        code: string;
        details?: any;
        stack?: string;
    };

    // Retry configuration
    retry: {
        attempts: number;
        maxAttempts: number;
        nextRetryAt?: Date;
        backoffDelay: number;
    };

    // Timestamps
    createdAt: Date;
    updatedAt: Date;
    startedAt?: Date;
    completedAt?: Date;

    // Methods
    updateProgress(current: number, total: number, step?: string): void;
    addStep(stepName: string): void;
    completeStep(stepName: string, error?: string): void;
    failJob(error: Error | string): void;
    completeJob(result: any): void;
    canRetry(): boolean;
    scheduleRetry(): void;
    getEstimatedCompletionTime(): Date | null;
}

const JobDataSchema = new Schema({
    resumeId: {
        type: String,
        ref: 'Resume'
    },
    resumeIds: [{
        type: String,
        ref: 'Resume'
    }],
    filePath: {
        type: String
    },
    fileName: {
        type: String
    },
    techStacks: [{
        name: {
            type: String,
            required: true
        },
        points: [{
            type: String,
            required: true
        }]
    }],
    emailConfig: {
        recipient: String,
        subject: String,
        body: String,
        smtpServer: String,
        smtpPort: Number,
        senderEmail: String,
        senderPassword: String
    },
    processingOptions: {
        maxWorkers: {
            type: Number,
            default: 4
        },
        showProgress: {
            type: Boolean,
            default: true
        },
        performanceStats: {
            type: Boolean,
            default: false
        },
        bulkEmailMode: {
            type: Boolean,
            default: false
        }
    }
}, { _id: false });

const StepSchema = new Schema({
    name: {
        type: String,
        required: true
    },
    status: {
        type: String,
        enum: ['pending', 'processing', 'completed', 'failed'],
        default: 'pending'
    },
    startedAt: {
        type: Date,
        default: null
    },
    completedAt: {
        type: Date,
        default: null
    },
    error: {
        type: String,
        default: null
    }
}, { _id: false });

const ProgressSchema = new Schema({
    current: {
        type: Number,
        default: 0,
        min: 0
    },
    total: {
        type: Number,
        default: 100,
        min: 0
    },
    percentage: {
        type: Number,
        default: 0,
        min: 0,
        max: 100
    },
    currentStep: {
        type: String,
        default: 'Initializing'
    },
    steps: [StepSchema]
}, { _id: false });

const ResultSchema = new Schema({
    success: {
        type: Boolean,
        required: true
    },
    message: {
        type: String,
        required: true
    },
    data: {
        type: Schema.Types.Mixed,
        default: null
    },
    files: [{
        name: {
            type: String,
            required: true
        },
        path: {
            type: String,
            required: true
        },
        size: {
            type: Number,
            required: true
        },
        mimeType: {
            type: String,
            required: true
        }
    }],
    metrics: {
        processingTime: {
            type: Number,
            default: 0
        },
        filesProcessed: {
            type: Number,
            default: 0
        },
        pointsAdded: {
            type: Number,
            default: 0
        },
        emailsSent: {
            type: Number,
            default: 0
        },
        errors: {
            type: Number,
            default: 0
        }
    }
}, { _id: false });

const ErrorSchema = new Schema({
    message: {
        type: String,
        required: true
    },
    code: {
        type: String,
        required: true
    },
    details: {
        type: Schema.Types.Mixed,
        default: null
    },
    stack: {
        type: String,
        default: null
    }
}, { _id: false });

const RetrySchema = new Schema({
    attempts: {
        type: Number,
        default: 0,
        min: 0
    },
    maxAttempts: {
        type: Number,
        default: 3,
        min: 1
    },
    nextRetryAt: {
        type: Date,
        default: null
    },
    backoffDelay: {
        type: Number,
        default: 1000,
        min: 0
    }
}, { _id: false });

const JobSchema = new Schema<IJob>(
    {
        userId: {
            type: String,
            required: true,
            ref: 'User'
        },
        type: {
            type: String,
            enum: ['resume_processing', 'email_sending', 'bulk_processing', 'file_upload', 'preview_generation'],
            required: true
        },
        status: {
            type: String,
            enum: ['pending', 'processing', 'completed', 'failed', 'cancelled'],
            default: 'pending'
        },
        priority: {
            type: String,
            enum: ['low', 'normal', 'high', 'urgent'],
            default: 'normal'
        },

        data: {
            type: JobDataSchema,
            required: true
        },

        progress: {
            type: ProgressSchema,
            required: true
        },

        result: {
            type: ResultSchema,
            default: null
        },

        error: {
            type: ErrorSchema,
            default: null
        },

        retry: {
            type: RetrySchema,
            required: true
        },

        startedAt: {
            type: Date,
            default: null
        },
        completedAt: {
            type: Date,
            default: null
        }
    },
    {
        timestamps: true,
        toJSON: {
            transform: function (doc, ret) {
                delete ret.__v;
                return ret;
            }
        }
    }
);

// Indexes
JobSchema.index({ userId: 1 });
JobSchema.index({ type: 1 });
JobSchema.index({ status: 1 });
JobSchema.index({ priority: 1 });
JobSchema.index({ createdAt: -1 });
JobSchema.index({ startedAt: -1 });
JobSchema.index({ 'retry.nextRetryAt': 1 });
JobSchema.index({ status: 1, priority: -1, createdAt: 1 });

// Instance methods
JobSchema.methods.updateProgress = function (current: number, total: number, step?: string): void {
    this.progress.current = current;
    this.progress.total = total;
    this.progress.percentage = Math.round((current / total) * 100);

    if (step) {
        this.progress.currentStep = step;
    }

    this.markModified('progress');
};

JobSchema.methods.addStep = function (stepName: string): void {
    this.progress.steps.push({
        name: stepName,
        status: 'pending'
    });
    this.markModified('progress.steps');
};

JobSchema.methods.completeStep = function (stepName: string, error?: string): void {
    const step = this.progress.steps.find((s: { name: string }) => s.name === stepName);
    if (step) {
        step.status = error ? 'failed' : 'completed';
        step.completedAt = new Date();
        if (error) {
            step.error = error;
        }
        this.markModified('progress.steps');
    }
};

JobSchema.methods.failJob = function (error: Error | string): void {
    this.status = 'failed';
    this.completedAt = new Date();

    const errorMessage = error instanceof Error ? error.message : error;
    const errorCode = error instanceof Error ? error.name : 'UNKNOWN_ERROR';
    const errorStack = error instanceof Error ? error.stack : undefined;

    this.error = {
        message: errorMessage,
        code: errorCode,
        stack: errorStack
    };
};

JobSchema.methods.completeJob = function (result: any): void {
    this.status = 'completed';
    this.completedAt = new Date();
    this.progress.percentage = 100;
    this.result = {
        success: true,
        message: 'Job completed successfully',
        data: result
    };
};

JobSchema.methods.canRetry = function (): boolean {
    return this.retry.attempts < this.retry.maxAttempts && this.status === 'failed';
};

JobSchema.methods.scheduleRetry = function (): void {
    if (!this.canRetry()) return;

    this.retry.attempts += 1;
    this.retry.backoffDelay = Math.min(this.retry.backoffDelay * 2, 30000); // Max 30 seconds
    this.retry.nextRetryAt = new Date(Date.now() + this.retry.backoffDelay);
    this.status = 'pending';
    this.error = null;
};

JobSchema.methods.getEstimatedCompletionTime = function (): Date | null {
    if (this.status !== 'processing' || !this.startedAt) return null;

    const elapsed = Date.now() - this.startedAt.getTime();
    const progress = this.progress.percentage;

    if (progress === 0) return null;

    const estimatedTotal = (elapsed / progress) * 100;
    const remaining = estimatedTotal - elapsed;

    return new Date(Date.now() + remaining);
};

// Static methods
JobSchema.statics.findByUser = function (userId: string) {
    return this.find({ userId }).sort({ createdAt: -1 });
};

JobSchema.statics.findByStatus = function (status: string) {
    return this.find({ status }).sort({ createdAt: -1 });
};

JobSchema.statics.findByType = function (type: string) {
    return this.find({ type }).sort({ createdAt: -1 });
};

JobSchema.statics.findPending = function () {
    return this.find({ status: 'pending' }).sort({ priority: -1, createdAt: 1 });
};

JobSchema.statics.findRetryable = function () {
    return this.find({
        status: 'failed',
        'retry.attempts': { $lt: '$retry.maxAttempts' },
        'retry.nextRetryAt': { $lte: new Date() }
    }).sort({ 'retry.nextRetryAt': 1 });
};

export default mongoose.models.Job || mongoose.model<IJob>('Job', JobSchema);

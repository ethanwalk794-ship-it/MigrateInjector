'use client';

import mongoose, { Document, Schema } from 'mongoose';

export interface ITechStack {
    name: string;
    points: string[];
    category: 'frontend' | 'backend' | 'database' | 'cloud' | 'tools' | 'other';
}

export interface IProject {
    title: string;
    company: string;
    startDate: Date;
    endDate?: Date;
    isCurrent: boolean;
    description: string;
    responsibilities: string[];
    technologies: string[];
    achievements: string[];
}

export interface IEmailConfig {
    recipient: string;
    subject: string;
    body: string;
    smtpServer: string;
    smtpPort: number;
    senderEmail: string;
    senderPassword: string;
    isSecure: boolean;
}

export interface IProcessingJob {
    jobId: string;
    status: 'pending' | 'processing' | 'completed' | 'failed';
    progress: number;
    startedAt?: Date;
    completedAt?: Date;
    error?: string;
    result?: {
        pointsAdded: number;
        projectsModified: number;
        distributionMethod: string;
    };
}

export interface IResume extends Document {
    _id: string;
    userId: string;
    originalFilename: string;
    originalSize: number;
    originalMimeType: string;
    filePath: string;
    fileName: string;
    title: string;
    description?: string;
    status: 'draft' | 'processing' | 'ready' | 'failed' | 'archived';

    // Document content
    content: {
        rawText: string;
        projects: IProject[];
        extractedTechStacks: ITechStack[];
        sections: {
            summary?: string;
            experience?: string;
            education?: string;
            skills?: string;
            achievements?: string;
        };
    };

    // Customization data
    customization: {
        techStacks: ITechStack[];
        manualPoints: string[];
        selectedProjects: string[];
        customSections: Array<{
            title: string;
            content: string;
            position: number;
        }>;
    };

    // Email configuration
    emailConfig?: IEmailConfig;

    // Processing information
    processing: {
        job?: IProcessingJob;
        lastProcessedAt?: Date;
        processingTime?: number; // in milliseconds
        version: number;
    };

    // Preview and output
    preview: {
        htmlContent?: string;
        changesSummary?: {
            pointsAdded: number;
            projectsModified: string[];
            newSections: string[];
        };
    };

    // Metadata
    tags: string[];
    isPublic: boolean;
    shareToken?: string;
    downloadCount: number;
    lastDownloadedAt?: Date;

    // Timestamps
    createdAt: Date;
    updatedAt: Date;

    // Methods
    generateShareToken(): string;
    updateProcessingStatus(status: IProcessingJob['status'], progress?: number, error?: string): void;
    addTechStack(techStack: ITechStack): void;
    removeTechStack(techStackName: string): void;
    getProcessingStatus(): IProcessingJob | null;
}

const TechStackSchema = new Schema<ITechStack>({
    name: {
        type: String,
        required: true,
        trim: true
    },
    points: [{
        type: String,
        required: true,
        trim: true
    }],
    category: {
        type: String,
        enum: ['frontend', 'backend', 'database', 'cloud', 'tools', 'other'],
        default: 'other'
    }
}, { _id: false });

const ProjectSchema = new Schema<IProject>({
    title: {
        type: String,
        required: true,
        trim: true
    },
    company: {
        type: String,
        required: true,
        trim: true
    },
    startDate: {
        type: Date,
        required: true
    },
    endDate: {
        type: Date,
        default: null
    },
    isCurrent: {
        type: Boolean,
        default: false
    },
    description: {
        type: String,
        trim: true
    },
    responsibilities: [{
        type: String,
        trim: true
    }],
    technologies: [{
        type: String,
        trim: true
    }],
    achievements: [{
        type: String,
        trim: true
    }]
}, { _id: false });

const EmailConfigSchema = new Schema<IEmailConfig>({
    recipient: {
        type: String,
        required: true,
        trim: true,
        lowercase: true
    },
    subject: {
        type: String,
        required: true,
        trim: true
    },
    body: {
        type: String,
        required: true,
        trim: true
    },
    smtpServer: {
        type: String,
        required: true,
        trim: true
    },
    smtpPort: {
        type: Number,
        required: true,
        min: 1,
        max: 65535
    },
    senderEmail: {
        type: String,
        required: true,
        trim: true,
        lowercase: true
    },
    senderPassword: {
        type: String,
        required: true,
        select: false
    },
    isSecure: {
        type: Boolean,
        default: true
    }
}, { _id: false });

const ProcessingJobSchema = new Schema<IProcessingJob>({
    jobId: {
        type: String,
        required: true,
        unique: true
    },
    status: {
        type: String,
        enum: ['pending', 'processing', 'completed', 'failed'],
        default: 'pending'
    },
    progress: {
        type: Number,
        min: 0,
        max: 100,
        default: 0
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
    },
    result: {
        pointsAdded: {
            type: Number,
            default: 0
        },
        projectsModified: {
            type: Number,
            default: 0
        },
        distributionMethod: {
            type: String,
            default: 'round_robin'
        }
    }
}, { _id: false });

const ResumeSchema = new Schema<IResume>(
    {
        userId: {
            type: String,
            required: true,
            ref: 'User'
        },
        originalFilename: {
            type: String,
            required: true,
            trim: true
        },
        originalSize: {
            type: Number,
            required: true,
            min: 0
        },
        originalMimeType: {
            type: String,
            required: true
        },
        filePath: {
            type: String,
            required: true
        },
        fileName: {
            type: String,
            required: true,
            unique: true
        },
        title: {
            type: String,
            required: true,
            trim: true,
            maxlength: [200, 'Title cannot exceed 200 characters']
        },
        description: {
            type: String,
            trim: true,
            maxlength: [1000, 'Description cannot exceed 1000 characters']
        },
        status: {
            type: String,
            enum: ['draft', 'processing', 'ready', 'failed', 'archived'],
            default: 'draft'
        },

        content: {
            rawText: {
                type: String,
                default: ''
            },
            projects: [ProjectSchema],
            extractedTechStacks: [TechStackSchema],
            sections: {
                summary: {
                    type: String,
                    default: ''
                },
                experience: {
                    type: String,
                    default: ''
                },
                education: {
                    type: String,
                    default: ''
                },
                skills: {
                    type: String,
                    default: ''
                },
                achievements: {
                    type: String,
                    default: ''
                }
            }
        },

        customization: {
            techStacks: [TechStackSchema],
            manualPoints: [{
                type: String,
                trim: true
            }],
            selectedProjects: [{
                type: String,
                trim: true
            }],
            customSections: [{
                title: {
                    type: String,
                    required: true,
                    trim: true
                },
                content: {
                    type: String,
                    required: true,
                    trim: true
                },
                position: {
                    type: Number,
                    required: true,
                    min: 0
                }
            }]
        },

        emailConfig: {
            type: EmailConfigSchema,
            default: null
        },

        processing: {
            job: {
                type: ProcessingJobSchema,
                default: null
            },
            lastProcessedAt: {
                type: Date,
                default: null
            },
            processingTime: {
                type: Number,
                default: null
            },
            version: {
                type: Number,
                default: 1
            }
        },

        preview: {
            htmlContent: {
                type: String,
                default: null
            },
            changesSummary: {
                pointsAdded: {
                    type: Number,
                    default: 0
                },
                projectsModified: [{
                    type: String,
                    trim: true
                }],
                newSections: [{
                    type: String,
                    trim: true
                }]
            }
        },

        tags: [{
            type: String,
            trim: true,
            lowercase: true
        }],
        isPublic: {
            type: Boolean,
            default: false
        },
        shareToken: {
            type: String,
            unique: true,
            sparse: true
        },
        downloadCount: {
            type: Number,
            default: 0
        },
        lastDownloadedAt: {
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
ResumeSchema.index({ userId: 1 });
ResumeSchema.index({ status: 1 });
ResumeSchema.index({ createdAt: -1 });
ResumeSchema.index({ updatedAt: -1 });
ResumeSchema.index({ tags: 1 });
ResumeSchema.index({ isPublic: 1 });
ResumeSchema.index({ shareToken: 1 });
ResumeSchema.index({ 'processing.job.jobId': 1 });
ResumeSchema.index({ title: 'text', description: 'text' });

// Instance methods
ResumeSchema.methods.generateShareToken = function (): string {
    const crypto = require('crypto');
    this.shareToken = crypto.randomBytes(32).toString('hex');
    return this.shareToken;
};

ResumeSchema.methods.updateProcessingStatus = function (
    status: IProcessingJob['status'],
    progress?: number,
    error?: string
): void {
    if (!this.processing.job) {
        this.processing.job = {
            jobId: '',
            status: 'pending',
            progress: 0
        };
    }

    this.processing.job.status = status;
    if (progress !== undefined) {
        this.processing.job.progress = progress;
    }
    if (error) {
        this.processing.job.error = error;
    }

    if (status === 'processing' && !this.processing.job.startedAt) {
        this.processing.job.startedAt = new Date();
    }

    if (status === 'completed' || status === 'failed') {
        this.processing.job.completedAt = new Date();
        this.processing.lastProcessedAt = new Date();
    }
};

ResumeSchema.methods.addTechStack = function (techStack: ITechStack): void {
    const existingIndex = this.customization.techStacks.findIndex(
        (ts: ITechStack) => ts.name.toLowerCase() === techStack.name.toLowerCase()
    );

    if (existingIndex >= 0) {
        this.customization.techStacks[existingIndex] = techStack;
    } else {
        this.customization.techStacks.push(techStack);
    }
};

ResumeSchema.methods.removeTechStack = function (techStackName: string): void {
    this.customization.techStacks = this.customization.techStacks.filter(
        (ts: ITechStack) => ts.name.toLowerCase() !== techStackName.toLowerCase()
    );
};

ResumeSchema.methods.getProcessingStatus = function (): IProcessingJob | null {
    return this.processing.job || null;
};

// Static methods
ResumeSchema.statics.findByUser = function (userId: string) {
    return this.find({ userId }).sort({ updatedAt: -1 });
};

ResumeSchema.statics.findByStatus = function (status: string) {
    return this.find({ status }).sort({ createdAt: -1 });
};

ResumeSchema.statics.findPublic = function () {
    return this.find({ isPublic: true }).sort({ createdAt: -1 });
};

export default mongoose.models.Resume || mongoose.model<IResume>('Resume', ResumeSchema);

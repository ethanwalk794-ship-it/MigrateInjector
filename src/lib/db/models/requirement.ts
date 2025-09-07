'use client';

import mongoose, { Document, Schema } from 'mongoose';

export interface IRequirement extends Document {
    _id: string;
    userId: string;
    title: string;
    description: string;
    company: string;
    position: string;
    location?: string;
    salaryRange?: {
        min: number;
        max: number;
        currency: string;
    };
    employmentType: 'full-time' | 'part-time' | 'contract' | 'internship' | 'freelance';
    experienceLevel: 'entry' | 'junior' | 'mid' | 'senior' | 'lead' | 'executive';

    // Technical requirements
    technicalSkills: {
        required: string[];
        preferred: string[];
        categories: {
            frontend: string[];
            backend: string[];
            database: string[];
            cloud: string[];
            tools: string[];
            other: string[];
        };
    };

    // Soft skills and qualifications
    softSkills: string[];
    qualifications: {
        education: {
            level: 'high-school' | 'associate' | 'bachelor' | 'master' | 'phd';
            field?: string;
            required: boolean;
        };
        certifications: string[];
        languages: Array<{
            name: string;
            proficiency: 'beginner' | 'intermediate' | 'advanced' | 'native';
        }>;
    };

    // Job responsibilities and expectations
    responsibilities: string[];
    expectations: string[];
    benefits: string[];

    // Application details
    applicationDetails: {
        deadline?: Date;
        applicationMethod: 'email' | 'website' | 'linkedin' | 'other';
        contactEmail?: string;
        applicationUrl?: string;
        additionalNotes?: string;
    };

    // Metadata
    tags: string[];
    priority: 'low' | 'medium' | 'high' | 'urgent';
    status: 'draft' | 'active' | 'paused' | 'closed' | 'archived';
    isTemplate: boolean;
    templateName?: string;

    // Usage tracking
    usage: {
        timesUsed: number;
        lastUsedAt?: Date;
        successRate?: number; // percentage of successful applications
    };

    // Timestamps
    createdAt: Date;
    updatedAt: Date;

    // Methods
    addTechnicalSkill(skill: string, category: string, required?: boolean): void;
    removeTechnicalSkill(skill: string): void;
    updatePriority(priority: IRequirement['priority']): void;
    markAsUsed(): void;
    getFormattedSalaryRange(): string;
}

const SalaryRangeSchema = new Schema({
    min: {
        type: Number,
        required: true,
        min: 0
    },
    max: {
        type: Number,
        required: true,
        min: 0
    },
    currency: {
        type: String,
        required: true,
        default: 'USD',
        uppercase: true
    }
}, { _id: false });

const LanguageSchema = new Schema({
    name: {
        type: String,
        required: true,
        trim: true
    },
    proficiency: {
        type: String,
        enum: ['beginner', 'intermediate', 'advanced', 'native'],
        required: true
    }
}, { _id: false });

const EducationSchema = new Schema({
    level: {
        type: String,
        enum: ['high-school', 'associate', 'bachelor', 'master', 'phd'],
        required: true
    },
    field: {
        type: String,
        trim: true
    },
    required: {
        type: Boolean,
        default: false
    }
}, { _id: false });

const TechnicalSkillsSchema = new Schema({
    required: [{
        type: String,
        trim: true
    }],
    preferred: [{
        type: String,
        trim: true
    }],
    categories: {
        frontend: [{
            type: String,
            trim: true
        }],
        backend: [{
            type: String,
            trim: true
        }],
        database: [{
            type: String,
            trim: true
        }],
        cloud: [{
            type: String,
            trim: true
        }],
        tools: [{
            type: String,
            trim: true
        }],
        other: [{
            type: String,
            trim: true
        }]
    }
}, { _id: false });

const ApplicationDetailsSchema = new Schema({
    deadline: {
        type: Date,
        default: null
    },
    applicationMethod: {
        type: String,
        enum: ['email', 'website', 'linkedin', 'other'],
        required: true
    },
    contactEmail: {
        type: String,
        trim: true,
        lowercase: true
    },
    applicationUrl: {
        type: String,
        trim: true
    },
    additionalNotes: {
        type: String,
        trim: true,
        maxlength: [1000, 'Additional notes cannot exceed 1000 characters']
    }
}, { _id: false });

const RequirementSchema = new Schema<IRequirement>(
    {
        userId: {
            type: String,
            required: true,
            ref: 'User'
        },
        title: {
            type: String,
            required: [true, 'Title is required'],
            trim: true,
            maxlength: [200, 'Title cannot exceed 200 characters']
        },
        description: {
            type: String,
            required: [true, 'Description is required'],
            trim: true,
            maxlength: [2000, 'Description cannot exceed 2000 characters']
        },
        company: {
            type: String,
            required: [true, 'Company is required'],
            trim: true,
            maxlength: [100, 'Company name cannot exceed 100 characters']
        },
        position: {
            type: String,
            required: [true, 'Position is required'],
            trim: true,
            maxlength: [100, 'Position cannot exceed 100 characters']
        },
        location: {
            type: String,
            trim: true,
            maxlength: [100, 'Location cannot exceed 100 characters']
        },
        salaryRange: {
            type: SalaryRangeSchema,
            default: null
        },
        employmentType: {
            type: String,
            enum: ['full-time', 'part-time', 'contract', 'internship', 'freelance'],
            required: true
        },
        experienceLevel: {
            type: String,
            enum: ['entry', 'junior', 'mid', 'senior', 'lead', 'executive'],
            required: true
        },

        technicalSkills: {
            type: TechnicalSkillsSchema,
            required: true
        },

        softSkills: [{
            type: String,
            trim: true
        }],

        qualifications: {
            education: {
                type: EducationSchema,
                required: true
            },
            certifications: [{
                type: String,
                trim: true
            }],
            languages: [LanguageSchema]
        },

        responsibilities: [{
            type: String,
            required: true,
            trim: true
        }],
        expectations: [{
            type: String,
            trim: true
        }],
        benefits: [{
            type: String,
            trim: true
        }],

        applicationDetails: {
            type: ApplicationDetailsSchema,
            required: true
        },

        tags: [{
            type: String,
            trim: true,
            lowercase: true
        }],
        priority: {
            type: String,
            enum: ['low', 'medium', 'high', 'urgent'],
            default: 'medium'
        },
        status: {
            type: String,
            enum: ['draft', 'active', 'paused', 'closed', 'archived'],
            default: 'draft'
        },
        isTemplate: {
            type: Boolean,
            default: false
        },
        templateName: {
            type: String,
            trim: true
        },

        usage: {
            timesUsed: {
                type: Number,
                default: 0
            },
            lastUsedAt: {
                type: Date,
                default: null
            },
            successRate: {
                type: Number,
                min: 0,
                max: 100,
                default: null
            }
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
RequirementSchema.index({ userId: 1 });
RequirementSchema.index({ status: 1 });
RequirementSchema.index({ priority: 1 });
RequirementSchema.index({ isTemplate: 1 });
RequirementSchema.index({ createdAt: -1 });
RequirementSchema.index({ updatedAt: -1 });
RequirementSchema.index({ tags: 1 });
RequirementSchema.index({
    title: 'text',
    description: 'text',
    company: 'text',
    position: 'text'
});

// Instance methods
RequirementSchema.methods.addTechnicalSkill = function (
    skill: string,
    category: string,
    required: boolean = false
): void {
    const skillList = required ? this.technicalSkills.required : this.technicalSkills.preferred;

    if (!skillList.includes(skill)) {
        skillList.push(skill);
    }

    if (this.technicalSkills.categories[category as keyof typeof this.technicalSkills.categories]) {
        const categoryList = this.technicalSkills.categories[category as keyof typeof this.technicalSkills.categories];
        if (!categoryList.includes(skill)) {
            categoryList.push(skill);
        }
    }
};

RequirementSchema.methods.removeTechnicalSkill = function (skill: string): void {
    this.technicalSkills.required = this.technicalSkills.required.filter((s: string) => s !== skill);
    this.technicalSkills.preferred = this.technicalSkills.preferred.filter((s: string) => s !== skill);

    // Remove from all categories
    Object.keys(this.technicalSkills.categories).forEach(category => {
        const categoryList = this.technicalSkills.categories[category as keyof typeof this.technicalSkills.categories];
        this.technicalSkills.categories[category as keyof typeof this.technicalSkills.categories] =
            categoryList.filter((s: string) => s !== skill);
    });
};

RequirementSchema.methods.updatePriority = function (priority: IRequirement['priority']): void {
    this.priority = priority;
};

RequirementSchema.methods.markAsUsed = function (): void {
    this.usage.timesUsed += 1;
    this.usage.lastUsedAt = new Date();
};

RequirementSchema.methods.getFormattedSalaryRange = function (): string {
    if (!this.salaryRange) return 'Not specified';

    const { min, max, currency } = this.salaryRange;
    return `${currency} ${min.toLocaleString()} - ${max.toLocaleString()}`;
};

// Static methods
RequirementSchema.statics.findByUser = function (userId: string) {
    return this.find({ userId }).sort({ updatedAt: -1 });
};

RequirementSchema.statics.findTemplates = function () {
    return this.find({ isTemplate: true }).sort({ createdAt: -1 });
};

RequirementSchema.statics.findByStatus = function (status: string) {
    return this.find({ status }).sort({ createdAt: -1 });
};

RequirementSchema.statics.findByPriority = function (priority: string) {
    return this.find({ priority }).sort({ createdAt: -1 });
};

export default mongoose.models.Requirement || mongoose.model<IRequirement>('Requirement', RequirementSchema);

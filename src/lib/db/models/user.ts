'use client';

import mongoose, { Document, Schema } from 'mongoose';
import bcrypt from 'bcryptjs';

export interface IUser extends Document {
    _id: string;
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    avatar?: string;
    role: 'user' | 'admin' | 'moderator';
    isActive: boolean;
    isEmailVerified: boolean;
    lastLoginAt?: Date;
    preferences: {
        theme: 'light' | 'dark' | 'auto';
        notifications: {
            email: boolean;
            push: boolean;
            sms: boolean;
        };
        language: string;
    };
    subscription: {
        plan: 'free' | 'pro' | 'enterprise';
        status: 'active' | 'cancelled' | 'expired';
        expiresAt?: Date;
        features: string[];
    };
    usage: {
        resumesProcessed: number;
        emailsSent: number;
        storageUsed: number; // in bytes
        lastResetAt: Date;
    };
    createdAt: Date;
    updatedAt: Date;
    comparePassword(candidatePassword: string): Promise<boolean>;
    getFullName(): string;
}

const UserSchema = new Schema<IUser>(
    {
        email: {
            type: String,
            required: [true, 'Email is required'],
            unique: true,
            lowercase: true,
            trim: true,
            match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email']
        },
        password: {
            type: String,
            required: [true, 'Password is required'],
            minlength: [8, 'Password must be at least 8 characters long'],
            select: false
        },
        firstName: {
            type: String,
            required: [true, 'First name is required'],
            trim: true,
            maxlength: [50, 'First name cannot exceed 50 characters']
        },
        lastName: {
            type: String,
            required: [true, 'Last name is required'],
            trim: true,
            maxlength: [50, 'Last name cannot exceed 50 characters']
        },
        avatar: {
            type: String,
            default: null
        },
        role: {
            type: String,
            enum: ['user', 'admin', 'moderator'],
            default: 'user'
        },
        isActive: {
            type: Boolean,
            default: true
        },
        isEmailVerified: {
            type: Boolean,
            default: false
        },
        lastLoginAt: {
            type: Date,
            default: null
        },
        preferences: {
            theme: {
                type: String,
                enum: ['light', 'dark', 'auto'],
                default: 'auto'
            },
            notifications: {
                email: {
                    type: Boolean,
                    default: true
                },
                push: {
                    type: Boolean,
                    default: true
                },
                sms: {
                    type: Boolean,
                    default: false
                }
            },
            language: {
                type: String,
                default: 'en'
            }
        },
        subscription: {
            plan: {
                type: String,
                enum: ['free', 'pro', 'enterprise'],
                default: 'free'
            },
            status: {
                type: String,
                enum: ['active', 'cancelled', 'expired'],
                default: 'active'
            },
            expiresAt: {
                type: Date,
                default: null
            },
            features: [{
                type: String,
                enum: [
                    'unlimited_resumes',
                    'bulk_processing',
                    'email_templates',
                    'advanced_analytics',
                    'priority_support',
                    'api_access',
                    'custom_branding'
                ]
            }]
        },
        usage: {
            resumesProcessed: {
                type: Number,
                default: 0
            },
            emailsSent: {
                type: Number,
                default: 0
            },
            storageUsed: {
                type: Number,
                default: 0
            },
            lastResetAt: {
                type: Date,
                default: Date.now
            }
        }
    },
    {
        timestamps: true,
        toJSON: {
            transform: function (doc, ret) {
                delete ret.password;
                delete ret.__v;
                return ret;
            }
        }
    }
);

// Indexes
UserSchema.index({ email: 1 });
UserSchema.index({ role: 1 });
UserSchema.index({ isActive: 1 });
UserSchema.index({ 'subscription.plan': 1 });
UserSchema.index({ createdAt: -1 });

// Pre-save middleware to hash password
UserSchema.pre('save', async function (next) {
    if (!this.isModified('password')) return next();

    try {
        const salt = await bcrypt.genSalt(12);
        this.password = await bcrypt.hash(this.password, salt);
        next();
    } catch (error) {
        next(error as Error);
    }
});

// Instance methods
UserSchema.methods.comparePassword = async function (candidatePassword: string): Promise<boolean> {
    return bcrypt.compare(candidatePassword, this.password);
};

UserSchema.methods.getFullName = function (): string {
    return `${this.firstName} ${this.lastName}`.trim();
};

// Static methods
UserSchema.statics.findByEmail = function (email: string) {
    return this.findOne({ email: email.toLowerCase() });
};

UserSchema.statics.findActiveUsers = function () {
    return this.find({ isActive: true });
};

export default mongoose.models.User || mongoose.model<IUser>('User', UserSchema);

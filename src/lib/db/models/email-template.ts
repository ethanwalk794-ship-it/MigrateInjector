'use client';

import mongoose, { Document, Schema, Model } from 'mongoose';

export interface IEmailTemplate extends Document {
  _id: string;
  userId: string;
  name: string;
  description?: string;
  category: 'resume' | 'follow-up' | 'thank-you' | 'rejection' | 'custom';
  
  // Template content
  subject: string;
  body: string;
  htmlBody?: string;
  
  // Template variables
  variables: Array<{
    name: string;
    description: string;
    defaultValue?: string;
    required: boolean;
    type: 'text' | 'email' | 'url' | 'date' | 'number';
  }>;
  
  // SMTP configuration
  smtpConfig: {
    server: string;
    port: number;
    secure: boolean;
    auth: {
      user: string;
      pass: string;
    };
  };
  
  // Template settings
  settings: {
    isDefault: boolean;
    isPublic: boolean;
    isActive: boolean;
    language: string;
    encoding: string;
  };
  
  // Usage tracking
  usage: {
    timesUsed: number;
    lastUsedAt?: Date;
    successRate?: number;
    lastError?: string;
  };
  
  // Metadata
  tags: string[];
  version: number;
  
  // Timestamps
  createdAt: Date;
  updatedAt: Date;
  
  // Methods
  addVariable(variable: IEmailTemplate['variables'][0]): void;
  removeVariable(variableName: string): void;
  updateVariable(variableName: string, updates: Partial<IEmailTemplate['variables'][0]>): void;
  renderTemplate(data: Record<string, any>): { subject: string; body: string; htmlBody?: string };
  markAsUsed(success: boolean, error?: string): void;
  clone(newName: string): Promise<IEmailTemplate>;
}

// Define the interface for static methods
interface EmailTemplateModel extends Model<IEmailTemplate> {
  findByUser(userId: string): Promise<IEmailTemplate[]>;
  findByCategory(category: string): Promise<IEmailTemplate[]>;
  findPublic(): Promise<IEmailTemplate[]>;
  findDefault(): Promise<IEmailTemplate[]>;
  findActive(): Promise<IEmailTemplate[]>;
}

const VariableSchema = new Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    required: true,
    trim: true
  },
  defaultValue: {
    type: String,
    trim: true
  },
  required: {
    type: Boolean,
    default: false
  },
  type: {
    type: String,
    enum: ['text', 'email', 'url', 'date', 'number'],
    default: 'text'
  }
}, { _id: false });

const SMTPConfigSchema = new Schema({
  server: {
    type: String,
    required: true,
    trim: true
  },
  port: {
    type: Number,
    required: true,
    min: 1,
    max: 65535
  },
  secure: {
    type: Boolean,
    default: false
  },
  auth: {
    user: {
      type: String,
      required: true,
      trim: true,
      lowercase: true
    },
    pass: {
      type: String,
      required: true,
      select: false
    }
  }
}, { _id: false });

const SettingsSchema = new Schema({
  isDefault: {
    type: Boolean,
    default: false
  },
  isPublic: {
    type: Boolean,
    default: false
  },
  isActive: {
    type: Boolean,
    default: true
  },
  language: {
    type: String,
    default: 'en',
    trim: true
  },
  encoding: {
    type: String,
    default: 'utf-8',
    trim: true
  }
}, { _id: false });

const UsageSchema = new Schema({
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
  },
  lastError: {
    type: String,
    default: null
  }
}, { _id: false });

const EmailTemplateSchema = new Schema<IEmailTemplate, EmailTemplateModel>(
  {
    userId: {
      type: String,
      required: true,
      ref: 'User'
    },
    name: {
      type: String,
      required: [true, 'Template name is required'],
      trim: true,
      maxlength: [100, 'Template name cannot exceed 100 characters']
    },
    description: {
      type: String,
      trim: true,
      maxlength: [500, 'Description cannot exceed 500 characters']
    },
    category: {
      type: String,
      enum: ['resume', 'follow-up', 'thank-you', 'rejection', 'custom'],
      required: true
    },
    
    subject: {
      type: String,
      required: [true, 'Subject is required'],
      trim: true,
      maxlength: [200, 'Subject cannot exceed 200 characters']
    },
    body: {
      type: String,
      required: [true, 'Body is required'],
      trim: true
    },
    htmlBody: {
      type: String,
      trim: true
    },
    
    variables: [VariableSchema],
    
    smtpConfig: {
      type: SMTPConfigSchema,
      required: true
    },
    
    settings: {
      type: SettingsSchema,
      required: true
    },
    
    usage: {
      type: UsageSchema,
      required: true
    },
    
    tags: [{
      type: String,
      trim: true,
      lowercase: true
    }],
    version: {
      type: Number,
      default: 1,
      min: 1
    }
  },
  {
    timestamps: true,
    toJSON: {
      transform: function(doc, ret) {
        delete ret.__v;
        return ret;
      }
    }
  }
);

// Indexes
EmailTemplateSchema.index({ userId: 1 });
EmailTemplateSchema.index({ category: 1 });
EmailTemplateSchema.index({ 'settings.isDefault': 1 });
EmailTemplateSchema.index({ 'settings.isPublic': 1 });
EmailTemplateSchema.index({ 'settings.isActive': 1 });
EmailTemplateSchema.index({ createdAt: -1 });
EmailTemplateSchema.index({ updatedAt: -1 });
EmailTemplateSchema.index({ tags: 1 });
EmailTemplateSchema.index({ name: 'text', description: 'text' });

// Instance methods
EmailTemplateSchema.methods.addVariable = function(variable: IEmailTemplate['variables'][0]): void {
  const existingIndex = this.variables.findIndex((v: IEmailTemplate['variables'][0]) => v.name === variable.name);
  
  if (existingIndex >= 0) {
    this.variables[existingIndex] = variable;
  } else {
    this.variables.push(variable);
  }
  
  this.markModified('variables');
};

EmailTemplateSchema.methods.removeVariable = function(variableName: string): void {
  this.variables = this.variables.filter((v: IEmailTemplate['variables'][0]) => v.name !== variableName);
  this.markModified('variables');
};

EmailTemplateSchema.methods.updateVariable = function(
  variableName: string, 
  updates: Partial<IEmailTemplate['variables'][0]>
): void {
  const variable = this.variables.find((v: IEmailTemplate['variables'][0]) => v.name === variableName);
  if (variable) {
    Object.assign(variable, updates);
    this.markModified('variables');
  }
};

EmailTemplateSchema.methods.renderTemplate = function(data: Record<string, any>): { 
  subject: string; 
  body: string; 
  htmlBody?: string 
} {
  let subject = this.subject;
  let body = this.body;
  let htmlBody = this.htmlBody;
  
  // Replace variables in subject
  this.variables.forEach((variable: IEmailTemplate['variables'][0]) => {
    const value = data[variable.name] || variable.defaultValue || `{{${variable.name}}}`;
    const regex = new RegExp(`{{${variable.name}}}`, 'g');
    subject = subject.replace(regex, value);
  });
  
  // Replace variables in body
  this.variables.forEach((variable: IEmailTemplate['variables'][0]) => {
    const value = data[variable.name] || variable.defaultValue || `{{${variable.name}}}`;
    const regex = new RegExp(`{{${variable.name}}}`, 'g');
    body = body.replace(regex, value);
    
    if (htmlBody) {
      htmlBody = htmlBody.replace(regex, value);
    }
  });
  
  return {
    subject,
    body,
    htmlBody
  };
};

EmailTemplateSchema.methods.markAsUsed = function(success: boolean, error?: string): void {
  this.usage.timesUsed += 1;
  this.usage.lastUsedAt = new Date();
  
  if (error) {
    this.usage.lastError = error;
  }
  
  // Update success rate
  if (this.usage.timesUsed > 0) {
    const currentSuccessRate = this.usage.successRate || 0;
    const totalAttempts = this.usage.timesUsed;
    const previousSuccesses = Math.round((currentSuccessRate / 100) * (totalAttempts - 1));
    const newSuccesses = success ? previousSuccesses + 1 : previousSuccesses;
    this.usage.successRate = (newSuccesses / totalAttempts) * 100;
  }
};

EmailTemplateSchema.methods.clone = async function(newName: string): Promise<IEmailTemplate> {
  const clonedData = this.toObject();
  delete clonedData._id;
  delete clonedData.createdAt;
  delete clonedData.updatedAt;
  
  clonedData.name = newName;
  clonedData.settings.isDefault = false;
  clonedData.usage = {
    timesUsed: 0,
    lastUsedAt: null,
    successRate: null,
    lastError: null
  };
  
  const EmailTemplate = mongoose.model<IEmailTemplate, EmailTemplateModel>('EmailTemplate');
  return new EmailTemplate(clonedData).save();
};

// Static methods
EmailTemplateSchema.statics.findByUser = function(userId: string) {
  return this.find({ userId }).sort({ createdAt: -1 });
};

EmailTemplateSchema.statics.findByCategory = function(category: string) {
  return this.find({ category, 'settings.isActive': true }).sort({ createdAt: -1 });
};

EmailTemplateSchema.statics.findPublic = function() {
  return this.find({ 'settings.isPublic': true, 'settings.isActive': true }).sort({ createdAt: -1 });
};

EmailTemplateSchema.statics.findDefault = function() {
  return this.find({ 'settings.isDefault': true, 'settings.isActive': true }).sort({ createdAt: -1 });
};

EmailTemplateSchema.statics.findActive = function() {
  return this.find({ 'settings.isActive': true }).sort({ createdAt: -1 });
};

// export default mongoose.models.EmailTemplate as EmailTemplateModel || 
//   mongoose.model<IEmailTemplate, EmailTemplateModel>('EmailTemplate', EmailTemplateSchema);

export default mongoose.models.EmailTemplate || mongoose.model<IEmailTemplate>('EmailTemplate', EmailTemplateSchema);
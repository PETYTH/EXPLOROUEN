// src/models/mongodb/Contact.ts
import mongoose, { Document, Schema } from 'mongoose';

export interface IContact extends Document {
    firstName: string;
    lastName: string;
    email: string;
    phone?: string;
    subject: string;
    message: string;
    status: 'pending' | 'in_progress' | 'resolved' | 'closed';
    priority: 'low' | 'medium' | 'high' | 'urgent';
    assignedTo?: string;
    tags: string[];
    attachments: string[];
    ipAddress?: string;
    userAgent?: string;
    createdAt: Date;
    updatedAt: Date;
    resolvedAt?: Date;
    notes: string[];
}

const ContactSchema = new Schema<IContact>({
    firstName: {
        type: String,
        required: true,
        trim: true,
        maxlength: 50
    },
    lastName: {
        type: String,
        required: true,
        trim: true,
        maxlength: 50
    },
    email: {
        type: String,
        required: true,
        trim: true,
        lowercase: true,
        match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Email invalide']
    },
    phone: {
        type: String,
        trim: true,
        match: [/^[\+]?[0-9\s\-\(\)]{8,15}$/, 'Numéro de téléphone invalide']
    },
    subject: {
        type: String,
        required: true,
        trim: true,
        maxlength: 200
    },
    message: {
        type: String,
        required: true,
        trim: true,
        maxlength: 2000
    },
    status: {
        type: String,
        enum: ['pending', 'in_progress', 'resolved', 'closed'],
        default: 'pending'
    },
    priority: {
        type: String,
        enum: ['low', 'medium', 'high', 'urgent'],
        default: 'medium'
    },
    assignedTo: {
        type: String,
        trim: true
    },
    tags: [{
        type: String,
        trim: true
    }],
    attachments: [{
        type: String,
        trim: true
    }],
    ipAddress: {
        type: String,
        trim: true
    },
    userAgent: {
        type: String,
        trim: true
    },
    resolvedAt: {
        type: Date
    },
    notes: [{
        type: String,
        trim: true
    }]
}, {
    timestamps: true,
    collection: 'contacts'
});

// Index pour les recherches
ContactSchema.index({ email: 1 });
ContactSchema.index({ status: 1 });
ContactSchema.index({ priority: 1 });
ContactSchema.index({ createdAt: -1 });
ContactSchema.index({ subject: 'text', message: 'text' });

export const Contact = mongoose.model<IContact>('Contact', ContactSchema);

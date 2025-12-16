import mongoose, { Schema, Document } from 'mongoose';

export interface IContactMessage extends Document {
  name: string;
  email: string;
  subject: string;
  message: string;
  userId?: string;
  status: 'new' | 'read' | 'replied' | 'closed';
  priority: 'low' | 'normal' | 'high' | 'urgent';
  assignedTo?: string;
  reply?: {
    content: string;
    sentBy: string;
    sentAt: Date;
  };
  tags: string[];
  ipAddress?: string;
  userAgent?: string;
  createdAt: Date;
  updatedAt: Date;
}

const ContactMessageSchema = new Schema<IContactMessage>({
  name: { type: String, required: true },
  email: { type: String, required: true, index: true },
  subject: { type: String, required: true },
  message: { type: String, required: true },
  userId: { type: String, index: true },
  status: { 
    type: String, 
    enum: ['new', 'read', 'replied', 'closed'], 
    default: 'new',
    index: true
  },
  priority: { 
    type: String, 
    enum: ['low', 'normal', 'high', 'urgent'], 
    default: 'normal',
    index: true
  },
  assignedTo: { type: String, index: true },
  reply: {
    content: { type: String },
    sentBy: { type: String },
    sentAt: { type: Date }
  },
  tags: [{ type: String }],
  ipAddress: { type: String },
  userAgent: { type: String }
}, {
  timestamps: true,
  collection: 'contact_messages'
});

// Index pour filtrer par statut et date
ContactMessageSchema.index({ status: 1, createdAt: -1 });

// Index pour rechercher par email ou userId
ContactMessageSchema.index({ email: 1, userId: 1 });

export const ContactMessage = mongoose.model<IContactMessage>('ContactMessage', ContactMessageSchema);

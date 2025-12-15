import { Schema, model, Document } from 'mongoose';

export interface IContact extends Document {
  name: string;
  email: string;
  subject?: string;
  message: string;
  userId?: string;
  createdAt: Date;
  updatedAt: Date;
}

const contactSchema = new Schema<IContact>({
  name: {
    type: String,
    required: true,
    trim: true,
    maxlength: 100
  },
  email: {
    type: String,
    required: true,
    trim: true,
    lowercase: true,
    maxlength: 255
  },
  subject: {
    type: String,
    trim: true,
    maxlength: 200
  },
  message: {
    type: String,
    required: true,
    trim: true,
    maxlength: 2000
  },
  userId: {
    type: String,
    required: false
  }
}, {
  timestamps: true
});

// Index pour améliorer les performances
contactSchema.index({ createdAt: -1 });
contactSchema.index({ email: 1 });

export const Contact = model<IContact>('Contact', contactSchema);

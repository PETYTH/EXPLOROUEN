import mongoose, { Schema, Document } from 'mongoose';

export interface IAppRating extends Document {
  userId: string;
  userName?: string;
  userEmail?: string;
  rating: number;
  comment?: string;
  version: string;
  platform: 'ios' | 'android' | 'web';
  deviceInfo?: {
    os: string;
    osVersion: string;
    deviceModel?: string;
  };
  appVersion?: string;
  helpful: number;
  flagged: boolean;
  status: 'active' | 'archived' | 'hidden';
  createdAt: Date;
  updatedAt: Date;
}

const AppRatingSchema = new Schema<IAppRating>({
  userId: { type: String, required: true, index: true },
  userName: { type: String },
  userEmail: { type: String },
  rating: { 
    type: Number, 
    required: true, 
    min: 1, 
    max: 5,
    index: true 
  },
  comment: { type: String },
  version: { type: String, default: '1.0.0' },
  platform: { 
    type: String, 
    enum: ['ios', 'android', 'web'], 
    required: true,
    index: true
  },
  deviceInfo: {
    os: { type: String },
    osVersion: { type: String },
    deviceModel: { type: String }
  },
  appVersion: { type: String },
  helpful: { type: Number, default: 0 },
  flagged: { type: Boolean, default: false },
  status: { 
    type: String, 
    enum: ['active', 'archived', 'hidden'], 
    default: 'active',
    index: true
  }
}, {
  timestamps: true,
  collection: 'app_ratings'
});

// Index unique pour un utilisateur ne peut noter qu'une fois
AppRatingSchema.index({ userId: 1 }, { unique: true });

// Index pour les statistiques
AppRatingSchema.index({ rating: 1, status: 1, createdAt: -1 });
AppRatingSchema.index({ platform: 1, rating: 1 });

export const AppRating = mongoose.model<IAppRating>('AppRating', AppRatingSchema);

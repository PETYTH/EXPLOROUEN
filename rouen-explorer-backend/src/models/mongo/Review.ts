import mongoose, { Schema, Document } from 'mongoose';

export interface IReview extends Document {
  placeId: string;
  placeName: string;
  userId: string;
  userName: string;
  userEmail?: string;
  rating: number;
  comment: string;
  images?: string[];
  helpful: number;
  verified: boolean;
  status: 'pending' | 'approved' | 'rejected';
  moderationNote?: string;
  createdAt: Date;
  updatedAt: Date;
}

const ReviewSchema = new Schema<IReview>({
  placeId: { type: String, required: true, index: true },
  placeName: { type: String, required: true },
  userId: { type: String, required: true, index: true },
  userName: { type: String, required: true },
  userEmail: { type: String },
  rating: { 
    type: Number, 
    required: true, 
    min: 1, 
    max: 5,
    index: true 
  },
  comment: { type: String, required: true },
  images: [{ type: String }],
  helpful: { type: Number, default: 0 },
  verified: { type: Boolean, default: false },
  status: { 
    type: String, 
    enum: ['pending', 'approved', 'rejected'], 
    default: 'approved',
    index: true
  },
  moderationNote: { type: String }
}, {
  timestamps: true,
  collection: 'reviews'
});

// Index composé pour rechercher les avis approuvés d'un lieu
ReviewSchema.index({ placeId: 1, status: 1, createdAt: -1 });

// Index pour les avis d'un utilisateur
ReviewSchema.index({ userId: 1, createdAt: -1 });

// Index pour les statistiques de rating
ReviewSchema.index({ placeId: 1, rating: 1 });

export const Review = mongoose.model<IReview>('Review', ReviewSchema);

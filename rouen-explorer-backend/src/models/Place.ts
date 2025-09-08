import mongoose, { Document, Schema } from 'mongoose';

export interface IPlace extends Document {
  name: string;
  description: string;
  category: string;
  location: {
    type: 'Point';
    coordinates: [number, number]; // [longitude, latitude]
  };
  address: string;
  images: string[];
  rating: number;
  reviews: Array<{
    userId: string;
    rating: number;
    comment: string;
    date: Date;
  }>;
  openingHours: {
    [key: string]: {
      open: string;
      close: string;
    };
  };
  contact: {
    phone?: string;
    email?: string;
    website?: string;
  };
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const PlaceSchema: Schema = new Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    required: true
  },
  category: {
    type: String,
    required: true,
    enum: ['restaurant', 'monument', 'museum', 'park', 'shopping', 'entertainment', 'hotel', 'other']
  },
  location: {
    type: {
      type: String,
      enum: ['Point'],
      required: true
    },
    coordinates: {
      type: [Number],
      required: true
    }
  },
  address: {
    type: String,
    required: true
  },
  images: [{
    type: String
  }],
  rating: {
    type: Number,
    default: 0,
    min: 0,
    max: 5
  },
  reviews: [{
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    rating: {
      type: Number,
      required: true,
      min: 1,
      max: 5
    },
    comment: {
      type: String,
      required: true
    },
    date: {
      type: Date,
      default: Date.now
    }
  }],
  openingHours: {
    monday: {
      open: String,
      close: String
    },
    tuesday: {
      open: String,
      close: String
    },
    wednesday: {
      open: String,
      close: String
    },
    thursday: {
      open: String,
      close: String
    },
    friday: {
      open: String,
      close: String
    },
    saturday: {
      open: String,
      close: String
    },
    sunday: {
      open: String,
      close: String
    }
  },
  contact: {
    phone: String,
    email: String,
    website: String
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Index pour la recherche géospatiale
PlaceSchema.index({ location: '2dsphere' });

// Index pour la recherche textuelle
PlaceSchema.index({ name: 'text', description: 'text', category: 'text' });

export const Place = mongoose.model<IPlace>('Place', PlaceSchema);

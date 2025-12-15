// src/models/mongodb/UserSession.ts
import mongoose, { Document, Schema } from 'mongoose';

export interface IUserSession extends Document {
    userId: string;
    sessionId: string;
    refreshToken: string;
    deviceInfo: {
        userAgent: string;
        ip: string;
        browser?: string;
        os?: string;
        device?: string;
    };
    location?: {
        country?: string;
        city?: string;
        coordinates?: [number, number];
    };
    isActive: boolean;
    lastActivity: Date;
    createdAt: Date;
    expiresAt: Date;
}

const UserSessionSchema = new Schema<IUserSession>({
    userId: {
        type: String,
        required: true,
        index: true
    },
    sessionId: {
        type: String,
        required: true,
        unique: true,
        index: true
    },
    refreshToken: {
        type: String,
        required: true,
        unique: true
    },
    deviceInfo: {
        userAgent: {
            type: String,
            required: true
        },
        ip: {
            type: String,
            required: true
        },
        browser: String,
        os: String,
        device: String
    },
    location: {
        country: String,
        city: String,
        coordinates: {
            type: [Number],
            index: '2dsphere'
        }
    },
    isActive: {
        type: Boolean,
        default: true,
        index: true
    },
    lastActivity: {
        type: Date,
        default: Date.now,
        index: true
    },
    expiresAt: {
        type: Date,
        required: true,
        index: true
    }
}, {
    timestamps: true,
    collection: 'user_sessions'
});

// Index pour nettoyer automatiquement les sessions expirées
UserSessionSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

// Index composé pour les requêtes fréquentes
UserSessionSchema.index({ userId: 1, isActive: 1 });

export const UserSession = mongoose.model<IUserSession>('UserSession', UserSessionSchema);

// src/models/mongodb/ChatMessage.ts
import mongoose, { Document, Schema } from 'mongoose';

export interface IChatMessage extends Document {
    roomId: string; // ID de l'activité ou chasse aux trésors
    roomType: 'activity' | 'treasure_hunt';
    userId: string;
    userName: string;
    userAvatar?: string;
    message: string;
    messageType: 'text' | 'image' | 'system' | 'join' | 'leave';
    attachments: string[];
    isEphemeral: boolean;
    expiresAt?: Date;
    editedAt?: Date;
    deletedAt?: Date;
    reactions: {
        emoji: string;
        users: string[];
        count: number;
    }[];
    replyTo?: string; // ID du message auquel on répond
    createdAt: Date;
    updatedAt: Date;
}

const ChatMessageSchema = new Schema<IChatMessage>({
    roomId: {
        type: String,
        required: true,
        index: true
    },
    roomType: {
        type: String,
        enum: ['activity', 'treasure_hunt'],
        required: true
    },
    userId: {
        type: String,
        required: true,
        index: true
    },
    userName: {
        type: String,
        required: true,
        trim: true
    },
    userAvatar: {
        type: String,
        trim: true
    },
    message: {
        type: String,
        required: true,
        trim: true,
        maxlength: 1000
    },
    messageType: {
        type: String,
        enum: ['text', 'image', 'system', 'join', 'leave'],
        default: 'text'
    },
    attachments: [{
        type: String,
        trim: true
    }],
    isEphemeral: {
        type: Boolean,
        default: true
    },
    expiresAt: {
        type: Date,
        default: () => new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 jours
    },
    editedAt: {
        type: Date
    },
    deletedAt: {
        type: Date
    },
    reactions: [{
        emoji: {
            type: String,
            required: true
        },
        users: [{
            type: String
        }],
        count: {
            type: Number,
            default: 0
        }
    }],
    replyTo: {
        type: String,
        ref: 'ChatMessage'
    }
}, {
    timestamps: true,
    collection: 'chat_messages'
});

// Index pour les recherches et la performance
ChatMessageSchema.index({ roomId: 1, createdAt: -1 });
// Pas d'expiration automatique par défaut - sera gérée par l'activité/chasse aux trésors
// ChatMessageSchema.index({ createdAt: 1 }, { expireAfterSeconds: 7 * 24 * 60 * 60 });
ChatMessageSchema.index({ deletedAt: 1 });

// Middleware pour supprimer automatiquement les messages expirés
ChatMessageSchema.pre('find', function() {
    this.where({ deletedAt: { $exists: false } });
});

ChatMessageSchema.pre('findOne', function() {
    this.where({ deletedAt: { $exists: false } });
});

export const ChatMessage = mongoose.model<IChatMessage>('ChatMessage', ChatMessageSchema);

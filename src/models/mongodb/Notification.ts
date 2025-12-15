// src/models/mongodb/Notification.ts
import mongoose, { Document, Schema } from 'mongoose';

export interface INotification extends Document {
    userId: string;
    type: 'activity_registration' | 'treasure_hunt_registration' | 'activity_reminder' | 'treasure_hunt_reminder' | 'activity_cancelled' | 'treasure_hunt_cancelled' | 'new_message' | 'system';
    title: string;
    message: string;
    data: {
        activityId?: string;
        treasureHuntId?: string;
        chatRoomId?: string;
        actionUrl?: string;
        [key: string]: any;
    };
    isRead: boolean;
    priority: 'low' | 'medium' | 'high' | 'urgent';
    scheduledFor?: Date;
    sentAt?: Date;
    channels: ('push' | 'email' | 'sms' | 'in_app')[];
    metadata: {
        source: string;
        campaign?: string;
        tags: string[];
    };
    createdAt: Date;
    updatedAt: Date;
    expiresAt?: Date;
}

const NotificationSchema = new Schema<INotification>({
    userId: {
        type: String,
        required: true,
        index: true
    },
    type: {
        type: String,
        enum: [
            'activity_registration',
            'treasure_hunt_registration', 
            'activity_reminder',
            'treasure_hunt_reminder',
            'activity_cancelled',
            'treasure_hunt_cancelled',
            'new_message',
            'system'
        ],
        required: true
    },
    title: {
        type: String,
        required: true,
        trim: true,
        maxlength: 100
    },
    message: {
        type: String,
        required: true,
        trim: true,
        maxlength: 500
    },
    data: {
        activityId: String,
        treasureHuntId: String,
        chatRoomId: String,
        actionUrl: String
    },
    isRead: {
        type: Boolean,
        default: false,
        index: true
    },
    priority: {
        type: String,
        enum: ['low', 'medium', 'high', 'urgent'],
        default: 'medium'
    },
    scheduledFor: {
        type: Date,
        index: true
    },
    sentAt: {
        type: Date
    },
    channels: [{
        type: String,
        enum: ['push', 'email', 'sms', 'in_app']
    }],
    metadata: {
        source: {
            type: String,
            required: true,
            default: 'system'
        },
        campaign: String,
        tags: [String]
    },
    expiresAt: {
        type: Date,
        default: () => new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 jours
    }
}, {
    timestamps: true,
    collection: 'notifications'
});

// Index pour les performances
NotificationSchema.index({ userId: 1, createdAt: -1 });
NotificationSchema.index({ userId: 1, isRead: 1 });
NotificationSchema.index({ scheduledFor: 1 });
NotificationSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });
NotificationSchema.index({ type: 1 });
NotificationSchema.index({ priority: 1 });

export const Notification = mongoose.model<INotification>('Notification', NotificationSchema);

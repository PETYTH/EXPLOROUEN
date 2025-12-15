import mongoose, { Schema, Document } from 'mongoose';

export interface IChatMessage extends Document {
  roomId: string;
  senderId: string;
  senderName: string;
  senderAvatar?: string;
  text: string;
  type: 'text' | 'image' | 'system';
  timestamp: Date;
  expiresAt: Date;
  isDeleted: boolean;
}

export interface IChatRoom extends Document {
  activityId: string;
  activityName: string;
  activityImage?: string;
  participants: Array<{
    userId: string;
    userName: string;
    userAvatar?: string;
    joinedAt: Date;
    isActive: boolean;
  }>;
  isActive: boolean;
  createdAt: Date;
  expiresAt: Date;
  lastMessageAt?: Date;
}

const ChatMessageSchema = new Schema<IChatMessage>({
  roomId: { type: String, required: true, index: true },
  senderId: { type: String, required: true },
  senderName: { type: String, required: true },
  senderAvatar: { type: String },
  text: { type: String, required: true },
  type: { type: String, enum: ['text', 'image', 'system'], default: 'text' },
  timestamp: { type: Date, default: Date.now, index: true },
  expiresAt: { type: Date, required: true, index: true },
  isDeleted: { type: Boolean, default: false }
}, {
  timestamps: true
});

const ChatRoomSchema = new Schema<IChatRoom>({
  activityId: { type: String, required: true, unique: true, index: true },
  activityName: { type: String, required: true },
  activityImage: { type: String },
  participants: [{
    userId: { type: String, required: true },
    userName: { type: String, required: true },
    userAvatar: { type: String },
    joinedAt: { type: Date, default: Date.now },
    isActive: { type: Boolean, default: true }
  }],
  isActive: { type: Boolean, default: true },
  createdAt: { type: Date, default: Date.now },
  expiresAt: { type: Date, required: true, index: true },
  lastMessageAt: { type: Date }
}, {
  timestamps: true
});

// Index pour nettoyer automatiquement les messages expirés
ChatMessageSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });
ChatRoomSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export const ChatMessage = mongoose.model<IChatMessage>('ChatMessage', ChatMessageSchema);
export const ChatRoom = mongoose.model<IChatRoom>('ChatRoom', ChatRoomSchema);

import mongoose, { Schema, Document } from 'mongoose';

export interface IMessage {
  id: string;
  senderId: string;
  senderName: string;
  content: string;
  timestamp: Date;
  read: boolean;
  type?: 'text' | 'image' | 'audio';
  mediaUrl?: string;
}

export interface IConversation extends Document {
  activityId: string;
  activityTitle: string;
  participants: {
    userId: string;
    userName: string;
    joinedAt: Date;
  }[];
  messages: IMessage[];
  lastMessageAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

const MessageSchema = new Schema<IMessage>({
  id: { type: String, required: true },
  senderId: { type: String, required: true, index: true },
  senderName: { type: String, required: true },
  content: { type: String, required: true },
  timestamp: { type: Date, default: Date.now, index: true },
  read: { type: Boolean, default: false },
  type: { type: String, enum: ['text', 'image', 'audio'], default: 'text' },
  mediaUrl: { type: String }
}, { _id: false });

const ConversationSchema = new Schema<IConversation>({
  activityId: { type: String, required: true, unique: true, index: true },
  activityTitle: { type: String, required: true },
  participants: [{
    userId: { type: String, required: true, index: true },
    userName: { type: String, required: true },
    joinedAt: { type: Date, default: Date.now }
  }],
  messages: [MessageSchema],
  lastMessageAt: { type: Date, default: Date.now, index: true }
}, {
  timestamps: true,
  collection: 'conversations'
});

// Index composé pour rechercher les conversations d'un utilisateur
ConversationSchema.index({ 'participants.userId': 1, lastMessageAt: -1 });

// Index pour les messages récents
ConversationSchema.index({ activityId: 1, 'messages.timestamp': -1 });

export const Conversation = mongoose.model<IConversation>('Conversation', ConversationSchema);

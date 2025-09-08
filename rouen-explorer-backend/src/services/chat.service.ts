// src/services/chat.service.ts
import { ChatMessage, IChatMessage } from '../models/mongodb/ChatMessage';
import { prisma } from '../utils/database';
import { NotificationService } from './notification.service';

export class ChatService {
    static async createMessage(messageData: {
        roomId: string;
        roomType: 'activity' | 'treasure_hunt';
        userId: string;
        message: string;
        messageType?: 'text' | 'image' | 'system';
        attachments?: string[];
        replyTo?: string;
        userName?: string;
        userAvatar?: string;
    }): Promise<IChatMessage> {
        // Les infos utilisateur sont maintenant gérées par Clerk côté frontend
        // et passées dans les paramètres
        const chatMessage = new ChatMessage({
            ...messageData,
            userName: messageData.userName || 'Utilisateur',
            userAvatar: messageData.userAvatar || null,
            messageType: messageData.messageType || 'text',
            attachments: messageData.attachments || [],
            isEphemeral: true,
            expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 jours
        });

        await chatMessage.save();

        // Notifier les autres participants
        await this.notifyRoomParticipants(messageData.roomId, messageData.roomType, messageData.userId, chatMessage);

        return chatMessage;
    }

    static async getRoomMessages(roomId: string, filters: {
        page?: number;
        limit?: number;
        since?: Date;
    } = {}): Promise<{
        messages: IChatMessage[];
        pagination: any;
    }> {
        const { page = 1, limit = 50, since } = filters;
        const query: any = { roomId };

        if (since) {
            query.createdAt = { $gte: since };
        }

        const skip = (page - 1) * limit;

        const [messages, total] = await Promise.all([
            ChatMessage.find(query)
                .populate('replyTo')
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit)
                .lean(),
            ChatMessage.countDocuments(query)
        ]);

        return {
            messages: messages.reverse(), // Ordre chronologique
            pagination: {
                page,
                limit,
                total,
                pages: Math.ceil(total / limit)
            }
        };
    }

    static async updateMessage(messageId: string, userId: string, newMessage: string): Promise<IChatMessage | null> {
        const message = await ChatMessage.findOne({
            _id: messageId,
            userId,
            deletedAt: { $exists: false }
        });

        if (!message) {
            throw new Error('Message non trouvé ou non autorisé');
        }

        // Vérifier que le message n'est pas trop ancien (15 minutes)
        const fifteenMinutesAgo = new Date(Date.now() - 15 * 60 * 1000);
        if (message.createdAt < fifteenMinutesAgo) {
            throw new Error('Message trop ancien pour être modifié');
        }

        message.message = newMessage;
        message.editedAt = new Date();
        await message.save();

        return message;
    }

    static async deleteMessage(messageId: string, userId: string): Promise<boolean> {
        const message = await ChatMessage.findOne({
            _id: messageId,
            userId,
            deletedAt: { $exists: false }
        });

        if (!message) {
            return false;
        }

        message.deletedAt = new Date();
        await message.save();

        return true;
    }

    static async addReaction(messageId: string, userId: string, emoji: string): Promise<IChatMessage | null> {
        const message = await ChatMessage.findById(messageId);
        if (!message) return null;

        const existingReaction = message.reactions.find(r => r.emoji === emoji);
        
        if (existingReaction) {
            if (!existingReaction.users.includes(userId)) {
                existingReaction.users.push(userId);
                existingReaction.count++;
            }
        } else {
            message.reactions.push({
                emoji,
                users: [userId],
                count: 1
            });
        }

        await message.save();
        return message;
    }

    static async removeReaction(messageId: string, userId: string, emoji: string): Promise<IChatMessage | null> {
        const message = await ChatMessage.findById(messageId);
        if (!message) return null;

        const reactionIndex = message.reactions.findIndex(r => r.emoji === emoji);
        if (reactionIndex === -1) return message;

        const reaction = message.reactions[reactionIndex];
        const userIndex = reaction.users.indexOf(userId);
        
        if (userIndex !== -1) {
            reaction.users.splice(userIndex, 1);
            reaction.count--;
            
            if (reaction.count === 0) {
                message.reactions.splice(reactionIndex, 1);
            }
        }

        await message.save();
        return message;
    }

    static async getRoomParticipants(roomId: string, roomType: 'activity' | 'treasure_hunt'): Promise<string[]> {
        if (roomType === 'activity') {
            const registrations = await prisma.registration.findMany({
                where: {
                    itemId: roomId,
                    type: 'ACTIVITY',
                    status: 'ACCEPTED'
                },
                select: { userId: true }
            });
            return registrations.map((r: any) => r.userId);
        } else {
            const registrations = await prisma.registration.findMany({
                where: {
                    itemId: roomId,
                    type: 'TREASURE_HUNT',
                    status: 'ACCEPTED'
                },
                select: { userId: true }
            });
            return registrations.map((r: any) => r.userId);
        }
    }

    static async joinRoom(roomId: string, roomType: 'activity' | 'treasure_hunt', userId: string, userName?: string): Promise<IChatMessage> {
        return this.createMessage({
            roomId,
            roomType,
            userId,
            message: `${userName || 'Un utilisateur'} a rejoint la conversation`,
            messageType: 'system',
            userName: userName || 'Système'
        });
    }

    static async leaveRoom(roomId: string, roomType: 'activity' | 'treasure_hunt', userId: string, userName?: string): Promise<IChatMessage> {
        return this.createMessage({
            roomId,
            roomType,
            userId,
            message: `${userName || 'Un utilisateur'} a quitté la conversation`,
            messageType: 'system',
            userName: userName || 'Système'
        });
    }

    private static async notifyRoomParticipants(
        roomId: string, 
        roomType: 'activity' | 'treasure_hunt', 
        senderId: string, 
        message: IChatMessage
    ): Promise<void> {
        const participants = await this.getRoomParticipants(roomId, roomType);
        
        // Notifier tous les participants sauf l'expéditeur
        const otherParticipants = participants.filter(p => p !== senderId);
        
        for (const participantId of otherParticipants) {
            await NotificationService.notifyUser(participantId, {
                type: 'new_message',
                title: 'Nouveau message',
                message: `${message.userName}: ${message.message.substring(0, 50)}${message.message.length > 50 ? '...' : ''}`,
                data: {
                    chatRoomId: roomId,
                    messageId: (message._id as any).toString(),
                    actionUrl: roomType === 'activity' ? `/activities/${roomId}/chat` : `/treasure-hunts/${roomId}/chat`
                },
                priority: 'low',
                channels: ['in_app']
            });
        }
    }

    static async deleteUserMessagesFromRoom(roomId: string, userId: string): Promise<number> {
        const result = await ChatMessage.updateMany(
            {
                roomId,
                userId,
                deletedAt: { $exists: false }
            },
            {
                $set: { deletedAt: new Date() }
            }
        );
        return result.modifiedCount;
    }

    static async cleanExpiredMessages(): Promise<number> {
        const result = await ChatMessage.deleteMany({
            expiresAt: { $lt: new Date() }
        });
        return result.deletedCount;
    }
}

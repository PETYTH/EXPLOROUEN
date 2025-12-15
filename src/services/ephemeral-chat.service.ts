// src/services/ephemeral-chat.service.ts
import { ChatMessage } from '../models/mongodb/ChatMessage';
import { NotificationService } from './notification.service';
import { prisma } from '../utils/database';

export class EphemeralChatService {
    // Créer un message éphémère lié à une activité ou chasse aux trésors
    static async createMessage(data: {
        roomId: string;
        userId: string;
        content: string;
        type?: 'text' | 'image' | 'system';
        metadata?: any;
    }) {
        try {
            const message = new ChatMessage({
                roomId: data.roomId,
                userId: data.userId,
                content: data.content,
                type: data.type || 'text',
                metadata: {
                    ...data.metadata,
                    isEphemeral: true,
                    createdOffline: false
                }
            });

            await message.save();
            
            // Notifier les participants en ligne
            await this.notifyParticipants(data.roomId, data.userId, 'new_message');
            
            return message;
        } catch (error) {
            console.error('Erreur création message éphémère:', error);
            throw new Error('Impossible de créer le message');
        }
    }

    // Créer un message hors ligne (sera synchronisé plus tard)
    static async createOfflineMessage(data: {
        roomId: string;
        userId: string;
        content: string;
        type?: 'text' | 'image' | 'system';
        tempId: string; // ID temporaire pour la synchronisation
    }) {
        try {
            const message = new ChatMessage({
                roomId: data.roomId,
                userId: data.userId,
                content: data.content,
                type: data.type || 'text',
                metadata: {
                    isEphemeral: true,
                    createdOffline: true,
                    tempId: data.tempId,
                    needsSync: true
                }
            });

            await message.save();
            return message;
        } catch (error) {
            console.error('Erreur création message hors ligne:', error);
            throw new Error('Impossible de créer le message hors ligne');
        }
    }

    // Synchroniser les messages hors ligne
    static async syncOfflineMessages(userId: string) {
        try {
            const offlineMessages = await ChatMessage.find({
                userId,
                'metadata.needsSync': true,
                deletedAt: { $exists: false }
            }).sort({ createdAt: 1 });

            const syncedMessages = [];
            
            for (const message of offlineMessages) {
                // Marquer comme synchronisé
                const messageDoc = message as any;
                if (messageDoc.metadata) {
                    messageDoc.metadata.needsSync = false;
                    messageDoc.metadata.syncedAt = new Date();
                }
                await message.save();
                
                // Notifier les participants
                await this.notifyParticipants(message.roomId, userId, 'message_synced');
                syncedMessages.push(message);
            }

            return syncedMessages;
        } catch (error) {
            console.error('Erreur synchronisation messages:', error);
            throw new Error('Impossible de synchroniser les messages');
        }
    }

    // Supprimer automatiquement les messages à la fin d'une activité
    static async cleanupActivityMessages(activityId: string) {
        try {
            const activity = await prisma.activity.findUnique({
                where: { id: activityId },
                select: { endDate: true, startDate: true }
            });

            if (!activity) {
                throw new Error('Activité non trouvée');
            }

            const now = new Date();
            const isActivityEnded = activity.endDate ? activity.endDate < now : false;

            if (isActivityEnded) {
                // Marquer les messages comme supprimés (soft delete)
                await ChatMessage.updateMany(
                    { 
                        roomId: `activity_${activityId}`,
                        deletedAt: { $exists: false }
                    },
                    { 
                        $set: { 
                            deletedAt: now,
                            'metadata.deletionReason': 'activity_ended'
                        }
                    }
                );

                // Messages de l'activité supprimés automatiquement
                return true;
            }

            return false;
        } catch (error) {
            console.error('Erreur nettoyage messages activité:', error);
            throw new Error('Impossible de nettoyer les messages');
        }
    }

    // Supprimer automatiquement les messages à la fin d'une chasse aux trésors
    static async cleanupTreasureHuntMessages(treasureHuntId: string) {
        try {
            const treasureHunt = await prisma.treasureHunt.findUnique({
                where: { id: treasureHuntId },
                select: { endDate: true, startDate: true }
            });

            if (!treasureHunt) {
                throw new Error('Chasse aux trésors non trouvée');
            }

            const now = new Date();
            const isHuntEnded = treasureHunt.endDate ? treasureHunt.endDate < now : false;

            if (isHuntEnded) {
                // Marquer les messages comme supprimés (soft delete)
                await ChatMessage.updateMany(
                    { 
                        roomId: `treasure_hunt_${treasureHuntId}`,
                        deletedAt: { $exists: false }
                    },
                    { 
                        $set: { 
                            deletedAt: now,
                            'metadata.deletionReason': 'treasure_hunt_ended'
                        }
                    }
                );

                // Messages de la chasse aux trésors supprimés automatiquement
                return true;
            }

            return false;
        } catch (error) {
            console.error('Erreur nettoyage messages chasse aux trésors:', error);
            throw new Error('Impossible de nettoyer les messages');
        }
    }

    // Récupérer les messages d'une room avec support hors ligne
    static async getRoomMessages(roomId: string, userId?: string, options: {
        limit?: number;
        offset?: number;
        includeOffline?: boolean;
    } = {}) {
        try {
            const { limit = 50, offset = 0, includeOffline = false } = options;
            
            let query: any = {
                roomId,
                deletedAt: { $exists: false }
            };

            // Si on veut inclure les messages hors ligne de l'utilisateur
            if (includeOffline && userId) {
                query.$or = [
                    { 'metadata.createdOffline': { $ne: true } },
                    { 
                        'metadata.createdOffline': true,
                        userId: userId
                    }
                ];
            } else {
                query['metadata.createdOffline'] = { $ne: true };
            }

            const messages = await ChatMessage.find(query)
                .sort({ createdAt: -1 })
                .limit(limit)
                .skip(offset)
                .lean();

            return messages.reverse(); // Ordre chronologique
        } catch (error) {
            console.error('Erreur récupération messages room:', error);
            throw new Error('Impossible de récupérer les messages');
        }
    }

    // Tâche de nettoyage automatique (à exécuter périodiquement)
    static async runCleanupTask() {
        try {
            // Démarrage du nettoyage automatique des messages éphémères

            // Récupérer toutes les activités terminées
            const endedActivities = await prisma.activity.findMany({
                where: {
                    endDate: {
                        lt: new Date()
                    },
                    isActive: true
                },
                select: { id: true }
            });

            // Récupérer toutes les chasses aux trésors terminées
            const endedTreasureHunts = await prisma.treasureHunt.findMany({
                where: {
                    endDate: {
                        lt: new Date()
                    },
                    isActive: true
                },
                select: { id: true }
            });

            let cleanedActivities = 0;
            let cleanedTreasureHunts = 0;

            // Nettoyer les messages des activités terminées
            for (const activity of endedActivities) {
                const cleaned = await this.cleanupActivityMessages(activity.id);
                if (cleaned) cleanedActivities++;
            }

            // Nettoyer les messages des chasses aux trésors terminées
            for (const treasureHunt of endedTreasureHunts) {
                const cleaned = await this.cleanupTreasureHuntMessages(treasureHunt.id);
                if (cleaned) cleanedTreasureHunts++;
            }

            // Nettoyage terminé
            
            return {
                cleanedActivities,
                cleanedTreasureHunts
            };
        } catch (error) {
            console.error('Erreur lors du nettoyage automatique:', error);
            throw error;
        }
    }

    // Notifier les participants d'une room
    private static async notifyParticipants(roomId: string, senderId: string, eventType: string) {
        try {
            // Récupérer les participants actifs de la room
            const recentMessages = await ChatMessage.find({
                roomId,
                deletedAt: { $exists: false },
                createdAt: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) } // 24h
            }).distinct('userId');

            const participants = recentMessages.filter(userId => userId !== senderId);

            // Envoyer des notifications
            for (const participantId of participants) {
                await NotificationService.createNotification({
                    userId: participantId,
                    type: 'new_message',
                    title: 'Nouveau message',
                    message: 'Un nouveau message dans votre conversation',
                    data: {
                        roomId,
                        eventType,
                        senderId
                    },
                    channels: ['in_app']
                });
            }
        } catch (error) {
            console.error('Erreur notification participants:', error);
            // Ne pas faire échouer l'opération principale
        }
    }
}

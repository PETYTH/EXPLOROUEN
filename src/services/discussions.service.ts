// src/services/discussions.service.ts
import { PrismaClient } from '@prisma/client';
import { clerkClient } from '@clerk/clerk-sdk-node';

const prisma = new PrismaClient();

interface CreateMessageForActivityData {
    activityId: string;
    userId: string;
    content: string;
    messageType: string;
    mediaUrl?: string;
}

interface CreateMessageData {
    discussionId: string;
    userId: string;
    content: string;
    messageType: string;
}

// Cache simple pour les utilisateurs Clerk pour éviter trop d'appels API
const userCache = new Map<string, any>();

async function getUserDetails(userId: string) {
    if (userCache.has(userId)) {
        return userCache.get(userId);
    }

    try {
        const user = await clerkClient.users.getUser(userId);
        const userDetails = {
            id: user.id,
            firstName: user.firstName || '',
            lastName: user.lastName || '',
            imageUrl: user.imageUrl || '',
            fullName: `${user.firstName || ''} ${user.lastName || ''}`.trim() || 'Utilisateur'
        };
        
        // Mettre en cache pour 5 minutes
        userCache.set(userId, userDetails);
        setTimeout(() => userCache.delete(userId), 5 * 60 * 1000);
        
        return userDetails;
    } catch (error) {
        console.error(`Erreur récupération utilisateur ${userId}:`, error);
        return {
            id: userId,
            firstName: 'Utilisateur',
            lastName: '',
            imageUrl: '',
            fullName: 'Utilisateur'
        };
    }
}

export class DiscussionsService {
    static async getDiscussionMessagesByActivity(activityId: string, limit: number = 50, offset: number = 0) {
        // Nettoyer l'ID d'activité en supprimant les préfixes "activity-"
        const cleanActivityId = activityId.replace(/^activity-/, '');
        
        // Trouver la discussion pour cette activité
        const discussion = await prisma.discussion.findFirst({
            where: { activityId: cleanActivityId }
        });

        if (!discussion) {
            return [];
        }

        return this.getDiscussionMessages(discussion.id, limit, offset);
    }

    static async getDiscussionMessages(discussionId: string, limit: number = 50, offset: number = 0) {
        const messages = await prisma.discussionMessage.findMany({
            where: { discussionId },
            orderBy: {
                createdAt: 'desc'
            },
            take: limit,
            skip: offset
        });

        // Récupérer les détails des utilisateurs pour chaque message
        const messagesWithUsers = await Promise.all(messages.reverse().map(async (message: any) => {
            const user = await getUserDetails(message.userId);
            return {
                ...message,
                user
            };
        }));

        return messagesWithUsers;
    }

    static async createMessageForActivity(data: CreateMessageForActivityData) {
        // Nettoyer l'ID d'activité en supprimant les préfixes "activity-"
        const cleanActivityId = data.activityId.replace(/^activity-/, '');
        
        // Vérifier que l'utilisateur est inscrit à l'activité
        const registration = await prisma.registration.findFirst({
            where: {
                userId: data.userId,
                itemId: cleanActivityId,
                type: 'ACTIVITY'
            }
        });

        if (!registration) {
            throw new Error('Vous devez être inscrit à cette activité pour envoyer des messages');
        }

        // Trouver ou créer la discussion
        let discussion = await prisma.discussion.findFirst({
            where: { activityId: cleanActivityId }
        });

        if (!discussion) {
            discussion = await prisma.discussion.create({
                data: {
                    activityId: cleanActivityId,
                    title: `Discussion - Activité ${cleanActivityId}`
                }
            });
        }

        // Créer le message
        const messageData: any = {
            discussionId: discussion.id,
            userId: data.userId,
            content: data.content,
            messageType: data.messageType
        };

        if (data.mediaUrl) {
            messageData.mediaUrl = data.mediaUrl;
        }

        const message = await prisma.discussionMessage.create({
            data: messageData
        });

        // Récupérer les infos utilisateur
        const user = await getUserDetails(data.userId);

        // Retourner avec structure attendue par le frontend
        return {
            ...message,
            user
        };
    }

    static async createMessage(data: CreateMessageData) {
        // Vérifier que l'utilisateur a accès à cette discussion
        const discussion = await prisma.discussion.findUnique({
            where: { id: data.discussionId }
        });

        if (!discussion) {
            throw new Error('Discussion non trouvée');
        }

        // Vérifier l'inscription séparément
        const registration = discussion.activityId ? await prisma.registration.findFirst({
            where: {
                userId: data.userId,
                itemId: discussion.activityId,
                type: 'ACTIVITY'
            }
        }) : null;

        if (discussion.activityId && !registration) {
            throw new Error('Vous devez être inscrit à l\'activité pour participer à la discussion');
        }

        const message = await prisma.discussionMessage.create({
            data: {
                discussionId: data.discussionId,
                userId: data.userId,
                content: data.content,
                messageType: data.messageType
            },
            select: {
                id: true,
                discussionId: true,
                userId: true,
                content: true,
                messageType: true,
                createdAt: true,
                updatedAt: true
            }
        });

        return message;
    }

    static async getDiscussionParticipantsByActivity(activityId: string) {
        // Nettoyer l'ID d'activité en supprimant les préfixes "activity-"
        const cleanActivityId = activityId.replace(/^activity-/, '');
        
        // Récupérer tous les utilisateurs inscrits à cette activité
        const registrations = await prisma.registration.findMany({
            where: {
                itemId: cleanActivityId,
                type: 'ACTIVITY'
            }
        });

        // Retourner les participants avec structure basique
        return {
            participants: registrations.map((reg: any) => ({
                id: reg.userId,
                firstName: 'User',
                lastName: '',
                imageUrl: '',
                fullName: 'User',
                joinedAt: reg.createdAt
            }))
        };
    }

    static async getDiscussionParticipants(discussionId: string) {
        const discussion = await prisma.discussion.findUnique({
            where: { id: discussionId }
        });

        if (!discussion) {
            throw new Error('Discussion non trouvée');
        }

        // Récupérer les participants via les inscriptions
        const registrations = discussion.activityId 
            ? await prisma.registration.findMany({
                where: {
                    itemId: discussion.activityId,
                    type: 'ACTIVITY'
                }
            })
            : [];

        return registrations.map((reg: any) => ({
            id: reg.userId,
            firstName: 'User',
            lastName: '',
            imageUrl: '',
            fullName: 'User',
            joinedAt: reg.createdAt.toISOString()
        }));
    }

    // Créer ou récupérer un chat privé entre deux utilisateurs
    static async createOrGetPrivateChat(userId1: string, userId2: string) {
        // Créer un identifiant unique pour le chat privé (ordre alphabétique)
        const participants = [userId1, userId2].sort();
        const chatId = `private-${participants[0]}-${participants[1]}`;
        
        // Vérifier si le chat existe déjà
        let discussion = await prisma.discussion.findFirst({
            where: {
                title: chatId
            }
        });

        if (!discussion) {
            discussion = await prisma.discussion.create({
                data: {
                    title: chatId,
                    activityId: null
                } as any
            });
        }

        return discussion;
    }

    // Récupérer les messages d'un chat privé
    static async getPrivateChatMessages(chatId: string, userId: string) {
        const discussion = await prisma.discussion.findFirst({
            where: {
                title: chatId
            }
        });

        if (!discussion) {
            throw new Error('Chat privé non trouvé');
        }

        // Pour les chats privés, vérifier que l'utilisateur fait partie du chat via l'ID
        const participants = chatId.replace('private-', '').split('-');
        if (!participants.includes(userId)) {
            throw new Error('Accès non autorisé à ce chat privé');
        }

        return this.getDiscussionMessages(discussion.id);
    }

    // Envoyer un message dans un chat privé
    static async sendPrivateMessage(data: { chatId: string; userId: string; content: string; messageType?: string; mediaUrl?: string }) {
        const discussion = await prisma.discussion.findFirst({
            where: {
                title: data.chatId
            }
        });

        if (!discussion) {
            throw new Error('Chat privé non trouvé');
        }

        // Vérifier que l'utilisateur fait partie du chat via l'ID
        const participants = data.chatId.replace('private-', '').split('-');
        if (!participants.includes(data.userId)) {
            throw new Error('Accès non autorisé à ce chat privé');
        }

        // Créer le message
        const messageData: any = {
            discussionId: discussion.id,
            userId: data.userId,
            content: data.content,
            messageType: data.messageType || 'TEXT'
        };

        if (data.mediaUrl) {
            messageData.mediaUrl = data.mediaUrl;
        }

        const message = await prisma.discussionMessage.create({
            data: messageData
        });

        // Récupérer les infos utilisateur
        const user = await getUserDetails(data.userId);

        // Retourner avec structure attendue par le frontend
        return {
            ...message,
            user
        };
    }

    // Récupérer toutes les conversations de l'utilisateur (groupes + privés)
    static async getAllUserConversations(userId: string) {
        try {
            // Début getAllUserConversations
            
            // 1. Récupérer les activités auxquelles l'utilisateur est inscrit
            const registrations = await prisma.registration.findMany({
                where: {
                    userId: userId,
                    type: 'ACTIVITY'
                }
            });
            // Inscriptions trouvées

            const activityIds = registrations.map(reg => reg.itemId);
            // IDs d'activités récupérés

            // 2. Récupérer les activités avec leurs discussions
            const activities = activityIds.length > 0 ? await prisma.activity.findMany({
                where: {
                    id: { in: activityIds }
                }
            }) : [];
            // Activités trouvées

            // 3. Récupérer les discussions pour ces activités
            const discussions = activityIds.length > 0 ? await prisma.discussion.findMany({
                where: {
                    activityId: { in: activityIds }
                },
                include: {
                    messages: {
                        orderBy: {
                            createdAt: 'desc'
                        },
                        take: 1
                    }
                }
            }) : [];
            // Discussions de groupe trouvées

            // 4. Récupérer les conversations privées
            const privateDiscussions = await prisma.discussion.findMany({
                where: {
                    title: {
                        startsWith: 'private-',
                        contains: userId
                    },
                    activityId: null
                },
                include: {
                    messages: {
                        orderBy: {
                            createdAt: 'desc'
                        },
                        take: 1
                    }
                }
            });
            // Discussions privées trouvées

            // 5. Formater les conversations de groupe
            const groupChats = await Promise.all(activities.map(async activity => {
                const discussion = discussions.find(d => d.activityId === activity.id);
                const lastMessage = discussion?.messages?.[0];
                
                let lastMessageUser = null;
                if (lastMessage) {
                    lastMessageUser = await getUserDetails(lastMessage.userId);
                }

                return {
                    id: `activity-${activity.id}`,
                    activityId: activity.id,
                    activityName: activity.title,
                    activityImage: activity.image || 'https://images.pexels.com/photos/1640777/pexels-photo-1640777.jpeg',
                    participants: [{ id: userId, isOnline: false }],
                    lastMessage: lastMessage ? {
                        id: lastMessage.id,
                        content: lastMessage.content,
                        messageType: lastMessage.messageType,
                        createdAt: lastMessage.createdAt,
                        userId: lastMessage.userId,
                        isMe: lastMessage.userId === userId,
                        user: lastMessageUser
                    } : null
                };
            }));

            // 6. Formater les conversations privées
            const privateChats = await Promise.all(privateDiscussions.map(async discussion => {
                const lastMessage = (discussion as any).messages?.[0];
                const participants = discussion.title.replace('private-', '').split('-');
                const otherUserId = participants.find(id => id !== userId) || 'unknown';
                
                // Récupérer les infos de l'autre utilisateur
                const otherUser = await getUserDetails(otherUserId);
                
                let lastMessageUser = null;
                if (lastMessage) {
                    lastMessageUser = await getUserDetails(lastMessage.userId);
                }

                return {
                    id: discussion.title,
                    activityName: otherUser.fullName,
                    organizerName: otherUser.fullName,
                    organizerAvatar: otherUser.imageUrl,
                    activityImage: otherUser.imageUrl || 'https://ui-avatars.com/api/?name=' + encodeURIComponent(otherUser.fullName),
                    participants: [
                        { id: userId, isOnline: true },
                        { ...otherUser, isOnline: false }
                    ],
                    lastMessage: lastMessage ? {
                        id: lastMessage.id,
                        content: lastMessage.content,
                        messageType: lastMessage.messageType,
                        createdAt: lastMessage.createdAt,
                        userId: lastMessage.userId,
                        isMe: lastMessage.userId === userId,
                        user: lastMessageUser
                    } : null
                };
            }));

            // Formatage terminé
            
            return {
                groupChats,
                privateChats
            };
        } catch (error) {
            console.error('❌ Erreur dans getAllUserConversations:', error);
            throw error;
        }
    }

    // Supprimer un chat privé
    static async deletePrivateChat(chatId: string, userId: string) {
        // Normaliser les IDs pour la recherche (A-B ou B-A)
        const parts = chatId.replace('private-', '').split('-');
        let whereClause: any = { title: chatId };
        
        if (parts.length === 2) {
            const [u1, u2] = parts;
            whereClause = {
                OR: [
                    { title: `private-${u1}-${u2}` },
                    { title: `private-${u2}-${u1}` }
                ]
            };
        }

        const discussion = await prisma.discussion.findFirst({
            where: whereClause
        });

        if (!discussion) {
            // Si pas trouvé, on considère que c'est déjà supprimé
            return { success: true };
        }

        // Vérifier que l'utilisateur fait partie du chat
        const participants = discussion.title.replace('private-', '').split('-');
        if (!participants.includes(userId)) {
            throw new Error('Accès non autorisé à ce chat privé');
        }

        try {
            // Supprimer tous les messages de la discussion
            await prisma.discussionMessage.deleteMany({
                where: {
                    discussionId: discussion.id
                }
            });

            // Supprimer la discussion
            // Utiliser deleteMany pour éviter l'erreur P2025 si l'enregistrement a disparu
            await prisma.discussion.deleteMany({
                where: {
                    id: discussion.id
                }
            });
        } catch (error) {
            console.error('Erreur lors de la suppression du chat:', error);
            throw error;
        }

        return { success: true };
    }

    // Marquer les messages d'une activité comme lus
    static async markActivityMessagesAsRead(activityId: string, _userId: string) {
        const cleanActivityId = activityId.replace(/^(activity-|chat-)/, '');
        
        const discussion = await prisma.discussion.findFirst({
            where: { activityId: cleanActivityId }
        });

        if (!discussion) {
            return { success: true }; // Pas de discussion = pas de messages à marquer
        }

        // Marquer tous les messages de cette discussion comme lus pour cet utilisateur
        // Note: Ceci nécessiterait une table de suivi de lecture par utilisateur
        // Pour l'instant, on retourne simplement success
        return { success: true };
    }

    // Marquer les messages d'un chat privé comme lus
    static async markPrivateMessagesAsRead(userId: string, otherUserId: string) {
        const chatId = `private-${[userId, otherUserId].sort().join('-')}`;
        
        const discussion = await prisma.discussion.findFirst({
            where: { title: chatId }
        });

        if (!discussion) {
            return { success: true }; // Pas de discussion = pas de messages à marquer
        }

        // Marquer tous les messages comme lus
        return { success: true };
    }
}
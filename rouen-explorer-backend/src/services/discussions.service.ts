// src/services/discussions.service.ts
import { PrismaClient } from '@prisma/client';

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

        // Retourner dans l'ordre chronologique avec structure basique
        return messages.reverse().map((message: any) => ({
            ...message,
            user: {
                id: message.userId,
                firstName: 'User',
                lastName: '',
                imageUrl: '',
                fullName: 'User'
            }
        }));
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

        // Retourner avec structure attendue par le frontend
        return {
            ...message,
            user: {
                id: data.userId,
                firstName: 'User',
                lastName: '',
                imageUrl: '',
                fullName: 'User'
            }
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

        // Retourner avec structure attendue par le frontend
        return {
            ...message,
            user: {
                id: data.userId,
                firstName: 'User',
                lastName: '',
                imageUrl: '',
                fullName: 'User'
            }
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
                        contains: `private-${userId}`
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
            const groupChats = activities.map(activity => {
                const discussion = discussions.find(d => d.activityId === activity.id);
                const lastMessage = discussion?.messages?.[0];

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
                        user: {
                            id: lastMessage.userId,
                            fullName: 'User',
                            firstName: 'User',
                            lastName: '',
                            imageUrl: ''
                        }
                    } : null
                };
            });

            // 6. Formater les conversations privées
            const privateChats = await Promise.all(privateDiscussions.map(async discussion => {
                const lastMessage = (discussion as any).messages?.[0];
                const participants = discussion.title.replace('private-', '').split('-');
                const otherUserId = participants.find(id => id !== userId) || 'unknown';
                
                // Trouver l'activité liée à cette conversation privée
                let organizerName = 'Organisateur';
                let organizerAvatar = null;
                let activityImage = null;
                
                // Chercher l'activité où cet utilisateur est l'organisateur
                const organizerActivity = await prisma.activity.findFirst({
                    where: {
                        createdBy: otherUserId
                    },
                    select: {
                        organizerName: true,
                        organizerAvatar: true,
                        image: true
                    }
                });
                
                if (organizerActivity) {
                    organizerName = organizerActivity.organizerName || 'Organisateur';
                    organizerAvatar = organizerActivity.organizerAvatar;
                    activityImage = organizerActivity.image;
                }

                return {
                    id: discussion.title,
                    activityName: organizerName,
                    organizerName: organizerName,
                    organizerAvatar: organizerAvatar,
                    activityImage: activityImage,
                    participants: [{ id: otherUserId, isOnline: Math.random() > 0.5 }],
                    lastMessage: lastMessage ? {
                        id: lastMessage.id,
                        content: lastMessage.content,
                        messageType: lastMessage.messageType,
                        createdAt: lastMessage.createdAt,
                        userId: lastMessage.userId,
                        isMe: lastMessage.userId === userId,
                        user: {
                            id: lastMessage.userId,
                            fullName: 'User',
                            firstName: 'User',
                            lastName: '',
                            imageUrl: ''
                        }
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
        const discussion = await prisma.discussion.findFirst({
            where: {
                title: chatId
            }
        });

        if (!discussion) {
            throw new Error('Chat privé non trouvé');
        }

        // Vérifier que l'utilisateur fait partie du chat via l'ID
        const participants = chatId.replace('private-', '').split('-');
        if (!participants.includes(userId)) {
            throw new Error('Accès non autorisé à ce chat privé');
        }

        // Supprimer tous les messages de la discussion
        await prisma.discussionMessage.deleteMany({
            where: {
                discussionId: discussion.id
            }
        });

        // Supprimer la discussion
        await prisma.discussion.delete({
            where: {
                id: discussion.id
            }
        });

        return { success: true };
    }
}
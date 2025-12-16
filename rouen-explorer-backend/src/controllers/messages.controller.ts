import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { clerkClient } from '@clerk/clerk-sdk-node';
import { getIO } from '../utils/socket';
import { isUserAdmin } from '../utils/roleCheck';

interface AuthenticatedRequest extends Request {
  auth?: {
    userId: string;
  };
}

const prisma = new PrismaClient();

export class MessagesController {
  // Récupérer les messages d'une discussion d'activité
  async getMessages(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { activityId } = req.params;
      const userId = req.auth?.userId;

      console.log(`📥 getMessages called for activityId: '${activityId}' by user: '${userId}'`);

      if (!userId) {
        res.status(401).json({ error: 'Non authentifié' });
        return;
      }

      // Vérifier que l'utilisateur est inscrit à l'activité OU est le créateur
      const registration = await prisma.registration.findFirst({
        where: {
          userId,
          itemId: activityId,
          type: 'ACTIVITY',
          status: 'ACCEPTED'
        }
      });

      // Si pas inscrit, vérifier si c'est le créateur ou un admin
      if (!registration) {
        console.log(`👤 User ${userId} not registered for ${activityId}. Checking if creator/admin...`);
        
        const activity = await prisma.activity.findUnique({
          where: { id: activityId },
          select: { createdBy: true }
        });

        if (!activity) {
           console.log(`❌ Activity ${activityId} not found in database.`);
           res.status(404).json({ error: 'Activité non trouvée' });
           return;
        }

        const isAdmin = await isUserAdmin(userId);
        console.log(`🔍 Access check: Creator=${activity.createdBy}, User=${userId}, Admin=${isAdmin}`);

        if (activity.createdBy !== userId && !isAdmin) {
          console.log(`⛔ Access denied for user ${userId}`);
          res.status(403).json({ error: 'Vous devez être inscrit à cette activité pour accéder au chat' });
          return;
        }
        console.log(`✅ Access granted for creator/admin`);
      }

      // Récupérer ou créer la discussion
      let discussion = await prisma.discussion.findUnique({
        where: { activityId }
      });

      if (!discussion) {
        const activity = await prisma.activity.findUnique({
          where: { id: activityId }
        });

        if (!activity) {
          res.status(404).json({ error: 'Activité non trouvée' });
          return;
        }

        discussion = await prisma.discussion.create({
          data: {
            activityId,
            title: `Discussion - ${activity.title}`
          }
        });
      }

      // Récupérer les messages avec les informations utilisateur
      const messages = await prisma.discussionMessage.findMany({
        where: { discussionId: discussion.id },
        orderBy: { createdAt: 'asc' }
      });

      // Enrichir avec les données Clerk
      const enrichedMessages = await Promise.all(
        messages.map(async (message: any) => {
          try {
            const user = await clerkClient.users.getUser(message.userId);
            return {
              ...message,
              user: {
                id: user.id,
                firstName: user.firstName,
                lastName: user.lastName,
                imageUrl: user.imageUrl,
                fullName: `${user.firstName} ${user.lastName}`.trim()
              }
            };
          } catch (error) {
            return {
              ...message,
              user: {
                id: message.userId,
                firstName: 'Utilisateur',
                lastName: '',
                imageUrl: '',
                fullName: 'Utilisateur inconnu'
              }
            };
          }
        })
      );

      res.json({
        discussionId: discussion.id,
        messages: enrichedMessages
      });
    } catch (error) {
      console.error('Error fetching messages:', error);
      res.status(500).json({ error: 'Erreur serveur' });
    }
  }

  // Envoyer un message
  async sendMessage(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { activityId } = req.params;
      const { content, messageType = 'TEXT' } = req.body;
      const userId = req.auth?.userId;
      const file = req.file;

      if (!userId) {
        res.status(401).json({ error: 'Non authentifié' });
        return;
      }

      if (!content || content.trim().length === 0) {
        if (!file) {
          res.status(400).json({ error: 'Le contenu du message ou un fichier est requis' });
          return;
        }
      }

      // Résolution d'ID : Vérifier si l'ID fourni est un ID de discussion au lieu d'un ID d'activité
      let targetActivityId = activityId;
      
      // Tenter de trouver une discussion avec cet ID
      const discussionCheck = await prisma.discussion.findUnique({
        where: { id: activityId },
        select: { activityId: true }
      });

      if (discussionCheck && discussionCheck.activityId) {
        console.log(`🔄 Resolved Discussion ID ${activityId} to Activity ID ${discussionCheck.activityId}`);
        targetActivityId = discussionCheck.activityId;
      }

      // Vérifier que l'utilisateur est inscrit à l'activité OU est le créateur
      const registration = await prisma.registration.findFirst({
        where: {
          userId,
          itemId: targetActivityId,
          type: 'ACTIVITY',
          status: 'ACCEPTED'
        }
      });

      // Si pas inscrit, vérifier si c'est le créateur ou un admin
      if (!registration) {
        const activity = await prisma.activity.findUnique({
          where: { id: targetActivityId },
          select: { createdBy: true }
        });

        if (!activity) {
           res.status(404).json({ error: 'Activité non trouvée' });
           return;
        }

        const isAdmin = await isUserAdmin(userId);

        if (activity.createdBy !== userId && !isAdmin) {
          res.status(403).json({ error: 'Vous devez être inscrit à cette activité pour envoyer des messages' });
          return;
        }
      }

      // Récupérer ou créer la discussion
      let discussion = await prisma.discussion.findUnique({
        where: { activityId: targetActivityId }
      });

      if (!discussion) {
        const activity = await prisma.activity.findUnique({
          where: { id: targetActivityId }
        });

        if (!activity) {
          res.status(404).json({ error: 'Activité non trouvée' });
          return;
        }

        discussion = await prisma.discussion.create({
          data: {
            activityId: targetActivityId,
            title: `Discussion - ${activity.title}`
          }
        });
      }

      // Préparer les données du message
      const messageData: any = {
        discussionId: discussion.id,
        userId,
        content: content ? content.trim() : '',
        messageType: file ? 'IMAGE' : messageType
      };

      // Ajouter l'URL du fichier si présent
      if (file) {
        messageData.mediaUrl = `/uploads/${file.filename}`;
      }

      // Créer le message
      const message = await prisma.discussionMessage.create({
        data: messageData
      });

      // Enrichir avec les données utilisateur
      let enrichedMessage;
      try {
        const user = await clerkClient.users.getUser(userId);
        enrichedMessage = {
          ...message,
          user: {
            id: user.id,
            firstName: user.firstName,
            lastName: user.lastName,
            imageUrl: user.imageUrl,
            fullName: `${user.firstName} ${user.lastName}`.trim()
          }
        };
      } catch (error) {
        enrichedMessage = {
          ...message,
          user: {
            id: userId,
            firstName: 'Utilisateur',
            lastName: '',
            imageUrl: '',
            fullName: 'Utilisateur inconnu'
          }
        };
      }

      // Émettre le message via Socket.IO
      try {
        const io = getIO();
        
        const socketMessage = {
          ...enrichedMessage,
          activityId: targetActivityId
        };
        
        // 1. Émettre à la room de la discussion (pour ceux qui sont DANS le chat)
        // Pour les activités, le frontend rejoint 'activity-' + activityId
        // Le backend préfixe avec 'discussion-', donc 'discussion-activity-' + activityId
        io.to(`discussion-activity-${targetActivityId}`).emit('new-message', socketMessage);
        
        // 2. Émettre aux participants (pour la liste des messages)
        // On doit récupérer les participants de l'activité
        const registrations = await prisma.registration.findMany({
          where: {
            itemId: targetActivityId,
            type: 'ACTIVITY',
            status: 'ACCEPTED'
          },
          select: { userId: true }
        });

        // Récupérer le créateur de l'activité
        const activity = await prisma.activity.findUnique({
            where: { id: targetActivityId },
            select: { createdBy: true }
        });
        
        const recipients = new Set(registrations.map(r => r.userId));
        if (activity && activity.createdBy) {
            recipients.add(activity.createdBy);
        }
        
        console.log(`📨 Sending notification to ${recipients.size} recipients for activity ${targetActivityId}`);
        console.log(`👥 Recipients: ${Array.from(recipients).join(', ')}`);

        recipients.forEach(recipientId => {
           io.to(`user-${recipientId}`).emit('discussion-updated', {
             discussionId: discussion.id,
             activityId: targetActivityId,
             lastMessage: socketMessage
           });
        });

      } catch (socketError) {
        console.error('Error emitting socket event:', socketError);
      }

      res.status(201).json(enrichedMessage);
    } catch (error) {
      console.error('Error sending message:', error);
      res.status(500).json({ error: 'Erreur serveur' });
    }
  }

  // Récupérer les participants du chat (utilisateurs inscrits)
  async getChatParticipants(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { activityId } = req.params;
      const userId = req.auth?.userId;

      if (!userId) {
        res.status(401).json({ error: 'Non authentifié' });
        return;
      }

      // Résolution d'ID : Vérifier si l'ID fourni est un ID de discussion au lieu d'un ID d'activité
      let targetActivityId = activityId;
      
      // Tenter de trouver une discussion avec cet ID
      const discussionCheck = await prisma.discussion.findUnique({
        where: { id: activityId },
        select: { activityId: true }
      });

      if (discussionCheck && discussionCheck.activityId) {
        targetActivityId = discussionCheck.activityId;
      }

      // Vérifier que l'utilisateur est inscrit à l'activité
      const userRegistration = await prisma.registration.findFirst({
        where: {
          userId,
          itemId: targetActivityId,
          type: 'ACTIVITY',
          status: 'ACCEPTED'
        }
      });

      // Si pas inscrit, vérifier si c'est le créateur ou un admin
      if (!userRegistration) {
        const activity = await prisma.activity.findUnique({
          where: { id: targetActivityId },
          select: { createdBy: true }
        });

        if (!activity) {
           res.status(404).json({ error: 'Activité non trouvée' });
           return;
        }

        const isAdmin = await isUserAdmin(userId);

        if (activity.createdBy !== userId && !isAdmin) {
          res.status(403).json({ error: 'Vous devez être inscrit à cette activité pour voir les participants' });
          return;
        }
      }

      // Récupérer tous les participants inscrits
      const registrations = await prisma.registration.findMany({
        where: {
          itemId: targetActivityId,
          type: 'ACTIVITY',
          status: 'ACCEPTED'
        }
      });

      // Enrichir avec les données Clerk
      const participants = await Promise.all(
        registrations.map(async (registration: any) => {
          try {
            const user = await clerkClient.users.getUser(registration.userId);
            return {
              id: user.id,
              firstName: user.firstName,
              lastName: user.lastName,
              imageUrl: user.imageUrl,
              fullName: `${user.firstName} ${user.lastName}`.trim(),
              joinedAt: registration.createdAt
            };
          } catch (error) {
            return {
              id: registration.userId,
              firstName: 'Utilisateur',
              lastName: '',
              imageUrl: '',
              fullName: 'Utilisateur inconnu',
              joinedAt: registration.createdAt
            };
          }
        })
      );

      res.json({ participants });
    } catch (error) {
      console.error('Error fetching participants:', error);
      res.status(500).json({ error: 'Erreur serveur' });
    }
  }

  // Créer un chat privé avec l'organisateur
  async createPrivateChat(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { organizerId } = req.body;
      const userId = req.auth?.userId;

      if (!userId) {
        res.status(401).json({ error: 'Non authentifié' });
        return;
      }

      if (!organizerId) {
        res.status(400).json({ error: 'ID de l\'organisateur requis' });
        return;
      }

      // Créer un ID unique pour le chat privé
      const chatId = `private-${userId}-${organizerId}`;

      // Vérifier si le chat existe déjà
      let discussion = await prisma.discussion.findFirst({
        where: { title: chatId }
      });

      if (!discussion) {
        discussion = await prisma.discussion.create({
          data: {
            title: chatId,
            activityId: null
          } as any
        });
      }

      res.json({ chatId, discussionId: discussion.id });
    } catch (error) {
      console.error('Error creating private chat:', error);
      res.status(500).json({ error: 'Erreur serveur' });
    }
  }

  // Récupérer les messages d'un chat privé
  async getPrivateMessages(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { chatId } = req.params;
      const userId = req.auth?.userId;

      if (!userId) {
        res.status(401).json({ error: 'Non authentifié' });
        return;
      }

      // Vérifier que l'utilisateur fait partie du chat privé
      // Format du chatId: private-{userId}-{organizerId}
      if (!chatId.includes(userId)) {
        res.status(403).json({ error: 'Accès non autorisé à ce chat privé' });
        return;
      }

      // Récupérer la discussion
      const discussion = await prisma.discussion.findFirst({
        where: { title: chatId }
      });

      if (!discussion) {
        res.status(404).json({ error: 'Chat privé non trouvé' });
        return;
      }

      // Récupérer les messages
      const messages = await prisma.discussionMessage.findMany({
        where: { discussionId: discussion.id },
        orderBy: { createdAt: 'asc' }
      });

      // Enrichir avec les données Clerk
      const enrichedMessages = await Promise.all(
        messages.map(async (message: any) => {
          try {
            const user = await clerkClient.users.getUser(message.userId);
            return {
              ...message,
              user: {
                id: user.id,
                firstName: user.firstName,
                lastName: user.lastName,
                imageUrl: user.imageUrl,
                fullName: `${user.firstName} ${user.lastName}`.trim()
              }
            };
          } catch (error) {
            return {
              ...message,
              user: {
                id: message.userId,
                firstName: 'Utilisateur',
                lastName: '',
                imageUrl: '',
                fullName: 'Utilisateur inconnu'
              }
            };
          }
        })
      );

      res.json({
        discussionId: discussion.id,
        messages: enrichedMessages
      });
    } catch (error) {
      console.error('Error fetching private messages:', error);
      res.status(500).json({ error: 'Erreur serveur' });
    }
  }

  // Récupérer toutes les conversations de l'utilisateur (activités + privées)
  async getUserConversations(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const userId = req.auth?.userId;

      if (!userId) {
        res.status(401).json({ error: 'Non authentifié' });
        return;
      }

      // Récupérer les activités auxquelles l'utilisateur est inscrit
      const registrations = await prisma.registration.findMany({
        where: {
          userId,
          type: 'ACTIVITY',
          status: 'ACCEPTED'
        }
      });

      // Récupérer les activités correspondantes
      const activityIds = registrations.map(r => r.itemId);
      const activities = await prisma.activity.findMany({
        where: {
          id: {
            in: activityIds
          }
        }
      });

      // Pour chaque activité, récupérer la discussion et le dernier message
      const activityChats = await Promise.all(
        activities.map(async (activity: any) => {
          
          // Trouver ou créer la discussion
          let discussion = await prisma.discussion.findUnique({
            where: { activityId: activity.id }
          });

          if (!discussion) {
            discussion = await prisma.discussion.create({
              data: {
                activityId: activity.id,
                title: `Discussion - ${activity.title}`
              }
            });
          }

          // Récupérer le dernier message
          const lastMessage = await prisma.discussionMessage.findFirst({
            where: { discussionId: discussion.id },
            orderBy: { createdAt: 'desc' }
          });

          let enrichedLastMessage = null;
          if (lastMessage) {
            try {
              const user = await clerkClient.users.getUser(lastMessage.userId);
              enrichedLastMessage = {
                ...lastMessage,
                user: {
                  id: user.id,
                  firstName: user.firstName,
                  lastName: user.lastName,
                  imageUrl: user.imageUrl,
                  fullName: `${user.firstName} ${user.lastName}`.trim()
                }
              };
            } catch (error) {
              enrichedLastMessage = {
                ...lastMessage,
                user: {
                  id: lastMessage.userId,
                  firstName: 'Utilisateur',
                  lastName: '',
                  imageUrl: '',
                  fullName: 'Utilisateur inconnu'
                }
              };
            }
          }

          return {
            id: `activity-${activity.id}`,
            type: 'group',
            activityName: activity.title,
            activityImage: activity.image,
            lastMessage: enrichedLastMessage,
            discussionId: discussion.id
          };
        })
      );

      // Récupérer les chats privés (discussions sans activityId)
      const privateDiscussions = await prisma.discussion.findMany({
        where: {
          activityId: null,
          title: {
            contains: userId // Les chats privés ont un titre contenant l'ID utilisateur
          }
        }
      });

      const privateChats = await Promise.all(
        privateDiscussions.map(async (discussion: any) => {
          // Récupérer le dernier message
          const lastMessage = await prisma.discussionMessage.findFirst({
            where: { discussionId: discussion.id },
            orderBy: { createdAt: 'desc' }
          });

          let enrichedLastMessage = null;
          if (lastMessage) {
            try {
              const user = await clerkClient.users.getUser(lastMessage.userId);
              enrichedLastMessage = {
                ...lastMessage,
                user: {
                  id: user.id,
                  firstName: user.firstName,
                  lastName: user.lastName,
                  imageUrl: user.imageUrl,
                  fullName: `${user.firstName} ${user.lastName}`.trim()
                }
              };
            } catch (error) {
              enrichedLastMessage = {
                ...lastMessage,
                user: {
                  id: lastMessage.userId,
                  firstName: 'Utilisateur',
                  lastName: '',
                  imageUrl: '',
                  fullName: 'Utilisateur inconnu'
                }
              };
            }
          }

          return {
            id: discussion.title,
            type: 'private',
            activityName: 'Chat privé',
            activityImage: 'https://images.pexels.com/photos/1640777/pexels-photo-1640777.jpeg',
            lastMessage: enrichedLastMessage,
            discussionId: discussion.id
          };
        })
      );

      res.json({
        groupChats: activityChats,
        privateChats: privateChats
      });
    } catch (error) {
      console.error('Error fetching user conversations:', error);
      res.status(500).json({ error: 'Erreur serveur' });
    }
  }

  // Envoyer un message dans un chat privé
  async sendPrivateMessage(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { chatId } = req.params;
      const { content, messageType = 'TEXT' } = req.body;
      const userId = req.auth?.userId;
      const file = req.file;

      if (!userId) {
        res.status(401).json({ error: 'Non authentifié' });
        return;
      }

      if (!content || content.trim().length === 0) {
        if (!file) {
          res.status(400).json({ error: 'Le contenu du message ou un fichier est requis' });
          return;
        }
      }

      // Vérifier que l'utilisateur fait partie du chat privé
      // Format du chatId: private-{userId}-{organizerId}
      if (!chatId.includes(userId)) {
        res.status(403).json({ error: 'Accès non autorisé à ce chat privé' });
        return;
      }

      // Récupérer la discussion
      const discussion = await prisma.discussion.findFirst({
        where: { title: chatId }
      });

      if (!discussion) {
        res.status(404).json({ error: 'Chat privé non trouvé' });
        return;
      }

      // Préparer les données du message
      const messageData: any = {
        discussionId: discussion.id,
        userId,
        content: content ? content.trim() : '',
        messageType: file ? 'IMAGE' : messageType
      };

      // Ajouter l'URL du fichier si présent
      if (file) {
        messageData.mediaUrl = `/uploads/${file.filename}`;
      }

      // Créer le message
      const message = await prisma.discussionMessage.create({
        data: messageData
      });

      // Enrichir avec les données utilisateur
      let enrichedMessage;
      try {
        const user = await clerkClient.users.getUser(userId);
        enrichedMessage = {
          ...message,
          user: {
            id: user.id,
            firstName: user.firstName,
            lastName: user.lastName,
            imageUrl: user.imageUrl,
            fullName: `${user.firstName} ${user.lastName}`.trim()
          }
        };
      } catch (error) {
        enrichedMessage = {
          ...message,
          user: {
            id: userId,
            firstName: 'Utilisateur',
            lastName: '',
            imageUrl: '',
            fullName: 'Utilisateur inconnu'
          }
        };
      }

      // Émettre le message via Socket.IO
      try {
        const io = getIO();
        
        const socketMessage = {
          ...enrichedMessage,
          chatId: chatId // Ajouter l'ID du chat (private-...) pour le frontend
        };
        
        // 1. Émettre à la room de la discussion (pour ceux qui sont DANS le chat)
        // Note: Le frontend rejoint la room 'discussion-' + chatId (qui est le titre)
        io.to(`discussion-${chatId}`).emit('new-message', socketMessage);
        
        // 2. Émettre aux participants individuels (pour ceux qui sont dans la LISTE des messages)
        if (chatId.startsWith('private-')) {
          const parts = chatId.split('-');
          if (parts.length >= 3) {
            const potentialIds = parts.filter(p => p !== 'private');
            potentialIds.forEach(participantId => {
               io.to(`user-${participantId}`).emit('discussion-updated', {
                 discussionId: discussion.id,
                 chatId: chatId,
                 lastMessage: socketMessage
               });
            });
          }
        }
      } catch (socketError) {
        console.error('Error emitting socket event:', socketError);
      }

      res.status(201).json(enrichedMessage);
    } catch (error) {
      console.error('Error sending private message:', error);
      res.status(500).json({ error: 'Erreur serveur' });
    }
  }
}

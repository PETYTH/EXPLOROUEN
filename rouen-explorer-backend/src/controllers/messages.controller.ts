import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { clerkClient } from '@clerk/clerk-sdk-node';

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

      if (!userId) {
        res.status(401).json({ error: 'Non authentifié' });
        return;
      }

      // Vérifier que l'utilisateur est inscrit à l'activité
      const registration = await prisma.registration.findFirst({
        where: {
          userId,
          itemId: activityId,
          type: 'ACTIVITY',
          status: 'ACCEPTED'
        }
      });

      if (!registration) {
        res.status(403).json({ error: 'Vous devez être inscrit à cette activité pour accéder au chat' });
        return;
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

      // Vérifier que l'utilisateur est inscrit à l'activité
      const registration = await prisma.registration.findFirst({
        where: {
          userId,
          itemId: activityId,
          type: 'ACTIVITY',
          status: 'ACCEPTED'
        }
      });

      if (!registration) {
        res.status(403).json({ error: 'Vous devez être inscrit à cette activité pour envoyer des messages' });
        return;
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
      try {
        const user = await clerkClient.users.getUser(userId);
        const enrichedMessage = {
          ...message,
          user: {
            id: user.id,
            firstName: user.firstName,
            lastName: user.lastName,
            imageUrl: user.imageUrl,
            fullName: `${user.firstName} ${user.lastName}`.trim()
          }
        };

        res.status(201).json(enrichedMessage);
      } catch (error) {
        const enrichedMessage = {
          ...message,
          user: {
            id: userId,
            firstName: 'Utilisateur',
            lastName: '',
            imageUrl: '',
            fullName: 'Utilisateur inconnu'
          }
        };

        res.status(201).json(enrichedMessage);
      }
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

      // Vérifier que l'utilisateur est inscrit à l'activité
      const userRegistration = await prisma.registration.findFirst({
        where: {
          userId,
          itemId: activityId,
          type: 'ACTIVITY',
          status: 'ACCEPTED'
        }
      });

      if (!userRegistration) {
        res.status(403).json({ error: 'Vous devez être inscrit à cette activité pour voir les participants' });
        return;
      }

      // Récupérer tous les participants inscrits
      const registrations = await prisma.registration.findMany({
        where: {
          itemId: activityId,
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
      try {
        const user = await clerkClient.users.getUser(userId);
        const enrichedMessage = {
          ...message,
          user: {
            id: user.id,
            firstName: user.firstName,
            lastName: user.lastName,
            imageUrl: user.imageUrl,
            fullName: `${user.firstName} ${user.lastName}`.trim()
          }
        };

        res.status(201).json(enrichedMessage);
      } catch (error) {
        const enrichedMessage = {
          ...message,
          user: {
            id: userId,
            firstName: 'Utilisateur',
            lastName: '',
            imageUrl: '',
            fullName: 'Utilisateur inconnu'
          }
        };

        res.status(201).json(enrichedMessage);
      }
    } catch (error) {
      console.error('Error sending private message:', error);
      res.status(500).json({ error: 'Erreur serveur' });
    }
  }
}

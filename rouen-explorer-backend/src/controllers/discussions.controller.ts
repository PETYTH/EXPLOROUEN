// src/controllers/discussions.controller.ts
import { Request, Response } from 'express';
import { DiscussionsService } from '../services/discussions.service';
import Joi from 'joi';

const createMessageSchema = Joi.object({
    content: Joi.string().min(1).max(500).required()
});

export class DiscussionsController {
    static async getDiscussionMessages(req: Request, res: Response) {
        try {
            const { activityId } = req.params;
            const limit = parseInt(req.query.limit as string) || 50;
            const offset = parseInt(req.query.offset as string) || 0;

            const messages = await DiscussionsService.getDiscussionMessagesByActivity(activityId, limit, offset);

            return res.json({
                success: true,
                discussionId: `activity-${activityId}`,
                messages: messages
            });
        } catch (error: any) {
            return res.status(500).json({
                success: false,
                error: error.message
            });
        }
    }

    static async getMessages(req: Request, res: Response) {
        try {
            const { discussionId } = req.params;
            const limit = parseInt(req.query.limit as string) || 50;
            const offset = parseInt(req.query.offset as string) || 0;

            const messages = await DiscussionsService.getDiscussionMessages(discussionId, limit, offset);

            return res.json({
                success: true,
                data: messages
            });
        } catch (error: any) {
            return res.status(500).json({
                success: false,
                message: error.message
            });
        }
    }

    static async createMessage(req: Request, res: Response) {
        try {
            const { activityId } = req.params;
            const userId = (req as any).auth.userId;

            // Gérer les fichiers uploadés (images/vidéos)
            if (req.file) {
                const message = await DiscussionsService.createMessageForActivity({
                    activityId,
                    userId,
                    content: req.body.content || 'Image partagée',
                    messageType: req.body.messageType || 'IMAGE',
                    mediaUrl: `/uploads/${req.file.filename}`
                });
                return res.status(201).json(message);
            }

            // Messages texte normaux
            const { error, value } = createMessageSchema.validate(req.body);

            if (error) {
                return res.status(400).json({
                    success: false,
                    error: 'Données invalides',
                    errors: error.details
                });
            }

            const message = await DiscussionsService.createMessageForActivity({
                activityId,
                userId,
                content: value.content,
                messageType: req.body.messageType || 'TEXT'
            });

            return res.status(201).json(message);
        } catch (error: any) {
            return res.status(400).json({
                success: false,
                error: error.message
            });
        }
    }

    static async getDiscussionParticipants(req: Request, res: Response) {
        try {
            const { activityId } = req.params;
            const participants = await DiscussionsService.getDiscussionParticipantsByActivity(activityId);
            res.json(participants);
        } catch (error) {
            console.error('Erreur lors de la récupération des participants:', error);
            res.status(500).json({ 
                error: error instanceof Error ? error.message : 'Erreur lors de la récupération des participants' 
            });
        }
    }

    static async getParticipants(req: Request, res: Response) {
        try {
            const { discussionId } = req.params;
            const participants = await DiscussionsService.getDiscussionParticipants(discussionId);

            return res.json({
                success: true,
                data: participants
            });
        } catch (error: any) {
            return res.status(500).json({
                success: false,
                message: error.message
            });
        }
    }

    // Créer ou récupérer un chat privé
    static async createPrivateChat(req: Request, res: Response) {
        try {
            const userId = (req as any).auth?.userId;
            if (!userId) {
                return res.status(401).json({ error: 'Utilisateur non authentifié' });
            }

            const { organizerId } = req.body;
            if (!organizerId) {
                return res.status(400).json({ error: 'ID de l\'organisateur requis' });
            }

            const discussion = await DiscussionsService.createOrGetPrivateChat(userId, organizerId);
            return res.json({
                chatId: discussion.title,
                discussionId: discussion.id,
                success: true
            });
        } catch (error) {
            console.error('Erreur lors de la création du chat privé:', error);
            return res.status(500).json({
                error: error instanceof Error ? error.message : 'Erreur lors de la création du chat privé'
            });
        }
    }

    // Récupérer les messages d'un chat privé
    static async getPrivateChatMessages(req: Request, res: Response) {
        try {
            const userId = (req as any).auth?.userId;
            if (!userId) {
                return res.status(401).json({ error: 'Utilisateur non authentifié' });
            }

            const { chatId } = req.params;
            const messages = await DiscussionsService.getPrivateChatMessages(chatId, userId);
            return res.json({ messages });
        } catch (error) {
            console.error('Erreur lors de la récupération des messages:', error);
            return res.status(500).json({
                error: error instanceof Error ? error.message : 'Erreur lors de la récupération des messages'
            });
        }
    }

    // Envoyer un message dans un chat privé
    static async sendPrivateMessage(req: Request, res: Response) {
        try {
            const { chatId } = req.params;
            const userId = (req as any).auth?.userId;

            if (!userId) {
                return res.status(401).json({ error: 'Utilisateur non authentifié' });
            }

            // Gérer les fichiers uploadés (images/vidéos)
            if (req.file) {
                const message = await DiscussionsService.sendPrivateMessage({
                    chatId,
                    userId,
                    content: req.body.content || 'Image partagée',
                    messageType: req.body.messageType || 'IMAGE',
                    mediaUrl: `/uploads/${req.file.filename}`
                });
                return res.json(message);
            }

            // Messages texte normaux
            const { content, messageType = 'TEXT' } = req.body;
            const message = await DiscussionsService.sendPrivateMessage({
                chatId,
                userId,
                content,
                messageType
            });

            return res.json(message);
        } catch (error) {
            console.error('Erreur lors de l\'envoi du message privé:', error);
            return res.status(500).json({
                error: error instanceof Error ? error.message : 'Erreur lors de l\'envoi du message privé'
            });
        }
    }

    // Récupérer toutes les conversations de l'utilisateur (groupes + privés)
    static async getAllConversations(req: Request, res: Response) {
        try {
            const userId = (req as any).auth?.userId;
            if (!userId) {
                return res.status(401).json({ error: 'Utilisateur non authentifié' });
            }

            console.log('🔍 Récupération des conversations pour userId:', userId);
            const conversations = await DiscussionsService.getAllUserConversations(userId);
            console.log('✅ Conversations récupérées:', conversations);
            return res.json(conversations);
        } catch (error) {
            console.error('❌ Erreur lors de la récupération des conversations:', error);
            console.error('Stack trace:', error instanceof Error ? error.stack : 'Unknown error');
            return res.status(500).json({
                error: error instanceof Error ? error.message : 'Erreur lors de la récupération des conversations'
            });
        }
    }

    // Supprimer un chat privé
    static async deletePrivateChat(req: Request, res: Response) {
        try {
            const userId = (req as any).auth?.userId;
            if (!userId) {
                return res.status(401).json({ error: 'Utilisateur non authentifié' });
            }

            const { chatId } = req.params;
            await DiscussionsService.deletePrivateChat(chatId, userId);
            return res.json({ success: true, message: 'Conversation privée supprimée' });
        } catch (error) {
            console.error('Erreur lors de la suppression du chat privé:', error);
            return res.status(500).json({
                error: error instanceof Error ? error.message : 'Erreur lors de la suppression du chat privé'
            });
        }
    }
}

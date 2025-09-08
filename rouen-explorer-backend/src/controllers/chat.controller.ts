import { Request, Response } from 'express';
import { EphemeralChatService } from '../services/ephemeral-chat.service';
import { ChatService } from '../services/chat.service';
import Joi from 'joi';

const messageSchema = Joi.object({
    content: Joi.string().min(1).max(1000).required(),
    type: Joi.string().valid('text', 'image', 'system').default('text')
});

export class ChatController {
    static async sendMessage(req: Request, res: Response) {
        try {
            const { roomId } = req.params;
            const userId = (req as any).user.userId;
            const { error, value } = messageSchema.validate(req.body);

            if (error) {
                return res.status(400).json({
                    success: false,
                    message: 'Données invalides',
                    errors: error.details
                });
            }

            const messageData = {
                roomId,
                userId,
                content: value.content,
                type: value.type
            };

            const chatMessage = await EphemeralChatService.createMessage(messageData);

            return res.status(201).json({
                success: true,
                message: 'Message envoyé',
                data: chatMessage
            });
        } catch (error: any) {
            return res.status(500).json({
                success: false,
                message: 'Erreur lors de l\'envoi du message',
                error: error.message
            });
        }
    }

    static async getRoomMessages(req: Request, res: Response) {
        try {
            const { roomId } = req.params;
            const userId = (req as any).user.userId;
            const options = {
                limit: parseInt(req.query.limit as string) || 50,
                offset: parseInt(req.query.offset as string) || 0,
                includeOffline: req.query.includeOffline === 'true'
            };

            const messages = await EphemeralChatService.getRoomMessages(roomId, userId, options);

            return res.json({
                success: true,
                data: messages
            });
        } catch (error: any) {
            return res.status(500).json({
                success: false,
                message: 'Erreur lors de la récupération des messages',
                error: error.message
            });
        }
    }

    static async updateMessage(req: Request, res: Response) {
        try {
            const { messageId } = req.params;
            const userId = (req as any).user.userId;
            const { message } = req.body;

            if (!message || typeof message !== 'string' || message.trim().length === 0) {
                return res.status(400).json({
                    success: false,
                    message: 'Message requis'
                });
            }

            const updatedMessage = await ChatService.updateMessage(messageId, userId, message.trim());

            return res.json({
                success: true,
                message: 'Message mis à jour',
                data: updatedMessage
            });
        } catch (error: any) {
            return res.status(400).json({
                success: false,
                message: error.message
            });
        }
    }

    static async deleteMessage(req: Request, res: Response) {
        try {
            const { messageId } = req.params;
            const userId = (req as any).user.userId;

            const deleted = await ChatService.deleteMessage(messageId, userId);

            if (!deleted) {
                return res.status(404).json({
                    success: false,
                    message: 'Message non trouvé ou non autorisé'
                });
            }

            return res.json({
                success: true,
                message: 'Message supprimé'
            });
        } catch (error: any) {
            return res.status(500).json({
                success: false,
                message: 'Erreur lors de la suppression',
                error: error.message
            });
        }
    }

    static async addReaction(req: Request, res: Response) {
        try {
            const { messageId } = req.params;
            const userId = (req as any).user.userId;
            const { emoji } = req.body;

            if (!emoji || typeof emoji !== 'string') {
                return res.status(400).json({
                    success: false,
                    message: 'Emoji requis'
                });
            }

            const message = await ChatService.addReaction(messageId, userId, emoji);

            if (!message) {
                return res.status(404).json({
                    success: false,
                    message: 'Message non trouvé'
                });
            }

            return res.json({
                success: true,
                message: 'Réaction ajoutée',
                data: message
            });
        } catch (error: any) {
            return res.status(500).json({
                success: false,
                message: 'Erreur lors de l\'ajout de la réaction',
                error: error.message
            });
        }
    }

    static async removeReaction(req: Request, res: Response) {
        try {
            const { messageId } = req.params;
            const userId = (req as any).user.userId;
            const { emoji } = req.body;

            if (!emoji || typeof emoji !== 'string') {
                return res.status(400).json({
                    success: false,
                    message: 'Emoji requis'
                });
            }

            const message = await ChatService.removeReaction(messageId, userId, emoji);

            if (!message) {
                return res.status(404).json({
                    success: false,
                    message: 'Message non trouvé'
                });
            }

            return res.json({
                success: true,
                message: 'Réaction supprimée',
                data: message
            });
        } catch (error: any) {
            return res.status(500).json({
                success: false,
                message: 'Erreur lors de la suppression de la réaction',
                error: error.message
            });
        }
    }

    static async joinRoom(req: Request, res: Response) {
        try {
            const { roomId } = req.params;
            const userId = (req as any).user.userId;
            const roomType = req.query.type as 'activity' | 'treasure_hunt';

            if (!roomType || !['activity', 'treasure_hunt'].includes(roomType)) {
                return res.status(400).json({
                    success: false,
                    message: 'Type de salle requis'
                });
            }

            const message = await ChatService.joinRoom(roomId, roomType, userId);

            return res.json({
                success: true,
                message: 'Salle rejointe',
                data: message
            });
        } catch (error: any) {
            return res.status(500).json({
                success: false,
                message: 'Erreur lors de la connexion à la salle',
                error: error.message
            });
        }
    }

    static async leaveRoom(req: Request, res: Response) {
        try {
            const { roomId } = req.params;
            const userId = (req as any).user.userId;
            const roomType = req.query.type as 'activity' | 'treasure_hunt';

            if (!roomType || !['activity', 'treasure_hunt'].includes(roomType)) {
                return res.status(400).json({
                    success: false,
                    message: 'Type de salle requis'
                });
            }

            const message = await ChatService.leaveRoom(roomId, roomType, userId);

            return res.json({
                success: true,
                message: 'Salle quittée',
                data: message
            });
        } catch (error: any) {
            return res.status(500).json({
                success: false,
                message: 'Erreur lors de la déconnexion de la salle',
                error: error.message
            });
        }
    }

    static async getRoomParticipants(req: Request, res: Response) {
        try {
            const { roomId } = req.params;
            const roomType = req.query.type as 'activity' | 'treasure_hunt';

            if (!roomType || !['activity', 'treasure_hunt'].includes(roomType)) {
                return res.status(400).json({
                    success: false,
                    message: 'Type de salle requis'
                });
            }

            const participants = await ChatService.getRoomParticipants(roomId, roomType);

            return res.json({
                success: true,
                data: participants,
                count: participants.length
            });
        } catch (error: any) {
            return res.status(500).json({
                success: false,
                message: 'Erreur lors de la récupération des participants',
                error: error.message
            });
        }
    }
}

import { Request, Response } from 'express';
import { EphemeralChatService } from '../services/ephemeral-chat.service';
import Joi from 'joi';

const messageSchema = Joi.object({
    content: Joi.string().min(1).max(1000).required(),
    type: Joi.string().valid('text', 'image', 'system').default('text')
});

const offlineMessageSchema = Joi.object({
    content: Joi.string().min(1).max(1000).required(),
    type: Joi.string().valid('text', 'image', 'system').default('text'),
    tempId: Joi.string().required()
});

export class EphemeralChatController {
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

    static async sendOfflineMessage(req: Request, res: Response) {
        try {
            const { roomId } = req.params;
            const userId = (req as any).user.userId;
            const { error, value } = offlineMessageSchema.validate(req.body);

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
                type: value.type,
                tempId: value.tempId
            };

            const chatMessage = await EphemeralChatService.createOfflineMessage(messageData);

            return res.status(201).json({
                success: true,
                message: 'Message hors ligne créé',
                data: chatMessage
            });
        } catch (error: any) {
            return res.status(500).json({
                success: false,
                message: 'Erreur lors de la création du message hors ligne',
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

    static async syncOfflineMessages(req: Request, res: Response) {
        try {
            const userId = (req as any).user.userId;
            const syncedMessages = await EphemeralChatService.syncOfflineMessages(userId);

            return res.json({
                success: true,
                message: 'Messages synchronisés',
                data: syncedMessages,
                count: syncedMessages.length
            });
        } catch (error: any) {
            return res.status(500).json({
                success: false,
                message: 'Erreur lors de la synchronisation',
                error: error.message
            });
        }
    }

    static async cleanupActivityMessages(req: Request, res: Response) {
        try {
            const { activityId } = req.params;
            const cleaned = await EphemeralChatService.cleanupActivityMessages(activityId);

            return res.json({
                success: true,
                message: cleaned ? 'Messages nettoyés' : 'Aucun nettoyage nécessaire',
                cleaned
            });
        } catch (error: any) {
            return res.status(500).json({
                success: false,
                message: 'Erreur lors du nettoyage',
                error: error.message
            });
        }
    }

    static async cleanupTreasureHuntMessages(req: Request, res: Response) {
        try {
            const { treasureHuntId } = req.params;
            const cleaned = await EphemeralChatService.cleanupTreasureHuntMessages(treasureHuntId);

            return res.json({
                success: true,
                message: cleaned ? 'Messages nettoyés' : 'Aucun nettoyage nécessaire',
                cleaned
            });
        } catch (error: any) {
            return res.status(500).json({
                success: false,
                message: 'Erreur lors du nettoyage',
                error: error.message
            });
        }
    }
}

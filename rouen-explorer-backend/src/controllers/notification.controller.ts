// src/controllers/notification.controller.ts
import { Request, Response } from 'express';
import { NotificationService } from '../services/notification.service';
import { Notification } from '../models/mongodb/Notification';

export class NotificationController {
    static async getUserNotifications(req: Request, res: Response) {
        try {
            const userId = (req as any).user.userId;
            const filters = {
                isRead: req.query.isRead === 'true' ? true : req.query.isRead === 'false' ? false : undefined,
                type: req.query.type as string,
                page: parseInt(req.query.page as string) || 1,
                limit: parseInt(req.query.limit as string) || 20
            };

            const result = await NotificationService.getUserNotifications(userId, filters);

            res.json({
                success: true,
                data: result.notifications,
                pagination: result.pagination
            });
        } catch (error: any) {
            res.status(500).json({
                success: false,
                message: 'Erreur lors de la récupération des notifications',
                error: error.message
            });
        }
    }

    static async getUnreadCount(req: Request, res: Response) {
        try {
            const userId = (req as any).user.userId;
            const count = await NotificationService.getUnreadCount(userId);

            res.json({
                success: true,
                data: { unreadCount: count }
            });
        } catch (error: any) {
            res.status(500).json({
                success: false,
                message: 'Erreur lors du comptage des notifications',
                error: error.message
            });
        }
    }

    static async markAsRead(req: Request, res: Response) {
        try {
            const { id } = req.params;
            const userId = (req as any).user.userId;

            const notification = await NotificationService.markAsRead(id, userId);

            if (!notification) {
                return res.status(404).json({
                    success: false,
                    message: 'Notification non trouvée'
                });
            }

            return res.json({
                success: true,
                message: 'Notification marquée comme lue',
                data: notification
            });
        } catch (error: any) {
            return res.status(500).json({
                success: false,
                message: 'Erreur lors de la mise à jour',
                error: error.message
            });
        }
    }

    static async markAllAsRead(req: Request, res: Response) {
        try {
            const userId = (req as any).user.userId;
            const count = await NotificationService.markAllAsRead(userId);

            return res.json({
                success: true,
                message: `${count} notifications marquées comme lues`,
                data: { updatedCount: count }
            });
        } catch (error: any) {
            return res.status(500).json({
                success: false,
                message: 'Erreur lors de la mise à jour',
                error: error.message
            });
        }
    }

    static async deleteNotification(req: Request, res: Response) {
        try {
            const { id } = req.params;
            const userId = (req as any).user.userId;

            const deleted = await NotificationService.deleteNotification(id, userId);

            if (!deleted) {
                return res.status(404).json({
                    success: false,
                    message: 'Notification non trouvée'
                });
            }

            return res.json({
                success: true,
                message: 'Notification supprimée'
            });
        } catch (error: any) {
            return res.status(500).json({
                success: false,
                message: 'Erreur lors de la suppression',
                error: error.message
            });
        }
    }

    static async broadcastNotification(req: Request, res: Response) {
        try {
            const { title, message, type, priority } = req.body;

            const notifications = await NotificationService.notifyAdmins({
                type: type || 'system',
                title,
                message,
                priority: priority || 'medium'
            });

            res.json({
                success: true,
                message: `Notification diffusée à ${notifications.length} administrateurs`,
                data: { sentCount: notifications.length }
            });
        } catch (error: any) {
            res.status(500).json({
                success: false,
                message: 'Erreur lors de la diffusion',
                error: error.message
            });
        }
    }

    static async getNotificationStats(_req: Request, res: Response) {
        try {
            const stats = await Notification.aggregate([
                {
                    $group: {
                        _id: '$type',
                        count: { $sum: 1 },
                        unreadCount: {
                            $sum: { $cond: [{ $eq: ['$isRead', false] }, 1, 0] }
                        }
                    }
                }
            ]);

            const totalStats = await Notification.aggregate([
                {
                    $group: {
                        _id: null,
                        total: { $sum: 1 },
                        unread: {
                            $sum: { $cond: [{ $eq: ['$isRead', false] }, 1, 0] }
                        },
                        avgPriority: { $avg: 1 }
                    }
                }
            ]);

            res.json({
                success: true,
                data: {
                    byType: stats,
                    total: totalStats[0] || { total: 0, unread: 0 }
                }
            });
        } catch (error: any) {
            res.status(500).json({
                success: false,
                message: 'Erreur lors de la récupération des statistiques',
                error: error.message
            });
        }
    }
}

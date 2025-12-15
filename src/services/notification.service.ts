// src/services/notification.service.ts
import { Notification, INotification } from '../models/mongodb/Notification';
import { prisma } from '../utils/database';

export class NotificationService {
    static async createNotification(notificationData: Partial<INotification>): Promise<INotification> {
        const notification = new Notification({
            ...notificationData,
            isRead: false,
            channels: notificationData.channels || ['in_app'],
            metadata: {
                source: 'system',
                tags: [],
                ...notificationData.metadata
            }
        });

        await notification.save();
        return notification;
    }

    static async notifyUser(userId: string, data: {
        type: INotification['type'];
        title: string;
        message: string;
        data?: any;
        priority?: 'low' | 'medium' | 'high' | 'urgent';
        channels?: ('push' | 'email' | 'sms' | 'in_app')[];
        scheduledFor?: Date;
    }): Promise<INotification> {
        return this.createNotification({
            userId,
            ...data
        });
    }

    static async notifyAdmins(data: {
        type: INotification['type'];
        title: string;
        message: string;
        data?: any;
        priority?: 'low' | 'medium' | 'high' | 'urgent';
    }): Promise<INotification[]> {
        // Pour l'instant, on utilise des IDs d'admin hardcodés
        // En production, vous pourriez récupérer ces IDs depuis Clerk
        const adminIds = ['admin_1', 'admin_2']; // IDs Clerk des admins

        const notifications = await Promise.all(
            adminIds.map((adminId: string) => this.createNotification({
                userId: adminId,
                ...data,
                channels: ['in_app', 'email']
            }))
        );

        return notifications;
    }

    static async getUserNotifications(userId: string, filters: {
        isRead?: boolean;
        type?: string;
        page?: number;
        limit?: number;
    } = {}) {
        const { isRead, type, page = 1, limit = 20 } = filters;
        const query: any = { userId };

        if (typeof isRead === 'boolean') query.isRead = isRead;
        if (type) query.type = type;

        const skip = (page - 1) * limit;

        const [notifications, total] = await Promise.all([
            Notification.find(query)
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit)
                .lean(),
            Notification.countDocuments(query)
        ]);

        return {
            notifications,
            pagination: {
                page,
                limit,
                total,
                pages: Math.ceil(total / limit)
            }
        };
    }

    static async markAsRead(notificationId: string, userId: string): Promise<INotification | null> {
        return Notification.findOneAndUpdate(
            { _id: notificationId, userId },
            { isRead: true, updatedAt: new Date() },
            { new: true }
        );
    }

    static async markAllAsRead(userId: string): Promise<number> {
        const result = await Notification.updateMany(
            { userId, isRead: false },
            { isRead: true, updatedAt: new Date() }
        );
        return result.modifiedCount;
    }

    static async deleteNotification(notificationId: string, userId: string): Promise<boolean> {
        const result = await Notification.findOneAndDelete({
            _id: notificationId,
            userId
        });
        return !!result;
    }

    static async getUnreadCount(userId: string): Promise<number> {
        return Notification.countDocuments({
            userId,
            isRead: false
        });
    }

    static async notifyActivityRegistration(userId: string, activityId: string): Promise<void> {
        const activity = await prisma.activity.findUnique({
            where: { id: activityId }
        });

        if (activity) {
            await this.notifyUser(userId, {
                type: 'activity_registration',
                title: 'Inscription confirmée',
                message: `Votre inscription à "${activity.title}" a été confirmée.`,
                data: {
                    activityId,
                    actionUrl: `/activities/${activityId}`
                },
                priority: 'medium',
                channels: ['in_app', 'email']
            });
        }
    }

    static async notifyTreasureHuntRegistration(userId: string, treasureHuntId: string): Promise<void> {
        const treasureHunt = await prisma.treasureHunt.findUnique({
            where: { id: treasureHuntId }
        });

        if (treasureHunt) {
            await this.notifyUser(userId, {
                type: 'treasure_hunt_registration',
                title: 'Inscription à la chasse aux trésors',
                message: `Votre inscription à "${treasureHunt.title}" a été confirmée.`,
                data: {
                    treasureHuntId,
                    actionUrl: `/treasure-hunts/${treasureHuntId}`
                },
                priority: 'medium',
                channels: ['in_app', 'email']
            });
        }
    }

    static async scheduleReminders(): Promise<void> {
        // Rappels pour les activités (24h avant)
        const upcomingActivities = await prisma.activity.findMany({
            where: {
                startDate: {
                    gte: new Date(Date.now() + 23 * 60 * 60 * 1000), // 23h à l'avance
                    lte: new Date(Date.now() + 25 * 60 * 60 * 1000) // 25h pour avoir une marge
                },
                isActive: true
            }
        });

        for (const activity of upcomingActivities) {
            // Récupérer les inscriptions pour cette activité
            const registrations = await prisma.registration.findMany({
                where: {
                    itemId: activity.id,
                    type: 'ACTIVITY',
                    status: 'ACCEPTED'
                }
            });

            for (const registration of registrations) {
                await this.notifyUser(registration.userId, {
                    type: 'activity_reminder',
                    title: 'Rappel d\'activité',
                    message: `L'activité "${activity.title}" commence demain à ${activity.startDate.toLocaleTimeString()}.`,
                    data: {
                        activityId: activity.id,
                        actionUrl: `/activities/${activity.id}`
                    },
                    priority: 'high',
                    scheduledFor: new Date(activity.startDate.getTime() - 24 * 60 * 60 * 1000)
                });
            }
        }
    }
}

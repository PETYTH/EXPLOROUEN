// src/routes/notifications.routes.ts
import { Router } from 'express';
import { NotificationController } from '../controllers/notification.controller';
import { authenticate, authorize } from '../middleware/auth.middleware';

const router = Router();

// Routes utilisateur authentifié
router.get('/', authenticate, NotificationController.getUserNotifications);
router.get('/unread-count', authenticate, NotificationController.getUnreadCount);
router.put('/:id/read', authenticate, NotificationController.markAsRead);
router.put('/mark-all-read', authenticate, NotificationController.markAllAsRead);
router.delete('/:id', authenticate, NotificationController.deleteNotification);

// Routes administrateur
router.post('/broadcast', authenticate, authorize(['ADMIN']), NotificationController.broadcastNotification);
router.get('/stats', authenticate, authorize(['ADMIN']), NotificationController.getNotificationStats);

export default router;

import { Router } from 'express';
import { EphemeralChatController } from '../controllers/ephemeral-chat.controller';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();

// Toutes les routes nécessitent une authentification
router.use(authenticate);

// Messages éphémères
router.post('/rooms/:roomId/messages', EphemeralChatController.sendMessage);
router.post('/rooms/:roomId/offline-messages', EphemeralChatController.sendOfflineMessage);
router.get('/rooms/:roomId/messages', EphemeralChatController.getRoomMessages);

// Synchronisation hors ligne
router.post('/sync-offline-messages', EphemeralChatController.syncOfflineMessages);

// Nettoyage automatique
router.post('/cleanup/activity/:activityId', EphemeralChatController.cleanupActivityMessages);
router.post('/cleanup/treasure-hunt/:treasureHuntId', EphemeralChatController.cleanupTreasureHuntMessages);

export default router;

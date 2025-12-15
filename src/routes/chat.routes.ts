// src/routes/chat.routes.ts
import { Router } from 'express';
import { ChatController } from '../controllers/chat.controller';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();

// Toutes les routes nécessitent une authentification
router.use(authenticate);

// Messages de chat
router.post('/rooms/:roomId/messages', ChatController.sendMessage);
router.get('/rooms/:roomId/messages', ChatController.getRoomMessages);
router.put('/messages/:messageId', ChatController.updateMessage);
router.delete('/messages/:messageId', ChatController.deleteMessage);

// Réactions
router.post('/messages/:messageId/reactions', ChatController.addReaction);
router.delete('/messages/:messageId/reactions', ChatController.removeReaction);

// Gestion des salles
router.post('/rooms/:roomId/join', ChatController.joinRoom);
router.post('/rooms/:roomId/leave', ChatController.leaveRoom);
router.get('/rooms/:roomId/participants', ChatController.getRoomParticipants);

export default router;

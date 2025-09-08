import { Router } from 'express';
import { DiscussionsController } from '../controllers/discussions.controller';
import { requireAuth } from '../middleware/clerk.middleware';
import multer from 'multer';
import path from 'path';
import fs from 'fs';

const router = Router();

// Configuration multer pour l'upload de fichiers
const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    const uploadDir = 'uploads/';
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (_req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ 
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit
  },
  fileFilter: (_req, file, cb) => {
    if (file.mimetype.startsWith('image/') || file.mimetype.startsWith('video/')) {
      cb(null, true);
    } else {
      cb(new Error('Seuls les fichiers image et vidéo sont autorisés'));
    }
  }
});

// Routes pour les messages d'activité
router.get('/activity/:activityId/messages', requireAuth, DiscussionsController.getDiscussionMessages);
router.post('/activity/:activityId', requireAuth, upload.single('media'), DiscussionsController.createMessage);

// Routes pour les participants d'activité
router.get('/activity/:activityId/participants', requireAuth, DiscussionsController.getDiscussionParticipants);

// Route pour récupérer toutes les conversations (groupes + privés)
router.get('/conversations', requireAuth, DiscussionsController.getAllConversations);

// Routes pour les chats privés
router.post('/private/create', requireAuth, DiscussionsController.createPrivateChat);
router.get('/private/:chatId/messages', requireAuth, DiscussionsController.getPrivateChatMessages);
router.post('/private/:chatId/message', requireAuth, upload.single('media'), DiscussionsController.sendPrivateMessage);
router.delete('/private/:chatId/delete', requireAuth, DiscussionsController.deletePrivateChat);

export default router;
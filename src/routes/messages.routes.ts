import { Router } from 'express';
import { MessagesController } from '../controllers/messages.controller';
import { requireAuth } from '../middleware/clerk.middleware';
import multer from 'multer';
import path from 'path';
import fs from 'fs';

const router = Router();
const messagesController = new MessagesController();

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

// Toutes les routes nécessitent une authentification
router.use(requireAuth);

// Routes pour les messages d'activité
router.get('/activity/:activityId', messagesController.getMessages.bind(messagesController));
router.post('/activity/:activityId', upload.single('media'), messagesController.sendMessage.bind(messagesController));
router.get('/activity/:activityId/participants', messagesController.getChatParticipants.bind(messagesController));

// Route pour récupérer toutes les conversations de l'utilisateur
router.get('/conversations', messagesController.getUserConversations.bind(messagesController));

// Routes pour les chats privés
router.post('/private/create', messagesController.createPrivateChat.bind(messagesController));
router.get('/private/:chatId', messagesController.getPrivateMessages.bind(messagesController));
router.post('/private/:chatId', upload.single('media'), messagesController.sendPrivateMessage.bind(messagesController));

export default router;

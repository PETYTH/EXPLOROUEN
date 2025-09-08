// src/routes/contact.routes.ts
import { Router } from 'express';
import { ContactController } from '../controllers/contact.controller';
import { authenticate, authorize } from '../middleware/auth.middleware';
// import { checkCookieConsent } from '../middleware/cookies.middleware';

const router = Router();

// Routes publiques
router.post('/', authenticate, ContactController.create);

// Routes administrateur
router.get('/', authenticate, authorize(['ADMIN', 'MODERATOR']), ContactController.getAll);
router.get('/stats', authenticate, authorize(['ADMIN']), ContactController.getStats);
router.get('/:id', authenticate, authorize(['ADMIN', 'MODERATOR']), ContactController.getById);
router.put('/:id', authenticate, authorize(['ADMIN', 'MODERATOR']), ContactController.update);
router.put('/:id/status', authenticate, authorize(['ADMIN', 'MODERATOR']), ContactController.updateStatus);
router.delete('/:id', authenticate, authorize(['ADMIN']), ContactController.delete);

export default router;

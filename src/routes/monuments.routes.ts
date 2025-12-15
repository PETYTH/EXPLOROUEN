import { Router } from 'express';
import { MonumentsController } from '../controllers/monuments.controller';
import { cacheMonumentsMiddleware, invalidateMonumentsCache } from '../middleware/cache.middleware';
import { requireAuth } from '../middleware/clerk.middleware';

const router = Router();

// Routes GET avec cache (1 heure)
router.get('/', cacheMonumentsMiddleware, MonumentsController.getAllMonuments);

// Routes pour les visites planifiées (nécessitent l'authentification) - DOIVENT être AVANT /:id
router.get('/planned-visits', requireAuth, MonumentsController.getPlannedVisits);
router.delete('/planned-visits/:visitId', requireAuth, MonumentsController.cancelPlannedVisit);

// Route pour récupérer les notifications de l'utilisateur
router.get('/user-notifications', requireAuth, MonumentsController.getUserNotifications);
router.put('/notifications/:id/read', requireAuth, MonumentsController.markNotificationAsRead);

// Route spécifique pour un monument par ID
router.get('/:id', cacheMonumentsMiddleware, MonumentsController.getMonumentById);

// Routes de mutation avec invalidation du cache
router.post('/', invalidateMonumentsCache, MonumentsController.createMonument);
router.put('/:id', invalidateMonumentsCache, MonumentsController.updateMonument);
router.delete('/:id', invalidateMonumentsCache, MonumentsController.deleteMonument);

// Routes pour les avis (addReview nécessite l'authentification)
router.post('/:id/reviews', requireAuth, invalidateMonumentsCache, MonumentsController.addReview);
router.get('/:id/reviews', MonumentsController.getReviews);

// Route pour planifier une visite
router.post('/:id/plan-visit', requireAuth, MonumentsController.planVisit);

export default router;

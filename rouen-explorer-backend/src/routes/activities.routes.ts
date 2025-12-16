import { Router } from 'express';
import { ActivitiesController } from '../controllers/activities.controller';
import { DiscussionsController } from '../controllers/discussions.controller';
import { requireAuth } from '../middleware/clerk.middleware';
import { cacheActivitiesMiddleware, invalidateActivitiesCache } from '../middleware/cache.middleware';
// import { validate } from '../middleware/validation.middleware';

const router = Router();

// Routes publiques avec cache (30 minutes)
router.get('/', cacheActivitiesMiddleware, ActivitiesController.getAllActivities);

// Routes authentifiées (routes spécifiques AVANT les routes avec paramètres)
// Pas de cache pour les données utilisateur spécifiques
router.get('/user/me', requireAuth, ActivitiesController.getUserActivities);
router.get('/user/registered', requireAuth, ActivitiesController.getUserRegisteredActivities);
router.post('/', requireAuth, invalidateActivitiesCache, ActivitiesController.createActivity);
router.post('/:id/register', requireAuth, invalidateActivitiesCache, ActivitiesController.registerToActivity);
router.delete('/:id/register', requireAuth, invalidateActivitiesCache, ActivitiesController.unregisterFromActivity);
router.get('/:id/registration/status', requireAuth, ActivitiesController.getRegistrationStatus);

// Route avec paramètre ID (doit être APRÈS les routes spécifiques) - avec cache
router.get('/:id', cacheActivitiesMiddleware, ActivitiesController.getActivityById);
router.put('/:id', requireAuth, invalidateActivitiesCache, ActivitiesController.updateActivity);
router.delete('/:id', requireAuth, invalidateActivitiesCache, ActivitiesController.deleteActivity);

// Routes des discussions - pas de cache pour les messages en temps réel
router.get('/:activityId/discussion/messages', requireAuth, DiscussionsController.getMessages);
router.post('/:activityId/discussion/messages', requireAuth, DiscussionsController.createMessage);
router.get('/:activityId/discussion/participants', requireAuth, DiscussionsController.getParticipants);

export default router;

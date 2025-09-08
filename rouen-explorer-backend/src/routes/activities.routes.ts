import { Router } from 'express';
import { ActivitiesController } from '../controllers/activities.controller';
import { DiscussionsController } from '../controllers/discussions.controller';
import { requireAuth } from '../middleware/clerk.middleware';
// import { validate } from '../middleware/validation.middleware';

const router = Router();

// Routes publiques
router.get('/', ActivitiesController.getAllActivities);

// Routes authentifiées (routes spécifiques AVANT les routes avec paramètres)
router.get('/user/me', requireAuth, ActivitiesController.getUserActivities);
router.get('/user/registered', requireAuth, ActivitiesController.getUserRegisteredActivities);
router.post('/', requireAuth, ActivitiesController.createActivity);
router.post('/:id/register', requireAuth, ActivitiesController.registerToActivity);
router.delete('/:id/register', requireAuth, ActivitiesController.unregisterFromActivity);
router.get('/:id/registration/status', requireAuth, ActivitiesController.getRegistrationStatus);

// Route avec paramètre ID (doit être APRÈS les routes spécifiques)
router.get('/:id', ActivitiesController.getActivityById);
router.put('/:id', requireAuth, ActivitiesController.updateActivity);
router.delete('/:id', requireAuth, ActivitiesController.deleteActivity);

// Routes des discussions
router.get('/:activityId/discussion/messages', requireAuth, DiscussionsController.getMessages);
router.post('/:activityId/discussion/messages', requireAuth, DiscussionsController.createMessage);
router.get('/:activityId/discussion/participants', requireAuth, DiscussionsController.getParticipants);

export default router;

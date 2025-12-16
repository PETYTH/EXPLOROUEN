import { Router } from 'express';
import { PlacesController } from '../controllers/places.controller.minimal';
import { authenticate } from '../middleware/auth.middleware';
import { cachePlacesMiddleware, invalidatePlacesCache } from '../middleware/cache.middleware';

const router = Router();

// Routes GET avec cache (1 heure)
router.get('/', cachePlacesMiddleware, PlacesController.getAllPlaces);
router.get('/:id', cachePlacesMiddleware, PlacesController.getPlaceById);

// Routes de mutation avec invalidation du cache
router.post('/', authenticate, invalidatePlacesCache, PlacesController.createPlace);
router.put('/:id', authenticate, invalidatePlacesCache, PlacesController.updatePlace);
router.delete('/:id', authenticate, invalidatePlacesCache, PlacesController.deletePlace);
router.post('/:id/favorite', authenticate, PlacesController.addToFavorites); // Pas d'invalidation, données utilisateur
router.post('/:id/review', authenticate, invalidatePlacesCache, PlacesController.addReview); // Invalide car affecte les stats

export default router;
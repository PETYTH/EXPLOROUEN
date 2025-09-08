import { Router } from 'express';
import { PlacesController } from '../controllers/places.controller.minimal';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();

router.get('/', PlacesController.getAllPlaces);
router.get('/:id', PlacesController.getPlaceById);
router.post('/', authenticate, PlacesController.createPlace);
router.put('/:id', authenticate, PlacesController.updatePlace);
router.delete('/:id', authenticate, PlacesController.deletePlace);
router.post('/:id/favorite', authenticate, PlacesController.addToFavorites);
router.post('/:id/review', authenticate, PlacesController.addReview);

export default router;
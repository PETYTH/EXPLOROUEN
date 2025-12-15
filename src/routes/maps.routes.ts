// src/routes/maps.routes.ts
import { Router } from 'express';
import { MapsController } from '../controllers/maps.controller';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();

// Routes publiques
router.get('/places', MapsController.getPlacesWithCoordinates);
router.get('/activities', MapsController.getActivitiesWithCoordinates);
router.get('/routes/popular', MapsController.getPopularRoutes);
router.post('/routes/calculate', MapsController.calculateRoute);
router.get('/pois/nearby', MapsController.getNearbyPOIs);

// Routes authentifiées
router.post('/routes', authenticate, MapsController.createCustomRoute);
router.get('/routes/user', authenticate, MapsController.getUserRoutes);

export default router;

// src/routes/treasures.routes.ts
import { Router } from 'express';
import { authenticate } from '../middleware/auth.middleware';
// import { validate } from '../middleware/validation.middleware';
// import Joi from 'joi'; // Temporairement commenté car non utilisé

const router = Router();

// Schémas de validation - temporairement commentés car non utilisés
/*
const createTreasureHuntSchema = Joi.object({
    title: Joi.string().required().min(3).max(100),
    description: Joi.string().required().min(10).max(500),
    startDate: Joi.date().iso().required(),
    endDate: Joi.date().iso().greater(Joi.ref('startDate')).required(),
    difficulty: Joi.string().valid('easy', 'medium', 'hard').required(),
    maxParticipants: Joi.number().integer().min(1).max(100),
    isPublic: Joi.boolean().default(true),
    season: Joi.string().valid('spring', 'summer', 'autumn', 'winter'),
    rewards: Joi.array().items(Joi.object({
        type: Joi.string().valid('badge', 'points', 'discount').required(),
        value: Joi.string().required(),
        description: Joi.string()
    })),
    clues: Joi.array().items(Joi.object({
        order: Joi.number().integer().min(1).required(),
        title: Joi.string().required(),
        description: Joi.string().required(),
        latitude: Joi.number().required(),
        longitude: Joi.number().required(),
        radius: Joi.number().min(10).max(1000).default(50),
        hint: Joi.string(),
        solution: Joi.string().required()
    })).min(1).required()
});

const updateTreasureHuntSchema = Joi.object({
    title: Joi.string().min(3).max(100),
    description: Joi.string().min(10).max(500),
    startDate: Joi.date().iso(),
    endDate: Joi.date().iso(),
    difficulty: Joi.string().valid('easy', 'medium', 'hard'),
    maxParticipants: Joi.number().integer().min(1).max(100),
    isPublic: Joi.boolean(),
    season: Joi.string().valid('spring', 'summer', 'autumn', 'winter'),
    rewards: Joi.array().items(Joi.object({
        type: Joi.string().valid('badge', 'points', 'discount').required(),
        value: Joi.string().required(),
        description: Joi.string()
    })),
    clues: Joi.array().items(Joi.object({
        order: Joi.number().integer().min(1).required(),
        title: Joi.string().required(),
        description: Joi.string().required(),
        latitude: Joi.number().required(),
        longitude: Joi.number().required(),
        radius: Joi.number().min(10).max(1000).default(50),
        hint: Joi.string(),
        solution: Joi.string().required()
    })).min(1)
});

const submitAnswerSchema = Joi.object({
    clueId: Joi.string().required(),
    answer: Joi.string().required().min(1).max(200)
});
*/

// Routes publiques - temporairement désactivées en attendant le contrôleur
// router.get('/', TreasureHuntController.getAllTreasureHunts);
// router.get('/featured', TreasureHuntController.getFeaturedTreasureHunts);
// router.get('/seasonal', TreasureHuntController.getSeasonalTreasureHunts);
// router.get('/:id', TreasureHuntController.getTreasureHuntById);
// router.get('/:id/leaderboard', TreasureHuntController.getLeaderboard);

// Routes authentifiées
router.use(authenticate);

// Temporairement désactivées en attendant le contrôleur
// router.post('/', validate(createTreasureHuntSchema), TreasureHuntController.createTreasureHunt);
// router.put('/:id', validate(updateTreasureHuntSchema), TreasureHuntController.updateTreasureHunt);
// router.delete('/:id', TreasureHuntController.deleteTreasureHunt);

// Participation
// router.post('/:id/join', TreasureHuntController.joinTreasureHunt);
// router.post('/:id/leave', TreasureHuntController.leaveTreasureHunt);
// router.get('/:id/progress', TreasureHuntController.getUserProgress);
// router.post('/:id/submit', validate(submitAnswerSchema), TreasureHuntController.submitAnswer);

// Gestion des favoris
// router.post('/:id/favorite', TreasureHuntController.addToFavorites);
// router.delete('/:id/favorite', TreasureHuntController.removeFromFavorites);

// Statistiques
// router.get('/:id/stats', TreasureHuntController.getTreasureHuntStats);

export default router;
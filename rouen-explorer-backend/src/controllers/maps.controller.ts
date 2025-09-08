// src/controllers/maps.controller.ts
import { Request, Response } from 'express';
import { MapsService } from '../services/maps.service';
import Joi from 'joi';

const coordinatesSchema = Joi.object({
    latitude: Joi.number().min(-90).max(90).required(),
    longitude: Joi.number().min(-180).max(180).required()
});

const routePointSchema = coordinatesSchema.keys({
    name: Joi.string().max(100).optional(),
    description: Joi.string().max(500).optional(),
    type: Joi.string().valid('start', 'waypoint', 'end', 'poi').optional()
});

const routeSchema = Joi.object({
    name: Joi.string().min(3).max(100).required(),
    description: Joi.string().max(500).required(),
    points: Joi.array().items(routePointSchema).min(2).required(),
    type: Joi.string().valid('walking', 'cycling', 'driving').required(),
    difficulty: Joi.string().valid('easy', 'medium', 'hard').required(),
    tags: Joi.array().items(Joi.string()).optional(),
    isPublic: Joi.boolean().default(false)
});

export class MapsController {
    static async getPlacesWithCoordinates(req: Request, res: Response) {
        try {
            const filters = {
                category: req.query.category as string,
                bounds: req.query.bounds ? JSON.parse(req.query.bounds as string) : undefined,
                radius: req.query.radius ? parseFloat(req.query.radius as string) : undefined,
                center: req.query.center ? JSON.parse(req.query.center as string) : undefined
            };

            const places = await MapsService.getPlacesWithCoordinates(filters);

            res.json({
                success: true,
                data: places,
                count: places.length
            });
        } catch (error: any) {
            res.status(500).json({
                success: false,
                message: 'Erreur lors de la récupération des lieux',
                error: error.message
            });
        }
    }

    static async getActivitiesWithCoordinates(req: Request, res: Response) {
        try {
            const filters = {
                type: req.query.type as string,
                bounds: req.query.bounds ? JSON.parse(req.query.bounds as string) : undefined,
                radius: req.query.radius ? parseFloat(req.query.radius as string) : undefined,
                center: req.query.center ? JSON.parse(req.query.center as string) : undefined,
                startDate: req.query.startDate ? new Date(req.query.startDate as string) : undefined,
                endDate: req.query.endDate ? new Date(req.query.endDate as string) : undefined
            };

            const activities = await MapsService.getActivitiesWithCoordinates(filters);

            res.json({
                success: true,
                data: activities,
                count: activities.length
            });
        } catch (error: any) {
            res.status(500).json({
                success: false,
                message: 'Erreur lors de la récupération des activités',
                error: error.message
            });
        }
    }

    static async calculateRoute(req: Request, res: Response) {
        try {
            const { error, value } = Joi.object({
                points: Joi.array().items(routePointSchema).min(2).required(),
                type: Joi.string().valid('walking', 'cycling', 'driving').default('walking')
            }).validate(req.body);

            if (error) {
                return res.status(400).json({
                    success: false,
                    message: 'Données invalides',
                    errors: error.details
                });
            }

            const route = await MapsService.calculateRoute(value.points, value.type);

            return res.json({
                success: true,
                data: route
            });
        } catch (error: any) {
            return res.status(500).json({
                success: false,
                message: error.message
            });
        }
    }

    static async createCustomRoute(req: Request, res: Response) {
        try {
            const { error, value } = routeSchema.validate(req.body);

            if (error) {
                return res.status(400).json({
                    success: false,
                    message: 'Données invalides',
                    errors: error.details
                });
            }

            const route = await MapsService.createCustomRoute(value);

            return res.status(201).json({
                success: true,
                message: 'Itinéraire personnalisé créé avec succès',
                data: route
            });
        } catch (error: any) {
            return res.status(500).json({
                success: false,
                message: error.message
            });
        }
    }

    static async getPopularRoutes(req: Request, res: Response) {
        try {
            const limit = parseInt(req.query.limit as string) || 10;
            const routes = await MapsService.getPopularRoutes(limit);

            return res.json({
                success: true,
                data: routes
            });
        } catch (error: any) {
            return res.status(500).json({
                success: false,
                message: 'Erreur lors de la récupération des itinéraires populaires',
                error: error.message
            });
        }
    }

    static async getNearbyPOIs(req: Request, res: Response) {
        try {
            const { error, value } = Joi.object({
                latitude: Joi.number().min(-90).max(90).required(),
                longitude: Joi.number().min(-180).max(180).required(),
                radius: Joi.number().min(0.1).max(50).default(1),
                type: Joi.string().optional()
            }).validate(req.query);

            if (error) {
                return res.status(400).json({
                    success: false,
                    message: 'Coordonnées invalides',
                    errors: error.details
                });
            }

            const places = await MapsService.getNearbyPOIs(value.latitude, value.longitude);

            return res.json({
                success: true,
                data: places
            });
        } catch (error: any) {
            return res.status(500).json({
                success: false,
                message: 'Erreur lors de la récupération des POIs',
                error: error.message
            });
        }
    }

    static async getGeolocation(req: Request, res: Response) {
        try {
            const { error } = Joi.object({
                address: Joi.string().required()
            }).validate(req.query);

            if (error) {
                return res.status(400).json({
                    success: false,
                    message: 'Adresse invalide',
                    errors: error.details
                });
            }

            // Placeholder pour la géolocalisation
            const coordinates = { latitude: 49.4431, longitude: 1.0993 }; // Rouen par défaut

            return res.json({
                success: true,
                data: coordinates
            });
        } catch (error: any) {
            return res.status(500).json({
                success: false,
                message: 'Erreur lors de la géolocalisation',
                error: error.message
            });
        }
    }

    static async getUserRoutes(_req: Request, res: Response) {
        try {
            // En production, vous récupéreriez les routes de l'utilisateur depuis la base de données
            return res.json({
                success: true,
                data: [],
                message: 'Fonctionnalité à implémenter'
            });
        } catch (error: any) {
            return res.status(500).json({
                success: false,
                message: 'Erreur lors de la récupération des itinéraires utilisateur',
                error: error.message
            });
        }
    }
}

import { Request, Response } from 'express';
import { ActivitiesService } from '../services/activities.service';
import { AuthenticatedRequest } from '../middleware/clerk.middleware';
import Joi from 'joi';

const createActivitySchema = Joi.object({
    title: Joi.string().min(5).max(100).required(),
    description: Joi.string().min(20).max(500).required(),
    type: Joi.string().valid('RUNNING', 'WALKING', 'CYCLING', 'HIKING', 'CULTURAL_VISIT', 'TREASURE_HUNT', 'PHOTOGRAPHY', 'KAYAK', 'CLIMBING').required(),
    difficulty: Joi.string().valid('EASY', 'MEDIUM', 'HARD').required(),
    duration: Joi.number().min(15).max(480).required(), // 15min à 8h
    maxParticipants: Joi.number().min(2).max(50).required(),
    startDate: Joi.date().greater('now').required(),
    endDate: Joi.date().greater(Joi.ref('startDate')).optional(),
    meetingPoint: Joi.string().min(5).max(200).required(),
    latitude: Joi.number().min(-90).max(90).required(),
    longitude: Joi.number().min(-180).max(180).required(),
    image: Joi.string().uri().optional(),
    category: Joi.string().max(50).optional(),
    organizerName: Joi.string().max(100).optional(),
    organizerAvatar: Joi.string().uri().optional(),
    organizerRating: Joi.number().min(0).max(5).optional(),
    places: Joi.array().items(Joi.string()).optional()
});

export class ActivitiesController {
    static async getAllActivities(req: Request, res: Response) {
        try {
            const filters = {
                type: req.query.type as any,
                difficulty: req.query.difficulty as any,
                latitude: req.query.lat ? parseFloat(req.query.lat as string) : undefined,
                longitude: req.query.lng ? parseFloat(req.query.lng as string) : undefined,
                radius: req.query.radius ? parseFloat(req.query.radius as string) : undefined,
                startDate: req.query.startDate as string,
                endDate: req.query.endDate as string,
                search: req.query.search as string
            };

            const userId = (req as AuthenticatedRequest).auth?.userId;
            const activities = await ActivitiesService.getAllActivities(filters, userId);

            return res.json({
                success: true,
                data: activities
            });
        } catch (error: any) {
            return res.status(500).json({
                success: false,
                message: error.message
            });
        }
    }

    static async getActivityById(req: Request, res: Response) {
        try {
            const { id } = req.params;
            const userId = (req as AuthenticatedRequest).auth?.userId;

            const activity = await ActivitiesService.getActivityById(id, userId);

            return res.json({
                success: true,
                data: activity
            });
        } catch (error: any) {
            return res.status(404).json({
                success: false,
                message: error.message
            });
        }
    }

    static async createActivity(req: Request, res: Response) {
        try {
            const { error, value } = createActivitySchema.validate(req.body);

            if (error) {
                return res.status(400).json({
                    success: false,
                    message: 'Données invalides',
                    errors: error.details
                });
            }

            const userId = (req as AuthenticatedRequest).auth!.userId;
            const activity = await ActivitiesService.createActivity({
                ...value,
                createdBy: userId
            });

            return res.status(201).json({
                success: true,
                message: 'Activité créée avec succès',
                data: activity
            });
        } catch (error: any) {
            return res.status(500).json({
                success: false,
                message: error.message
            });
        }
    }

    static async registerToActivity(req: Request, res: Response) {
        try {
            const { id } = req.params;
            const userId = (req as AuthenticatedRequest).auth!.userId;

            const registration = await ActivitiesService.registerToActivity(userId, id);

            return res.json({
                success: true,
                message: 'Inscription réussie',
                data: registration
            });
        } catch (error: any) {
            return res.status(400).json({
                success: false,
                message: error.message
            });
        }
    }

    static async unregisterFromActivity(req: Request, res: Response) {
        try {
            const { id } = req.params;
            const userId = (req as AuthenticatedRequest).auth!.userId;

            await ActivitiesService.unregisterFromActivity(userId, id);

            return res.json({
                success: true,
                message: 'Désinscription réussie'
            });
        } catch (error: any) {
            return res.status(400).json({
                success: false,
                message: error.message
            });
        }
    }

    static async getUserRegisteredActivities(req: Request, res: Response) {
        try {
            const userId = (req as any).auth.userId;
            const activities = await ActivitiesService.getUserRegisteredActivities(userId);

            return res.json({
                success: true,
                data: activities
            });
        } catch (error: any) {
            return res.status(500).json({
                success: false,
                message: error.message
            });
        }
    }

    static async getUserActivities(req: Request, res: Response) {
        try {
            const userId = (req as AuthenticatedRequest).auth!.userId;
            const activities = await ActivitiesService.getUserActivities(userId);

            return res.json({
                success: true,
                data: activities
            });
        } catch (error: any) {
            return res.status(500).json({
                success: false,
                message: error.message
            });
        }
    }

    static async getRegistrationStatus(req: Request, res: Response) {
        try {
            const { id } = req.params;
            const userId = (req as AuthenticatedRequest).auth!.userId;

            const status = await ActivitiesService.getRegistrationStatus(userId, id);

            return res.json(status);
        } catch (error: any) {
            return res.status(500).json({
                success: false,
                message: error.message
            });
        }
    }

    static async updateActivity(req: Request, res: Response) {
        try {
            const { id } = req.params;
            const { error, value } = createActivitySchema.validate(req.body);

            if (error) {
                return res.status(400).json({
                    success: false,
                    message: 'Données invalides',
                    errors: error.details
                });
            }

            const userId = (req as AuthenticatedRequest).auth!.userId;
            const activity = await ActivitiesService.updateActivity(id, value, userId);

            return res.json({
                success: true,
                message: 'Activité modifiée avec succès',
                data: activity
            });
        } catch (error: any) {
            return res.status(500).json({
                success: false,
                message: error.message
            });
        }
    }

    static async deleteActivity(req: Request, res: Response) {
        try {
            const { id } = req.params;
            const userId = (req as AuthenticatedRequest).auth!.userId;

            await ActivitiesService.deleteActivity(id, userId);

            return res.json({
                success: true,
                message: 'Activité supprimée avec succès'
            });
        } catch (error: any) {
            return res.status(500).json({
                success: false,
                message: error.message
            });
        }
    }
}
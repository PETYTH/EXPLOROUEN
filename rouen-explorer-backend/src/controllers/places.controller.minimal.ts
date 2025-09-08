// ============================================
// ROUEN DISCOVERY - CONTROLLER PLACES (MINIMAL)
// ============================================

import { Request, Response } from 'express';
import { PlacesService } from '../services/places.service.minimal';

export class PlacesController {
    // ============================================
    // OBTENIR TOUS LES LIEUX
    // ============================================
    static async getAllPlaces(req: Request, res: Response) {
        try {
            const filters = {
                category: req.query.category as string,
                search: req.query.search as string
            };

            const pagination = {
                page: parseInt(req.query.page as string) || 1,
                limit: parseInt(req.query.limit as string) || 10
            };

            const result = await PlacesService.getAllPlaces(filters, pagination);

            res.status(200).json({
                success: true,
                data: result.places,
                pagination: result.pagination
            });

        } catch (error: any) {
            console.error('Erreur getAllPlaces:', error);
            res.status(500).json({
                success: false,
                message: error.message || 'Erreur serveur'
            });
        }
    }

    // ============================================
    // OBTENIR UN LIEU PAR ID
    // ============================================
    static async getPlaceById(req: Request, res: Response) {
        try {
            const { id } = req.params;
            const place = await PlacesService.getPlaceById(id);

            res.status(200).json({
                success: true,
                data: place
            });

        } catch (error: any) {
            console.error('Erreur getPlaceById:', error);
            res.status(error.message === 'Lieu non trouvé' ? 404 : 500).json({
                success: false,
                message: error.message || 'Erreur serveur'
            });
        }
    }

    // ============================================
    // CRÉER UN NOUVEAU LIEU
    // ============================================
    static async createPlace(req: Request, res: Response) {
        try {
            const placeData = req.body;
            const place = await PlacesService.createPlace(placeData);

            res.status(201).json({
                success: true,
                data: place,
                message: 'Lieu créé avec succès'
            });

        } catch (error: any) {
            console.error('Erreur createPlace:', error);
            res.status(500).json({
                success: false,
                message: error.message || 'Erreur serveur'
            });
        }
    }

    // ============================================
    // METTRE À JOUR UN LIEU
    // ============================================
    static async updatePlace(req: Request, res: Response) {
        try {
            const { id } = req.params;
            const updateData = req.body;
            const userId = (req as any).auth?.userId; // Récupérer l'ID utilisateur depuis le middleware auth
            
            const place = await PlacesService.updatePlace(id, updateData, userId);

            res.status(200).json({
                success: true,
                data: place,
                message: 'Lieu mis à jour avec succès'
            });

        } catch (error: any) {
            console.error('Erreur updatePlace:', error);
            const statusCode = error.message === 'Lieu non trouvé' ? 404 : 
                              error.message.includes('droits') ? 403 : 500;
            res.status(statusCode).json({
                success: false,
                message: error.message || 'Erreur serveur'
            });
        }
    }

    // ============================================
    // SUPPRIMER UN LIEU
    // ============================================
    static async deletePlace(req: Request, res: Response) {
        try {
            const { id } = req.params;
            await PlacesService.deletePlace(id);

            res.status(200).json({
                success: true,
                message: 'Lieu supprimé avec succès'
            });

        } catch (error: any) {
            console.error('Erreur deletePlace:', error);
            res.status(error.message === 'Lieu non trouvé' ? 404 : 500).json({
                success: false,
                message: error.message || 'Erreur serveur'
            });
        }
    }

    // ============================================
    // PLACEHOLDER POUR FONCTIONNALITÉS FUTURES
    // ============================================
    static async addToFavorites(_req: Request, res: Response) {
        res.status(501).json({
            success: false,
            message: 'Fonctionnalité en développement'
        });
    }

    static async addReview(_req: Request, res: Response) {
        res.status(501).json({
            success: false,
            message: 'Fonctionnalité en développement'
        });
    }
}

export default PlacesController;

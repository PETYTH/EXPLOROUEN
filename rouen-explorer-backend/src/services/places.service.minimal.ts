// ============================================
// ROUEN DISCOVERY - SERVICE PLACES (MINIMAL)
// ============================================

import { prisma } from '../utils/database';

export class PlacesService {
    // ============================================
    // OBTENIR TOUS LES LIEUX
    // ============================================
    static async getAllPlaces(filters: any = {}, pagination: any = {}) {
        try {
            const { page = 1, limit = 10 } = pagination;
            const offset = (page - 1) * limit;

            const places = await prisma.place.findMany({
                where: {
                    isActive: true,
                    ...(filters.category && { category: filters.category })
                },
                include: {
                    reviews: {
                        select: {
                            id: true,
                            rating: true,
                            comment: true,
                            createdAt: true,
                            userId: true
                        },
                        orderBy: { createdAt: 'desc' },
                        take: 3
                    },
                    _count: {
                        select: {
                            reviews: true,
                            favorites: true
                        }
                    }
                },
                orderBy: { createdAt: 'desc' },
                skip: offset,
                take: limit
            });

            const total = await prisma.place.count({
                where: {
                    isActive: true,
                    ...(filters.category && { category: filters.category })
                }
            });

            return {
                places,
                pagination: {
                    page,
                    limit,
                    total,
                    pages: Math.ceil(total / limit)
                }
            };

        } catch (error) {
            console.error('Erreur getAllPlaces:', error);
            throw error;
        }
    }

    // ============================================
    // OBTENIR UN LIEU PAR ID
    // ============================================
    static async getPlaceById(placeId: string) {
        try {
            const place = await prisma.place.findUnique({
                where: {
                    id: placeId,
                    isActive: true
                },
                include: {
                    reviews: {
                        select: {
                            id: true,
                            rating: true,
                            comment: true,
                            createdAt: true,
                            userId: true
                        },
                        orderBy: { createdAt: 'desc' }
                    },
                    _count: {
                        select: {
                            reviews: true,
                            favorites: true
                        }
                    }
                }
            });

            if (!place) {
                throw new Error('Lieu non trouvé');
            }

            return place;

        } catch (error) {
            console.error('Erreur getPlaceById:', error);
            throw error;
        }
    }

    // ============================================
    // CRÉER UN NOUVEAU LIEU
    // ============================================
    static async createPlace(placeData: any) {
        try {
            const place = await prisma.place.create({
                data: {
                    ...placeData,
                    isActive: true
                },
                include: {
                    reviews: true
                }
            });

            return place;

        } catch (error) {
            console.error('Erreur createPlace:', error);
            throw error;
        }
    }

    // ============================================
    // METTRE À JOUR UN LIEU
    // ============================================
    static async updatePlace(placeId: string, updateData: any, userId?: string) {
        try {
            const place = await prisma.place.findUnique({
                where: { id: placeId }
            });

            if (!place) {
                throw new Error('Lieu non trouvé');
            }

            // Vérifier les droits de modification si userId fourni
            // Note: Le modèle Place n'a pas de champ createdBy dans le schéma actuel
            // Pour l'instant, on permet la modification à tous les utilisateurs authentifiés
            // TODO: Ajouter un champ createdBy au modèle Place si nécessaire
            if (userId) {
                const { isUserAdmin } = await import('../utils/roleCheck');
                const isAdmin = await isUserAdmin(userId);
                
                // Seuls les admins peuvent modifier les lieux pour l'instant
                if (!isAdmin) {
                    throw new Error('Seuls les administrateurs peuvent modifier les lieux');
                }
            }

            const updatedPlace = await prisma.place.update({
                where: { id: placeId },
                data: {
                    ...updateData,
                    updatedAt: new Date()
                }
            });

            return updatedPlace;

        } catch (error) {
            console.error('Erreur updatePlace:', error);
            throw error;
        }
    }

    // ============================================
    // SUPPRIMER UN LIEU (soft delete)
    // ============================================
    static async deletePlace(placeId: string) {
        try {
            const place = await prisma.place.findUnique({
                where: { id: placeId }
            });

            if (!place) {
                throw new Error('Lieu non trouvé');
            }

            await prisma.place.update({
                where: { id: placeId },
                data: { isActive: false }
            });

            return { success: true };

        } catch (error) {
            console.error('Erreur deletePlace:', error);
            throw error;
        }
    }

    // ============================================
    // RECHERCHE GÉOGRAPHIQUE SIMPLE
    // ============================================
    static async searchNearby(_latitude: number, _longitude: number, _radius: number = 5000): Promise<any[]> {
        try {
            const places = await prisma.place.findMany({
                where: { isActive: true },
                include: {
                    _count: {
                        select: {
                            reviews: true,
                            favorites: true
                        }
                    }
                },
                take: 20
            });

            return places;

        } catch (error: any) {
            console.error('Erreur searchNearby:', error);
            throw error;
        }
    }
}

export default PlacesService;

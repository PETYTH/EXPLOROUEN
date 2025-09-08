// src/services/activities.service.ts
import { prisma } from '../utils/database';
import { getCache, setCache } from '../utils/redis';

interface ActivityFilters {
    type?: string;
    difficulty?: string;
    latitude?: number;
    longitude?: number;
    radius?: number;
    startDate?: string;
    endDate?: string;
    search?: string;
}

interface CreateActivityData {
    title: string;
    description: string;
    type: string;
    difficulty: string;
    duration: number;
    maxParticipants: number;
    startDate: Date;
    endDate?: Date;
    meetingPoint: string;
    latitude: number;
    longitude: number;
    createdBy: string;
    image?: string;
    category?: string;
    organizerName?: string;
    organizerAvatar?: string;
    organizerRating?: number;
    places?: string[]; // IDs des lieux liés
}

interface UpdateActivityData {
    title?: string;
    description?: string;
    type?: string;
    difficulty?: string;
    duration?: number;
    maxParticipants?: number;
    startDate?: Date;
    endDate?: Date;
    meetingPoint?: string;
    latitude?: number;
    longitude?: number;
    image?: string;
    category?: string;
    organizerName?: string;
    organizerAvatar?: string;
    organizerRating?: number;
}

export class ActivitiesService {
    static async getAllActivities(filters: ActivityFilters = {}, userId?: string) {
        const cacheKey = `activities:${JSON.stringify(filters)}:${userId || 'anonymous'}`;
        const cached = await getCache(cacheKey);

        if (cached) {
            return cached;
        }

        let whereClause: any = {
            isActive: true
            // Temporairement désactivé pour voir toutes les activités
            // startDate: {
            //     gte: new Date() // Seulement les activités futures
            // }
        };

        // Filtres
        if (filters.type) {
            whereClause.type = filters.type;
        }

        if (filters.difficulty) {
            whereClause.difficulty = filters.difficulty;
        }

        if (filters.search) {
            whereClause.OR = [
                { title: { contains: filters.search } },
                { description: { contains: filters.search } },
                { meetingPoint: { contains: filters.search } }
            ];
        }

        if (filters.startDate && filters.endDate) {
            whereClause.startDate = {
                gte: new Date(filters.startDate),
                lte: new Date(filters.endDate)
            };
        }

        const activities = await prisma.activity.findMany({
            where: whereClause,
            include: {
                discussion: {
                    select: {
                        id: true
                    }
                },
                places: {
                    include: {
                        place: {
                            select: {
                                id: true,
                                name: true,
                                category: true
                            }
                        }
                    }
                },
            },
            orderBy: {
                startDate: 'asc'
            }
        });

        // Calcul de la distance et ajout d'infos utilisateur
        const activitiesWithDistance = (await Promise.all(activities.map(async activity => {
            let distance = null;
            if (filters.latitude && filters.longitude) {
                distance = this.calculateDistance(
                    filters.latitude,
                    filters.longitude,
                    activity.latitude,
                    activity.longitude
                );
            }

            // Récupérer les inscriptions pour cette activité
            const registrations = await prisma.registration.findMany({
                where: {
                    itemId: activity.id,
                    type: 'ACTIVITY',
                    status: 'ACCEPTED'
                }
            });

            const userRegistration = userId ?
                registrations.find(reg => reg.userId === userId) : null;

            return {
                ...activity,
                distance,
                participantsCount: registrations.length,
                isRegistered: !!userRegistration,
                registrationStatus: userRegistration?.status || null,
                messagesCount: 0
            };
        }))).filter(activity => {
            if (filters.radius && activity.distance !== null) {
                return activity.distance <= filters.radius;
            }
            return true;
        });

        // Cache pour 5 minutes
        await setCache(cacheKey, activitiesWithDistance, 300);

        return activitiesWithDistance;
    }

    static async getActivityById(id: string, userId?: string) {
        const activity = await prisma.activity.findUnique({
            where: { id },
            include: {
                discussion: {
                    include: {
                        messages: {
                            select: {
                                id: true,
                                userId: true,
                                content: true,
                                messageType: true,
                                createdAt: true
                            },
                            orderBy: {
                                createdAt: 'desc'
                            },
                            take: 10
                        }
                    }
                },
                places: {
                    include: {
                        place: true
                    },
                    orderBy: {
                        order: 'asc'
                    }
                }
            }
        });

        if (!activity) {
            throw new Error('Activité non trouvée');
        }

        // Récupérer les inscriptions séparément
        const registrations = await prisma.registration.findMany({
            where: {
                itemId: id,
                type: 'ACTIVITY',
                status: 'ACCEPTED'
            },
            select: {
                userId: true,
                status: true
            }
        });

        const userRegistration = userId ?
            registrations.find(reg => reg.userId === userId) : null;

        return {
            ...activity,
            isRegistered: !!userRegistration,
            registrationStatus: userRegistration ? 'ACCEPTED' : null,
            participants: registrations.map(reg => ({ id: reg.userId })),
            participantsCount: registrations.length
        };
    }

    static async createActivity(data: CreateActivityData) {
        const activity = await prisma.activity.create({
            data: {
                title: data.title,
                description: data.description,
                type: data.type,
                difficulty: data.difficulty,
                duration: data.duration,
                maxParticipants: data.maxParticipants,
                startDate: data.startDate,
                endDate: data.endDate,
                meetingPoint: data.meetingPoint,
                latitude: data.latitude,
                longitude: data.longitude,
                createdBy: data.createdBy,
                image: data.image,
                category: data.category,
                organizerName: data.organizerName,
                organizerAvatar: data.organizerAvatar,
                organizerRating: data.organizerRating
            }
        });

        // Créer la discussion associée
        await prisma.discussion.create({
            data: {
                activityId: activity.id,
                title: `Discussion - ${activity.title}`
            }
        });

        // Associer les lieux si fournis
        if (data.places && data.places.length > 0) {
            const activityPlaces = data.places.map((placeId, index) => ({
                activityId: activity.id,
                placeId,
                order: index + 1
            }));

            await prisma.activityPlace.createMany({
                data: activityPlaces
            });
        }

        return activity;
    }

    static async registerToActivity(userId: string, activityId: string) {
        // Vérifier que l'activité existe et n'est pas complète
        const activity = await prisma.activity.findUnique({
            where: { id: activityId },
            select: {
                id: true,
                maxParticipants: true,
                startDate: true
            }
        });

        if (!activity) {
            throw new Error('Activité non trouvée');
        }

        // Compter les inscriptions séparément
        const registrationCount = await prisma.registration.count({
            where: {
                itemId: activityId,
                type: 'ACTIVITY',
                status: 'ACCEPTED'
            }
        });

        if (registrationCount >= activity.maxParticipants) {
            throw new Error('Activité complète');
        }

        if (activity.startDate < new Date()) {
            throw new Error('Impossible de s\'inscrire à une activité passée');
        }

        // Vérifier si déjà inscrit
        const existingRegistration = await prisma.registration.findUnique({
            where: {
                userId_itemId_type: {
                    userId,
                    itemId: activityId,
                    type: 'ACTIVITY'
                }
            }
        });

        if (existingRegistration) {
            throw new Error('Déjà inscrit à cette activité');
        }

        // Créer l'inscription
        const registration = await prisma.registration.create({
            data: {
                userId,
                itemId: activityId,
                type: 'ACTIVITY',
                status: 'ACCEPTED' // Auto-acceptation pour les activités
            }
        });

        // Créer ou récupérer la discussion pour cette activité
        let discussion = await prisma.discussion.findUnique({
            where: { activityId }
        });

        if (!discussion) {
            discussion = await prisma.discussion.create({
                data: {
                    activityId,
                    title: `Chat - Activité ${activityId}`
                }
            });
        }

        return registration;
    }

    static async unregisterFromActivity(userId: string, activityId: string) {
        const registration = await prisma.registration.findUnique({
            where: {
                userId_itemId_type: {
                    userId,
                    itemId: activityId,
                    type: 'ACTIVITY'
                }
            }
        });

        if (!registration) {
            throw new Error('Non inscrit à cette activité');
        }

        // Supprimer tous les messages de l'utilisateur dans la discussion de l'activité
        const discussion = await prisma.discussion.findUnique({
            where: { activityId }
        });

        if (discussion) {
            // Supprimer tous les messages de cet utilisateur dans cette discussion
            await prisma.discussionMessage.deleteMany({
                where: {
                    discussionId: discussion.id,
                    userId
                }
            });
        }

        // Supprimer l'inscription
        await prisma.registration.delete({
            where: { id: registration.id }
        });

        // Vérifier s'il reste des participants dans l'activité
        const remainingRegistrations = await prisma.registration.count({
            where: {
                itemId: activityId,
                type: 'ACTIVITY',
                status: 'ACCEPTED'
            }
        });

        // Si plus personne n'est inscrit, supprimer la discussion
        if (remainingRegistrations === 0 && discussion) {
            await prisma.discussionMessage.deleteMany({
                where: { discussionId: discussion.id }
            });
            await prisma.discussion.delete({
                where: { id: discussion.id }
            });
        }

        return { success: true, message: 'Désinscription réussie' };
    }

    static async getUserRegisteredActivities(userId: string) {
        try {
            // Récupérer les inscriptions de l'utilisateur
            const registrations = await prisma.registration.findMany({
                where: {
                    userId: userId,
                    type: 'ACTIVITY'
                },
            });

            // Récupérer les activités correspondantes
            const activityIds = registrations.map(reg => reg.itemId);
            const activities = await prisma.activity.findMany({
                where: {
                    id: {
                        in: activityIds
                    }
                }
            });

            return activities;
        } catch (error) {
            console.error('Erreur lors de la récupération des activités utilisateur:', error);
            throw new Error('Impossible de récupérer les activités de l\'utilisateur');
        }
    }

    static async getUserActivities(userId: string) {
        const registrations = await prisma.registration.findMany({
            where: {
                userId,
                type: 'ACTIVITY'
            },
            orderBy: {
                createdAt: 'desc'
            }
        });

        // Récupérer les activités séparément
        const activityIds = registrations.map(reg => reg.itemId);
        
        const activities = await prisma.activity.findMany({
            where: {
                id: {
                    in: activityIds
                }
            }
        });

        // Mapper les résultats avec comptage des participants
        const result = [];
        for (const reg of registrations) {
            const activity = activities.find(act => act.id === reg.itemId);
            if (activity) {
                // Compter les participants pour cette activité
                const participantsCount = await prisma.registration.count({
                    where: {
                        itemId: activity.id,
                        type: 'ACTIVITY',
                        status: 'ACCEPTED'
                    }
                });

                result.push({
                    ...activity,
                    registrationStatus: reg.status,
                    participantsCount
                });
            }
        }
        return result;
    }

    static async getRegistrationStatus(userId: string, activityId: string) {
        const registration = await prisma.registration.findUnique({
            where: {
                userId_itemId_type: {
                    userId,
                    itemId: activityId,
                    type: 'ACTIVITY'
                }
            }
        });

        if (!registration) {
            return { isRegistered: false };
        }

        return {
            isRegistered: true,
            registrationId: registration.id,
            registrationDate: registration.createdAt,
            status: registration.status
        };
    }

    private static calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
        const R = 6371; // Rayon de la Terre en km
        const dLat = this.deg2rad(lat2 - lat1);
        const dLon = this.deg2rad(lon2 - lon1);
        const a =
            Math.sin(dLat/2) * Math.sin(dLat/2) +
            Math.cos(this.deg2rad(lat1)) * Math.cos(this.deg2rad(lat2)) *
            Math.sin(dLon/2) * Math.sin(dLon/2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
        return R * c;
    }

    private static deg2rad(deg: number): number {
        return deg * (Math.PI/180);
    }

    static async deleteActivity(activityId: string, _userId: string) {
        // Récupérer l'activité et ses participants
        const activity = await prisma.activity.findUnique({
            where: { id: activityId }
        });

        if (!activity) {
            throw new Error('Activité non trouvée');
        }

        // Récupérer tous les participants inscrits
        const registrations = await prisma.registration.findMany({
            where: {
                itemId: activityId,
                type: 'ACTIVITY'
            }
        });

        const participants = registrations.map((reg: any) => reg.userId);

        // 1. Supprimer les discussions liées à l'activité
        await prisma.discussion.deleteMany({
            where: {
                activityId: activityId
            }
        });

        // 2. Supprimer les messages des discussions liées
        await prisma.discussionMessage.deleteMany({
            where: {
                discussion: {
                    activityId: activityId
                }
            }
        });

        // 3. Log de suppression (pas de notifications pour l'instant)
        // Activité supprimée avec participants notifiés

        // 4. Supprimer les inscriptions
        await prisma.registration.deleteMany({
            where: {
                itemId: activityId,
                type: 'ACTIVITY'
            }
        });

        // 5. Supprimer l'activité
        await prisma.activity.delete({
            where: { id: activityId }
        });

        // 6. Invalider le cache
        // TODO: Implémenter l'invalidation du cache Redis si nécessaire

        return { success: true, participantsNotified: participants.length };
    }

    static async updateActivity(activityId: string, data: UpdateActivityData, userId: string) {
        // Vérifier que l'activité existe et que l'utilisateur a le droit de la modifier
        const existingActivity = await prisma.activity.findUnique({
            where: { id: activityId }
        });

        if (!existingActivity) {
            throw new Error('Activité non trouvée');
        }

        // Vérifier que l'utilisateur est le créateur ou un admin
        const { canUserModifyResource } = await import('../utils/roleCheck');
        const canModify = await canUserModifyResource(userId, existingActivity.createdBy);
        
        if (!canModify) {
            throw new Error('Vous n\'avez pas les droits pour modifier cette activité');
        }

        // Mettre à jour l'activité
        const updatedActivity = await prisma.activity.update({
            where: { id: activityId },
            data: {
                ...data,
                updatedAt: new Date()
            },
            include: {
                discussion: true,
                places: {
                    include: {
                        place: true
                    }
                }
            }
        });

        return updatedActivity;
    }
}
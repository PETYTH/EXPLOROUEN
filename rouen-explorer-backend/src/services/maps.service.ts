// src/services/maps.service.ts
// import axios from 'axios';
import { prisma } from '../utils/database';

export interface Coordinates {
    latitude: number;
    longitude: number;
}

export interface RoutePoint extends Coordinates {
    name?: string;
    description?: string;
    type?: 'start' | 'waypoint' | 'end' | 'poi';
}

export interface Route {
    id: string;
    name: string;
    description: string;
    points: RoutePoint[];
    distance: number; // en mètres
    duration: number; // en secondes
    difficulty: 'easy' | 'medium' | 'hard';
    type: 'walking' | 'cycling' | 'driving';
    elevationGain?: number;
    tags: string[];
    createdBy: string;
    isPublic: boolean;
    createdAt: Date;
    updatedAt: Date;
}

export class MapsService {
    // Coordonnées du centre de Rouen
    static readonly ROUEN_CENTER: Coordinates = {
        latitude: 49.4431,
        longitude: 1.0993
    };

    // Limites géographiques de Rouen et environs
    static readonly ROUEN_BOUNDS = {
        north: 49.4800,
        south: 49.4000,
        east: 1.1500,
        west: 1.0500
    };

    static async getPlacesWithCoordinates(filters: {
        category?: string;
        bounds?: { north: number; south: number; east: number; west: number };
        radius?: number; // en km
        center?: Coordinates;
    } = {}) {
        const { category, bounds, radius, center } = filters;
        
        let whereClause: any = { isActive: true };
        
        if (category) {
            whereClause.category = category;
        }

        const places = await prisma.place.findMany({
            where: whereClause,
            select: {
                id: true,
                name: true,
                description: true,
                address: true,
                latitude: true,
                longitude: true,
                category: true,
                images: true,
                estimatedDuration: true,
                entryPrice: true,
                website: true,
                phone: true
            }
        });

        // Filtrer par bounds si spécifié
        let filteredPlaces = places;
        if (bounds) {
            filteredPlaces = places.filter(place => 
                place.latitude >= bounds.south &&
                place.latitude <= bounds.north &&
                place.longitude >= bounds.west &&
                place.longitude <= bounds.east
            );
        }

        // Filtrer par rayon si spécifié
        if (radius && center) {
            filteredPlaces = filteredPlaces.filter(place => {
                const distance = this.calculateDistance(
                    center,
                    { latitude: place.latitude, longitude: place.longitude }
                );
                return distance <= radius;
            });
        }

        return filteredPlaces.map(place => ({
            ...place,
            coordinates: {
                latitude: place.latitude,
                longitude: place.longitude
            }
        }));
    }

    static async getActivitiesWithCoordinates(filters: {
        type?: string;
        bounds?: { north: number; south: number; east: number; west: number };
        radius?: number;
        center?: Coordinates;
        startDate?: Date;
        endDate?: Date;
    } = {}) {
        const { type, bounds, radius, center, startDate, endDate } = filters;
        
        let whereClause: any = { 
            isActive: true,
            startDate: { gte: new Date() }
        };
        
        if (type) whereClause.type = type;
        if (startDate) whereClause.startDate = { gte: startDate };
        if (endDate) whereClause.startDate = { ...whereClause.startDate, lte: endDate };

        const activities = await prisma.activity.findMany({
            where: whereClause,
            select: {
                id: true,
                title: true,
                description: true,
                type: true,
                difficulty: true,
                duration: true,
                distance: true,
                latitude: true,
                longitude: true,
                meetingPoint: true,
                startDate: true,
                endDate: true,
                price: true,
                maxParticipants: true,
            }
        });

        // Appliquer les filtres géographiques
        let filteredActivities = activities;
        if (bounds) {
            filteredActivities = activities.filter(activity => 
                activity.latitude >= bounds.south &&
                activity.latitude <= bounds.north &&
                activity.longitude >= bounds.west &&
                activity.longitude <= bounds.east
            );
        }

        if (radius && center) {
            filteredActivities = filteredActivities.filter(activity => {
                const distance = this.calculateDistance(
                    center,
                    { latitude: activity.latitude, longitude: activity.longitude }
                );
                return distance <= radius;
            });
        }

        return filteredActivities.map(activity => ({
            ...activity,
            coordinates: {
                latitude: activity.latitude,
                longitude: activity.longitude
            },
            availableSpots: activity.maxParticipants
        }));
    }

    static async calculateRoute(points: RoutePoint[], routeType: 'walking' | 'cycling' | 'driving' = 'walking'): Promise<{
        coordinates: Coordinates[];
        distance: number;
        duration: number;
        elevationGain?: number;
    }> {
        // Simulation d'un calcul d'itinéraire
        // En production, vous utiliseriez une API comme JawgMaps, OpenRouteService, etc.
        
        if (points.length < 2) {
            throw new Error('Au moins 2 points sont nécessaires pour calculer un itinéraire');
        }

        let totalDistance = 0;
        let totalDuration = 0;
        const coordinates: Coordinates[] = [];

        for (let i = 0; i < points.length - 1; i++) {
            const start = points[i];
            const end = points[i + 1];
            
            const segmentDistance = this.calculateDistance(start, end);
            totalDistance += segmentDistance;
            
            // Estimation de la durée selon le type de transport
            let speed: number; // km/h
            switch (routeType) {
                case 'walking':
                    speed = 5;
                    break;
                case 'cycling':
                    speed = 15;
                    break;
                case 'driving':
                    speed = 30; // vitesse réduite en ville
                    break;
            }
            
            totalDuration += (segmentDistance / speed) * 3600; // en secondes
            
            // Ajouter les points intermédiaires (simulation)
            coordinates.push(start);
            if (i === points.length - 2) {
                coordinates.push(end);
            }
        }

        return {
            coordinates,
            distance: Math.round(totalDistance * 1000), // en mètres
            duration: Math.round(totalDuration),
            elevationGain: Math.round(Math.random() * 100) // Simulation
        };
    }

    static calculateDistance(point1: Coordinates, point2: Coordinates): number {
        const R = 6371; // Rayon de la Terre en km
        const dLat = this.toRadians(point2.latitude - point1.latitude);
        const dLon = this.toRadians(point2.longitude - point1.longitude);
        
        const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
                  Math.cos(this.toRadians(point1.latitude)) * 
                  Math.cos(this.toRadians(point2.latitude)) *
                  Math.sin(dLon / 2) * Math.sin(dLon / 2);
        
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return R * c; // Distance en km
    }

    private static toRadians(degrees: number): number {
        return degrees * (Math.PI / 180);
    }

    static async createCustomRoute(routeData: {
        name: string;
        description: string;
        points: RoutePoint[];
        type: 'walking' | 'cycling' | 'driving';
        difficulty: 'easy' | 'medium' | 'hard';
        tags: string[];
        createdBy: string;
        isPublic: boolean;
    }): Promise<Route> {
        const routeCalculation = await this.calculateRoute(routeData.points, routeData.type);
        
        const route: Route = {
            id: `route_${Date.now()}`,
            ...routeData,
            distance: routeCalculation.distance,
            duration: routeCalculation.duration,
            elevationGain: routeCalculation.elevationGain,
            createdAt: new Date(),
            updatedAt: new Date()
        };

        // En production, vous sauvegarderiez cela dans une base de données
        return route;
    }

    static async getPopularRoutes(limit: number = 10): Promise<Route[]> {
        // Simulation de routes populaires autour de Rouen
        const popularRoutes: Route[] = [
            {
                id: 'route_cathedral_circuit',
                name: 'Circuit des Cathédrales',
                description: 'Découvrez les plus belles cathédrales de Rouen',
                points: [
                    { latitude: 49.4431, longitude: 1.0993, name: 'Place du Vieux-Marché', type: 'start' },
                    { latitude: 49.4404, longitude: 1.0955, name: 'Cathédrale Notre-Dame', type: 'waypoint' },
                    { latitude: 49.4425, longitude: 1.0987, name: 'Gros-Horloge', type: 'waypoint' },
                    { latitude: 49.4431, longitude: 1.0993, name: 'Place du Vieux-Marché', type: 'end' }
                ],
                distance: 2500,
                duration: 1800,
                difficulty: 'easy',
                type: 'walking',
                elevationGain: 25,
                tags: ['patrimoine', 'histoire', 'architecture'],
                createdBy: 'system',
                isPublic: true,
                createdAt: new Date(),
                updatedAt: new Date()
            },
            {
                id: 'route_seine_promenade',
                name: 'Promenade des Quais de Seine',
                description: 'Une balade relaxante le long de la Seine',
                points: [
                    { latitude: 49.4350, longitude: 1.0850, name: 'Quai Bas Rive Droite', type: 'start' },
                    { latitude: 49.4380, longitude: 1.0920, name: 'Pont Boieldieu', type: 'waypoint' },
                    { latitude: 49.4420, longitude: 1.1050, name: 'Île Lacroix', type: 'end' }
                ],
                distance: 3200,
                duration: 2400,
                difficulty: 'easy',
                type: 'walking',
                elevationGain: 10,
                tags: ['nature', 'seine', 'détente'],
                createdBy: 'system',
                isPublic: true,
                createdAt: new Date(),
                updatedAt: new Date()
            }
        ];

        return popularRoutes.slice(0, limit);
    }

    static async getNearbyPOIs(center: Coordinates, radius: number = 1): Promise<any[]> {
        const places = await this.getPlacesWithCoordinates({
            center,
            radius
        });

        return places.map(place => ({
            id: place.id,
            name: place.name,
            type: 'place',
            category: place.category,
            coordinates: place.coordinates,
            distance: this.calculateDistance(center, place.coordinates)
        }));
    }
}

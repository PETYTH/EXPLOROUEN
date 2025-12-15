import Redis from 'ioredis';
import { config } from '../config';

// Configuration Redis avec gestion d'erreur gracieuse
let redis: Redis | null = null;

// Redis optionnel - fonctionne sans si non disponible
if (config.redis.url && config.redis.url !== 'redis://127.0.0.1:6379') {
    try {
        redis = new Redis(config.redis.url, {
            maxRetriesPerRequest: 1,
            retryStrategy: () => null, // Ne pas réessayer
            lazyConnect: true,
            connectTimeout: 3000,
            enableReadyCheck: false,
            enableOfflineQueue: false
        });

        redis.on('connect', () => {
            console.log('✅ Redis connecté');
        });

        redis.on('error', (error) => {
            // Silencieux en production pour éviter les logs en boucle
            if (config.nodeEnv !== 'production') {
                console.warn('⚠️ Redis non disponible (mode dégradé):', error.message);
            }
            redis = null;
        });

        redis.on('close', () => {
            redis = null;
        });
    } catch (error) {
        redis = null;
    }
} else {
    console.log('⚠️ Redis désactivé - Fonctionnement sans cache');
    redis = null;
}

export const setCache = async (key: string, value: any, ttl: number = 3600) => {
    if (!redis) return;
    try {
        await redis.setex(key, ttl, JSON.stringify(value));
    } catch (error) {
        console.error('Erreur cache Redis:', error);
    }
};

export const getCache = async (key: string) => {
    if (!redis) return null;
    try {
        const value = await redis.get(key);
        return value ? JSON.parse(value) : null;
    } catch (error) {
        console.error('Erreur récupération cache:', error);
        return null;
    }
};

export const deleteCache = async (key: string) => {
    if (!redis) return;
    try {
        await redis.del(key);
    } catch (error) {
        console.error('Erreur suppression cache:', error);
    }
};

export const clearCachePattern = async (pattern: string) => {
    if (!redis) return;
    try {
        const keys = await redis.keys(pattern);
        if (keys.length > 0) {
            await redis.del(...keys);
        }
    } catch (error) {
        console.error('Erreur nettoyage cache:', error);
    }
};

export { redis };

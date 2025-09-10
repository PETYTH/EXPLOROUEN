import Redis from 'ioredis';
import { config } from '../config';

class RedisClient {
    private client: Redis;
    private static instance: RedisClient;

    private constructor() {
        this.client = new Redis(config.redis.url, {
            retryStrategy: (times) => {
                const delay = Math.min(times * 50, 2000);
                return delay;
            },
            maxRetriesPerRequest: null,
            enableReadyCheck: true,
            connectTimeout: 10000
        });

        this.client.on('error', (error) => {
            console.error('❌ Erreur Redis:', error);
        });

        this.client.on('connect', () => {
            console.log('✅ Connecté à Redis');
        });
    }

    public static getInstance(): RedisClient {
        if (!RedisClient.instance) {
            RedisClient.instance = new RedisClient();
        }
        return RedisClient.instance;
    }

    public async set(
        key: string,
        value: string | number | Buffer,
        ttlInSeconds?: number
    ): Promise<'OK' | null> {
        try {
            if (ttlInSeconds) {
                return await this.client.set(key, value, 'EX', ttlInSeconds);
            }
            return await this.client.set(key, value);
        } catch (error) {
            console.error('Erreur Redis set:', error);
            return null;
        }
    }

    public async get(key: string): Promise<string | null> {
        try {
            return await this.client.get(key);
        } catch (error) {
            console.error('Erreur Redis get:', error);
            return null;
        }
    }

    public async del(key: string): Promise<number> {
        try {
            return await this.client.del(key);
        } catch (error) {
            console.error('Erreur Redis del:', error);
            return 0;
        }
    }

    public async flushAll(): Promise<'OK'> {
        return await this.client.flushall();
    }

    public async quit(): Promise<'OK'> {
        return await this.client.quit();
    }

    public getClient(): Redis {
        return this.client;
    }

    // Méthode pour obtenir des données en cache
    public async getCache(key: string): Promise<any> {
        try {
            const data = await this.client.get(key);
            return data ? JSON.parse(data) : null;
        } catch (error) {
            console.error('Erreur lors de la récupération du cache:', error);
            return null;
        }
    }

    // Méthode pour mettre en cache des données
    public async setCache(key: string, value: any, ttlSeconds: number = 300): Promise<boolean> {
        try {
            await this.client.set(
                key,
                JSON.stringify(value),
                'EX',
                ttlSeconds
            );
            return true;
        } catch (error) {
            console.error('Erreur lors de la mise en cache:', error);
            return false;
        }
    }
}

const redisClient = RedisClient.getInstance();

// Fonctions d'aide pour la compatibilité avec le code existant
export const getCache = (key: string) => redisClient.getCache(key);
export const setCache = (key: string, value: any, ttlSeconds: number = 300) => 
    redisClient.setCache(key, value, ttlSeconds);

export const redis = redisClient;

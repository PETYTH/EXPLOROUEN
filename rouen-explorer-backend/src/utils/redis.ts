import Redis from 'ioredis';
import { config } from '../config';

class RedisClient {
    private client: Redis | null = null;
    private static instance: RedisClient;
    private isEnabled: boolean = false;

    private constructor() {
        // Vérifier si Redis est configuré et disponible
        if (config.redis.url && config.redis.url !== 'redis://localhost:6379') {
            try {
                this.client = new Redis(config.redis.url, {
                    retryStrategy: (times) => {
                        const delay = Math.min(times * 50, 2000);
                        return delay;
                    },
                    maxRetriesPerRequest: 3,
                    lazyConnect: true
                });

                this.client.on('error', (error) => {
                    console.warn('⚠️ Redis non disponible:', error.message);
                    this.isEnabled = false;
                });

                this.client.on('connect', () => {
                    console.log('✅ Connecté à Redis');
                    this.isEnabled = true;
                });

                this.isEnabled = true;
            } catch (error) {
                console.warn('⚠️ Redis désactivé:', error);
                this.isEnabled = false;
            }
        } else {
            console.log('ℹ️ Redis non configuré - fonctionnement sans cache');
            this.isEnabled = false;
        }
    }

    public static getInstance(): RedisClient {
        if (!RedisClient.instance) {
            RedisClient.instance = new RedisClient();
        }
        return RedisClient.instance;
    }

    public async set(
        key: string,
        value: string,
        mode?: string,
        duration?: number
    ): Promise<string | null> {
        if (!this.isEnabled || !this.client) return null;
        
        try {
            if (mode && duration) {
                return await this.client.set(key, value, mode as any, duration);
            }
            return await this.client.set(key, value);
        } catch (error) {
            console.error('Erreur Redis set:', error);
            return null;
        }
    }

    public async get(key: string): Promise<string | null> {
        if (!this.isEnabled || !this.client) return null;
        
        try {
            return await this.client.get(key);
        } catch (error) {
            console.error('Erreur Redis get:', error);
            return null;
        }
    }

    public async del(key: string): Promise<number> {
        if (!this.isEnabled || !this.client) return 0;
        
        try {
            return await this.client.del(key);
        } catch (error) {
            console.error('Erreur Redis del:', error);
            return 0;
        }
    }

    public async exists(key: string): Promise<number> {
        if (!this.isEnabled || !this.client) return 0;
        
        return await this.client.exists(key);
    }

    public async disconnect(): Promise<void> {
        if (this.client) {
            await this.client.quit();
        }
    }

    public getClient(): Redis | null {
        return this.client;
    }

    // Méthode pour obtenir des données en cache
    public async getCache(key: string): Promise<any> {
        if (!this.isEnabled || !this.client) return null;
        
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
        if (!this.isEnabled || !this.client) return false;
        
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

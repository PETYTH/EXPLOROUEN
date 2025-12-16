import Redis from 'ioredis';
import { config } from '../config';

class RedisService {
  private client: Redis | null = null;
  private isConnected: boolean = false;

  constructor() {
    this.connect();
  }

  private connect() {
    try {
      if (!config.redis.url) {
        console.log('⚠️ Redis URL non configurée, cache désactivé');
        return;
      }

      this.client = new Redis(config.redis.url, {
        maxRetriesPerRequest: 3,
        enableReadyCheck: true,
        retryStrategy: (times) => {
          if (times > 3) {
            console.error('❌ Redis: Échec de connexion après 3 tentatives');
            return null; // Stop retrying
          }
          return Math.min(times * 100, 3000); // Wait time between retries
        },
      });

      this.client.on('connect', () => {
        console.log('🔗 Redis: Connexion établie');
        this.isConnected = true;
      });

      this.client.on('ready', () => {
        console.log('✅ Redis: Prêt à recevoir des commandes');
      });

      this.client.on('error', (error) => {
        console.error('❌ Redis Error:', error.message);
        this.isConnected = false;
      });

      this.client.on('close', () => {
        console.log('🔌 Redis: Connexion fermée');
        this.isConnected = false;
      });

      this.client.on('reconnecting', () => {
        console.log('🔄 Redis: Tentative de reconnexion...');
      });
    } catch (error) {
      console.error('❌ Erreur initialisation Redis:', error);
    }
  }

  // Vérifier si Redis est disponible
  isAvailable(): boolean {
    return this.client !== null && this.isConnected;
  }

  // GET: Récupérer une valeur
  async get(key: string): Promise<string | null> {
    if (!this.isAvailable()) return null;
    
    try {
      return await this.client!.get(key);
    } catch (error) {
      console.error(`❌ Redis GET error for key ${key}:`, error);
      return null;
    }
  }

  // SET: Stocker une valeur avec TTL optionnel (en secondes)
  async set(key: string, value: string, ttlSeconds?: number): Promise<boolean> {
    if (!this.isAvailable()) return false;
    
    try {
      if (ttlSeconds) {
        await this.client!.setex(key, ttlSeconds, value);
      } else {
        await this.client!.set(key, value);
      }
      return true;
    } catch (error) {
      console.error(`❌ Redis SET error for key ${key}:`, error);
      return false;
    }
  }

  // DEL: Supprimer une ou plusieurs clés
  async del(...keys: string[]): Promise<number> {
    if (!this.isAvailable()) return 0;
    
    try {
      return await this.client!.del(...keys);
    } catch (error) {
      console.error(`❌ Redis DEL error:`, error);
      return 0;
    }
  }

  // EXISTS: Vérifier si une clé existe
  async exists(key: string): Promise<boolean> {
    if (!this.isAvailable()) return false;
    
    try {
      const result = await this.client!.exists(key);
      return result === 1;
    } catch (error) {
      console.error(`❌ Redis EXISTS error for key ${key}:`, error);
      return false;
    }
  }

  // EXPIRE: Définir un TTL sur une clé existante
  async expire(key: string, seconds: number): Promise<boolean> {
    if (!this.isAvailable()) return false;
    
    try {
      const result = await this.client!.expire(key, seconds);
      return result === 1;
    } catch (error) {
      console.error(`❌ Redis EXPIRE error for key ${key}:`, error);
      return false;
    }
  }

  // TTL: Obtenir le temps restant avant expiration
  async ttl(key: string): Promise<number> {
    if (!this.isAvailable()) return -1;
    
    try {
      return await this.client!.ttl(key);
    } catch (error) {
      console.error(`❌ Redis TTL error for key ${key}:`, error);
      return -1;
    }
  }

  // INCR: Incrémenter une valeur
  async incr(key: string): Promise<number> {
    if (!this.isAvailable()) return 0;
    
    try {
      return await this.client!.incr(key);
    } catch (error) {
      console.error(`❌ Redis INCR error for key ${key}:`, error);
      return 0;
    }
  }

  // DECR: Décrémenter une valeur
  async decr(key: string): Promise<number> {
    if (!this.isAvailable()) return 0;
    
    try {
      return await this.client!.decr(key);
    } catch (error) {
      console.error(`❌ Redis DECR error for key ${key}:`, error);
      return 0;
    }
  }

  // KEYS: Récupérer toutes les clés correspondant à un pattern
  async keys(pattern: string): Promise<string[]> {
    if (!this.isAvailable()) return [];
    
    try {
      return await this.client!.keys(pattern);
    } catch (error) {
      console.error(`❌ Redis KEYS error for pattern ${pattern}:`, error);
      return [];
    }
  }

  // FLUSHDB: Vider toute la base Redis (ATTENTION: use with caution)
  async flushdb(): Promise<boolean> {
    if (!this.isAvailable()) return false;
    
    try {
      await this.client!.flushdb();
      return true;
    } catch (error) {
      console.error(`❌ Redis FLUSHDB error:`, error);
      return false;
    }
  }

  // HSET: Stocker un champ dans un hash
  async hset(key: string, field: string, value: string): Promise<boolean> {
    if (!this.isAvailable()) return false;
    
    try {
      await this.client!.hset(key, field, value);
      return true;
    } catch (error) {
      console.error(`❌ Redis HSET error for key ${key}:`, error);
      return false;
    }
  }

  // HGET: Récupérer un champ d'un hash
  async hget(key: string, field: string): Promise<string | null> {
    if (!this.isAvailable()) return null;
    
    try {
      return await this.client!.hget(key, field);
    } catch (error) {
      console.error(`❌ Redis HGET error for key ${key}:`, error);
      return null;
    }
  }

  // HGETALL: Récupérer tous les champs d'un hash
  async hgetall(key: string): Promise<Record<string, string>> {
    if (!this.isAvailable()) return {};
    
    try {
      return await this.client!.hgetall(key);
    } catch (error) {
      console.error(`❌ Redis HGETALL error for key ${key}:`, error);
      return {};
    }
  }

  // HDEL: Supprimer un champ d'un hash
  async hdel(key: string, ...fields: string[]): Promise<number> {
    if (!this.isAvailable()) return 0;
    
    try {
      return await this.client!.hdel(key, ...fields);
    } catch (error) {
      console.error(`❌ Redis HDEL error for key ${key}:`, error);
      return 0;
    }
  }

  // LPUSH: Ajouter un élément au début d'une liste
  async lpush(key: string, ...values: string[]): Promise<number> {
    if (!this.isAvailable()) return 0;
    
    try {
      return await this.client!.lpush(key, ...values);
    } catch (error) {
      console.error(`❌ Redis LPUSH error for key ${key}:`, error);
      return 0;
    }
  }

  // RPUSH: Ajouter un élément à la fin d'une liste
  async rpush(key: string, ...values: string[]): Promise<number> {
    if (!this.isAvailable()) return 0;
    
    try {
      return await this.client!.rpush(key, ...values);
    } catch (error) {
      console.error(`❌ Redis RPUSH error for key ${key}:`, error);
      return 0;
    }
  }

  // LRANGE: Récupérer une plage d'éléments d'une liste
  async lrange(key: string, start: number, stop: number): Promise<string[]> {
    if (!this.isAvailable()) return [];
    
    try {
      return await this.client!.lrange(key, start, stop);
    } catch (error) {
      console.error(`❌ Redis LRANGE error for key ${key}:`, error);
      return [];
    }
  }

  // LTRIM: Garder seulement une plage d'éléments dans une liste
  async ltrim(key: string, start: number, stop: number): Promise<boolean> {
    if (!this.isAvailable()) return false;
    
    try {
      await this.client!.ltrim(key, start, stop);
      return true;
    } catch (error) {
      console.error(`❌ Redis LTRIM error for key ${key}:`, error);
      return false;
    }
  }

  // Fermer la connexion Redis
  async disconnect(): Promise<void> {
    if (this.client) {
      await this.client.quit();
      this.client = null;
      this.isConnected = false;
      console.log('🔌 Redis: Déconnecté proprement');
    }
  }

  // Ping pour vérifier la connexion
  async ping(): Promise<boolean> {
    if (!this.isAvailable()) return false;
    
    try {
      const result = await this.client!.ping();
      return result === 'PONG';
    } catch (error) {
      return false;
    }
  }
}

export default new RedisService();

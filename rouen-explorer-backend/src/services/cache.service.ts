import redisService from './redis.service';

// TTL constants (en secondes)
const TTL = {
  MONUMENT: 3600,           // 1 heure
  MONUMENTS_LIST: 3600,     // 1 heure
  ACTIVITY: 1800,           // 30 minutes
  ACTIVITIES_LIST: 1800,    // 30 minutes
  REVIEW_STATS: 900,        // 15 minutes
  REVIEW_LIST: 900,         // 15 minutes
  MESSAGE_COUNT: 300,       // 5 minutes
  USER_PROFILE: 600,        // 10 minutes
  PLACE: 3600,              // 1 heure
  PLACES_LIST: 3600,        // 1 heure
  IMAGE: 86400,             // 24 heures
  SEARCH_RESULT: 1800,      // 30 minutes
} as const;

// Prefixes pour organiser les clés
const PREFIX = {
  MONUMENT: 'monument:',
  MONUMENTS: 'monuments:',
  ACTIVITY: 'activity:',
  ACTIVITIES: 'activities:',
  REVIEW: 'review:',
  REVIEWS: 'reviews:',
  MESSAGE: 'message:',
  USER: 'user:',
  PLACE: 'place:',
  PLACES: 'places:',
  IMAGE: 'image:',
  SEARCH: 'search:',
} as const;

class CacheService {
  // ============================================
  // MÉTHODES DE CACHE GÉNÉRIQUES
  // ============================================

  /**
   * Stocker une valeur dans le cache avec TTL
   */
  async setCache(key: string, value: any, ttlSeconds: number = TTL.MONUMENTS_LIST): Promise<boolean> {
    if (!redisService.isAvailable()) {
      return false;
    }

    try {
      const serialized = JSON.stringify(value);
      return await redisService.set(key, serialized, ttlSeconds);
    } catch (error) {
      console.error(`❌ Cache SET error for key ${key}:`, error);
      return false;
    }
  }

  /**
   * Récupérer une valeur du cache
   */
  async getCache<T = any>(key: string): Promise<T | null> {
    if (!redisService.isAvailable()) {
      return null;
    }

    try {
      const cached = await redisService.get(key);
      if (!cached) return null;

      return JSON.parse(cached) as T;
    } catch (error) {
      console.error(`❌ Cache GET error for key ${key}:`, error);
      return null;
    }
  }

  /**
   * Invalider une clé spécifique
   */
  async invalidateCache(key: string): Promise<boolean> {
    if (!redisService.isAvailable()) {
      return false;
    }

    try {
      const deleted = await redisService.del(key);
      return deleted > 0;
    } catch (error) {
      console.error(`❌ Cache INVALIDATE error for key ${key}:`, error);
      return false;
    }
  }

  /**
   * Invalider toutes les clés correspondant à un pattern
   */
  async invalidatePattern(pattern: string): Promise<number> {
    if (!redisService.isAvailable()) {
      return 0;
    }

    try {
      const keys = await redisService.keys(pattern);
      if (keys.length === 0) return 0;

      return await redisService.del(...keys);
    } catch (error) {
      console.error(`❌ Cache INVALIDATE PATTERN error for ${pattern}:`, error);
      return 0;
    }
  }

  // ============================================
  // MONUMENTS
  // ============================================

  async cacheMonument(monumentId: string, data: any): Promise<boolean> {
    const key = `${PREFIX.MONUMENT}${monumentId}`;
    return this.setCache(key, data, TTL.MONUMENT);
  }

  async getMonumentCache(monumentId: string): Promise<any> {
    const key = `${PREFIX.MONUMENT}${monumentId}`;
    return this.getCache(key);
  }

  async invalidateMonument(monumentId: string): Promise<boolean> {
    const key = `${PREFIX.MONUMENT}${monumentId}`;
    // Invalider aussi toutes les listes de monuments
    await this.invalidatePattern(`${PREFIX.MONUMENTS}*`);
    return this.invalidateCache(key);
  }

  async cacheMonumentsList(filters: string, data: any): Promise<boolean> {
    const key = `${PREFIX.MONUMENTS}${filters}`;
    return this.setCache(key, data, TTL.MONUMENTS_LIST);
  }

  async getMonumentsListCache(filters: string): Promise<any> {
    const key = `${PREFIX.MONUMENTS}${filters}`;
    return this.getCache(key);
  }

  // ============================================
  // ACTIVITÉS
  // ============================================

  async cacheActivity(activityId: string, data: any): Promise<boolean> {
    const key = `${PREFIX.ACTIVITY}${activityId}`;
    return this.setCache(key, data, TTL.ACTIVITY);
  }

  async getActivityCache(activityId: string): Promise<any> {
    const key = `${PREFIX.ACTIVITY}${activityId}`;
    return this.getCache(key);
  }

  async invalidateActivity(activityId: string): Promise<boolean> {
    const key = `${PREFIX.ACTIVITY}${activityId}`;
    // Invalider aussi toutes les listes d'activités
    await this.invalidatePattern(`${PREFIX.ACTIVITIES}*`);
    return this.invalidateCache(key);
  }

  async cacheActivitiesList(filters: string, data: any): Promise<boolean> {
    const key = `${PREFIX.ACTIVITIES}${filters}`;
    return this.setCache(key, data, TTL.ACTIVITIES_LIST);
  }

  async getActivitiesListCache(filters: string): Promise<any> {
    const key = `${PREFIX.ACTIVITIES}${filters}`;
    return this.getCache(key);
  }

  // ============================================
  // AVIS (REVIEWS)
  // ============================================

  async cacheReviewStats(monumentId: string, stats: any): Promise<boolean> {
    const key = `${PREFIX.REVIEW}stats:${monumentId}`;
    return this.setCache(key, stats, TTL.REVIEW_STATS);
  }

  async getReviewStatsCache(monumentId: string): Promise<any> {
    const key = `${PREFIX.REVIEW}stats:${monumentId}`;
    return this.getCache(key);
  }

  async invalidateReviews(monumentId: string): Promise<number> {
    // Invalider les stats et la liste des avis
    await this.invalidateCache(`${PREFIX.REVIEW}stats:${monumentId}`);
    return this.invalidatePattern(`${PREFIX.REVIEWS}${monumentId}:*`);
  }

  async cacheReviewsList(monumentId: string, filters: string, data: any): Promise<boolean> {
    const key = `${PREFIX.REVIEWS}${monumentId}:${filters}`;
    return this.setCache(key, data, TTL.REVIEW_LIST);
  }

  async getReviewsListCache(monumentId: string, filters: string): Promise<any> {
    const key = `${PREFIX.REVIEWS}${monumentId}:${filters}`;
    return this.getCache(key);
  }

  // ============================================
  // MESSAGES & CONVERSATIONS
  // ============================================

  async cacheMessageCount(userId: string, count: number): Promise<boolean> {
    const key = `${PREFIX.MESSAGE}unread:${userId}`;
    return this.setCache(key, count, TTL.MESSAGE_COUNT);
  }

  async getMessageCountCache(userId: string): Promise<number | null> {
    const key = `${PREFIX.MESSAGE}unread:${userId}`;
    return this.getCache(key);
  }

  async invalidateUserMessages(userId: string): Promise<boolean> {
    const key = `${PREFIX.MESSAGE}unread:${userId}`;
    return this.invalidateCache(key);
  }

  // ============================================
  // UTILISATEURS
  // ============================================

  async cacheUserProfile(userId: string, data: any): Promise<boolean> {
    const key = `${PREFIX.USER}${userId}`;
    return this.setCache(key, data, TTL.USER_PROFILE);
  }

  async getUserProfileCache(userId: string): Promise<any> {
    const key = `${PREFIX.USER}${userId}`;
    return this.getCache(key);
  }

  async invalidateUserProfile(userId: string): Promise<boolean> {
    const key = `${PREFIX.USER}${userId}`;
    return this.invalidateCache(key);
  }

  // ============================================
  // LIEUX (PLACES)
  // ============================================

  async cachePlace(placeId: string, data: any): Promise<boolean> {
    const key = `${PREFIX.PLACE}${placeId}`;
    return this.setCache(key, data, TTL.PLACE);
  }

  async getPlaceCache(placeId: string): Promise<any> {
    const key = `${PREFIX.PLACE}${placeId}`;
    return this.getCache(key);
  }

  async invalidatePlace(placeId: string): Promise<boolean> {
    const key = `${PREFIX.PLACE}${placeId}`;
    await this.invalidatePattern(`${PREFIX.PLACES}*`);
    return this.invalidateCache(key);
  }

  async cachePlacesList(filters: string, data: any): Promise<boolean> {
    const key = `${PREFIX.PLACES}${filters}`;
    return this.setCache(key, data, TTL.PLACES_LIST);
  }

  async getPlacesListCache(filters: string): Promise<any> {
    const key = `${PREFIX.PLACES}${filters}`;
    return this.getCache(key);
  }

  // ============================================
  // IMAGES
  // ============================================

  async cacheImage(filename: string, data: any): Promise<boolean> {
    const key = `${PREFIX.IMAGE}${filename}`;
    return this.setCache(key, data, TTL.IMAGE);
  }

  async getImageCache(filename: string): Promise<any> {
    const key = `${PREFIX.IMAGE}${filename}`;
    return this.getCache(key);
  }

  async invalidateImage(filename: string): Promise<boolean> {
    const key = `${PREFIX.IMAGE}${filename}`;
    return this.invalidateCache(key);
  }

  async cleanExpiredImages(): Promise<number> {
    // Redis gère automatiquement l'expiration, pas besoin de nettoyage manuel
    return 0;
  }

  // ============================================
  // RECHERCHE
  // ============================================

  async cacheSearchResult(query: string, type: string, data: any): Promise<boolean> {
    const key = `${PREFIX.SEARCH}${type}:${query}`;
    return this.setCache(key, data, TTL.SEARCH_RESULT);
  }

  async getSearchResultCache(query: string, type: string): Promise<any> {
    const key = `${PREFIX.SEARCH}${type}:${query}`;
    return this.getCache(key);
  }

  // ============================================
  // UTILITAIRES
  // ============================================

  /**
   * Vérifier la santé du cache
   */
  async healthCheck(): Promise<boolean> {
    return redisService.isAvailable() && await redisService.ping();
  }

  /**
   * Obtenir des statistiques du cache
   */
  async getStats(): Promise<any> {
    if (!redisService.isAvailable()) {
      return { available: false };
    }

    try {
      const monumentKeys = await redisService.keys(`${PREFIX.MONUMENT}*`);
      const activityKeys = await redisService.keys(`${PREFIX.ACTIVITY}*`);
      const reviewKeys = await redisService.keys(`${PREFIX.REVIEW}*`);
      const imageKeys = await redisService.keys(`${PREFIX.IMAGE}*`);

      return {
        available: true,
        monumentsCount: monumentKeys.length,
        activitiesCount: activityKeys.length,
        reviewsCount: reviewKeys.length,
        imagesCount: imageKeys.length,
        totalKeys: monumentKeys.length + activityKeys.length + reviewKeys.length + imageKeys.length,
      };
    } catch (error) {
      console.error('❌ Error getting cache stats:', error);
      return { available: false, error: 'Failed to get stats' };
    }
  }

  /**
   * Vider tout le cache (à utiliser avec précaution!)
   */
  async flushAll(): Promise<boolean> {
    if (!redisService.isAvailable()) {
      return false;
    }

    console.warn('⚠️  Flushing all cache...');
    return redisService.flushdb();
  }

  /**
   * Logger système (utilise console pour l'instant, peut être étendu)
   */
  async log(level: 'info' | 'warn' | 'error', message: string, metadata?: any): Promise<void> {
    const timestamp = new Date().toISOString();
    const logMessage = `[${timestamp}] [${level.toUpperCase()}] ${message}`;
    
    if (metadata) {
      console.log(logMessage, metadata);
    } else {
      console.log(logMessage);
    }
  }

  /**
   * Nettoyer les vieux logs
   */
  async cleanOldLogs(): Promise<number> {
    // Redis gère automatiquement l'expiration, pas besoin de nettoyage manuel
    return 0;
  }
}

export default new CacheService();

import { Request, Response, NextFunction } from 'express';
import cacheService from '../services/cache.service';

/**
 * Middleware de cache pour les requêtes GET
 * Génère une clé de cache basée sur l'URL et les query params
 */
export const cacheMiddleware = (ttlSeconds?: number) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    // Ne cacher que les requêtes GET
    if (req.method !== 'GET') {
      return next();
    }

    try {
      // Générer une clé de cache unique basée sur l'URL et les params
      const cacheKey = generateCacheKey(req);
      
      // Tenter de récupérer depuis le cache
      const cachedData = await cacheService.getCache(cacheKey);
      
      if (cachedData) {
        console.log(`✅ Cache HIT: ${cacheKey}`);
        return res.json(cachedData);
      }

      console.log(`❌ Cache MISS: ${cacheKey}`);

      // Sauvegarder la méthode json originale
      const originalJson = res.json.bind(res);

      // Override la méthode json pour cacher la réponse
      res.json = function(data: any) {
        // Ne cacher que les réponses réussies (200-299)
        if (res.statusCode >= 200 && res.statusCode < 300) {
          cacheService.setCache(cacheKey, data, ttlSeconds).catch(err => {
            console.error('Erreur lors du cache de la réponse:', err);
          });
        }
        
        return originalJson(data);
      };

      next();
    } catch (error) {
      console.error('Erreur dans le middleware de cache:', error);
      next(); // Continue sans cache en cas d'erreur
    }
  };
};

/**
 * Générer une clé de cache unique pour la requête
 */
function generateCacheKey(req: Request): string {
  const url = req.originalUrl || req.url;
  const userId = (req as any).userId || 'anonymous'; // Si authentifié
  
  // Inclure l'userId dans la clé pour les requêtes authentifiées
  if (userId !== 'anonymous') {
    return `api:${userId}:${url}`;
  }
  
  return `api:${url}`;
}

/**
 * Middleware pour invalider le cache après une mutation (POST, PUT, DELETE, PATCH)
 */
export const invalidateCacheMiddleware = (patterns: string[]) => {
  return async (_req: Request, res: Response, next: NextFunction) => {
    // Sauvegarder la méthode json originale
    const originalJson = res.json.bind(res);

    // Override la méthode json pour invalider le cache après la réponse
    res.json = function(data: any) {
      // Invalider le cache seulement si la requête a réussi
      if (res.statusCode >= 200 && res.statusCode < 300) {
        patterns.forEach(pattern => {
          cacheService.invalidatePattern(pattern).catch(err => {
            console.error(`Erreur lors de l'invalidation du cache (${pattern}):`, err);
          });
        });
      }
      
      return originalJson(data);
    };

    next();
  };
};

/**
 * Middleware spécifique pour les monuments
 */
export const cacheMonumentsMiddleware = cacheMiddleware(3600); // 1 heure

/**
 * Middleware spécifique pour les activités
 */
export const cacheActivitiesMiddleware = cacheMiddleware(1800); // 30 minutes

/**
 * Middleware spécifique pour les lieux
 */
export const cachePlacesMiddleware = cacheMiddleware(3600); // 1 heure

/**
 * Middleware spécifique pour les avis
 */
export const cacheReviewsMiddleware = cacheMiddleware(900); // 15 minutes

/**
 * Middleware pour invalider le cache des monuments
 */
export const invalidateMonumentsCache = invalidateCacheMiddleware(['monument:*', 'monuments:*']);

/**
 * Middleware pour invalider le cache des activités
 */
export const invalidateActivitiesCache = invalidateCacheMiddleware(['activity:*', 'activities:*']);

/**
 * Middleware pour invalider le cache des lieux
 */
export const invalidatePlacesCache = invalidateCacheMiddleware(['place:*', 'places:*']);

/**
 * Middleware pour invalider le cache des avis
 */
export const invalidateReviewsCache = (monumentId?: string) => {
  if (monumentId) {
    return invalidateCacheMiddleware([`review:stats:${monumentId}`, `reviews:${monumentId}:*`]);
  }
  return invalidateCacheMiddleware(['review:*', 'reviews:*']);
};

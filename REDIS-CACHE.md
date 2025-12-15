# Redis Cache - Documentation

## 🎯 Objectif

Redis est utilisé comme système de cache pour améliorer les performances de l'API en réduisant la charge sur les bases de données PostgreSQL et MongoDB.

## 📦 Configuration

### Installation locale de Redis

**Windows:**
```bash
# Via Chocolatey
choco install redis-64

# Ou télécharger depuis: https://github.com/microsoftarchive/redis/releases
```

**Linux:**
```bash
sudo apt-get update
sudo apt-get install redis-server
sudo systemctl start redis-server
```

**MacOS:**
```bash
brew install redis
brew services start redis
```

### Configuration dans le projet

1. Définir `REDIS_URL` dans le fichier `.env`:
```env
REDIS_URL=redis://localhost:6379
```

2. Redis se connectera automatiquement au démarrage du serveur.

## 🚀 Utilisation

### Stratégie de cache

Le cache utilise des TTL (Time To Live) différents selon le type de données:

| Données | TTL | Justification |
|---------|-----|---------------|
| Monuments | 1 heure | Données rarement modifiées |
| Liste de monuments | 1 heure | Même raison |
| Activités | 30 minutes | Mises à jour fréquentes (inscriptions) |
| Liste d'activités | 30 minutes | Même raison |
| Statistiques des avis | 15 minutes | Changent avec nouveaux avis |
| Liste des avis | 15 minutes | Même raison |
| Compteur de messages | 5 minutes | Temps réel souhaité |
| Profil utilisateur | 10 minutes | Mis à jour occasionnellement |
| Lieux | 1 heure | Données stables |
| Images | 24 heures | Données très stables |
| Résultats de recherche | 30 minutes | Équilibre fraîcheur/performance |

### Middleware de cache

Le projet utilise des middlewares automatiques pour gérer le cache:

```typescript
// Cache automatique sur les GET
router.get('/', cacheMonumentsMiddleware, MonumentsController.getAllMonuments);

// Invalidation automatique sur les mutations
router.post('/', invalidateMonumentsCache, MonumentsController.createMonument);
```

### Cache manuel dans les controllers

```typescript
import cacheService from '../services/cache.service';

// Vérifier le cache
const cached = await cacheService.getMonumentCache(monumentId);
if (cached) {
  return res.json(cached);
}

// Requête à la base de données
const monument = await db.monument.findUnique({ where: { id: monumentId } });

// Mettre en cache
await cacheService.cacheMonument(monumentId, monument);

return res.json(monument);
```

## 🔑 Clés de cache

Les clés suivent un pattern organisé par préfixe:

- `monument:<id>` - Un monument spécifique
- `monuments:<filters>` - Liste de monuments avec filtres
- `activity:<id>` - Une activité spécifique
- `activities:<filters>` - Liste d'activités
- `review:stats:<monumentId>` - Statistiques des avis d'un monument
- `reviews:<monumentId>:<filters>` - Liste des avis d'un monument
- `message:unread:<userId>` - Nombre de messages non lus
- `user:<userId>` - Profil utilisateur
- `place:<id>` - Un lieu spécifique
- `places:<filters>` - Liste de lieux
- `image:<filename>` - Données d'une image
- `search:<type>:<query>` - Résultat de recherche

## 🔄 Invalidation du cache

### Automatique

Les middlewares d'invalidation suppriment automatiquement le cache concerné après une mutation réussie:

```typescript
router.post('/', invalidateMonumentsCache, MonumentsController.createMonument);
router.put('/:id', invalidateMonumentsCache, MonumentsController.updateMonument);
router.delete('/:id', invalidateMonumentsCache, MonumentsController.deleteMonument);
```

### Manuelle

Pour invalider manuellement du cache:

```typescript
// Invalider une clé spécifique
await cacheService.invalidateMonument(monumentId);

// Invalider toutes les clés d'un pattern
await cacheService.invalidatePattern('monuments:*');

// Invalider les avis d'un monument
await cacheService.invalidateReviews(monumentId);
```

## 📊 Monitoring

### Health Check

L'endpoint `/health` retourne des informations sur le cache:

```bash
curl http://localhost:5000/health
```

Response:
```json
{
  "success": true,
  "message": "ExploRouen API is running",
  "timestamp": "2024-01-15T10:30:00.000Z",
  "version": "1.0.0",
  "cache": {
    "available": true,
    "stats": {
      "available": true,
      "monumentsCount": 45,
      "activitiesCount": 23,
      "reviewsCount": 128,
      "imagesCount": 67,
      "totalKeys": 263
    }
  }
}
```

### Statistiques du cache

```typescript
import cacheService from '../services/cache.service';

const stats = await cacheService.getStats();
console.log(stats);
```

## 🛠️ Gestion du cache

### Vider tout le cache

⚠️ **Attention**: À utiliser avec précaution!

```typescript
await cacheService.flushAll();
```

### Vérifier la disponibilité

```typescript
const isAvailable = await cacheService.healthCheck();
if (!isAvailable) {
  console.log('Redis n\'est pas disponible, fonctionnement en mode dégradé');
}
```

## 🎯 Bonnes pratiques

1. **Ne pas cacher les données sensibles**: Ne jamais mettre en cache des données personnelles ou sensibles
2. **TTL adapté**: Utiliser des TTL courts pour les données fréquemment modifiées
3. **Invalidation proactive**: Toujours invalider le cache après une modification
4. **Graceful degradation**: L'application doit fonctionner même si Redis est indisponible
5. **Clés descriptives**: Utiliser des noms de clés clairs et organisés

## 🚨 Mode dégradé

Si Redis n'est pas disponible:
- Le service de cache retourne `null` pour tous les `get`
- Les `set` et `delete` retournent silencieusement sans erreur
- L'application continue de fonctionner normalement
- Les requêtes vont directement aux bases de données

## 📈 Performance attendue

Avec Redis activé:
- **Hit rate cible**: 70-80% pour les listes
- **Latence**: < 5ms pour un cache hit
- **Économie de charge DB**: 60-70% de requêtes en moins
- **Temps de réponse**: Réduction de 200-500ms pour les requêtes lourdes

## 🔧 Dépannage

### Redis ne se connecte pas

```bash
# Vérifier que Redis tourne
redis-cli ping
# Devrait retourner: PONG

# Vérifier les logs du serveur
# Rechercher: "✅ Redis: Prêt à recevoir des commandes"
```

### Cache ne s'invalide pas

```bash
# Vérifier les clés en cache
redis-cli KEYS "*"

# Supprimer manuellement toutes les clés
redis-cli FLUSHDB
```

### Mémoire Redis pleine

```bash
# Vérifier l'utilisation mémoire
redis-cli INFO memory

# Configurer une limite mémoire
redis-cli CONFIG SET maxmemory 256mb
redis-cli CONFIG SET maxmemory-policy allkeys-lru
```

## 📚 Ressources

- [Documentation Redis officielle](https://redis.io/documentation)
- [ioredis GitHub](https://github.com/luin/ioredis)
- [Redis Best Practices](https://redis.io/docs/manual/patterns/)

# 🚀 Démarrage Rapide - Redis Cache

## Option 1: Docker (Recommandé)

C'est la méthode la plus simple et rapide:

```bash
# Démarrer tous les services (PostgreSQL, MongoDB, Redis)
docker-compose up -d

# Ou seulement Redis
docker-compose up -d redis

# Vérifier que Redis fonctionne
docker-compose ps
docker-compose logs redis
```

**Configuration dans .env:**
```env
REDIS_URL=redis://:explorouen_redis_password@localhost:6379
```

**Interface web Redis Commander:**
- URL: http://localhost:8082
- Permet de visualiser les clés en cache en temps réel

## Option 2: Installation locale (Windows)

### Méthode automatique

```powershell
# Exécuter le script d'installation
.\install-redis.ps1
```

### Méthode manuelle

1. **Via Chocolatey:**
```powershell
# Installer Chocolatey (si pas déjà installé)
Set-ExecutionPolicy Bypass -Scope Process -Force
[System.Net.ServicePointManager]::SecurityProtocol = [System.Net.ServicePointManager]::SecurityProtocol -bor 3072
iex ((New-Object System.Net.WebClient).DownloadString('https://community.chocolatey.org/install.ps1'))

# Installer Redis
choco install redis-64 -y

# Démarrer le service
Start-Service Redis

# Vérifier
redis-cli ping
# Devrait retourner: PONG
```

2. **Téléchargement direct:**
- Télécharger: https://github.com/microsoftarchive/redis/releases
- Extraire dans `C:\Redis`
- Exécuter `redis-server.exe`

**Configuration dans .env:**
```env
REDIS_URL=redis://localhost:6379
```

## Option 3: Redis Cloud (Production)

Pour la production, utilisez un service Redis géré:

### Upstash (Gratuit avec limites)
1. S'inscrire sur https://upstash.com
2. Créer une base Redis
3. Copier l'URL de connexion

### Redis Cloud
1. S'inscrire sur https://redis.com/try-free/
2. Créer un cluster
3. Obtenir l'URL de connexion

**Configuration dans .env:**
```env
REDIS_URL=redis://:password@your-host:port
```

## 🧪 Tester la connexion

```bash
# Démarrer le serveur backend
cd rouen-explorer-backend
npm run dev

# Vérifier le health check
curl http://localhost:5000/health
```

Le résultat devrait montrer:
```json
{
  "cache": {
    "available": true,
    "stats": {
      "available": true,
      "monumentsCount": 0,
      "activitiesCount": 0,
      ...
    }
  }
}
```

## 🎯 Commandes utiles

```bash
# Voir toutes les clés en cache
redis-cli KEYS "*"

# Voir une clé spécifique
redis-cli GET monument:123

# Voir le nombre de clés
redis-cli DBSIZE

# Vider tout le cache
redis-cli FLUSHDB

# Surveiller les commandes en temps réel
redis-cli MONITOR

# Voir les statistiques
redis-cli INFO
```

## ⚠️ Pas de Redis?

Si vous ne voulez pas installer Redis maintenant:
- L'application fonctionnera normalement
- Le cache sera simplement désactivé
- Les requêtes iront directement aux bases de données
- Aucune erreur ne sera affichée

Vous verrez simplement dans les logs:
```
⚠️ Redis URL non configurée, cache désactivé
```

## 📊 Monitoring

### Via Redis Commander (Docker)
- http://localhost:8082
- Visualisation des clés
- Statistiques en temps réel
- Gestion des données

### Via logs du serveur
- Les cache HIT/MISS sont loggés
- Surveillez la console du serveur backend

### Via l'endpoint health
```bash
# Statistiques du cache
curl http://localhost:5000/health | jq '.cache'
```

## 🔧 Dépannage

### Redis ne démarre pas

**Docker:**
```bash
docker-compose logs redis
docker-compose restart redis
```

**Windows Service:**
```powershell
Get-Service Redis
Restart-Service Redis
```

### Erreur de connexion

Vérifiez votre fichier `.env`:
```env
# Format correct
REDIS_URL=redis://localhost:6379

# Avec mot de passe (Docker)
REDIS_URL=redis://:explorouen_redis_password@localhost:6379

# Format incorrect (à éviter)
REDIS_URL=localhost:6379  ❌
```

### Cache ne fonctionne pas

1. Vérifier que Redis est accessible:
```bash
redis-cli ping
```

2. Vérifier le health check:
```bash
curl http://localhost:5000/health
```

3. Vérifier les logs du serveur backend

## 🎓 En savoir plus

Consultez [REDIS-CACHE.md](./REDIS-CACHE.md) pour:
- Architecture détaillée du cache
- Stratégies de TTL
- Guide d'invalidation
- Bonnes pratiques
- Monitoring avancé

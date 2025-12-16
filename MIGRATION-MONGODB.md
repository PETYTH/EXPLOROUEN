# Migration MongoDB - ExploRouen

## ✅ Étapes complétées

### 1. Installation et configuration
- ✅ Mongoose installé (`npm install mongoose @types/mongoose`)
- ✅ Configuration MongoDB dans `src/config/mongodb.ts`
- ✅ Variable d'environnement `MONGODB_URL` ajoutée

### 2. Modèles MongoDB créés
- ✅ **Conversation** (`src/models/mongo/Conversation.ts`)
  - Messages de chat par activité
  - Participants et timestamps
  - Index optimisés pour les requêtes

- ✅ **Review** (`src/models/mongo/Review.ts`)
  - Avis sur les monuments/lieux
  - Système de modération (pending/approved/rejected)
  - Statistiques (helpful, verified)

- ✅ **ContactMessage** (`src/models/mongo/ContactMessage.ts`)
  - Messages de contact utilisateurs
  - Statut (new/read/replied/closed)
  - Système de priorité et assignation

- ✅ **AppRating** (`src/models/mongo/AppRating.ts`)
  - Notations de l'application
  - Tracking par plateforme (iOS/Android/Web)
  - Un seul vote par utilisateur

### 3. Services MongoDB créés
- ✅ `conversationService.ts` - Gestion des conversations et messages
- ✅ `reviewService.ts` - Gestion des avis (CRUD + statistiques)
- ✅ `contactService.ts` - Gestion des messages de contact
- ✅ `appRatingService.ts` - Gestion des notations de l'app

### 4. Script de migration
- ✅ `src/scripts/migrate-to-mongo.ts` - Migration des données existantes

## 📋 Prochaines étapes

### 5. Configurer MongoDB
Deux options :

#### Option A: MongoDB Local (développement)
```bash
# Windows (avec Chocolatey)
choco install mongodb

# Ou télécharger depuis: https://www.mongodb.com/try/download/community
# Démarrer MongoDB
mongod --dbpath C:\data\db
```

#### Option B: MongoDB Atlas (recommandé)
1. Créer un compte gratuit: https://www.mongodb.com/cloud/atlas/register
2. Créer un cluster (tier gratuit 512MB)
3. Ajouter votre IP dans Network Access
4. Créer un utilisateur dans Database Access
5. Récupérer la connection string

Exemple connection string Atlas:
```
MONGODB_URL="mongodb+srv://username:password@cluster0.xxxxx.mongodb.net/explorouen?retryWrites=true&w=majority"
```

### 6. Mettre à jour le fichier .env
```env
# Ajouter dans rouen-explorer-backend/.env
MONGODB_URL="mongodb://localhost:27017/explorouen_mongo"
# Ou pour Atlas:
# MONGODB_URL="mongodb+srv://username:password@cluster.mongodb.net/explorouen"
```

### 7. Exécuter la migration
```bash
cd rouen-explorer-backend
npm run migrate:mongo
```

### 8. Adapter les controllers (TODO)

#### Chat Controller
- Remplacer les appels Prisma par `conversationService`
- Fichier: `src/controllers/chat.controller.ts`

#### Reviews Controller  
- Remplacer les appels Prisma par `reviewService`
- Fichier: `src/controllers/reviews.controller.ts` (à créer si nécessaire)

#### Contact Controller
- Utiliser `contactService`
- Fichier: `src/controllers/contact.controller.ts`

#### App Rating (nouveau)
- Créer `src/controllers/appRating.controller.ts`
- Créer la route `src/routes/appRating.routes.ts`

### 9. Mettre à jour les routes
Les routes doivent pointer vers les nouveaux controllers MongoDB.

### 10. Mettre à jour le frontend
- Adapter les appels API si nécessaire
- Vérifier la compatibilité des réponses

## 🔄 Architecture Hybride

### PostgreSQL (Supabase)
- ✅ Users, Authentication
- ✅ Places (Monuments)
- ✅ Activities
- ✅ ActivityRegistration
- ✅ FavoritePlace
- ✅ TreasureHunt
- ✅ Données relationnelles

### MongoDB
- ✅ Conversations & Messages
- ✅ Reviews (Avis)
- ✅ Contact Messages
- ✅ App Ratings
- ✅ Données orientées document

## 📊 Avantages

### Performance
- Messages: Lecture/écriture ultra-rapide
- Reviews: Agrégations optimisées
- Scalabilité: Prêt pour forte volumétrie

### Flexibilité
- Schéma flexible pour les messages (texte, image, audio)
- Facilité d'ajout de champs sans migration

### Séparation des préoccupations
- Données transactionnelles → PostgreSQL
- Données volumétriques → MongoDB

## 🛠️ Commandes utiles

```bash
# Lancer MongoDB local
mongod --dbpath C:\data\db

# Migrer les données
npm run migrate:mongo

# Accéder à MongoDB Shell
mongosh

# Visualiser les données dans MongoDB Compass
# Télécharger: https://www.mongodb.com/products/compass

# Package.json - Ajouter le script
"migrate:mongo": "tsx src/scripts/migrate-to-mongo.ts"
```

## ⚠️ Points d'attention

1. **Double stockage temporaire**: Durant la migration, certaines données seront dans les 2 BDD
2. **Synchronisation**: Assurer que les nouvelles données vont bien dans MongoDB
3. **Backup**: Faire un backup PostgreSQL avant de supprimer les anciennes tables
4. **Tests**: Tester toutes les fonctionnalités après migration

## 📝 Checklist finale

- [ ] MongoDB configuré (local ou Atlas)
- [ ] MONGODB_URL dans .env
- [ ] Migration exécutée avec succès
- [ ] Controllers adaptés
- [ ] Routes mises à jour
- [ ] Tests fonctionnels OK
- [ ] Frontend compatible
- [ ] Backup PostgreSQL effectué
- [ ] Anciennes tables Review/Message supprimées de Prisma
- [ ] Documentation mise à jour

## 🚀 Déploiement

### Développement
```bash
# Terminal 1: MongoDB
mongod --dbpath C:\data\db

# Terminal 2: Backend
cd rouen-explorer-backend
npm run dev
```

### Production
- Utiliser MongoDB Atlas
- Variables d'environnement sur le serveur
- Monitoring avec MongoDB Atlas UI

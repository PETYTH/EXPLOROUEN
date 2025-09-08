# EXPLOROUEN

Application mobile moderne pour explorer Rouen et ses trésors historiques de manière interactive et ludique.

## 🏰 Description

ExploRouen est une application React Native avec backend Node.js qui permet aux utilisateurs de découvrir les monuments, participer à des activités et explorer Rouen de façon interactive.

## 🚀 Technologies

### Frontend
- React Native (Expo)
- TypeScript
- Clerk (Authentification)
- Socket.IO (Chat temps réel)

### Backend
- Node.js / Express
- TypeScript
- Prisma (ORM)
- SQLite (Base de données)
- Socket.IO (WebSocket)

## 📱 Fonctionnalités

- 🏛️ Découverte des monuments historiques
- 🏃‍♂️ Activités sportives et culturelles
- 💬 Chat en temps réel
- 🗺️ Carte interactive
- 📧 Système d'emails
- 🔐 Authentification sécurisée
- 🍪 Gestion RGPD

## 🌿 Structure des Branches

- `main` - Code principal stable
- `feature/authentication` - Système d'authentification Clerk
- `feature/activities` - Gestion des activités
- `feature/monuments` - Découverte des monuments
- `feature/chat` - Système de chat temps réel
- `feature/map` - Carte interactive
- `feature/email` - Service d'emails
- `feature/ui-components` - Composants UI réutilisables

## 🏗️ Architecture

### Frontend (React Native + Expo)
- **Framework**: React Native avec Expo SDK
- **Navigation**: Expo Router (file-based routing)
- **Authentification**: Clerk (@clerk/clerk-expo)
- **Styling**: StyleSheet natif avec thème violet (#8B5CF6)
- **État global**: Context API (ThemeContext, ActivityProvider)
- **Cartes**: React Native Maps avec tiles Jawg
- **Images**: Expo Image Picker avec stockage base64

### Backend (Node.js + Express)
- **Runtime**: Node.js avec TypeScript
- **Framework**: Express.js
- **Base de données**: SQLite avec Prisma ORM
- **Authentification**: Clerk SDK pour validation JWT
- **Upload**: Multer pour gestion des images
- **Validation**: Joi pour validation des données
- **Email**: Nodemailer avec Mailtrap (développement)

## 🚀 Fonctionnalités Principales

### 👤 Authentification & Profils
- **Inscription/Connexion** via Clerk
- **Gestion de profil** avec avatar et informations personnelles
- **Rôles utilisateurs** (utilisateur standard, administrateur)
- **Récupération de mot de passe** avec codes à 4 chiffres

### 🏛️ Monuments & Lieux
- **Catalogue de monuments** de Rouen avec descriptions détaillées
- **Géolocalisation** avec coordonnées GPS précises
- **Images haute qualité** depuis Unsplash
- **Informations pratiques** : horaires, tarifs, accessibilité
- **Guides audio** (prévu)
- **Système de favoris** pour sauvegarder les lieux

### 🎯 Activités
- **Types d'activités** : Sport, Culture, Chasse aux œufs
- **Création d'activités** (réservée aux administrateurs)
- **Inscription/désinscription** libre aux activités
- **Niveaux de difficulté** : Facile, Modéré, Difficile
- **Géolocalisation** avec points de rendez-vous
- **Gestion des participants** avec limites configurables

### 💬 Système de Chat
- **Messages de groupe** pour chaque activité
- **Messages privés** avec les organisateurs
- **Partage d'images** dans les conversations
- **Temps réel** via Socket.IO
- **Notifications** pour nouveaux messages

### 🗺️ Cartographie
- **Cartes interactives** avec Jawg Maps
- **Marqueurs personnalisés** pour monuments et activités
- **Calcul de distances** et itinéraires
- **Géolocalisation utilisateur** en temps réel

## 📊 Structure de la Base de Données

### Modèles Principaux

```prisma
model Activity {
  id               String        @id @default(cuid())
  title            String        // Titre de l'activité
  description      String        // Description détaillée
  type             String        // RUNNING, CULTURAL_VISIT, TREASURE_HUNT
  difficulty       String        // EASY, MEDIUM, HARD
  duration         Int           // Durée en minutes
  maxParticipants  Int           // Nombre max de participants
  startDate        DateTime      // Date et heure de début
  meetingPoint     String        // Point de rendez-vous
  latitude         Float         // Coordonnée GPS
  longitude        Float         // Coordonnée GPS
  price            Float?        // Prix (null = gratuit)
  createdBy        String        // ID Clerk de l'organisateur
  image            String?       // URL de l'image
  category         String?       // Catégorie lisible
  organizerName    String?       // Nom de l'organisateur
  organizerAvatar  String?       // Avatar de l'organisateur
  organizerRating  Float?        // Note de l'organisateur
}

model Place {
  id              String      @id @default(cuid())
  name            String      // Nom du monument
  description     String      // Description historique
  address         String      // Adresse complète
  latitude        Float       // Coordonnée GPS
  longitude       Float       // Coordonnée GPS
  category        String      // MONUMENT, MUSEUM, PARK, etc.
  images          String?     // URLs des images (JSON)
  entryPrice      Float?      // Prix d'entrée
  estimatedDuration Int?      // Durée de visite en minutes
  openingHours    String?     // Horaires (JSON)
}

model Chat {
  id          String    @id @default(cuid())
  type        String    // GROUP, PRIVATE
  activityId  String?   // Lié à une activité (si GROUP)
  title       String    // Nom du chat
  isActive    Boolean   // Chat actif
  messages    Message[] // Messages du chat
}

model Message {
  id        String   @id @default(cuid())
  chatId    String   // ID du chat
  senderId  String   // ID Clerk de l'expéditeur
  content   String   // Contenu du message
  type      String   // TEXT, IMAGE, SYSTEM
  mediaUrl  String?  // URL du média (si IMAGE)
  createdAt DateTime // Date d'envoi
}
```

## 🔧 Configuration & Installation

### Prérequis
- Node.js 18+
- npm ou yarn
- Expo CLI
- Compte Clerk (authentification)
- Compte Jawg (cartes)

### Installation Backend

```bash
cd rouen-explorer-backend

# Installation des dépendances
npm install

# Configuration de l'environnement
cp .env.example .env
# Éditer .env avec vos clés API

# Base de données
npx prisma generate
npx prisma migrate dev
npx prisma db seed

# Lancement du serveur
npm run dev
```

### Installation Frontend

```bash
cd ExploRouen_Frontend

# Installation des dépendances
npm install

# Configuration de l'environnement
cp .env.example .env
# Éditer .env avec vos clés API

# Lancement de l'application
npx expo start
```

### Variables d'Environnement

#### Backend (.env)
```env
DATABASE_URL="file:./dev.db"
PORT=5000
CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...
JWT_SECRET=your_jwt_secret
FRONTEND_URL=http://localhost:8081
MAILTRAP_USER=your_mailtrap_user
MAILTRAP_PASS=your_mailtrap_password
```

#### Frontend (.env)
```env
EXPO_PUBLIC_URL_BACKEND=http://192.168.1.62:5000/api
EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
JAWG_ACCESS_TOKEN=your_jawg_token
```

## 🎨 Interface Utilisateur

### Design System
- **Couleur principale** : Violet #8B5CF6
- **Thème sombre/clair** : Support complet
- **Typographie** : Système natif avec poids variables
- **Animations** : React Native Reanimated
- **Icônes** : Lucide React Native

### Navigation
- **Structure en onglets** : Activités, Monuments, Messages, Profil
- **Navigation modale** : Création/édition d'activités
- **Gestes** : Swipe-to-delete, pull-to-refresh
- **Transitions** : Animations fluides entre écrans

## 🔐 Sécurité

### Authentification
- **JWT Tokens** via Clerk SDK
- **Validation côté serveur** pour toutes les routes protégées
- **Rôles utilisateurs** avec contrôle d'accès granulaire

### Validation des Données
- **Sanitisation** des inputs utilisateur
- **Validation Joi** côté backend
- **Validation temps réel** côté frontend
- **Protection CORS** configurée

### Stockage
- **Images en base64** pour simplicité (développement)
- **Données sensibles** chiffrées
- **Logs sécurisés** sans exposition de tokens

## 📱 Fonctionnalités Mobiles

### Géolocalisation
- **Permission runtime** pour accès à la position
- **Calcul de distances** entre utilisateur et points d'intérêt
- **Cartes interactives** avec zoom et marqueurs

### Caméra & Galerie
- **Capture photo** directe depuis l'app
- **Sélection galerie** avec permissions
- **Redimensionnement automatique** des images
- **Prévisualisation** avant envoi

### Notifications
- **Push notifications** (prévu)
- **Notifications in-app** pour nouveaux messages
- **Rappels d'activités** avant événements

## 🚀 Déploiement

### Backend
- **Serveur** : Compatible avec Heroku, Railway, DigitalOcean
- **Base de données** : Migration SQLite → PostgreSQL pour production
- **Variables d'environnement** : Configuration via plateforme

### Frontend
- **Build Expo** : `expo build:android` / `expo build:ios`
- **Distribution** : App Store / Google Play
- **OTA Updates** : Mise à jour sans republication

## 🔄 API Endpoints

### Activités
```
GET    /api/activities              # Liste toutes les activités
POST   /api/activities              # Crée une nouvelle activité (admin)
GET    /api/activities/:id          # Détails d'une activité
PUT    /api/activities/:id          # Modifie une activité (admin)
DELETE /api/activities/:id          # Supprime une activité (admin)
POST   /api/activities/:id/register # S'inscrire à une activité
DELETE /api/activities/:id/register # Se désinscrire d'une activité
```

### Monuments
```
GET    /api/places                  # Liste tous les monuments
POST   /api/places                  # Crée un nouveau monument (admin)
GET    /api/places/:id              # Détails d'un monument
PUT    /api/places/:id              # Modifie un monument (admin)
DELETE /api/places/:id              # Supprime un monument (admin)
```

### Messages
```
GET    /api/discussions/conversations     # Conversations utilisateur
GET    /api/discussions/activity/:id/messages # Messages de groupe
POST   /api/discussions/private/create    # Créer chat privé
GET    /api/discussions/private/:id/messages # Messages privés
POST   /api/messages                      # Envoyer un message
```

## 🐛 Débogage & Logs

### Frontend
- **Console Expo** : Logs en temps réel
- **Flipper** : Débogage avancé (optionnel)
- **Error Boundaries** : Gestion des erreurs React

### Backend
- **Morgan** : Logs des requêtes HTTP
- **Winston** : Logs structurés (prévu)
- **Error Handling** : Middleware global d'erreurs

## 📈 Performance

### Optimisations Frontend
- **Lazy Loading** : Chargement différé des images
- **Memoization** : React.memo pour composants
- **FlatList** : Listes virtualisées pour performances

### Optimisations Backend
- **Indexation** : Index sur champs fréquemment requêtés
- **Pagination** : Limitation des résultats API
- **Cache** : Redis pour données fréquentes (prévu)

## 🤝 Contribution

### Standards de Code
- **ESLint** : Linting JavaScript/TypeScript
- **Prettier** : Formatage automatique
- **Conventional Commits** : Messages de commit standardisés

### Tests
- **Jest** : Tests unitaires backend
- **React Native Testing Library** : Tests composants (prévu)
- **E2E** : Tests end-to-end avec Detox (prévu)

## 📞 Support

Pour toute question ou problème :
- **Issues GitHub** : Rapporter des bugs
- **Documentation** : Wiki du projet
- **Contact** : Email de l'équipe de développement

---

**Version** : 1.0.0  
**Dernière mise à jour** : Septembre 2025  
**Licence** : MIT

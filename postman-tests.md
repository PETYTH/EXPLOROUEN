# Guide de Tests Postman - ExploRouen Backend API

## Configuration de Base
- **URL de base**: `http://localhost:5000/api` ⚠️ **PORT 5000 (pas 3001)**
- **Headers globaux**: 
  - `Content-Type: application/json`
  - `Authorization: Bearer <token>` (pour les routes protégées)
  
### Variables Postman Recommandées
```
baseUrl: http://localhost:5000/api
token: (sera rempli après connexion)
```

## 🔐 AUTHENTIFICATION (Fonctionnel)

### 1. Inscription
```
POST /api/auth/register
Body:
{
  "firstName": "John",
  "lastName": "Doe", 
  "email": "john@example.com",
  "password": "Password123!",
  "confirmPassword": "Password123!"
}
```

### 2. Connexion
```
POST /api/auth/login
Body:
{
  "email": "john@example.com",
  "password": "Password123!"
}
```
**Réponse**: Token JWT à utiliser dans Authorization header

### 3. Rafraîchir Token
```
POST /api/auth/refresh
Body:
{
  "refreshToken": "<refresh_token>"
}
```

### 4. Réinitialisation Mot de Passe
```
POST /api/auth/forgot-password
Body:
{
  "email": "john@example.com"
}
```

### 5. Confirmer Nouveau Mot de Passe
```
POST /api/auth/reset-password
Body:
{
  "token": "<reset_token>",
  "password": "NewPassword123!",
  "confirmPassword": "NewPassword123!"
}
```

### 6. Déconnexion
```
POST /api/auth/logout
Headers: Authorization: Bearer <token>
```

## 👤 UTILISATEURS (Fonctionnel)

### 1. Profil Utilisateur
```
GET /api/users/profile
Headers: Authorization: Bearer <token>
```

### 2. Mettre à Jour Profil
```
PUT /api/users/profile
Headers: Authorization: Bearer <token>
Body:
{
  "firstName": "John Updated",
  "lastName": "Doe Updated",
  "bio": "Ma nouvelle bio"
}
```

### 3. Changer Mot de Passe
```
PUT /api/users/change-password
Headers: Authorization: Bearer <token>
Body:
{
  "currentPassword": "Password123!",
  "newPassword": "NewPassword123!",
  "confirmPassword": "NewPassword123!"
}
```

### 4. Supprimer Compte
```
DELETE /api/users/profile
Headers: Authorization: Bearer <token>
```

## 🏛️ LIEUX PATRIMONIAUX (Fonctionnel)

### 1. Liste des Lieux
```
GET /api/places
Query params:
- category: cathedral|monument|museum|park
- featured: true|false
- latitude: 49.4431
- longitude: 1.0993
- radius: 1000
- search: "cathédrale"
```

### 2. Détails d'un Lieu
```
GET /api/places/:id
```

### 3. Créer un Lieu (Admin)
```
POST /api/places
Headers: Authorization: Bearer <token>
Body:
{
  "name": "Cathédrale Notre-Dame",
  "description": "Magnifique cathédrale gothique",
  "category": "cathedral",
  "latitude": 49.4431,
  "longitude": 1.0993,
  "address": "Place de la Cathédrale, Rouen",
  "openingHours": {
    "monday": "9:00-18:00",
    "tuesday": "9:00-18:00"
  },
  "audioGuideUrl": "https://example.com/audio.mp3",
  "images": ["image1.jpg", "image2.jpg"]
}
```

### 4. Lieux par Catégorie
```
GET /api/places/category/:category
```

### 5. Lieux Favoris
```
POST /api/places/:id/favorite
Headers: Authorization: Bearer <token>

DELETE /api/places/:id/favorite
Headers: Authorization: Bearer <token>
```

## 🏃 ACTIVITÉS SPORTIVES (Fonctionnel)

### 1. Liste des Activités
```
GET /api/activities
Query params:
- category: running|cycling|walking|fitness
- difficulty: easy|medium|hard
- latitude: 49.4431
- longitude: 1.0993
- radius: 5000
- startDate: 2024-01-01
- endDate: 2024-12-31
```

### 2. Détails d'une Activité
```
GET /api/activities/:id
```

### 3. Créer une Activité
```
POST /api/activities
Headers: Authorization: Bearer <token>
Body:
{
  "title": "Course matinale Seine",
  "description": "Course le long des quais de Seine",
  "category": "running",
  "difficulty": "medium",
  "startDate": "2024-01-15T08:00:00Z",
  "endDate": "2024-01-15T10:00:00Z",
  "location": "Quais de Seine, Rouen",
  "latitude": 49.4431,
  "longitude": 1.0993,
  "maxParticipants": 20,
  "equipment": ["chaussures de course", "bouteille d'eau"],
  "meetingPoint": "Place du Vieux-Marché"
}
```

### 4. S'inscrire à une Activité
```
POST /api/activities/:id/register
Headers: Authorization: Bearer <token>
```

### 5. Se désinscrire
```
DELETE /api/activities/:id/register
Headers: Authorization: Bearer <token>
```

### 6. Participants d'une Activité
```
GET /api/activities/:id/participants
Headers: Authorization: Bearer <token>
```

## 💬 CHAT ÉPHÉMÈRE (Fonctionnel)

### 1. Envoyer un Message
```
POST /api/chat/message
Headers: Authorization: Bearer <token>
Body:
{
  "roomId": "activity_123",
  "content": "Salut tout le monde !",
  "type": "text"
}
```

### 2. Messages d'une Room
```
GET /api/chat/room/:roomId/messages
Headers: Authorization: Bearer <token>
Query params:
- limit: 50
- offset: 0
```

### 3. Rejoindre une Room
```
POST /api/chat/room/:roomId/join
Headers: Authorization: Bearer <token>
```

### 4. Quitter une Room
```
POST /api/chat/room/:roomId/leave
Headers: Authorization: Bearer <token>
```

### 5. Message Hors Ligne
```
POST /api/chat/offline-message
Headers: Authorization: Bearer <token>
Body:
{
  "roomId": "activity_123",
  "content": "Message créé hors ligne",
  "tempId": "temp_12345"
}
```

### 6. Synchroniser Messages Hors Ligne
```
POST /api/chat/sync-offline
Headers: Authorization: Bearer <token>
```

## 📧 CONTACT (Fonctionnel - MongoDB)

### 1. Envoyer un Message de Contact
```
POST /api/contact
Body:
{
  "firstName": "John",
  "lastName": "Doe",
  "email": "john@example.com",
  "phone": "+33123456789",
  "subject": "Question sur les activités",
  "message": "J'aimerais avoir plus d'informations...",
  "priority": "medium",
  "tags": ["activités", "information"]
}
```

### 2. Liste des Messages (Admin)
```
GET /api/contact
Headers: Authorization: Bearer <admin_token>
Query params:
- status: pending|in_progress|resolved
- priority: low|medium|high|urgent
- page: 1
- limit: 10
```

### 3. Répondre à un Message (Admin)
```
POST /api/contact/:id/reply
Headers: Authorization: Bearer <admin_token>
Body:
{
  "response": "Merci pour votre message...",
  "status": "resolved"
}
```

## 🗺️ CARTES & ITINÉRAIRES (Fonctionnel)

### 1. Coordonnées d'une Adresse
```
GET /api/maps/geocode
Query params:
- address: "Place du Vieux-Marché, Rouen"
```

### 2. Adresse depuis Coordonnées
```
GET /api/maps/reverse-geocode
Query params:
- latitude: 49.4431
- longitude: 1.0993
```

### 3. Calculer un Itinéraire
```
POST /api/maps/route
Headers: Authorization: Bearer <token>
Body:
{
  "start": {
    "latitude": 49.4431,
    "longitude": 1.0993
  },
  "end": {
    "latitude": 49.4500,
    "longitude": 1.1000
  },
  "mode": "walking"
}
```

### 4. Points d'Intérêt Proches
```
GET /api/maps/nearby
Query params:
- latitude: 49.4431
- longitude: 1.0993
- radius: 1000
- type: restaurant|monument|park
```

## 🔔 NOTIFICATIONS (Fonctionnel - MongoDB)

### 1. Créer une Notification
```
POST /api/notifications
Headers: Authorization: Bearer <token>
Body:
{
  "type": "activity_registration",
  "title": "Inscription confirmée",
  "message": "Votre inscription à l'activité a été confirmée",
  "data": {
    "activityId": "123"
  },
  "channels": ["in_app", "email"]
}
```

### 2. Notifications de l'Utilisateur
```
GET /api/notifications
Headers: Authorization: Bearer <token>
Query params:
- unread: true|false
- type: activity_registration|reminder
- page: 1
- limit: 10
```

### 3. Marquer comme Lu
```
PUT /api/notifications/:id/read
Headers: Authorization: Bearer <token>
```

### 4. Supprimer une Notification
```
DELETE /api/notifications/:id
Headers: Authorization: Bearer <token>
```

## 🔧 SYSTÈME

### 1. Health Check
```
GET /health
```

### 2. Nettoyage Manuel des Messages Éphémères (Admin)
```
POST /api/chat/cleanup
Headers: Authorization: Bearer <admin_token>
```

## 🚫 FONCTIONNALITÉS EN DÉVELOPPEMENT

- **Chasses aux Trésors** (`/api/treasures`) - Routes créées mais contrôleur manquant
- **Dashboard Admin** - En attente
- **Statistiques Avancées** - En attente

## 📝 NOTES IMPORTANTES

1. **Base de Données**: 
   - SQL (Prisma): Utilisateurs, activités, lieux
   - MongoDB: Messages chat, contacts, notifications

2. **Authentification**: JWT avec refresh token

3. **Chat Éphémère**: Messages supprimés automatiquement à la fin des activités

4. **WebSocket**: Chat temps réel sur `ws://localhost:3001`

5. **Upload de Fichiers**: Endpoint `/uploads` pour images

6. **Rate Limiting**: 100 requêtes/15min par IP

7. **CORS**: Configuré pour le frontend

## 🧪 TESTS RECOMMANDÉS

1. **Authentification complète** (inscription → connexion → refresh → logout)
2. **CRUD activités** avec inscription/désinscription
3. **Chat éphémère** avec messages temps réel
4. **Contact MongoDB** avec différentes priorités
5. **Géolocalisation** et itinéraires
6. **Notifications** push et in-app
7. **Gestion des erreurs** et validation

Le backend est **opérationnel** pour ces fonctionnalités principales !

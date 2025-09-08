# 🚀 Guide de Déploiement ExploRouen - Version Gratuite

Ce guide vous explique comment déployer votre application ExploRouen **gratuitement** sans passer par les stores d'applications.

## 📋 Vue d'ensemble

- **Frontend** : PWA (Progressive Web App) déployée sur Netlify
- **Backend** : API Node.js déployée sur Render
- **Base de données** : PostgreSQL gratuite sur Supabase
- **Coût total** : 0€

## 🎯 Résultat final

Votre app sera accessible via :
- **URL Web** : `https://explorouen.netlify.app` (exemple)
- **Installation mobile** : Les utilisateurs pourront installer l'app depuis leur navigateur
- **Fonctionnalités** : Toutes les fonctionnalités natives (notifications, hors ligne, etc.)

---

## 🔧 ÉTAPE 1 : Préparer le Backend

### 1.1 Créer une base de données PostgreSQL gratuite

1. Aller sur [Supabase.com](https://supabase.com)
2. Créer un compte gratuit
3. Créer un nouveau projet "ExploRouen"
4. Récupérer l'URL de connexion PostgreSQL dans Settings > Database

### 1.2 Configurer les variables d'environnement

Créer un fichier `.env` dans `rouen-explorer-backend/` :

```env
# Base de données Supabase
DATABASE_URL="postgresql://postgres:[PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres"

# Clerk Authentication
CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...

# JWT
JWT_SECRET=votre-secret-jwt-super-securise-minimum-32-caracteres

# Email (Resend)
RESEND_API_KEY=re_...
FROM_EMAIL=contact@explorouen.com

# Configuration production
NODE_ENV=production
PORT=10000
FRONTEND_URL=https://explorouen.netlify.app
```

### 1.3 Migrer la base de données

```bash
cd rouen-explorer-backend
npm install
npx prisma migrate deploy
npx prisma db seed
```

---

## 🌐 ÉTAPE 2 : Déployer le Backend sur Render

### 2.1 Préparer le repository

1. Commit et push tous les changements sur GitHub
2. S'assurer que `render.yaml` et `Dockerfile` sont présents

### 2.2 Déployer sur Render

1. Aller sur [Render.com](https://render.com)
2. Créer un compte gratuit
3. Connecter votre repository GitHub
4. Créer un nouveau "Web Service"
5. Sélectionner le dossier `rouen-explorer-backend`
6. Render détectera automatiquement le `render.yaml`

### 2.3 Configurer les variables d'environnement

Dans Render Dashboard > Environment :
- `DATABASE_URL` : URL Supabase
- `CLERK_PUBLISHABLE_KEY` : Votre clé Clerk
- `CLERK_SECRET_KEY` : Votre clé secrète Clerk
- `JWT_SECRET` : Votre secret JWT
- `RESEND_API_KEY` : Votre clé Resend
- `FROM_EMAIL` : Votre email d'envoi

### 2.4 Déployer

Render va automatiquement :
- Build votre application
- Créer la base de données PostgreSQL
- Déployer sur une URL comme `https://explorouen-backend.onrender.com`

---

## 📱 ÉTAPE 3 : Déployer le Frontend PWA

### 3.1 Configurer l'URL du backend

Modifier `ExploRouen_Frontend/.env` :

```env
EXPO_PUBLIC_URL_BACKEND=https://explorouen-backend.onrender.com/api
EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
JAWG_ACCESS_TOKEN=...
```

### 3.2 Build la version web

```bash
cd ExploRouen_Frontend
npx expo export --platform web
```

Cela crée un dossier `dist/` avec votre PWA.

### 3.3 Déployer sur Netlify

**Option A : Drag & Drop (plus simple)**
1. Aller sur [Netlify.com](https://netlify.com)
2. Créer un compte gratuit
3. Drag & drop le dossier `dist/` sur la page d'accueil
4. Votre app est en ligne !

**Option B : GitHub (automatique)**
1. Push le dossier `dist/` sur GitHub
2. Connecter le repository à Netlify
3. Déploiement automatique à chaque push

---

## 📲 ÉTAPE 4 : Installation Mobile

### 4.1 PWA Installation

Les utilisateurs peuvent installer votre app :

**Sur Android :**
1. Ouvrir l'URL dans Chrome
2. Menu > "Ajouter à l'écran d'accueil"
3. L'app s'installe comme une vraie app

**Sur iOS :**
1. Ouvrir l'URL dans Safari
2. Bouton Partage > "Sur l'écran d'accueil"
3. L'app s'installe

### 4.2 Fonctionnalités PWA

✅ **Fonctionne hors ligne**
✅ **Notifications push**
✅ **Icône sur l'écran d'accueil**
✅ **Plein écran (sans barre d'adresse)**
✅ **Accès à la caméra, GPS, etc.**

---

## 🔄 ÉTAPE 5 : Mises à jour

### Backend
- Push sur GitHub → Render redéploie automatiquement

### Frontend
- `npx expo export --platform web`
- Upload le nouveau `dist/` sur Netlify
- Les utilisateurs reçoivent la mise à jour automatiquement

---

## 💡 Conseils et Optimisations

### Performance
- Render gratuit "s'endort" après 15min d'inactivité
- Premier accès peut être lent (réveil du serveur)
- Considérer un ping automatique pour maintenir actif

### Domaine personnalisé
- Netlify : Gratuit avec sous-domaine `.netlify.app`
- Domaine custom : ~10€/an

### Monitoring
- Render Dashboard pour logs backend
- Netlify Analytics pour trafic frontend

---

## 🆘 Dépannage

### Backend ne démarre pas
1. Vérifier les logs dans Render Dashboard
2. S'assurer que `DATABASE_URL` est correcte
3. Vérifier que Prisma migrate a fonctionné

### Frontend ne se connecte pas
1. Vérifier `EXPO_PUBLIC_URL_BACKEND` dans `.env`
2. Tester l'URL backend directement
3. Vérifier CORS dans le backend

### App ne s'installe pas
1. Vérifier que `app.json` contient la config PWA
2. Tester sur HTTPS (requis pour PWA)
3. Vérifier le manifest.json généré

---

## 📊 Limitations Plan Gratuit

| Service | Limitation |
|---------|------------|
| Render | 750h/mois, sleep après 15min |
| Netlify | 100GB/mois |
| Supabase | 500MB DB, 2 projets |

**Pour la plupart des projets, ces limites sont largement suffisantes !**

---

## 🎉 Félicitations !

Votre app ExploRouen est maintenant en ligne et accessible à tous, gratuitement !

**Partagez simplement l'URL** et vos utilisateurs pourront :
- Utiliser l'app dans leur navigateur
- L'installer sur leur téléphone
- Profiter de toutes les fonctionnalités natives

**URL de test** : Remplacez par votre vraie URL une fois déployée

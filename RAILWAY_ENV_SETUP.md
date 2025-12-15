# Configuration des Variables d'Environnement Railway

## ⚠️ URGENT - Variables Manquantes

Votre déploiement Railway échoue car les variables d'environnement ne sont pas configurées.

## 📋 Variables à Configurer sur Railway

Allez dans votre projet Railway → **Variables** et ajoutez :

### 🔴 CRITIQUES (Sans ces variables, l'app ne démarre pas)

```env
DATABASE_URL=postgresql://postgres:Henrietteangelia17@db.cqznuqmrpchoijoqvqtf.supabase.co:6543/postgres?pgbouncer=true

DIRECT_URL=postgresql://postgres:Henrietteangelia17@db.cqznuqmrpchoijoqvqtf.supabase.co:6543/postgres?pgbouncer=true

MONGODB_URL=mongodb+srv://petythprincebelvy_db_user:r53WM7n9CmujSuHO@explorouen-cluster.jmaokib.mongodb.net/explorouen?retryWrites=true&w=majority&appName=explorouen-cluster

NODE_ENV=production

PORT=8080
```

### 🟡 IMPORTANTES (Auth et JWT)

```env
CLERK_PUBLISHABLE_KEY=pk_test_YW1wbGUtYmVkYnVnLTMxLmNsZXJrLmFjY291bnRzLmRldiQ

CLERK_SECRET_KEY=sk_test_IM3EePwuk0LOluniGS9PsZiMDDVoOEt820D4h7sQUR

JWT_SECRET=b556553fcaa8669e27a8fe557808377ee3a89930440b0a52704283a5aa0b6323d9ba3a9835b93a619f9fe14668f22528
```

### 🟢 OPTIONNELLES (Pour Redis et Email)

```env
REDIS_URL=redis://red-ct7tr9aj1k6c73a3c1ug:6379

FRONTEND_URL=https://votre-frontend.vercel.app

SUPABASE_URL=https://cqznuqmrpchoijoqvqtf.supabase.co

SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNxem51cW1ycGNob2lqb3F2cXRmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjU1NTkwMDAsImV4cCI6MjA4MTEzNTAwMH0.sWcwYdmTpZouqdLqgEqocqxjMDcCATC-JuHuTp5j4BA

MAX_FILE_SIZE=5242880

UPLOAD_PATH=./uploads
```

## 🚀 Étapes de Configuration

1. **Aller sur Railway Dashboard**
   - https://railway.app/dashboard
   - Sélectionner votre projet EXPLOROUEN

2. **Onglet Variables**
   - Cliquer sur l'onglet "Variables"
   - Cliquer sur "+ New Variable"

3. **Ajouter chaque variable**
   - Copier le nom (ex: `DATABASE_URL`)
   - Copier la valeur
   - Cliquer "Add"

4. **Redéployer**
   - Une fois toutes les variables ajoutées
   - Railway redéploiera automatiquement
   - OU cliquer sur "Deploy" manuellement

## 🔧 Alternative : Railway CLI

Si vous préférez utiliser le CLI :

```bash
# Installer Railway CLI
npm install -g @railway/cli

# Se connecter
railway login

# Sélectionner votre projet
railway link

# Ajouter les variables
railway variables set DATABASE_URL="postgresql://postgres:Henrietteangelia17@db.cqznuqmrpchoijoqvqtf.supabase.co:6543/postgres?pgbouncer=true"

railway variables set MONGODB_URL="mongodb+srv://petythprincebelvy_db_user:r53WM7n9CmujSuHO@explorouen-cluster.jmaokib.mongodb.net/explorouen?retryWrites=true&w=majority&appName=explorouen-cluster"

railway variables set CLERK_SECRET_KEY="sk_test_IM3EePwuk0LOluniGS9PsZiMDDVoOEt820D4h7sQUR"

railway variables set JWT_SECRET="b556553fcaa8669e27a8fe557808377ee3a89930440b0a52704283a5aa0b6323d9ba3a9835b93a619f9fe14668f22528"

railway variables set NODE_ENV="production"

railway variables set PORT="8080"
```

## ⚠️ Note sur Redis

Si vous n'avez pas de service Redis sur Railway :

**Option 1** : Ajouter un service Redis
1. Dans Railway, cliquer "+ New"
2. Sélectionner "Database" → "Redis"
3. Une fois créé, copier le `REDIS_URL` dans les variables

**Option 2** : Désactiver Redis temporairement
- Le serveur peut fonctionner sans Redis (le cache sera désactivé)
- Les erreurs Redis n'empêchent pas le démarrage

## ✅ Vérification

Après configuration, les logs Railway devraient afficher :
```
✅ Base de données connectée
🚀 Serveur démarré sur le port 8080
```

Au lieu de :
```
❌ error: Environment variable not found: DATABASE_URL
```

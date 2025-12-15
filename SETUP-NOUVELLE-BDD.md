# Configuration de la Nouvelle Base de Données Supabase

## Étape 1 : Obtenir le mot de passe de la base de données

1. Allez sur https://supabase.com/dashboard
2. Sélectionnez votre projet `hxdkddyylupenfnkxafn`
3. Cliquez sur **Settings** (⚙️) dans la barre latérale gauche
4. Cliquez sur **Database**
5. Dans la section **Connection string**, trouvez :
   - **Host** : devrait être quelque chose comme `aws-0-eu-central-1.pooler.supabase.com`
   - **Database password** : Cliquez sur le bouton pour révéler/copier le mot de passe

## Étape 2 : Mettre à jour le fichier .env

Remplacez `[VOTRE_MOT_DE_PASSE]` dans les deux lignes par le mot de passe obtenu :

```
DATABASE_URL=postgresql://postgres.hxdkddyylupenfnkxafn:VOTRE_MOT_DE_PASSE_ICI@aws-0-eu-central-1.pooler.supabase.com:6543/postgres?pgbouncer=true&sslmode=require&connection_limit=1

DIRECT_URL=postgresql://postgres.hxdkddyylupenfnkxafn:VOTRE_MOT_DE_PASSE_ICI@aws-0-eu-central-1.pooler.supabase.com:5432/postgres?sslmode=require
```

**Note** : Vérifiez aussi le HOST. Il pourrait être différent selon la région.

## Étape 3 : Pousser le schéma vers PostgreSQL

```powershell
cd c:\Users\fifou\Downloads\ExploRouen_Projet\rouen-explorer-backend
npx prisma db push
```

## Étape 4 : Générer le client Prisma

```powershell
npx prisma generate
```

## Étape 5 : Insérer les données de test

```powershell
npx tsx prisma/seed.ts
```

## Étape 6 : Lancer le backend

```powershell
npm run dev
```

## Étape 7 : Lancer le frontend

Dans un nouveau terminal :

```powershell
cd c:\Users\fifou\Downloads\ExploRouen_Projet\ExploRouen_Frontend
npx expo start --port 8082
```

---

## Vérification

Une fois tout lancé, vérifiez que les données s'affichent :
- Backend devrait être sur http://192.168.1.119:5000
- Frontend sur http://192.168.1.62:8082
- Testez : http://192.168.1.119:5000/api/activities

Vous devriez voir des activités en JSON !

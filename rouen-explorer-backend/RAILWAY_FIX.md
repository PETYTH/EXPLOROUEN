# ⚠️ MISE À JOUR URGENTE - Variables Railway

## 🔧 Modifications Apportées

### 1. ✅ **Redis désactivé** 
   - Plus d'erreurs en boucle
   - Fonctionne sans Redis

### 2. ✅ **Index MongoDB corrigé**
   - Warning Mongoose résolu

### 3. ✅ **Port Supabase changé**
   - **6543** (pooler) ❌ → **5432** (direct) ✅
   - Railway bloque le port 6543

---

## 🚨 ACTION REQUISE SUR RAILWAY

### Mettre à jour ces 2 variables :

```env
DATABASE_URL=postgresql://postgres:Henrietteangelia17@db.cqznuqmrpchoijoqvqtf.supabase.co:5432/postgres

DIRECT_URL=postgresql://postgres:Henrietteangelia17@db.cqznuqmrpchoijoqvqtf.supabase.co:5432/postgres
```

### Redis (optionnel)

Si vous n'utilisez pas Redis, **supprimer** la variable `REDIS_URL` de Railway.

OU la laisser vide / ne pas la définir.

---

## 📍 Étapes

1. **Railway Dashboard** → Votre projet EXPLOROUEN
2. **Onglet Variables**
3. **Modifier** `DATABASE_URL` et `DIRECT_URL`
4. **Changer** `:6543` → `:5432`
5. **Supprimer** `?pgbouncer=true` à la fin
6. **Save** → Redéploiement auto

---

## ✅ Résultat Attendu

Après mise à jour, les logs devraient afficher :

```
✅ MongoDB connecté
✅ Base de données PostgreSQL connectée
🚀 Serveur démarré sur le port 8080
```

Au lieu de :

```
❌ Can't reach database server at db.cqznuqmrpchoijoqvqtf.supabase.co:6543
❌ Redis Error: connect ECONNREFUSED
```

---

## 🔍 Pourquoi ce changement ?

**Port 6543 (PgBouncer Pooler)**
- ❌ Bloqué par Railway
- ❌ Timeout de connexion

**Port 5432 (Direct Connection)**
- ✅ Port PostgreSQL standard
- ✅ Accepté par Railway
- ✅ Connexion directe stable

FROM node:18-alpine AS base

# Installer les dépendances système
RUN apk add --no-cache libc6-compat dumb-init

# Créer le répertoire de l'app
WORKDIR /app

# Copier les fichiers de configuration
COPY package*.json ./
COPY prisma ./prisma/

# Installer les dépendances
RUN npm ci --only=production && npm cache clean --force

# Générer le client Prisma
RUN npx prisma generate

# Copier le code source
COPY . .

# Build de l'application
RUN npm run build

# Créer un utilisateur non-root
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nodejs

# Créer le dossier uploads avec les bonnes permissions
RUN mkdir -p uploads && chown nodejs:nodejs uploads

# Changer vers l'utilisateur non-root
USER nodejs

# Exposer le port
EXPOSE 3001

# Variables d'environnement
ENV NODE_ENV=production
ENV PORT=3001

# Point d'entrée avec dumb-init pour une gestion correcte des signaux
ENTRYPOINT ["dumb-init", "--"]

# Commande de démarrage
CMD ["npm", "start"]

// ===== VARIABLES D'ENVIRONNEMENT =====
// .env.example
# =========================
# CONFIGURATION SERVEUR
# =========================
NODE_ENV=development
PORT=3001

# =========================
# BASE DE DONNÉES
# =========================
DATABASE_URL=postgresql://postgres:postgres123@localhost:5432/norman_explorer

# =========================
# REDIS CACHE
# =========================
REDIS_URL=redis://:redis123@localhost:6379

# =========================
# AUTHENTIFICATION JWT
# =========================
JWT_SECRET=norman-explorer-super-secret-jwt-key-change-in-production-minimum-32-characters
JWT_REFRESH_SECRET=norman-explorer-refresh-secret-key-change-in-production-minimum-32-characters

# =========================
# URLS ET CORS
# =========================
FRONTEND_URL=http://localhost:3000

# =========================
# SERVICE EMAIL (SENDGRID)
# =========================
SENDGRID_API_KEY=your-sendgrid-api-key-here
FROM_EMAIL=noreply@norman-explorer.fr

# =========================
# UPLOAD ET STOCKAGE
# =========================
UPLOAD_DIR=./uploads
MAX_UPLOAD_SIZE=10485760

# =========================
# MONITORING (OPTIONNEL)
# =========================
SENTRY_DSN=your-sentry-dsn-for-error-tracking

# =========================
# API EXTERNES (OPTIONNEL)
# =========================
WEATHER_API_KEY=your-weather-api-key
MAPS_API_KEY=your-maps-api-key
FROM node:18-alpine

WORKDIR /app

# Copier package.json et package-lock.json
COPY package*.json ./

# Installer les dépendances (incluant devDependencies pour le build)
RUN npm ci

# Copier le schema Prisma
COPY prisma ./prisma/

# Générer le client Prisma
RUN npx prisma generate

# Copier le code source
COPY . .

# Build de l'application TypeScript
RUN npm run build

# Supprimer les devDependencies après le build
RUN npm prune --production

# Exposer le port
EXPOSE 10000

# Variables d'environnement par défaut
ENV NODE_ENV=production
ENV PORT=10000

# Commande de démarrage
CMD ["npm", "start"]
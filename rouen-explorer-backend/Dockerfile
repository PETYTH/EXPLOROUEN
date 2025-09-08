FROM node:18

# Install OpenSSL libraries and other dependencies required by Prisma
RUN apt-get update && apt-get install -y \
    openssl \
    ca-certificates \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copier package.json et package-lock.json
COPY package*.json ./

# Installer les dépendances (incluant devDependencies pour le build)
RUN npm ci

# Copier le schema Prisma
COPY prisma ./prisma/

# Copier le code source
COPY . .

# Générer le client Prisma avec DATABASE_URL par défaut pour le build
ENV DATABASE_URL=postgresql://localhost:5432/explorouen
RUN npx prisma generate

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
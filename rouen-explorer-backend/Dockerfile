FROM node:18-alpine

# Définir le répertoire de travail
WORKDIR /app

# Copier les fichiers de dépendances
COPY package*.json ./

# Installer TOUTES les dépendances (y compris devDependencies pour le build)
RUN npm ci

# Copier le schema Prisma en premier
COPY prisma ./prisma/

# Copier le code source
COPY . .

# Construire l'application
RUN npm run build

# Générer le client Prisma
RUN npx prisma generate

# Supprimer les devDependencies après le build
RUN npm prune --production

# Exposer le port
EXPOSE 10000

# Commande de démarrage
CMD ["npm", "start"]
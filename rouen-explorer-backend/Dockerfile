FROM node:18-alpine

# Définir le répertoire de travail
WORKDIR /app

# Copier les fichiers de dépendances
COPY package*.json ./

# Installer les dépendances
RUN npm ci --only=production

# Copier le code source
COPY . .

# Construire l'application
RUN npm run build

# Générer le client Prisma
RUN npx prisma generate

# Exposer le port
EXPOSE 10000

# Commande de démarrage
CMD ["npm", "start"]
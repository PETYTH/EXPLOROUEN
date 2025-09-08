// src/config/index.ts
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';

// Vérifier si le fichier .env existe
const envPath = path.resolve(process.cwd(), '.env');
console.log('🔍 Chemin du fichier .env:', envPath);
console.log('Fichier .env existe:', fs.existsSync(envPath));

// Afficher le contenu du fichier .env
if (fs.existsSync(envPath)) {
    try {
        const envContent = fs.readFileSync(envPath, 'utf8');
        console.log('📝 Contenu du fichier .env:');
        console.log(envContent.split('\n').map(line => 
            line.startsWith('RESEND_API_KEY') ? 'RESEND_API_KEY=***' : line
        ).join('\n'));
    } catch (error) {
        console.error('❌ Erreur lors de la lecture du fichier .env:', error);
    }
}

// Charger les variables d'environnement
dotenv.config({ path: envPath, override: true, debug: true });

// Afficher toutes les variables d'environnement (sans les valeurs sensibles)
console.log('🔧 Variables d\'environnement chargées:', {
  NODE_ENV: process.env.NODE_ENV || 'non défini',
  PORT: process.env.PORT || 'non défini',
  DATABASE_URL: process.env.DATABASE_URL ? '***' : 'non défini',
  JWT_SECRET: process.env.JWT_SECRET ? '***' : 'non défini',
  REDIS_URL: process.env.REDIS_URL || 'non défini',
  RESEND_API_KEY: process.env.RESEND_API_KEY ? '***' : 'non défini',
  FROM_EMAIL: process.env.FROM_EMAIL || 'non défini',
  FRONTEND_URL: process.env.FRONTEND_URL || 'non défini',
  MONGODB_URL: process.env.MONGODB_URL || 'non défini',
  MAILTRAP_USER: process.env.MAILTRAP_USER ? '***' : 'non défini',
  MAILTRAP_PASS: process.env.MAILTRAP_PASS ? '***' : 'non défini',
  CLERK_PUBLISHABLE_KEY: process.env.CLERK_PUBLISHABLE_KEY ? '***' : 'non défini',
  CLERK_SECRET_KEY: process.env.CLERK_SECRET_KEY ? '***' : 'non défini'
});

// Vérifier les chemins de résolution
console.log('📂 Répertoire de travail:', process.cwd());
console.log('📂 Répertoire du module:', __dirname);

export const config = {
    // Serveur
    port: process.env.PORT || 10000,
    nodeEnv: process.env.NODE_ENV || 'development',

    // Base de données
    database: {
        url: process.env.DATABASE_URL || 'file:./dev.db'
    },
    mongodb: {
        url: process.env.MONGODB_URL || 'mongodb://localhost:27017/ExploRouen'
    },

    // Redis
    redisUrl: process.env.REDIS_URL || 'redis://localhost:6379',

    // JWT
    jwtSecret: process.env.JWT_SECRET || 'norman-explorer-super-secret-key-change-in-production',
    jwtRefreshSecret: process.env.JWT_REFRESH_SECRET || 'norman-refresh-super-secret-key',
    jwtExpiresIn: '15m',
    jwtRefreshExpiresIn: '7d',

    // Sécurité
    bcryptRounds: 12,
    corsOrigin: [
        process.env.FRONTEND_URL || 'http://localhost:8081',
        'http://localhost:8081',
        'http://localhost:19006',    // Expo web dev server
        'http://127.0.0.1:8081',
        'http://127.0.0.1:19006',
        'http://192.168.140.1:8081', // IP locale pour Expo
        'http://192.168.140.1:5000', // IP locale pour API calls depuis mobile
        'exp://192.168.140.1:8081',  // Protocole Expo
        'exp://localhost:8081',
        '*' // Autoriser toutes les origines pour le développement
    ],

    // Email
    emailService: {
        apiKey: process.env.RESEND_API_KEY || '',
        from: process.env.FROM_EMAIL || 'contact@explorouen.fr',
        provider: process.env.EMAIL_PROVIDER || 'resend',
        mailtrapUser: process.env.MAILTRAP_USER || '',
        mailtrapPass: process.env.MAILTRAP_PASS || '',
        mailtrapHost: process.env.MAILTRAP_HOST || 'sandbox.smtp.mailtrap.io'
    } as const,

    // Upload
    uploadPath: process.env.UPLOAD_PATH || './uploads',
    maxFileSize: parseInt(process.env.MAX_FILE_SIZE || '5242880'), // 5MB par défaut
    allowedImageTypes: ['image/jpeg', 'image/png', 'image/webp'],

    // Rate limiting
    rateLimits: {
        windowMs: 15 * 60 * 1000, // 15 minutes
        maxRequests: 10000000
    },

    // Clerk
    clerk: {
        publishableKey: process.env.CLERK_PUBLISHABLE_KEY || '',
        secretKey: process.env.CLERK_SECRET_KEY || ''
    }
};
// src/server.ts 
import express from 'express';
import { createServer } from 'http';
import { initSocket } from './utils/socket';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { config } from './config';
import { connectDatabase } from './utils/database';
import { connectMongoDB } from './config/mongodb';
import { connectDatabases } from './config/prisma';
import { errorHandler, sanitizeInput } from './middleware/security.middleware';
import compression from 'compression';
import mongoSanitize from 'express-mongo-sanitize';
import { CleanupJob } from './jobs/cleanup.job';
import { startNotificationsJob, stopNotificationsJob } from './jobs/notifications.job';
import cacheService from './services/cache.service';

// Routes
import placesRoutes from './routes/places.routes';
import activitiesRoutes from './routes/activities.routes';
import contactRoutes from './routes/contact.routes';
import mapsRoutes from './routes/maps.routes';
import notificationsRoutes from './routes/notifications.routes';
import chatRoutes from './routes/chat.routes';
import monumentsRoutes from './routes/monuments.routes';
import messagesRoutes from './routes/messages.routes';
import discussionsRoutes from './routes/discussions.routes';
import usersRoutes from './routes/users.routes';
import uploadRoutes from './routes/upload.routes';
// import treasuresRoutes from './routes/treasures.routes';

const app = express();
const server = createServer(app);
const io = initSocket(server);

// Middlewares de sécurité
app.use(helmet({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            styleSrc: ["'self'", "'unsafe-inline'"],
            scriptSrc: ["'self'"],
            imgSrc: ["'self'", "data:", "https:"],
            connectSrc: ["'self'"],
            fontSrc: ["'self'"],
            objectSrc: ["'none'"],
            mediaSrc: ["'self'"],
            frameSrc: ["'none'"],
        },
    },
}));

app.use(cors({
    origin: config.corsOrigin,
    credentials: true,
    optionsSuccessStatus: 200,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));

// Rate limiting général - Configuration plus permissive pour le développement
const generalLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: config.nodeEnv === 'production' ? 100 : 100000, // 1000 requêtes en dev, 100 en prod
    message: {
        success: false,
        message: 'Trop de requêtes. Réessayez dans 15 minutes.'
    },
    standardHeaders: true,
    legacyHeaders: false,
    skip: (req) => {
        // Désactiver le rate limiting pour les routes de développement
        return config.nodeEnv === 'development' && req.ip === '127.0.0.1';
    }
});

app.use(generalLimiter);
app.use(compression());
app.use(mongoSanitize());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(sanitizeInput);

// Routes API
app.use('/api/places', placesRoutes);
app.use('/api/activities', activitiesRoutes);
app.use('/api/contact', contactRoutes);
app.use('/api/maps', mapsRoutes);
app.use('/api/notifications', notificationsRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/monuments', monumentsRoutes);
app.use('/api/messages', messagesRoutes);
app.use('/api/discussions', discussionsRoutes);
app.use('/api/users', usersRoutes);
app.use('/api/upload', uploadRoutes);
// app.use('/api', testRoutes); // Routes de test
// app.use('/api/treasures', treasuresRoutes); // Temporairement désactivé

// Servir les fichiers uploadés
app.use('/uploads', express.static('uploads'));

// Health check
app.get('/health', async (_req, res) => {
    const cacheHealth = await cacheService.healthCheck();
    const cacheStats = await cacheService.getStats();
    
    res.json({
        success: true,
        message: 'ExploRouen API is running',
        timestamp: new Date().toISOString(),
        version: '1.0.0',
        cache: {
            available: cacheHealth,
            stats: cacheStats
        }
    });
});

// WebSocket pour le chat en temps réel
io.on('connection', (socket) => {
    // Client connecté
    
    // Identifier l'utilisateur pour les notifications personnelles
    socket.on('identify', (userId: string) => {
        console.log(`👤 Utilisateur identifié sur socket: ${userId}`);
        socket.join(`user-${userId}`);
    });

    // Rejoindre une discussion
    socket.on('join-discussion', (discussionId: string) => {
        socket.join(`discussion-${discussionId}`);
        // Client a rejoint la discussion
    });

    // Quitter une discussion
    socket.on('leave-discussion', (discussionId: string) => {
        socket.leave(`discussion-${discussionId}`);
        // Client a quitté la discussion
    });

    // Envoyer un message
    socket.on('send-message', (data: {
        discussionId: string;
        message: any;
    }) => {
        socket.to(`discussion-${data.discussionId}`).emit('new-message', data.message);
    });

    // Notification de frappe
    socket.on('typing', (data: {
        discussionId: string;
        user: any;
    }) => {
        socket.to(`discussion-${data.discussionId}`).emit('user-typing', data.user);
    });

    // Arrêt de frappe
    socket.on('stop-typing', (data: {
        discussionId: string;
        user: any;
    }) => {
        socket.to(`discussion-${data.discussionId}`).emit('user-stop-typing', data.user);
    });

    socket.on('disconnect', () => {
        // Client déconnecté
    });
});

// Middleware de gestion des erreurs (doit être en dernier)
app.use(errorHandler);

// 404 handler
app.use('*', (_req, res) => {
    res.status(404).json({
        success: false,
        message: 'Route non trouvée'
    });
});

// Démarrage du serveur
const startServer = async () => {
    console.log('🔍 Configuration du serveur:', {
        port: config.port,
        nodeEnv: config.nodeEnv,
        corsOrigin: config.corsOrigin,
        databaseUrl: config.database.url,
        mongodbUrl: config.mongodb.url
    });

    try {
        console.log('🔌 Connexion aux bases de données...');
        
        // Connecter PostgreSQL (Supabase) et SQLite (Cache)
        await connectDatabases();
        
        // Connecter l'ancienne base si nécessaire (compatibilité)
        await connectDatabase();
        console.log('✅ Base de données legacy connectée');

        // Connecter MongoDB (pour les messages de contact, etc.)
        console.log('🔌 Connexion à MongoDB...');
        try {
            await connectMongoDB();
            console.log('✅ MongoDB connecté');
            
            // Démarrer les tâches de nettoyage automatique en production
            if (config.nodeEnv === 'production') {
                CleanupJob.start();
            }
        } catch (error) {
            console.error('⚠️ Erreur connexion MongoDB (non bloquant):', error);
        }
        
        // Démarrer le job de notifications programmées (toujours actif)
        startNotificationsJob();
        
        // Nettoyer le cache au démarrage
        await cacheService.cleanExpiredImages();
        await cacheService.cleanOldLogs();

        console.log('🚀 Démarrage du serveur...');
        
        server.listen(Number(config.port), '0.0.0.0', () => {
            console.log(`✅ Serveur démarré sur le port ${config.port}`);
            console.log(`🌍 Environnement: ${config.nodeEnv}`);
            console.log(`📡 CORS autorisé pour: ${config.corsOrigin}`);
            console.log(`🌐 Serveur accessible sur toutes les interfaces (0.0.0.0:${config.port})`);
        });
    } catch (error) {
        console.error('❌ Erreur lors du démarrage du serveur:', error);
        process.exit(1);
    }
};

// Gestion des signaux d'arrêt
process.on('SIGINT', () => {
    console.log('🛑 Arrêt du serveur...');
    if (config.nodeEnv === 'production') {
        CleanupJob.stop();
    }
    stopNotificationsJob();
    server.close(() => {
        console.log('✅ Serveur arrêté proprement');
        process.exit(0);
    });
});

process.on('uncaughtException', (error) => {
    console.error('❌ Exception non gérée:', error);
    process.exit(1);
});

process.on('unhandledRejection', (reason, _promise) => {
    console.error('❌ Promesse rejetée non gérée:', reason);
    process.exit(1);
});

startServer();

export default app;

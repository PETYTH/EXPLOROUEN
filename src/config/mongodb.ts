// src/config/mongodb.ts
import mongoose from 'mongoose';
import { config } from './index';

export const connectMongoDB = async () => {
    try {
        const mongoUrl = config.mongodb.url;
        if (!mongoUrl) {
            console.log('⚠️ MongoDB URL non configurée, connexion ignorée');
            return;
        }
        console.log('🔌 Tentative de connexion à MongoDB Atlas...');
        console.log('📍 URL (masquée):', mongoUrl.replace(/\/\/[^:]+:[^@]+@/, '//***:***@'));
        
        // Désactiver le buffering pour voir les erreurs immédiatement
        mongoose.set('bufferCommands', false);
        mongoose.set('bufferTimeoutMS', 30000);
        
        await mongoose.connect(mongoUrl, {
            maxPoolSize: 10,
            serverSelectionTimeoutMS: 30000,
            socketTimeoutMS: 45000,
            connectTimeoutMS: 30000,
        });
        console.log('✅ MongoDB connecté avec succès');
        console.log('📊 Base de données:', mongoose.connection.name);
        console.log('📊 État de connexion:', mongoose.connection.readyState); // 1 = connected
    } catch (error) {
        console.error('❌ Erreur de connexion MongoDB:', error);
        // Ne pas arrêter le serveur si MongoDB n'est pas disponible
        console.log('⚠️ Continuant sans MongoDB...');
    }
};

export const disconnectMongoDB = async () => {
    await mongoose.disconnect();
    console.log('✅ MongoDB déconnecté');
};

// Gestion des événements MongoDB
mongoose.connection.on('connected', () => {
    console.log('🔗 Mongoose connecté à MongoDB');
    console.log('📊 État:', mongoose.connection.readyState);
});

mongoose.connection.on('error', (err) => {
    console.error('❌ Erreur Mongoose:', err);
    console.error('📊 État de connexion:', mongoose.connection.readyState);
});

mongoose.connection.on('disconnected', () => {
    console.log('🔌 Mongoose déconnecté de MongoDB');
    console.log('📊 État:', mongoose.connection.readyState);
});

mongoose.connection.on('connecting', () => {
    console.log('⏳ Mongoose en cours de connexion...');
});

mongoose.connection.on('reconnected', () => {
    console.log('🔄 Mongoose reconnecté à MongoDB');
});

// Fermeture propre lors de l'arrêt de l'application
process.on('SIGINT', async () => {
    await mongoose.connection.close();
    console.log('🛑 Connexion MongoDB fermée via SIGINT');
    process.exit(0);
});

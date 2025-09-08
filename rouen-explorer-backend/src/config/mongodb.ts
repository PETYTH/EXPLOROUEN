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
        await mongoose.connect(mongoUrl, {
            maxPoolSize: 10,
            serverSelectionTimeoutMS: 5000,
            socketTimeoutMS: 45000,
        });
        console.log('✅ MongoDB connecté avec succès');
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
});

mongoose.connection.on('error', (err) => {
    console.error('❌ Erreur Mongoose:', err);
});

mongoose.connection.on('disconnected', () => {
    console.log('🔌 Mongoose déconnecté de MongoDB');
});

// Fermeture propre lors de l'arrêt de l'application
process.on('SIGINT', async () => {
    await mongoose.connection.close();
    console.log('🛑 Connexion MongoDB fermée via SIGINT');
    process.exit(0);
});

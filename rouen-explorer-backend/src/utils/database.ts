import { PrismaClient } from '@prisma/client';

export const prisma = new PrismaClient({
    log: ['query', 'info', 'warn', 'error'],
    errorFormat: 'pretty',
});

export const connectDatabase = async () => {
    try {
        await prisma.$connect();
        // Base de données connectée avec succès

        // Test de connexion
        await prisma.$queryRaw`SELECT 1`;
        // Test de connexion réussi
    } catch (error) {
        console.error('❌ Erreur de connexion à la base de données:', error);
        process.exit(1);
    }
};

export const disconnectDatabase = async () => {
    await prisma.$disconnect();
    // Base de données déconnectée
};

// Fonction pour gérer les transactions
export const executeTransaction = async <T>(
    callback: (prisma: Omit<PrismaClient, '$connect' | '$disconnect' | '$on' | '$transaction' | '$use' | '$extends'>) => Promise<T>
): Promise<T> => {
    return prisma.$transaction(callback);
};

import { PrismaClient } from '@prisma/client';

// Client PostgreSQL pour toutes les données
export const prisma = new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
});

// Alias pour compatibilité
export const cacheDb = prisma;

// Connexion gracieuse
export const connectDatabases = async () => {
  try {
    await prisma.$connect();
    console.log('✅ PostgreSQL connecté (Supabase)');
    
    // Test de connexion
    await prisma.$queryRaw`SELECT 1`;
    console.log('✅ Base de données opérationnelle');
    
    return true;
  } catch (error) {
    console.error('❌ Erreur de connexion à PostgreSQL:', error);
    throw error;
  }
};

// Déconnexion gracieuse
export const disconnectDatabases = async () => {
  await prisma.$disconnect();
  console.log('🔌 Base de données déconnectée');
};

// Gestion des signaux de fermeture
process.on('SIGINT', async () => {
  await disconnectDatabases();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  await disconnectDatabases();
  process.exit(0);
});

export default prisma;

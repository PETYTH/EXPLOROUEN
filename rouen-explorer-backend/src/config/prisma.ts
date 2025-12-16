import { PrismaClient } from '@prisma/client';

// Client PostgreSQL pour toutes les données avec pool limité
export const prisma = new PrismaClient({
  log: process.env.NODE_ENV === 'production' ? ['error', 'warn'] : ['error'],
  datasources: {
    db: {
      url: process.env.DATABASE_URL
    }
  }
});

// Alias pour compatibilité
export const cacheDb = prisma;

// Connexion gracieuse (non bloquante)
export const connectDatabases = async () => {
  try {
    await prisma.$connect();
    console.log('✅ PostgreSQL connecté (Supabase)');
    
    // Test de connexion
    await prisma.$queryRaw`SELECT 1`;
    console.log('✅ Base de données opérationnelle');
    
    return true;
  } catch (error) {
    console.warn('⚠️ PostgreSQL non disponible - Mode dégradé:', error.message);
    // Ne pas throw, continuer sans PostgreSQL
    return false;
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

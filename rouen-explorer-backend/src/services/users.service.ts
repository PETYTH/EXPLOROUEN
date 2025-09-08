import { prisma } from '../utils/database';

export class UsersService {
  constructor() {
    // Utilisation de l'instance Prisma centralisée
  }

  // Récupérer les statistiques d'un utilisateur
  async getUserStats(userId: string) {
    try {
      // Compter les activités auxquelles l'utilisateur est inscrit
      const registeredActivities = await prisma.registration.count({
        where: { 
          userId,
          type: 'ACTIVITY'
        }
      });

      // Compter les activités complétées
      const completedActivities = await prisma.registration.count({
        where: { 
          userId,
          type: 'ACTIVITY',
          status: 'COMPLETED'
        }
      });

      // Compter les monuments visités (simulation basée sur les activités)
      const monumentsVisited = Math.floor(completedActivities * 1.2);

      // Œufs de Pâques trouvés (simulation)
      const easterEggs = Math.floor(completedActivities * 0.8);

      // Autres statistiques (simulation)
      const activeActivities = await prisma.registration.count({
        where: { 
          userId,
          type: 'ACTIVITY',
          status: 'PENDING'
        }
      });

      return {
        registeredActivities,
        activeActivities,
        completedActivities,
        monumentsVisited,
        easterEggs,
        learningJourney: Math.floor(completedActivities * 5),
        quizzesAwaiting: Math.floor(Math.random() * 5) + 1,
        lessonsInQueue: Math.floor(Math.random() * 8) + 2
      };
    } catch (error) {
      console.error('Erreur lors de la récupération des statistiques utilisateur:', error);
      throw error;
    }
  }
}

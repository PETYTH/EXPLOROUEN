import { PrismaClient } from '@prisma/client';
import cron from 'node-cron';

const prisma = new PrismaClient();

// Job qui s'exécute toutes les 30 minutes
export const notificationsJob = cron.schedule('*/30 * * * *', async () => {
  console.log('🔔 Vérification des notifications à envoyer...');
  
  try {
    const now = new Date();
    
    // Récupérer toutes les visites planifiées futures
    const plannedVisits = await prisma.plannedVisit.findMany({
      where: {
        status: 'PLANNED',
        visitDate: {
          gte: now
        }
      },
      include: {
        monument: true
      }
    });

    for (const visit of plannedVisits) {
      const visitDate = new Date(visit.visitDate);
      const timeDiff = visitDate.getTime() - now.getTime();
      const hoursDiff = timeDiff / (1000 * 60 * 60);
      const daysDiff = timeDiff / (1000 * 60 * 60 * 24);

      // Notification le jour même (matin à 8h)
      if (daysDiff < 1 && daysDiff > 0 && !visit.dayNotificationSent) {
        const morningTime = new Date(visitDate);
        morningTime.setHours(8, 0, 0, 0);
        
        if (now >= morningTime) {
          await prisma.notifications.create({
            data: {
              id: `notif-${Date.now()}-day-${visit.id}`,
              userId: visit.userId,
              type: 'VISIT_TODAY',
              title: 'Visite programmée aujourd\'hui',
              message: `N'oubliez pas votre visite de ${visit.monument.name} aujourd'hui à ${visit.timeSlot}`,
              data: JSON.stringify({ monumentId: visit.monumentId, visitId: visit.id }),
              isRead: false,
              createdAt: now,
              updatedAt: now
            }
          });

          await prisma.plannedVisit.update({
            where: { id: visit.id },
            data: { dayNotificationSent: true }
          });

          console.log(`✅ Notification jour envoyée pour visite ${visit.id}`);
        }
      }

      // Notification 1h avant
      if (hoursDiff <= 1 && hoursDiff > 0 && !visit.hourNotificationSent) {
        await prisma.notifications.create({
          data: {
            id: `notif-${Date.now()}-hour-${visit.id}`,
            userId: visit.userId,
            type: 'VISIT_SOON',
            title: 'Visite dans 1 heure',
            message: `Votre visite de ${visit.monument.name} commence dans 1 heure (${visit.timeSlot})`,
            data: JSON.stringify({ monumentId: visit.monumentId, visitId: visit.id }),
            isRead: false,
            createdAt: now,
            updatedAt: now
          }
        });

        await prisma.plannedVisit.update({
          where: { id: visit.id },
          data: { hourNotificationSent: true }
        });

        console.log(`✅ Notification 1h envoyée pour visite ${visit.id}`);
      }

      // Marquer comme complétée si la date est passée
      if (timeDiff < 0) {
        await prisma.plannedVisit.update({
          where: { id: visit.id },
          data: { status: 'COMPLETED' }
        });

        console.log(`✅ Visite ${visit.id} marquée comme complétée`);
      }
    }

    console.log('✅ Vérification des notifications terminée');
  } catch (error) {
    console.error('❌ Erreur lors de la vérification des notifications:', error);
  }
});

export const startNotificationsJob = () => {
  console.log('🔔 Job de notifications démarré (toutes les 30 minutes)');
  notificationsJob.start();
};

export const stopNotificationsJob = () => {
  notificationsJob.stop();
  console.log('🔔 Job de notifications arrêté');
};

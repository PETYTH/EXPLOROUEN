import { PrismaClient } from '@prisma/client';
import { getIO } from '../utils/socket';

const prisma = new PrismaClient();

export class MonumentsService {
  static async getAllMonuments() {
    const monuments = await prisma.monument.findMany({
      orderBy: { name: 'asc' },
      select: {
        id: true,
        name: true,
        description: true,
        image: true,
        visitDuration: true,
        category: true,
        latitude: true,
        longitude: true,
        address: true,
        openingHours: true,
        price: true,
        highlights: true,
        history: true,
        easterEggHints: true,
        createdAt: true,
        updatedAt: true,
        reviews: {
          select: {
            rating: true
          }
        }
      }
    });
    
    // Convertir le champ image en array images et calculer rating depuis reviews
    return monuments.map((monument: any) => {
      const reviews = monument.reviews || [];
      const averageRating = reviews.length > 0 
        ? reviews.reduce((sum: number, r: any) => sum + r.rating, 0) / reviews.length 
        : 0;
      
      return {
        ...monument,
        rating: averageRating,
        images: monument.image ? [monument.image] : [],
        reviews: undefined // Ne pas exposer les reviews dans la liste
      };
    });
  }

  static async getMonumentById(id: string) {
    const monument = await prisma.monument.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        description: true,
        image: true,
        visitDuration: true,
        category: true,
        latitude: true,
        longitude: true,
        address: true,
        openingHours: true,
        price: true,
        highlights: true,
        history: true,
        easterEggHints: true,
        createdAt: true,
        updatedAt: true,
        reviews: {
          select: {
            rating: true
          }
        }
      }
    });
    
    if (!monument) return null;
    
    // Calculer rating depuis reviews
    const reviews = monument.reviews || [];
    const averageRating = reviews.length > 0 
      ? reviews.reduce((sum: number, r: any) => sum + r.rating, 0) / reviews.length 
      : 0;
    
    // Convertir le champ image en array images pour compatibilité frontend
    return {
      ...monument,
      rating: averageRating,
      images: monument.image ? [monument.image] : [],
      reviews: undefined // Ne pas exposer les reviews ici
    };
  }

  static async createMonument(data: any) {
    console.log(' Création du monument avec données:', data);
    
    try {
      const newMonument = await prisma.monument.create({
        data: {
          name: data.name,
          description: data.description,
          address: data.address,
          latitude: data.latitude,
          longitude: data.longitude,
          category: data.category,
          history: data.history || '',
          visitDuration: data.visitDuration || '60',
          price: data.price || '0',
          highlights: data.highlights || '',
          image: data.image || '',
          openingHours: '9h-18h',
          easterEggHints: '',
        },
        select: {
          id: true,
          name: true,
          description: true,
          image: true,
          visitDuration: true,
          category: true,
          latitude: true,
          longitude: true,
          address: true,
          openingHours: true,
          price: true,
          highlights: true,
          history: true,
          easterEggHints: true,
          createdAt: true,
          updatedAt: true
        }
      });

      console.log(' Monument créé avec succès');
      
      return {
        ...newMonument,
        rating: 0,
        images: newMonument.image ? [newMonument.image] : []
      };
    } catch (error) {
      console.error(' Erreur lors de la création du monument:', error);
      throw error;
    }
  }

  static async updateMonument(id: string, data: any) {
    console.log(' Mise à jour du monument:', id, 'avec données:', data);
    
    try {
      const updatedMonument = await prisma.monument.update({
        where: { id },
        data: {
          name: data.name,
          description: data.description,
          address: data.address,
          latitude: data.latitude,
          longitude: data.longitude,
          category: data.category,
          history: data.history,
          visitDuration: data.visitDuration ? data.visitDuration.toString() : undefined,
          price: data.price ? data.price.toString() : undefined,
          highlights: data.highlights,
          image: data.image, // Stocker l'URL de l'image
          updatedAt: new Date()
        },
        select: {
          id: true,
          name: true,
          description: true,
          image: true,
          visitDuration: true,
          category: true,
          latitude: true,
          longitude: true,
          address: true,
          openingHours: true,
          price: true,
          highlights: true,
          history: true,
          easterEggHints: true,
          createdAt: true,
          updatedAt: true
        }
      });

      console.log(' Monument mis à jour avec succès');
      
      // Calculer rating depuis reviews
      const reviews = await prisma.monumentReview.findMany({
        where: { monumentId: id },
        select: { rating: true }
      });
      const averageRating = reviews.length > 0 
        ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length 
        : 0;
      
      return {
        ...updatedMonument,
        rating: averageRating,
        images: updatedMonument.image ? [updatedMonument.image] : []
      };
    } catch (error) {
      console.error('❌ Erreur lors de la mise à jour du monument:', error);
      throw error;
    }
  }

  static async deleteMonument(id: string) {
    console.log('🗑️ Suppression du monument:', id);
    
    try {
      const deletedMonument = await prisma.monument.delete({
        where: { id },
        select: {
          id: true,
          name: true
        }
      });

      console.log('✅ Monument supprimé avec succès:', deletedMonument.name);
      
      return deletedMonument;
    } catch (error) {
      console.error('❌ Erreur lors de la suppression du monument:', error);
      throw error;
    }
  }

  static async addReview(monumentId: string, userId: string, rating: number, comment?: string) {
    try {
      // Créer l'avis
      const review = await prisma.monumentReview.upsert({
        where: {
          userId_monumentId: {
            userId,
            monumentId
          }
        },
        update: {
          rating,
          comment,
          updatedAt: new Date()
        },
        create: {
          userId,
          monumentId,
          rating,
          comment
        }
      });

      // Le rating sera calculé dynamiquement lors de la récupération du monument
      return review;
    } catch (error) {
      console.error('❌ Erreur lors de l\'ajout de l\'avis:', error);
      throw error;
    }
  }

  static async getReviews(monumentId: string) {
    try {
      const reviews = await prisma.monumentReview.findMany({
        where: { monumentId },
        orderBy: { createdAt: 'desc' }
      });

      return reviews;
    } catch (error) {
      console.error('❌ Erreur lors de la récupération des avis:', error);
      throw error;
    }
  }

  static async planVisit(monumentId: string, userId: string, visitDate: string, timeSlot: string) {
    try {
      const monument = await prisma.monument.findUnique({
        where: { id: monumentId }
      });

      if (!monument) {
        throw new Error('Monument non trouvé');
      }

      const plannedVisit = await prisma.plannedVisit.create({
        data: {
          userId,
          monumentId,
          visitDate: new Date(visitDate),
          timeSlot,
          status: 'PLANNED'
        },
        include: {
          monument: true
        }
      });

      // Créer les notifications
      const visitDateTime = new Date(visitDate);
      
      // Notification immédiate de confirmation
      const notification = await prisma.notifications.create({
        data: {
          id: `notif-${Date.now()}-confirm`,
          userId,
          type: 'VISIT_PLANNED',
          title: 'Visite planifiée',
          message: `Votre visite de ${monument.name} a été planifiée pour le ${visitDateTime.toLocaleDateString('fr-FR')} à ${timeSlot}`,
          data: JSON.stringify({ monumentId, visitId: plannedVisit.id }),
          isRead: false,
          createdAt: new Date(),
          updatedAt: new Date()
        }
      });

      // Émettre l'événement socket pour la notification temps réel
      try {
        const io = getIO();
        io.to(`user-${userId}`).emit('new-notification', notification);
      } catch (socketError) {
        console.error('Erreur lors de l\'émission du socket notification:', socketError);
      }

      return plannedVisit;
    } catch (error) {
      console.error('❌ Erreur lors de la planification de la visite:', error);
      throw error;
    }
  }

  static async getPlannedVisits(userId: string) {
    try {
      const plannedVisits = await prisma.plannedVisit.findMany({
        where: { 
          userId,
          status: 'PLANNED',
          visitDate: {
            gte: new Date() // Seulement les visites futures
          }
        },
        include: {
          monument: true
        },
        orderBy: { visitDate: 'asc' }
      });

      return plannedVisits.map(visit => ({
        ...visit,
        monument: {
          ...visit.monument,
          images: visit.monument.image ? [visit.monument.image] : []
        }
      }));
    } catch (error) {
      console.error('❌ Erreur lors de la récupération des visites planifiées:', error);
      throw error;
    }
  }

  static async cancelPlannedVisit(visitId: string, userId: string) {
    try {
      // Vérifier que la visite appartient à l'utilisateur
      const visit = await prisma.plannedVisit.findFirst({
        where: { id: visitId, userId }
      });

      if (!visit) {
        throw new Error('Visite non trouvée');
      }

      const updatedVisit = await prisma.plannedVisit.update({
        where: { id: visitId },
        data: { status: 'CANCELLED' }
      });

      return updatedVisit;
    } catch (error) {
      console.error('❌ Erreur lors de l\'annulation de la visite:', error);
      throw error;
    }
  }

  static async getUserNotifications(userId: string) {
    try {
      const notifications = await prisma.notifications.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        take: 50 // Limiter à 50 notifications
      });

      return notifications;
    } catch (error) {
      console.error('❌ Erreur lors de la récupération des notifications:', error);
      throw error;
    }
  }

  static async markNotificationAsRead(notificationId: string, userId: string) {
    try {
      const notification = await prisma.notifications.updateMany({
        where: { 
          id: notificationId,
          userId 
        },
        data: { 
          isRead: true,
          updatedAt: new Date()
        }
      });

      return notification;
    } catch (error) {
      console.error('❌ Erreur lors du marquage de la notification:', error);
      throw error;
    }
  }
}

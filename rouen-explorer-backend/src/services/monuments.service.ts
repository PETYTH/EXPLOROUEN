import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export class MonumentsService {
  static async getAllMonuments() {
    const monuments = await prisma.monument.findMany({
      orderBy: { rating: 'desc' },
      select: {
        id: true,
        name: true,
        description: true,
        image: true,
        rating: true,
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
    
    // Convertir le champ image en array images pour compatibilité frontend
    return monuments.map((monument: any) => ({
      ...monument,
      images: monument.image ? [monument.image] : []
    }));
  }

  static async getMonumentById(id: string) {
    const monument = await prisma.monument.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        description: true,
        image: true,
        rating: true,
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
    
    if (!monument) return null;
    
    // Convertir le champ image en array images pour compatibilité frontend
    return {
      ...monument,
      images: monument.image ? [monument.image] : []
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
          rating: 0,
          openingHours: '9h-18h',
          easterEggHints: '',
        },
        select: {
          id: true,
          name: true,
          description: true,
          image: true,
          rating: true,
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
          rating: true,
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
      
      return {
        ...updatedMonument,
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
}

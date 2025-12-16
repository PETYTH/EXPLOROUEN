import { Request, Response } from 'express';
import { MonumentsService } from '../services/monuments.service';

export class MonumentsController {
  static async getAllMonuments(_req: Request, res: Response) { // Changé req en _req
    try {
      console.log('🏛️ Récupération de tous les monuments...');
      const monuments = await MonumentsService.getAllMonuments();
      console.log(`✅ ${monuments.length} monuments récupérés`);
      return res.status(200).json({
        success: true,
        data: monuments
      });
    } catch (error: any) {
      console.error('❌ Erreur dans getAllMonuments:', error);
      return res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  static async getMonumentById(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const monument = await MonumentsService.getMonumentById(id);
      
      if (!monument) {
        return res.status(404).json({
          success: false,
          message: 'Monument non trouvé'
        });
      }

      return res.status(200).json({
        success: true,
        data: monument
      });
    } catch (error: any) {
      return res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  static async createMonument(req: Request, res: Response) {
    try {
      const data = req.body;
      
      console.log('🆕 Tentative de création du monument avec données:', data);
      
      const newMonument = await MonumentsService.createMonument(data);
      
      console.log('✅ Monument créé avec succès dans le contrôleur');
      
      return res.status(201).json({
        success: true,
        data: newMonument,
        message: 'Monument créé avec succès'
      });
    } catch (error: any) {
      console.error('❌ Erreur dans createMonument:', error);
      return res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  static async updateMonument(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const data = req.body;
      
      console.log('🔄 Tentative de mise à jour du monument:', id, 'avec données:', data);
      
      const updatedMonument = await MonumentsService.updateMonument(id, data);
      
      if (!updatedMonument) {
        return res.status(404).json({
          success: false,
          message: 'Monument non trouvé'
        });
      }

      console.log('✅ Monument mis à jour avec succès dans le contrôleur');
      
      return res.status(200).json({
        success: true,
        data: updatedMonument,
        message: 'Monument mis à jour avec succès'
      });
    } catch (error: any) {
      console.error('❌ Erreur dans updateMonument:', error);
      return res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  static async deleteMonument(req: Request, res: Response) {
    try {
      const { id } = req.params;
      
      console.log('🗑️ Tentative de suppression du monument:', id);
      
      const deletedMonument = await MonumentsService.deleteMonument(id);
      
      if (!deletedMonument) {
        return res.status(404).json({
          success: false,
          message: 'Monument non trouvé'
        });
      }

      console.log('✅ Monument supprimé avec succès dans le contrôleur');
      
      return res.status(200).json({
        success: true,
        data: deletedMonument,
        message: 'Monument supprimé avec succès'
      });
    } catch (error: any) {
      console.error('❌ Erreur dans deleteMonument:', error);
      return res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  static async addReview(req: Request, res: Response) {
    try {
      const { id: monumentId } = req.params;
      const { rating, comment } = req.body;
      const userId = (req as any).auth?.userId;

      if (!userId) {
        return res.status(401).json({
          success: false,
          message: 'Authentification requise'
        });
      }

      if (!rating || rating < 1 || rating > 5) {
        return res.status(400).json({
          success: false,
          message: 'La note doit être entre 1 et 5'
        });
      }

      const review = await MonumentsService.addReview(monumentId, userId, rating, comment);

      return res.status(201).json({
        success: true,
        data: review,
        message: 'Avis ajouté avec succès'
      });
    } catch (error: any) {
      console.error('❌ Erreur dans addReview:', error);
      return res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  static async getReviews(req: Request, res: Response) {
    try {
      const { id: monumentId } = req.params;
      const reviews = await MonumentsService.getReviews(monumentId);

      return res.status(200).json({
        success: true,
        data: reviews
      });
    } catch (error: any) {
      console.error('❌ Erreur dans getReviews:', error);
      return res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  static async planVisit(req: Request, res: Response) {
    try {
      const { id: monumentId } = req.params;
      const { visitDate, timeSlot } = req.body;
      const userId = (req as any).auth?.userId;

      if (!userId) {
        return res.status(401).json({
          success: false,
          message: 'Authentification requise'
        });
      }

      if (!visitDate || !timeSlot) {
        return res.status(400).json({
          success: false,
          message: 'Date et créneau requis'
        });
      }

      const plannedVisit = await MonumentsService.planVisit(monumentId, userId, visitDate, timeSlot);

      return res.status(201).json({
        success: true,
        data: plannedVisit,
        message: 'Visite planifiée avec succès'
      });
    } catch (error: any) {
      console.error('❌ Erreur dans planVisit:', error);
      return res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  static async getPlannedVisits(req: Request, res: Response) {
    try {
      const userId = (req as any).auth?.userId;

      if (!userId) {
        return res.status(401).json({
          success: false,
          message: 'Authentification requise'
        });
      }

      const plannedVisits = await MonumentsService.getPlannedVisits(userId);

      return res.status(200).json({
        success: true,
        data: plannedVisits
      });
    } catch (error: any) {
      console.error('❌ Erreur dans getPlannedVisits:', error);
      return res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  static async cancelPlannedVisit(req: Request, res: Response) {
    try {
      const { visitId } = req.params;
      const userId = (req as any).auth?.userId;

      if (!userId) {
        return res.status(401).json({
          success: false,
          message: 'Authentification requise'
        });
      }

      const cancelledVisit = await MonumentsService.cancelPlannedVisit(visitId, userId);

      return res.status(200).json({
        success: true,
        data: cancelledVisit,
        message: 'Visite annulée avec succès'
      });
    } catch (error: any) {
      console.error('❌ Erreur dans cancelPlannedVisit:', error);
      return res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  static async getUserNotifications(req: Request, res: Response) {
    try {
      const userId = (req as any).auth?.userId;

      if (!userId) {
        return res.status(401).json({
          success: false,
          message: 'Authentification requise'
        });
      }

      const notifications = await MonumentsService.getUserNotifications(userId);

      return res.status(200).json({
        success: true,
        data: notifications
      });
    } catch (error: any) {
      console.error('❌ Erreur dans getUserNotifications:', error);
      return res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  static async markNotificationAsRead(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const userId = (req as any).auth?.userId;

      if (!userId) {
        return res.status(401).json({
          success: false,
          message: 'Authentification requise'
        });
      }

      await MonumentsService.markNotificationAsRead(id, userId);

      return res.status(200).json({
        success: true,
        message: 'Notification marquée comme lue'
      });
    } catch (error: any) {
      console.error('❌ Erreur dans markNotificationAsRead:', error);
      return res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }
}
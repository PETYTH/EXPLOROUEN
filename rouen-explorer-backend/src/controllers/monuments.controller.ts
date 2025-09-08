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
}
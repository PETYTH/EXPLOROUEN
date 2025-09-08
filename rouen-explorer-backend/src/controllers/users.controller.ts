import { Response } from 'express';
import { UsersService } from '../services/users.service';

export class UsersController {
  private usersService: UsersService;

  constructor() {
    this.usersService = new UsersService();
  }

  // Récupérer les statistiques d'un utilisateur
  getUserStats = async (req: any, res: Response): Promise<void> => {
    try {
      const userId = req.auth?.userId;
      
      if (!userId) {
        res.status(401).json({ error: 'Utilisateur non authentifié' });
        return;
      }

      const stats = await this.usersService.getUserStats(userId);
      res.json(stats);
    } catch (error) {
      console.error('Erreur lors de la récupération des statistiques:', error);
      res.status(500).json({ error: 'Erreur serveur' });
    }
  };
}
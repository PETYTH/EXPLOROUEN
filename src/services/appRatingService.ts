import { AppRating, IAppRating } from '../models/mongo';

export class AppRatingService {
  // Créer ou mettre à jour une notation
  async upsertRating(ratingData: Partial<IAppRating>): Promise<IAppRating> {
    const { userId, ...updateData } = ratingData;
    
    if (!userId) {
      throw new Error('userId est requis');
    }
    
    const rating = await AppRating.findOneAndUpdate(
      { userId },
      { 
        $set: { 
          ...updateData,
          updatedAt: new Date()
        }
      },
      { 
        new: true, 
        upsert: true,
        setDefaultsOnInsert: true
      }
    );
    
    return rating;
  }

  // Récupérer la notation d'un utilisateur
  async getUserRating(userId: string): Promise<IAppRating | null> {
    return await AppRating.findOne({ userId, status: 'active' });
  }

  // Récupérer toutes les notations actives
  async getAllRatings(
    filters?: {
      platform?: string;
      minRating?: number;
      maxRating?: number;
    },
    limit: number = 100
  ): Promise<IAppRating[]> {
    const query: any = { status: 'active' };
    
    if (filters?.platform) query.platform = filters.platform;
    if (filters?.minRating) query.rating = { ...query.rating, $gte: filters.minRating };
    if (filters?.maxRating) query.rating = { ...query.rating, $lte: filters.maxRating };
    
    return await AppRating.find(query)
      .sort({ createdAt: -1 })
      .limit(limit);
  }

  // Calculer la note moyenne globale
  async getAverageRating(platform?: string): Promise<{
    average: number;
    count: number;
    distribution: { [key: number]: number };
  }> {
    const query: any = { status: 'active' };
    if (platform) query.platform = platform;
    
    const ratings = await AppRating.find(query);
    
    if (ratings.length === 0) {
      return { average: 0, count: 0, distribution: {} };
    }
    
    const sum = ratings.reduce((acc, rating) => acc + rating.rating, 0);
    const average = sum / ratings.length;
    
    const distribution: { [key: number]: number } = {
      1: 0, 2: 0, 3: 0, 4: 0, 5: 0
    };
    
    ratings.forEach(rating => {
      distribution[rating.rating] = (distribution[rating.rating] || 0) + 1;
    });
    
    return {
      average: Math.round(average * 10) / 10,
      count: ratings.length,
      distribution
    };
  }

  // Marquer comme utile
  async markHelpful(ratingId: string): Promise<IAppRating | null> {
    return await AppRating.findByIdAndUpdate(
      ratingId,
      { $inc: { helpful: 1 } },
      { new: true }
    );
  }

  // Signaler une notation
  async flagRating(ratingId: string): Promise<IAppRating | null> {
    return await AppRating.findByIdAndUpdate(
      ratingId,
      { $set: { flagged: true } },
      { new: true }
    );
  }

  // Changer le statut d'une notation
  async updateStatus(
    ratingId: string,
    status: 'active' | 'archived' | 'hidden'
  ): Promise<IAppRating | null> {
    return await AppRating.findByIdAndUpdate(
      ratingId,
      { $set: { status } },
      { new: true }
    );
  }

  // Supprimer une notation
  async deleteRating(userId: string): Promise<boolean> {
    const result = await AppRating.deleteOne({ userId });
    return result.deletedCount > 0;
  }

  // Statistiques détaillées
  async getDetailedStats(): Promise<{
    total: number;
    byPlatform: { [key: string]: number };
    byRating: { [key: number]: number };
    averageByPlatform: { [key: string]: number };
    recentRatings: IAppRating[];
  }> {
    const ratings = await AppRating.find({ status: 'active' });
    
    const byPlatform: { [key: string]: number } = {};
    const byRating: { [key: number]: number } = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    const platformRatings: { [key: string]: number[] } = {};
    
    ratings.forEach(rating => {
      byPlatform[rating.platform] = (byPlatform[rating.platform] || 0) + 1;
      byRating[rating.rating] = (byRating[rating.rating] || 0) + 1;
      
      if (!platformRatings[rating.platform]) {
        platformRatings[rating.platform] = [];
      }
      platformRatings[rating.platform].push(rating.rating);
    });
    
    const averageByPlatform: { [key: string]: number } = {};
    Object.keys(platformRatings).forEach(platform => {
      const sum = platformRatings[platform].reduce((a, b) => a + b, 0);
      averageByPlatform[platform] = Math.round((sum / platformRatings[platform].length) * 10) / 10;
    });
    
    const recentRatings = await AppRating.find({ status: 'active' })
      .sort({ createdAt: -1 })
      .limit(10);
    
    return {
      total: ratings.length,
      byPlatform,
      byRating,
      averageByPlatform,
      recentRatings
    };
  }

  // Récupérer les notations signalées
  async getFlaggedRatings(): Promise<IAppRating[]> {
    return await AppRating.find({ flagged: true, status: 'active' })
      .sort({ createdAt: -1 });
  }
}

export default new AppRatingService();

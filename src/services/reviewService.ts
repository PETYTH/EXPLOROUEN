import { Review, IReview } from '../models/mongo';

export class ReviewService {
  // Créer un nouvel avis
  async createReview(reviewData: Partial<IReview>): Promise<IReview> {
    const review = await Review.create(reviewData);
    return review;
  }

  // Récupérer tous les avis d'un lieu
  async getPlaceReviews(
    placeId: string,
    status: 'pending' | 'approved' | 'rejected' = 'approved'
  ): Promise<IReview[]> {
    return await Review.find({ placeId, status })
      .sort({ createdAt: -1 })
      .limit(100);
  }

  // Récupérer les avis d'un utilisateur
  async getUserReviews(userId: string): Promise<IReview[]> {
    return await Review.find({ userId })
      .sort({ createdAt: -1 });
  }

  // Récupérer un avis par ID
  async getReviewById(reviewId: string): Promise<IReview | null> {
    return await Review.findById(reviewId);
  }

  // Mettre à jour un avis
  async updateReview(
    reviewId: string,
    updateData: Partial<IReview>
  ): Promise<IReview | null> {
    return await Review.findByIdAndUpdate(
      reviewId,
      { $set: updateData },
      { new: true }
    );
  }

  // Supprimer un avis
  async deleteReview(reviewId: string): Promise<boolean> {
    const result = await Review.deleteOne({ _id: reviewId });
    return result.deletedCount > 0;
  }

  // Calculer la note moyenne d'un lieu
  async getAverageRating(placeId: string): Promise<{
    average: number;
    count: number;
    distribution: { [key: number]: number };
  }> {
    const reviews = await Review.find({ placeId, status: 'approved' });
    
    if (reviews.length === 0) {
      return { average: 0, count: 0, distribution: {} };
    }
    
    const sum = reviews.reduce((acc, review) => acc + review.rating, 0);
    const average = sum / reviews.length;
    
    const distribution: { [key: number]: number } = {
      1: 0, 2: 0, 3: 0, 4: 0, 5: 0
    };
    
    reviews.forEach(review => {
      distribution[review.rating] = (distribution[review.rating] || 0) + 1;
    });
    
    return {
      average: Math.round(average * 10) / 10,
      count: reviews.length,
      distribution
    };
  }

  // Marquer un avis comme utile
  async markHelpful(reviewId: string): Promise<IReview | null> {
    return await Review.findByIdAndUpdate(
      reviewId,
      { $inc: { helpful: 1 } },
      { new: true }
    );
  }

  // Modération: changer le statut d'un avis
  async moderateReview(
    reviewId: string,
    status: 'approved' | 'rejected',
    moderationNote?: string
  ): Promise<IReview | null> {
    return await Review.findByIdAndUpdate(
      reviewId,
      { 
        $set: { 
          status, 
          moderationNote: moderationNote || '' 
        } 
      },
      { new: true }
    );
  }

  // Récupérer les avis en attente de modération
  async getPendingReviews(): Promise<IReview[]> {
    return await Review.find({ status: 'pending' })
      .sort({ createdAt: -1 });
  }

  // Statistiques des avis
  async getReviewStats(): Promise<{
    total: number;
    pending: number;
    approved: number;
    rejected: number;
    averageRating: number;
  }> {
    const [total, pending, approved, rejected] = await Promise.all([
      Review.countDocuments(),
      Review.countDocuments({ status: 'pending' }),
      Review.countDocuments({ status: 'approved' }),
      Review.countDocuments({ status: 'rejected' })
    ]);
    
    const approvedReviews = await Review.find({ status: 'approved' });
    const averageRating = approvedReviews.length > 0
      ? approvedReviews.reduce((sum, r) => sum + r.rating, 0) / approvedReviews.length
      : 0;
    
    return {
      total,
      pending,
      approved,
      rejected,
      averageRating: Math.round(averageRating * 10) / 10
    };
  }
}

export default new ReviewService();

import ApiService from './api';

export interface RegistrationStatus {
  isRegistered: boolean;
  registrationId?: string;
  registrationDate?: string;
}

class RegistrationService {
  // Vérifier si l'utilisateur est inscrit à une activité
  async checkRegistrationStatus(activityId: string, token: string): Promise<RegistrationStatus> {
    try {
      const response = await fetch(`${process.env.EXPO_PUBLIC_URL_BACKEND}/activities/${activityId}/registration/status`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        if (response.status === 404) {
          return { isRegistered: false };
        }
        throw new Error('Erreur lors de la vérification du statut d\'inscription');
      }

      return await response.json();
    } catch (error) {
      console.error('❌ Erreur vérification inscription:', error);
      return { isRegistered: false };
    }
  }

  // S'inscrire à une activité
  async registerToActivity(activityId: string, token: string): Promise<RegistrationStatus> {
    try {
      const response = await fetch(`${process.env.EXPO_PUBLIC_URL_BACKEND}/activities/${activityId}/register`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Erreur lors de l\'inscription');
      }

      const data = await response.json();
      return {
        isRegistered: true,
        registrationId: data.data.id,
        registrationDate: data.data.createdAt
      };
    } catch (error) {
      console.error('❌ Erreur inscription:', error);
      throw error;
    }
  }

  // Se désinscrire d'une activité
  async unregisterFromActivity(activityId: string, token: string): Promise<void> {
    try {
      const response = await fetch(`${process.env.EXPO_PUBLIC_URL_BACKEND}/activities/${activityId}/register`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Erreur lors de la désinscription');
      }
    } catch (error) {
      console.error('❌ Erreur désinscription:', error);
      throw error;
    }
  }
}

// Instance singleton
const registrationService = new RegistrationService();
export default registrationService;

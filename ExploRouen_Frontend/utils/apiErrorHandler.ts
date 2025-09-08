import { router } from 'expo-router';
import { Alert } from 'react-native';

export interface ApiError {
  status?: number;
  message?: string;
  code?: string;
}

export const handleApiError = (error: any) => {
  // Erreur de réseau (pas de connexion internet)
  if (error.message === 'Network request failed' || !error.status) {
    router.push('/connection-error');
    return;
  }

  // Token expiré ou non valide (401) - Redirection silencieuse
  if (error.status === 401) {
    router.replace('/(auth)/auth');
    return;
  }

  // Page non trouvée (404)
  if (error.status === 404) {
    router.push('/404');
    return;
  }

  // Erreur serveur (500+)
  if (error.status >= 500) {
    Alert.alert(
      'Erreur serveur',
      'Le serveur rencontre des difficultés. Veuillez réessayer plus tard.',
      [{ text: 'OK' }]
    );
    return;
  }

  // Autres erreurs
  Alert.alert(
    'Erreur',
    error.message || 'Une erreur inattendue s\'est produite.',
    [{ text: 'OK' }]
  );
};

export const createApiCall = async (apiFunction: () => Promise<any>) => {
  try {
    return await apiFunction();
  } catch (error) {
    handleApiError(error);
    throw error;
  }
};

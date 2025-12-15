// Utility pour gérer les erreurs d'API de manière cohérente
// Utiliser cette fonction au lieu de console.error dans les catch blocks

let toastHandler: ((message: string, type: 'success' | 'error' | 'warning' | 'info', duration?: number) => void) | null = null;

// Fonction pour enregistrer le handler de toast (appelé depuis le ToastContext)
export const registerToastHandler = (handler: (message: string, type: 'success' | 'error' | 'warning' | 'info', duration?: number) => void) => {
  toastHandler = handler;
};

// Fonction pour gérer les erreurs d'API
export const handleApiError = (error: any, context?: string) => {
  // Erreur de session expirée - notification discrète
  if (error.message === 'SESSION_EXPIRED' || error.status === 401) {
    if (toastHandler) {
      toastHandler('Votre session a expiré', 'warning', 4000);
    }
    return;
  }

  // Erreur de connexion réseau
  if (error.message === 'Network request failed' || error.code === 'NETWORK_ERROR') {
    if (toastHandler) {
      toastHandler('Problème de connexion réseau', 'error', 3000);
    }
    return;
  }

  // Erreur de timeout
  if (error.code === 'TIMEOUT') {
    if (toastHandler) {
      toastHandler('La requête a pris trop de temps', 'warning', 3000);
    }
    return;
  }

  // Autres erreurs - seulement en développement
  if (__DEV__ && context) {
    console.warn(`[${context}]`, error.message || error);
  }
};

// Fonction helper pour vérifier si c'est une erreur silencieuse
export const isSilentError = (error: any): boolean => {
  return error.silent === true || error.status === 401;
};

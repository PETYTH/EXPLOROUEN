import { Alert } from 'react-native';

const API_BASE_URL = process.env.EXPO_PUBLIC_URL_BACKEND || 'http://192.168.1.62:5000/api';

export interface UploadImageResponse {
  success: boolean;
  message: string;
  data?: {
    filename: string;
    originalName: string;
    size: number;
    url: string;
  };
}

/**
 * Upload une image vers le serveur backend
 */
export const uploadImage = async (imageUri: string, token: string): Promise<string | null> => {
  try {
    console.log('📤 Upload image vers serveur:', imageUri);

    // Créer le FormData pour l'upload
    const formData = new FormData();
    
    // Extraire le nom et l'extension du fichier
    const filename = imageUri.split('/').pop() || 'image.jpg';
    const match = /\.(\w+)$/.exec(filename);
    const type = match ? `image/${match[1]}` : 'image/jpeg';

    formData.append('image', {
      uri: imageUri,
      name: filename,
      type: type,
    } as any);

    const response = await fetch(`${API_BASE_URL}/upload/image`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'multipart/form-data',
      },
      body: formData,
    });

    const result: UploadImageResponse = await response.json();

    if (!response.ok || !result.success) {
      throw new Error(result.message || 'Erreur lors de l\'upload');
    }

    console.log('✅ Image uploadée avec succès:', result.data?.url);
    return result.data?.url || null;

  } catch (error: any) {
    console.error('❌ Erreur upload image:', error);
    Alert.alert('Erreur', `Impossible d'uploader l'image: ${error.message}`);
    return null;
  }
};

/**
 * Vérifie si une URL est une URL locale (à uploader) ou une URL serveur (déjà uploadée)
 */
export const isLocalImageUri = (uri: string): boolean => {
  return uri.startsWith('file://') || uri.startsWith('content://') || uri.startsWith('ph://');
};

/**
 * Gère l'upload d'image si nécessaire
 * Retourne l'URL serveur si l'image est locale, sinon retourne l'URL existante
 */
export const handleImageUpload = async (imageUri: string, token: string): Promise<string | null> => {
  if (isLocalImageUri(imageUri)) {
    // Image locale - uploader vers le serveur
    return await uploadImage(imageUri, token);
  } else {
    // Image déjà sur le serveur - retourner l'URL existante
    console.log('🔗 Image déjà sur serveur:', imageUri);
    return imageUri;
  }
};

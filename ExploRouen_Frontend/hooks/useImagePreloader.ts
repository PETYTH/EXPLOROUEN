import { useState, useEffect } from 'react';
import { imagePreloader } from '../utils/imagePreloader';

export interface UseImagePreloaderResult {
  isLoading: boolean;
  progress: number;
  loadingText: string;
  preloadImage: (src: string) => Promise<void>;
  preloadImages: (sources: string[]) => Promise<void>;
}

export const useImagePreloader = (): UseImagePreloaderResult => {
  const [isLoading, setIsLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [loadingText, setLoadingText] = useState('Chargement...');

  const preloadImage = async (src: string): Promise<void> => {
    setIsLoading(true);
    setLoadingText('Chargement de l\'image...');
    
    try {
      await imagePreloader.preloadSingleImage(src);
      setProgress(100);
      setLoadingText('Image prête !');
    } catch (error) {
      console.warn('Erreur lors du préchargement:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const preloadImages = async (sources: string[]): Promise<void> => {
    setIsLoading(true);
    setLoadingText('Préparation des images...');
    setProgress(0);

    try {
      let loadedCount = 0;
      const total = sources.length;

      for (const src of sources) {
        await imagePreloader.preloadSingleImage(src);
        loadedCount++;
        const currentProgress = Math.round((loadedCount / total) * 100);
        setProgress(currentProgress);
        setLoadingText(`${loadedCount}/${total} images chargées`);
      }

      setLoadingText('Toutes les images sont prêtes !');
    } catch (error) {
      console.warn('Erreur lors du préchargement multiple:', error);
      setLoadingText('Erreur de chargement');
    } finally {
      setIsLoading(false);
    }
  };

  return {
    isLoading,
    progress,
    loadingText,
    preloadImage,
    preloadImages,
  };
};

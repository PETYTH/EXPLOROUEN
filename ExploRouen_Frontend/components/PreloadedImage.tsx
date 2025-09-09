import React, { useState, useEffect } from 'react';
import { Image, ImageProps, View, ActivityIndicator } from 'react-native';
import { imagePreloader } from '../utils/imagePreloader';

interface PreloadedImageProps extends Omit<ImageProps, 'source'> {
  source: any;
  showLoader?: boolean;
  loaderColor?: string;
  fallbackSource?: any;
}

export const PreloadedImage: React.FC<PreloadedImageProps> = ({
  source,
  showLoader = true,
  loaderColor = '#8B5CF6',
  fallbackSource,
  style,
  ...props
}) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    const preloadImage = async () => {
      try {
        // Vérifier si l'image est déjà chargée
        if (imagePreloader.isImageLoaded(source)) {
          setIsLoaded(true);
          return;
        }

        // Précharger l'image
        await imagePreloader.preloadSingleImage(source);
        setIsLoaded(true);
      } catch (error) {
        console.warn('Erreur lors du préchargement de l\'image:', error);
        setHasError(true);
        setIsLoaded(true); // Afficher l'image même en cas d'erreur
      }
    };

    preloadImage();
  }, [source]);

  if (!isLoaded && showLoader) {
    return (
      <View style={[style, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="small" color={loaderColor} />
      </View>
    );
  }

  return (
    <Image
      {...props}
      source={hasError && fallbackSource ? fallbackSource : source}
      style={style}
      onError={() => setHasError(true)}
    />
  );
};

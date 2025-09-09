// Préchargeur d'images pour éviter les images qui se forment
export class ImagePreloader {
  private static instance: ImagePreloader;
  private loadedImages: Set<string> = new Set();
  private loadingPromises: Map<string, Promise<void>> = new Map();

  static getInstance(): ImagePreloader {
    if (!ImagePreloader.instance) {
      ImagePreloader.instance = new ImagePreloader();
    }
    return ImagePreloader.instance;
  }

  // Liste de toutes les images critiques à précharger
  private getCriticalImages(): string[] {
    return [
      require('../assets/images/vieux-marche.jpg'),
      require('../assets/images/cathedrale-rouen.jpg'),
      require('../assets/images/colombage.jpg'),
      require('../assets/images/ExploRouen.png'),
      require('../assets/images/icon.png'),
      require('../assets/images/placeholder.png'),
      require('../assets/images/Horloge.png'),
    ];
  }

  // Précharge une image spécifique
  private preloadImage(src: string): Promise<void> {
    if (this.loadedImages.has(src)) {
      return Promise.resolve();
    }

    if (this.loadingPromises.has(src)) {
      return this.loadingPromises.get(src)!;
    }

    const promise = new Promise<void>((resolve, reject) => {
      const img = new Image();
      
      img.onload = () => {
        this.loadedImages.add(src);
        this.loadingPromises.delete(src);
        resolve();
      };
      
      img.onerror = () => {
        this.loadingPromises.delete(src);
        console.warn(`Failed to preload image: ${src}`);
        resolve(); // On continue même si une image échoue
      };
      
      img.src = src;
    });

    this.loadingPromises.set(src, promise);
    return promise;
  }

  // Précharge toutes les images critiques
  async preloadAllCriticalImages(): Promise<void> {
    const images = this.getCriticalImages();
    const promises = images.map(src => this.preloadImage(src));
    
    try {
      await Promise.all(promises);
      console.log('✅ Toutes les images critiques sont préchargées');
    } catch (error) {
      console.warn('⚠️ Certaines images n\'ont pas pu être préchargées:', error);
    }
  }

  // Précharge une image spécifique (pour usage externe)
  async preloadSingleImage(src: string): Promise<void> {
    return this.preloadImage(src);
  }

  // Vérifie si une image est déjà chargée
  isImageLoaded(src: string): boolean {
    return this.loadedImages.has(src);
  }

  // Obtient le pourcentage de chargement
  getLoadingProgress(): number {
    const totalImages = this.getCriticalImages().length;
    const loadedCount = this.loadedImages.size;
    return Math.round((loadedCount / totalImages) * 100);
  }
}

export const imagePreloader = ImagePreloader.getInstance();

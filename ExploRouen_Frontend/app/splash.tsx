import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  Image,
  Dimensions,
  ActivityIndicator,
} from 'react-native';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { 
  useSharedValue, 
  useAnimatedStyle, 
  withTiming, 
  withDelay,
  withSequence,
  Easing
} from 'react-native-reanimated';

import Logo from '../assets/images/ExploRouen.svg'; // <-- import du SVG en composant
import { imagePreloader } from '../utils/imagePreloader';

const { width, height } = Dimensions.get('window');

export default function SplashScreen() {
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [imagesLoaded, setImagesLoaded] = useState(false);
  const [loadingText, setLoadingText] = useState('Chargement...');
  
  const logoScale = useSharedValue(0.5);
  const logoOpacity = useSharedValue(0);
  const titleOpacity = useSharedValue(0);
  const titleTranslateY = useSharedValue(50);
  const backgroundOpacity = useSharedValue(0);
  const pulseScale = useSharedValue(1);

  const navigateToGetStarted = () => {
    router.replace('/get-started' as any);
  };

  useEffect(() => {
    const preloadImages = async () => {
      try {
        setLoadingText('Préparation des images...');
        
        // Simuler le progrès pendant le chargement
        const progressInterval = setInterval(() => {
          const currentProgress = imagePreloader.getLoadingProgress();
          setLoadingProgress(currentProgress);
          
          if (currentProgress >= 100) {
            clearInterval(progressInterval);
          }
        }, 100);

        // Précharger toutes les images critiques
        await imagePreloader.preloadAllCriticalImages();
        
        clearInterval(progressInterval);
        setLoadingProgress(100);
        setLoadingText('Images prêtes !');
        setImagesLoaded(true);
        
        // Attendre un peu avant de démarrer les animations
        setTimeout(() => {
          startAnimations();
        }, 500);
        
      } catch (error) {
        console.error('Erreur lors du préchargement:', error);
        // Continuer même en cas d'erreur
        setImagesLoaded(true);
        startAnimations();
      }
    };

    const startAnimations = () => {
      // Animation du fond
      backgroundOpacity.value = withTiming(1, { duration: 800 });
      
      // Animation du logo avec effet de pulsation
      logoScale.value = withSequence(
        withTiming(1.2, { duration: 600, easing: Easing.out(Easing.cubic) }),
        withTiming(1, { duration: 400, easing: Easing.inOut(Easing.cubic) })
      );
      logoOpacity.value = withTiming(1, { duration: 800 });
      
      // Effet de pulsation continue
      pulseScale.value = withSequence(
        withDelay(800, withTiming(1.05, { duration: 1000 })),
        withTiming(1, { duration: 1000 })
      );
      
      // Animation du titre
      titleOpacity.value = withDelay(600, withTiming(1, { duration: 800 }));
      titleTranslateY.value = withDelay(600, withTiming(0, { duration: 800, easing: Easing.out(Easing.cubic) }));
      
      // Navigation automatique après que les images soient chargées + 2 secondes
      setTimeout(() => {
        navigateToGetStarted();
      }, 2000);
    };

    // Démarrer le préchargement
    preloadImages();
  }, []);

  const backgroundAnimatedStyle = useAnimatedStyle(() => ({
    opacity: backgroundOpacity.value,
  }));

  const logoAnimatedStyle = useAnimatedStyle(() => ({
    transform: [
      { scale: logoScale.value * pulseScale.value }
    ],
    opacity: logoOpacity.value,
  }));

  const titleAnimatedStyle = useAnimatedStyle(() => ({
    opacity: titleOpacity.value,
    transform: [{ translateY: titleTranslateY.value }],
  }));

  return (
    <View style={styles.container}>
      {/* Background Image */}
      <Image 
        source={require('../assets/images/vieux-marche.jpg')}
        style={styles.backgroundImage}
      />
      
      {/* Overlay */}
      <View style={styles.darkOverlay}>
        <View style={styles.content}>
          {/* Logo */}
          <Animated.View style={[styles.logoContainer, logoAnimatedStyle]}>
            {/* <Image 
              source={require('../assets/images/ExploRouen.svg')}
              style={styles.logoImage}
              resizeMode="contain"
            /> */}
            <Logo width={280} height={280} />
          </Animated.View>

          {/* Loading indicator */}
          <View style={styles.loadingContainer}>
            <Animated.View style={logoAnimatedStyle}>
              <ActivityIndicator size="large" color="#8B5CF6" />
            </Animated.View>
            <Text style={styles.loadingText}>{loadingText}</Text>
            <View style={styles.progressContainer}>
              <View style={styles.progressBar}>
                <View 
                  style={[
                    styles.progressFill, 
                    { width: `${loadingProgress}%` }
                  ]} 
                />
              </View>
              <Text style={styles.progressText}>{loadingProgress}%</Text>
            </View>
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  backgroundImage: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  darkOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    flex: 1,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  logoContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoImage: {
    width: 200,
    height: 200,
  },
  loadingContainer: {
    position: 'absolute',
    bottom: 80,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  loadingText: {
    color: '#8B5CF6',
    fontSize: 16,
    fontWeight: '600',
    marginTop: 10,
  },
  loadingBar: {
    height: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 2,
    overflow: 'hidden',
  },
  loadingProgress: {
    height: '100%',
    backgroundColor: '#8B5CF6',
    borderRadius: 2,
    width: '100%',
  },
  progressContainer: {
    marginTop: 20,
    alignItems: 'center',
    width: '80%',
  },
  progressBar: {
    width: '100%',
    height: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 3,
    overflow: 'hidden',
    marginBottom: 8,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#8B5CF6',
    borderRadius: 3,
  },
  progressText: {
    color: '#8B5CF6',
    fontSize: 14,
    fontWeight: '600',
  },
});
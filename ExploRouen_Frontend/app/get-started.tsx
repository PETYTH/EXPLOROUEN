import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  Image,
  Dimensions,
} from 'react-native';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import * as SecureStore from 'expo-secure-store';

const { width, height } = Dimensions.get('window');

export default function GetStartedScreen() {
  const [currentTextIndex, setCurrentTextIndex] = useState(0);
  
  const texts = [
    {
      title: "Découvrez tout ce dont vous avez besoin",
      subtitle: "Soyez le premier à découvrir les nouveautés du marché"
    },
    {
      title: "Explorez le patrimoine de Rouen",
      subtitle: "Monuments historiques et trésors cachés vous attendent"
    },
    {
      title: "Vivez des aventures uniques",
      subtitle: "Chasses aux trésors et activités interactives"
    },
    {
      title: "Rejoignez la communauté",
      subtitle: "Partagez vos découvertes avec d'autres explorateurs"
    }
  ];

  useEffect(() => {
    // Carrousel de textes simple sans animation fade
    const textInterval = setInterval(() => {
      setCurrentTextIndex((prev) => (prev + 1) % texts.length);
    }, 4000); // 4 secondes entre chaque changement
    
    return () => clearInterval(textInterval);
  }, []);

  // Styles statiques pour éviter les problèmes d'animations
  const overlayStyle = { opacity: 1 };
  const contentStyle = { opacity: 1 };
  const buttonsStyle = { opacity: 1 };

  return (
    <View style={styles.container}>
      {/* Image de fond plein écran */}
      <Image 
        source={require('../assets/images/Horloge.png')}
        style={styles.backgroundImage}
      />
      
      {/* Dark Overlay like reference photo */}
      <View style={styles.darkOverlay} />

      <SafeAreaView style={styles.safeArea}>
        {/* Contenu */}
        <View style={styles.contentContainer}>
          <View style={[styles.textContent, contentStyle]}>
            <View>
              <Text style={styles.title}>
                {texts[currentTextIndex].title}
              </Text>
              <Text style={styles.subtitle}>
                {texts[currentTextIndex].subtitle}
              </Text>
            </View>
          </View>

          {/* Indicateur de pagination */}
          <View style={styles.pagination}>
            {texts.map((_, index) => (
              <View 
                key={index}
                style={[
                  styles.dot, 
                  index === currentTextIndex && styles.activeDot
                ]} 
              />
            ))}
          </View>
        </View>

        {/* Bouton */}
        <View style={[styles.buttonsContainer, buttonsStyle]}>
          <TouchableOpacity 
            style={styles.primaryButton}
            onPress={async () => {
              // Marquer l'onboarding comme vu
              try {
                await SecureStore.setItemAsync('hasSeenOnboarding', 'true');
              } catch (error) {
                console.error('Error saving onboarding status:', error);
              }
              router.push('/(auth)/auth');
            }}
          >
            <LinearGradient
              colors={['#8B5CF6', '#8B5CF6']}
              style={styles.primaryButtonGradient}
            >
              <Text style={styles.primaryButtonText}>Commencer</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
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
    width: width,
    height: height,
    resizeMode: 'cover',
  },
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  gradient: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
    justifyContent: 'space-between',
  },
  contentContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  textContent: {
    alignItems: 'center',
    marginBottom: 60,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 16,
    lineHeight: 34,
    paddingHorizontal: 20,
    textShadowColor: 'rgba(0, 0, 0, 0.8)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  subtitle: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.95)',
    textAlign: 'center',
    lineHeight: 24,
    paddingHorizontal: 20,
    textShadowColor: 'rgba(0, 0, 0, 0.6)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  pagination: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
  },
  activeDot: {
    backgroundColor: '#FFFFFF',
    width: 24,
  },
  buttonsContainer: {
    paddingHorizontal: 32,
    paddingBottom: 40,
    gap: 16,
  },
  primaryButton: {
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#8B5CF6',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  primaryButtonGradient: {
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
  },
  primaryButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  secondaryButton: {
    paddingVertical: 18,
    alignItems: 'center',
  },
  secondaryButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: 'rgba(255, 255, 255, 0.9)',
  },
  bottomShadow: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: '60%',
  },
  darkOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
});

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  ImageBackground,
} from 'react-native';
import { router } from 'expo-router';
import { Home, ArrowLeft } from 'lucide-react-native';
import { useTheme } from '../contexts/ThemeContext';

export default function NotFoundScreen() {
  const { colors } = useTheme();

  const handleGoHome = () => {
    router.replace('/(tabs)/activities');
  };

  const handleGoBack = () => {
    router.back();
  };

  return (
    <ImageBackground 
      source={require('@/assets/images/colombage.jpg')} 
      style={styles.container}
      resizeMode="cover"
    >
      <View style={styles.overlay}>
        <SafeAreaView style={styles.safeArea}>
          <View style={styles.content}>
            <Text style={styles.errorCode}>404</Text>
            
            <Text style={styles.title}>
              Page introuvable
            </Text>
            
            <Text style={styles.description}>
              Désolé, la page que vous recherchez n'existe pas ou a été déplacée.
            </Text>
            
            <View style={styles.buttonsContainer}>
              <TouchableOpacity 
                style={[styles.button, styles.homeButton]} 
                onPress={handleGoHome}
              >
                <Home size={20} color="#FFFFFF" strokeWidth={2} />
                <Text style={styles.buttonText}>Retour à l'accueil</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[styles.button, styles.backButton]} 
                onPress={handleGoBack}
              >
                <ArrowLeft size={20} color="#8B5CF6" strokeWidth={2} />
                <Text style={[styles.backButtonText]}>Retour</Text>
              </TouchableOpacity>
            </View>
          </View>
        </SafeAreaView>
      </View>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
  },
  safeArea: {
    flex: 1,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  errorCode: {
    fontSize: 72,
    fontWeight: 'bold',
    color: '#8B5CF6',
    marginBottom: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 16,
  },
  description: {
    fontSize: 16,
    color: '#E5E7EB',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 48,
  },
  buttonsContainer: {
    width: '100%',
    gap: 16,
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    gap: 8,
  },
  homeButton: {
    backgroundColor: '#8B5CF6',
  },
  backButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  backButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});

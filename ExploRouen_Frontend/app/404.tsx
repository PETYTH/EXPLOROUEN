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
import { Home } from 'lucide-react-native';
import { useTheme } from '@/contexts/ThemeContext';

export default function NotFoundScreen() {
  const { colors } = useTheme();

  const handleGoHome = () => {
    router.push('/(tabs)/activities');
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
    color: '#1E40AF',
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
    backgroundColor: '#1E40AF',
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});

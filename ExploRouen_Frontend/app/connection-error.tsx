import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  Image,
} from 'react-native';
import { router } from 'expo-router';
import { WifiOff, RefreshCw, Home } from 'lucide-react-native';
import { useTheme } from '@/contexts/ThemeContext';

export default function ConnectionErrorScreen() {
  const { colors } = useTheme();

  const handleRetry = () => {
    router.back();
  };

  const handleGoHome = () => {
    router.replace('/(tabs)/activities');
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.content}>
        <View style={styles.iconContainer}>
          <WifiOff size={80} color="#EF4444" strokeWidth={1.5} />
        </View>
        
        <Text style={[styles.title, { color: colors.text }]}>
          Problème de connexion
        </Text>
        
        <Text style={[styles.description, { color: colors.textSecondary }]}>
          Impossible de se connecter au serveur. Vérifiez votre connexion internet et réessayez.
        </Text>
        
        <View style={styles.buttonsContainer}>
          <TouchableOpacity 
            style={[styles.button, styles.retryButton]} 
            onPress={handleRetry}
          >
            <RefreshCw size={20} color="#FFFFFF" strokeWidth={2} />
            <Text style={styles.buttonText}>Réessayer</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.button, styles.homeButton, { borderColor: colors.border }]} 
            onPress={handleGoHome}
          >
            <Home size={20} color="#8B5CF6" strokeWidth={2} />
            <Text style={[styles.homeButtonText, { color: colors.text }]}>Accueil</Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  iconContainer: {
    marginBottom: 32,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 16,
  },
  description: {
    fontSize: 16,
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
  retryButton: {
    backgroundColor: '#8B5CF6',
  },
  homeButton: {
    backgroundColor: 'transparent',
    borderWidth: 1,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  homeButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
});

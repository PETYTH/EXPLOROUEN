import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  ScrollView,
  Image,
  ActivityIndicator,
  Alert,
  Linking,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { ArrowLeft, MapPin, Clock, Share, Navigation, Camera, Star, Trash2, Edit } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '@/contexts/ThemeContext';
import { useAuth, useUser } from '@clerk/clerk-expo';
import { useRole } from '../../hooks/useRole';
import ApiService, { BackendMonument } from '@/services/api';
import * as Location from 'expo-location';
import * as ImagePicker from 'expo-image-picker';
// import * as Calendar from 'expo-calendar';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function MonumentDetailScreen() {
  const { id } = useLocalSearchParams();
  const [isPlanned, setIsPlanned] = useState(false);
  const [monument, setMonument] = useState<BackendMonument | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { colors } = useTheme();
  const { getToken } = useAuth();
  const { user } = useUser();
  const { isAdmin } = useRole();

  // Récupérer les détails du monument depuis l'API
  useEffect(() => {
    const fetchMonument = async () => {
      if (!id || typeof id !== 'string') {
        console.log('❌ ID manquant ou invalide:', id);
        return;
      }
      
      console.log('🔍 Chargement du monument avec ID:', id);
      setLoading(true);
      setError(null);
      
      try {
        const monumentData = await ApiService.getMonumentById(id);
        console.log('✅ Monument chargé:', monumentData);
        setMonument(monumentData);
      } catch (error) {
        console.error('❌ Erreur lors du chargement du monument:', error);
        setError(error instanceof Error ? error.message : 'Erreur lors du chargement du monument');
      } finally {
        setLoading(false);
      }
    };

    fetchMonument();
  }, [id]);

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#8B5CF6" />
          <Text style={[styles.loadingText, { color: colors.textSecondary }]}>
            Chargement du monument...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error || !monument) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.errorContainer}>
          <Text style={[styles.errorText, { color: colors.textSecondary }]}>Monument non trouvé</Text>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <Text style={styles.backButtonText}>Retour</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  // Fonctions pour les boutons d'action
  const handleNavigateToMap = () => {
    if (!monument) return;
    
    // Naviguer vers la page map de l'app avec les coordonnées du monument
    router.push({
      pathname: '/(tabs)/map',
      params: {
        monumentId: monument.id,
        monumentName: monument.name,
        latitude: monument.latitude.toString(),
        longitude: monument.longitude.toString()
      }
    });
  };

  const handleEditMonument = () => {
    if (!monument) return;
    
    // Naviguer vers la page de création/modification avec les données du monument
    router.push({
      pathname: '/create-monument',
      params: {
        editMode: 'true',
        monumentId: monument.id,
        monumentData: JSON.stringify(monument)
      }
    });
  };

  const handlePlanVisit = async () => {
    if (!monument) return;
    
    try {
      setIsPlanned(!isPlanned);
      
      if (!isPlanned) {
        // Créer un rappel dans le calendrier du téléphone
        Alert.alert(
          'Planifier une visite',
          `Voulez-vous ajouter un rappel pour visiter ${monument.name} ?`,
          [
            { text: 'Annuler', style: 'cancel' },
            { 
              text: 'Ajouter au calendrier', 
              onPress: () => {
                // Pour l'instant, on simule l'ajout au calendrier
                Alert.alert('Rappel ajouté', `Trouver du temps pour planifier une visite du ${monument.name}`);
              }
            }
          ]
        );
      }
      
      // Sauvegarder l'état dans AsyncStorage
      await AsyncStorage.setItem(`planned_${monument.id}`, (!isPlanned).toString());
    } catch (error) {
      Alert.alert('Erreur', 'Impossible de planifier la visite');
    }
  };

  const handleTakePhoto = async () => {
    if (!monument) return;
    
    try {
      // Demander les permissions
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission refusée', 'L\'accès à la caméra est nécessaire pour prendre des photos.');
        return;
      }

      Alert.alert(
        'Prendre une photo',
        'Comment souhaitez-vous ajouter une photo ?',
        [
          { text: 'Annuler', style: 'cancel' },
          { text: 'Caméra', onPress: () => takePhotoFromCamera() },
          { text: 'Galerie', onPress: () => takePhotoFromGallery() }
        ]
      );
    } catch (error) {
      Alert.alert('Erreur', 'Impossible d\'accéder à la caméra');
    }
  };

  const takePhotoFromCamera = async () => {
    try {
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        await savePhotoToGallery(result.assets[0].uri);
      }
    } catch (error) {
      Alert.alert('Erreur', 'Impossible de prendre la photo');
    }
  };

  const takePhotoFromGallery = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        await savePhotoToGallery(result.assets[0].uri);
      }
    } catch (error) {
      Alert.alert('Erreur', 'Impossible de sélectionner la photo');
    }
  };

  const savePhotoToGallery = async (photoUri: string) => {
    try {
      // Récupérer les photos existantes
      const existingPhotos = await AsyncStorage.getItem('monument_photos');
      const photos = existingPhotos ? JSON.parse(existingPhotos) : [];
      
      // Ajouter la nouvelle photo
      const newPhoto = {
        id: Date.now().toString(),
        monumentId: monument?.id,
        monumentName: monument?.name,
        uri: photoUri,
        timestamp: new Date().toISOString(),
      };
      
      photos.push(newPhoto);
      await AsyncStorage.setItem('monument_photos', JSON.stringify(photos));
      
      Alert.alert('Photo sauvegardée', 'Votre photo a été ajoutée à votre galerie personnelle !');
    } catch (error) {
      Alert.alert('Erreur', 'Impossible de sauvegarder la photo');
    }
  };

  const handleDeleteMonument = async () => {
    if (!user || !id || typeof id !== 'string') return;

    Alert.alert(
      'Supprimer le monument',
      'Êtes-vous sûr de vouloir supprimer définitivement ce monument ? Cette action est irréversible.',
      [
        { text: 'Annuler', style: 'cancel' },
        { 
          text: 'Supprimer', 
          style: 'destructive',
          onPress: async () => {
            try {
              const token = await getToken();
              if (!token) {
                Alert.alert('Erreur', 'Impossible de récupérer le token d\'authentification');
                return;
              }

              // Appel API pour supprimer le monument
              console.log('🗑️ Suppression du monument avec ID:', id);
              const response = await fetch(`http://192.168.1.62:5000/api/monuments/${id}`, {
                method: 'DELETE',
                headers: {
                  'Authorization': `Bearer ${token}`,
                },
              });
              
              console.log('📡 Réponse suppression:', response.status);

              if (!response.ok) {
                throw new Error('Erreur lors de la suppression du monument');
              }
              
              Alert.alert('Suppression réussie', 'Le monument a été supprimé avec succès.', [
                { text: 'OK', onPress: () => router.back() }
              ]);
            } catch (error) {
              console.error('Error deleting monument:', error);
              Alert.alert(
                'Erreur',
                error instanceof Error ? error.message : 'Impossible de supprimer le monument'
              );
            }
          }
        }
      ]
    );
  };

  const handleShare = () => {
    Alert.alert('Partage', 'Fonctionnalité prochainement disponible');
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={styles.imageContainer}>
        <Image source={{ uri: monument.images?.[0] || 'https://via.placeholder.com/400x300' }} style={styles.monumentImage} />
        
        <LinearGradient
          colors={['rgba(0,0,0,0.6)', 'transparent']}
          style={styles.headerOverlay}
        >
          <View style={styles.headerActions}>
            <TouchableOpacity 
              style={[styles.headerButton, styles.backButton]}
              onPress={() => router.back()}
            >
              <ArrowLeft size={24} color="#FFFFFF" strokeWidth={2} />
            </TouchableOpacity>
            
            <View style={styles.rightActions}>
              {isAdmin && (
                <TouchableOpacity 
                  style={[styles.headerButton, styles.editButton]} 
                  onPress={handleEditMonument}
                >
                  <Edit size={20} color="#FFFFFF" strokeWidth={2} />
                </TouchableOpacity>
              )}
              {isAdmin && (
                <TouchableOpacity 
                  style={[styles.headerButton, styles.deleteButton]} 
                  onPress={handleDeleteMonument}
                >
                  <Trash2 size={22} color="#FFFFFF" strokeWidth={3} />
                </TouchableOpacity>
              )}
              <TouchableOpacity 
                style={[styles.headerButton, styles.shareButton]} 
                onPress={handleShare}
              >
                <Share size={20} color="#FFFFFF" strokeWidth={2} />
              </TouchableOpacity>
            </View>
          </View>
        </LinearGradient>

        <LinearGradient
          colors={['transparent', 'rgba(0,0,0,0.8)']}
          style={styles.bottomOverlay}
        >
          <View style={styles.ratingBadge}>
            <Star size={12} color="#FBBF24" fill="#FBBF24" />
            <Text style={styles.ratingText}>4.5</Text>
          </View>
        </LinearGradient>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Title and Description */}
        <View style={styles.titleSection}>
          <Text style={[styles.monumentTitle, { color: colors.text }]}>{monument.name}</Text>
          <Text style={[styles.monumentDescription, { color: colors.textSecondary }]}>{monument.description}</Text>
        </View>

        {/* Quick Info */}
        <View style={[styles.quickInfo, { backgroundColor: colors.surface }]}>
          <View style={styles.infoItem}>
            <Clock size={16} color="#667EEA" strokeWidth={2} />
            <Text style={[styles.infoText, { color: colors.text }]}>{'1h - 2h'}</Text>
          </View>
          <View style={styles.infoItem}>
            <MapPin size={16} color="#667EEA" strokeWidth={2} />
            <Text style={[styles.infoText, { color: colors.text }]}>Rouen, France</Text>
          </View>
        </View>

        {/* History */}
        <View style={[styles.historySection, { backgroundColor: colors.surface }]}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Histoire</Text>
          <Text style={[styles.historyText, { color: colors.text }]}>{monument.description}</Text>
        </View>

        {/* Highlights */}
        <View style={[styles.highlightsSection, { backgroundColor: colors.surface }]}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Points d'intérêt</Text>
          {monument.category && (
            <View style={styles.highlightItem}>
              <View style={styles.highlightDot} />
              <Text style={[styles.highlightText, { color: colors.text }]}>Catégorie: {monument.category}</Text>
            </View>
          )}
          <View style={styles.highlightItem}>
            <View style={styles.highlightDot} />
            <Text style={[styles.highlightText, { color: colors.text }]}>Monument ouvert au public</Text>
          </View>
        </View>

        {/* Practical Info */}
        <View style={[styles.practicalSection, { backgroundColor: colors.surface }]}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Informations pratiques</Text>
          
          <View style={styles.practicalItem}>
            <Text style={[styles.practicalLabel, { color: colors.textSecondary }]}>Horaires</Text>
            <Text style={[styles.practicalValue, { color: colors.text }]}>9h00 - 18h00</Text>
          </View>
          
          <View style={styles.practicalItem}>
            <Text style={[styles.practicalLabel, { color: colors.textSecondary }]}>Tarif</Text>
            <Text style={[styles.practicalValue, { color: colors.text }]}>{'Gratuit'}</Text>
          </View>
        </View>

        {/* Additional Images */}
        {monument.images && monument.images.length > 1 && (
          <View style={[styles.imagesSection, { backgroundColor: colors.surface }]}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Galerie</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.imagesContainer}>
              {monument.images.slice(1).map((imageUrl: string, index: number) => (
                <Image key={index} source={{ uri: imageUrl }} style={styles.galleryImage} />
              ))}
            </ScrollView>
          </View>
        )}
      </ScrollView>

      {/* Action Buttons */}
      <View style={styles.bottomActions}>
        <View style={styles.actionButtons}>
        <TouchableOpacity 
          style={styles.floatingActionButton}
          onPress={handleNavigateToMap}
        >
          <Navigation size={24} color="#FFFFFF" strokeWidth={2} />
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.floatingActionButton, isPlanned && styles.activeFloatingButton]}
          onPress={handlePlanVisit}
        >
          <Star size={24} color={isPlanned ? "#FBBF24" : "#FFFFFF"} fill={isPlanned ? "#FBBF24" : "transparent"} strokeWidth={2} />
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.floatingActionButton, styles.activeFloatingButton]}
          onPress={handleTakePhoto}
        >
          <Camera size={24} color="#FFFFFF" strokeWidth={2} />
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
  imageContainer: {
    height: 300,
    position: 'relative',
  },
  monumentImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  headerOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 120,
    paddingTop: 50,
    paddingHorizontal: 20,
  },
  headerActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  headerButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.3)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  bottomOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 80,
    justifyContent: 'flex-end',
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  ratingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.6)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    alignSelf: 'flex-start',
    gap: 4,
  },
  ratingText: {
    fontSize: 12,
    color: '#FFFFFF',
    fontWeight: '600',
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 100,
  },
  titleSection: {
    marginBottom: 24,
  },
  monumentTitle: {
    fontSize: 28,
    fontWeight: '800',
    marginBottom: 8,
    lineHeight: 34,
  },
  monumentDescription: {
    fontSize: 16,
    lineHeight: 24,
  },
  quickInfo: {
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
    gap: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  infoText: {
    fontSize: 15,
    fontWeight: '500',
  },
  historySection: {
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 16,
  },
  historyText: {
    fontSize: 15,
    lineHeight: 22,
  },
  highlightsSection: {
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  highlightItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: 8,
    gap: 12,
  },
  highlightDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#667EEA',
    marginTop: 6,
  },
  highlightText: {
    fontSize: 15,
    fontWeight: '500',
    lineHeight: 22,
    flex: 1,
  },
  practicalSection: {
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  practicalItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  practicalLabel: {
    fontSize: 15,
    fontWeight: '500',
  },
  practicalValue: {
    fontSize: 15,
    fontWeight: '600',
  },
  easterSection: {
    backgroundColor: '#FEF3C7',
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
  },
  easterTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#92400E',
    marginBottom: 16,
  },
  hintItem: {
    paddingVertical: 8,
  },
  hintText: {
    fontSize: 15,
    color: '#92400E',
    fontWeight: '500',
    lineHeight: 22,
  },
  floatingMenuContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 30,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  floatingMenuButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 8,
  },
  starIcon: {
    fontSize: 20,
    color: '#FFFFFF',
  },
  visitedIcon: {
    fontSize: 20,
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
  modernActionButton: {
    backgroundColor: 'transparent',
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 8,
  },
  actionGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 8,
  },
  actionButtonText: {
    fontSize: 14,
    color: '#667EEA',
    fontWeight: '600',
  },
  modernActionText: {
    fontSize: 14,
    color: '#FFFFFF',
    fontWeight: '700',
  },
  visitButton: {
    flex: 1,
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 8,
  },
  enhancedVisitButton: {
    shadowColor: '#F59E0B',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 15,
    elevation: 10,
  },
  visitedButton: {
    opacity: 0.8,
  },
  visitGradient: {
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  visitButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  errorText: {
    fontSize: 18,
    marginBottom: 24,
  },
  backButton: {
    backgroundColor: '#667EEA',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 12,
  },
  backButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loadingText: {
    fontSize: 16,
    textAlign: 'center',
    marginTop: 16,
  },
  imagesSection: {
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: 'rgba(102, 126, 234, 0.1)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 4,
  },
  imagesContainer: {
    marginTop: 12,
  },
  galleryImage: {
    width: 120,
    height: 80,
    borderRadius: 8,
    marginRight: 12,
  },
  bottomActions: {
    position: 'absolute',
    bottom: 40,
    alignSelf: 'center',
    left: 0,
    right: 0,
    alignItems: 'center',
    zIndex: 1000,
  },
  actionButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 30,
    backgroundColor: 'rgba(40, 40, 40, 0.95)',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  floatingActionButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 8,
  },
  activeFloatingButton: {
    backgroundColor: '#8B5CF6',
  },
  backButton: {
    backgroundColor: '#8B5CF6',
    shadowColor: '#8B5CF6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  deleteButton: {
    backgroundColor: 'rgba(255,68,68,0.9)',
    borderWidth: 2,
    borderColor: '#FF4444',
    shadowColor: '#FF4444',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.8,
    shadowRadius: 8,
    elevation: 8,
  },
  shareButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  rightActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  editButton: {
    backgroundColor: 'rgba(139, 92, 246, 0.9)',
    borderWidth: 2,
    borderColor: '#8B5CF6',
    shadowColor: '#8B5CF6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.8,
    shadowRadius: 8,
    elevation: 8,
  },
});
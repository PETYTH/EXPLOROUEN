import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Image,
  ActivityIndicator,
  Alert,
  Linking,
  Modal,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams, useFocusEffect } from 'expo-router';
import { ArrowLeft, MapPin, Clock, Share, Navigation, Camera, Star, Trash2, Edit, Calendar, X } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '@/contexts/ThemeContext';
import { useMonuments } from '@/contexts/MonumentsContext';
import { useNotifications } from '@/contexts/NotificationContext';
import { useToast } from '@/contexts/ToastContext';
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
  const [reviews, setReviews] = useState<any[]>([]);
  const [averageRating, setAverageRating] = useState(0);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [userRating, setUserRating] = useState(0);
  const [userComment, setUserComment] = useState('');
  const [showPlanModal, setShowPlanModal] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [selectedTimeSlot, setSelectedTimeSlot] = useState('');
  const { colors } = useTheme();
  const { getToken } = useAuth();
  const { user } = useUser();
  const { isAdmin } = useRole();
  const { refreshSystemNotifications } = useNotifications();
  const { showToast } = useToast();
  const { monuments: contextMonuments } = useMonuments();

  // Fonction pour générer des avis réalistes basés sur la note moyenne
  const generateMockReviews = (avgRating: number, totalReviews: number) => {
    const distribution = {
      5: Math.floor(totalReviews * 0.70),
      4: Math.floor(totalReviews * 0.20),
      3: Math.floor(totalReviews * 0.05),
      2: Math.floor(totalReviews * 0.03),
      1: Math.floor(totalReviews * 0.02)
    };
    return distribution;
  };

  // Fonction pour obtenir le label de la catégorie
  const getCategoryLabel = (category: string) => {
    switch (category) {
      case 'HISTORIC':
        return 'Historique';
      case 'RELIGIOUS':
        return 'Religieux';
      case 'OLD_HOUSE':
        return 'Maison ancienne';
      case 'CIVIL':
        return 'Civil';
      case 'MUSEUM':
        return 'Musée';
      case 'MEMORIAL':
        return 'Commémoratif';
      default:
        return category;
    }
  };

  // Récupérer les détails du monument depuis le contexte ou l'API
  useFocusEffect(
    React.useCallback(() => {
      const fetchMonument = async () => {
        if (!id || typeof id !== 'string') {
          console.log('❌ ID manquant ou invalide:', id);
          return;
        }
        
        setLoading(true);
        setError(null);
        
        try {
          // Toujours charger le monument ET les avis depuis l'API pour avoir les données à jour
          const [monumentData, monumentReviews] = await Promise.all([
            ApiService.getMonumentById(id),
            ApiService.getMonumentReviews(id)
          ]);
          console.log('✅ Monument chargé:', monumentData);
          console.log('✅ Avis chargés:', monumentReviews.length);
          setMonument(monumentData);
          
          // Vérifier si une visite est déjà planifiée pour ce monument
          const planned = await AsyncStorage.getItem(`planned_${id}`);
          setIsPlanned(planned === 'true');
          
          // Définir la note moyenne
          if (monumentData.rating) {
            setAverageRating(monumentData.rating);
          } else {
            setAverageRating(0);
          }
          
          // Afficher les vrais avis ou une liste vide
          if (monumentReviews && monumentReviews.length > 0) {
            setReviews(monumentReviews);
          } else {
            setReviews([]);
          }
        } catch (error) {
          console.error('❌ Erreur lors du chargement du monument:', error);
          setError(error instanceof Error ? error.message : 'Erreur lors du chargement du monument');
        } finally {
          setLoading(false);
        }
      };

      fetchMonument();
    }, [id])
  );

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.buttonPrimary} />
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

  const handlePlanVisit = () => {
    // Vérifier si une visite est déjà planifiée
    if (isPlanned) {
      Alert.alert('Information', 'Vous avez déjà planifié une visite pour ce monument. Veuillez l\'annuler depuis votre profil pour en planifier une nouvelle.');
      return;
    }
    setShowPlanModal(true);
  };

  const handleSubmitPlan = async () => {
    if (!monument) return;

    if (!selectedTimeSlot) {
      Alert.alert('Erreur', 'Veuillez sélectionner un créneau horaire');
      return;
    }

    // Vérifier si une visite est déjà planifiée
    if (isPlanned) {
      Alert.alert('Information', 'Vous avez déjà une visite planifiée pour ce monument. Annulez-la depuis votre profil pour en planifier une nouvelle.');
      return;
    }

    // Vérifier si le monument est fermé ce jour
    const availableSlots = generateTimeSlots(monument.openingHours || '9h00 - 18h00', selectedDate);
    if (availableSlots.length === 0) {
      Alert.alert('Erreur', 'Le monument est fermé ce jour-là. Veuillez choisir une autre date.');
      return;
    }

    try {
      const token = await getToken();
      if (!token) {
        Alert.alert('Erreur', 'Vous devez être connecté pour planifier une visite');
        return;
      }

      const API_URL = process.env.EXPO_PUBLIC_URL_BACKEND || 'http://localhost:5000/api';
      console.log('📡 URL API:', API_URL);
      console.log('📡 Monument ID:', monument.id);
      console.log('📡 Visit Date:', selectedDate.toISOString());
      console.log('📡 Time Slot:', selectedTimeSlot);
      
      const response = await fetch(`${API_URL}/monuments/${monument.id}/plan-visit`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          visitDate: selectedDate.toISOString(),
          timeSlot: selectedTimeSlot,
        }),
      });

      if (!response.ok) {
        throw new Error('Erreur lors de la planification de la visite');
      }

      // Fermer le modal d'abord
      setShowPlanModal(false);
      
      // Afficher un toast de succès au lieu d'une alerte bloquante
      showToast('Votre visite a été planifiée avec succès !', 'success');
      
      setIsPlanned(true);
      setSelectedTimeSlot('');
      
      // Sauvegarder l'état dans AsyncStorage
      await AsyncStorage.setItem(`planned_${monument.id}`, 'true');
      
      // Rafraîchir immédiatement les notifications système
      await refreshSystemNotifications();
    } catch (error) {
      console.error('Error planning visit:', error);
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
        exif: false,
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
        exif: false,
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
              const API_URL = process.env.EXPO_PUBLIC_URL_BACKEND || 'http://localhost:5000/api';
              console.log('🗑️ Suppression du monument avec ID:', id);
              const response = await fetch(`${API_URL}/monuments/${id}`, {
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

  // Fonction pour parser les horaires et générer les créneaux
  const generateTimeSlots = (openingHours: string, selectedDate: Date): string[] => {
    // Vérifier les jours de fermeture
    const dayNames = ['dim', 'lun', 'mar', 'mer', 'jeu', 'ven', 'sam'];
    const selectedDay = dayNames[selectedDate.getDay()];
    
    // Vérifier si le monument est fermé ce jour
    const closedRegex = new RegExp(`${selectedDay}\\s*fermé`, 'i');
    if (closedRegex.test(openingHours.toLowerCase())) {
      return []; // Retourner un tableau vide si fermé
    }

    // Si ouvert 24h/24
    if (openingHours.includes('24h/24') || openingHours.includes('24/24')) {
      return ['9h-11h', '11h-13h', '13h-15h', '15h-17h', '17h-19h', '19h-21h'];
    }

    // Parser les horaires (format: "10h00 - 18h00" ou "10h-18h")
    const timeRegex = /(\d{1,2})h(?:\d{2})?\s*-\s*(\d{1,2})h(?:\d{2})?/;
    const match = openingHours.match(timeRegex);
    
    if (!match) {
      // Si le format n'est pas reconnu, retourner des créneaux par défaut
      return ['9h-11h', '11h-13h', '13h-15h', '15h-17h', '17h-19h'];
    }

    const openHour = parseInt(match[1]);
    const closeHour = parseInt(match[2]);

    // Générer les créneaux de 2 heures
    const slots: string[] = [];
    for (let hour = openHour; hour < closeHour - 1; hour += 2) {
      const endHour = Math.min(hour + 2, closeHour);
      slots.push(`${hour}h-${endHour}h`);
    }

    return slots.length > 0 ? slots : ['9h-11h', '11h-13h', '13h-15h', '15h-17h', '17h-19h'];
  };

  const handleShare = () => {
    Alert.alert('Partage', 'Fonctionnalité prochainement disponible');
  };

  const handleSubmitReview = async () => {
    if (!monument) return;
    
    if (userRating === 0) {
      Alert.alert('Erreur', 'Veuillez sélectionner une note');
      return;
    }

    if (!userComment.trim()) {
      Alert.alert('Erreur', 'Veuillez écrire un commentaire');
      return;
    }

    try {
      const token = await getToken();
      if (!token) {
        Alert.alert('Erreur', 'Vous devez être connecté pour laisser un avis');
        return;
      }

      const API_URL = process.env.EXPO_PUBLIC_URL_BACKEND || 'http://localhost:5000/api';
      console.log('📡 Envoi de l\'avis:', { monumentId: monument.id, rating: userRating, comment: userComment.substring(0, 50) });
      
      const response = await fetch(`${API_URL}/monuments/${monument.id}/reviews`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          rating: userRating,
          comment: userComment,
        }),
      });

      console.log('📡 Réponse avis:', response.status);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('❌ Erreur API:', errorData);
        throw new Error(errorData.message || 'Erreur lors de l\'envoi de l\'avis');
      }

      Alert.alert('Succès', 'Votre avis a été publié avec succès');
      
      // Réinitialiser le formulaire
      setUserRating(0);
      setUserComment('');
      setShowReviewModal(false);
      
      // Recharger le monument et les avis
      const [updatedMonument, monumentReviews] = await Promise.all([
        ApiService.getMonumentById(monument.id),
        ApiService.getMonumentReviews(monument.id)
      ]);
      
      if (updatedMonument) {
        setMonument(updatedMonument);
        // Le backend retourne 'rating' pas 'averageRating'
        if (updatedMonument.rating !== undefined) {
          setAverageRating(updatedMonument.rating);
        }
      }
      
      // Afficher les vrais avis (même si vide)
      setReviews(monumentReviews || []);
    } catch (error) {
      console.error('Error submitting review:', error);
      Alert.alert('Erreur', 'Impossible de publier votre avis');
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar translucent backgroundColor="transparent" barStyle="light-content" />
      {/* Header */}
      <View style={styles.imageContainer}>
        <Image 
          source={{ 
            uri: monument.images?.[0] || 'https://via.placeholder.com/400x300' 
          }} 
          style={styles.monumentImage} 
        />
        
        <LinearGradient
          colors={['rgba(0,0,0,0.6)', 'transparent']}
          style={styles.headerOverlay}
        >
          <View style={styles.headerActions}>
            <TouchableOpacity 
              style={[styles.headerButton, styles.headerBackButton, { backgroundColor: colors.buttonPrimary, shadowColor: colors.buttonPrimary }]}
              onPress={() => router.back()}
            >
              <ArrowLeft size={24} color="#FFFFFF" strokeWidth={2} />
            </TouchableOpacity>
            
            <View style={styles.rightActions}>
              {isAdmin && (
                <TouchableOpacity 
                  style={[styles.headerButton, { backgroundColor: '#1E40AF' }]} 
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
          {averageRating > 0 && (
            <View style={styles.ratingBadge}>
              <Star size={12} color="#FBBF24" fill="#FBBF24" />
              <Text style={styles.ratingText}>{averageRating.toFixed(1)}</Text>
            </View>
          )}
        </LinearGradient>
      </View>

      <ScrollView 
        style={styles.content} 
        contentContainerStyle={{ paddingBottom: 100 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Title and Description */}
        <View style={styles.titleSection}>
          <Text style={[styles.monumentTitle, { color: colors.text }]}>{monument.name}</Text>
          <Text style={[styles.monumentDescription, { color: colors.textSecondary }]}>{monument.description}</Text>
        </View>

        {/* Quick Info */}
        <View style={[styles.quickInfo, { backgroundColor: colors.surface }]}>
          <View style={styles.infoItem}>
            <Clock size={16} color={colors.link} strokeWidth={2} />
            <Text style={[styles.infoText, { color: colors.text }]}>{'1h - 2h'}</Text>
          </View>
          <View style={styles.infoItem}>
            <MapPin size={16} color={colors.link} strokeWidth={2} />
            <Text style={[styles.infoText, { color: colors.text }]}>Rouen, France</Text>
          </View>
        </View>

        {/* History */}
        <View style={[styles.historySection, { backgroundColor: colors.surface }]}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Histoire</Text>
          {monument.history && (
            <View style={styles.highlightItem}>
              <View style={styles.highlightDot} />
              <Text style={[styles.highlightText, { color: colors.text }]}>Période: {monument.history}</Text>
            </View>
          )}
          <Text style={[styles.historyText, { color: colors.text }]}>{monument.description}</Text>
        </View>

        {/* Highlights */}
        <View style={[styles.highlightsSection, { backgroundColor: colors.surface }]}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Points d'intérêt</Text>
          {monument.category && (
            <View style={styles.highlightItem}>
              <View style={styles.highlightDot} />
              <Text style={[styles.highlightText, { color: colors.text }]}>Catégorie: {getCategoryLabel(monument.category)}</Text>
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
            <Text style={[styles.practicalValue, { color: colors.text }]}>
              {monument.openingHours || '9h00 - 18h00'}
            </Text>
          </View>
          
          <View style={styles.practicalItem}>
            <Text style={[styles.practicalLabel, { color: colors.textSecondary }]}>Tarif</Text>
            <Text style={[styles.practicalValue, { color: colors.text }]}>
              {monument.price || 'Gratuit'}
            </Text>
          </View>
        </View>
        {/* Reviews Section */}
        <View style={[styles.reviewsSection, { backgroundColor: colors.surface }]}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Avis et notes</Text>
          
          <View style={styles.ratingOverview}>
            <View style={styles.ratingOverviewLeft}>
              <Text style={[styles.ratingNumber, { color: colors.text }]}>{averageRating.toFixed(1)}</Text>
              <View style={styles.starsRow}>
                {[1, 2, 3, 4, 5].map((star) => (
                  <Star key={star} size={16} color="#FBBF24" fill={star <= Math.round(averageRating) ? "#FBBF24" : "transparent"} strokeWidth={2} />
                ))}
              </View>
              <Text style={[styles.reviewCount, { color: colors.textSecondary }]}>{monument.reviewsCount || reviews.length} avis</Text>
            </View>
            
            <View style={styles.ratingOverviewRight}>
              {[5, 4, 3, 2, 1].map((rating) => {
                // Calculer le nombre d'avis pour chaque note
                const count = Array.isArray(reviews) ? reviews.filter((r: any) => r.rating === rating).length : 0;
                const total = Array.isArray(reviews) ? reviews.length : (monument.reviewsCount || 0);
                const percentage = total > 0 ? (count / total) * 100 : 0;
                
                return (
                  <View key={rating} style={styles.ratingBar}>
                    <Text style={[styles.ratingLabel, { color: colors.textSecondary }]}>{rating}</Text>
                    <Star size={12} color="#FBBF24" fill="#FBBF24" />
                    <View style={[styles.barBackground, { backgroundColor: colors.border }]}>
                      <View 
                        style={[
                          styles.barFill, 
                          { width: `${percentage}%` }
                        ]} 
                      />
                    </View>
                    <Text style={[styles.ratingCount, { color: colors.textSecondary }]}>
                      {count}
                    </Text>
                  </View>
                );
              })}
            </View>
          </View>

          {/* Liste des avis */}
          {Array.isArray(reviews) && reviews.length > 0 ? (
            <View style={styles.reviewsList}>
              {reviews.map((review: any, index: number) => (
                <View key={review.id || index} style={[styles.reviewItem, { borderBottomColor: colors.border }]}>
                  <View style={styles.reviewHeader}>
                    <View style={styles.reviewStars}>
                      {[1, 2, 3, 4, 5].map((star) => (
                        <Star 
                          key={star} 
                          size={14} 
                          color="#FBBF24" 
                          fill={star <= review.rating ? "#FBBF24" : "transparent"} 
                          strokeWidth={2} 
                        />
                      ))}
                    </View>
                    <Text style={[styles.reviewDate, { color: colors.textSecondary }]}>
                      {new Date(review.createdAt).toLocaleDateString('fr-FR')}
                    </Text>
                  </View>
                  {review.comment && (
                    <Text style={[styles.reviewComment, { color: colors.text }]}>
                      {review.comment}
                    </Text>
                  )}
                </View>
              ))}
            </View>
          ) : (
            <Text style={[styles.noReviews, { color: colors.textSecondary }]}>
              Aucun avis pour le moment. Soyez le premier à laisser un avis !
            </Text>
          )}
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
        <View style={[styles.actionButtons, { backgroundColor: colors.surface }]}>
        <TouchableOpacity 
          style={[styles.floatingActionButton, { backgroundColor: colors.buttonPrimary }]}
          onPress={handleNavigateToMap}
        >
          <Navigation size={24} color="#FFFFFF" strokeWidth={2} />
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.floatingActionButton, { backgroundColor: isPlanned ? colors.buttonPrimary : colors.buttonPrimary }]}
          onPress={handlePlanVisit}
        >
          <Calendar size={24} color={isPlanned ? "#FBBF24" : "#FFFFFF"} fill={isPlanned ? "#FBBF24" : "transparent"} strokeWidth={2} />
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.floatingActionButton, { backgroundColor: colors.buttonPrimary }]}
          onPress={handleTakePhoto}
        >
          <Camera size={24} color="#FFFFFF" strokeWidth={2} />
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.floatingActionButton, { backgroundColor: '#F59E0B' }]}
          onPress={() => setShowReviewModal(true)}
        >
          <Star size={24} color="#FFFFFF" fill="#FFFFFF" strokeWidth={2} />
        </TouchableOpacity>
        </View>
      </View>

      {/* Review Modal */}
      <Modal
        visible={showReviewModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowReviewModal(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.modalContainer}
        >
          <TouchableOpacity 
            style={styles.modalOverlay} 
            activeOpacity={1}
            onPress={() => setShowReviewModal(false)}
          />
          <View style={[styles.modalContent, { backgroundColor: colors.surface }]}>
            <Text style={[styles.modalTitle, { color: colors.text }]}>Laisser un avis</Text>
            
            <View style={[styles.infoBox, { backgroundColor: colors.background, borderColor: colors.border }]}>
              <Text style={[styles.infoBoxText, { color: colors.textSecondary }]}>
                ℹ️ Vous ne pouvez laisser qu'un seul avis par monument. Si vous en soumettez un nouveau, il remplacera votre avis précédent. Les avis sont anonymes.
              </Text>
            </View>
            
            <View style={styles.starRatingContainer}>
              <Text style={[styles.starRatingLabel, { color: colors.textSecondary }]}>Votre note</Text>
              <View style={styles.starRatingRow}>
                {[1, 2, 3, 4, 5].map((star) => (
                  <TouchableOpacity key={star} onPress={() => setUserRating(star)}>
                    <Star 
                      size={36} 
                      color="#FBBF24" 
                      fill={star <= userRating ? "#FBBF24" : "transparent"} 
                      strokeWidth={2} 
                    />
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View style={styles.commentContainer}>
              <Text style={[styles.commentLabel, { color: colors.textSecondary }]}>Votre commentaire</Text>
              <TextInput
                style={[
                  styles.commentInput,
                  { 
                    backgroundColor: colors.background,
                    color: colors.text,
                    borderColor: colors.border,
                  }
                ]}
                placeholder="Partagez votre expérience..."
                placeholderTextColor={colors.textSecondary}
                multiline
                numberOfLines={4}
                value={userComment}
                onChangeText={setUserComment}
              />
            </View>

            <View style={styles.modalButtons}>
              <TouchableOpacity 
                style={[styles.modalButton, styles.modalButtonCancel, { backgroundColor: colors.border }]}
                onPress={() => {
                  setShowReviewModal(false);
                  setUserRating(0);
                  setUserComment('');
                }}
              >
                <Text style={[styles.modalButtonText, { color: colors.text }]}>Annuler</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[styles.modalButton, styles.modalButtonSubmit, { backgroundColor: colors.buttonPrimary }]}
                onPress={handleSubmitReview}
              >
                <Text style={[styles.modalButtonText, { color: '#FFFFFF' }]}>Publier</Text>
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* Plan Visit Modal */}
      <Modal
        visible={showPlanModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowPlanModal(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.modalContainer}
        >
          <TouchableOpacity 
            style={styles.modalOverlay} 
            activeOpacity={1}
            onPress={() => setShowPlanModal(false)}
          />
          <View style={[styles.modalContent, { backgroundColor: colors.surface }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>Planifier une visite</Text>
              <TouchableOpacity onPress={() => setShowPlanModal(false)}>
                <X size={24} color={colors.text} />
              </TouchableOpacity>
            </View>
            
            <View style={styles.dateContainer}>
              <Text style={[styles.dateLabel, { color: colors.textSecondary }]}>Date de la visite</Text>
              <View style={[styles.dateDisplay, { backgroundColor: colors.background, borderColor: colors.border }]}>
                <Calendar size={20} color={colors.buttonPrimary} />
                <Text style={[styles.dateText, { color: colors.text }]}>
                  {selectedDate.toLocaleDateString('fr-FR', { 
                    weekday: 'long', 
                    year: 'numeric', 
                    month: 'long', 
                    day: 'numeric' 
                  })}
                </Text>
              </View>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.dateScroll}>
                {Array.from({ length: 21 }, (_, i) => i).map((offset) => {
                  const date = new Date();
                  date.setDate(date.getDate() + offset);
                  const isSelected = date.toDateString() === selectedDate.toDateString();
                  
                  return (
                    <TouchableOpacity
                      key={offset}
                      style={[
                        styles.dateOption,
                        { borderColor: colors.border },
                        isSelected && { backgroundColor: colors.buttonPrimary, borderColor: colors.buttonPrimary }
                      ]}
                      onPress={() => setSelectedDate(date)}
                    >
                      <Text style={[
                        styles.dateDayName,
                        { color: isSelected ? '#FFFFFF' : colors.textSecondary }
                      ]}>
                        {date.toLocaleDateString('fr-FR', { weekday: 'short' })}
                      </Text>
                      <Text style={[
                        styles.dateDayNumber,
                        { color: isSelected ? '#FFFFFF' : colors.text }
                      ]}>
                        {date.getDate()}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            </View>

            <View style={styles.timeSlotContainer}>
              <Text style={[styles.timeSlotLabel, { color: colors.textSecondary }]}>Créneau horaire</Text>
              {monument.openingHours && (
                <Text style={[styles.openingHoursInfo, { color: colors.textSecondary }]}>
                  Horaires: {monument.openingHours}
                </Text>
              )}
              {generateTimeSlots(monument.openingHours || '9h00 - 18h00', selectedDate).length === 0 ? (
                <View style={[styles.closedWarning, { backgroundColor: 'rgba(239, 68, 68, 0.1)', borderColor: '#EF4444' }]}>
                  <Text style={[styles.closedWarningText, { color: '#EF4444' }]}>
                    ⚠️ Monument fermé ce jour-là
                  </Text>
                  <Text style={[styles.closedWarningSubtext, { color: colors.textSecondary }]}>
                    Veuillez sélectionner un autre jour
                  </Text>
                </View>
              ) : (
                <View style={styles.timeSlotsGrid}>
                  {generateTimeSlots(monument.openingHours || '9h00 - 18h00', selectedDate).map((slot) => (
                    <TouchableOpacity
                      key={slot}
                      style={[
                        styles.timeSlotOption,
                        { borderColor: colors.border, backgroundColor: colors.background },
                        selectedTimeSlot === slot && { 
                          backgroundColor: colors.buttonPrimary, 
                          borderColor: colors.buttonPrimary 
                        }
                      ]}
                      onPress={() => setSelectedTimeSlot(slot)}
                    >
                      <Clock size={18} color={selectedTimeSlot === slot ? '#FFFFFF' : colors.textSecondary} />
                      <Text style={[
                        styles.timeSlotText,
                        { color: selectedTimeSlot === slot ? '#FFFFFF' : colors.text }
                      ]}>
                        {slot}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            </View>

            <View style={styles.modalButtons}>
              <TouchableOpacity 
                style={[styles.modalButton, styles.modalButtonCancel, { backgroundColor: colors.border }]}
                onPress={() => {
                  setShowPlanModal(false);
                  setSelectedTimeSlot('');
                }}
              >
                <Text style={[styles.modalButtonText, { color: colors.text }]}>Annuler</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[styles.modalButton, styles.modalButtonSubmit, { backgroundColor: colors.buttonPrimary }]}
                onPress={handleSubmitPlan}
              >
                <Text style={[styles.modalButtonText, { color: '#FFFFFF' }]}>Confirmer</Text>
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  imageContainer: {
    height: 400,
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
    height: 140,
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight || 40 : 60,
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
  headerBackButton: {
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
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
    backgroundColor: '#1E40AF',
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
    // color défini inline avec colors.link
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
    backgroundColor: '#6366F1',
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
  reviewsSection: {
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  ratingOverview: {
    flexDirection: 'row',
    gap: 24,
  },
  ratingOverviewLeft: {
    alignItems: 'center',
    paddingRight: 24,
    borderRightWidth: 1,
    borderRightColor: '#E5E7EB',
  },
  ratingNumber: {
    fontSize: 48,
    fontWeight: '800',
    marginBottom: 8,
  },
  starsRow: {
    flexDirection: 'row',
    gap: 4,
    marginBottom: 8,
  },
  reviewCount: {
    fontSize: 13,
    fontWeight: '500',
  },
  ratingOverviewRight: {
    flex: 1,
    gap: 8,
  },
  ratingBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  ratingLabel: {
    fontSize: 13,
    fontWeight: '600',
    width: 12,
  },
  barBackground: {
    flex: 1,
    height: 6,
    borderRadius: 3,
    overflow: 'hidden',
  },
  barFill: {
    height: '100%',
    backgroundColor: '#FBBF24',
    borderRadius: 3,
  },
  ratingCount: {
    fontSize: 12,
    fontWeight: '500',
    width: 24,
    textAlign: 'right',
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
    // backgroundColor définie inline avec colors.buttonPrimary
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
    backgroundColor: '#6366F1',
    borderWidth: 2,
    borderColor: '#6366F1',
    shadowColor: '#6366F1',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.8,
    shadowRadius: 8,
    elevation: 8,
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    paddingBottom: 40,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 24,
    textAlign: 'center',
  },
  starRatingContainer: {
    marginBottom: 24,
  },
  starRatingLabel: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 12,
  },
  starRatingRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 12,
  },
  commentContainer: {
    marginBottom: 24,
  },
  commentLabel: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 12,
  },
  commentInput: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    minHeight: 120,
    textAlignVertical: 'top',
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  modalButton: {
    flex: 1,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  modalButtonCancel: {
    // backgroundColor définie inline avec colors.border
  },
  modalButtonSubmit: {
    // backgroundColor définie inline avec colors.buttonPrimary
  },
  modalButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  infoBox: {
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    marginBottom: 20,
  },
  infoBoxText: {
    fontSize: 13,
    lineHeight: 18,
    textAlign: 'center',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  dateContainer: {
    marginBottom: 24,
  },
  dateLabel: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 12,
  },
  dateDisplay: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 16,
  },
  dateText: {
    fontSize: 15,
    fontWeight: '500',
  },
  dateScroll: {
    marginTop: 8,
  },
  dateOption: {
    width: 70,
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderRadius: 12,
    borderWidth: 2,
    marginRight: 12,
    alignItems: 'center',
  },
  dateDayName: {
    fontSize: 12,
    fontWeight: '500',
    marginBottom: 4,
    textTransform: 'capitalize',
  },
  dateDayNumber: {
    fontSize: 20,
    fontWeight: '700',
  },
  timeSlotContainer: {
    marginBottom: 24,
  },
  timeSlotLabel: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 12,
  },
  openingHoursInfo: {
    fontSize: 13,
    fontStyle: 'italic',
    marginBottom: 12,
    textAlign: 'center',
  },
  timeSlotsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  timeSlotOption: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: 2,
  },
  timeSlotText: {
    fontSize: 15,
    fontWeight: '600',
  },
  closedWarning: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 2,
    alignItems: 'center',
  },
  closedWarningText: {
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 4,
  },
  closedWarningSubtext: {
    fontSize: 13,
  },
  reviewsList: {
    marginTop: 20,
    gap: 16,
  },
  reviewItem: {
    paddingBottom: 16,
    borderBottomWidth: 1,
  },
  reviewHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  reviewStars: {
    flexDirection: 'row',
    gap: 2,
  },
  reviewDate: {
    fontSize: 12,
  },
  reviewComment: {
    fontSize: 14,
    lineHeight: 20,
  },
  noReviews: {
    marginTop: 16,
    fontSize: 14,
    textAlign: 'center',
    fontStyle: 'italic',
  },
  moreReviews: {
    marginTop: 12,
    fontSize: 13,
    textAlign: 'center',
    fontStyle: 'italic',
  },
});
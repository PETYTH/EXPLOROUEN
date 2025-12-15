import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  ScrollView,
  Image,
  RefreshControl,
  Alert,
  Modal,
  Dimensions,
  ActivityIndicator,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { router } from 'expo-router';
import { Star, Award, Camera, Bell, Shield, MessageCircle, HelpCircle, LogOut, Trash2, Target, MapPin, Trophy, CheckCircle, Activity, TrendingUp, X, Images, Calendar as CalendarIcon, Clock, Users, ChevronRight } from 'lucide-react-native';
import { useUser, useClerk, useAuth } from '@clerk/clerk-expo';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '@/contexts/ThemeContext';
import AsyncStorage from '@react-native-async-storage/async-storage';
import ApiService from '@/services/api';

export default function ProfileScreen() {
  const { user } = useUser();
  const { signOut } = useClerk();
  const { getToken } = useAuth();
  const [refreshing, setRefreshing] = useState(false);
  const [privacyMode, setPrivacyMode] = useState('Public');
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [profileImage, setProfileImage] = useState<string | null>(null);
  const [userStats, setUserStats] = useState({
    totalActivities: 0,
    activeActivities: 0,
    completedActivities: 0,
    monumentsVisited: 0,
    easterEggs: 0,
    participatedActivities: 0,
    learningJourney: 0,
    quizzesAwaiting: 0,
    lessonsInQueue: 0
  });
  const { colors } = useTheme();

  // Système de niveau 1-10 basé sur les activités effectuées
  const getLevelInfo = (completedActivities: number) => {
    const level = Math.min(Math.floor(completedActivities / 2) + 1, 10);
    const levelNames = [
      'Débutant', 'Novice', 'Apprenti', 'Explorateur', 'Aventurier', 
      'Expérimenté', 'Expert', 'Vétéran', 'Maître', 'Légende'
    ];
    return { 
      level: levelNames[level - 1] || 'Débutant', 
      levelNumber: level 
    };
  };

  const currentLevelInfo = getLevelInfo(userStats.completedActivities);

  const [appRating, setAppRating] = useState(0);
  const [monumentPhotos, setMonumentPhotos] = useState<any[]>([]);
  const [selectedPhoto, setSelectedPhoto] = useState<any>(null);
  const [showPhotoModal, setShowPhotoModal] = useState(false);
  const [isLoadingStats, setIsLoadingStats] = useState(true);
  const [userActivities, setUserActivities] = useState<any[]>([]);
  const [isLoadingActivities, setIsLoadingActivities] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState(new Date());
  const [plannedVisits, setPlannedVisits] = useState<any[]>([]);
  const [isLoadingVisits, setIsLoadingVisits] = useState(false);

  // Fonction pour récupérer les statistiques utilisateur depuis le backend
  const fetchUserStats = async () => {
    if (!user) {
      setIsLoadingStats(false);
      return;
    }
    
    setIsLoadingStats(true);
    try {
      const token = await getToken() || '';
      const backendUrl = process.env.EXPO_PUBLIC_URL_BACKEND || 'http://localhost:5000/api';
      
      // Appel API pour récupérer les vraies statistiques utilisateur
      const response = await fetch(`${backendUrl}/users/stats`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const stats = await response.json();
        setUserStats({
          totalActivities: stats.registeredActivities || 0, // Activités auxquelles l'utilisateur est inscrit
          activeActivities: stats.activeActivities || 0,
          completedActivities: stats.completedActivities || 0, // Activités effectuées
          monumentsVisited: stats.monumentsVisited || 0,
          easterEggs: stats.easterEggs || 0,
          participatedActivities: stats.registeredActivities || 0, // Pour le niveau
          learningJourney: stats.learningJourney || 0,
          quizzesAwaiting: stats.quizzesAwaiting || 0,
          lessonsInQueue: stats.lessonsInQueue || 0
        });
      } else {
        // Fallback avec des données par défaut si l'API échoue
        setUserStats({
          totalActivities: 0,
          activeActivities: 0,
          completedActivities: 0,
          monumentsVisited: 0,
          easterEggs: 0,
          participatedActivities: 0,
          learningJourney: 0,
          quizzesAwaiting: 0,
          lessonsInQueue: 0
        });
      }
    } catch (error) {
      // Erreur lors de la récupération des statistiques
      // Fallback en cas d'erreur
      setUserStats({
        totalActivities: 0,
        activeActivities: 0,
        completedActivities: 0,
        monumentsVisited: 0,
        easterEggs: 0,
        participatedActivities: 0,
        learningJourney: 0,
        quizzesAwaiting: 0,
        lessonsInQueue: 0
      });
    } finally {
      setIsLoadingStats(false);
    }
  };

  // Fonction pour créer un File object à partir de l'URI
  const createFileFromUri = async (uri: string): Promise<File> => {
    try {
      const response = await fetch(uri);
      const blob = await response.blob();
      
      // Créer un File object avec le bon type MIME
      const file = new File([blob], 'profile-image.jpg', {
        type: blob.type || 'image/jpeg',
      });
      
      return file;
    } catch (error) {
      throw new Error('Impossible de créer le fichier à partir de l\'URI');
    }
  };

  // Fonction pour changer la photo de profil
  const changeProfilePicture = async () => {
    try {
      // Demander les permissions
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission requise', 'Nous avons besoin d\'accéder à vos photos pour changer votre photo de profil.');
        return;
      }

      // Options pour le sélecteur d'image
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
        exif: false,
      });

      if (!result.canceled && result.assets[0]) {
        const imageUri = result.assets[0].uri;
        
        // Utiliser l'état local pour l'instant (Clerk pose des problèmes)
        setProfileImage(imageUri);
        Alert.alert('Photo mise à jour', 'Votre photo de profil a été changée !');
      }
    } catch (error) {
      // Erreur lors du changement de photo
      Alert.alert('Erreur', 'Impossible de changer la photo de profil.');
    }
  };

  const achievements = [
    { id: '1', title: 'Premier pas', description: 'Première activité complétée', icon: Target, unlocked: userStats.completedActivities > 0 },
    { id: '2', title: 'Explorateur', description: '10 activités participées', icon: MapPin, unlocked: userStats.totalActivities >= 10 },
    { id: '3', title: 'Chasseur d\'œufs', description: '5 œufs trouvés', icon: Trophy, unlocked: userStats.easterEggs >= 5 },
    { id: '4', title: 'Social', description: '20 conversations', icon: MessageCircle, unlocked: userStats.totalActivities >= 20 },
    { id: '5', title: 'Actif', description: userStats.completedActivities + ' activités terminées', icon: CheckCircle, unlocked: userStats.completedActivities >= 15 },
  ];

  // Fonction pour récupérer les visites planifiées
  const fetchPlannedVisits = async () => {
    if (!user) return;
    
    setIsLoadingVisits(true);
    try {
      const token = await getToken();
      if (!token) {
        console.log('❌ Pas de token pour récupérer les visites');
        return;
      }

      const API_URL = process.env.EXPO_PUBLIC_URL_BACKEND || 'http://localhost:5000/api';
      console.log('📡 Récupération des visites planifiées:', `${API_URL}/monuments/planned-visits`);
      
      const response = await fetch(`${API_URL}/monuments/planned-visits`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      console.log('📡 Response status:', response.status);

      if (response.ok) {
        const data = await response.json();
        console.log('✅ Visites planifiées récupérées:', data.data?.length || 0, 'visite(s)');
        console.log('📋 Données:', JSON.stringify(data.data, null, 2));
        setPlannedVisits(data.data || []);
      } else {
        const errorData = await response.json().catch(() => ({}));
        console.error('❌ Erreur API:', response.status, errorData);
      }
    } catch (error) {
      console.error('❌ Error fetching planned visits:', error);
    } finally {
      setIsLoadingVisits(false);
    }
  };

  // Fonction pour supprimer une photo de la galerie
  const handleDeletePhoto = async (photoId: string) => {
    Alert.alert(
      'Supprimer la photo',
      'Êtes-vous sûr de vouloir supprimer cette photo ?',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Supprimer',
          style: 'destructive',
          onPress: async () => {
            try {
              // Retirer la photo de la liste locale
              const updatedPhotos = monumentPhotos.filter(p => p.id !== photoId);
              setMonumentPhotos(updatedPhotos);
              
              // Sauvegarder la liste mise à jour dans AsyncStorage
              await AsyncStorage.setItem('monument_photos', JSON.stringify(updatedPhotos));
              
              Alert.alert('Succès', 'Photo supprimée avec succès');
            } catch (error) {
              console.error('Error deleting photo:', error);
              Alert.alert('Erreur', 'Une erreur est survenue');
            }
          }
        }
      ]
    );
  };

  const cancelVisit = async (visitId: string) => {
    try {
      const token = await getToken();
      if (!token) return;

      const API_URL = process.env.EXPO_PUBLIC_URL_BACKEND || 'http://localhost:5000/api';
      const response = await fetch(`${API_URL}/monuments/planned-visits/${visitId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        // Supprimer l'état planifié du AsyncStorage
        if (data.data?.monumentId) {
          await AsyncStorage.removeItem(`planned_${data.data.monumentId}`);
        }
        Alert.alert('Succès', 'Visite annulée');
        fetchPlannedVisits();
      }
    } catch (error) {
      Alert.alert('Erreur', 'Impossible d\'annuler la visite');
    }
  };

  const onRefresh = React.useCallback(() => {
    setRefreshing(true);
    Promise.all([
      fetchUserStats(),
      fetchPlannedVisits()
    ]).finally(() => setRefreshing(false));
  }, [user]);

  // Fonction pour charger les photos des monuments
  const loadMonumentPhotos = async () => {
    try {
      const photosData = await AsyncStorage.getItem('monument_photos');
      if (photosData) {
        const photos = JSON.parse(photosData);
        setMonumentPhotos(photos);
      }
    } catch (error) {
      // Erreur lors de la prise de photo
    }
  };

  // Fonction pour sauvegarder la note de l'app
  const saveAppRating = async (rating: number) => {
    try {
      await AsyncStorage.setItem('app_rating', rating.toString());
      setAppRating(rating);
      Alert.alert('Merci !', `Vous avez donné ${rating} étoile${rating > 1 ? 's' : ''} à ExploRouen !`);
    } catch (error) {
      // Erreur lors de la suppression de la photo
      Alert.alert('Erreur', 'Impossible de sauvegarder votre note.');
    }
  };

  // Fonction pour charger les activités de l'utilisateur
  const loadUserActivities = async () => {
    if (!user) return;
    
    setIsLoadingActivities(true);
    try {
      const token = await getToken();
      if (token) {
        const activities = await ApiService.getUserActivities(token);
        setUserActivities(activities);
      }
    } catch (error) {
      console.error('Erreur chargement activités:', error);
    } finally {
      setIsLoadingActivities(false);
    }
  };

  // Fonction pour charger la note de l'app
  const loadAppRating = async () => {
    try {
      const savedRating = await AsyncStorage.getItem('app_rating');
      if (savedRating) {
        setAppRating(parseInt(savedRating));
      }
    } catch (error) {
      console.error('Erreur lors du chargement de la note:', error);
    }
  };

  // Charger les statistiques et photos au montage du composant
  useEffect(() => {
    fetchUserStats();
    loadMonumentPhotos();
    loadAppRating();
    loadUserActivities();
    fetchPlannedVisits();
  }, [user]);

  const displayUser = user || {
    fullName: 'Invité',
    firstName: 'Invité',
    primaryEmailAddress: { emailAddress: 'Connectez-vous pour voir votre profil' },
    imageUrl: 'https://images.pexels.com/photos/774909/pexels-photo-774909.jpeg'
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header Dark */}
      <View style={[styles.header, { backgroundColor: colors.background }]}>
        <View style={styles.headerTop}>
          <Text style={[styles.headerTitle, { color: colors.text }]}>Profil</Text>
        </View>
      </View>

      <ScrollView 
        style={styles.content} 
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {/* Profile Card */}
        <View style={[styles.profileCard, { backgroundColor: colors.surface }]}>
          <View style={styles.profileHeader}>
            <View style={styles.avatarContainer}>
              <Image 
                source={{ uri: profileImage || displayUser?.imageUrl || 'https://images.pexels.com/photos/774909/pexels-photo-774909.jpeg' }} 
                style={styles.avatar} 
              />
              <TouchableOpacity style={styles.editAvatarButton} onPress={changeProfilePicture}>
                <Camera size={12} color="#FFFFFF" strokeWidth={2} />
              </TouchableOpacity>
            </View>
            
            <View style={styles.profileInfo}>
              <Text style={[styles.userName, { color: colors.text }]}>{displayUser?.fullName || displayUser?.firstName || 'Utilisateur'}</Text>
              <Text style={[styles.userEmail, { color: colors.textSecondary }]}>{displayUser?.primaryEmailAddress?.emailAddress || 'email@example.com'}</Text>
              <View style={styles.levelContainer}>
                <Text style={styles.levelText}>{currentLevelInfo.level}</Text>
                <View style={styles.xpContainer}>
                  <Text style={[styles.xpText, { color: colors.textSecondary }]}>{userStats.completedActivities} activités effectuées</Text>
                </View>
              </View>
            </View>
          </View>

          {/* Progress Bar */}
          <View style={styles.xpProgressContainer}>
            <View style={[styles.xpProgressBar, { backgroundColor: colors.border }]}>
              <LinearGradient
                colors={['#1E40AF', '#3B82F6']}
                style={[
                  styles.xpProgressFill,
                  { 
                    width: `${Math.min(((userStats.completedActivities % 2) / 2) * 100, 100)}%` 
                  }
                ]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
              />
            </View>
          </View>
        </View>

        {/* Stats Grid */}
        {isLoadingStats ? (
          <View style={[styles.loadingContainer, { backgroundColor: colors.surface }]}>
            <ActivityIndicator size="large" color="#1E40AF" />
            <Text style={[styles.loadingText, { color: colors.textSecondary }]}>Chargement des statistiques...</Text>
          </View>
        ) : (
          <View style={styles.statsGrid}>
            <View style={[styles.statCard, { backgroundColor: colors.surface }]}>
              <Activity size={20} color="#1E40AF" strokeWidth={2} />
              <Text style={[styles.statNumber, { color: colors.text }]}>{userStats.totalActivities}</Text>
              <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Activités inscrites</Text>
            </View>
            
            <View style={[styles.statCard, { backgroundColor: colors.surface }]}>
              <MapPin size={20} color="#DC2626" strokeWidth={2} />
              <Text style={[styles.statNumber, { color: colors.text }]}>{userStats.monumentsVisited}</Text>
              <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Monuments</Text>
            </View>
            
            <View style={[styles.statCard, { backgroundColor: colors.surface }]}>
              <Target size={20} color="#F59E0B" strokeWidth={2} />
              <Text style={[styles.statNumber, { color: colors.text }]}>{userStats.easterEggs}</Text>
              <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Œufs trouvés</Text>
            </View>
            
            <View style={[styles.statCard, { backgroundColor: colors.surface }]}>
              <TrendingUp size={20} color="#F59E0B" strokeWidth={2} />
              <Text style={[styles.statNumber, { color: colors.text }]}>{currentLevelInfo.levelNumber}</Text>
              <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Niveau</Text>
            </View>
          </View>
        )}

        {/* Gallery Section */}
        <View style={styles.gallerySection}>
          <View style={styles.gallerySectionHeader}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Ma Galerie</Text>
            <View style={styles.galleryStats}>
              <Images size={16} color="#1E40AF" strokeWidth={2} />
              <Text style={[styles.galleryStatsText, { color: colors.textSecondary }]}>
                {monumentPhotos.length} photo{monumentPhotos.length > 1 ? 's' : ''}
              </Text>
            </View>
          </View>
          
          {monumentPhotos.length > 0 ? (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.galleryContainer}>
              {monumentPhotos.map((photo, index) => (
                <TouchableOpacity
                  key={photo.id}
                  style={styles.galleryPhotoContainer}
                  onPress={() => {
                    setSelectedPhoto(photo);
                    setShowPhotoModal(true);
                  }}
                >
                  <Image source={{ uri: photo.uri }} style={styles.galleryPhoto} />
                  <TouchableOpacity 
                    style={styles.deletePhotoButton}
                    onPress={() => handleDeletePhoto(photo.id)}
                  >
                    <Trash2 size={16} color="#FFFFFF" strokeWidth={2} />
                  </TouchableOpacity>
                  <View style={styles.galleryPhotoOverlay}>
                    <Text style={styles.galleryPhotoTitle} numberOfLines={2}>
                      {photo.monumentName}
                    </Text>
                    <Text style={styles.galleryPhotoDate}>
                      {new Date(photo.timestamp).toLocaleDateString('fr-FR')}
                    </Text>
                  </View>
                </TouchableOpacity>
              ))}
            </ScrollView>
          ) : (
            <View style={[styles.emptyGallery, { backgroundColor: colors.surface }]}>
              <Camera size={32} color={colors.textSecondary} strokeWidth={1.5} />
              <Text style={[styles.emptyGalleryText, { color: colors.textSecondary }]}>
                Aucune photo prise
              </Text>
              <Text style={[styles.emptyGallerySubtext, { color: colors.textSecondary }]}>
                Visitez des monuments et prenez des photos pour les voir ici !
              </Text>
            </View>
          )}
        </View>

        {/* Historique des activités */}
        <View style={styles.historySection}>
          <View style={styles.sectionHeaderRow}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Historique des activités</Text>
            {userActivities.length > 0 && (
              <TouchableOpacity onPress={() => router.push('/activities')}>
                <Text style={[styles.viewAllText, { color: '#1E40AF' }]}>Voir tout</Text>
              </TouchableOpacity>
            )}
          </View>
          
          {isLoadingActivities ? (
            <View style={[styles.loadingActivityContainer, { backgroundColor: colors.surface }]}>
              <ActivityIndicator size="small" color="#1E40AF" />
              <Text style={[styles.loadingText, { color: colors.textSecondary }]}>Chargement...</Text>
            </View>
          ) : userActivities.length > 0 ? (
            <View style={styles.activitiesList}>
              {userActivities.slice(0, 3).map((activity) => {
                const activityDate = new Date(activity.startDate);
                const isPast = activityDate < new Date();
                
                return (
                  <TouchableOpacity
                    key={activity.id}
                    style={[styles.activityHistoryCard, { backgroundColor: colors.surface }]}
                    onPress={() => router.push(`/activity/${activity.id}`)}
                  >
                    <View style={styles.activityHistoryContent}>
                      <View style={styles.activityHistoryHeader}>
                        <Text style={[styles.activityHistoryTitle, { color: colors.text }]} numberOfLines={1}>
                          {activity.title}
                        </Text>
                        {isPast && (
                          <View style={styles.completedBadge}>
                            <CheckCircle size={14} color="#10B981" strokeWidth={2} />
                            <Text style={styles.completedText}>Terminée</Text>
                          </View>
                        )}
                      </View>
                      
                      <View style={styles.activityHistoryMeta}>
                        <View style={styles.activityHistoryMetaItem}>
                          <CalendarIcon size={14} color={colors.textSecondary} strokeWidth={2} />
                          <Text style={[styles.activityHistoryMetaText, { color: colors.textSecondary }]}>
                            {activityDate.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })}
                          </Text>
                        </View>
                        <View style={styles.activityHistoryMetaItem}>
                          <Clock size={14} color={colors.textSecondary} strokeWidth={2} />
                          <Text style={[styles.activityHistoryMetaText, { color: colors.textSecondary }]}>
                            {activity.duration || '1h'}
                          </Text>
                        </View>
                        {activity.participantCount && (
                          <View style={styles.activityHistoryMetaItem}>
                            <Users size={14} color={colors.textSecondary} strokeWidth={2} />
                            <Text style={[styles.activityHistoryMetaText, { color: colors.textSecondary }]}>
                              {activity.participantCount}
                            </Text>
                          </View>
                        )}
                      </View>
                    </View>
                    
                    <ChevronRight size={20} color={colors.textSecondary} strokeWidth={2} />
                  </TouchableOpacity>
                );
              })}
            </View>
          ) : (
            <View style={[styles.emptyState, { backgroundColor: colors.surface }]}>
              <Activity size={32} color={colors.textSecondary} strokeWidth={1.5} />
              <Text style={[styles.emptyStateText, { color: colors.textSecondary }]}>
                Aucune activité
              </Text>
              <Text style={[styles.emptyStateSubtext, { color: colors.textSecondary }]}>
                Inscrivez-vous à des activités pour les voir ici !
              </Text>
            </View>
          )}
        </View>

        {/* Calendrier des activités */}
        <View style={styles.calendarSection}>
          <View style={styles.sectionHeaderRow}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Agenda</Text>
            <View style={styles.monthSelector}>
              <TouchableOpacity
                onPress={() => {
                  const newDate = new Date(selectedMonth);
                  newDate.setMonth(newDate.getMonth() - 1);
                  setSelectedMonth(newDate);
                }}
                style={styles.monthButton}
              >
                <Text style={[styles.monthButtonText, { color: '#1E40AF' }]}>◀</Text>
              </TouchableOpacity>
              
              <Text style={[styles.currentMonth, { color: colors.text }]}>
                {selectedMonth.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })}
              </Text>
              
              <TouchableOpacity
                onPress={() => {
                  const newDate = new Date(selectedMonth);
                  newDate.setMonth(newDate.getMonth() + 1);
                  setSelectedMonth(newDate);
                }}
                style={styles.monthButton}
              >
                <Text style={[styles.monthButtonText, { color: '#1E40AF' }]}>▶</Text>
              </TouchableOpacity>
            </View>
          </View>

          {userActivities.filter(activity => {
            const activityDate = new Date(activity.startDate);
            return activityDate.getMonth() === selectedMonth.getMonth() &&
                   activityDate.getFullYear() === selectedMonth.getFullYear() &&
                   activityDate >= new Date();
          }).length > 0 ? (
            <View style={styles.calendarList}>
              {userActivities
                .filter(activity => {
                  const activityDate = new Date(activity.startDate);
                  return activityDate.getMonth() === selectedMonth.getMonth() &&
                         activityDate.getFullYear() === selectedMonth.getFullYear() &&
                         activityDate >= new Date();
                })
                .sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime())
                .map((activity) => {
                  const activityDate = new Date(activity.startDate);
                  const dayOfWeek = activityDate.toLocaleDateString('fr-FR', { weekday: 'short' });
                  const dayNumber = activityDate.getDate();
                  
                  return (
                    <TouchableOpacity
                      key={activity.id}
                      style={[styles.calendarEventCard, { backgroundColor: colors.surface }]}
                      onPress={() => router.push(`/activity/${activity.id}`)}
                    >
                      <View style={styles.calendarDateBadge}>
                        <Text style={styles.calendarDayOfWeek}>{dayOfWeek}</Text>
                        <Text style={styles.calendarDayNumber}>{dayNumber}</Text>
                      </View>
                      
                      <View style={styles.calendarEventContent}>
                        <Text style={[styles.calendarEventTitle, { color: colors.text }]} numberOfLines={1}>
                          {activity.title}
                        </Text>
                        <View style={styles.calendarEventMeta}>
                          <Clock size={12} color={colors.textSecondary} strokeWidth={2} />
                          <Text style={[styles.calendarEventTime, { color: colors.textSecondary }]}>
                            {activityDate.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                          </Text>
                          {activity.participantCount && (
                            <>
                              <Text style={[styles.calendarEventSeparator, { color: colors.textSecondary }]}>•</Text>
                              <Users size={12} color={colors.textSecondary} strokeWidth={2} />
                              <Text style={[styles.calendarEventParticipants, { color: colors.textSecondary }]}>
                                {activity.participantCount}
                              </Text>
                            </>
                          )}
                        </View>
                      </View>
                      
                      <ChevronRight size={18} color={colors.textSecondary} strokeWidth={2} />
                    </TouchableOpacity>
                  );
                })}
            </View>
          ) : (
            <View style={[styles.emptyState, { backgroundColor: colors.surface }]}>
              <CalendarIcon size={32} color={colors.textSecondary} strokeWidth={1.5} />
              <Text style={[styles.emptyStateText, { color: colors.textSecondary }]}>
                Aucune activité ce mois-ci
              </Text>
              <Text style={[styles.emptyStateSubtext, { color: colors.textSecondary }]}>
                Explorez les activités et inscrivez-vous !
              </Text>
            </View>
          )}
        </View>

        {/* Planned Visits */}
        <View style={styles.plannedVisitsSection}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Visites planifiées</Text>
            {plannedVisits.length > 0 && (
              <View style={[styles.badge, { backgroundColor: colors.buttonPrimary }]}>
                <Text style={styles.badgeText}>{plannedVisits.length}</Text>
              </View>
            )}
          </View>

          {isLoadingVisits ? (
            <ActivityIndicator size="small" color={colors.buttonPrimary} style={{ marginTop: 16 }} />
          ) : plannedVisits.length > 0 ? (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.plannedVisitsScroll}>
              {plannedVisits.map((visit) => {
                const visitDate = new Date(visit.visitDate);
                return (
                  <View key={visit.id} style={[styles.plannedVisitCard, { backgroundColor: colors.surface }]}>
                    <Image 
                      source={{ uri: visit.monument.images?.[0] || 'https://via.placeholder.com/150' }} 
                      style={styles.plannedVisitImage} 
                    />
                    <View style={styles.plannedVisitContent}>
                      <Text style={[styles.plannedVisitName, { color: colors.text }]} numberOfLines={1}>
                        {visit.monument.name}
                      </Text>
                      <View style={styles.plannedVisitDateRow}>
                        <CalendarIcon size={14} color={colors.textSecondary} />
                        <Text style={[styles.plannedVisitDate, { color: colors.textSecondary }]}>
                          {visitDate.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}
                        </Text>
                      </View>
                      <View style={styles.plannedVisitTimeRow}>
                        <Clock size={14} color={colors.textSecondary} />
                        <Text style={[styles.plannedVisitTime, { color: colors.textSecondary }]}>
                          {visit.timeSlot}
                        </Text>
                      </View>
                      <TouchableOpacity 
                        style={[styles.cancelButton, { borderColor: colors.border }]}
                        onPress={() => {
                          Alert.alert(
                            'Annuler la visite',
                            `Voulez-vous vraiment annuler votre visite de ${visit.monument.name} ?`,
                            [
                              { text: 'Non', style: 'cancel' },
                              { text: 'Oui', onPress: () => cancelVisit(visit.id), style: 'destructive' }
                            ]
                          );
                        }}
                      >
                        <Text style={[styles.cancelButtonText, { color: colors.textSecondary }]}>Annuler</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                );
              })}
            </ScrollView>
          ) : (
            <View style={[styles.emptyState, { backgroundColor: colors.surface }]}>
              <CalendarIcon size={32} color={colors.textSecondary} strokeWidth={1.5} />
              <Text style={[styles.emptyStateText, { color: colors.textSecondary }]}>
                Aucune visite planifiée
              </Text>
              <Text style={[styles.emptyStateSubtext, { color: colors.textSecondary }]}>
                Planifiez vos visites depuis les pages des monuments
              </Text>
            </View>
          )}
        </View>

        {/* Achievements */}
        <View style={styles.achievementsSection}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Succès</Text>
          <View style={styles.achievementsList}>
            {achievements.map((achievement) => (
              <View key={achievement.id} style={[
                styles.achievementCard,
                { backgroundColor: colors.surface },
                !achievement.unlocked && styles.achievementLocked
              ]}>
                <View style={styles.achievementIconContainer}>
                  <achievement.icon size={24} color={achievement.unlocked ? "#1E40AF" : "#6B7280"} strokeWidth={2} />
                </View>
                <View style={styles.achievementInfo}>
                  <Text style={[
                    styles.achievementTitle,
                    { color: achievement.unlocked ? colors.text : '#6B7280' },
                    !achievement.unlocked && styles.achievementTitleLocked
                  ]}>
                    {achievement.title}
                  </Text>
                  <Text style={[
                    styles.achievementDescription,
                    { color: colors.textSecondary },
                    !achievement.unlocked && styles.achievementDescriptionLocked
                  ]}>
                    {achievement.description}
                  </Text>
                </View>
                {achievement.unlocked && (
                  <View style={styles.achievementBadge}>
                    <Award size={16} color="#10B981" strokeWidth={2} />
                  </View>
                )}
              </View>
            ))}
          </View>
        </View>

        {/* Settings Menu */}
        <View style={styles.settingsSection}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Paramètres</Text>
          
          <View style={[styles.settingsMenu, { backgroundColor: colors.surface }]}>
            <TouchableOpacity style={styles.settingItem} onPress={() => router.push('/notifications')}>
              <Bell size={20} color="#1E40AF" strokeWidth={2} />
              <Text style={[styles.settingText, { color: colors.text }]}>Notifications</Text>
              <TouchableOpacity 
                style={styles.settingToggle}
                onPress={() => {
                  const newState = !notificationsEnabled;
                  setNotificationsEnabled(newState);
                  // Ici vous pourriez sauvegarder la préférence
                }}
              >
                <LinearGradient
                  colors={notificationsEnabled ? ['#1E40AF', '#3B82F6'] : ['#374151', '#4B5563']}
                  style={styles.settingToggleGradient}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                >
                  <View style={[
                    styles.settingToggleThumb,
                    { transform: [{ translateX: notificationsEnabled ? 20 : 2 }] }
                  ]} />
                </LinearGradient>
              </TouchableOpacity>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.settingItem} onPress={() => {
              Alert.alert(
                'Noter l\'application',
                'Quelle note donneriez-vous à ExploRouen ?',
                [
                  { text: '1 ⭐', onPress: () => saveAppRating(1) },
                  { text: '2 ⭐⭐', onPress: () => saveAppRating(2) },
                  { text: '3 ⭐⭐⭐', onPress: () => saveAppRating(3) },
                  { text: '4 ⭐⭐⭐⭐', onPress: () => saveAppRating(4) },
                  { text: '5 ⭐⭐⭐⭐⭐', onPress: () => saveAppRating(5) },
                  { text: 'Annuler', style: 'cancel' }
                ]
              );
            }}>
              <Star size={20} color="#1E40AF" strokeWidth={2} />
              <Text style={[styles.settingText, { color: colors.text }]}>Noter l'app</Text>
              <View style={styles.starsContainer}>
                {[1, 2, 3, 4, 5].map((star) => (
                  <Star 
                    key={star} 
                    size={16} 
                    color={star <= appRating ? "#1E40AF" : "#6B7280"} 
                    fill={star <= appRating ? "#1E40AF" : "transparent"}
                    strokeWidth={1}
                  />
                ))}
              </View>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.settingItem} onPress={() => router.push('/contact')}>
              <MessageCircle size={20} color="#1E40AF" strokeWidth={2} />
              <Text style={[styles.settingText, { color: colors.text }]}>Nous contacter</Text>
              <HelpCircle size={16} color={colors.textSecondary} strokeWidth={2} />
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.settingItem} onPress={() => router.push('/legal')}>
              <Shield size={20} color="#1E40AF" strokeWidth={2} />
              <Text style={[styles.settingText, { color: colors.text }]}>Mentions légales</Text>
              <HelpCircle size={16} color={colors.textSecondary} strokeWidth={2} />
            </TouchableOpacity>
            
            {user && (
              <>
                <TouchableOpacity style={styles.settingItem} onPress={() => {
                  Alert.alert(
                    'Supprimer mon compte',
                    'Êtes-vous sûr de vouloir supprimer définitivement votre compte ? Cette action est irréversible.',
                    [
                      { text: 'Annuler', style: 'cancel' },
                      { 
                        text: 'Supprimer', 
                        style: 'destructive', 
                        onPress: async () => {
                          try {
                            console.log('🗑️ Début de la suppression du compte...');
                            
                            // 1. Supprimer le compte via l'API Clerk
                            if (user) {
                              console.log('🗑️ Suppression du compte Clerk pour:', user.id);
                              await user.delete();
                              console.log('✅ Compte Clerk supprimé avec succès');
                            }
                            
                            // 2. Nettoyer le stockage local
                            await AsyncStorage.multiRemove([
                              'cookieConsent',
                              'app_rating',
                              'monument_photos',
                              'hasSeenOnboarding'
                            ]);
                            console.log('✅ Données locales nettoyées');
                            
                            // 3. Déconnexion
                            await signOut();
                            console.log('✅ Déconnexion effectuée');
                            
                            Alert.alert(
                              'Compte supprimé', 
                              'Votre compte a été définitivement supprimé.',
                              [{ text: 'OK' }]
                            );
                          } catch (error) {
                            console.error('❌ Erreur lors de la suppression:', error);
                            Alert.alert(
                              'Erreur', 
                              'Impossible de supprimer le compte. Veuillez réessayer.',
                              [{ text: 'OK' }]
                            );
                          }
                        }
                      }
                    ]
                  );
                }}>
                  <Trash2 size={20} color="#EF4444" strokeWidth={2} />
                  <Text style={[styles.settingText, { color: '#EF4444' }]}>Supprimer mon compte</Text>
                </TouchableOpacity>
                
                <TouchableOpacity style={styles.settingItem} onPress={() => {
                  Alert.alert(
                    'Déconnexion',
                    'Voulez-vous vous déconnecter ?',
                    [
                      { text: 'Annuler', style: 'cancel' },
                      { text: 'Déconnexion', style: 'destructive', onPress: () => signOut() }
                    ]
                  );
                }}>
                  <LogOut size={20} color="#1E40AF" strokeWidth={2} />
                  <Text style={[styles.settingText, { color: '#1E40AF' }]}>Déconnexion</Text>
                </TouchableOpacity>
              </>
            )}
            
            {!user && (
              <TouchableOpacity style={styles.settingItem} onPress={() => router.push('/(auth)/auth')}>
                <LogOut size={20} color="#1E40AF" strokeWidth={2} />
                <Text style={[styles.settingText, { color: '#1E40AF' }]}>Se connecter</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Version de l'app */}
        <View style={styles.versionContainer}>
          <Text style={[styles.versionText, { color: colors.textSecondary }]}>Version 1.0</Text>
          <Text style={[styles.copyrightText, { color: colors.textSecondary }]}>© 2025 ExploRouen</Text>
        </View>

        <View style={styles.bottomSpacing} />
      </ScrollView>

      {/* Photo Modal */}
      <Modal
        visible={showPhotoModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowPhotoModal(false)}
      >
        <View style={styles.photoModalContainer}>
          <TouchableOpacity
            style={styles.photoModalClose}
            onPress={() => setShowPhotoModal(false)}
          >
            <X size={24} color="#FFFFFF" strokeWidth={2} />
          </TouchableOpacity>
          
          {selectedPhoto && (
            <View style={styles.photoModalContent}>
              <Image source={{ uri: selectedPhoto.uri }} style={styles.photoModalImage} />
              <View style={styles.photoModalInfo}>
                <Text style={styles.photoModalTitle}>{selectedPhoto.monumentName}</Text>
                <Text style={styles.photoModalDate}>
                  {new Date(selectedPhoto.timestamp).toLocaleDateString('fr-FR', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </Text>
              </View>
            </View>
          )}
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 20,
  },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerTitle: {
    fontSize: 32,
    fontWeight: '700',
  },
  settingsButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#1E40AF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  profileCard: {
    borderRadius: 20,
    padding: 20,
    marginBottom: 24,
  },
  profileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  avatarContainer: {
    position: 'relative',
    marginRight: 16,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 3,
    borderColor: '#1E40AF',
  },
  editAvatarButton: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#1E40AF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  profileInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 4,
  },
  userEmail: {
    fontSize: 14,
    marginBottom: 8,
  },
  levelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  levelText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1E40AF',
  },
  xpContainer: {
    backgroundColor: '#374151',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  xpText: {
    fontSize: 12,
    fontWeight: '500',
  },
  xpProgressContainer: {
    marginTop: 8,
  },
  xpProgressBar: {
    height: 6,
    borderRadius: 3,
    overflow: 'hidden',
  },
  xpProgressFill: {
    height: '100%',
    borderRadius: 3,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 24,
  },
  statCard: {
    width: '48%',
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    gap: 8,
  },
  statNumber: {
    fontSize: 24,
    fontWeight: '800',
  },
  statLabel: {
    fontSize: 12,
    fontWeight: '500',
  },
  achievementsSection: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 16,
  },
  achievementsList: {
    gap: 12,
  },
  achievementCard: {
    borderRadius: 16,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  achievementLocked: {
    opacity: 0.5,
  },
  achievementIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(99, 102, 241, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  achievementInfo: {
    flex: 1,
  },
  achievementTitle: {
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 4,
  },
  achievementTitleLocked: {
    color: '#6B7280',
  },
  achievementDescription: {
    fontSize: 13,
  },
  achievementDescriptionLocked: {
    color: '#4B5563',
  },
  achievementBadge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#065F46',
    alignItems: 'center',
    justifyContent: 'center',
  },
  settingsSection: {
    marginBottom: 24,
  },
  settingsMenu: {
    borderRadius: 16,
    overflow: 'hidden',
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 16,
    gap: 12,
  },
  settingText: {
    flex: 1,
    fontSize: 15,
    fontWeight: '500',
  },
  settingValue: {
    fontSize: 14,
    fontWeight: '500',
  },
  settingToggle: {
    width: 44,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    paddingHorizontal: 2,
  },
  settingToggleGradient: {
    width: 44,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    paddingHorizontal: 2,
  },
  settingToggleThumb: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#FFFFFF',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2,
  },
  authPrompt: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  authTitle: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 16,
  },
  authDescription: {
    fontSize: 16,
    textAlign: 'center',
    marginTop: 8,
  },
  starsContainer: {
    flexDirection: 'row',
    gap: 2,
  },
  versionContainer: {
    alignItems: 'center',
    paddingVertical: 20,
    marginTop: 20,
    borderTopWidth: 1,
    borderTopColor: '#374151',
  },
  versionText: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 4,
  },
  copyrightText: {
    fontSize: 12,
    fontWeight: '400',
  },
  bottomSpacing: {
    height: 100,
  },
  // Gallery styles
  gallerySection: {
    marginBottom: 24,
  },
  gallerySectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  galleryStats: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  galleryStatsText: {
    fontSize: 14,
    fontWeight: '500',
  },
  galleryContainer: {
    marginTop: 12,
  },
  galleryPhotoContainer: {
    width: 140,
    height: 100,
    marginRight: 12,
    borderRadius: 12,
    overflow: 'hidden',
    position: 'relative',
  },
  galleryPhoto: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  deletePhotoButton: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#EF4444',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  galleryPhotoOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0,0,0,0.7)',
    padding: 8,
  },
  galleryPhotoTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 2,
  },
  galleryPhotoDate: {
    fontSize: 10,
    color: '#E5E7EB',
  },
  emptyGallery: {
    borderRadius: 16,
    padding: 32,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: 'rgba(99, 102, 241, 0.2)',
    borderStyle: 'dashed',
  },
  emptyGalleryText: {
    fontSize: 16,
    fontWeight: '600',
    marginTop: 12,
    textAlign: 'center',
  },
  emptyGallerySubtext: {
    fontSize: 14,
    marginTop: 4,
    textAlign: 'center',
  },
  // Photo Modal styles
  photoModalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.9)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  photoModalClose: {
    position: 'absolute',
    top: 60,
    right: 20,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1,
  },
  photoModalContent: {
    width: '90%',
    alignItems: 'center',
  },
  photoModalImage: {
    width: '100%',
    height: 400,
    borderRadius: 12,
    resizeMode: 'contain',
  },
  photoModalInfo: {
    marginTop: 20,
    alignItems: 'center',
  },
  photoModalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 8,
  },
  photoModalDate: {
    fontSize: 16,
    color: '#E5E7EB',
    textAlign: 'center',
  },
  // Loading styles
  loadingContainer: {
    borderRadius: 20,
    padding: 40,
    marginBottom: 24,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  loadingText: {
    fontSize: 16,
    fontWeight: '500',
    textAlign: 'center',
  },
  // History Section
  historySection: {
    marginBottom: 24,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  viewAllText: {
    fontSize: 14,
    fontWeight: '600',
  },
  loadingActivityContainer: {
    borderRadius: 16,
    padding: 32,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  activitiesList: {
    gap: 12,
  },
  activityHistoryCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderRadius: 16,
    padding: 16,
    gap: 12,
  },
  activityHistoryContent: {
    flex: 1,
    gap: 8,
  },
  activityHistoryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  activityHistoryTitle: {
    fontSize: 16,
    fontWeight: '700',
    flex: 1,
  },
  completedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    backgroundColor: '#D1FAE5',
    borderRadius: 8,
  },
  completedText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#059669',
  },
  activityHistoryMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  activityHistoryMetaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  activityHistoryMetaText: {
    fontSize: 13,
    fontWeight: '500',
  },
  emptyState: {
    borderRadius: 16,
    padding: 32,
    alignItems: 'center',
    gap: 8,
  },
  emptyStateText: {
    fontSize: 16,
    fontWeight: '600',
    marginTop: 8,
  },
  emptyStateSubtext: {
    fontSize: 14,
    textAlign: 'center',
  },
  // Calendar Section
  calendarSection: {
    marginBottom: 24,
  },
  monthSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  monthButton: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  monthButtonText: {
    fontSize: 20,
    fontWeight: '700',
  },
  currentMonth: {
    fontSize: 15,
    fontWeight: '700',
    textTransform: 'capitalize',
  },
  calendarList: {
    gap: 12,
  },
  calendarEventCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 16,
    padding: 16,
    gap: 16,
  },
  calendarDateBadge: {
    width: 56,
    height: 56,
    borderRadius: 12,
    backgroundColor: '#1E40AF',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#1E40AF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  calendarDayOfWeek: {
    fontSize: 11,
    fontWeight: '600',
    color: '#FFFFFF',
    textTransform: 'uppercase',
  },
  calendarDayNumber: {
    fontSize: 22,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  calendarEventContent: {
    flex: 1,
    gap: 6,
  },
  calendarEventTitle: {
    fontSize: 16,
    fontWeight: '700',
  },
  calendarEventMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  calendarEventTime: {
    fontSize: 13,
    fontWeight: '500',
  },
  calendarEventSeparator: {
    fontSize: 13,
    fontWeight: '700',
  },
  calendarEventParticipants: {
    fontSize: 13,
    fontWeight: '500',
  },
  // Planned Visits
  plannedVisitsSection: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 16,
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  badgeText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  plannedVisitsScroll: {
    marginTop: 8,
  },
  plannedVisitCard: {
    width: 200,
    borderRadius: 16,
    marginRight: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  plannedVisitImage: {
    width: '100%',
    height: 120,
    resizeMode: 'cover',
  },
  plannedVisitContent: {
    padding: 12,
  },
  plannedVisitName: {
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 8,
  },
  plannedVisitDateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  plannedVisitDate: {
    fontSize: 13,
    fontWeight: '500',
  },
  plannedVisitTimeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 12,
  },
  plannedVisitTime: {
    fontSize: 13,
    fontWeight: '500',
  },
  cancelButton: {
    borderWidth: 1,
    borderRadius: 8,
    paddingVertical: 6,
    paddingHorizontal: 12,
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 13,
    fontWeight: '600',
  },
});
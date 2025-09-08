import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  ScrollView,
  Image,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { ArrowLeft, MapPin, Clock, Users, Star, MessageCircle, Calendar, Share, Trash2, Edit } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { 
  useSharedValue, 
  useAnimatedStyle, 
  withSequence, 
  withTiming, 
  withRepeat,
  withDelay,
  interpolate,
  Extrapolate
} from 'react-native-reanimated';
import { useChat } from '@/contexts/ChatContext';
import { useAuth, useUser } from '@clerk/clerk-expo';
import { useTheme } from '@/contexts/ThemeContext';
import { useRole } from '../../hooks/useRole';
import ApiService, { BackendActivityDetail } from '@/services/api';
import ActivityAdapter from '@/services/activityAdapter';

export default function ActivityDetailScreen() {
  const { id } = useLocalSearchParams();
  const { } = useChat();
  const { getToken } = useAuth();
  const { user } = useUser();
  const { isAdmin } = useRole();
  const [isJoined, setIsJoined] = useState(false);
  const [activity, setActivity] = useState<any>(null);
  const [backendActivity, setBackendActivity] = useState<BackendActivityDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [registering, setRegistering] = useState(false);
  const { colors } = useTheme();
  
  const buttonScale = useSharedValue(1);
  const buttonRotation = useSharedValue(0);
  const glowAnimation = useSharedValue(0);
  const pulseAnimation = useSharedValue(1);

  // Récupérer les détails de l'activité depuis l'API
  useEffect(() => {
    const fetchActivity = async () => {
      if (!id || typeof id !== 'string') return;
      
      setLoading(true);
      setError(null);
      
      try {
        console.log('🌐 Calling API:', `${process.env.EXPO_PUBLIC_URL_BACKEND}/activities/${id}`);
        const backendData = await ApiService.getActivityById(id);
        console.log('📦 API Response:', JSON.stringify(backendData, null, 2));
        setBackendActivity(backendData);
        
        // Convertir les données backend vers le format frontend
        const convertedActivity = ActivityAdapter.backendToFrontend(backendData);
        console.log('🔄 Converted Activity:', JSON.stringify(convertedActivity, null, 2));
        setActivity(convertedActivity);
        
        // Vérifier si l'utilisateur est déjà inscrit
        if (user) {
          const token = await getToken();
          if (token) {
            try {
              const userActivities = await ApiService.getUserActivities(token);
              const isRegistered = userActivities.some((userActivity: any) => userActivity.id === id);
              setIsJoined(isRegistered);
            } catch (error) {
              console.log('Could not fetch user activities:', error);
            }
          }
        }
        
      } catch (error) {
        console.error('Error fetching activity:', error);
        setError(error instanceof Error ? error.message : 'Erreur lors du chargement de l\'activité');
      } finally {
        setLoading(false);
      }
    };

    fetchActivity();
  }, [id, user]);

  // Animation continue pour le bouton rejoindre
  useEffect(() => {
    if (isJoined) {
      // Animation de lueur
      glowAnimation.value = withRepeat(
        withSequence(
          withTiming(1, { duration: 1000 }),
          withTiming(0, { duration: 1000 })
        ),
        -1,
        false
      );
      
      // Animation de pulsation
      pulseAnimation.value = withRepeat(
        withSequence(
          withTiming(1.02, { duration: 1500 }),
          withTiming(1, { duration: 1500 })
        ),
        -1,
        false
      );
    }
  }, [isJoined]);

  const createPrivateChat = async () => {
    if (!user || !backendActivity) {
      Alert.alert('Connexion requise', 'Veuillez vous connecter pour contacter l\'organisateur');
      return;
    }

    try {
      const token = await getToken();
      if (!token) {
        Alert.alert('Erreur', 'Impossible de récupérer le token d\'authentification');
        return;
      }

      // Utiliser le service de chat pour créer un chat privé
      const chatService = (await import('@/services/chatService')).default;
      const { chatId } = await chatService.createPrivateChat(
        backendActivity.createdBy,
        token
      );

      Alert.alert(
        'Chat créé !',
        `Un chat privé avec l'organisateur a été créé.`,
        [
          { text: 'OK' },
          { 
            text: 'Accéder au chat', 
            onPress: () => router.push(`/chat/${chatId}?displayName=${encodeURIComponent(activity.organizer.name)}`)
          }
        ]
      );
    } catch (error) {
      console.error('Erreur création chat privé:', error);
      Alert.alert('Erreur', error instanceof Error ? error.message : 'Impossible de créer le chat privé');
    }
  };

  const handleJoinActivity = async () => {
    if (!user) {
      Alert.alert('Connexion requise', 'Veuillez vous connecter pour rejoindre cette activité');
      return;
    }

    if (!id || typeof id !== 'string') return;

    setRegistering(true);

    try {
      const token = await getToken();
      if (!token) {
        Alert.alert('Erreur', 'Impossible de récupérer le token d\'authentification');
        return;
      }

      // Appel API pour s'inscrire à l'activité
      await ApiService.registerToActivity(id, token);

      // Animation de vibration
      buttonScale.value = withSequence(
        withTiming(0.95, { duration: 100 }),
        withTiming(1.05, { duration: 100 }),
        withTiming(1, { duration: 100 })
      );
      
      buttonRotation.value = withSequence(
        withTiming(-2, { duration: 50 }),
        withTiming(2, { duration: 100 }),
        withTiming(-1, { duration: 50 }),
        withTiming(0, { duration: 50 })
      );
      
      setIsJoined(true);

      Alert.alert(
        'Inscription réussie !',
        'Vous êtes maintenant inscrit à cette activité. Un chat de groupe a été créé.',
        [
          { text: 'OK' },
          { 
            text: 'Accéder au chat', 
            onPress: () => router.push(`/chat/chat-${id}?displayName=${encodeURIComponent(activity.title)}`)
          }
        ]
      );
    } catch (error) {
      console.error('Error registering to activity:', error);
      Alert.alert(
        'Erreur',
        error instanceof Error ? error.message : 'Impossible de s\'inscrire à l\'activité'
      );
    } finally {
      setRegistering(false);
    }
  };

  const handleDeleteActivity = async () => {
    if (!user || !id || typeof id !== 'string') return;

    Alert.alert(
      'Supprimer l\'activité',
      'Êtes-vous sûr de vouloir supprimer définitivement cette activité ? Cette action est irréversible.',
      [
        { text: 'Annuler', style: 'cancel' },
        { 
          text: 'Supprimer', 
          style: 'destructive',
          onPress: async () => {
            setRegistering(true);
            try {
              const token = await getToken();
              if (!token) {
                Alert.alert('Erreur', 'Impossible de récupérer le token d\'authentification');
                return;
              }

              // Appel API pour supprimer l'activité
              const response = await fetch(`http://192.168.1.62:5000/api/activities/${id}`, {
                method: 'DELETE',
                headers: {
                  'Authorization': `Bearer ${token}`,
                },
              });

              if (!response.ok) {
                throw new Error('Erreur lors de la suppression de l\'activité');
              }
              
              Alert.alert('Suppression réussie', 'L\'activité a été supprimée avec succès.', [
                { text: 'OK', onPress: () => router.back() }
              ]);
            } catch (error) {
              console.error('Error deleting activity:', error);
              Alert.alert(
                'Erreur',
                error instanceof Error ? error.message : 'Impossible de supprimer l\'activité'
              );
            } finally {
              setRegistering(false);
            }
          }
        }
      ]
    );
  };

  const handleUnregisterActivity = async () => {
    if (!user || !id || typeof id !== 'string') return;

    Alert.alert(
      'Désinscription',
      'Êtes-vous sûr de vouloir vous désinscrire de cette activité ? Vous perdrez l\'accès au chat de groupe.',
      [
        { text: 'Annuler', style: 'cancel' },
        { 
          text: 'Se désinscrire', 
          style: 'destructive',
          onPress: async () => {
            setRegistering(true);
            try {
              const token = await getToken();
              if (!token) {
                Alert.alert('Erreur', 'Impossible de récupérer le token d\'authentification');
                return;
              }

              // Appel API pour se désinscrire
              await ApiService.unregisterFromActivity(id, token);
              
              setIsJoined(false);
              
              Alert.alert('Désinscription réussie', 'Vous avez été désinscrit de cette activité.');
            } catch (error) {
              console.error('Error unregistering from activity:', error);
              Alert.alert(
                'Erreur',
                error instanceof Error ? error.message : 'Impossible de se désinscrire de l\'activité'
              );
            } finally {
              setRegistering(false);
            }
          }
        }
      ]
    );
  };

  const openChat = () => {
    router.push(`/chat/chat-${activity.id}?displayName=${encodeURIComponent(activity.title)}`);
  };

  const handleEditActivity = () => {
    if (!backendActivity) return;
    router.push({
      pathname: '/create-activity',
      params: {
        editMode: 'true',
        activityId: backendActivity.id,
        activityData: JSON.stringify(backendActivity)
      }
    });
  };

  const animatedButtonStyle = useAnimatedStyle(() => {
    const glowOpacity = interpolate(
      glowAnimation.value,
      [0, 1],
      [0.3, 0.8],
      Extrapolate.CLAMP
    );
    
    return {
      transform: [
        { scale: buttonScale.value * pulseAnimation.value },
        { rotate: `${buttonRotation.value}deg` }
      ],
      shadowOpacity: glowOpacity,
    };
  });

  // Early return si pas d'activité pour éviter les erreurs de hooks
  if (loading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#8B5CF6" />
          <Text style={[styles.loadingText, { color: colors.textSecondary }]}>
            Chargement de l'activité...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error || !activity) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.errorContainer}>
          <Text style={[styles.errorText, { color: colors.textSecondary }]}>
            {error || 'Activité non trouvée'}
          </Text>
          <TouchableOpacity style={styles.errorBackButton}>
            <Text style={styles.backButtonText}>Retour</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={styles.imageContainer}>
        <Image source={{ uri: activity.image }} style={styles.activityImage} />
        
        <LinearGradient
          colors={['rgba(0,0,0,0.6)', 'transparent']}
          style={styles.headerOverlay}
        >
          <View style={styles.headerActions}>
            <TouchableOpacity style={[styles.headerButton, styles.backButton]} onPress={() => router.back()}>
              <ArrowLeft size={20} color="#FFFFFF" strokeWidth={2} />
            </TouchableOpacity>
            
            <View style={styles.rightActions}>
              {isAdmin && (
                <TouchableOpacity 
                  style={[styles.headerButton, styles.editButton]} 
                  onPress={handleEditActivity}
                >
                  <Edit size={20} color="#FFFFFF" strokeWidth={2} />
                </TouchableOpacity>
              )}
              {isAdmin && (
                <TouchableOpacity 
                  style={[styles.headerButton, styles.deleteButton]} 
                  onPress={handleDeleteActivity}
                >
                  <Trash2 size={22} color="#FFFFFF" strokeWidth={3} />
                </TouchableOpacity>
              )}
              <TouchableOpacity style={[styles.headerButton, styles.shareButton]} onPress={() => Alert.alert('Partage', 'Fonctionnalité prochainement disponible')}>
                <Share size={20} color="#FFFFFF" strokeWidth={2} />
              </TouchableOpacity>
            </View>
          </View>
        </LinearGradient>

        <LinearGradient
          colors={['transparent', 'rgba(0,0,0,0.8)']}
          style={styles.bottomOverlay}
        >
          <View style={styles.statusBadge}>
            <Text style={styles.statusText}>
              {activity.status === 'active' ? 'En cours' : activity.status === 'upcoming' ? 'Bientôt' : 'Terminé'}
            </Text>
          </View>
        </LinearGradient>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Title and Description */}
        <View style={styles.titleSection}>
          <Text style={[styles.activityTitle, { color: colors.text }]}>{activity.title}</Text>
          <Text style={[styles.activityDescription, { color: colors.textSecondary }]}>{activity.description}</Text>
        </View>

        {/* Quick Info */}
        <View style={[styles.quickInfo, { backgroundColor: colors.surface }]}>
          <View style={styles.infoItem}>
            <Calendar size={16} color="#667EEA" strokeWidth={2} />
            <Text style={[styles.infoText, { color: colors.text }]}>{activity.date}</Text>
          </View>
          <View style={styles.infoItem}>
            <Clock size={16} color="#667EEA" strokeWidth={2} />
            <Text style={[styles.infoText, { color: colors.text }]}>{activity.time}</Text>
          </View>
          <View style={styles.infoItem}>
            <MapPin size={16} color="#667EEA" strokeWidth={2} />
            <Text style={[styles.infoText, { color: colors.text }]}>{activity.location}</Text>
          </View>
          <View style={styles.infoItem}>
            <Users size={16} color="#667EEA" strokeWidth={2} />
            <Text style={[styles.infoText, { color: colors.text }]}>{activity.currentParticipants}/{activity.maxParticipants}</Text>
          </View>
        </View>

        {/* Organizer */}
        <View style={styles.organizerSection}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Organisateur</Text>
          <View style={[styles.organizerCard, { backgroundColor: colors.surface }]}>
            <Image source={{ uri: activity.organizer.avatar }} style={styles.organizerAvatar} />
            <View style={styles.organizerInfo}>
              <Text style={[styles.organizerName, { color: colors.text }]}>{activity.organizer.name}</Text>
              <View style={styles.ratingContainer}>
                <Star size={14} color="#FBBF24" fill="#FBBF24" />
                <Text style={[styles.ratingText, { color: colors.textSecondary }]}>{activity.organizer.rating}</Text>
              </View>
            </View>
            <TouchableOpacity 
              style={styles.contactButton}
              onPress={() => createPrivateChat()}
            >
              <Text style={styles.contactButtonText}>Contacter</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Details */}
        <View style={[styles.detailsSection, { backgroundColor: colors.surface }]}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Détails</Text>
          
          <View style={styles.detailItem}>
            <Text style={[styles.detailLabel, { color: colors.textSecondary }]}>Difficulté</Text>
            <View style={styles.difficultyBadge}>
              <Text style={styles.difficultyText}>{activity.difficulty}</Text>
            </View>
          </View>
          
          <View style={styles.detailItem}>
            <Text style={[styles.detailLabel, { color: colors.textSecondary }]}>Durée</Text>
            <Text style={[styles.detailValue, { color: colors.text }]}>{activity.duration}</Text>
          </View>
          
          <View style={styles.detailItem}>
            <Text style={[styles.detailLabel, { color: colors.textSecondary }]}>Point de rendez-vous</Text>
            <Text style={[styles.detailValue, { color: colors.text }]}>{activity.meetingPoint}</Text>
          </View>
          
          <View style={styles.detailItem}>
            <Text style={[styles.detailLabel, { color: colors.textSecondary }]}>Prix</Text>
            <Text style={styles.priceText}>
              {activity.price === 0 ? 'Gratuit' : `${activity.price}€`}
            </Text>
          </View>
        </View>

        {/* Requirements */}
        <View style={[styles.requirementsSection, { backgroundColor: colors.surface }]}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>À prévoir</Text>
          {activity.requirements?.map((requirement: string, index: number) => (
            <View key={index} style={styles.requirementItem}>
              <View style={styles.requirementDot} />
              <Text style={[styles.requirementText, { color: colors.text }]}>{requirement}</Text>
            </View>
          ))}
        </View>
      </ScrollView>

      {/* Bottom Actions */}
      <View style={styles.bottomActions}>
        <View style={[styles.floatingMenuContainer, { backgroundColor: 'rgba(40, 40, 40, 0.95)' }]}>
          {isJoined && (
            <>
              <TouchableOpacity style={styles.floatingMenuButton} onPress={openChat}>
                <MessageCircle size={20} color="#CCCCCC" strokeWidth={2} />
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.floatingMenuButton, styles.unregisterButton]}
                onPress={handleUnregisterActivity}
                disabled={registering}
              >
                {registering ? (
                  <ActivityIndicator size={16} color="#FF6B6B" />
                ) : (
                  <Text style={styles.unregisterIcon}>−</Text>
                )}
              </TouchableOpacity>
            </>
          )}
          
          {!isJoined && (
            <TouchableOpacity 
              style={[styles.floatingMenuButton, styles.activeFloatingButton]}
              onPress={handleJoinActivity}
              disabled={registering}
            >
              {registering ? (
                <ActivityIndicator size={16} color="#FFFFFF" />
              ) : (
                <Text style={styles.joinIcon}>+</Text>
              )}
            </TouchableOpacity>
          )}
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
  activityImage: {
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
  rightActions: {
    flexDirection: 'row',
    gap: 10,
  },
  headerButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.3)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  editButton: {
    backgroundColor: 'rgba(139, 92, 246, 0.9)',
    borderWidth: 2,
    borderColor: '#8B5CF6',
    shadowColor: '#8B5CF6',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.8,
    shadowRadius: 4,
    elevation: 8,
  },
  deleteButton: {
    backgroundColor: 'rgba(255,68,68,0.9)',
    borderWidth: 2,
    borderColor: '#FF4444',
    shadowColor: '#FF4444',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.8,
    shadowRadius: 4,
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
  statusBadge: {
    backgroundColor: 'rgba(0,0,0,0.6)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    alignSelf: 'flex-start',
  },
  statusText: {
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
  activityTitle: {
    fontSize: 28,
    fontWeight: '800',
    marginBottom: 8,
    lineHeight: 34,
  },
  activityDescription: {
    fontSize: 16,
    lineHeight: 24,
  },
  quickInfo: {
    backgroundColor: 'rgba(102, 126, 234, 0.05)',
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
    gap: 16,
    borderWidth: 1,
    borderColor: 'rgba(102, 126, 234, 0.1)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 4,
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
  organizerSection: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 16,
  },
  organizerCard: {
    borderRadius: 16,
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(102, 126, 234, 0.1)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 4,
  },
  organizerAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    marginRight: 16,
  },
  organizerInfo: {
    flex: 1,
  },
  organizerName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  ratingText: {
    fontSize: 14,
    fontWeight: '500',
  },
  contactButton: {
    backgroundColor: '#EEF2FF',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 12,
  },
  contactButtonText: {
    fontSize: 14,
    color: '#667EEA',
    fontWeight: '600',
  },
  detailsSection: {
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
  detailItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  detailLabel: {
    fontSize: 15,
    fontWeight: '500',
  },
  detailValue: {
    fontSize: 15,
    fontWeight: '600',
    textAlign: 'right',
    flex: 1,
    marginLeft: 16,
  },
  difficultyBadge: {
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  difficultyText: {
    fontSize: 12,
    color: '#F59E0B',
    fontWeight: '600',
  },
  priceText: {
    fontSize: 16,
    color: '#10B981',
    fontWeight: '700',
  },
  requirementsSection: {
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
  requirementItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    gap: 12,
  },
  requirementDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#667EEA',
  },
  requirementText: {
    fontSize: 15,
    fontWeight: '500',
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
  activeFloatingButton: {
    backgroundColor: '#8B5CF6',
  },
  joinIcon: {
    fontSize: 20,
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
  joinedIcon: {
    fontSize: 20,
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
  unregisterButton: {
    backgroundColor: '#FF6B6B',
  },
  unregisterIcon: {
    fontSize: 20,
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
  actionsContent: {
    alignItems: 'center',
    gap: 16,
  },
  chatButton: {
    width: '100%',
    backgroundColor: 'rgba(102, 126, 234, 0.1)',
    paddingVertical: 14,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(102, 126, 234, 0.3)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.1,
    shadowRadius: 16,
    elevation: 4,
  },
  chatButtonText: {
    fontSize: 15,
    color: '#667EEA',
    fontWeight: '700',
  },
  joinButton: {
    width: '80%',
    alignSelf: 'center',
    borderRadius: 20,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 8,
  },
  joinedButton: {
    opacity: 0.9,
  },
  joinTouchable: {
    width: '100%',
  },
  joinGradient: {
    paddingVertical: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  joinButtonText: {
    fontSize: 17,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 0.5,
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
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 20,
  },
  backButton: {
    backgroundColor: '#8B5CF6',
    shadowColor: '#8B5CF6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  errorBackButton: {
    backgroundColor: '#8B5CF6',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  backButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  shareButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
});
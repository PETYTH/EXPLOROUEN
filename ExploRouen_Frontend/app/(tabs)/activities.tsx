import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  ScrollView,
  Image,
  TextInput,
  RefreshControl,
  ActivityIndicator,
  Modal,
} from 'react-native';
import { router } from 'expo-router';
import { Heart, MapPin, Clock, Users, Filter, Search, Star, Calendar, MessageCircle, Plus, X, CalendarDays } from 'lucide-react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeInDown, FadeInRight } from 'react-native-reanimated';
import { useTheme } from '@/contexts/ThemeContext';
import ActivityAdapter from '@/services/activityAdapter';
import { Activity } from '@/data/activities';
import { useActivity } from '@/contexts/ActivityProvider';
import { useAuth, useUser } from '@clerk/clerk-expo';
import { useRole } from '../../hooks/useRole';
import registrationService, { RegistrationStatus } from '../../services/registrationService';
import { useChat } from '../../contexts/ChatContext';

export default function ActivitiesScreen() {
  const [searchQuery, setSearchQuery] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const [selectedType, setSelectedType] = useState<string | null>('all');
  const [frontendActivities, setFrontendActivities] = useState<Activity[]>([]);
  const [registrationStatuses, setRegistrationStatuses] = useState<Record<string, RegistrationStatus>>({});
  const [loadingRegistrations, setLoadingRegistrations] = useState<Record<string, boolean>>({});
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [selectedPeriod, setSelectedPeriod] = useState<string>('all');
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [datePickerType, setDatePickerType] = useState<'start' | 'end'>('start');
  const [startDate, setStartDate] = useState<Date | null>(null);
  const [endDate, setEndDate] = useState<Date | null>(null);
  const [showCustomPeriod, setShowCustomPeriod] = useState(false);
  
  const { colors } = useTheme();
  const { activities, isLoading: isLoadingActivities, error, refreshActivities } = useActivity();
  const { getToken } = useAuth();
  const { user } = useUser();
  const { isAdmin } = useRole();
  const { leaveChatRoom } = useChat();
  
  // Calculer les statistiques dynamiques
  const calculateStats = () => {
    const today = new Date().toDateString();
    const filteredByCategory = selectedType && selectedType !== 'all' 
      ? frontendActivities.filter(activity => activity.type === selectedType)
      : frontendActivities;
    
    const todayActivities = filteredByCategory.filter(activity => {
      const activityDate = new Date(activity.date).toDateString();
      return activityDate === today;
    }).length;
    
    const totalParticipants = filteredByCategory.reduce((sum, activity) => 
      sum + activity.currentParticipants, 0
    );
    
    const activitiesWithRating = filteredByCategory.filter(activity => 
      activity.organizer.rating && activity.organizer.rating > 0
    );
    const averageRating = activitiesWithRating.length > 0 
      ? activitiesWithRating.reduce((sum, activity) => sum + activity.organizer.rating, 0) / activitiesWithRating.length
      : 0;
    
    return {
      todayActivities,
      totalParticipants,
      averageRating
    };
  };
  
  const userStats = calculateStats();
  
  const refreshStats = () => {
    // Fonction vide pour éviter l'erreur
  };

  const activityTypes = [
    { id: 'all', label: 'Tous', color: '#8B5CF6' },
    { id: 'sport', label: 'Sport', color: '#10B981' },
    { id: 'cultural', label: 'Culture', color: '#F59E0B' },
    { id: 'easter-hunt', label: 'Chasse aux œufs', color: '#EC4899' },
  ];

  // Fonction pour obtenir la couleur selon le type d'activité
  const getActivityTypeColor = (type: string) => {
    switch (type) {
      case 'sport':
        return '#10B981'; // Vert
      case 'cultural':
        return '#F59E0B'; // Jaune
      case 'easter-hunt':
        return '#EC4899'; // Rose
      default:
        return '#8B5CF6';
    }
  };

  // Fonction pour obtenir la couleur selon la catégorie
  const getCategoryColor = (category: string) => {
    switch (category.toLowerCase()) {
      case 'running':
        return '#10B981'; // Vert sport
      case 'culture':
        return '#F59E0B'; // Orange culture
      case 'jeu':
        return '#EC4899'; // Rose chasse aux œufs
      case 'bien-être':
        return '#10B981'; // Vert sport
      case 'sport':
        return '#10B981'; // Vert sport
      default:
        return '#667EEA'; // Bleu toutes
    }
  };

  // Fonction pour obtenir le titre dynamique selon la catégorie
  const getSectionTitle = () => {
    if (!selectedType || selectedType === 'all') {
      return 'Toutes les activités';
    }
    switch (selectedType) {
      case 'sport':
        return 'Activités sportives';
      case 'cultural':
        return 'Activités culturelles';
      case 'easter-hunt':
        return 'Chasses aux œufs';
      default:
        return 'Toutes les activités';
    }
  };

  // Convertir les activités backend en format frontend
  useEffect(() => {
    if (activities && activities.length > 0) {
      // Trier par date de création (plus récent en premier)
      const sortedActivities = [...activities].sort((a, b) => 
        new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime()
      );
      const converted = sortedActivities.map(activity => ActivityAdapter.backendToFrontend(activity));
      setFrontendActivities(converted);
      // Charger les statuts d'inscription pour chaque activité
      loadRegistrationStatuses(converted);
    } else {
      setFrontendActivities([]);
    }
  }, [activities]);

  // Charger les statuts d'inscription
  const loadRegistrationStatuses = async (activitiesList: Activity[]) => {
    try {
      const token = await getToken();
      if (!token) return;

      const statuses: Record<string, RegistrationStatus> = {};
      
      await Promise.all(
        activitiesList.map(async (activity) => {
          try {
            const status = await registrationService.checkRegistrationStatus(activity.id, token);
            statuses[activity.id] = status;
          } catch (error) {
            console.error(`Erreur statut inscription ${activity.id}:`, error);
            statuses[activity.id] = { isRegistered: false };
          }
        })
      );

      setRegistrationStatuses(statuses);
    } catch (error) {
      console.error('Erreur chargement statuts inscription:', error);
    }
  };

  // Gérer l'inscription/désinscription
  const handleRegistration = async (activityId: string, isCurrentlyRegistered: boolean) => {
    try {
      const token = await getToken();
      if (!token) {
        console.error('Token non disponible');
        return;
      }

      setLoadingRegistrations(prev => ({ ...prev, [activityId]: true }));

      if (isCurrentlyRegistered) {
        await registrationService.unregisterFromActivity(activityId, token);
        setRegistrationStatuses(prev => ({
          ...prev,
          [activityId]: { isRegistered: false }
        }));
        
        // Supprimer le chat de la page messages lors de la désinscription
        const chatRoomId = `chat-${activityId}`;
        leaveChatRoom(chatRoomId, user?.id || '');
      } else {
        const newStatus = await registrationService.registerToActivity(activityId, token);
        setRegistrationStatuses(prev => ({
          ...prev,
          [activityId]: newStatus
        }));
      }
    } catch (error) {
      console.error('Erreur inscription/désinscription:', error);
    } finally {
      setLoadingRegistrations(prev => ({ ...prev, [activityId]: false }));
    }
  };

  const filteredActivities = frontendActivities.filter((activity: Activity) => {
    const matchesSearch = activity.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         activity.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesType = !selectedType || selectedType === 'all' || activity.type === selectedType;
    
    // Filtrage par période
    let matchesPeriod = true;
    if (selectedPeriod !== 'all') {
      const activityDate = new Date(activity.date);
      const today = new Date();
      
      switch (selectedPeriod) {
        case 'today':
          matchesPeriod = activityDate.toDateString() === today.toDateString();
          break;
        case 'week':
          const weekStart = new Date(today);
          weekStart.setDate(today.getDate() - today.getDay());
          const weekEnd = new Date(weekStart);
          weekEnd.setDate(weekStart.getDate() + 6);
          matchesPeriod = activityDate >= weekStart && activityDate <= weekEnd;
          break;
        case 'month':
          matchesPeriod = activityDate.getMonth() === today.getMonth() && 
                         activityDate.getFullYear() === today.getFullYear();
          break;
        case 'custom':
          if (startDate && endDate) {
            const start = new Date(startDate);
            const end = new Date(endDate);
            start.setHours(0, 0, 0, 0);
            end.setHours(23, 59, 59, 999);
            matchesPeriod = activityDate >= start && activityDate <= end;
          } else if (startDate) {
            const start = new Date(startDate);
            start.setHours(0, 0, 0, 0);
            matchesPeriod = activityDate >= start;
          }
          break;
      }
    }
    
    return matchesSearch && matchesType && matchesPeriod;
  });

  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.all([
      refreshActivities(),
      refreshStats()
    ]);
    setRefreshing(false);
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <Animated.View entering={FadeInDown.delay(100)} style={[styles.header, { backgroundColor: colors.background }]}>
        <View style={styles.headerTop}>
          <Text style={[styles.headerTitle, { color: colors.text }]}>Activités</Text>
          {isAdmin && (
            <TouchableOpacity 
              style={[styles.modernCreateButton, { backgroundColor: '#8B5CF6' }]}
              onPress={() => router.push('/create-activity')}
            >
              <Plus size={20} color="#FFFFFF" strokeWidth={2.5} />
            </TouchableOpacity>
          )}
        </View>

        {/* Search Bar */}
        <View style={[styles.searchContainer, { backgroundColor: colors.surface }]}>
          <Search size={18} color={colors.textSecondary} strokeWidth={2} />
          <TextInput
            style={[styles.searchInput, { color: colors.text }]}
            placeholder="Rechercher une activité..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholderTextColor={colors.textSecondary}
          />
          <TouchableOpacity 
            style={styles.filterButton}
            onPress={() => setShowFilterModal(true)}
          >
            <Filter size={18} color={colors.textSecondary} strokeWidth={2} />
          </TouchableOpacity>
        </View>
      </Animated.View>

      {/* Categories */}
      <Animated.View entering={FadeInDown.delay(200)} style={styles.categoriesSection}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoriesScroll}>
          {activityTypes.map((type) => (
            <TouchableOpacity
              key={type.id}
              style={[
                styles.categoryButton,
                { backgroundColor: colors.surface },
                selectedType === type.id && { backgroundColor: type.color }
              ]}
              onPress={() => setSelectedType(selectedType === type.id ? null : type.id)}
            >
              <Text style={[
                styles.categoryText,
                { color: colors.textSecondary },
                selectedType === type.id && { color: '#FFFFFF' }
              ]}>
                {type.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </Animated.View>

      {/* Quick Stats */}
      <Animated.View entering={FadeInDown.delay(300)} style={styles.statsSection}>
        <View style={styles.statsGrid}>
          <View style={[styles.statCard, { backgroundColor: colors.surface }]}>
            <Calendar size={20} color="#667EEA" strokeWidth={2} />
            <Text style={[styles.statNumber, { color: colors.text }]}>
              {userStats.todayActivities}
            </Text>
            <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Aujourd'hui</Text>
          </View>
          
          <View style={[styles.statCard, { backgroundColor: colors.surface }]}>
            <Users size={20} color="#10B981" strokeWidth={2} />
            <Text style={[styles.statNumber, { color: colors.text }]}>
              {userStats.totalParticipants}
            </Text>
            <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Participants</Text>
          </View>
          
          <View style={[styles.statCard, { backgroundColor: colors.surface }]}>
            <Star size={20} color="#F59E0B" strokeWidth={2} />
            <Text style={[styles.statNumber, { color: colors.text }]}>
              {userStats.averageRating.toFixed(1)}
            </Text>
            <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Note moy.</Text>
          </View>
        </View>
      </Animated.View>

      {/* Activities List */}
      <ScrollView 
        style={styles.content} 
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        <View style={styles.activitiesSection}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>{getSectionTitle()}</Text>
            </View>
          
          {error ? (
            <View style={styles.errorContainer}>
              <Text style={[styles.errorText, { color: colors.textSecondary }]}>
                {error}
              </Text>
              <TouchableOpacity 
                style={styles.retryButton}
                onPress={refreshActivities}
              >
                <Text style={styles.retryButtonText}>Réessayer</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <>
              {isLoadingActivities && (
                <View style={styles.loadingContainer}>
                  <ActivityIndicator size="large" color="#8B5CF6" />
                  <Text style={[styles.loadingText, { color: colors.textSecondary }]}>
                    Chargement des activités...
                  </Text>
                </View>
              )}
              
              {!isLoadingActivities && filteredActivities.length === 0 ? (
                <View style={styles.noResultsContainer}>
                  <Text style={[styles.noResultsTitle, { color: colors.text }]}>Aucun résultat</Text>
                  <Text style={[styles.noResultsText, { color: colors.textSecondary }]}>
                    Aucune activité ne correspond à vos critères de recherche.
                  </Text>
                  {selectedPeriod !== 'all' && (
                    <TouchableOpacity 
                      style={[styles.resetFilterButton, { backgroundColor: '#8B5CF6' }]}
                      onPress={() => {
                        setSelectedPeriod('all');
                        setStartDate(null);
                        setEndDate(null);
                      }}
                    >
                      <Text style={styles.resetFilterText}>Voir toutes les périodes</Text>
                    </TouchableOpacity>
                  )}
                </View>
              ) : !isLoadingActivities && (
                <View style={styles.activitiesList}>
                  {filteredActivities.map((activity: Activity, index: number) => (
                <Animated.View 
                  key={activity.id}
                  entering={FadeInDown.delay(400 + index * 100)}
                >
                  <TouchableOpacity
                    style={[styles.activityCard, styles.enhancedActivityCard, { backgroundColor: colors.surface }]}
                    onPress={() => router.push(`/activity/${activity.id}`)}
                  >
                  <View style={styles.imageContainer}>
                    <Image source={{ uri: activity.image }} style={styles.activityImage} />
                    <LinearGradient
                      colors={['transparent', 'rgba(0,0,0,0.3)']}
                      style={styles.imageOverlay}
                    >
                      <View style={[styles.statusBadge, styles.statusBadgeRight, { 
                        backgroundColor: getActivityTypeColor(activity.type)
                      }]}>
                        <Text style={styles.statusText}>
                          {activity.status === 'active' ? 'En cours' : 
                           activity.status === 'upcoming' ? 'Bientôt' : 'Terminé'}
                        </Text>
                      </View>
                    </LinearGradient>
                  </View>
                  <View style={styles.activityContent}>
                    <View style={styles.activityHeader}>
                      <Text style={[styles.activityTitle, { color: colors.text }]} numberOfLines={2}>
                        {activity.title}
                      </Text>
                    </View>
                    
                    <Text style={[styles.activityDescription, { color: colors.textSecondary }]} numberOfLines={2}>
                      {activity.description}
                    </Text>
                    
                    <View style={styles.activityMeta}>
                      <View style={styles.activityMetaItem}>
                        <Text style={[styles.activityMetaText, { color: colors.textSecondary }]}>{activity.date}</Text>
                      </View>
                      <View style={styles.activityMetaItem}>
                        <Text style={[styles.activityMetaText, { color: colors.textSecondary }]}>{activity.duration}</Text>
                      </View>
                      <View style={styles.activityMetaItem}>
                        <Text style={[styles.activityMetaText, { color: colors.textSecondary }]}>
                          {activity.currentParticipants}/{activity.maxParticipants} participants
                        </Text>
                      </View>
                    </View>

                    <View style={styles.activityFooter}>
                      <View style={styles.organizerInfo}>
                        <Image source={{ uri: activity.organizer.avatar }} style={styles.organizerAvatar} />
                        <Text style={[styles.organizerName, { color: colors.text }]}>{activity.organizer.name}</Text>
                        <Text style={[styles.priceText, { color: colors.primary }]}>
                          {activity.price === 0 ? 'Gratuit' : `${activity.price}€`}
                        </Text>
                      </View>
                      <View style={styles.activityActions}>
                        {registrationStatuses[activity.id]?.isRegistered ? (
                          <View style={styles.registeredActions}>
                            <TouchableOpacity
                              style={[styles.chatButton, { backgroundColor: '#8B5CF6' }]}
                              onPress={() => router.push(`/chat/chat-${activity.id}?displayName=${encodeURIComponent(activity.title)}`)}
                            >
                              <MessageCircle size={14} color="#FFFFFF" strokeWidth={2} />
                              <Text style={styles.chatButtonText}>Chat</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                              style={[styles.unregisterButton, { backgroundColor: '#F3F4F6', borderColor: '#E5E7EB' }]}
                              onPress={() => handleRegistration(activity.id, true)}
                              disabled={loadingRegistrations[activity.id]}
                            >
                              {loadingRegistrations[activity.id] ? (
                                <ActivityIndicator size={14} color="#6B7280" />
                              ) : (
                                <Text style={[styles.unregisterButtonText, { color: '#6B7280' }]}>Se désinscrire</Text>
                              )}
                            </TouchableOpacity>
                          </View>
                        ) : (
                          <TouchableOpacity
                            style={[styles.registerButton, { backgroundColor: '#8B5CF6' }]}
                            onPress={() => handleRegistration(activity.id, false)}
                            disabled={loadingRegistrations[activity.id]}
                          >
                            {loadingRegistrations[activity.id] ? (
                              <ActivityIndicator size={16} color="#FFFFFF" />
                            ) : (
                              <Text style={styles.registerButtonText}>Rejoindre</Text>
                            )}
                          </TouchableOpacity>
                        )}
                      </View>
                    </View>
                  </View>
                </TouchableOpacity>
              </Animated.View>
            ))}
                </View>
              )}
            </>
          )}
        </View>

        <View style={styles.bottomSpacing} />
      </ScrollView>
      
      {/* Filter Modal */}
      <Modal
        visible={showFilterModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowFilterModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.surface }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>Filtrer par période</Text>
              <TouchableOpacity 
                style={[styles.closeButton, { backgroundColor: '#8B5CF6' }]}
                onPress={() => setShowFilterModal(false)}
              >
                <X size={20} color="#FFFFFF" strokeWidth={2} />
              </TouchableOpacity>
            </View>
            
            <ScrollView style={styles.periodOptions} showsVerticalScrollIndicator={false} contentContainerStyle={{ gap: 12 }}>
              {[
                { id: 'all', label: 'Toutes les périodes' },
                { id: 'today', label: "Aujourd'hui" },
                { id: 'week', label: 'Cette semaine' },
                { id: 'month', label: 'Ce mois' },
                { id: 'custom', label: 'Période personnalisée' },
              ].map((period) => (
                <TouchableOpacity
                  key={period.id}
                  style={[
                    styles.periodOption,
                    { backgroundColor: colors.background },
                    selectedPeriod === period.id && { backgroundColor: '#8B5CF6' }
                  ]}
                  onPress={() => {
                    if (period.id === 'custom') {
                      setSelectedPeriod('custom');
                      setShowCustomPeriod(true);
                    } else {
                      setSelectedPeriod(period.id);
                      setStartDate(null);
                      setEndDate(null);
                      setShowCustomPeriod(false);
                      setShowFilterModal(false);
                    }
                  }}
                >
                  <View style={styles.periodOptionContent}>
                    <Text style={[
                      styles.periodOptionText,
                      { color: colors.text },
                      selectedPeriod === period.id && { color: '#FFFFFF' }
                    ]}>
                      {period.id === 'custom' && (startDate || endDate) 
                        ? `${startDate?.toLocaleDateString('fr-FR') || '...'} - ${endDate?.toLocaleDateString('fr-FR') || '...'}` 
                        : period.label}
                    </Text>
                    {period.id === 'custom' && (
                      <CalendarDays 
                        size={16} 
                        color={selectedPeriod === period.id ? '#FFFFFF' : colors.textSecondary} 
                      />
                    )}
                  </View>
                </TouchableOpacity>
              ))}
              
              {/* Champs de période personnalisée */}
              {selectedPeriod === 'custom' && (
                <View style={styles.customPeriodContainer}>
                  <Text style={[styles.customPeriodTitle, { color: colors.text }]}>Sélectionner une période</Text>
                  
                  <View style={styles.dateFieldsContainer}>
                    <View style={styles.dateField}>
                      <Text style={[styles.dateFieldLabel, { color: colors.textSecondary }]}>Début</Text>
                      <TouchableOpacity 
                        style={[styles.dateFieldButton, { backgroundColor: colors.background, borderColor: colors.border }]}
                        onPress={() => {
                          setShowFilterModal(false);
                          setTimeout(() => {
                            setDatePickerType('start');
                            setShowDatePicker(true);
                          }, 300);
                        }}
                      >
                        <Text style={[styles.dateFieldText, { color: startDate ? colors.text : colors.textSecondary }]}>
                          {startDate ? startDate.toLocaleDateString('fr-FR') : 'Sélectionner'}
                        </Text>
                        <CalendarDays size={16} color={colors.textSecondary} />
                      </TouchableOpacity>
                    </View>
                    
                    <View style={styles.dateField}>
                      <Text style={[styles.dateFieldLabel, { color: colors.textSecondary }]}>Fin</Text>
                      <TouchableOpacity 
                        style={[styles.dateFieldButton, { backgroundColor: colors.background, borderColor: colors.border }]}
                        onPress={() => {
                          setShowFilterModal(false);
                          setTimeout(() => {
                            setDatePickerType('end');
                            setShowDatePicker(true);
                          }, 300);
                        }}
                      >
                        <Text style={[styles.dateFieldText, { color: endDate ? colors.text : colors.textSecondary }]}>
                          {endDate ? endDate.toLocaleDateString('fr-FR') : 'Sélectionner'}
                        </Text>
                        <CalendarDays size={16} color={colors.textSecondary} />
                      </TouchableOpacity>
                    </View>
                  </View>
                  
                  <View style={styles.customPeriodActions}>
                    <TouchableOpacity 
                      style={[styles.cancelButton, { backgroundColor: colors.background, borderColor: colors.border }]}
                      onPress={() => {
                        setSelectedPeriod('all');
                        setStartDate(null);
                        setEndDate(null);
                        setShowFilterModal(false);
                      }}
                    >
                      <Text style={[styles.cancelButtonText, { color: colors.textSecondary }]}>Annuler</Text>
                    </TouchableOpacity>
                    
                    <TouchableOpacity 
                      style={[styles.applyButton, { backgroundColor: '#8B5CF6' }]}
                      onPress={() => {
                        if (startDate || endDate) {
                          setSelectedPeriod('custom');
                          setShowCustomPeriod(false);
                          setShowFilterModal(false);
                        }
                      }}
                      disabled={!startDate && !endDate}
                    >
                      <Text style={styles.applyButtonText}>Appliquer</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>
      
      {/* Date Picker avec position absolue au centre */}
      {showDatePicker && (
        <View style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 999999
        }}>
          <View style={{
            backgroundColor: colors.background,
            borderRadius: 20,
            padding: 20,
            margin: 20,
            minWidth: 300
          }}>
            <Text style={{
              fontSize: 18,
              fontWeight: 'bold',
              marginBottom: 20,
              textAlign: 'center',
              color: colors.text
            }}>
              {datePickerType === 'start' ? 'Date de début' : 'Date de fin'}
            </Text>
            
            <DateTimePicker
              value={(datePickerType === 'start' ? startDate : endDate) || new Date()}
              mode="date"
              display="spinner"
              onChange={(event, date) => {
                if (date) {
                  if (datePickerType === 'start') {
                    setStartDate(date);
                  } else {
                    setEndDate(date);
                  }
                }
              }}
              style={{ alignSelf: 'center' }}
            />
            
            <View style={{
              flexDirection: 'row',
              justifyContent: 'space-around',
              marginTop: 20
            }}>
              <TouchableOpacity
                style={{
                  backgroundColor: colors.border,
                  paddingHorizontal: 20,
                  paddingVertical: 10,
                  borderRadius: 10,
                  minWidth: 80
                }}
                onPress={() => setShowDatePicker(false)}
              >
                <Text style={{
                  color: colors.text,
                  textAlign: 'center',
                  fontWeight: '600'
                }}>
                  Annuler
                </Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={{
                  backgroundColor: '#8B5CF6',
                  paddingHorizontal: 20,
                  paddingVertical: 10,
                  borderRadius: 10,
                  minWidth: 80
                }}
                onPress={() => {
                  setShowDatePicker(false);
                  setTimeout(() => {
                    setShowFilterModal(true);
                  }, 300);
                }}
              >
                <Text style={{
                  color: 'white',
                  textAlign: 'center',
                  fontWeight: '600'
                }}>
                  OK
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      )}
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
    marginBottom: 20,
  },
  headerTitle: {
    fontSize: 32,
    fontWeight: '700',
  },
  createButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modernCreateButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#8B5CF6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    fontWeight: '500',
  },
  filterButton: {
    padding: 4,
  },
  categoriesSection: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  categoriesScroll: {
    paddingVertical: 4,
  },
  categoryButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 8,
  },
  categoryText: {
    fontSize: 14,
    fontWeight: '600',
  },
  statsSection: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  statsGrid: {
    flexDirection: 'row',
    gap: 12,
  },
  statCard: {
    flex: 1,
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    gap: 8,
  },
  statNumber: {
    fontSize: 18,
    fontWeight: '800',
  },
  statLabel: {
    fontSize: 12,
    fontWeight: '500',
    textAlign: 'center',
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  activitiesSection: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  viewAllText: {
    fontSize: 14,
    color: '#667EEA',
    fontWeight: '600',
  },
  activitiesList: {
    gap: 16,
  },
  activityCard: {
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  enhancedActivityCard: {
    shadowColor: '#667EEA',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 6,
    padding: 12,
  },
  imageContainer: {
    position: 'relative',
    marginBottom: 12,
  },
  activityImage: {
    width: '100%',
    height: 120,
    borderRadius: 12,
    resizeMode: 'cover',
  },
  imageOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 60,
    borderBottomLeftRadius: 12,
    borderBottomRightRadius: 12,
    justifyContent: 'flex-end',
    paddingHorizontal: 12,
    paddingBottom: 8,
  },
  activityContent: {
    gap: 8,
  },
  activityHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 12,
  },
  activityTitle: {
    fontSize: 16,
    fontWeight: '700',
    lineHeight: 22,
    flex: 1,
  },
  statusBadge: {
    position: 'absolute',
    top: 12,
    left: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    backgroundColor: 'rgba(0,0,0,0.6)',
  },
  statusBadgeRight: {
    left: 'auto',
    right: 12,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  activityDescription: {
    fontSize: 14,
    lineHeight: 20,
  },
  activityMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    marginTop: 4,
  },
  activityMetaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  activityMetaText: {
    fontSize: 12,
    fontWeight: '500',
  },
  activityFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(107, 114, 128, 0.1)',
  },
  organizerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  organizerAvatar: {
    width: 24,
    height: 24,
    borderRadius: 12,
  },
  organizerName: {
    fontSize: 13,
    fontWeight: '600',
  },
  priceText: {
    fontSize: 14,
    fontWeight: '700',
  },
  bottomSpacing: {
    height: 100,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    fontWeight: '500',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
  },
  errorText: {
    fontSize: 16,
    fontWeight: '500',
    textAlign: 'center',
    marginBottom: 16,
  },
  retryButton: {
    backgroundColor: '#8B5CF6',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  activityActions: {
    flexDirection: 'column',
    alignItems: 'flex-end',
    gap: 8,
  },
  registeredActions: {
    flexDirection: 'column',
    alignItems: 'flex-end',
    gap: 6,
  },
  chatButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 6,
    shadowColor: '#8B5CF6',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  chatButtonText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  registerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    gap: 6,
    shadowColor: '#8B5CF6',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  registerButtonText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
  unregisterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1.5,
    gap: 4,
  },
  unregisterButtonText: {
    fontSize: 11,
    fontWeight: '600',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  periodOptions: {
    gap: 12,
    paddingBottom: 20,
  },
  periodOption: {
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  periodOptionText: {
    fontSize: 16,
    fontWeight: '600',
  },
  periodOptionContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  noResultsContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
    paddingHorizontal: 20,
  },
  noResultsTitle: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 8,
  },
  noResultsText: {
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 20,
  },
  resetFilterButton: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 24,
  },
  resetFilterText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  customPeriodContainer: {
    marginTop: 20,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(139, 92, 246, 0.2)',
  },
  customPeriodTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 16,
  },
  dateFieldsContainer: {
    gap: 12,
  },
  dateField: {
    gap: 8,
  },
  dateFieldLabel: {
    fontSize: 14,
    fontWeight: '500',
  },
  dateFieldButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
  },
  dateFieldText: {
    fontSize: 16,
    fontWeight: '500',
  },
  customPeriodActions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 16,
  },
  cancelButton: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  applyButton: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  applyButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
});


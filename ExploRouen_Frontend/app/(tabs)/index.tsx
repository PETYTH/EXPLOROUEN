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
  ActivityIndicator,
  Alert,
  TextInput,
} from 'react-native';
import { router } from 'expo-router';
import { MapPin, Clock, Users, Calendar, MessageCircle, Plus, Sun, Moon, Bell, Search } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeInDown, FadeInRight } from 'react-native-reanimated';
import { useTheme } from '@/contexts/ThemeContext';
import { useUser, useAuth } from '@clerk/clerk-expo';
import { useActivity } from '@/contexts/ActivityProvider';
import ApiService from '@/services/api';
import { useRole } from '../../hooks/useRole';
import StarRating from '@/components/StarRating';
import CookieConsent from '@/components/CookieConsent';

export default function HomeScreen() {
  const [searchQuery, setSearchQuery] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [topActivities, setTopActivities] = useState<any[]>([]);
  const [monuments, setMonuments] = useState<any[]>([]);
  const [userStats, setUserStats] = useState<any | null>(null);
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [showSearchResults, setShowSearchResults] = useState(false);
  const { user } = useUser();
  const { getToken } = useAuth();
  const { isDark, toggleTheme, colors } = useTheme();

  const loadData = async () => {
    try {
      setLoading(true);
      const token = await getToken();
      
      // Charger les activités les mieux notées (top 3)
      const allActivities = await ApiService.getActivities({}, token || undefined);
      const sortedActivities = allActivities
        .filter(activity => activity.organizerRating && activity.organizerRating > 0)
        .sort((a, b) => (b.organizerRating || 0) - (a.organizerRating || 0))
        .slice(0, 3);
      setTopActivities(sortedActivities);
      
      // Charger les monuments depuis l'API monuments
      const monumentsData = await ApiService.getMonuments();
      setMonuments(monumentsData.slice(0, 5));
      
      // Charger les stats utilisateur si connecté
      if (token) {
        const stats = await ApiService.getUserStats(token);
        setUserStats(stats);
      }
      
    } catch (error: any) {
      console.error('Erreur lors du chargement des données:', error);
      if (error.message === 'Network request failed' || !error.status) {
        router.replace('/connection-error');
        return;
      }
      Alert.alert('Erreur', 'Impossible de charger les données');
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const handleSearch = async (query: string) => {
    setSearchQuery(query);
    
    if (query.trim().length < 2) {
      setShowSearchResults(false);
      setSearchResults([]);
      return;
    }
    
    try {
      const token = await getToken();
      const [activities, monuments] = await Promise.all([
        ApiService.getActivities({ search: query }, token || undefined),
        ApiService.getMonuments()
      ]);
      
      // Filtrer les monuments par nom si recherche
      const filteredMonuments = monuments.filter(m => 
        m.name.toLowerCase().includes(query.toLowerCase()) ||
        m.description.toLowerCase().includes(query.toLowerCase())
      );
      
      const combined = [...activities.slice(0, 3), ...filteredMonuments.slice(0, 3)];
      setSearchResults(combined);
      setShowSearchResults(true);
    } catch (error) {
      console.error('Erreur de recherche:', error);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        {/* Header fixe pendant le chargement */}
        <Animated.View entering={FadeInDown.delay(100)} style={[styles.header, { backgroundColor: colors.background }]}>
          <View style={styles.headerTop}>
            <View style={styles.greeting}>
              <Text style={[styles.greetingText, { color: colors.text }]}>Bonjour,</Text>
              <Text style={[styles.userName, { color: colors.textSecondary }]}>{user?.fullName || user?.firstName || 'Explorateur'}</Text>
            </View>
            <View style={styles.headerButtons}>
              <TouchableOpacity style={[styles.themeButton, { backgroundColor: '#8B5CF6' }]} onPress={toggleTheme}>
                {isDark ? (
                  <Sun size={20} color="#FFFFFF" strokeWidth={2} />
                ) : (
                  <Moon size={20} color="#FFFFFF" strokeWidth={2} />
                )}
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.moreButton, { backgroundColor: '#8B5CF6' }]}
                onPress={() => Alert.alert('Fonctionnalité bientôt disponible', 'Les notifications seront disponibles dans une prochaine mise à jour !')}
              >
                <Bell size={24} color="#FFFFFF" strokeWidth={2} />
              </TouchableOpacity>
            </View>
          </View>
          
          <View style={styles.searchWrapper}>
            <View style={[styles.searchContainer, { backgroundColor: colors.surface }]}>
              <Search size={20} color="#9CA3AF" strokeWidth={2} />
              <TextInput
                style={[styles.searchInput, { color: colors.text }]}
                placeholder="Rechercher monuments, activités..."
                placeholderTextColor="#9CA3AF"
                editable={false}
              />
            </View>
          </View>
        </Animated.View>

        {/* Indicateur de chargement centré */}
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#8B5CF6" />
          <Text style={[styles.loadingText, { color: colors.text }]}>Chargement...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header fixe */}
      <Animated.View entering={FadeInDown.delay(100)} style={[styles.header, { backgroundColor: colors.background }]}>
        <View style={styles.headerTop}>
          <View style={styles.greeting}>
            <Text style={[styles.greetingText, { color: colors.text }]}>Bonjour,</Text>
            <Text style={[styles.userName, { color: colors.textSecondary }]}>{user?.fullName || user?.firstName || 'Explorateur'}</Text>
          </View>
          <View style={styles.headerButtons}>
            <TouchableOpacity style={[styles.themeButton, { backgroundColor: '#8B5CF6' }]} onPress={toggleTheme}>
              {isDark ? (
                <Sun size={20} color="#FFFFFF" strokeWidth={2} />
              ) : (
                <Moon size={20} color="#FFFFFF" strokeWidth={2} />
              )}
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.moreButton, { backgroundColor: '#8B5CF6' }]}
              onPress={() => Alert.alert('Fonctionnalité bientôt disponible', 'Les notifications seront disponibles dans une prochaine mise à jour !')}
            >
              <Bell size={24} color="#FFFFFF" strokeWidth={2} />
            </TouchableOpacity>
          </View>
        </View>
        
        <View style={styles.searchWrapper}>
          <View style={[styles.searchContainer, { backgroundColor: colors.surface }]}>
            <Search size={20} color="#9CA3AF" strokeWidth={2} />
            <TextInput
              style={[styles.searchInput, { color: colors.text }]}
              placeholder="Rechercher monuments, activités..."
              placeholderTextColor="#9CA3AF"
              value={searchQuery}
              onChangeText={handleSearch}
            />
          </View>
          
          {showSearchResults && searchResults.length > 0 && (
            <View style={[styles.searchResults, { backgroundColor: colors.surface }]}>
              {searchResults.map((item, index) => {
                const isActivity = 'duration' in item;
                return (
                  <TouchableOpacity
                    key={`${isActivity ? 'activity' : 'monument'}-${item.id}`}
                    style={styles.searchResultItem}
                    onPress={() => {
                      setShowSearchResults(false);
                      setSearchQuery('');
                      router.push(isActivity ? `/activity/${item.id}` : `/monument/${item.id}`);
                    }}
                  >
                    <Text style={[styles.searchResultTitle, { color: colors.text }]}>
                      {isActivity ? (item as any).title : item.name}
                    </Text>
                    <Text style={[styles.searchResultType, { color: colors.textSecondary }]}>
                      {isActivity ? 'Activité' : 'Monument'}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          )}
        </View>
      </Animated.View>

      {/* Contenu scrollable */}
      <ScrollView
        style={styles.scrollContainer}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        <View style={styles.content}>
          {/* Votre progression */}
          <Animated.View entering={FadeInDown.delay(200)} style={styles.progressSection}>
            <View style={[styles.progressCard, { backgroundColor: colors.surface }]}>
              <View style={styles.progressContent}>
                <View>
                  <Text style={[styles.progressTitle, { color: colors.text }]}>Votre progression</Text>
                  <Text style={[styles.progressSubtitle, { color: colors.textSecondary }]}>Découvrez le patrimoine de Rouen</Text>
                </View>
                
                <View style={styles.progressStats}>
                  <View style={styles.progressStat}>
                    <View style={[
                      styles.progressNumberContainer,
                      (userStats?.monumentsVisited || 0) > 0 && styles.progressNumberContainerActive
                    ]}>
                      <Text style={[
                        styles.progressNumber,
                        (userStats?.monumentsVisited || 0) > 0 ? styles.progressNumberActive : { color: colors.text }
                      ]}>
                        {userStats?.monumentsVisited || 0}
                      </Text>
                    </View>
                    <Text style={[
                      styles.progressLabel,
                      (userStats?.monumentsVisited || 0) > 0 ? styles.progressLabelActive : { color: colors.textSecondary }
                    ]}>Monuments visités</Text>
                  </View>
                  <View style={styles.progressStat}>
                    <View style={[
                      styles.progressNumberContainer,
                      (userStats?.easterEggs || 0) > 0 && styles.progressNumberContainerActive
                    ]}>
                      <Text style={[
                        styles.progressNumber,
                        (userStats?.easterEggs || 0) > 0 ? styles.progressNumberActive : { color: colors.text }
                      ]}>
                        {userStats?.easterEggs || 0}
                      </Text>
                    </View>
                    <Text style={[
                      styles.progressLabel,
                      (userStats?.easterEggs || 0) > 0 ? styles.progressLabelActive : { color: colors.textSecondary }
                    ]}>Œufs trouvés</Text>
                  </View>
                  <View style={styles.progressStat}>
                    <View style={[
                      styles.progressNumberContainer,
                      (userStats?.totalActivities || 0) > 0 && styles.progressNumberContainerActive
                    ]}>
                      <Text style={[
                        styles.progressNumber,
                        (userStats?.totalActivities || 0) > 0 ? styles.progressNumberActive : { color: colors.text }
                      ]}>
                        {userStats?.totalActivities || 0}
                      </Text>
                    </View>
                    <Text style={[
                      styles.progressLabel,
                      (userStats?.totalActivities || 0) > 0 ? styles.progressLabelActive : { color: colors.textSecondary }
                    ]}>Activités</Text>
                  </View>
                </View>
              </View>
            </View>
          </Animated.View>

          {/* Monuments populaires */}
          <Animated.View entering={FadeInRight.delay(300)} style={styles.monumentsSection}>
            <View style={styles.sectionHeader}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>Monuments à découvrir</Text>
              <TouchableOpacity onPress={() => router.push('/all-monuments')}>
                <Text style={[styles.viewAllText, { color: '#8B5CF6' }]}>Voir tout</Text>
              </TouchableOpacity>
            </View>
            
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.monumentsScroll}>
              {monuments.map((monument, index) => (
                <Animated.View 
                  key={monument.id}
                  entering={FadeInRight.delay(400 + index * 100)}
                >
                  <TouchableOpacity 
                    style={styles.monumentCard}
                    onPress={() => {
                      console.log('Monument cliqué:', monument.id, monument.name);
                      router.push(`/monument/${monument.id}`);
                    }}
                  >
                    <Image 
                      source={{ uri: monument.images?.[0] || monument.image || 'https://via.placeholder.com/220x140' }} 
                      style={styles.monumentImage} 
                    />
                    <LinearGradient
                      style={styles.monumentOverlay}
                      colors={['transparent', 'rgba(0,0,0,0.8)']}
                    >
                      <View style={styles.monumentInfo}>
                        <Text style={styles.monumentTitle} numberOfLines={2}>
                          {monument.name}
                        </Text>
                        <StarRating 
                          rating={monument.rating || 4.5}
                          size="small"
                          showText={true}
                        />
                      </View>
                    </LinearGradient>
                  </TouchableOpacity>
                </Animated.View>
              ))}
            </ScrollView>
          </Animated.View>

          {/* Activités les mieux notées */}
          <Animated.View entering={FadeInDown.delay(600)} style={styles.activitiesSection}>
            <View style={styles.sectionHeader}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>Activités les mieux notées</Text>
              <TouchableOpacity onPress={() => router.push('/activities')}>
                <Text style={[styles.viewAllText, { color: '#8B5CF6' }]}>Voir tout</Text>
              </TouchableOpacity>
            </View>
            
            <View style={styles.activitiesList}>
              {topActivities.map((activity, index) => {
                const formatDuration = (minutes: number) => {
                  if (minutes < 60) return `${minutes}min`;
                  const hours = Math.floor(minutes / 60);
                  const remainingMinutes = minutes % 60;
                  return remainingMinutes > 0 ? `${hours}h${remainingMinutes}` : `${hours}h`;
                };
                
                return (
                  <Animated.View 
                    key={activity.id}
                    entering={FadeInDown.delay(700 + index * 100)}
                  >
                    <TouchableOpacity
                      style={[styles.activityCard, { backgroundColor: colors.surface }]}
                      onPress={() => router.push(`/activity/${activity.id}`)}
                    >
                      <Image 
                        source={{ uri: activity.image || 'https://via.placeholder.com/70x70' }} 
                        style={styles.activityImage} 
                      />
                      <View style={styles.activityContent}>
                        <Text style={[styles.activityTitle, { color: colors.text }]} numberOfLines={2}>
                          {activity.title}
                        </Text>
                        <Text style={[styles.activityDescription, { color: colors.textSecondary }]} numberOfLines={2}>
                          {activity.description}
                        </Text>
                        
                        <View style={styles.activityMeta}>
                          <View style={styles.activityMetaItem}>
                            <Clock size={12} color="#8B5CF6" strokeWidth={2} />
                            <Text style={[styles.activityMetaText, { color: '#8B5CF6' }]}>
                              {formatDuration(activity.duration)}
                            </Text>
                          </View>
                          <View style={styles.activityMetaItem}>
                            <Users size={12} color="#8B5CF6" strokeWidth={2} />
                            <Text style={[styles.activityMetaText, { color: '#8B5CF6' }]}>
                              {activity.participantsCount || 0}/{activity.maxParticipants}
                            </Text>
                          </View>
                          <StarRating 
                            rating={activity.organizerRating || 5.0}
                            size="small"
                            showText={true}
                          />
                        </View>
                      </View>
                    </TouchableOpacity>
                  </Animated.View>
                );
              })}
            </View>
          </Animated.View>

          <View style={styles.bottomSpacing} />
        </View>
      </ScrollView>
      
      {/* Cookie Consent Modal */}
      <CookieConsent />
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
  greeting: {
    flex: 1,
  },
  greetingText: {
    fontSize: 28,
    fontWeight: '800',
    marginBottom: 4,
  },
  userName: {
    fontSize: 16,
    fontWeight: '500',
  },
  headerButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  themeButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#8B5CF6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  moreButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
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
  content: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  progressSection: {
    marginBottom: 32,
  },
  progressCard: {
    borderRadius: 20,
    padding: 24,
    shadowColor: '#FFFFFF',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  progressContent: {
    gap: 20,
  },
  progressTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#000000',
  },
  progressSubtitle: {
    fontSize: 14,
    color: 'rgba(0,0,0,0.6)',
  },
  progressStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  progressStat: {
    alignItems: 'center',
    gap: 4,
  },
  progressNumber: {
    fontSize: 20,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  progressLabel: {
    fontSize: 11,
    color: 'rgba(0,0,0,0.6)',
    fontWeight: '500',
    textAlign: 'center',
    maxWidth: 80,
  },
  progressLabelActive: {
    fontSize: 11,
    color: '#8B5CF6',
    fontWeight: '500',
    textAlign: 'center',
    maxWidth: 80,
  },
  monumentsSection: {
    marginBottom: 32,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '800',
  },
  viewAllText: {
    fontSize: 14,
    fontWeight: '600',
  },
  monumentsScroll: {
    paddingVertical: 4,
  },
  monumentCard: {
    width: 220,
    height: 140,
    marginRight: 16,
    borderRadius: 16,
    overflow: 'hidden',
  },
  monumentImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  monumentOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: '100%',
    justifyContent: 'flex-end',
    padding: 16,
  },
  monumentInfo: {
    gap: 8,
  },
  monumentTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
    lineHeight: 20,
  },
  monumentRating: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  monumentRatingText: {
    fontSize: 13,
    color: '#FFFFFF',
    fontWeight: '500',
  },
  activitiesSection: {
    marginBottom: 32,
  },
  activitiesList: {
    gap: 16,
  },
  activityCard: {
    borderRadius: 16,
    padding: 20,
    flexDirection: 'row',
    gap: 16,
  },
  activityImage: {
    width: 70,
    height: 70,
    borderRadius: 12,
    resizeMode: 'cover',
  },
  activityContent: {
    flex: 1,
    gap: 6,
  },
  activityTitle: {
    fontSize: 16,
    fontWeight: '700',
    lineHeight: 22,
  },
  activityDescription: {
    fontSize: 14,
    lineHeight: 20,
  },
  activityMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    marginTop: 8,
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
  bottomSpacing: {
    height: 100,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 16,
  },
  loadingText: {
    fontSize: 16,
    fontWeight: '500',
  },
  searchWrapper: {
    position: 'relative',
  },
  searchResults: {
    position: 'absolute',
    top: '100%',
    left: 0,
    right: 0,
    borderRadius: 12,
    marginTop: 4,
    maxHeight: 200,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    zIndex: 1000,
  },
  searchResultItem: {
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.1)',
  },
  searchResultTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 2,
  },
  searchResultType: {
    fontSize: 12,
    fontWeight: '500',
  },
  scrollContainer: {
    flex: 1,
  },
  progressNumberContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  progressNumberContainerActive: {
    backgroundColor: '#8B5CF6',
    shadowColor: '#8B5CF6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  progressNumberActive: {
    color: '#FFFFFF',
  },
});
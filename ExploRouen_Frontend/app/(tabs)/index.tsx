import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Image,
  RefreshControl,
  ActivityIndicator,
  Alert,
  TextInput,
} from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import { MapPin, Clock, Users, Calendar, MessageCircle, Plus, Sun, Moon, Bell } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '@/contexts/ThemeContext';
import { useUser, useAuth } from '@clerk/clerk-expo';
import { useActivity } from '@/contexts/ActivityProvider';
import { useMonuments } from '@/contexts/MonumentsContext';
import { useNotifications } from '@/contexts/NotificationContext';
import ApiService from '@/services/api';
import { useRole } from '../../hooks/useRole';
import StarRating from '@/components/StarRating';
import CookieConsent from '@/components/CookieConsent';

export default function HomeScreen() {
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [topActivities, setTopActivities] = useState<any[]>([]);
  const [userStats, setUserStats] = useState<any | null>(null);
  const { user } = useUser();
  const { getToken } = useAuth();
  const { isDark, toggleTheme, colors } = useTheme();
  const { monuments: allMonuments, loadMonuments } = useMonuments();
  const { totalUnreadCount, systemNotificationCount } = useNotifications();
  const monuments = allMonuments.slice(0, 5);
  
  // Calculer le nombre total de notifications (messages + système)
  const totalUnread = totalUnreadCount + systemNotificationCount;

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
      
      // Charger les monuments depuis le contexte
      if (allMonuments.length === 0) {
        await loadMonuments();
      }
      
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
    await Promise.all([loadData(), loadMonuments()]);
    setRefreshing(false);
  };

  useEffect(() => {
    loadData();
  }, []);

  if (loading) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        {/* Background Image */}
        <Image 
          source={require('../../assets/images/cathedrale-rouen.jpg')}
          style={styles.backgroundImage}
        />
        
        {/* Full Image Overlay */}
        <View style={styles.fullOverlay} />
        
        {/* Bottom Shadow Overlay */}
        <LinearGradient
          colors={['transparent', 'rgba(0,0,0,0.3)', 'rgba(0,0,0,0.8)', 'rgba(0,0,0,0.95)']}
          style={styles.bottomShadow}
        />
        
        {/* Header fixe pendant le chargement */}
        <View style={[styles.header, { backgroundColor: 'transparent' }]}>
          <View style={styles.headerTop}>
            <View style={styles.greeting}>
              <Text style={styles.greetingText}>Bonjour,</Text>
              <Text style={[styles.userName, { color: colors.textSecondary }]}>{user?.fullName || user?.firstName || 'Explorateur'}</Text>
            </View>
            <View style={styles.headerButtons}>
              <TouchableOpacity 
                style={[styles.themeButton, { backgroundColor: colors.buttonPrimary }]} 
                onPress={toggleTheme}
              >
                {isDark ? (
                  <Sun size={20} color="#FFFFFF" strokeWidth={2} />
                ) : (
                  <Moon size={20} color="#FFFFFF" strokeWidth={2} />
                )}
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.moreButton, { backgroundColor: colors.buttonPrimary }]}
                onPress={() => router.push('/notifications')}
              >
                <Bell size={24} color="#FFFFFF" strokeWidth={2} />
                {totalUnread > 0 && (
                  <View style={styles.notificationBadge}>
                    <Text style={styles.notificationBadgeText}>
                      {totalUnread > 99 ? '99+' : totalUnread}
                    </Text>
                  </View>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* Indicateur de chargement centré */}
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.buttonPrimary} />
          <Text style={[styles.loadingText, { color: colors.text }]}>Chargement...</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Background Image */}
      <Image 
        source={require('../../assets/images/cathedrale-rouen.jpg')}
        style={styles.backgroundImage}
      />
      
      {/* Full Image Overlay */}
      <View style={styles.fullOverlay} />
      
      {/* Header fixe */}
      <View style={[styles.header, { backgroundColor: 'transparent' }]}>
        <View style={styles.headerTop}>
          <View style={styles.greeting}>
            <Text style={styles.greetingText}>Bonjour,</Text>
            <Text style={[styles.userName, { color: colors.textSecondary }]}>{user?.fullName || user?.firstName || 'Explorateur'}</Text>
          </View>
          <View style={styles.headerButtons}>
            <TouchableOpacity 
              style={[styles.themeButton, { backgroundColor: colors.buttonPrimary }]} 
              onPress={toggleTheme}
            >
              {isDark ? (
                <Sun size={20} color="#FFFFFF" strokeWidth={2} />
              ) : (
                <Moon size={20} color="#FFFFFF" strokeWidth={2} />
              )}
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.moreButton, { backgroundColor: colors.buttonPrimary }]}
              onPress={() => router.push('/notifications')}
            >
              <Bell size={24} color="#FFFFFF" strokeWidth={2} />
              {totalUnread > 0 && (
                <View style={styles.notificationBadge}>
                  <Text style={styles.notificationBadgeText}>
                    {totalUnread > 99 ? '99+' : totalUnread}
                  </Text>
                </View>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {/* Contenu scrollable */}
      <ScrollView
        style={styles.scrollContainer}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        showsVerticalScrollIndicator={false}
        bounces={true}
        bouncesZoom={false}
        scrollEventThrottle={16}
        overScrollMode="always"
        nestedScrollEnabled={true}
      >
        <View style={styles.content}>
          {/* Votre progression */}
          <View style={styles.progressSection}>
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
                      (userStats?.monumentsVisited || 0) > 0 && {
                        backgroundColor: colors.buttonPrimary,
                        shadowColor: colors.buttonPrimary,
                        shadowOffset: { width: 0, height: 4 },
                        shadowOpacity: 0.3,
                        shadowRadius: 8,
                        elevation: 6,
                      }
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
                      (userStats?.easterEggs || 0) > 0 && {
                        backgroundColor: colors.buttonPrimary,
                        shadowColor: colors.buttonPrimary,
                        shadowOffset: { width: 0, height: 4 },
                        shadowOpacity: 0.3,
                        shadowRadius: 8,
                        elevation: 6,
                      }
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
                      (userStats?.totalActivities || 0) > 0 && {
                        backgroundColor: colors.buttonPrimary,
                        shadowColor: colors.buttonPrimary,
                        shadowOffset: { width: 0, height: 4 },
                        shadowOpacity: 0.3,
                        shadowRadius: 8,
                        elevation: 6,
                      }
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
                      { color: '#1E40AF' }
                    ]}>Activités</Text>
                  </View>
                </View>
              </View>
            </View>
          </View>

          {/* Monuments populaires */}
          <View style={styles.monumentsSection}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Monuments à découvrir</Text>
              <TouchableOpacity onPress={() => router.push('/all-monuments')}>
                <Text style={[styles.viewAllText, { color: '#FFFFFF' }]}>Voir tout</Text>
              </TouchableOpacity>
            </View>
            
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.monumentsScroll}>
              {monuments.map((monument, index) => (
                <View 
                  key={monument.id}
                >
                  <TouchableOpacity 
                    style={styles.monumentCard}
                    onPress={() => {
                      console.log('Monument cliqué:', monument.id, monument.name);
                      if (monument.id) {
                        router.push(`/monument/${encodeURIComponent(monument.id)}`);
                      } else {
                        console.error('Monument ID manquant:', monument);
                      }
                    }}
                  >
                    <Image 
                      source={{ 
                        uri: monument.images?.[0] || 'https://via.placeholder.com/220x140' 
                      }} 
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
                      </View>
                    </LinearGradient>
                  </TouchableOpacity>
                </View>
              ))}
            </ScrollView>
          </View>

          {/* Activités les mieux notées */}
          <View style={styles.activitiesSection}>
            <View style={styles.sectionHeader}>
              <Text style={[styles.sectionTitle, { color: '#FFFFFF' }]}>Activités les mieux notées</Text>
              <TouchableOpacity onPress={() => router.push('/activities')}>
                <Text style={[styles.viewAllText, { color: '#FFFFFF' }]}>Voir tout</Text>
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
                  <View 
                    key={activity.id}
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
                        <Text style={[styles.activityTitle, { color: colors.text }]} numberOfLines={1}>
                          {activity.title}
                        </Text>
                        <Text style={[styles.activityDescription, { color: colors.textSecondary }]} numberOfLines={2}>
                          {activity.description}
                        </Text>
                        
                        <View style={styles.activityMeta}>
                          <View style={styles.activityMetaItem}>
                            <Clock size={12} color="#F59E0B" strokeWidth={2} />
                            <Text style={[styles.activityMetaText, { color: '#F59E0B' }]}>
                              {formatDuration(activity.duration)}
                            </Text>
                          </View>
                          <View style={styles.activityMetaItem}>
                            <Users size={12} color="#DC2626" strokeWidth={2} />
                            <Text style={[styles.activityMetaText, { color: '#DC2626' }]}>
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
                  </View>
                );
              })}
            </View>
          </View>

          <View style={styles.bottomSpacing} />
        </View>
      </ScrollView>
      
      {/* Gradient Overlay at Bottom */}
      <LinearGradient
        colors={['transparent', isDark ? 'rgba(26, 26, 26, 0.95)' : 'rgba(250, 250, 250, 0.95)']}
        style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          height: 120,
          pointerEvents: 'none'
        }}
      />
      
      {/* Cookie Consent Modal */}
      <CookieConsent />
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
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  fullOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  bottomShadow: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: '60%',
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 60,
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
    color: '#FFFFFF',
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
    shadowColor: '#6366F1',
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
    shadowColor: '#6366F1',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
    position: 'relative',
  },
  notificationBadge: {
    position: 'absolute',
    top: -2,
    right: -2,
    backgroundColor: '#EF4444',
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    paddingHorizontal: 4,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#1A1A1A',
  },
  notificationBadgeText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700',
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
    color: '#6366F1',
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
    color: '#FFFFFF',
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
    flexDirection: 'row',
    overflow: 'hidden',
  },
  activityImage: {
    width: 120,
    height: '100%',
    resizeMode: 'cover',
  },
  activityContent: {
    flex: 1,
    gap: 6,
    padding: 16,
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
    height: 140,
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
    backgroundColor: '#6366F1',
    shadowColor: '#6366F1',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  progressNumberActive: {
    color: '#FFFFFF',
  },
});
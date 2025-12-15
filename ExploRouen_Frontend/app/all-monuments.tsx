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
  Alert,
  Modal,
} from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import { Search, MapPin, Clock, Filter, Plus, ChevronRight, X, Users, Star } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '@/contexts/ThemeContext';
import { useAuth } from '@clerk/clerk-expo';
import ApiService from '@/services/api';
import StarRating from '@/components/StarRating';
import FloatingMenu from '@/components/FloatingMenu';
import { useRole } from '../hooks/useRole';
import { useMonuments } from '@/contexts/MonumentsContext';

export default function AllMonumentsScreen() {
  const [searchQuery, setSearchQuery] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string | null>('all');
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [selectedPeriod, setSelectedPeriod] = useState<string>('all');
  const { colors, isDark } = useTheme();
  const { isAdmin } = useRole();
  const { monuments, loading, loadMonuments, refreshMonuments } = useMonuments();

  // Fonction pour obtenir le type dynamique selon la catégorie
  const getItemType = () => {
    if (!selectedCategory || selectedCategory === 'all') {
      return 'monument';
    }
    switch (selectedCategory) {
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
        return 'monument';
    }
  };

  // Fonction pour obtenir la couleur selon la catégorie
  const getCategoryColor = (category: string) => {
    console.log('Category:', category); // Debug
    switch (category) {
      case 'HISTORIC':
        return '#F59E0B';
      case 'RELIGIOUS':
        return '#6366F1';
      case 'OLD_HOUSE':
        return '#8B5CF6';
      case 'CIVIL':
        return '#10B981';
      case 'MUSEUM':
        return '#EC4899';
      case 'MEMORIAL':
        return '#6B7280';
      default:
        return '#10B981';
    }
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
        return 'Monument';
    }
  };

  const categories = [
    { id: 'all', label: 'Tous', color: '#1E40AF' },
    { id: 'HISTORIC', label: 'Historique', color: '#F59E0B' },
    { id: 'RELIGIOUS', label: 'Religieux', color: '#6366F1' },
    { id: 'OLD_HOUSE', label: 'Maison ancienne', color: '#8B5CF6' },
    { id: 'CIVIL', label: 'Civil', color: '#10B981' },
    { id: 'MUSEUM', label: 'Musée', color: '#EC4899' },
    { id: 'MEMORIAL', label: 'Commémoratif', color: '#6B7280' },
  ];

  useEffect(() => {
    if (monuments.length === 0) {
      loadMonuments();
    }
  }, []);

  const filteredMonuments = monuments.filter(monument => {
    const matchesSearch = monument.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         monument.description.toLowerCase().includes(searchQuery.toLowerCase());
    
    // Debug pour voir les catégories
    console.log('Monument:', monument.name, 'Category:', monument.category, 'Selected:', selectedCategory);
    
    const matchesCategory = !selectedCategory || selectedCategory === 'all' || 
                           monument.category === selectedCategory;
    
    // Filtrage par période historique basé sur les mots-clés dans la description
    let matchesPeriod = true;
    if (selectedPeriod !== 'all') {
      const description = monument.description.toLowerCase();
      const name = monument.name.toLowerCase();
      
      switch (selectedPeriod) {
        case 'ancient':
          matchesPeriod = description.includes('antique') || description.includes('romain') || 
                         description.includes('gallo-romain') || name.includes('antique');
          break;
        case 'medieval':
          matchesPeriod = description.includes('médiéval') || description.includes('moyen âge') || 
                         description.includes('gothique') || description.includes('roman') ||
                         name.includes('médiéval') || name.includes('gothique');
          break;
        case 'renaissance':
          matchesPeriod = description.includes('renaissance') || description.includes('xvie') ||
                         description.includes('16e') || name.includes('renaissance');
          break;
        case 'modern':
          matchesPeriod = description.includes('xviie') || description.includes('xviiie') ||
                         description.includes('17e') || description.includes('18e') ||
                         description.includes('classique') || description.includes('baroque');
          break;
        case 'contemporary':
          matchesPeriod = description.includes('xixe') || description.includes('xxe') ||
                         description.includes('19e') || description.includes('20e') ||
                         description.includes('moderne') || description.includes('contemporain');
          break;
      }
    }
    
    return matchesSearch && matchesCategory && matchesPeriod;
  });

  useEffect(() => {
    loadMonuments();
  }, []);

  // Trier les monuments par date de création (plus récent en premier)
  const sortedMonuments = [...monuments].sort((a, b) => 
    new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime()
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await refreshMonuments();
    setRefreshing(false);
  };

  return (
    <View style={styles.container}>
      {/* Image de fond plein écran */}
      <Image 
        source={require('../assets/images/cathedrale-rouen.jpg')}
        style={styles.backgroundImage}
      />
      
      {/* Dark Overlay pour assombrir toute l'image */}
      <View style={[styles.darkOverlay, { backgroundColor: 'rgba(0, 0, 0, 0.5)', position: 'absolute', top: 0, left: 0, width: '100%', height: '100%'}]} />
      
      <View style={[styles.safeArea, { backgroundColor: 'transparent' }]}>
        {/* Header */}
        <View style={[styles.header, { backgroundColor: 'transparent' }]}>
          <View style={styles.headerTop}>
            <Text style={styles.headerTitle}>Monuments</Text>
            {isAdmin && (
              <TouchableOpacity 
                style={styles.modernCreateButton}
                onPress={() => router.push('/create-monument')}
              >
                <LinearGradient
                  colors={[colors.buttonPrimary, colors.buttonPrimary]}
                  style={styles.modernCreateButtonGradient}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                >
                  <Plus size={20} color="#FFFFFF" strokeWidth={2.5} />
                </LinearGradient>
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Search Bar */}
        <View style={styles.searchSection}>
          <View style={[styles.searchContainer, { backgroundColor: colors.surface }]}>
            <Search size={20} color={isDark ? '#FFFFFF' : '#000000'} strokeWidth={2} />
            <TextInput
              style={[styles.searchInput, { color: isDark ? '#FFFFFF' : '#000000' }]}
              placeholder="Rechercher un monument..."
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholderTextColor={isDark ? 'rgba(255, 255, 255, 0.6)' : 'rgba(0, 0, 0, 0.6)'}
            />
            <TouchableOpacity 
              style={styles.filterButton}
              onPress={() => setShowFilterModal(true)}
            >
              <Filter size={18} color={isDark ? '#FFFFFF' : '#000000'} strokeWidth={2} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Categories */}
        <View style={styles.categoriesSection}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoriesScroll}>
            {categories.map((category) => (
              <TouchableOpacity
                key={category.id}
                style={[
                  styles.categoryButton,
                  { backgroundColor: category.id === selectedCategory ? category.color : colors.surface }
                ]}
                onPress={() => setSelectedCategory(selectedCategory === category.id ? null : category.id)}
              >
                <Text style={[
                  styles.categoryText,
                  { color: category.id === selectedCategory ? '#FFFFFF' : colors.text }
                ]}>
                  {category.label}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Results Count */}
        <View style={styles.resultsSection}>
          <Text style={[styles.resultsText, { color: '#FFFFFF' }]}>
            {sortedMonuments.filter(monument => {
              const matchesSearch = monument.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                monument.description.toLowerCase().includes(searchQuery.toLowerCase());
              
              const matchesCategory = !selectedCategory || selectedCategory === 'all' || monument.category === selectedCategory;
              
              let matchesPeriod = true;
              if (selectedPeriod !== 'all') {
                // Logique de filtrage par période si nécessaire
              }
              
              return matchesSearch && matchesCategory && matchesPeriod;
            }).length} {getItemType()}(s) trouvé(s)
          </Text>
        </View>

        {/* Content */}
        <ScrollView 
          style={styles.content}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
          showsVerticalScrollIndicator={false}
        >
          {filteredMonuments.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Text style={[styles.emptyText, { color: colors.text }]}>
                Aucun {getItemType()} trouvé
              </Text>
            </View>
          ) : (
            <View style={styles.monumentsList}>
              {filteredMonuments.map((monument, index) => (
                <View 
                  key={monument.id}
                >
                  <TouchableOpacity 
                    style={[styles.monumentCard, { backgroundColor: colors.surface }]}
                    onPress={() => router.push(`/monument/${monument.id}`)}
                  >
                    <Image 
                      source={{ 
                        uri: monument.images?.[0] || 'https://via.placeholder.com/60x60' 
                      }} 
                      style={styles.monumentImage} 
                    />
                    <View style={styles.monumentContent}>
                      <Text style={[styles.monumentTitle, { color: colors.text }]} numberOfLines={1}>
                        {monument.name}
                      </Text>
                      <Text style={[styles.monumentDescription, { color: colors.textSecondary }]} numberOfLines={2}>
                        {monument.description}
                      </Text>
                      
                      <View style={styles.monumentMeta}>
                        {(monument.rating || 0) > 0 && (
                          <StarRating 
                            rating={monument.rating || 0}
                            size="small"
                            showText={true}
                          />
                        )}
                        <View style={styles.monumentDuration}>
                          <Clock size={14} color="#F59E0B" strokeWidth={2} />
                          <Text style={[styles.monumentDuration, { color: '#F59E0B' }]}>{monument.duration}</Text>
                        </View>
                        <View style={styles.monumentVisitors}>
                          <Users size={14} color="#DC2626" strokeWidth={2} />
                          <Text style={[styles.monumentVisitors, { color: '#DC2626' }]}>{monument.visitors}</Text>
                        </View>
                        <View style={styles.monumentLocation}>
                          <MapPin size={12} color={colors.textSecondary} strokeWidth={2} />
                          <Text style={[styles.locationText, { color: colors.textSecondary }]} numberOfLines={1}>
                            {monument.address?.split(',')[0] || 'Rouen'}
                          </Text>
                        </View>
                      </View>
                      
                      <View style={[styles.categoryBadge, { backgroundColor: getCategoryColor(monument.category || 'MONUMENT') }]}>
                        <Text style={styles.categoryBadgeText}>
                          {getCategoryLabel(monument.category || 'MONUMENT')}
                        </Text>
                      </View>
                    </View>
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          )}

          <View style={styles.bottomSpacing} />
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
                  style={styles.closeButton}
                  onPress={() => setShowFilterModal(false)}
                >
                  <LinearGradient
                    colors={[colors.buttonPrimary, colors.buttonPrimary]}
                    style={styles.closeButtonGradient}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                  >
                    <X size={20} color="#FFFFFF" strokeWidth={2} />
                  </LinearGradient>
                </TouchableOpacity>
              </View>
              
              <ScrollView style={styles.periodOptions} showsVerticalScrollIndicator={false} contentContainerStyle={{ gap: 12 }}>
                {[
                  { id: 'all', label: 'Toutes les périodes' },
                  { id: 'ancient', label: 'Antiquité' },
                  { id: 'medieval', label: 'Moyen Âge' },
                  { id: 'renaissance', label: 'Renaissance' },
                  { id: 'modern', label: 'Époque moderne' },
                  { id: 'contemporary', label: 'Époque contemporaine' },
                ].map((period) => (
                  <TouchableOpacity
                    key={period.id}
                    style={[
                      styles.periodOption,
                      { backgroundColor: colors.surface },
                      selectedPeriod === period.id && { backgroundColor: colors.buttonPrimary }
                    ]}
                    onPress={() => {
                      setSelectedPeriod(period.id);
                      setShowFilterModal(false);
                    }}
                  >
                    <View style={styles.periodOptionContent}>
                      <Text style={[
                        styles.periodOptionText,
                        { color: colors.text },
                        selectedPeriod === period.id && { color: '#FFFFFF' }
                      ]}>
                        {period.label}
                      </Text>
                    </View>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          </View>
        </Modal>
        
        <FloatingMenu />
      </View>
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
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  darkOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  safeArea: {
    flex: 1,
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
    marginBottom: 0,
  },
  headerTitle: {
    fontSize: 32,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  modernCreateButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#6366F1',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  modernCreateButtonGradient: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  searchSection: {
    paddingHorizontal: 20,
    marginBottom: 16,
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
    marginBottom: 16,
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
  resultsSection: {
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  resultsText: {
    fontSize: 14,
    fontWeight: '500',
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  monumentsList: {
    gap: 12,
  },
  monumentCard: {
    borderRadius: 16,
    flexDirection: 'row',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
    height: 140,
  },
  monumentImage: {
    width: 120,
    height: '100%',
    resizeMode: 'cover',
  },
  monumentContent: {
    flex: 1,
    gap: 6,
    padding: 12,
    justifyContent: 'center',
  },
  monumentTitle: {
    fontSize: 16,
    fontWeight: '700',
    lineHeight: 22,
  },
  monumentDescription: {
    fontSize: 14,
    lineHeight: 20,
  },
  monumentMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginTop: 4,
  },
  monumentRating: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  ratingText: {
    fontSize: 12,
    color: '#FBBF24',
    fontWeight: '600',
  },
  monumentDuration: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    fontSize: 12,
    fontWeight: '500',
    color: '#F59E0B',
    marginLeft: 4,
  },
  monumentVisitors: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    fontSize: 12,
    fontWeight: '500',
    color: '#DC2626',
    marginLeft: 4,
  },
  monumentLocation: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    flex: 1,
  },
  locationText: {
    fontSize: 12,
    fontWeight: '500',
    flex: 1,
  },
  categoryBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    marginTop: 4,
  },
  categoryBadgeText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#FFFFFF',
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
    marginTop: 8,
    fontSize: 14,
    textAlign: 'center',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingTop: 20,
    paddingHorizontal: 20,
    paddingBottom: 40,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#6366F1',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  closeButtonGradient: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  periodOptions: {
    maxHeight: 400,
  },
  periodOption: {
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  periodOptionContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  periodOptionText: {
    fontSize: 16,
    fontWeight: '500',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: '500',
    textAlign: 'center',
  },
});
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
import { router } from 'expo-router';
import { Search, MapPin, Clock, Filter, Plus, ChevronRight, X } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeInDown, FadeInRight } from 'react-native-reanimated';
import { useTheme } from '@/contexts/ThemeContext';
import { useAuth } from '@clerk/clerk-expo';
import ApiService from '@/services/api';
import StarRating from '@/components/StarRating';
import FloatingMenu from '@/components/FloatingMenu';
import { useRole } from '../hooks/useRole';

export default function AllMonumentsScreen() {
  const [searchQuery, setSearchQuery] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [monuments, setMonuments] = useState<any[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string | null>('all');
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [selectedPeriod, setSelectedPeriod] = useState<string>('all');
  const { colors } = useTheme();
  const { isAdmin } = useRole();

  // Fonction pour obtenir le type dynamique selon la catégorie
  const getItemType = () => {
    if (!selectedCategory || selectedCategory === 'all') {
      return 'monument';
    }
    switch (selectedCategory) {
      case 'MONUMENT':
        return 'monument';
      case 'MUSEUM':
        return 'musée';
      case 'PARK':
        return 'parc';
      case 'CHURCH':
        return 'église';
      default:
        return 'monument';
    }
  };

  // Fonction pour obtenir la couleur selon la catégorie
  const getCategoryColor = (category: string) => {
    console.log('Category:', category); // Debug
    switch (category) {
      case 'MONUMENT':
        return '#10B981'; // Vert
      case 'MUSEUM':
        return '#F59E0B'; // Orange
      case 'PARK':
        return '#EC4899'; // Rose
      case 'CHURCH':
        return '#8B5CF6'; // Violet
      default:
        return '#10B981'; // Vert par défaut pour les monuments
    }
  };

  // Fonction pour obtenir le label de la catégorie
  const getCategoryLabel = (category: string) => {
    switch (category) {
      case 'MONUMENT':
        return 'Monument';
      case 'MUSEUM':
        return 'Musée';
      case 'PARK':
        return 'Parc';
      case 'CHURCH':
        return 'Église';
      default:
        return 'Monument';
    }
  };

  const categories = [
    { id: 'all', label: 'Toutes', color: '#8B5CF6' },
    { id: 'MONUMENT', label: 'Monument', color: '#10B981' },
    { id: 'MUSEUM', label: 'Musée', color: '#F59E0B' },
    { id: 'PARK', label: 'Parc', color: '#EC4899' },
    { id: 'CHURCH', label: 'Église', color: '#8B5CF6' },
  ];

  const loadMonuments = async () => {
    try {
      const response = await ApiService.getMonuments();
      setMonuments(response || []);
      setLoading(false);
    } catch (error) {
      console.error('Erreur lors du chargement des monuments:', error);
      Alert.alert('Erreur', 'Impossible de charger les monuments');
      setLoading(false);
    }
  };

  const filteredMonuments = monuments.filter(monument => {
    const matchesSearch = monument.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         monument.description.toLowerCase().includes(searchQuery.toLowerCase());
    
    // Debug pour voir les catégories
    console.log('Monument:', monument.name, 'Category:', monument.category, 'Selected:', selectedCategory);
    
    const matchesCategory = !selectedCategory || selectedCategory === 'all' || 
                           monument.category === selectedCategory ||
                           (selectedCategory === 'MONUMENT' && (!monument.category || monument.category === 'MONUMENT'));
    
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
    await loadMonuments();
    setRefreshing(false);
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <Animated.View entering={FadeInDown.delay(100)} style={[styles.header, { backgroundColor: colors.background }]}>
        <View style={styles.headerTop}>
          <Text style={[styles.headerTitle, { color: colors.text }]}>Monuments</Text>
          {isAdmin && (
            <TouchableOpacity 
              style={[styles.modernCreateButton, { backgroundColor: '#8B5CF6' }]}
              onPress={() => router.push('/create-monument')}
            >
              <Plus size={20} color="#FFFFFF" strokeWidth={2.5} />
            </TouchableOpacity>
          )}
        </View>
      </Animated.View>

      {/* Search Bar */}
      <Animated.View entering={FadeInDown.delay(200)} style={styles.searchSection}>
        <View style={[styles.searchContainer, { backgroundColor: colors.surface }]}>
          <Search size={18} color={colors.textSecondary} strokeWidth={2} />
          <TextInput
            style={[styles.searchInput, { color: colors.text }]}
            placeholder="Rechercher un monument..."
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
      <Animated.View entering={FadeInDown.delay(300)} style={styles.categoriesSection}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoriesScroll}>
          {categories.map((category) => (
            <TouchableOpacity
              key={category.id}
              style={[
                styles.categoryButton,
                { backgroundColor: colors.surface },
                selectedCategory === category.id && { backgroundColor: category.color }
              ]}
              onPress={() => setSelectedCategory(selectedCategory === category.id ? null : category.id)}
            >
              <Text style={[
                styles.categoryText,
                { color: colors.textSecondary },
                selectedCategory === category.id && { color: '#FFFFFF' }
              ]}>
                {category.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </Animated.View>

      {/* Results Count */}
      <Animated.View entering={FadeInDown.delay(400)} style={styles.resultsSection}>
        <Text style={[styles.resultsText, { color: colors.textSecondary }]}>
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
      </Animated.View>

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
            <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
              Aucun {getItemType()} trouvé
            </Text>
          </View>
        ) : (
          <View style={styles.monumentsList}>
            {filteredMonuments.map((monument, index) => (
              <Animated.View 
                key={monument.id}
                entering={FadeInDown.delay(500 + index * 100)}
              >
                <TouchableOpacity 
                  style={[styles.monumentCard, { backgroundColor: colors.surface }]}
                  onPress={() => router.push(`/monument/${monument.id}`)}
                >
                  <Image source={{ uri: monument.images?.[0] || 'https://via.placeholder.com/60x60' }} style={styles.monumentImage} />
                  <View style={styles.monumentContent}>
                    <Text style={[styles.monumentTitle, { color: colors.text }]} numberOfLines={2}>
                      {monument.name}
                    </Text>
                    <Text style={[styles.monumentDescription, { color: colors.textSecondary }]} numberOfLines={2}>
                      {monument.description}
                    </Text>
                    
                    <View style={styles.monumentMeta}>
                      <StarRating 
                        rating={monument.rating || 4.5}
                        size="small"
                        showText={true}
                      />
                      <View style={styles.monumentDuration}>
                        <Clock size={12} color={colors.textSecondary} strokeWidth={2} />
                        <Text style={[styles.durationText, { color: colors.textSecondary }]}>1h30</Text>
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
                  <ChevronRight size={16} color={colors.textSecondary} strokeWidth={2} />
                </TouchableOpacity>
              </Animated.View>
            ))}
          </View>
        )}

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
                    { backgroundColor: colors.background },
                    selectedPeriod === period.id && { backgroundColor: '#8B5CF6' }
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
    marginBottom: 0,
  },
  headerTitle: {
    fontSize: 32,
    fontWeight: '700',
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
    borderRadius: 12,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  monumentImage: {
    width: 60,
    height: 60,
    borderRadius: 10,
    resizeMode: 'cover',
  },
  monumentContent: {
    flex: 1,
    gap: 6,
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
  },
  durationText: {
    fontSize: 12,
    fontWeight: '500',
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
    height: 100,
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
    width: 36,
    height: 36,
    borderRadius: 18,
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
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Alert,
  Image,
  ActivityIndicator,
  Modal,
  FlatList,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { ArrowLeft, MapPin, Camera, Star, Clock } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useTheme } from '@/contexts/ThemeContext';
import { useAuth, useUser } from '@clerk/clerk-expo';
import { useRole } from '../hooks/useRole';
import * as ImagePicker from 'expo-image-picker';
import ApiService, { CreateMonumentData } from '@/services/api';
import { handleImageUpload } from '@/services/imageUpload';

export default function CreateMonumentScreen() {
  const { colors } = useTheme();
  const { getToken } = useAuth();
  const { user } = useUser();
  const { isAdmin } = useRole();
  const params = useLocalSearchParams();
  
  // Détecter le mode édition
  const isEditMode = params.editMode === 'true';
  const monumentId = params.monumentId as string;
  const monumentData = params.monumentData ? JSON.parse(params.monumentData as string) : null;

  // États du formulaire avec initialisation directe
  const [name, setName] = useState(isEditMode && monumentData ? monumentData.name || '' : '');
  const [description, setDescription] = useState(isEditMode && monumentData ? monumentData.description || '' : '');
  const [address, setAddress] = useState(isEditMode && monumentData ? monumentData.address || '' : '');
  const [latitude, setLatitude] = useState<number | null>(isEditMode && monumentData ? monumentData.latitude || null : null);
  const [longitude, setLongitude] = useState<number | null>(isEditMode && monumentData ? monumentData.longitude || null : null);
  const [category, setCategory] = useState(isEditMode && monumentData ? monumentData.category || 'MONUMENT' : 'MONUMENT');
  const [historicalPeriod, setHistoricalPeriod] = useState(isEditMode && monumentData ? monumentData.history || '' : '');
  const [visitDuration, setVisitDuration] = useState(isEditMode && monumentData ? monumentData.visitDuration?.toString() || '' : '');
  const [price, setPrice] = useState(isEditMode && monumentData ? monumentData.price?.toString() || '0' : '0');
  const [pointOfInterest, setPointOfInterest] = useState(isEditMode && monumentData ? monumentData.highlights || '' : '');
  const [selectedImage, setSelectedImage] = useState<string | null>(
    isEditMode && monumentData 
      ? (monumentData.images && monumentData.images.length > 0 
          ? monumentData.images[0] 
          : monumentData.image || null)
      : null
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [addressSuggestions, setAddressSuggestions] = useState<any[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);

  const [errors, setErrors] = useState({
    name: '',
    description: '',
    address: '',
    latitude: '',
    longitude: '',
    price: '',
    images: ''
  });

  const categories = [
    { id: 'MONUMENT', label: 'Monument', color: '#10B981' },
    { id: 'MUSEUM', label: 'Musée', color: '#F59E0B' },
    { id: 'PARK', label: 'Parc', color: '#EC4899' },
    { id: 'CHURCH', label: 'Église', color: '#8B5CF6' },
  ];

  // Vérifier si l'utilisateur est admin
  if (!isAdmin) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <ArrowLeft size={24} color={colors.text} strokeWidth={2} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: colors.text }]}>Accès refusé</Text>
        </View>
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 }}>
          <Text style={[{ fontSize: 18, textAlign: 'center', color: colors.text, marginBottom: 10 }]}>
            Accès administrateur requis
          </Text>
          <Text style={[{ fontSize: 14, textAlign: 'center', color: colors.textSecondary }]}>
            Seuls les administrateurs peuvent créer des monuments.
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  const pickImage = async () => {
    try {
      // Demander les permissions si nécessaire
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission requise', 'L\'accès à la galerie photo est nécessaire pour sélectionner une image.');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [16, 9],
        quality: 0.8,
      });

      console.log('📸 Résultat sélection image:', result);

      if (!result.canceled && result.assets[0]) {
        console.log('✅ Image sélectionnée:', result.assets[0].uri);
        setSelectedImage(result.assets[0].uri);
        // Effacer l'erreur d'image si une image est ajoutée
        setErrors(prev => ({ ...prev, images: '' }));
      } else {
        console.log('❌ Sélection d\'image annulée');
      }
    } catch (error) {
      console.error('❌ Erreur lors de la sélection d\'image:', error);
      Alert.alert('Erreur', 'Impossible de sélectionner une image');
    }
  };

  // Fonction pour rechercher des adresses avec Nominatim
  const searchAddresses = async (query: string) => {
    if (query.length < 3) {
      setAddressSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=5&countrycodes=fr&addressdetails=1`
      );
      const data = await response.json();
      
      setAddressSuggestions(data);
      setShowSuggestions(data.length > 0);
    } catch (error) {
      console.error('Erreur recherche adresse:', error);
    }
  };

  // Fonction pour sélectionner une adresse
  const selectAddress = (suggestion: any) => {
    setAddress(suggestion.display_name);
    setLatitude(parseFloat(suggestion.lat));
    setLongitude(parseFloat(suggestion.lon));
    setShowSuggestions(false);
  };

  const validateField = (field: string, value: string) => {
    let error = '';
    
    switch (field) {
      case 'name':
        if (!value.trim()) {
          error = 'Le nom du monument est requis';
        } else if (value.trim().length < 3) {
          error = 'Le nom doit contenir au moins 3 caractères';
        }
        break;
      case 'description':
        if (!value.trim()) {
          error = 'La description est requise';
        } else if (value.trim().length < 20) {
          error = 'La description doit contenir au moins 20 caractères';
        }
        break;
      case 'address':
        if (!value.trim()) {
          error = 'L\'adresse est requise';
        }
        break;
    }
    
    setErrors(prev => ({ ...prev, [field]: error }));
    return error === '';
  };

  const validateForm = () => {
    const newErrors = { ...errors };
    let isValid = true;

    if (!name.trim()) {
      newErrors.name = 'Le nom est obligatoire';
      isValid = false;
    }

    if (!description.trim()) {
      newErrors.description = 'La description est obligatoire';
      isValid = false;
    }

    if (!address.trim()) {
      newErrors.address = 'L\'adresse est obligatoire';
      isValid = false;
    }

    if (latitude === null || longitude === null) {
      newErrors.latitude = 'Les coordonnées sont obligatoires';
      isValid = false;
    }

    if (!selectedImage) {
      newErrors.images = 'Une image est obligatoire';
      isValid = false;
    } else {
      setErrors(prev => ({ ...prev, images: '' }));
    }
    
    if (!latitude || !longitude) {
      Alert.alert('Erreur', 'Veuillez sélectionner une adresse dans les suggestions pour obtenir les coordonnées');
      return false;
    }
    
    setErrors(newErrors);
    return isValid;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    setIsSubmitting(true);
    try {
      const token = await getToken();
      if (!token) {
        Alert.alert('Erreur', 'Token d\'authentification manquant');
        return;
      }

      // Uploader l'image si nécessaire (seulement si c'est une nouvelle image locale)
      let uploadedImageUrl: string | null = null;
      if (selectedImage) {
        // Si c'est une URL existante (mode édition), la garder
        if (selectedImage.startsWith('http')) {
          uploadedImageUrl = selectedImage;
        } else {
          // Sinon, uploader la nouvelle image
          console.log('📤 Upload de l\'image en cours...');
          uploadedImageUrl = await handleImageUpload(selectedImage, token);
          if (!uploadedImageUrl) {
            Alert.alert('Erreur', 'Impossible d\'uploader l\'image');
            return;
          }
        }
      }

      const monumentData: CreateMonumentData = {
        name: name.trim(),
        description: description.trim(),
        address: address.trim(),
        category,
        latitude: latitude!,
        longitude: longitude!,
        historicalPeriod: historicalPeriod.trim() || undefined,
        visitDuration: visitDuration.trim() || undefined,
        images: uploadedImageUrl ? [uploadedImageUrl] : [],
        createdBy: user?.id,
        isActive: true,
      };

      let response;
      if (isEditMode && monumentId) {
        // Mode modification - utiliser PUT
        console.log('🔄 Appel API PUT pour modification monument:', monumentId);
        response = await fetch(`http://192.168.1.62:5000/api/monuments/${monumentId}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
          body: JSON.stringify({
            name: name.trim(),
            description: description.trim(),
            address: address.trim(),
            category,
            latitude: latitude!,
            longitude: longitude!,
            history: historicalPeriod.trim() || undefined,
            visitDuration: visitDuration.trim() || undefined,
            highlights: pointOfInterest.trim() || undefined,
            price: price.trim() || '0',
            image: uploadedImageUrl || undefined,
          }),
        });
        
        console.log('📡 Réponse API:', response.status);
        
        if (!response.ok) {
          const errorData = await response.text();
          console.error('❌ Erreur API:', errorData);
          throw new Error(`Erreur ${response.status}: ${errorData}`);
        }
        
        const result = await response.json();
        console.log('✅ Résultat modification:', result);
      } else {
        // Mode création - utiliser POST
        console.log('🆕 Appel API POST pour création monument');
        response = await fetch(`http://192.168.1.62:5000/api/monuments`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
          body: JSON.stringify({
            name: name.trim(),
            description: description.trim(),
            address: address.trim(),
            category,
            latitude: latitude!,
            longitude: longitude!,
            history: historicalPeriod.trim() || undefined,
            visitDuration: visitDuration.trim() || undefined,
            highlights: pointOfInterest.trim() || undefined,
            price: price.trim() || '0',
            image: uploadedImageUrl || undefined,
          }),
        });
        
        console.log('📡 Réponse API création:', response.status);
        
        if (!response.ok) {
          const errorData = await response.text();
          console.error('❌ Erreur API création:', errorData);
          throw new Error(`Erreur ${response.status}: ${errorData}`);
        }
        
        const result = await response.json();
        console.log('✅ Résultat création:', result);
      }

      Alert.alert(
        'Succès',
        isEditMode ? 'Monument modifié avec succès !' : 'Monument créé avec succès !',
        [{ text: 'OK', onPress: () => router.back() }]
      );
    } catch (error) {
      console.error('Erreur création monument:', error);
      Alert.alert('Erreur', `Impossible de ${isEditMode ? 'modifier' : 'créer'} le monument`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const selectedCategoryData = categories.find(cat => cat.id === category);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <Animated.View entering={FadeInDown.delay(100)} style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <ArrowLeft size={20} color="#FFFFFF" strokeWidth={2} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>
          {isEditMode ? 'Modifier le monument' : 'Créer un monument'}
        </Text>
      </Animated.View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Nom du monument */}
        <Animated.View entering={FadeInDown.delay(200)} style={[styles.inputCard, { backgroundColor: colors.surface }]}>
          <Text style={[styles.inputLabel, { color: colors.text }]}>Nom du monument <Text style={styles.required}>*</Text></Text>
          <TextInput
            style={[styles.input, { backgroundColor: colors.background, color: colors.text, borderColor: errors.name ? '#8B5CF6' : colors.border }]}
            placeholder="Ex: Cathédrale Notre-Dame de Rouen"
            placeholderTextColor={colors.textSecondary}
            value={name}
            onChangeText={(text) => {
              console.log('📝 Modification nom:', text);
              setName(text);
              validateField('name', text);
            }}
            maxLength={100}
          />
          {errors.name ? <Text style={styles.errorText}>{errors.name}</Text> : null}
        </Animated.View>

        {/* Description */}
        <Animated.View entering={FadeInDown.delay(300)} style={[styles.inputCard, { backgroundColor: colors.surface }]}>
          <Text style={[styles.inputLabel, { color: colors.text }]}>Description <Text style={styles.required}>*</Text></Text>
          <TextInput
            style={[styles.textArea, { backgroundColor: colors.background, color: colors.text, borderColor: errors.description ? '#8B5CF6' : colors.border }]}
            placeholder="Décrivez le monument, son histoire, son architecture... (minimum 20 caractères)"
            placeholderTextColor={colors.textSecondary}
            value={description}
            onChangeText={(text) => {
              console.log('📝 Modification description:', text);
              setDescription(text);
              validateField('description', text);
            }}
            multiline
            numberOfLines={4}
            maxLength={500}
          />
          {errors.description ? <Text style={styles.errorText}>{errors.description}</Text> : null}
        </Animated.View>

        {/* Adresse */}
        <Animated.View entering={FadeInDown.delay(400)} style={[styles.inputCard, { backgroundColor: colors.surface }]}>
          <Text style={[styles.inputLabel, { color: colors.text }]}>Adresse <Text style={styles.required}>*</Text></Text>
          <View style={[styles.inputWithIcon, { backgroundColor: colors.background, borderColor: errors.address ? '#8B5CF6' : colors.border }]}>
            <MapPin size={16} color="#8B5CF6" strokeWidth={2} />
            <TextInput
              style={[styles.textInput, { backgroundColor: 'transparent', borderWidth: 0, flex: 1, color: colors.text }]}
              placeholder="Ex: Place de la Cathédrale, 76000 Rouen"
              placeholderTextColor={colors.textSecondary}
              value={address}
              onChangeText={(text) => {
                console.log('📝 Modification adresse:', text);
                setAddress(text);
                validateField('address', text);
                searchAddresses(text);
              }}
              maxLength={200}
            />
          </View>
          {errors.address ? <Text style={styles.errorText}>{errors.address}</Text> : null}
          
          {/* Suggestions d'adresses */}
          {showSuggestions && addressSuggestions.length > 0 && (
            <View style={[styles.suggestionsContainer, { backgroundColor: colors.surface }]}>
              <FlatList
                data={addressSuggestions}
                keyExtractor={(item, index) => index.toString()}
                renderItem={({ item }) => (
                  <TouchableOpacity
                    style={[styles.suggestionItem, { borderBottomColor: colors.border }]}
                    onPress={() => selectAddress(item)}
                  >
                    <MapPin size={16} color={colors.textSecondary} strokeWidth={2} />
                    <Text style={[styles.suggestionText, { color: colors.text }]} numberOfLines={2}>
                      {item.display_name}
                    </Text>
                  </TouchableOpacity>
                )}
                scrollEnabled={false}
                nestedScrollEnabled={true}
              />
            </View>
          )}
          
          {/* Coordonnées affichées */}
          {latitude && longitude && (
            <View style={styles.coordinatesContainer}>
              <Text style={[styles.coordinatesText, { color: colors.textSecondary }]}>
                📍 {latitude.toFixed(6)}, {longitude.toFixed(6)}
              </Text>
            </View>
          )}
        </Animated.View>

        {/* Coordonnées GPS */}
        <Animated.View entering={FadeInDown.delay(450)} style={[styles.inputCard, { backgroundColor: colors.surface }]}>
          <Text style={[styles.inputLabel, { color: colors.text }]}>Coordonnées GPS <Text style={styles.required}>*</Text></Text>
          <View style={styles.coordinatesRow}>
            <View style={styles.coordinateInput}>
              <Text style={[styles.coordinateLabel, { color: colors.textSecondary }]}>Latitude</Text>
              <TextInput
                style={[styles.input, { backgroundColor: colors.background, color: colors.text, borderColor: errors.latitude ? '#8B5CF6' : colors.border }]}
                placeholder="49.4431"
                placeholderTextColor={colors.textSecondary}
                value={latitude?.toString() || ''}
                onChangeText={(text) => {
                  const lat = parseFloat(text);
                  setLatitude(isNaN(lat) ? null : lat);
                  validateField('latitude', text);
                }}
                keyboardType="numeric"
              />
              {errors.latitude ? <Text style={styles.errorText}>{errors.latitude}</Text> : null}
            </View>
            <View style={styles.coordinateInput}>
              <Text style={[styles.coordinateLabel, { color: colors.textSecondary }]}>Longitude</Text>
              <TextInput
                style={[styles.input, { backgroundColor: colors.background, color: colors.text, borderColor: errors.longitude ? '#8B5CF6' : colors.border }]}
                placeholder="1.0993"
                placeholderTextColor={colors.textSecondary}
                value={longitude?.toString() || ''}
                onChangeText={(text) => {
                  const lng = parseFloat(text);
                  setLongitude(isNaN(lng) ? null : lng);
                  validateField('longitude', text);
                }}
                keyboardType="numeric"
              />
              {errors.longitude ? <Text style={styles.errorText}>{errors.longitude}</Text> : null}
            </View>
          </View>
        </Animated.View>

        {/* Tarif */}
        <Animated.View entering={FadeInDown.delay(475)} style={[styles.inputCard, { backgroundColor: colors.surface }]}>
          <Text style={[styles.inputLabel, { color: colors.text }]}>Tarif d'entrée</Text>
          <View style={[styles.inputWithIcon, { backgroundColor: colors.background, borderColor: errors.price ? '#8B5CF6' : colors.border }]}>
            <Text style={[{ color: '#8B5CF6', fontSize: 16, fontWeight: '600' }]}>€</Text>
            <TextInput
              style={[styles.textInput, { backgroundColor: 'transparent', borderWidth: 0, flex: 1, color: colors.text }]}
              placeholder="0 (gratuit)"
              placeholderTextColor={colors.textSecondary}
              value={price}
              onChangeText={(text) => {
                setPrice(text);
                validateField('price', text);
              }}
              keyboardType="numeric"
            />
          </View>
          {errors.price ? <Text style={styles.errorText}>{errors.price}</Text> : null}
        </Animated.View>

        {/* Point d'intérêt */}
        <Animated.View entering={FadeInDown.delay(485)} style={[styles.inputCard, { backgroundColor: colors.surface }]}>
          <Text style={[styles.inputLabel, { color: colors.text }]}>Point d'intérêt principal</Text>
          <TextInput
            style={[styles.input, { backgroundColor: colors.background, color: colors.text, borderColor: colors.border }]}
            placeholder="Ex: Architecture gothique, Vitraux exceptionnels..."
            placeholderTextColor={colors.textSecondary}
            value={pointOfInterest}
            onChangeText={setPointOfInterest}
            maxLength={100}
          />
        </Animated.View>

        {/* Catégorie */}
        <Animated.View entering={FadeInDown.delay(500)} style={[styles.inputCard, { backgroundColor: colors.surface }]}>
          <Text style={[styles.inputLabel, { color: colors.text }]}>Catégorie</Text>
          <TouchableOpacity
            style={[styles.inputWithIcon, { backgroundColor: colors.background, borderColor: colors.border }]}
            onPress={() => setShowCategoryModal(true)}
          >
            <View style={[styles.categoryIndicator, { backgroundColor: selectedCategoryData?.color }]} />
            <Text style={[styles.dateTimeText, { color: colors.text }]}>
              {selectedCategoryData?.label}
            </Text>
          </TouchableOpacity>
        </Animated.View>

        {/* Période historique */}
        <Animated.View entering={FadeInDown.delay(600)} style={[styles.inputCard, { backgroundColor: colors.surface }]}>
          <Text style={[styles.inputLabel, { color: colors.text }]}>Période historique (optionnel)</Text>
          <TextInput
            style={[styles.input, { backgroundColor: colors.background, color: colors.text, borderColor: colors.border }]}
            placeholder="Ex: Moyen Âge, Renaissance, XIXe siècle..."
            placeholderTextColor={colors.textSecondary}
            value={historicalPeriod}
            onChangeText={setHistoricalPeriod}
            maxLength={50}
          />
        </Animated.View>

        {/* Durée de visite */}
        <Animated.View entering={FadeInDown.delay(700)} style={[styles.inputCard, { backgroundColor: colors.surface }]}>
          <Text style={[styles.inputLabel, { color: colors.text }]}>Durée de visite estimée (optionnel)</Text>
          <View style={[styles.inputWithIcon, { backgroundColor: colors.background, borderColor: colors.border }]}>
            <Clock size={16} color="#8B5CF6" strokeWidth={2} />
            <TextInput
              style={[styles.textInput, { backgroundColor: 'transparent', borderWidth: 0, flex: 1, color: colors.text }]}
              placeholder="Ex: 1h30, 45 min..."
              placeholderTextColor={colors.textSecondary}
              value={visitDuration}
              onChangeText={setVisitDuration}
              maxLength={20}
            />
          </View>
        </Animated.View>

        {/* Images */}
        <Animated.View entering={FadeInDown.delay(800)} style={[styles.inputCard, { backgroundColor: colors.surface }]}>
          <Text style={[styles.inputLabel, { color: colors.text }]}>Images <Text style={styles.required}>*</Text></Text>
          <TouchableOpacity
            style={[styles.imagePickerButton, { borderColor: errors.images ? '#8B5CF6' : colors.border }]}
            onPress={pickImage}
          >
            {selectedImage ? (
              <Image source={{ uri: selectedImage }} style={styles.selectedImage} />
            ) : (
              <View style={styles.imagePickerContent}>
                <Camera size={32} color="#8B5CF6" strokeWidth={1.5} />
                <Text style={[styles.imagePickerText, { color: colors.textSecondary }]}>
                  Ajouter une image
                </Text>
              </View>
            )}
          </TouchableOpacity>
          {errors.images ? <Text style={styles.errorText}>{errors.images}</Text> : null}

        </Animated.View>

        {/* Bouton de création */}
        <Animated.View entering={FadeInDown.delay(900)} style={styles.submitSection}>
          <TouchableOpacity
            style={[
              styles.submitButton,
              { backgroundColor: isSubmitting ? colors.textSecondary : '#8B5CF6' }
            ]}
            onPress={handleSubmit}
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <Text style={styles.submitButtonText}>
                {isEditMode ? 'Modifier le monument' : 'Créer le monument'}
              </Text>
            )}
          </TouchableOpacity>
        </Animated.View>

        <View style={styles.bottomSpacing} />
      </ScrollView>

      {/* Modal de sélection de catégorie */}
      <Modal
        visible={showCategoryModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowCategoryModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.surface }]}>
            <Text style={[styles.modalTitle, { color: colors.text }]}>Sélectionner une catégorie</Text>
            {categories.map((cat) => (
              <TouchableOpacity
                key={cat.id}
                style={[
                  styles.categoryOption,
                  { backgroundColor: colors.background },
                  category === cat.id && { backgroundColor: cat.color }
                ]}
                onPress={() => {
                  setCategory(cat.id);
                  setShowCategoryModal(false);
                }}
              >
                <View style={[styles.categoryIndicator, { backgroundColor: cat.color }]} />
                <Text style={[
                  styles.categoryOptionText,
                  { color: colors.text },
                  category === cat.id && { color: '#FFFFFF' }
                ]}>
                  {cat.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
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
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    gap: 16,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#8B5CF6',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#8B5CF6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  inputCard: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  required: {
    color: '#8B5CF6',
  },
  input: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  textArea: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    minHeight: 100,
    textAlignVertical: 'top',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  inputWithIcon: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  textInput: {
    fontSize: 16,
    fontWeight: '500',
  },
  dateTimeText: {
    fontSize: 16,
    flex: 1,
  },
  errorText: {
    color: '#8B5CF6',
    fontSize: 12,
    marginTop: 4,
    fontWeight: '500',
  },
  categoryIndicator: {
    width: 16,
    height: 16,
    borderRadius: 8,
  },
  imagePickerButton: {
    borderWidth: 2,
    borderStyle: 'dashed',
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 120,
  },
  imagePickerContent: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  imagePickerText: {
    fontSize: 16,
    fontWeight: '500',
  },
  imagesContainer: {
    marginTop: 16,
  },
  imageWrapper: {
    position: 'relative',
    marginRight: 12,
  },
  selectedImage: {
    width: '100%',
    height: 120,
    borderRadius: 8,
    resizeMode: 'cover',
  },
  removeImageButton: {
    position: 'absolute',
    top: -8,
    right: -8,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#EF4444',
    alignItems: 'center',
    justifyContent: 'center',
  },
  removeImageText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  submitSection: {
    marginTop: 32,
    marginBottom: 24,
  },
  submitButton: {
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  submitButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '700',
  },
  bottomSpacing: {
    height: 100,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    margin: 20,
    borderRadius: 20,
    padding: 20,
    minWidth: 300,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 20,
    textAlign: 'center',
  },
  categoryOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    marginBottom: 8,
    gap: 12,
  },
  categoryOptionText: {
    fontSize: 16,
    fontWeight: '500',
  },
  suggestionsContainer: {
    marginTop: 8,
    borderRadius: 12,
    maxHeight: 200,
    borderWidth: 1,
    borderColor: 'rgba(139, 92, 246, 0.2)',
  },
  suggestionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    gap: 8,
    borderBottomWidth: 1,
  },
  suggestionText: {
    flex: 1,
    fontSize: 14,
    fontWeight: '500',
  },
  coordinatesContainer: {
    marginTop: 8,
    padding: 8,
    borderRadius: 8,
    backgroundColor: 'rgba(139, 92, 246, 0.1)',
  },
  coordinatesText: {
    fontSize: 12,
    fontStyle: 'italic',
  },
  coordinatesRow: {
    flexDirection: 'row',
    gap: 12,
  },
  coordinateInput: {
    flex: 1,
  },
  coordinateLabel: {
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 8,
  },
});

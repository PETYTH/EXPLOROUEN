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
import { ArrowLeft, MapPin, Calendar, Clock, Users, Euro, Camera, X } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '@/contexts/ThemeContext';
import { useAuth, useUser } from '@clerk/clerk-expo';
import { useRole } from '../hooks/useRole';
import * as ImagePicker from 'expo-image-picker';
import DateTimePicker from '@react-native-community/datetimepicker';
import { handleImageUpload } from '@/services/imageUpload';

export default function CreateActivityScreen() {
  const { colors, isDark } = useTheme();
  const { getToken } = useAuth();
  const { user } = useUser();
  const { isStaff } = useRole();
  const params = useLocalSearchParams();
  
  // Détecter le mode édition
  const isEditMode = params.editMode === 'true';
  const activityId = params.activityId as string;
  const activityData = params.activityData ? JSON.parse(params.activityData as string) : null;

  // Vérifier si l'utilisateur est staff
  if (!isStaff) {
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
            Accès staff requis
          </Text>
          <Text style={[{ fontSize: 14, textAlign: 'center', color: colors.textSecondary }]}>
            Seuls les membres du staff peuvent créer des activités.
          </Text>
        </View>
      </SafeAreaView>
    );
  }
  const [loading, setLoading] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [selectedTime, setSelectedTime] = useState(new Date());
  const [tempDate, setTempDate] = useState(new Date());
  const [tempTime, setTempTime] = useState(new Date());
  const [datePickerType, setDatePickerType] = useState<'date' | 'time'>('date');
  const [showLocationModal, setShowLocationModal] = useState(false);
  const [customLocation, setCustomLocation] = useState('');
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [showTypeModal, setShowTypeModal] = useState(false);
  const [tempType, setTempType] = useState<string>('');
  const [isFree, setIsFree] = useState(false);
  const [addressSuggestions, setAddressSuggestions] = useState<any[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [searchTimeout, setSearchTimeout] = useState<ReturnType<typeof setTimeout> | null>(null);

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    type: 'sport',
    date: '',
    time: '',
    location: '',
    maxParticipants: '',
    duration: '',
    price: '',
    meetingPoint: '',
    requirements: '',
    difficulty: 'Facile',
    category: '',
    latitude: '',
    longitude: '',
  });

  const [errors, setErrors] = useState({
    title: '',
    description: '',
    meetingPoint: '',
    latitude: '',
    longitude: '',
    maxParticipants: '',
    duration: '',
    date: '',
    time: '',
    image: ''
  });

  // Fonctions utilitaires pour formater les dates
  const formatDate = (date: Date) => {
    try {
      if (!date || isNaN(date.getTime())) {
        return '';
      }
      const day = date.getDate().toString().padStart(2, '0');
      const month = (date.getMonth() + 1).toString().padStart(2, '0');
      const year = date.getFullYear();
      return `${day}/${month}/${year}`;
    } catch (error) {
      console.error('Erreur formatDate:', error);
      return '';
    }
  };

  const formatTime = (date: Date) => {
    try {
      if (!date || isNaN(date.getTime())) {
        return '';
      }
      return date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
    } catch (error) {
      console.error('Erreur formatTime:', error);
      return '';
    }
  };

  // Pré-remplir les données en mode édition
  useEffect(() => {
    if (isEditMode && activityData && activityData.id) {
      console.log('Mode édition détecté, données:', activityData);
      
      try {
        // Convertir les données backend vers le format frontend
        const startDate = new Date(activityData.startDate);
        
        // Vérifier que la date est valide
        if (isNaN(startDate.getTime())) {
          console.error('Date invalide:', activityData.startDate);
          return;
        }
        
        // Trouver le type principal à partir du type backend
        const findMainType = (backendType: string) => {
          // Mapper les types backend vers les types frontend
          const backendToFrontendMap: Record<string, string> = {
            'SPORT': 'sport',
            'CULTURAL': 'cultural',
            'NATURE': 'nature',
            'LEISURE': 'leisure',
            'WELLNESS': 'wellness',
            'EVENT': 'event'
          };
          return backendToFrontendMap[backendType] || 'sport';
        };

        setFormData({
          title: activityData.title || '',
          description: activityData.description || '',
          type: findMainType(activityData.type),
          date: formatDate(startDate),
          time: formatTime(startDate),
          location: activityData.meetingPoint || '',
          maxParticipants: activityData.maxParticipants?.toString() || '',
          duration: activityData.duration?.toString() || '',
          price: activityData.price?.toString() || '0',
          meetingPoint: activityData.meetingPoint || '',
          requirements: '', // Exigences non gérées dans le backend actuel
          difficulty: activityData.difficulty === 'EASY' ? 'Facile' :
                     activityData.difficulty === 'MEDIUM' ? 'Modéré' :
                     activityData.difficulty === 'HARD' ? 'Difficile' : 'Facile',
          category: '',
          latitude: activityData.latitude?.toString() || '',
          longitude: activityData.longitude?.toString() || '',
        });
        
        setIsFree(activityData.price === 0 || activityData.price?.toString() === 'Gratuit' || activityData.price?.toString() === '0');

        // Pré-remplir l'image si elle existe
        if (activityData.image) {
          console.log('🖼️ Image existante trouvée:', activityData.image);
          setSelectedImage(activityData.image);
        }

        // Pré-remplir les dates avec vérification
        setSelectedDate(startDate);
        setSelectedTime(startDate);
      } catch (error) {
        console.error('Erreur lors du pré-remplissage des données:', error);
      }
    }
  }, [isEditMode, activityId]);

  const activityTypes = [
    { value: 'sport', label: 'Sportive', color: '#10B981', backendValue: 'SPORT' },
    { value: 'cultural', label: 'Culturelle', color: '#F59E0B', backendValue: 'CULTURAL' },
    { value: 'nature', label: 'Nature', color: '#22C55E', backendValue: 'NATURE' },
    { value: 'leisure', label: 'Loisir', color: '#3B82F6', backendValue: 'LEISURE' },
    { value: 'wellness', label: 'Bien-être', color: '#EC4899', backendValue: 'WELLNESS' },
    { value: 'event', label: 'Événementielle', color: '#1E40AF', backendValue: 'EVENT' }
  ];

  // Synchroniser tempType avec formData.type
  useEffect(() => {
    if (formData.type) {
      setTempType(formData.type);
    }
  }, [formData.type]);

  const suggestedLocations = [
    { name: 'Rouen Centre-ville', lat: '49.4431', lng: '1.0993' },
    { name: 'Jardin des Plantes', lat: '49.4456', lng: '1.0889' },
    { name: 'Cathédrale Notre-Dame', lat: '49.4400', lng: '1.0939' },
    { name: 'Musée des Beaux-Arts', lat: '49.4447', lng: '1.0956' },
    { name: 'Parc de la Vatine', lat: '49.4234', lng: '1.0678' },
    { name: 'Stade Robert Diochon', lat: '49.4167', lng: '1.0833' },
    { name: 'Complexe Sportif Saint-Sever', lat: '49.4289', lng: '1.0822' },
    { name: 'Théâtre des Arts', lat: '49.4425', lng: '1.0978' },
    { name: 'Place du Vieux-Marché', lat: '49.4411', lng: '1.0889' },
    { name: 'Quais de Seine', lat: '49.4378', lng: '1.0944' }
  ];

  const difficulties = ['Facile', 'Modéré', 'Difficile'];

  // Fonction pour rechercher des adresses avec Nominatim (avec debounce)
  const searchAddresses = (query: string) => {
    // Annuler la recherche précédente si elle existe
    if (searchTimeout) {
      clearTimeout(searchTimeout);
    }

    if (query.length < 3) {
      setAddressSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    // Créer un nouveau timeout pour la recherche
    const timeout = setTimeout(async () => {
      try {
        const response = await fetch(
          `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=5&countrycodes=fr&addressdetails=1`,
          {
            headers: {
              'User-Agent': 'ExploRouen/1.0',
              'Accept': 'application/json'
            }
          }
        );

        if (!response.ok) {
          console.error('Erreur API Nominatim:', response.status);
          return;
        }
        
        const data = await response.json();
        
        setAddressSuggestions(data);
        setShowSuggestions(data.length > 0);
      } catch (error) {
        console.error('Erreur recherche adresse:', error);
        setAddressSuggestions([]);
        setShowSuggestions(false);
      }
    }, 800); // Attendre 800ms après la dernière frappe

    setSearchTimeout(timeout);
  };

  // Fonction pour sélectionner une adresse
  const selectAddress = (suggestion: any) => {
    setFormData({
      ...formData,
      meetingPoint: suggestion.display_name,
      latitude: suggestion.lat,
      longitude: suggestion.lon
    });
    setShowSuggestions(false);
  };

  // Fonction pour sélectionner une adresse pour le lieu de l'activité
  const selectAddressForActivity = (suggestion: any) => {
    setFormData({
      ...formData,
      location: suggestion.display_name,
      latitude: suggestion.lat,
      longitude: suggestion.lon
    });
    setShowSuggestions(false);
  };

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [16, 9],
      quality: 0.8,
    });

    if (!result.canceled) {
      const newImageUri = result.assets[0].uri;
      console.log('📸 Nouvelle image sélectionnée:', newImageUri);
      setSelectedImage(newImageUri);
    }
  };


  const handleLocationSelect = (location: { name: string; lat: string; lng: string }) => {
    setFormData({ 
      ...formData, 
      location: location.name,
      latitude: location.lat,
      longitude: location.lng
    });
    setShowLocationModal(false);
  };

  const handleCustomLocationSubmit = () => {
    if (customLocation.trim()) {
      setFormData({ ...formData, location: customLocation.trim() });
      setCustomLocation('');
      setShowLocationModal(false);
    }
  };

  // Fonction de validation et sanitisation
  const sanitizeInput = (input: string): string => {
    return input.trim().replace(/[<>"'&]/g, '');
  };

  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const validateCoordinates = (lat: string, lng: string): boolean => {
    const latNum = parseFloat(lat);
    const lngNum = parseFloat(lng);
    return !isNaN(latNum) && !isNaN(lngNum) && 
           latNum >= -90 && latNum <= 90 && 
           lngNum >= -180 && lngNum <= 180;
  };

  const validateField = (field: string, value: string) => {
    const newErrors = { ...errors };
    
    switch (field) {
      case 'title':
        if (!value.trim()) {
          newErrors.title = 'Le titre est obligatoire';
        } else if (value.trim().length < 5) {
          newErrors.title = 'Le titre doit contenir au moins 5 caractères';
        } else if (value.trim().length > 100) {
          newErrors.title = 'Le titre ne peut pas dépasser 100 caractères';
        } else {
          newErrors.title = '';
        }
        break;
        
      case 'description':
        if (!value.trim()) {
          newErrors.description = 'La description est obligatoire';
        } else if (value.trim().length < 20) {
          newErrors.description = 'La description doit contenir au moins 20 caractères';
        } else if (value.trim().length > 500) {
          newErrors.description = 'La description ne peut pas dépasser 500 caractères';
        } else {
          newErrors.description = '';
        }
        break;
        
      case 'meetingPoint':
        if (!value.trim()) {
          newErrors.meetingPoint = 'Le point de rendez-vous est obligatoire';
        } else if (value.trim().length < 5) {
          newErrors.meetingPoint = 'Le point de rendez-vous doit contenir au moins 5 caractères';
        } else if (value.trim().length > 200) {
          newErrors.meetingPoint = 'Le point de rendez-vous ne peut pas dépasser 200 caractères';
        } else {
          newErrors.meetingPoint = '';
        }
        break;
        
      case 'maxParticipants':
        const maxP = parseInt(value);
        if (!value.trim()) {
          newErrors.maxParticipants = 'Le nombre de participants est obligatoire';
        } else if (isNaN(maxP) || maxP < 2) {
          newErrors.maxParticipants = 'Minimum 2 participants requis';
        } else if (maxP > 1000) {
          newErrors.maxParticipants = 'Maximum 1000 participants autorisés';
        } else {
          newErrors.maxParticipants = '';
        }
        break;
        
      case 'duration':
        const dur = parseInt(value);
        if (!value.trim()) {
          newErrors.duration = 'La durée est obligatoire';
        } else if (isNaN(dur) || dur < 15) {
          newErrors.duration = 'Durée minimum 15 minutes';
        } else if (dur > 480) {
          newErrors.duration = 'Durée maximum 8 heures (480 min)';
        } else {
          newErrors.duration = '';
        }
        break;
        
      case 'latitude':
        const lat = parseFloat(value);
        if (!value.trim()) {
          newErrors.latitude = 'La latitude est obligatoire';
        } else if (isNaN(lat) || lat < -90 || lat > 90) {
          newErrors.latitude = 'Latitude invalide (-90 à 90)';
        } else {
          newErrors.latitude = '';
        }
        break;
        
      case 'longitude':
        const lng = parseFloat(value);
        if (!value.trim()) {
          newErrors.longitude = 'La longitude est obligatoire';
        } else if (isNaN(lng) || lng < -180 || lng > 180) {
          newErrors.longitude = 'Longitude invalide (-180 à 180)';
        } else {
          newErrors.longitude = '';
        }
        break;
        
      case 'date':
        if (!value.trim()) {
          newErrors.date = 'La date est obligatoire';
        } else {
          const selectedDate = new Date(value);
          const today = new Date();
          today.setHours(0, 0, 0, 0);
          if (selectedDate < today) {
            newErrors.date = 'La date doit être dans le futur';
          } else {
            newErrors.date = '';
          }
        }
        break;
        
      case 'time':
        if (!value.trim()) {
          newErrors.time = 'L\'heure est obligatoire';
        } else {
          newErrors.time = '';
        }
        break;
    }
    
    setErrors(newErrors);
  };

  const validateImage = () => {
    const newErrors = { ...errors };
    if (!selectedImage) {
      newErrors.image = 'Une image est obligatoire';
    } else {
      newErrors.image = '';
    }
    setErrors(newErrors);
  };

  const handleSubmit = async () => {
    // Validation des champs obligatoires
    const requiredFields = [
      { field: formData.title, name: 'Titre', min: 5 },
      { field: formData.description, name: 'Description', min: 20 },
      { field: formData.date, name: 'Date' },
      { field: formData.time, name: 'Heure' },
      { field: formData.location, name: 'Lieu' },
      { field: formData.meetingPoint, name: 'Point de rendez-vous', min: 5 },
      { field: formData.latitude, name: 'Latitude' },
      { field: formData.longitude, name: 'Longitude' }
    ];

    for (const { field, name, min } of requiredFields) {
      if (!field || field.trim() === '') {
        Alert.alert('Erreur', `Le champ "${name}" est obligatoire`);
        return;
      }
      if (min && field.trim().length < min) {
        Alert.alert('Erreur', `Le champ "${name}" doit contenir au moins ${min} caractères`);
        return;
      }
    }

    // Validation des coordonnées
    if (!validateCoordinates(formData.latitude, formData.longitude)) {
      Alert.alert('Erreur', 'Les coordonnées GPS ne sont pas valides');
      return;
    }

    // Validation de l'image
    if (!selectedImage) {
      Alert.alert('Erreur', 'Veuillez sélectionner une image pour votre activité');
      return;
    }

    // Validation des champs numériques
    if (formData.maxParticipants && (isNaN(Number(formData.maxParticipants)) || Number(formData.maxParticipants) <= 0)) {
      Alert.alert('Erreur', 'Le nombre de participants doit être un nombre positif');
      return;
    }

    if (formData.price && (isNaN(Number(formData.price)) || Number(formData.price) < 0)) {
      Alert.alert('Erreur', 'Le prix doit être un nombre positif ou zéro');
      return;
    }

    setLoading(true);

    try {
      const token = await getToken();
      if (!token || !user) {
        Alert.alert('Erreur', 'Vous devez être connecté pour créer une activité');
        return;
      }

      // Mapper le type frontend vers le type backend
      const selectedType = activityTypes.find(t => t.value === formData.type);
      const backendType = selectedType?.backendValue || 'WALKING';

      // Mapper la difficulté frontend vers backend
      const mapDifficultyToBackend = (frontendDifficulty: string) => {
        switch (frontendDifficulty) {
          case 'Facile': return 'EASY';
          case 'Modéré': return 'MEDIUM';
          case 'Difficile': return 'HARD';
          default: return 'EASY';
        }
      };

      // Uploader l'image si nécessaire
      let imageUrl = null;
      if (selectedImage) {
        console.log('📤 Upload de l\'image en cours...');
        imageUrl = await handleImageUpload(selectedImage, token);
        if (!imageUrl) {
          Alert.alert('Erreur', 'Impossible d\'uploader l\'image');
          return;
        }
      }

      // Préparer les données pour l'API avec sanitisation
      const activityData = {
        title: sanitizeInput(formData.title),
        description: sanitizeInput(formData.description),
        type: backendType, // Type backend (WALKING, MONUMENT_VISIT, etc.)
        difficulty: mapDifficultyToBackend(formData.difficulty),
        startDate: (() => {
          try {
            // Convertir le format français DD/MM/YYYY vers YYYY-MM-DD
            const [day, month, year] = formData.date.split('/');
            const isoDateString = `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}T${formData.time}:00`;
            const date = new Date(isoDateString);
            if (isNaN(date.getTime())) {
              throw new Error('Date invalide');
            }
            return date.toISOString();
          } catch (error) {
            console.error('Erreur conversion date:', error);
            throw new Error('Format de date invalide');
          }
        })(),
        duration: parseInt(formData.duration) || 60,
        meetingPoint: sanitizeInput(formData.meetingPoint),
        maxParticipants: parseInt(formData.maxParticipants) || 10,
        latitude: parseFloat(formData.latitude),
        longitude: parseFloat(formData.longitude),
        image: imageUrl || undefined,
        requirements: formData.requirements ? sanitizeInput(formData.requirements) : undefined,
        organizerName: user?.fullName || user?.firstName || 'Utilisateur',
        organizerAvatar: user?.imageUrl,
        organizerRating: 4.5
      };

      // Debug: Afficher les données envoyées
      console.log('📤 Données envoyées à l\'API:', JSON.stringify(activityData, null, 2));

      const API_URL = process.env.EXPO_PUBLIC_URL_BACKEND || 'http://localhost:5000/api';
      // Appel API pour créer ou modifier l'activité
      const url = isEditMode 
        ? `${API_URL}/activities/${activityId}`
        : `${API_URL}/activities`;
      
      const method = isEditMode ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method: method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(activityData),
      });

      if (response.ok) {
        Alert.alert(
          'Succès !',
          isEditMode 
            ? 'Votre activité a été modifiée avec succès.'
            : 'Votre activité a été créée avec succès.',
          [
            { text: 'OK', onPress: () => router.back() }
          ]
        );
      } else {
        const errorData = await response.json().catch(() => ({ message: 'Erreur inconnue' }));
        if (__DEV__) {
          console.warn('Erreur backend:', errorData);
        }

        // Gestion spécifique de l'erreur de date
        const isDateError = errorData.errors?.some((err: any) => 
          err.type === 'date.greater' || 
          (err.message && err.message.includes('startDate') && err.message.includes('greater than'))
        );

        // Gestion spécifique de l'erreur de participants max
        const isMaxParticipantsError = errorData.errors?.some((err: any) => 
          (err.type === 'number.max' && (err.path?.includes('maxParticipants') || err.message?.includes('maxParticipants'))) ||
          (err.message && err.message.includes('maxParticipants') && err.message.includes('less than or equal to'))
        );

        // Gestion spécifique de l'erreur de type d'activité
        const isTypeError = errorData.errors?.some((err: any) => 
          err.type === 'any.only' && (err.path?.includes('type') || err.message?.includes('type'))
        );

        if (isDateError) {
          Alert.alert(
            'Date invalide',
            'La date de l\'activité est antérieure à aujourd\'hui. Veuillez choisir une date future.'
          );
        } else if (isMaxParticipantsError) {
          Alert.alert(
            'Nombre de participants invalide',
            'Le nombre de participants dépasse la limite autorisée (1000).'
          );
        } else if (isTypeError) {
          Alert.alert(
            'Type d\'activité manquant',
            'Veuillez sélectionner un type d\'activité (Marche, Course, Musée, etc.).'
          );
        } else {
          Alert.alert(
            'Erreur',
            errorData.message || `Impossible de ${isEditMode ? 'modifier' : 'créer'} l'activité. Veuillez réessayer.`
          );
        }
      }
    } catch (error: any) {
      if (__DEV__) {
        console.warn('Erreur création:', error);
      }
      
      let errorMessage = 'Erreur de connexion au serveur';
      if (error?.code === 'TIMEOUT') {
        errorMessage = 'La requête a pris trop de temps. Vérifiez votre connexion et réessayez.';
      } else if (error?.message?.includes('Network')) {
        errorMessage = 'Erreur réseau. Vérifiez votre connexion Internet.';
      }
      
      Alert.alert('Erreur', errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      {/* Image de fond plein écran */}
      <Image 
        source={require('../assets/images/cathedrale-rouen.jpg')}
        style={styles.backgroundImage}
      />
      
      {/* Dark Overlay */}
      <View style={styles.darkOverlay} />
      
      <View style={[styles.safeArea, { backgroundColor: 'transparent' }]}>
        {/* Header */}
        <View style={[styles.header, { backgroundColor: 'transparent' }]}>
          <TouchableOpacity onPress={() => router.back()} style={[styles.backButton, { backgroundColor: colors.buttonPrimary }]}>
            <ArrowLeft size={20} color="#FFFFFF" strokeWidth={2} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: '#FFFFFF' }]}>
            {isEditMode ? 'Modifier l\'activité' : 'Créer une activité'}
          </Text>
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Titre */}
        <View style={[styles.inputCard, { backgroundColor: colors.surface }]}>
          <Text style={[styles.inputLabel, { color: colors.text }]}>Titre <Text style={styles.required}>*</Text></Text>
          <TextInput
            style={[styles.input, { backgroundColor: colors.background, color: colors.text, borderColor: errors.title ? colors.buttonPrimary : colors.border }]}
            placeholder="Nom de votre activité"
            placeholderTextColor={colors.textSecondary}
            value={formData.title}
            onChangeText={(text) => {
              setFormData({ ...formData, title: text });
              validateField('title', text);
            }}
          />
          {errors.title ? <Text style={styles.errorText}>{errors.title}</Text> : null}
        </View>

        {/* Description */}
        <View style={[styles.inputCard, { backgroundColor: colors.surface }]}>
          <Text style={[styles.inputLabel, { color: colors.text }]}>Description <Text style={styles.required}>*</Text></Text>
          <TextInput
            style={[styles.textArea, { backgroundColor: colors.background, color: colors.text, borderColor: errors.description ? colors.buttonPrimary : colors.border }]}
            placeholder="Décrivez votre activité en détail (minimum 20 caractères)"
            placeholderTextColor={colors.textSecondary}
            value={formData.description}
            onChangeText={(text) => {
              setFormData({ ...formData, description: text });
              validateField('description', text);
            }}
            multiline
            numberOfLines={4}
          />
          {errors.description ? <Text style={styles.errorText}>{errors.description}</Text> : null}
        </View>

        {/* Date */}
        <View style={[styles.inputCard, { backgroundColor: colors.surface }]}>
          <Text style={[styles.inputLabel, { color: colors.text }]}>Date <Text style={styles.required}>*</Text></Text>
          <TouchableOpacity
            style={[styles.inputWithIcon, { backgroundColor: colors.background, borderColor: colors.border }]}
            onPress={() => {
              setDatePickerType('date');
              setTempDate(selectedDate);
              setShowDatePicker(true);
            }}
          >
            <Calendar size={16} color={colors.buttonPrimary} strokeWidth={2} />
            <Text style={[styles.dateTimeText, { color: formData.date ? colors.text : colors.textSecondary }]}>
              {formData.date || 'JJ/MM/AAAA'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Heure */}
        <View style={[styles.inputCard, { backgroundColor: colors.surface }]}>
          <Text style={[styles.inputLabel, { color: colors.text }]}>Heure <Text style={styles.required}>*</Text></Text>
          <TouchableOpacity
            style={[styles.inputWithIcon, { backgroundColor: colors.background, borderColor: colors.border }]}
            onPress={() => {
              setDatePickerType('time');
              setTempTime(selectedTime);
              setShowDatePicker(true);
            }}
          >
            <Clock size={16} color={colors.buttonPrimary} strokeWidth={2} />
            <Text style={[styles.dateTimeText, { color: formData.time ? colors.text : colors.textSecondary }]}>
              {formData.time || 'HH:MM'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Lieu */}
        <View style={[styles.inputCard, { backgroundColor: colors.surface }]}>
          <Text style={[styles.inputLabel, { color: colors.text }]}>Lieu <Text style={styles.required}>*</Text></Text>
          <View style={[styles.inputWithIcon, { backgroundColor: colors.background, borderColor: errors.meetingPoint ? '#EF4444' : colors.border }]}>
            <MapPin size={16} color={colors.buttonPrimary} strokeWidth={2} />
            <TextInput
              style={[styles.textInput, { backgroundColor: 'transparent', borderWidth: 0, flex: 1, color: colors.text }]}
              placeholder="Ex: Place de la Cathédrale, 76000 Rouen"
              placeholderTextColor={colors.textSecondary}
              value={formData.location}
              onChangeText={(text) => {
                setFormData({ ...formData, location: text });
                searchAddresses(text);
              }}
              maxLength={200}
            />
          </View>
          
          {/* Suggestions d'adresses */}
          {showSuggestions && addressSuggestions.length > 0 && (
            <View style={[styles.suggestionsContainer, { backgroundColor: colors.surface }]}>
              <FlatList
                data={addressSuggestions}
                keyExtractor={(item, index) => index.toString()}
                renderItem={({ item }) => (
                  <TouchableOpacity
                    style={[styles.suggestionItem, { borderBottomColor: colors.border }]}
                    onPress={() => selectAddressForActivity(item)}
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
          {formData.latitude && formData.longitude && (
            <View style={styles.coordinatesContainer}>
              <Text style={[styles.coordinatesText, { color: colors.textSecondary }]}>
                📍 {parseFloat(formData.latitude).toFixed(6)}, {parseFloat(formData.longitude).toFixed(6)}
              </Text>
            </View>
          )}
        </View>

        {/* Coordonnées GPS */}
        <View style={[styles.inputCard, { backgroundColor: colors.surface }]}>
          <Text style={[styles.inputLabel, { color: colors.text }]}>Coordonnées GPS <Text style={styles.required}>*</Text></Text>
          <View style={styles.coordinatesRow}>
            <View style={styles.coordinateInput}>
              <Text style={[styles.coordinateLabel, { color: colors.textSecondary }]}>Latitude</Text>
              <TextInput
                style={[styles.input, { backgroundColor: colors.background, color: colors.text, borderColor: errors.latitude ? '#EF4444' : colors.border }]}
                placeholder="49.4431"
                placeholderTextColor={colors.textSecondary}
                value={formData.latitude}
                onChangeText={(text) => {
                  setFormData({ ...formData, latitude: text });
                  validateField('latitude', text);
                }}
                keyboardType="numeric"
              />
              {errors.latitude ? <Text style={styles.errorText}>{errors.latitude}</Text> : null}
            </View>
            <View style={styles.coordinateInput}>
              <Text style={[styles.coordinateLabel, { color: colors.textSecondary }]}>Longitude</Text>
              <TextInput
                style={[styles.input, { backgroundColor: colors.background, color: colors.text, borderColor: errors.longitude ? '#EF4444' : colors.border }]}
                placeholder="1.0993"
                placeholderTextColor={colors.textSecondary}
                value={formData.longitude}
                onChangeText={(text) => {
                  setFormData({ ...formData, longitude: text });
                  validateField('longitude', text);
                }}
                keyboardType="numeric"
              />
              {errors.longitude ? <Text style={styles.errorText}>{errors.longitude}</Text> : null}
            </View>
          </View>
        </View>

        {/* Participants max */}
        <View style={[styles.smallInputCard, { backgroundColor: colors.surface }]}>
          <Text style={[styles.inputLabel, { color: colors.text }]}>Participants max</Text>
          <View style={[styles.inputWithIcon, { backgroundColor: colors.background, borderColor: colors.border }]}>
            <Users size={16} color="#1E40AF" strokeWidth={2} />
            <TextInput
              style={[styles.textInput, { backgroundColor: 'transparent', borderWidth: 0, flex: 1, color: colors.text }]}
              placeholder="20"
              placeholderTextColor={colors.textSecondary}
              value={formData.maxParticipants}
              onChangeText={(text) => setFormData({ ...formData, maxParticipants: text })}
              keyboardType="numeric"
            />
          </View>
        </View>

        {/* Prix */}
        <View style={[styles.smallInputCard, { backgroundColor: colors.surface }]}>
          <Text style={[styles.inputLabel, { color: colors.text }]}>Prix (€)</Text>
          
          {/* Case à cocher Gratuit */}
          <TouchableOpacity 
            style={styles.checkboxContainer}
            onPress={() => {
              setIsFree(!isFree);
              if (!isFree) {
                setFormData({ ...formData, price: '0' });
              }
            }}
          >
            <View style={[styles.checkbox, { borderColor: colors.border }]}>
              {isFree && (
                <View style={[styles.checkboxChecked, { backgroundColor: '#1E40AF' }]} />
              )}
            </View>
            <Text style={[styles.checkboxLabel, { color: colors.text }]}>Gratuit</Text>
          </TouchableOpacity>

          {/* Champ de saisie du prix */}
          {!isFree && (
            <View style={[styles.inputWithIcon, { backgroundColor: colors.background, borderColor: colors.border }]}>
              <Euro size={16} color="#1E40AF" strokeWidth={2} />
              <TextInput
                style={[styles.textInput, { backgroundColor: 'transparent', borderWidth: 0, flex: 1, color: colors.text }]}
                placeholder="Ex: 15"
                placeholderTextColor={colors.textSecondary}
                value={formData.price}
                onChangeText={(text) => setFormData({ ...formData, price: text })}
                keyboardType="decimal-pad"
              />
            </View>
          )}
        </View>

        {/* Type d'activité */}
        <View style={[styles.inputCard, { backgroundColor: colors.surface }]}>
          <Text style={[styles.inputLabel, { color: colors.text }]}>Type d'activité <Text style={styles.required}>*</Text></Text>
          <TouchableOpacity
            style={[styles.inputWithIcon, { backgroundColor: colors.background, borderColor: colors.border }]}
            onPress={() => {
              setTempType(formData.type);
              setShowTypeModal(true);
            }}
          >
            <View style={[styles.categoryIndicator, { backgroundColor: activityTypes.find(t => t.value === formData.type)?.color }]} />
            <Text style={[styles.dateTimeText, { color: colors.text }]}>
              {activityTypes.find(t => t.value === formData.type)?.label}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Difficulté */}
        <View style={[styles.inputCard, { backgroundColor: colors.surface }]}>
          <Text style={[styles.inputLabel, { color: colors.text }]}>Difficulté <Text style={styles.required}>*</Text></Text>
          <View style={styles.categoriesGrid}>
            {difficulties.map((difficulty) => (
              <TouchableOpacity
                key={difficulty}
                style={[
                  styles.categoryButton,
                  formData.difficulty === difficulty && styles.categoryButtonActive,
                  { borderColor: colors.border }
                ]}
                onPress={() => setFormData({ ...formData, difficulty })}
              >
                <Text style={[
                  styles.categoryText,
                  { color: colors.text },
                  formData.difficulty === difficulty && styles.categoryTextActive
                ]}>
                  {difficulty}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Durée */}
        <View style={[styles.smallInputCard, { backgroundColor: colors.surface }]}>
          <Text style={[styles.inputLabel, { color: colors.text }]}>Durée</Text>
          
          <View style={styles.durationContainer}>
            {['20 min', '30 min', '1h', '2h'].map((duration) => (
              <TouchableOpacity
                key={duration}
                style={[
                  styles.durationButton,
                  { borderColor: colors.border, backgroundColor: colors.background },
                  formData.duration === duration && { backgroundColor: '#1E40AF', borderColor: '#1E40AF' }
                ]}
                onPress={() => setFormData({ ...formData, duration: duration })}
              >
                <Text style={[
                  styles.durationButtonText, 
                  { color: colors.text },
                  formData.duration === duration && { color: '#FFFFFF' }
                ]}>
                  {duration}
                </Text>
              </TouchableOpacity>
            ))}
            
            <TouchableOpacity
              style={[
                styles.durationButton,
                { borderColor: colors.border, backgroundColor: colors.background },
                !['20 min', '30 min', '1h', '2h'].includes(formData.duration) && { backgroundColor: '#1E40AF', borderColor: '#1E40AF' }
              ]}
              onPress={() => {
                if (['20 min', '30 min', '1h', '2h'].includes(formData.duration)) {
                  setFormData({ ...formData, duration: '' });
                }
              }}
            >
              <Text style={[
                styles.durationButtonText, 
                { color: colors.text },
                !['20 min', '30 min', '1h', '2h'].includes(formData.duration) && { color: '#FFFFFF' }
              ]}>
                Autre
              </Text>
            </TouchableOpacity>
          </View>

          {(!['20 min', '30 min', '1h', '2h'].includes(formData.duration)) && (
            <View style={[styles.inputWithIcon, { backgroundColor: colors.background, borderColor: colors.border }]}>
              <Clock size={16} color={colors.buttonPrimary} strokeWidth={2} />
              <TextInput
                style={[styles.textInput, { backgroundColor: 'transparent', borderWidth: 0, flex: 1, color: colors.text }]}
                placeholder="Ex: 45 min"
                placeholderTextColor={colors.textSecondary}
                value={formData.duration}
                onChangeText={(text) => setFormData({ ...formData, duration: text })}
              />
            </View>
          )}
        </View>

        {/* Point de rendez-vous */}
        <View style={[styles.smallInputCard, { backgroundColor: colors.surface }]}>
          <Text style={[styles.inputLabel, { color: colors.text }]}>Point de rendez-vous <Text style={styles.required}>*</Text></Text>
          <View style={[styles.inputWithIcon, { backgroundColor: colors.background, borderColor: errors.meetingPoint ? '#EF4444' : colors.border }]}>
            <MapPin size={16} color="#1E40AF" strokeWidth={2} />
            <TextInput
              style={[styles.textInput, { backgroundColor: 'transparent', borderWidth: 0, flex: 1, color: colors.text }]}
              placeholder="Ex: Devant la cathédrale, à côté de la pharmacie..."
              placeholderTextColor={colors.textSecondary}
              value={formData.meetingPoint}
              onChangeText={(text) => setFormData({ ...formData, meetingPoint: text })}
            />
          </View>
          {errors.meetingPoint ? <Text style={styles.errorText}>{errors.meetingPoint}</Text> : null}
          
          {/* Coordonnées affichées */}
        </View>

        {/* Prérequis */}
        <View style={[styles.smallInputCard, { backgroundColor: colors.surface }]}>
          <Text style={[styles.inputLabel, { color: colors.text }]}>Prérequis</Text>
          <TextInput
            style={[styles.textArea, { backgroundColor: colors.background, color: colors.text, borderColor: colors.border }]}
            placeholder="Équipements nécessaires, niveau requis..."
            placeholderTextColor={colors.textSecondary}
            value={formData.requirements}
            onChangeText={(text) => setFormData({ ...formData, requirements: text })}
            multiline
            numberOfLines={3}
          />
        </View>

        {/* Image */}
        <View style={[styles.inputCard, { backgroundColor: colors.surface }]}>
          <Text style={[styles.inputLabel, { color: colors.text }]}>Image <Text style={styles.required}>*</Text></Text>
          <TouchableOpacity
            style={[styles.imagePickerButton, { borderColor: colors.border }]}
            onPress={pickImage}
          >
            {selectedImage ? (
              <Image source={{ uri: selectedImage }} style={styles.selectedImage} />
            ) : (
              <View style={styles.imagePickerContent}>
                <Camera size={32} color={colors.buttonPrimary} strokeWidth={1.5} />
                <Text style={[styles.imagePickerText, { color: colors.textSecondary }]}>
                  Ajouter une image
                </Text>
              </View>
            )}
          </TouchableOpacity>
        </View>

        {/* Submit Button */}
        <View style={styles.submitSection}>
          <TouchableOpacity 
            style={[styles.submitButton, { backgroundColor: loading ? '#666' : colors.buttonPrimary }]}
            onPress={handleSubmit}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text style={styles.submitButtonText}>
                {isEditMode ? 'Modifier l\'activité' : 'Créer l\'activité'}
              </Text>
            )}
          </TouchableOpacity>
        </View>

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

      {/* Date/Time Picker Modal */}
      <Modal
        visible={showDatePicker}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowDatePicker(false)}
        >
          <View style={{
            flex: 1,
            backgroundColor: 'rgba(0,0,0,0.5)',
            justifyContent: 'center',
            alignItems: 'center'
          }}>
            <View style={{
              backgroundColor: colors.surface,
              borderRadius: 20,
              padding: 20,
              margin: 20,
              minWidth: 300,
              maxWidth: '90%'
            }}>
            <Text style={{
              fontSize: 18,
              fontWeight: 'bold',
              marginBottom: 20,
              textAlign: 'center',
              color: colors.text
            }}>
              {datePickerType === 'date' ? 'Sélectionner la date' : 'Sélectionner l\'heure'}
            </Text>
            
            <DateTimePicker
              value={datePickerType === 'date' ? tempDate : tempTime}
              mode={datePickerType}
              display="spinner"
              minimumDate={datePickerType === 'date' ? new Date() : undefined}
              onChange={(event, selectedValue) => {
                if (selectedValue) {
                  if (datePickerType === 'date') {
                    setTempDate(selectedValue);
                  } else {
                    setTempTime(selectedValue);
                  }
                }
              }}
              textColor={isDark ? "white" : "#000000"}
              style={{ alignSelf: 'center' }}
            />
            
            <View style={{
              flexDirection: 'row',
              justifyContent: 'space-around',
              marginTop: 20,
              gap: 12
            }}>
              <TouchableOpacity
                style={{
                  flex: 1,
                  backgroundColor: colors.border,
                  paddingHorizontal: 20,
                  paddingVertical: 12,
                  borderRadius: 10
                }}
                onPress={() => {
                  setShowDatePicker(false);
                  // Réinitialiser les valeurs temporaires
                  if (datePickerType === 'date') {
                    setTempDate(selectedDate);
                  } else {
                    setTempTime(selectedTime);
                  }
                }}
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
                  flex: 1,
                  backgroundColor: colors.buttonPrimary,
                  paddingHorizontal: 20,
                  paddingVertical: 12,
                  borderRadius: 10
                }}
                onPress={() => {
                  if (datePickerType === 'date') {
                    setSelectedDate(tempDate);
                    setFormData({ ...formData, date: formatDate(tempDate) });
                  } else {
                    setSelectedTime(tempTime);
                    setFormData({ ...formData, time: formatTime(tempTime) });
                  }
                  setShowDatePicker(false);
                }}
              >
                <Text style={{
                  color: '#FFFFFF',
                  textAlign: 'center',
                  fontWeight: '600'
                }}>
                  Confirmer
                </Text>
              </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>

        {/* Location Picker Modal */}
        <Modal
          visible={showLocationModal}
          transparent={true}
          animationType="slide"
          onRequestClose={() => setShowLocationModal(false)}
        >
          <View style={{
            flex: 1,
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
              maxHeight: '80%',
              minWidth: 300
            }}>
            <Text style={{
              fontSize: 18,
              fontWeight: 'bold',
              marginBottom: 20,
              textAlign: 'center',
              color: colors.text
            }}>
              Sélectionner un lieu
            </Text>
            
            <ScrollView style={{ maxHeight: 350 }} showsVerticalScrollIndicator={false}>
              {suggestedLocations.map((location, index) => (
                <TouchableOpacity
                  key={index}
                  style={[
                    styles.locationOptionCompact,
                    { backgroundColor: colors.surface }
                  ]}
                  onPress={() => handleLocationSelect(location)}
                  activeOpacity={0.7}
                >
                  <View style={styles.locationContent}>
                    <Text style={[styles.locationNameCompact, { color: colors.text }]}>
                      {location.name}
                    </Text>
                    <View style={styles.coordinatesContainer}>
                      <Text style={[styles.coordinatesCompact, { color: colors.text + '60' }]}>
                        📍 {location.lat}, {location.lng}
                      </Text>
                    </View>
                  </View>
                </TouchableOpacity>
              ))}
            </ScrollView>
            
            <View style={styles.customLocationSection}>
              <Text style={[styles.customLocationLabel, { color: colors.text }]}>
                Ou saisir un autre lieu :
              </Text>
              <TextInput
                style={[
                  styles.customLocationInput,
                  {
                    borderColor: colors.border,
                    color: colors.text,
                    backgroundColor: colors.surface
                  }
                ]}
                placeholder="Saisir un lieu personnalisé"
                placeholderTextColor={colors.textSecondary}
                value={customLocation}
                onChangeText={setCustomLocation}
              />
            </View>
            
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton, { backgroundColor: colors.border }]}
                onPress={() => setShowLocationModal(false)}
                activeOpacity={0.8}
              >
                <Text style={[styles.buttonText, { color: colors.text }]}>
                  Annuler
                </Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[styles.modalButton, styles.confirmButton]}
                onPress={() => handleCustomLocationSubmit()}
                activeOpacity={0.8}
              >
                <Text style={[styles.buttonText, { color: 'white' }]}>
                  Valider
                </Text>
              </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>

        {/* Modal de sélection de type */}
        <Modal
          visible={showTypeModal}
          animationType="slide"
          transparent={true}
          onRequestClose={() => setShowTypeModal(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={[styles.modalContent, { backgroundColor: colors.surface }]}>
            <Text style={[styles.modalTitle, { color: colors.text }]}>Sélectionner un type</Text>
            <ScrollView style={{ maxHeight: 300 }}>
              {activityTypes.map((type) => (
                <TouchableOpacity
                  key={type.value}
                  style={[
                    styles.categoryOption,
                    { backgroundColor: colors.background },
                    tempType === type.value && { backgroundColor: type.color }
                  ]}
                  onPress={() => setTempType(type.value)}
                >
                  <View style={[styles.categoryIndicator, { backgroundColor: type.color }]} />
                  <Text style={[
                    styles.categoryOptionText,
                    { color: colors.text },
                    tempType === type.value && { color: '#FFFFFF' }
                  ]}>
                    {type.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
            
            <View style={styles.modalActions}>
              <TouchableOpacity
                style={[styles.modalButton, { backgroundColor: colors.background, borderWidth: 1, borderColor: colors.border }]}
                onPress={() => setShowTypeModal(false)}
              >
                <Text style={[styles.modalButtonText, { color: colors.text }]}>Annuler</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, { backgroundColor: colors.buttonPrimary }]}
                onPress={() => {
                  setFormData({ ...formData, type: tempType });
                  setShowTypeModal(false);
                }}
              >
                <Text style={[styles.modalButtonText, { color: '#FFFFFF' }]}>Valider</Text>
              </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
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
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
    gap: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  formSection: {
    borderRadius: 20,
    padding: 20,
    marginBottom: 24,
  },
  inputGroup: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  required: {
    color: '#1E40AF',
  },
  textInput: {
    fontSize: 16,
    fontWeight: '500',
  },
  textArea: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    fontWeight: '500',
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
  rowInputs: {
    flexDirection: 'row',
    gap: 12,
  },
  categoriesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  categoryButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
  },
  categoryButtonActive: {
    backgroundColor: '#1E40AF',
  },
  categoryText: {
    fontSize: 14,
    fontWeight: '600',
  },
  categoryTextActive: {
    color: '#FFFFFF',
  },
  submitSection: {
    marginBottom: 24,
  },
  submitButton: {
    backgroundColor: '#1E40AF',
    borderRadius: 16,
    paddingVertical: 16,
    paddingHorizontal: 24,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 8,
    shadowColor: '#1E40AF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  bottomSpacing: {
    height: 100,
  },
  dateTimeText: {
    fontSize: 16,
    flex: 1,
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
  selectedImage: {
    width: '100%',
    height: 120,
    borderRadius: 8,
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
  errorText: {
    color: '#1E40AF',
    fontSize: 12,
    marginTop: 4,
    fontWeight: '500',
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
  smallInputCard: {
    borderRadius: 10,
    padding: 12,
    marginBottom: 18,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  locationOption: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  locationOptionText: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  coordinatesText: {
    fontSize: 12,
    fontStyle: 'italic',
  },
  locationOptionCompact: {
    padding: 12,
    borderRadius: 8,
    marginBottom: 6,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  locationContent: {
    flexDirection: 'column',
  },
  locationNameCompact: {
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 3,
  },
  coordinatesContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  coordinatesCompact: {
    fontSize: 11,
    fontWeight: '400',
  },
  suggestionsContainer: {
    marginTop: 8,
    borderRadius: 8,
    maxHeight: 200,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    overflow: 'hidden',
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
  },
  customLocationSection: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.1)',
  },
  selectButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    minHeight: 50,
  },
  selectButtonText: {
    fontSize: 16,
    fontWeight: '500',
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
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 20,
    textAlign: 'center',
  },
  closeButton: {
    padding: 8,
  },
  typeOptions: {
    maxHeight: 500,
  },
  typeSection: {
    marginBottom: 24,
  },
  typeSectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 12,
  },
  categoryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  categoryOptionButton: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 1.5,
    marginBottom: 8,
  },
  categoryOptionText: {
    fontSize: 16,
    fontWeight: '500',
  },
  categoryIndicator: {
    width: 16,
    height: 16,
    borderRadius: 8,
  },
  categoryOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    marginBottom: 8,
    gap: 12,
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
    marginTop: 20,
  },
  modalButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  customLocationLabel: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
  },
  customLocationInput: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20,
    gap: 12,
  },
  modalButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: '#6B7280',
  },
  confirmButton: {
    backgroundColor: '#1E40AF',
  },
  buttonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  checkboxContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    paddingVertical: 8,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderWidth: 2,
    borderRadius: 4,
    marginRight: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxChecked: {
    width: 12,
    height: 12,
    borderRadius: 2,
  },
  checkboxLabel: {
    fontSize: 16,
    fontWeight: '500',
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
  durationContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 12,
  },
  durationButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    minWidth: 80,
    alignItems: 'center',
  },
  durationButtonText: {
    fontSize: 14,
    fontWeight: '500',
  },
});
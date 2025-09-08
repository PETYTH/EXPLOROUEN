import React, { useState, useEffect, useRef } from 'react';
import { View, StyleSheet, Alert } from 'react-native';
import { WebView } from 'react-native-webview';
import { useAuth } from '@clerk/clerk-expo';
import { useRouter, useLocalSearchParams } from 'expo-router';
import * as Location from 'expo-location';
import ApiService, { BackendActivity, BackendPlace, BackendMonument } from '@/services/api';

interface MapViewProps {
  monuments?: Array<{
    id: string;
    name: string;
    latitude: number;
    longitude: number;
  }>;
}

export default function MapView() {
  const { getToken } = useAuth();
  const router = useRouter();
  const params = useLocalSearchParams();
  const webViewRef = useRef<WebView>(null);
  const [monuments, setMonuments] = useState<BackendMonument[]>([]);
  const [activities, setActivities] = useState<BackendActivity[]>([]);
  const [places, setPlaces] = useState<BackendPlace[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [cachedLocation, setCachedLocation] = useState<{latitude: number, longitude: number} | null>(null);
  const [currentRoute, setCurrentRoute] = useState<any>(null);

  // Fonction pour calculer l'itinéraire
  const calculateRoute = async (destination: {latitude: number, longitude: number}, destinationType: string, destinationId: string) => {
    // Toujours demander la position utilisateur automatiquement
    const position = await requestLocationPermission();
    if (!position) {
      Alert.alert(
        'Position requise',
        'Nous avons besoin de votre position pour calculer l\'itinéraire.',
        [{ text: 'OK' }]
      );
      return;
    }
    
    // Mettre à jour le cache avec la position actuelle
    setCachedLocation(position);
    const userLocation = position;

    // Calculer les itinéraires pour tous les modes de transport
    const routes = await Promise.all([
      getRoute(userLocation, destination, 'driving'),
      getRoute(userLocation, destination, 'walking'),
      getRoute(userLocation, destination, 'transit')
    ]);

    const routeData = {
      driving: routes[0],
      walking: routes[1],
      transit: routes[2],
      destination,
      destinationType,
      destinationId
    };

    setCurrentRoute(routeData);

    // Envoyer les données d'itinéraire à la WebView
    if (webViewRef.current) {
      webViewRef.current.postMessage(JSON.stringify({
        type: 'routeCalculated',
        routeData
      }));
    }
  };

  // Fonction pour obtenir un itinéraire avec calculs réalistes par mode de transport
  const getRoute = async (start: {latitude: number, longitude: number}, end: {latitude: number, longitude: number}, profile: string) => {
    try {
      // Calculer la distance à vol d'oiseau pour les estimations
      const distance = getDistanceFromLatLonInKm(start.latitude, start.longitude, end.latitude, end.longitude);
      
      if (profile === 'driving') {
        // Utiliser OSRM pour la voiture (le plus précis)
        const baseUrl = `https://router.project-osrm.org/route/v1/driving`;
        const coords = `${start.longitude},${start.latitude};${end.longitude},${end.latitude}`;
        const url = `${baseUrl}/${coords}?overview=full&geometries=geojson`;

        const response = await fetch(url);
        const data = await response.json();

        if (data.routes && data.routes[0]) {
          const route = data.routes[0];
          return {
            duration: Math.round(route.duration / 60), // en minutes
            distance: Math.round(route.distance / 1000 * 10) / 10, // en km
            geometry: route.geometry.coordinates,
            profile
          };
        }
      } else if (profile === 'walking') {
        // Estimation marche : 5 km/h en moyenne
        const walkingSpeed = 5; // km/h
        const walkingDistance = distance * 1.3; // +30% pour les détours
        const walkingDuration = Math.round((walkingDistance / walkingSpeed) * 60); // en minutes
        
        return {
          duration: walkingDuration,
          distance: walkingDistance,
          geometry: [[start.longitude, start.latitude], [end.longitude, end.latitude]], // Ligne droite simplifiée
          profile
        };
      } else if (profile === 'transit') {
        // Estimation transport en commun : 25 km/h en moyenne + temps d'attente
        const transitSpeed = 25; // km/h
        const transitDistance = distance * 1.2; // +20% pour les détours
        const transitDuration = Math.round((transitDistance / transitSpeed) * 60) + 10; // +10 min d'attente
        
        return {
          duration: transitDuration,
          distance: transitDistance,
          geometry: [[start.longitude, start.latitude], [end.longitude, end.latitude]], // Ligne droite simplifiée
          profile
        };
      }
      
      return null;
    } catch (error) {
      console.error(`Erreur calcul itinéraire ${profile}:`, error);
      return null;
    }
  };

  // Fonction pour calculer la distance entre deux points
  const getDistanceFromLatLonInKm = (lat1: number, lon1: number, lat2: number, lon2: number) => {
    const R = 6371; // Rayon de la Terre en km
    const dLat = deg2rad(lat2 - lat1);
    const dLon = deg2rad(lon2 - lon1);
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) * 
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    const d = R * c; // Distance en km
    return d;
  };

  const deg2rad = (deg: number) => {
    return deg * (Math.PI/180);
  };

  // Fonction pour demander la permission et obtenir la position
  const requestLocationPermission = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      
      if (status !== 'granted') {
        Alert.alert(
          'Permission refusée',
          'Pour utiliser cette fonctionnalité, veuillez autoriser l\'accès à votre position dans les paramètres de l\'application.',
          [{ text: 'OK' }]
        );
        return null;
      }

      // Essayer d'abord avec la dernière position connue (plus rapide)
      const lastKnownPosition = await Location.getLastKnownPositionAsync({
        maxAge: 60000, // Position de moins d'1 minute
        requiredAccuracy: 100, // Précision de 100m acceptable
      });

      if (lastKnownPosition) {
        return {
          latitude: lastKnownPosition.coords.latitude,
          longitude: lastKnownPosition.coords.longitude,
        };
      }

      // Si pas de position récente, obtenir la position actuelle avec paramètres optimisés
      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced, // Plus rapide que High
        timeInterval: 1000,
        distanceInterval: 10,
      });

      return {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      };
    } catch (error) {
      console.error('Erreur lors de l\'obtention de la position:', error);
      Alert.alert(
        'Erreur',
        'Impossible d\'obtenir votre position. Vérifiez que les services de localisation sont activés.',
        [{ text: 'OK' }]
      );
      return null;
    }
  };

  // Charger les données depuis l'API
  useEffect(() => {
    loadMapData();
  }, []);

  // Gérer les paramètres de navigation (itinéraire depuis monument)
  useEffect(() => {
    if (params.monumentId && params.showRoute === 'true' && monuments.length > 0) {
      const monument = monuments.find(m => m.id === params.monumentId);
      if (monument) {
        // Calculer l'itinéraire vers le monument
        calculateRoute(
          { latitude: monument.latitude, longitude: monument.longitude },
          'monument',
          params.monumentId as string
        );
      }
    }
  }, [params, monuments]);

  const loadMapData = async () => {
    setIsLoading(true);
    try {
      const token = await getToken();
      
      // Charger les monuments, activités et lieux en parallèle
      const [monumentsData, activitiesData, placesData] = await Promise.all([
        ApiService.getMonuments(),
        ApiService.getActivities({}, token || undefined),
        ApiService.getPlaces({})
      ]);

      setMonuments(monumentsData);
      setActivities(activitiesData);
      setPlaces(placesData);
      
      // console.log('📍 Données chargées:', {
      //   monuments: monumentsData.length,
      //   activities: activitiesData.length,
      //   places: placesData.length
      // });
    } catch (error) {
      console.error('❌ Erreur lors du chargement des données de la carte:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Convertir les données pour la carte
  const mapMonuments = monuments.map((monument: BackendMonument) => ({
    id: monument.id,
    name: monument.name,
    latitude: monument.latitude,
    longitude: monument.longitude,
    description: monument.description,
    category: monument.category,
    rating: 4.5, // Valeur par défaut
    price: 'Gratuit',
    image: monument.images?.[0] || 'https://via.placeholder.com/300x200'
  }));

  const mapActivities = activities.map((activity: BackendActivity) => ({
    id: activity.id,
    title: activity.title,
    latitude: activity.latitude,
    longitude: activity.longitude,
    description: activity.description,
    type: activity.type,
    date: new Date(activity.startDate).toLocaleDateString('fr-FR'),
    time: new Date(activity.startDate).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
    participants: `${activity.participantsCount}/${activity.maxParticipants}`,
    price: activity.price || 0,
    organizer: activity.organizerName || 'Organisateur',
    image: activity.image || 'https://via.placeholder.com/300x200'
  }));

  // Combiner monuments et lieux pour avoir plus de POI
  const allMapMonuments = [
    ...mapMonuments,
    ...places.map((place: BackendPlace) => ({
      id: place.id,
      name: place.name,
      latitude: place.latitude,
      longitude: place.longitude,
      description: place.description,
      category: place.category,
      rating: place.rating || 4.0,
      price: 'Variable',
      image: place.images?.[0] || 'https://via.placeholder.com/300x200'
    }))
  ];

  // Fonction pour obtenir les coordonnées des activités
  function getActivityCoordinates(location: string) {
    const locationMap: { [key: string]: { latitude: number; longitude: number } } = {
      'Jardins de l\'Hôtel de Ville': { latitude: 49.4415, longitude: 1.0985 },
      'Cathédrale Notre-Dame': { latitude: 49.4404, longitude: 1.0939 },
      'Vieux Rouen': { latitude: 49.4429, longitude: 1.0877 },
      'Quais de Seine': { latitude: 49.4380, longitude: 1.0850 }
    };
    return locationMap[location] || { latitude: 49.4404, longitude: 1.0939 };
  }
  const mapHTML = `
    <!doctype html>
    <html lang="en">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
        <style>
          body {
            margin: 0;
            padding: 0;
            background: #1A1A1A;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          }
          #map {
            height: 100vh;
            width: 100%;
          }
          .monument-marker {
            background: linear-gradient(135deg, #667EEA 0%, #764BA2 100%);
            width: 32px;
            height: 32px;
            border-radius: 50% 50% 50% 0;
            transform: rotate(-45deg);
            border: 3px solid white;
            box-shadow: 0 4px 12px rgba(0,0,0,0.3);
            display: flex;
            align-items: center;
            justify-content: center;
            position: relative;
          }
          .monument-marker::before {
            content: '🏛️';
            transform: rotate(45deg);
            font-size: 14px;
            position: absolute;
          }
          .activity-marker {
            background: linear-gradient(135deg, #10B981 0%, #059669 100%);
            width: 28px;
            height: 28px;
            border-radius: 50%;
            border: 3px solid white;
            box-shadow: 0 4px 12px rgba(0,0,0,0.3);
            display: flex;
            align-items: center;
            justify-content: center;
            position: relative;
          }
          .activity-marker::before {
            content: '🎯';
            font-size: 12px;
            position: absolute;
          }
          .monument-popup, .activity-popup {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            border-radius: 16px;
            overflow: hidden;
            box-shadow: 0 12px 40px rgba(0,0,0,0.25);
            border: none;
            background: transparent;
            backdrop-filter: blur(20px);
            min-width: 250px;
            max-width: 280px;
            position: relative;
          }
          .popup-image {
            width: 100%;
            height: 120px;
            object-fit: cover;
            position: relative;
          }
          .popup-image-overlay {
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: linear-gradient(180deg, rgba(0,0,0,0.1) 0%, rgba(0,0,0,0.4) 100%);
          }
          .popup-header {
            position: absolute;
            bottom: 16px;
            left: 16px;
            right: 16px;
            color: white;
            font-weight: 800;
            font-size: 18px;
            text-shadow: 0 2px 8px rgba(0,0,0,0.5);
            z-index: 2;
          }
          .popup-content {
            padding: 16px;
            background: rgba(40, 40, 40, 0.95);
            backdrop-filter: blur(20px);
          }
          .popup-description {
            color: #CCCCCC;
            font-size: 14px;
            line-height: 1.5;
            margin-bottom: 12px;
            font-weight: 400;
          }
          .popup-meta {
            display: flex;
            flex-wrap: wrap;
            gap: 12px;
            margin-bottom: 16px;
          }
          .popup-meta-item {
            display: flex;
            align-items: center;
            gap: 4px;
            background: rgba(139, 92, 246, 0.2);
            padding: 4px 8px;
            border-radius: 12px;
            font-size: 12px;
            color: #8B5CF6;
            font-weight: 600;
          }
          .activity-popup .popup-meta-item {
            background: rgba(16, 185, 129, 0.2);
            color: #10B981;
          }
          .popup-close {
            position: absolute;
            top: 8px;
            right: 8px;
            width: 32px;
            height: 32px;
            border-radius: 16px;
            border: none;
            background: rgba(40, 40, 40, 0.95);
            color: #8B5CF6;
            font-size: 16px;
            cursor: pointer;
            display: flex;
            align-items: center;
            justify-content: center;
            transition: all 0.2s;
            backdrop-filter: blur(10px);
          }
          .popup-close:hover {
            background: #8B5CF6;
            color: #FFFFFF;
            border-color: #8B5CF6;
            transform: translateY(-1px);
            box-shadow: 0 4px 12px rgba(139, 92, 246, 0.3);
          }
          .popup-actions {
            display: flex;
            gap: 8px;
            margin-top: 8px;
          }
          .popup-button {
            width: auto;
            height: 40px;
            border-radius: 20px;
            border: none;
            background: rgba(40, 40, 40, 0.95);
            color: #8B5CF6;
            font-size: 14px;
            font-weight: 500;
            cursor: pointer;
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 8px;
            padding: 0 16px;
            transition: all 0.2s;
            backdrop-filter: blur(10px);
          }
          .popup-button:hover {
            background: #8B5CF6;
            color: #FFFFFF;
            border-color: #8B5CF6;
            transform: translateY(-1px);
            box-shadow: 0 4px 12px rgba(139, 92, 246, 0.3);
          }
          .popup-button.secondary {
            background: rgba(40, 40, 40, 0.95);
            color: #CCCCCC;
          }
          .popup-button.secondary:hover {
            background: rgba(255,255,255,0.2);
            color: #FFFFFF;
            border-color: #FFFFFF;
            transform: translateY(-1px);
            box-shadow: 0 4px 12px rgba(255, 255, 255, 0.2);
          }
          .leaflet-popup-content-wrapper {
            background: transparent !important;
            border-radius: 16px;
            box-shadow: none;
            padding: 0;
          }
          .leaflet-popup-tip {
            background: rgba(40, 40, 40, 0.95) !important;
          }
          .leaflet-popup-close-button {
            display: none !important;
          }
          .user-location-marker {
            background: #10B981;
            width: 20px;
            height: 20px;
            border-radius: 50%;
            border: 3px solid white;
            box-shadow: 0 2px 8px rgba(0,0,0,0.3);
            animation: pulse 2s infinite;
          }
          @keyframes pulse {
            0% { box-shadow: 0 0 0 0 rgba(16, 185, 129, 0.7); }
            70% { box-shadow: 0 0 0 10px rgba(16, 185, 129, 0); }
            100% { box-shadow: 0 0 0 0 rgba(16, 185, 129, 0); }
          }
          .route-popup {
            background: rgba(40, 40, 40, 0.95);
            color: white;
            padding: 16px;
            border-radius: 16px;
            min-width: 250px;
          }
          .transport-button {
            flex: 1;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            gap: 4px;
            min-height: 60px;
            padding: 8px 12px;
          }
          .transport-icon {
            font-size: 26px;
            line-height: 1;
            width: 26px;
            height: 26px;
          }
          .transport-time {
            font-size: 16px;
            font-weight: 700;
            line-height: 1;
          }
          .transport-unit {
            font-size: 12px;
            opacity: 0.8;
            line-height: 1;
          }
          .route-options {
            display: flex;
            flex-direction: column;
            gap: 12px;
            margin-top: 12px;
          }
          .route-option {
            display: flex;
            align-items: center;
            gap: 12px;
            padding: 8px 12px;
            background: rgba(255, 255, 255, 0.1);
            border-radius: 8px;
          }
          .route-icon {
            font-size: 20px;
            width: 24px;
            text-align: center;
          }
          .route-text {
            font-size: 14px;
            font-weight: 500;
          }
          .search-container {
            position: absolute;
            top: 80px;
            left: 20px;
            right: 200px;
            z-index: 1000;
          }
          .search-input {
            width: 100%;
            height: 52px;
            background: rgba(255,255,255,0.95);
            border: none;
            border-radius: 26px;
            padding: 0 20px 0 54px;
            font-size: 16px;
            box-shadow: 0 4px 16px rgba(0,0,0,0.15);
            backdrop-filter: blur(10px);
            outline: none;
            transition: all 0.3s ease;
          }
          .search-input:focus {
            box-shadow: 0 6px 20px rgba(139, 92, 246, 0.3);
            background: rgba(255,255,255,1);
          }
          .search-icon {
            position: absolute;
            left: 18px;
            top: 50%;
            transform: translateY(-50%);
            font-size: 18px;
            color: #8B5CF6;
            z-index: 10;
          }
          .location-button {
            position: absolute;
            top: 80px;
            right: 20px;
            z-index: 1000;
            width: 52px;
            height: 52px;
            background: rgba(40, 40, 40, 0.95);
            border: none;
            border-radius: 26px;
            display: flex;
            align-items: center;
            justify-content: center;
            cursor: pointer;
            box-shadow: 0 4px 16px rgba(0,0,0,0.15);
            transition: all 0.2s;
            backdrop-filter: blur(10px);
            font-size: 20px;
            color: #8B5CF6;
            transform: rotate(-90deg);
          }
          .location-button:hover {
            background: #8B5CF6;
            color: #FFFFFF;
            transform: rotate(-90deg) translateY(-2px);
            box-shadow: 0 6px 20px rgba(139, 92, 246, 0.4);
          }
          .zoom-controls {
            position: absolute;
            bottom: 200px;
            right: 20px;
            z-index: 1000;
            background: rgba(40, 40, 40, 0.95);
            border-radius: 30px;
            padding: 8px;
            display: flex;
            flex-direction: column;
            gap: 4px;
            backdrop-filter: blur(10px);
            box-shadow: 0 4px 16px rgba(0,0,0,0.15);
          }
          .zoom-button {
            width: 40px;
            height: 40px;
            border-radius: 20px;
            border: none;
            background: transparent;
            color: #CCCCCC;
            font-size: 18px;
            font-weight: bold;
            cursor: pointer;
            display: flex;
            align-items: center;
            justify-content: center;
            transition: all 0.2s;
          }
          .zoom-button:hover {
            background: #8B5CF6;
            color: #FFFFFF;
          }
        </style>
        <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
      </head>
      <body>
        <div id="map"></div>
        

        <div class="search-container">
          <svg class="search-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#8B5CF6" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="11" cy="11" r="8"></circle>
            <path d="m21 21-4.35-4.35"></path>
          </svg>
          <input type="text" class="search-input" placeholder="Rechercher monuments, activités..." onkeyup="searchLocation(this.value)" oninput="searchLocation(this.value)" />
        </div>

        <button class="location-button" onclick="centerOnUser()" title="Ma position">
          ➤
        </button>

        <div class="zoom-controls">
          <button class="zoom-button" onclick="map.zoomIn()" title="Zoom avant">+</button>
          <button class="zoom-button" onclick="map.zoomOut()" title="Zoom arrière">−</button>
        </div>

        <script>
          // Initialiser la carte
          const map = L.map('map', {
            zoomControl: false,
            attributionControl: false
          }).setView([49.4404, 1.0939], 14);

          // Couches de carte - Jawg Maps avec style moderne
          const streetLayer = L.tileLayer('https://tile.jawg.io/jawg-streets/{z}/{x}/{y}{r}.png?access-token=ectBI47DR3lMJDazY2gICDTbFv7jPGqn2Orf1CynWsDm5N3Sg7UhEfBmTjPEzOeJ', {
            attribution: '© Jawg - © OpenStreetMap contributors'
          });

          const satelliteLayer = L.tileLayer('https://tile.jawg.io/jawg-satellite/{z}/{x}/{y}{r}.png?access-token=ectBI47DR3lMJDazY2gICDTbFv7jPGqn2Orf1CynWsDm5N3Sg7UhEfBmTjPEzOeJ', {
            attribution: '© Jawg - © OpenStreetMap contributors'
          });

          let currentLayer = streetLayer;
          currentLayer.addTo(map);

          // Contrôles personnalisés
          L.control.zoom({
            position: 'bottomright'
          }).addTo(map);

          // Position utilisateur
          let userMarker = null;

          function centerOnUser() {
            // Demander la position via React Native
            window.ReactNativeWebView.postMessage(JSON.stringify({
              type: 'requestLocation'
            }));
          }

          // Variables pour l'itinéraire
          let routeLayer = null;
          let routePopup = null;

          // Écouter les messages de React Native
          window.addEventListener('message', function(event) {
            try {
              const data = JSON.parse(event.data);
              if (data.type === 'locationReceived') {
                const lat = data.latitude;
                const lng = data.longitude;
                
                map.setView([lat, lng], 16);
                
                if (userMarker) {
                  map.removeLayer(userMarker);
                }
                
                const userIcon = L.divIcon({
                  className: 'user-location-marker',
                  iconSize: [20, 20],
                  iconAnchor: [10, 10]
                });
                
                userMarker = L.marker([lat, lng], { icon: userIcon })
                  .addTo(map)
                  .bindPopup('<div class="monument-popup"><div class="popup-header">Votre position</div><div class="popup-content">Vous êtes ici</div></div>');
              } else if (data.type === 'routeCalculated') {
                const routeData = data.routeData;
                
                // Supprimer l'ancien itinéraire
                if (routeLayer) {
                  map.removeLayer(routeLayer);
                }
                if (routePopup) {
                  map.closePopup(routePopup);
                }
                
                // Afficher l'itinéraire principal (voiture par défaut)
                const mainRoute = routeData.driving || routeData.walking;
                if (mainRoute && mainRoute.geometry) {
                  const coordinates = mainRoute.geometry.map(coord => [coord[1], coord[0]]);
                  
                  routeLayer = L.polyline(coordinates, {
                    color: '#8B5CF6',
                    weight: 6,
                    opacity: 1,
                    lineJoin: 'round',
                    lineCap: 'round'
                  }).addTo(map);
                  
                  // Ajuster la vue pour montrer tout l'itinéraire
                  map.fitBounds(routeLayer.getBounds(), { padding: [50, 50] });
                }
                
                // Trouver les informations de la destination
                let destinationInfo = null;
                let popupClass = 'monument-popup';
                
                if (routeData.destinationType === 'monument') {
                  destinationInfo = monuments.find(m => m.id === routeData.destinationId);
                  popupClass = 'monument-popup';
                } else if (routeData.destinationType === 'activity') {
                  destinationInfo = activities.find(a => a.id === routeData.destinationId);
                  popupClass = 'activity-popup';
                }

                // Créer le popup avec le même style complet que les monuments/activités
                let popupContent = '<div class="' + popupClass + '">';
                
                if (destinationInfo) {
                  // Image de fond avec overlay et bouton de fermeture
                  if (destinationInfo.image) {
                    popupContent += '<div class="popup-image" style="background-image: url(' + destinationInfo.image + '); background-size: cover; background-position: center;">';
                    popupContent += '<div class="popup-image-overlay"></div>';
                    popupContent += '<div class="popup-header">' + (destinationInfo.name || destinationInfo.title) + '</div>';
                    popupContent += '<button class="popup-close" onclick="map.closePopup()">×</button>';
                    popupContent += '</div>';
                  }
                  
                  // Contenu avec informations
                  popupContent += '<div class="popup-content">';
                  
                  if (routeData.destinationType === 'activity') {
                    popupContent += '<div class="popup-meta">';
                    if (destinationInfo.date) {
                      popupContent += '<div class="popup-meta-item"><svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><path d="M19 3h-1V1h-2v2H8V1H6v2H5c-1.11 0-1.99.9-1.99 2L3 19c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5V8h14v11zM7 10h5v5H7z"/></svg> ' + destinationInfo.date + '</div>';
                    }
                    if (destinationInfo.time) {
                      popupContent += '<div class="popup-meta-item"><svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><path d="M11.99 2C6.47 2 2 6.48 2 12s4.47 10 9.99 10C17.52 22 22 17.52 22 12S17.52 2 11.99 2zM12 20c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8z"/><path d="M12.5 7H11v6l5.25 3.15.75-1.23-4.5-2.67z"/></svg> ' + destinationInfo.time + '</div>';
                    }
                    if (destinationInfo.participants !== undefined) {
                      popupContent += '<div class="popup-meta-item"><svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><path d="M16 4c0-1.11.89-2 2-2s2 .89 2 2-.89 2-2 2-2-.89-2-2zm4 18v-6h2.5l-2.54-7.63A1.5 1.5 0 0 0 18.54 8H17c-.8 0-1.54.37-2.01.99l-.49.74c-.51.76-.49 1.78.03 2.53L16 14v8h4zm-12.5 0h3v-8l1.5-2-1.5-2h-3v12zm1.5-14c1.11 0 2-.89 2-2s-.89-2-2-2-2 .89-2 2 .89 2 2 2z"/></svg> ' + destinationInfo.participants + '</div>';
                    }
                    popupContent += '</div>';
                  }
                  
                  // Description
                  if (destinationInfo.description) {
                    popupContent += '<div class="popup-description">' + destinationInfo.description + '</div>';
                  }
                  
                  // Pour les monuments: meta informations après la description
                  if (routeData.destinationType === 'monument') {
                    popupContent += '<div class="popup-meta">';
                    if (destinationInfo.category) {
                      popupContent += '<div class="popup-meta-item"><svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg> ' + destinationInfo.category + '</div>';
                    }
                    if (destinationInfo.rating) {
                      popupContent += '<div class="popup-meta-item"><svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg> ' + destinationInfo.rating + '</div>';
                    }
                    if (destinationInfo.price) {
                      popupContent += '<div class="popup-meta-item"><svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><path d="M11.8 10.9c-2.27-.59-3-1.2-3-2.15 0-1.09 1.01-1.85 2.7-1.85 1.78 0 2.44.85 2.5 2.1h2.21c-.07-1.72-1.12-3.3-3.21-3.81V3h-3v2.16c-1.94.42-3.5 1.68-3.5 3.61 0 2.31 1.91 3.46 4.7 4.13 2.5.6 3 1.48 3 2.41 0 .69-.49 1.79-2.7 1.79-2.06 0-2.87-.92-2.98-2.1h-2.2c.12 2.19 1.76 3.42 3.68 3.83V21h3v-2.15c1.95-.37 3.5-1.5 3.5-3.55 0-2.84-2.43-3.81-4.7-4.4z"/></svg> ' + destinationInfo.price + '</div>';
                    }
                    popupContent += '</div>';
                  }
                  
                  // Pour les activités: organizer et prix après la description
                  if (routeData.destinationType === 'activity') {
                    popupContent += '<div class="popup-meta">';
                    if (destinationInfo.organizer) {
                      popupContent += '<div class="popup-meta-item"><svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/></svg> ' + destinationInfo.organizer + '</div>';
                    }
                    if (destinationInfo.price) {
                      popupContent += '<div class="popup-meta-item"><svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><path d="M11.8 10.9c-2.27-.59-3-1.2-3-2.15 0-1.09 1.01-1.85 2.7-1.85 1.78 0 2.44.85 2.5 2.1h2.21c-.07-1.72-1.12-3.3-3.21-3.81V3h-3v2.16c-1.94.42-3.5 1.68-3.5 3.61 0 2.31 1.91 3.46 4.7 4.13 2.5.6 3 1.48 3 2.41 0 .69-.49 1.79-2.7 1.79-2.06 0-2.87-.92-2.98-2.1h-2.2c.12 2.19 1.76 3.42 3.68 3.83V21h3v-2.15c1.95-.37 3.5-1.5 3.5-3.55 0-2.84-2.43-3.81-4.7-4.4z"/></svg> ' + destinationInfo.price + '€</div>';
                    }
                    popupContent += '</div>';
                  }
                  
                  // Boutons de temps de transport (remplacent Rejoindre et Itinéraire)
                  popupContent += '<div class="popup-actions">';
                  
                  if (routeData.driving) {
                    popupContent += '<button class="popup-button transport-button">';
                    popupContent += '<svg class="transport-icon" width="26" height="26" viewBox="0 0 24 24" fill="currentColor"><path d="M18.92 6.01C18.72 5.42 18.16 5 17.5 5h-11c-.66 0-1.22.42-1.42 1.01L3 12v8c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-1h12v1c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-8l-2.08-5.99zM6.5 16c-.83 0-1.5-.67-1.5-1.5S5.67 13 6.5 13s1.5.67 1.5 1.5S7.33 16 6.5 16zm11 0c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zM5 11l1.5-4.5h11L19 11H5z"/></svg>';
                    popupContent += '<span class="transport-time">' + routeData.driving.duration + '</span>';
                    popupContent += '<span class="transport-unit">min</span>';
                    popupContent += '</button>';
                  }
                  
                  if (routeData.walking) {
                    popupContent += '<button class="popup-button transport-button secondary">';
                    popupContent += '<svg class="transport-icon" width="26" height="26" viewBox="0 0 24 24" fill="currentColor"><path d="M13.5 5.5c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zM9.8 8.9L7 23h2.1l1.8-8 2.1 2v6h2v-7.5l-2.1-2 .6-3c1.3 1.5 3.3 2.5 5.5 2.5v-2c-1.9 0-3.5-1-4.3-2.4l-1-1.6c-.4-.6-1-1-1.7-1-.3 0-.5.1-.8.1L5 8.3V13h2V9.6l1.8-.7"/></svg>';
                    popupContent += '<span class="transport-time">' + routeData.walking.duration + '</span>';
                    popupContent += '<span class="transport-unit">min</span>';
                    popupContent += '</button>';
                  }
                  
                  if (routeData.transit) {
                    popupContent += '<button class="popup-button transport-button secondary">';
                    popupContent += '<svg class="transport-icon" width="26" height="26" viewBox="0 0 24 24" fill="currentColor"><path d="M4 16c0 .88.39 1.67 1 2.22V20c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-1h8v1c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-1.78c.61-.55 1-1.34 1-2.22V6c0-3.5-3.58-4-8-4s-8 .5-8 4v10zm3.5 1c-.83 0-1.5-.67-1.5-1.5S6.67 14 7.5 14s1.5.67 1.5 1.5S8.33 17 7.5 17zm9 0c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zm1.5-6H6V6h12v5z"/></svg>';
                    popupContent += '<span class="transport-time">' + routeData.transit.duration + '</span>';
                    popupContent += '<span class="transport-unit">min</span>';
                    popupContent += '</button>';
                  }
                  
                  popupContent += '</div>';
                  popupContent += '</div>';
                }
                
                popupContent += '</div>';
                
                // Afficher le popup au centre de l'écran
                const bounds = map.getBounds();
                const center = bounds.getCenter();
                
                routePopup = L.popup({
                  closeButton: false,
                  className: 'custom-popup',
                  offset: [0, 0],
                  autoPan: false
                })
                  .setLatLng(center)
                  .setContent(popupContent)
                  .openOn(map);
                
                // Centrer la vue sur la destination avec focus
                map.setView([routeData.destination.latitude, routeData.destination.longitude], Math.max(map.getZoom(), 15), {
                  animate: true,
                  duration: 0.5
                });

                // Gérer la fermeture du popup et suppression du tracé
                routePopup.on('remove', function() {
                  if (routeLayer) {
                    map.removeLayer(routeLayer);
                    routeLayer = null;
                  }
                });

                // Ajouter un gestionnaire de clic sur la carte pour fermer le popup
                map.on('click', function(e) {
                  if (routePopup && map.hasLayer(routePopup)) {
                    map.closePopup(routePopup);
                  }
                });
              }
            } catch (error) {
              console.error('Erreur lors de la réception des données:', error);
            }
          });

          function searchLocation(query) {
            if (query.length < 2) {
              // Réinitialiser la vue si la recherche est vide
              if (query.length === 0) {
                map.setView([49.4404, 1.0939], 14);
                map.closePopup();
              }
              return;
            }
            
            const searchTerm = query.toLowerCase();
            
            // Rechercher dans les monuments
            const foundMonuments = monuments.filter(monument => 
              monument.name.toLowerCase().includes(searchTerm) ||
              monument.description.toLowerCase().includes(searchTerm) ||
              monument.category.toLowerCase().includes(searchTerm)
            );
            
            // Rechercher dans les activités
            const foundActivities = activities.filter(activity => 
              activity.title.toLowerCase().includes(searchTerm) ||
              activity.description.toLowerCase().includes(searchTerm) ||
              activity.organizer.toLowerCase().includes(searchTerm)
            );
            
            // Prioriser les monuments puis les activités
            if (foundMonuments.length > 0) {
              const monument = foundMonuments[0];
              map.setView([monument.latitude, monument.longitude], 17);
              
              // Trouver et ouvrir le popup du monument
              setTimeout(() => {
                const marker = monumentMarkers.find(m => 
                  Math.abs(m.getLatLng().lat - monument.latitude) < 0.0001 && 
                  Math.abs(m.getLatLng().lng - monument.longitude) < 0.0001
                );
                if (marker) {
                  marker.openPopup();
                }
              }, 500);
              
            } else if (foundActivities.length > 0) {
              const activity = foundActivities[0];
              map.setView([activity.latitude, activity.longitude], 17);
              
              // Trouver et ouvrir le popup de l'activité
              setTimeout(() => {
                const marker = activityMarkers.find(m => 
                  Math.abs(m.getLatLng().lat - activity.latitude) < 0.0001 && 
                  Math.abs(m.getLatLng().lng - activity.longitude) < 0.0001
                );
                if (marker) {
                  marker.openPopup();
                }
              }, 500);
            }
          }

          // Ajouter les marqueurs des monuments
          const monuments = ${JSON.stringify(allMapMonuments)};
          const activities = ${JSON.stringify(mapActivities)};
          const monumentMarkers = [];
          const activityMarkers = [];
          
          monuments.forEach(monument => {
            const monumentIcon = L.divIcon({
              className: 'monument-marker',
              iconSize: [32, 32],
              iconAnchor: [16, 32],
              popupAnchor: [0, -32]
            });
            
            const marker = L.marker([monument.latitude, monument.longitude], { 
              icon: monumentIcon 
            }).addTo(map);
            
            const popupContent = \`
              <div class="monument-popup">
                <div style="position: relative;">
                  <img src="\${monument.image}" alt="\${monument.name}" class="popup-image" />
                  <div class="popup-image-overlay"></div>
                  <div class="popup-header">\${monument.name}</div>
                  <button class="popup-close" onclick="map.closePopup()">×</button>
                </div>
                <div class="popup-content">
                  <div class="popup-meta">
                    <div class="popup-meta-item"><svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg> \${monument.rating}</div>
                    <div class="popup-meta-item"><svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><path d="M11.8 10.9c-2.27-.59-3-1.2-3-2.15 0-1.09 1.01-1.85 2.7-1.85 1.78 0 2.44.85 2.5 2.1h2.21c-.07-1.72-1.12-3.3-3.21-3.81V3h-3v2.16c-1.94.42-3.5 1.68-3.5 3.61 0 2.31 1.91 3.46 4.7 4.13 2.5.6 3 1.48 3 2.41 0 .69-.49 1.79-2.7 1.79-2.06 0-2.87-.92-2.98-2.1h-2.2c.12 2.19 1.76 3.42 3.68 3.83V21h3v-2.15c1.95-.37 3.5-1.5 3.5-3.55 0-2.84-2.43-3.81-4.7-4.4z"/></svg> \${monument.price}</div>
                    <div class="popup-meta-item"><svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg> \${monument.category}</div>
                  </div>
                  <div class="popup-description">\${monument.description}</div>
                  <div class="popup-actions">
                    <button class="popup-button" onclick="window.ReactNativeWebView?.postMessage(JSON.stringify({type: 'navigate', monumentId: '\${monument.id}'}))">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path><polyline points="9,22 9,12 15,12 15,22"></polyline></svg>
                      Détails
                    </button>
                    <button class="popup-button secondary" onclick="window.ReactNativeWebView?.postMessage(JSON.stringify({type: 'directions', monumentId: '\${monument.id}'}))">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="3,11 22,2 13,21 11,13 3,11"></polygon></svg>
                      Itinéraire
                    </button>
                  </div>
                </div>
              </div>
            \`;
            
            marker.bindPopup(popupContent);
            monumentMarkers.push(marker);
          });

          // Ajouter les marqueurs des activités
          activities.forEach(activity => {
            const activityIcon = L.divIcon({
              className: 'activity-marker',
              iconSize: [28, 28],
              iconAnchor: [14, 28],
              popupAnchor: [0, -28]
            });
            
            const marker = L.marker([activity.latitude, activity.longitude], { 
              icon: activityIcon 
            }).addTo(map);
            
            const popupContent = \`
              <div class="activity-popup">
                <div style="position: relative;">
                  <img src="\${activity.image}" alt="\${activity.title}" class="popup-image" />
                  <div class="popup-image-overlay"></div>
                  <div class="popup-header">\${activity.title}</div>
                  <button class="popup-close" onclick="map.closePopup()">×</button>
                </div>
                <div class="popup-content">
                  <div class="popup-meta">
                    <div class="popup-meta-item"><svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><path d="M19 3h-1V1h-2v2H8V1H6v2H5c-1.11 0-1.99.9-1.99 2L3 19c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5V8h14v11zM7 10h5v5H7z"/></svg> \${activity.date}</div>
                    <div class="popup-meta-item"><svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><path d="M11.99 2C6.47 2 2 6.48 2 12s4.47 10 9.99 10C17.52 22 22 17.52 22 12S17.52 2 11.99 2zM12 20c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8z"/><path d="M12.5 7H11v6l5.25 3.15.75-1.23-4.5-2.67z"/></svg> \${activity.time}</div>
                    <div class="popup-meta-item"><svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><path d="M16 4c0-1.11.89-2 2-2s2 .89 2 2-.89 2-2 2-2-.89-2-2zm4 18v-6h2.5l-2.54-7.63A1.5 1.5 0 0 0 18.54 8H17c-.8 0-1.54.37-2.01.99l-.49.74c-.51.76-.49 1.78.03 2.53L16 14v8h4zm-12.5 0h3v-8l1.5-2-1.5-2h-3v12zm1.5-14c1.11 0 2-.89 2-2s-.89-2-2-2-2 .89-2 2 .89 2 2 2z"/></svg> \${activity.participants}</div>
                  </div>
                  <div class="popup-description">\${activity.description}</div>
                  <div class="popup-meta">
                    <div class="popup-meta-item"><svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/></svg> \${activity.organizer}</div>
                    <div class="popup-meta-item"><svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><path d="M11.8 10.9c-2.27-.59-3-1.2-3-2.15 0-1.09 1.01-1.85 2.7-1.85 1.78 0 2.44.85 2.5 2.1h2.21c-.07-1.72-1.12-3.3-3.21-3.81V3h-3v2.16c-1.94.42-3.5 1.68-3.5 3.61 0 2.31 1.91 3.46 4.7 4.13 2.5.6 3 1.48 3 2.41 0 .69-.49 1.79-2.7 1.79-2.06 0-2.87-.92-2.98-2.1h-2.2c.12 2.19 1.76 3.42 3.68 3.83V21h3v-2.15c1.95-.37 3.5-1.5 3.5-3.55 0-2.84-2.43-3.81-4.7-4.4z"/></svg> \${activity.price}€</div>
                  </div>
                  <div class="popup-actions">
                    <button class="popup-button" onclick="window.ReactNativeWebView?.postMessage(JSON.stringify({type: 'joinActivity', activityId: '\${activity.id}'}))">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="18" height="18" x="3" y="4" rx="2" ry="2"></rect><line x1="16" x2="16" y1="2" y2="6"></line><line x1="8" x2="8" y1="2" y2="6"></line><line x1="3" x2="21" y1="10" y2="10"></line></svg>
                      Rejoindre
                    </button>
                    <button class="popup-button secondary" onclick="window.ReactNativeWebView?.postMessage(JSON.stringify({type: 'directions', activityId: '\${activity.id}'}))">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="3,11 22,2 13,21 11,13 3,11"></polygon></svg>
                      Itinéraire
                    </button>
                  </div>
                </div>
              </div>
            \`;
            
            marker.bindPopup(popupContent);
            activityMarkers.push(marker);
          });

          // Gérer les messages depuis React Native
          window.addEventListener('message', function(event) {
            try {
              const data = JSON.parse(event.data);
              if (data.type === 'centerOnMonument' && data.monumentId) {
                const monument = monuments.find(m => m.id === data.monumentId);
                if (monument) {
                  map.setView([monument.latitude, monument.longitude], 17);
                  const marker = monumentMarkers.find(m => 
                    m.getLatLng().lat === monument.latitude && 
                    m.getLatLng().lng === monument.longitude
                  );
                  if (marker) {
                    marker.openPopup();
                  }
                }
              }
            } catch (e) {
              console.error('Error parsing message:', e);
            }
          });

          // Animation d'entrée pour les marqueurs
          setTimeout(() => {
            [...monumentMarkers, ...activityMarkers].forEach((marker, index) => {
              setTimeout(() => {
                marker.getElement().style.animation = 'bounceIn 0.6s ease-out';
              }, index * 100);
            });
          }, 500);
        </script>
        
        <style>
          @keyframes bounceIn {
            0% { transform: scale(0) rotate(-45deg); opacity: 0; }
            50% { transform: scale(1.2) rotate(-45deg); opacity: 1; }
            100% { transform: scale(1) rotate(-45deg); opacity: 1; }
          }
        </style>
      </body>
    </html>
  `;

  const handleMessage = async (event: any) => {
    try {
      const data = JSON.parse(event.nativeEvent.data);
      if (data.type === 'navigate' && data.monumentId) {
        // Navigation vers le détail du monument
        // console.log('Navigate to monument:', data.monumentId);
        // router.push(`/monument/${data.monumentId}`);
      } else if (data.type === 'directions' && data.monumentId) {
        // Calculer l'itinéraire vers un monument
        const monument = monuments.find(m => m.id === data.monumentId);
        if (monument) {
          await calculateRoute(
            { latitude: monument.latitude, longitude: monument.longitude },
            'monument',
            data.monumentId
          );
        }
      } else if (data.type === 'joinActivity' && data.activityId) {
        // Rejoindre une activité - rediriger vers la page détails
        // console.log('Join activity:', data.activityId);
        router.push(`/activity/${data.activityId}`);
      } else if (data.type === 'directions' && data.activityId) {
        // Calculer l'itinéraire vers une activité
        const activity = activities.find(a => a.id === data.activityId);
        if (activity) {
          await calculateRoute(
            { latitude: activity.latitude, longitude: activity.longitude },
            'activity',
            data.activityId
          );
        }
      } else if (data.type === 'requestLocation') {
        // Si on a une position en cache, l'utiliser immédiatement
        if (cachedLocation && webViewRef.current) {
          webViewRef.current.postMessage(JSON.stringify({
            type: 'locationReceived',
            latitude: cachedLocation.latitude,
            longitude: cachedLocation.longitude
          }));
          return;
        }

        // Sinon, demander la géolocalisation
        const position = await requestLocationPermission();
        if (position && webViewRef.current) {
          // Mettre en cache pour les prochaines utilisations
          setCachedLocation(position);
          
          // Envoyer la position à la WebView
          webViewRef.current.postMessage(JSON.stringify({
            type: 'locationReceived',
            latitude: position.latitude,
            longitude: position.longitude
          }));
        }
      }
    } catch (error) {
      console.error('Error handling map message:', error);
    }
  };

  return (
    <View style={styles.container}>
      <WebView
        ref={webViewRef}
        source={{ html: mapHTML }}
        style={styles.webview}
        javaScriptEnabled={true}
        domStorageEnabled={true}
        startInLoadingState={true}
        onMessage={handleMessage}
        allowsInlineMediaPlayback={true}
        mediaPlaybackRequiresUserAction={false}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1A1A1A',
  },
  webview: {
    flex: 1,
  },
});
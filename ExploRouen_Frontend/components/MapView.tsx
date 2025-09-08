import React from 'react';
import { View, StyleSheet, Platform } from 'react-native';
import { WebView } from 'react-native-webview';
import RNMapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';

interface MapViewProps {
  monuments?: Array<{
    id: string;
    name: string;
    latitude: number;
    longitude: number;
  }>;
}

export default function MapView({ monuments = [] }: MapViewProps) {
  // Utiliser WebView avec Leaflet pour le web et react-native-maps pour mobile
  if (Platform.OS === 'web') {
    // Code WebView pour web (utilise Leaflet)
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
            .custom-marker {
              background: linear-gradient(135deg, #8B5CF6 0%, #7C3AED 100%);
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
            .custom-marker::before {
              content: '🏛️';
              transform: rotate(45deg);
              font-size: 14px;
              position: absolute;
            }
            .monument-popup {
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
              border-radius: 12px;
              overflow: hidden;
              box-shadow: 0 8px 32px rgba(0,0,0,0.2);
              border: none;
              background: white;
              min-width: 250px;
            }
            .popup-header {
              background: linear-gradient(135deg, #8B5CF6 0%, #7C3AED 100%);
              color: white;
              padding: 12px 16px;
              font-weight: 600;
              font-size: 16px;
            }
            .popup-content {
              padding: 16px;
              background: white;
            }
            .popup-description {
              color: #6B7280;
              font-size: 14px;
              line-height: 1.4;
              margin-bottom: 12px;
            }
            .popup-actions {
              display: flex;
              gap: 8px;
            }
            .popup-button {
              background: #8B5CF6;
              color: white;
              border: none;
              padding: 8px 16px;
              border-radius: 8px;
              font-size: 14px;
              font-weight: 600;
              cursor: pointer;
              transition: all 0.2s;
            }
            .popup-button:hover {
              background: #7C3AED;
              transform: translateY(-1px);
            }
            .popup-button.secondary {
              background: #F3F4F6;
              color: #374151;
            }
            .popup-button.secondary:hover {
              background: #E5E7EB;
            }
            .leaflet-popup-content-wrapper {
              border-radius: 12px;
              box-shadow: 0 8px 32px rgba(0,0,0,0.2);
            }
            .leaflet-popup-tip {
              background: white;
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
            .map-controls {
              position: absolute;
              top: 20px;
              right: 20px;
              z-index: 1000;
              display: flex;
              flex-direction: column;
              gap: 12px;
            }
            .control-button {
              width: 48px;
              height: 48px;
              background: rgba(255,255,255,0.95);
              border: none;
              border-radius: 24px;
              display: flex;
              align-items: center;
              justify-content: center;
              cursor: pointer;
              box-shadow: 0 4px 16px rgba(0,0,0,0.15);
              transition: all 0.2s;
              backdrop-filter: blur(10px);
            }
            .control-button:hover {
              background: white;
              transform: translateY(-2px);
              box-shadow: 0 6px 20px rgba(0,0,0,0.2);
            }
            .stats-overlay {
              position: absolute;
              top: 20px;
              left: 20px;
              z-index: 1000;
              background: rgba(255,255,255,0.95);
              backdrop-filter: blur(10px);
              border-radius: 16px;
              padding: 16px;
              box-shadow: 0 4px 16px rgba(0,0,0,0.15);
              min-width: 200px;
            }
            .stats-title {
              font-weight: 700;
              font-size: 16px;
              color: #111827;
              margin-bottom: 8px;
            }
            .stats-grid {
              display: grid;
              grid-template-columns: 1fr 1fr;
              gap: 8px;
            }
            .stat-item {
              text-align: center;
            }
            .stat-number {
              font-weight: 800;
              font-size: 18px;
              color: #8B5CF6;
            }
            .stat-label {
              font-size: 12px;
              color: #6B7280;
              font-weight: 500;
            }
          </style>
          <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
        </head>
        <body>
          <div id="map"></div>
          
          <div class="stats-overlay">
            <div class="stats-title">Exploration</div>
            <div class="stats-grid">
              <div class="stat-item">
                <div class="stat-number">${monuments.length}</div>
                <div class="stat-label">Monuments</div>
              </div>
              <div class="stat-item">
                <div class="stat-number">8</div>
                <div class="stat-label">Visités</div>
              </div>
              <div class="stat-item">
                <div class="stat-number">12</div>
                <div class="stat-label">Œufs</div>
              </div>
              <div class="stat-item">
                <div class="stat-number">2.5km</div>
                <div class="stat-label">Distance</div>
              </div>
            </div>
          </div>

          <div class="map-controls">
            <button class="control-button" onclick="centerOnUser()" title="Ma position">
              📍
            </button>
            <button class="control-button" onclick="showAllMonuments()" title="Voir tous">
              🗺️
            </button>
            <button class="control-button" onclick="toggleSatellite()" title="Vue satellite">
              🛰️
            </button>
          </div>

          <script>
            // Initialiser la carte
            const map = L.map('map', {
              zoomControl: false,
              attributionControl: false
            }).setView([49.4404, 1.0939], 14);

            // Couches de carte
            const streetLayer = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
              attribution: '© OpenStreetMap contributors'
            });

            const satelliteLayer = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
              attribution: '© Esri'
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
              if (navigator.geolocation) {
                navigator.geolocation.getCurrentPosition(function(position) {
                  const lat = position.coords.latitude;
                  const lng = position.coords.longitude;
                  
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
                }, function(error) {
                  alert('Impossible d\\'obtenir votre position');
                });
              }
            }

            function showAllMonuments() {
              if (${monuments.length} > 0) {
                const group = new L.featureGroup(monumentMarkers);
                map.fitBounds(group.getBounds().pad(0.1));
              }
            }

            function toggleSatellite() {
              map.removeLayer(currentLayer);
              currentLayer = currentLayer === streetLayer ? satelliteLayer : streetLayer;
              currentLayer.addTo(map);
            }

            // Ajouter les marqueurs des monuments
            const monuments = ${JSON.stringify(monuments)};
            const monumentMarkers = [];
            
            monuments.forEach(monument => {
              const customIcon = L.divIcon({
                className: 'custom-marker',
                iconSize: [32, 32],
                iconAnchor: [16, 32],
                popupAnchor: [0, -32]
              });
              
              const marker = L.marker([monument.latitude, monument.longitude], { 
                icon: customIcon 
              }).addTo(map);
              
              const popupContent = \`
                <div class="monument-popup">
                  <div class="popup-header">\${monument.name}</div>
                  <div class="popup-content">
                    <div class="popup-description">Découvrez ce monument historique de Rouen</div>
                    <div class="popup-actions">
                      <button class="popup-button" onclick="alert('Navigation vers \${monument.name}')">
                        Visiter
                      </button>
                      <button class="popup-button secondary" onclick="alert('Itinéraire vers \${monument.name}')">
                        Itinéraire
                      </button>
                    </div>
                  </div>
                </div>
              \`;
              
              marker.bindPopup(popupContent);
              monumentMarkers.push(marker);
            });

            // Animation d'entrée pour les marqueurs
            setTimeout(() => {
              monumentMarkers.forEach((marker, index) => {
                setTimeout(() => {
                  if (marker.getElement()) {
                    marker.getElement().style.animation = 'bounceIn 0.6s ease-out';
                  }
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

    return (
      <View style={styles.container}>
        <WebView
          source={{ html: mapHTML }}
          style={styles.webview}
          javaScriptEnabled={true}
          domStorageEnabled={true}
          allowsInlineMediaPlayback={true}
          mediaPlaybackRequiresUserAction={false}
        />
      </View>
    );
  }

  // Code react-native-maps pour mobile (Expo Go)
  return (
    <View style={styles.container}>
      <RNMapView
        style={styles.map}
        initialRegion={{
          latitude: 49.4404,
          longitude: 1.0939,
          latitudeDelta: 0.0922,
          longitudeDelta: 0.0421,
        }}
        provider={PROVIDER_GOOGLE}
      >
        {monuments.map((monument) => (
          <Marker
            key={monument.id}
            coordinate={{
              latitude: monument.latitude,
              longitude: monument.longitude,
            }}
            title={monument.name}
            description="Monument historique de Rouen"
          />
        ))}
      </RNMapView>
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
  map: {
    flex: 1,
  },
});
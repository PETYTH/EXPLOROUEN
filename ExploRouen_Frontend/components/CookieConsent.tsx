import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Modal,
  ScrollView,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useTheme } from '@/contexts/ThemeContext';
import { Cookie, Shield, X, Clock, Users } from 'lucide-react-native';

interface CookieConsentProps {
  onAccept?: () => void;
  onDecline?: () => void;
}

export default function CookieConsent({ onAccept, onDecline }: CookieConsentProps) {
  const { colors } = useTheme();
  const [isVisible, setIsVisible] = useState(false);
  const [showDetails, setShowDetails] = useState(false);

  // Fonction de debug pour effacer le consentement
  const clearConsent = async () => {
    try {
      await AsyncStorage.removeItem('cookieConsent');
      // console.log('🍪 Consentement effacé, rechargement...');
      setIsVisible(true);
    } catch (error) {
      console.error('❌ Erreur lors de l\'effacement:', error);
    }
  };

  // Pour debug : afficher le modal au bout de 2 secondes si pas visible
  useEffect(() => {
    const debugTimer = setTimeout(() => {
      if (!isVisible) {
        // console.log('🍪 DEBUG: Modal pas visible après 2s, vérification...');
        checkConsentStatus();
      }
    }, 2000);

    return () => clearTimeout(debugTimer);
  }, [isVisible]);

  useEffect(() => {
    checkConsentStatus();
  }, []);

  const checkConsentStatus = async () => {
    try {
      // console.log('🍪 Vérification du consentement cookies...');
      const consent = await AsyncStorage.getItem('cookieConsent');
      // console.log('🍪 Consentement stocké:', consent);
      
      if (!consent) {
        // console.log('🍪 Aucun consentement trouvé, affichage du modal');
        setIsVisible(true);
      } else {
        // console.log('🍪 Consentement déjà donné, modal masqué');
        setIsVisible(false);
      }
    } catch (error) {
      console.error('❌ Erreur lors de la vérification du consentement:', error);
      // En cas d'erreur, afficher le modal par sécurité
      setIsVisible(true);
    }
  };

  const handleAccept = async () => {
    try {
      // console.log('🍪 Acceptation du consentement...');
      await AsyncStorage.setItem('cookieConsent', JSON.stringify({
        accepted: true,
        date: new Date().toISOString(),
        version: '1.0'
      }));
      // console.log('🍪 Consentement sauvegardé avec succès');
      setIsVisible(false);
      onAccept?.();
    } catch (error) {
      console.error('❌ Erreur lors de la sauvegarde du consentement:', error);
    }
  };

  const handleDecline = async () => {
    try {
      // console.log('🍪 Refus du consentement...');
      await AsyncStorage.setItem('cookieConsent', JSON.stringify({
        accepted: false,
        date: new Date().toISOString(),
        version: '1.0'
      }));
      // console.log('🍪 Refus sauvegardé avec succès');
      setIsVisible(false);
      onDecline?.();
    } catch (error) {
      console.error('❌ Erreur lors de la sauvegarde du refus:', error);
    }
  };

  if (!isVisible) return null;

  return (
    <Modal
      visible={isVisible}
      transparent
      animationType="fade"
      statusBarTranslucent
    >
      <View style={styles.overlay}>
        <View style={[styles.container, { backgroundColor: colors.surface }]}>
          <View style={styles.header}>
            <View style={styles.iconContainer}>
              <Cookie size={20} color="#6366F1" strokeWidth={2} />
            </View>
            <Text style={[styles.title, { color: colors.text }]}>
              Gestion des cookies
            </Text>
          </View>

          <ScrollView style={styles.content} showsVerticalScrollIndicator={false} nestedScrollEnabled={true}>
            <Text style={[styles.description, { color: colors.textSecondary }]}>
              En utilisant ExploRouen, vous acceptez notre traitement de vos données personnelles selon les modalités décrites ci-dessous, conformément au Règlement Général sur la Protection des Données (RGPD).
            </Text>

            <View style={[styles.dataProcessingSection, { backgroundColor: colors.background }]}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>
                Traitement de vos données personnelles
              </Text>
              
              <Text style={[styles.dataText, { color: colors.textSecondary }]}>
                <Text style={{ fontWeight: '600' }}>Responsable du traitement :</Text> ExploRouen{'\n'}
                <Text style={{ fontWeight: '600' }}>Finalités :</Text> Amélioration de l'expérience utilisateur, analyse d'usage, personnalisation du contenu{'\n'}
                <Text style={{ fontWeight: '600' }}>Base légale :</Text> Consentement (Art. 6.1.a RGPD){'\n'}
                <Text style={{ fontWeight: '600' }}>Durée de conservation :</Text> 13 mois maximum{'\n'}
                <Text style={{ fontWeight: '600' }}>Destinataires :</Text> Équipe ExploRouen, prestataires techniques
              </Text>
            </View>

            <TouchableOpacity
              style={styles.detailsButton}
              onPress={() => setShowDetails(!showDetails)}
            >
              <Text style={[styles.detailsButtonText, { color: '#6366F1' }]}>
                {showDetails ? 'Masquer les détails' : 'Détails des cookies et droits'}
              </Text>
            </TouchableOpacity>

            {showDetails && (
              <View style={[styles.detailsContainer, { backgroundColor: colors.background }]}>
                <View style={styles.cookieCategory}>
                  <Text style={[styles.categoryTitle, { color: colors.text }]}>
                    🔒 Cookies essentiels
                  </Text>
                  <Text style={[styles.categoryDescription, { color: colors.textSecondary }]}>
                    Nécessaires au fonctionnement de l'application (authentification, préférences de base). 
                    Ces cookies ne peuvent pas être désactivés car ils sont indispensables au service.
                  </Text>
                </View>

                <View style={styles.cookieCategory}>
                  <Text style={[styles.categoryTitle, { color: colors.text }]}>
                    📊 Cookies d'analyse
                  </Text>
                  <Text style={[styles.categoryDescription, { color: colors.textSecondary }]}>
                    Collecte anonymisée des statistiques d'usage pour améliorer l'application. 
                    Données traitées : pages visitées, temps de session, interactions.
                  </Text>
                  <Clock size={14} color="#F59E0B" strokeWidth={2} />
                  <Text style={[styles.cookieExpiry, { color: '#F59E0B' }]}>Expire dans 30 jours</Text>
                  <Users size={14} color="#DC2626" strokeWidth={2} />
                  <Text style={[styles.cookieUsage, { color: '#DC2626' }]}>Usage analytique</Text>
                </View>

                <View style={styles.cookieCategory}>
                  <Text style={[styles.categoryTitle, { color: colors.text }]}>
                    ⚙️ Cookies de préférences
                  </Text>
                  <Text style={[styles.categoryDescription, { color: colors.textSecondary }]}>
                    Mémorisation de vos choix (thème, langue, favoris) pour personnaliser votre expérience.
                  </Text>
                </View>

                <View style={styles.rightsSection}>
                  <Text style={[styles.categoryTitle, { color: colors.text }]}>
                    ⚖️ Vos droits RGPD
                  </Text>
                  <Text style={[styles.categoryDescription, { color: colors.textSecondary }]}>
                    • Droit d'accès, de rectification et d'effacement{'\n'}
                    • Droit à la portabilité des données{'\n'}
                    • Droit d'opposition et de limitation{'\n'}
                    • Droit de retrait du consentement{'\n'}
                    Contact : contact@explorouen.fr
                  </Text>
                </View>
              </View>
            )}

            <View style={styles.privacyNote}>
              <Shield size={20} color="#6366F1" strokeWidth={2} />
              <Text style={[styles.privacyText, { color: colors.textSecondary }]}>
                Données chiffrées et sécurisées • Conformité RGPD • Pas de vente à des tiers
              </Text>
            </View>

            <Text style={[styles.consentText, { color: colors.textSecondary }]}>
              En cliquant sur "Accepter", vous consentez au traitement de vos données selon les modalités décrites. 
              Vous pouvez retirer votre consentement à tout moment dans les paramètres de l'application.
            </Text>
          </ScrollView>

          <View style={styles.buttons}>
            <TouchableOpacity
              style={[styles.declineButton, { borderColor: colors.border }]}
              onPress={handleDecline}
            >
              <Text style={[styles.declineButtonText, { color: colors.text }]}>
                Refuser
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.acceptButton, { backgroundColor: '#6366F1' }]}
              onPress={handleAccept}
            >
              <Text style={styles.acceptButtonText}>
                Accepter
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  container: {
    borderRadius: 20,
    padding: 24,
    maxWidth: 400,
    width: '100%',
    height: 600,
    shadowColor: '#6366F1',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 10,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    gap: 12,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(99, 102, 241, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    flex: 1,
  },
  content: {
    maxHeight: 400,
    minHeight: 200,
  },
  description: {
    fontSize: 15,
    lineHeight: 22,
    marginBottom: 16,
  },
  detailsButton: {
    alignSelf: 'flex-start',
    marginBottom: 16,
  },
  detailsButtonText: {
    fontSize: 14,
    fontWeight: '600',
    textDecorationLine: 'underline',
  },
  detailsContainer: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    gap: 12,
  },
  cookieCategory: {
    gap: 4,
  },
  categoryTitle: {
    fontSize: 14,
    fontWeight: '600',
  },
  categoryDescription: {
    fontSize: 13,
    lineHeight: 18,
  },
  cookieExpiry: {
    fontSize: 12,
    fontWeight: '500',
    color: '#F59E0B',
    marginLeft: 4,
  },
  cookieUsage: {
    fontSize: 12,
    fontWeight: '500',
    color: '#DC2626',
    marginLeft: 4,
  },
  privacyNote: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 24,
    padding: 12,
    backgroundColor: 'rgba(99, 102, 241, 0.05)',
    borderRadius: 8,
  },
  privacyText: {
    fontSize: 12,
    fontWeight: '500',
    flex: 1,
  },
  buttons: {
    flexDirection: 'row',
    gap: 12,
  },
  declineButton: {
    flex: 1,
    borderWidth: 1.5,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
  declineButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  acceptButton: {
    flex: 1,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    shadowColor: '#6366F1',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  acceptButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  dataProcessingSection: {
    borderRadius: 12,
    padding: 16,
    marginVertical: 16,
    borderWidth: 1,
    borderColor: 'rgba(99, 102, 241, 0.2)',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 12,
  },
  dataText: {
    fontSize: 14,
    lineHeight: 20,
  },
  rightsSection: {
    marginTop: 8,
    gap: 4,
  },
  consentText: {
    fontSize: 13,
    lineHeight: 18,
    marginTop: 16,
    fontStyle: 'italic',
  },
});

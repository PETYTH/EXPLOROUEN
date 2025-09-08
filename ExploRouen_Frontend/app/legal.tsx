import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { router } from 'expo-router';
import { ArrowLeft } from 'lucide-react-native';
import { useTheme } from '@/contexts/ThemeContext';

export default function LegalScreen() {
  const { colors } = useTheme();

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: colors.background }]}>
        <TouchableOpacity 
          style={styles.backButton} 
          onPress={() => router.back()}
        >
          <ArrowLeft size={24} color={colors.text} strokeWidth={2} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Mentions légales</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={[styles.section, { backgroundColor: colors.surface }]}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Éditeur de l'application</Text>
          <Text style={[styles.sectionText, { color: colors.textSecondary }]}>
            ExploRouen{'\n'}
            Application mobile de découverte touristique{'\n'}
            Rouen, France
          </Text>
        </View>

        <View style={[styles.section, { backgroundColor: colors.surface }]}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Hébergement</Text>
          <Text style={[styles.sectionText, { color: colors.textSecondary }]}>
            Cette application est hébergée par des services cloud sécurisés conformes aux réglementations européennes en matière de protection des données.
          </Text>
        </View>

        <View style={[styles.section, { backgroundColor: colors.surface }]}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Protection des données</Text>
          <Text style={[styles.sectionText, { color: colors.textSecondary }]}>
            Conformément au Règlement Général sur la Protection des Données (RGPD), nous nous engageons à protéger vos données personnelles. Les informations collectées sont utilisées uniquement dans le cadre du fonctionnement de l'application et ne sont jamais partagées avec des tiers sans votre consentement explicite.
          </Text>
        </View>

        <View style={[styles.section, { backgroundColor: colors.surface }]}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Propriété intellectuelle</Text>
          <Text style={[styles.sectionText, { color: colors.textSecondary }]}>
            Tous les contenus présents dans cette application (textes, images, logos, icônes) sont protégés par les droits d'auteur et appartiennent à ExploRouen ou à leurs propriétaires respectifs.
          </Text>
        </View>

        <View style={[styles.section, { backgroundColor: colors.surface }]}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Responsabilité</Text>
          <Text style={[styles.sectionText, { color: colors.textSecondary }]}>
            L'utilisation de cette application se fait sous votre propre responsabilité. ExploRouen ne peut être tenu responsable des dommages directs ou indirects résultant de l'utilisation de l'application.
          </Text>
        </View>

        <View style={[styles.section, { backgroundColor: colors.surface }]}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Contact</Text>
          <Text style={[styles.sectionText, { color: colors.textSecondary }]}>
            Pour toute question concernant ces mentions légales ou l'utilisation de vos données, vous pouvez nous contacter via la section "Nous contacter" de l'application.
          </Text>
        </View>

        <View style={styles.bottomSpacing} />
      </ScrollView>
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
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 20,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
  },
  placeholder: {
    width: 40,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  section: {
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 12,
  },
  sectionText: {
    fontSize: 15,
    lineHeight: 22,
  },
  bottomSpacing: {
    height: 100,
  },
});

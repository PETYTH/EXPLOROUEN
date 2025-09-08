import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  Alert,
} from 'react-native';
import { router } from 'expo-router';
import { ArrowLeft, Send, Mail, Phone, MapPin } from 'lucide-react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useTheme } from '@/contexts/ThemeContext';
import { useAuth } from '@clerk/clerk-expo';

export default function ContactScreen() {
  const { colors } = useTheme();
  const { getToken } = useAuth();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: ''
  });
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async () => {
    if (!formData.name || !formData.email || !formData.message) {
      Alert.alert('Erreur', 'Veuillez remplir tous les champs obligatoires');
      return;
    }

    setIsLoading(true);
    try {
      const token = await getToken();
      const backendUrl = process.env.EXPO_PUBLIC_URL_BACKEND || 'http://192.168.1.62:5000/api';
      
      const response = await fetch(`${backendUrl}/contact`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        Alert.alert(
          'Message envoyé !',
          'Nous vous répondrons dans les plus brefs délais.',
          [{ text: 'OK', onPress: () => router.back() }]
        );
        setFormData({ name: '', email: '', subject: '', message: '' });
      } else {
        throw new Error('Erreur lors de l\'envoi');
      }
    } catch (error) {
      console.error('Erreur lors de l\'envoi du message:', error);
      Alert.alert('Erreur', 'Impossible d\'envoyer le message. Veuillez réessayer.');
    } finally {
      setIsLoading(false);
    }
  };

  const updateField = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <Animated.View entering={FadeInDown.delay(100)} style={[styles.header, { backgroundColor: colors.background }]}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <ArrowLeft size={24} color={colors.text} strokeWidth={2} />
        </TouchableOpacity>
        
        <Text style={[styles.headerTitle, { color: colors.text }]}>Nous contacter</Text>
      </Animated.View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Contact Info */}
        <Animated.View entering={FadeInDown.delay(200)} style={[styles.contactInfo, { backgroundColor: colors.surface }]}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Informations de contact</Text>
          
          <View style={styles.contactItem}>
            <Mail size={20} color="#8B5CF6" strokeWidth={2} />
            <Text style={[styles.contactText, { color: colors.textSecondary }]}>contact@explorouen.fr</Text>
          </View>
          
          <View style={styles.contactItem}>
            <Phone size={20} color="#8B5CF6" strokeWidth={2} />
            <Text style={[styles.contactText, { color: colors.textSecondary }]}>+33 2 35 XX XX XX</Text>
          </View>
          
          <View style={styles.contactItem}>
            <MapPin size={20} color="#8B5CF6" strokeWidth={2} />
            <Text style={[styles.contactText, { color: colors.textSecondary }]}>Rouen, Normandie, France</Text>
          </View>
        </Animated.View>

        {/* Contact Form */}
        <Animated.View entering={FadeInDown.delay(300)} style={styles.formSection}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Envoyez-nous un message</Text>
          
          <View style={[styles.inputGroup, { backgroundColor: colors.surface }]}>
            <Text style={[styles.inputLabel, { color: colors.text }]}>Nom complet *</Text>
            <TextInput
              style={[styles.textInput, { color: colors.text, borderColor: colors.border }]}
              placeholder="Votre nom"
              placeholderTextColor={colors.textSecondary}
              value={formData.name}
              onChangeText={(value) => updateField('name', value)}
            />
          </View>

          <View style={[styles.inputGroup, { backgroundColor: colors.surface }]}>
            <Text style={[styles.inputLabel, { color: colors.text }]}>Email *</Text>
            <TextInput
              style={[styles.textInput, { color: colors.text, borderColor: colors.border }]}
              placeholder="votre@email.com"
              placeholderTextColor={colors.textSecondary}
              value={formData.email}
              onChangeText={(value) => updateField('email', value)}
              keyboardType="email-address"
              autoCapitalize="none"
            />
          </View>

          <View style={[styles.inputGroup, { backgroundColor: colors.surface }]}>
            <Text style={[styles.inputLabel, { color: colors.text }]}>Sujet</Text>
            <TextInput
              style={[styles.textInput, { color: colors.text, borderColor: colors.border }]}
              placeholder="Sujet de votre message"
              placeholderTextColor={colors.textSecondary}
              value={formData.subject}
              onChangeText={(value) => updateField('subject', value)}
            />
          </View>

          <View style={[styles.inputGroup, { backgroundColor: colors.surface }]}>
            <Text style={[styles.inputLabel, { color: colors.text }]}>Message *</Text>
            <TextInput
              style={[styles.textArea, { color: colors.text, borderColor: colors.border }]}
              placeholder="Décrivez votre demande..."
              placeholderTextColor={colors.textSecondary}
              value={formData.message}
              onChangeText={(value) => updateField('message', value)}
              multiline
              numberOfLines={6}
              textAlignVertical="top"
            />
          </View>

          <TouchableOpacity 
            style={[styles.submitButton, isLoading && styles.submitButtonDisabled]}
            onPress={handleSubmit}
            disabled={isLoading}
          >
            <Send size={20} color="#FFFFFF" strokeWidth={2} />
            <Text style={styles.submitButtonText}>
              {isLoading ? 'Envoi en cours...' : 'Envoyer le message'}
            </Text>
          </TouchableOpacity>
        </Animated.View>

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
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 20,
    gap: 16,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(40, 40, 40, 0.95)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '800',
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  contactInfo: {
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 16,
  },
  contactItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 12,
  },
  contactText: {
    fontSize: 15,
    fontWeight: '500',
  },
  formSection: {
    gap: 16,
  },
  inputGroup: {
    borderRadius: 16,
    padding: 16,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
  },
  textInput: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
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
    minHeight: 120,
  },
  submitButton: {
    backgroundColor: '#8B5CF6',
    borderRadius: 16,
    paddingVertical: 16,
    paddingHorizontal: 24,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 8,
    shadowColor: '#8B5CF6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  submitButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  bottomSpacing: {
    height: 100,
  },
  submitButtonDisabled: {
    opacity: 0.6,
  },
});

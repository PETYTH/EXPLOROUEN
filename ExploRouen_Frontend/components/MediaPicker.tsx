import React from 'react';
import { View, TouchableOpacity, Text, StyleSheet, Alert } from 'react-native';
import { Camera, Image, Video } from 'lucide-react-native';
import * as ImagePicker from 'expo-image-picker';
import { useTheme } from '@/contexts/ThemeContext';

interface MediaPickerProps {
  onMediaSelected: (media: { uri: string; type: 'image' | 'video'; name: string }) => void;
  onClose: () => void;
}

export default function MediaPicker({ onMediaSelected, onClose }: MediaPickerProps) {
  const { colors } = useTheme();

  const requestPermissions = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert(
        'Permission requise',
        'Nous avons besoin d\'accéder à votre galerie pour sélectionner des médias.'
      );
      return false;
    }
    return true;
  };

  const pickImage = async () => {
    const hasPermission = await requestPermissions();
    if (!hasPermission) return;

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      const asset = result.assets[0];
      onMediaSelected({
        uri: asset.uri,
        type: 'image',
        name: asset.fileName || `image_${Date.now()}.jpg`
      });
    }
    onClose();
  };

  const pickVideo = async () => {
    const hasPermission = await requestPermissions();
    if (!hasPermission) return;

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Videos,
      allowsEditing: true,
      quality: 0.8,
      videoMaxDuration: 60, // 60 secondes max
    });

    if (!result.canceled && result.assets[0]) {
      const asset = result.assets[0];
      onMediaSelected({
        uri: asset.uri,
        type: 'video',
        name: asset.fileName || `video_${Date.now()}.mp4`
      });
    }
    onClose();
  };

  const takePhoto = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert(
        'Permission requise',
        'Nous avons besoin d\'accéder à votre caméra pour prendre des photos.'
      );
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      const asset = result.assets[0];
      onMediaSelected({
        uri: asset.uri,
        type: 'image',
        name: `photo_${Date.now()}.jpg`
      });
    }
    onClose();
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.surface }]}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: colors.text }]}>Ajouter un média</Text>
      </View>
      
      <View style={styles.options}>
        <TouchableOpacity
          style={[styles.option, { backgroundColor: colors.background }]}
          onPress={takePhoto}
        >
          <Camera size={24} color="#8B5CF6" />
          <Text style={[styles.optionText, { color: colors.text }]}>Prendre une photo</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.option, { backgroundColor: colors.background }]}
          onPress={pickImage}
        >
          <Image size={24} color="#8B5CF6" />
          <Text style={[styles.optionText, { color: colors.text }]}>Choisir une image</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.option, { backgroundColor: colors.background }]}
          onPress={pickVideo}
        >
          <Video size={24} color="#8B5CF6" />
          <Text style={[styles.optionText, { color: colors.text }]}>Choisir une vidéo</Text>
        </TouchableOpacity>
      </View>

      <TouchableOpacity
        style={[styles.cancelButton, { backgroundColor: colors.background }]}
        onPress={onClose}
      >
        <Text style={[styles.cancelText, { color: colors.textSecondary }]}>Annuler</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 16,
    padding: 20,
    margin: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 5,
  },
  header: {
    marginBottom: 20,
    alignItems: 'center',
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
  },
  options: {
    gap: 12,
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    gap: 12,
  },
  optionText: {
    fontSize: 16,
    fontWeight: '600',
  },
  cancelButton: {
    marginTop: 20,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  cancelText: {
    fontSize: 16,
    fontWeight: '600',
  },
});

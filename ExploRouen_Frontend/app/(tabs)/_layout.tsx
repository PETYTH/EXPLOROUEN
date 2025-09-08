import { Stack } from 'expo-router';
import { View } from 'react-native';
import { useTheme } from '@/contexts/ThemeContext';
import FloatingMenu from '@/components/FloatingMenu';

export default function TabLayout() {
  const { colors } = useTheme();

  // La redirection est déjà gérée dans le layout principal (app/_layout.tsx)

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <Stack
        screenOptions={{
          headerShown: false,
          gestureEnabled: false, // Désactive le swipe-back
        }}
      >
        <Stack.Screen name="index" />
        <Stack.Screen name="activities" />
        <Stack.Screen name="messages" />
        <Stack.Screen name="map" />
        <Stack.Screen name="profile" />
      </Stack>
      <FloatingMenu />
    </View>
  );
}

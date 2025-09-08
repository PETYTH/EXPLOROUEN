import { Stack } from 'expo-router';

export default function AuthLayout() {
  // La redirection est déjà gérée dans le layout principal (app/_layout.tsx)

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        gestureEnabled: false, // bloque le swipe-back (iOS)
      }}
    >
      <Stack.Screen name="auth" />
      <Stack.Screen name="forgot-password" />
    </Stack>
  );
}

// app/_layout.tsx
import React, { useEffect } from 'react';
import { ClerkProvider, useAuth } from '@clerk/clerk-expo';
import { Stack, useRouter, useSegments } from 'expo-router';
import * as SecureStore from 'expo-secure-store';
import { ActivityIndicator, View } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
// import { initDatabase } from '../services/sqliteStorage'; // Commenté temporairement

// ⬇️ On conserve TES imports nommés
import { ThemeProvider } from '../contexts/ThemeContext';
import { ChatProvider } from '../contexts/ChatContext';
import { ActivityProvider } from '../contexts/ActivityProvider';

// Ta clé Clerk (depuis .env)
const CLERK_PUBLISHABLE_KEY = process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY!;

// SecureStore pour garder les tokens
const tokenCache = {
    async getToken(key: string) {
        try {
            return await SecureStore.getItemAsync(key);
        } catch (err) {
            return null;
        }
    },
    async saveToken(key: string, value: string) {
        try {
            await SecureStore.setItemAsync(key, value);
        } catch (err) {
            return;
        }
    },
};

// Ce layout contrôle la redirection selon l'état de connexion
function InitialLayout() {
    const { isLoaded, isSignedIn } = useAuth();
    const segments = useSegments();
    const router = useRouter();

    // Initialiser la base de données SQLite au démarrage
    useEffect(() => {
        const setupDatabase = async () => {
            try {
                // await initDatabase(); // Commenté temporairement
                console.log('✅ SQLite database initialized successfully');
            } catch (error) {
                console.error('❌ Failed to initialize SQLite database:', error);
                // En cas d'erreur, on peut afficher une alerte ou continuer sans SQLite
            }
        };

        setupDatabase();
    }, []);

    useEffect(() => {
        if (!isLoaded) return;

        const inAuthGroup = segments[0] === '(auth)';
        const inMainGroup = segments[0] === '(tabs)';
        const inOnboardingFlow = segments[0] === 'splash' || segments[0] === 'get-started';
        const inDetailPages = segments[0] === 'activity' || segments[0] === 'monument' || 
                             segments[0] === 'all-monuments' || 
                             segments[0] === 'create-activity' || segments[0] === 'create-monument' || 
                             segments[0] === 'contact' || segments[0] === 'notifications';

        // Si l'utilisateur est connecté, le rediriger vers l'app principale SEULEMENT s'il est dans auth ou onboarding
        if (isSignedIn && !inMainGroup && !inDetailPages && (inAuthGroup || inOnboardingFlow)) {
            router.replace('/(tabs)');
        }
        // Si l'utilisateur n'est pas connecté
        else if (!isSignedIn && !inAuthGroup && !inOnboardingFlow) {
            // Vérifier si l'utilisateur a déjà vu l'onboarding
            const checkOnboardingStatus = async () => {
                try {
                    const hasSeenOnboarding = await SecureStore.getItemAsync('hasSeenOnboarding');
                    if (hasSeenOnboarding === 'true') {
                        // L'utilisateur a déjà vu l'onboarding, aller directement à l'auth
                        router.replace('/(auth)/auth');
                    } else {
                        // Première visite, montrer l'onboarding
                        router.replace('/splash');
                    }
                } catch (error) {
                    // En cas d'erreur, aller à l'onboarding par sécurité
                    router.replace('/splash');
                }
            };
            
            checkOnboardingStatus();
        }
    }, [isLoaded, isSignedIn, segments]);

    // Facultatif : affichage d'un loader pendant le chargement Clerk
    if (!isLoaded) {
        return (
            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                <ActivityIndicator size="large" />
            </View>
        );
    }

    return (
        <GestureHandlerRootView style={{ flex: 1 }}>
            <ThemeProvider>
                <ActivityProvider>
                    <ChatProvider>
                    <Stack screenOptions={{ 
                        headerShown: false,
                        animation: 'slide_from_right',
                        animationDuration: 400,
                        gestureEnabled: true,
                        gestureDirection: 'horizontal'
                    }}>
                        <Stack.Screen 
                            name="splash" 
                            options={{ animation: 'fade' }}
                        />
                        <Stack.Screen 
                            name="get-started" 
                            options={{ animation: 'slide_from_bottom' }}
                        />
                        <Stack.Screen 
                            name="(auth)" 
                            options={{ animation: 'slide_from_right' }}
                        />
                        <Stack.Screen 
                            name="(tabs)" 
                            options={{ animation: 'fade' }}
                        />
                        <Stack.Screen 
                            name="activity/[id]" 
                            options={{ animation: 'slide_from_right' }}
                        />
                        <Stack.Screen 
                            name="monument/[id]" 
                            options={{ animation: 'slide_from_right' }}
                        />
                        <Stack.Screen 
                            name="all-monuments" 
                            options={{ animation: 'slide_from_bottom' }}
                        />
                        <Stack.Screen 
                            name="create-activity" 
                            options={{ animation: 'slide_from_bottom' }}
                        />
                        <Stack.Screen 
                            name="create-monument" 
                            options={{ animation: 'slide_from_bottom' }}
                        />
                        <Stack.Screen 
                            name="contact" 
                            options={{ animation: 'slide_from_right' }}
                        />
                        <Stack.Screen 
                            name="notifications" 
                            options={{ animation: 'slide_from_right' }}
                        />
                        <Stack.Screen 
                            name="+not-found" 
                            options={{ animation: 'fade' }}
                        />
                    </Stack>
                    </ChatProvider>
                </ActivityProvider>
            </ThemeProvider>
        </GestureHandlerRootView>
    );
}

// Layout global avec ClerkProvider
export default function RootLayout() {
    return (
        <ClerkProvider
            publishableKey={CLERK_PUBLISHABLE_KEY}
            tokenCache={tokenCache}
            telemetry={false}
        >
            <InitialLayout />
        </ClerkProvider>
    );
}

import {SplashScreen, Stack, useRouter, useSegments} from "expo-router";
import { useFonts } from 'expo-font';
import { useEffect} from "react";

import './globals.css';
import * as Sentry from '@sentry/react-native';
import useAuthStore from "@/store/auth.store";

Sentry.init({
    dsn: 'https://94edd17ee98a307f2d85d750574c454a@o4506876178464768.ingest.us.sentry.io/4509588544094208',
    sendDefaultPii: true,
    replaysSessionSampleRate: 1,
    replaysOnErrorSampleRate: 1,
    integrations: [Sentry.mobileReplayIntegration(), Sentry.feedbackIntegration()],
});

export default Sentry.wrap(function RootLayout() {
    const { isLoading, isAuthenticated, user, fetchAuthenticatedUser } = useAuthStore();
    const router = useRouter();
    const segments = useSegments();

    const [fontsLoaded, error] = useFonts({
        "QuickSand-Bold": require('../assets/fonts/Quicksand-Bold.ttf'),
        "QuickSand-Medium": require('../assets/fonts/Quicksand-Medium.ttf'),
        "QuickSand-Regular": require('../assets/fonts/Quicksand-Regular.ttf'),
        "QuickSand-SemiBold": require('../assets/fonts/Quicksand-SemiBold.ttf'),
        "QuickSand-Light": require('../assets/fonts/Quicksand-Light.ttf'),
    });

    useEffect(() => {
        if(error) throw error;
        if(fontsLoaded) SplashScreen.hideAsync();
    }, [fontsLoaded, error]);

    useEffect(() => {
        fetchAuthenticatedUser()
    }, []);

    // Handle role-based navigation
    useEffect(() => {
        if (isLoading || !fontsLoaded) return;

        const inAuthGroup = segments[0] === '(auth)';
        const inSignupChoice = segments[0] === '(signup-choice)';

        if (!isAuthenticated) {
            // Redirect to sign-in if not authenticated and not already in auth
            if (!inAuthGroup && !inSignupChoice) {
                router.replace('/(auth)/sign-in');
            }
        } else if (user) {
            // User is authenticated, redirect based on role
            if (user.role === 'driver') {
                // Driver should go to tab3
                if (segments[0] !== '(tab3)') {
                    router.replace('/(tab3)/deliveries');
                }
            } else if (user.role === 'owner') {
                // Restaurant owner should go to tab2
                if (segments[0] !== '(tabs2)') {
                    router.replace('/(tabs2)/orders');
                }
            } else {
                // Customer should go to tabs (default)
                if (segments[0] !== '(tabs)') {
                    router.replace('//(tabs)/index');
                }
            }
        }
    }, [isAuthenticated, user, segments, isLoading, fontsLoaded]);

    if(!fontsLoaded || isLoading) return null;

    return <Stack screenOptions={{ headerShown: false }} />;
});

Sentry.showFeedbackWidget();
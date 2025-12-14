// Root Layout Component (_layout.tsx)
// This is the entry point and main wrapper for the entire application
// Handles: font loading, authentication, error tracking (Sentry), and navigation setup

// Import Expo Router components for navigation
import { SplashScreen, Stack } from "expo-router";

// Import font loading hook from Expo
import { useFonts } from 'expo-font';

// Import React hook for side effects
import { useEffect } from "react";

// Import global CSS styles (Tailwind)
import './globals.css';

// Import Sentry for error tracking and monitoring
import * as Sentry from '@sentry/react-native';

// Import custom authentication store (Zustand state management)
import useAuthStore from "@/store/auth.store";

// ===== SENTRY CONFIGURATION =====
// Sentry monitors app crashes, errors, and performance issues in production
Sentry.init({
    // DSN (Data Source Name) - unique identifier for this project in Sentry
    // This connects the app to your Sentry account for error reporting
    dsn: 'https://94edd17ee98a307f2d85d750574c454a@o4506876178464768.ingest.us.sentry.io/4509588544094208',

    // sendDefaultPii: Send Personally Identifiable Information
    // When true, Sentry collects additional context like IP addresses, cookies, user data
    // Helps debug issues but should comply with privacy regulations (GDPR, etc.)
    sendDefaultPii: true,

    // ===== SESSION REPLAY CONFIGURATION =====
    // Session Replay records user interactions to replay crashes/errors

    // replaysSessionSampleRate: Percentage of normal sessions to record
    // 1 = 100% (record all sessions), 0.1 = 10% (record 10% of sessions)
    // Set to 1 for development, reduce in production to save costs
    replaysSessionSampleRate: 1,

    // replaysOnErrorSampleRate: Percentage of error sessions to record
    // 1 = 100% (record all sessions with errors)
    // Useful for debugging by seeing exactly what user did before crash
    replaysOnErrorSampleRate: 1,

    // Integrations: Additional Sentry features
    integrations: [
        Sentry.mobileReplayIntegration(),  // Records screen interactions/gestures
        Sentry.feedbackIntegration()       // Allows users to send feedback on errors
    ],

    // Spotlight (commented out): Development tool for debugging Sentry events locally
    // Uncomment to enable in development mode: spotlight: __DEV__,
});

// ===== ROOT LAYOUT COMPONENT =====
// Export the component wrapped with Sentry.wrap() for error boundary functionality
// Sentry.wrap() catches any errors in this component and reports them
export default Sentry.wrap(function RootLayout() {
    // ===== AUTHENTICATION STATE =====
    // Extract loading state and user fetch function from auth store
    // useAuthStore is a Zustand store managing global authentication state
    const { isLoading, fetchAuthenticatedUser } = useAuthStore();

    // ===== FONT LOADING =====
    // useFonts hook loads custom fonts asynchronously
    // Returns: [fontsLoaded (boolean), error (if any)]
    const [fontsLoaded, error] = useFonts({
        // Load 5 variants of Quicksand font family
        "QuickSand-Bold": require('../assets/fonts/Quicksand-Bold.ttf'),
        "QuickSand-Medium": require('../assets/fonts/Quicksand-Medium.ttf'),
        "QuickSand-Regular": require('../assets/fonts/Quicksand-Regular.ttf'),
        "QuickSand-SemiBold": require('../assets/fonts/Quicksand-SemiBold.ttf'),
        "QuickSand-Light": require('../assets/fonts/Quicksand-Light.ttf'),
    });

    // ===== FONT LOADING SIDE EFFECT =====
    // Runs whenever fontsLoaded or error changes
    useEffect(() => {
        // If font loading failed, throw error to crash app and show error screen
        // This prevents app from running with missing fonts
        if(error) throw error;

        // If fonts loaded successfully, hide the splash screen
        // SplashScreen stays visible until explicitly hidden
        if(fontsLoaded) SplashScreen.hideAsync();
    }, [fontsLoaded, error]); // Dependencies: re-run when these change

    // ===== AUTHENTICATION CHECK SIDE EFFECT =====
    // Runs once when component mounts (empty dependency array)
    useEffect(() => {
        // Fetch current authenticated user from backend/storage
        // This checks if user has a valid session and loads their data
        fetchAuthenticatedUser()
    }, []); // Empty array = run only once on mount

    // ===== LOADING STATE =====
    // Show nothing (blank screen) while fonts are loading or auth is checking
    // This prevents flashing incorrect screens before data is ready
    if(!fontsLoaded || isLoading) return null;

    // ===== MAIN NAVIGATION SETUP =====
    // Stack navigator creates screen-by-screen navigation
    // screenOptions applies to all screens in the app
    return <Stack screenOptions={{ headerShown: false }} />;
    // headerShown: false = hide default navigation header
    // We're using custom headers in each screen instead
});

// ===== FEEDBACK WIDGET =====
// Show Sentry feedback widget overlay
// Allows users to report bugs directly from the app
// This appears as a floating button users can tap to send feedback
Sentry.showFeedbackWidget();

// ===== HOW THIS FILE WORKS =====
/**
 * EXECUTION ORDER:
 * 1. Sentry.init() runs - sets up error tracking
 * 2. Component mounts
 * 3. Fonts start loading
 * 4. fetchAuthenticatedUser() checks login status
 * 5. While loading: return null (blank screen)
 * 6. When ready: show Stack navigator (main app)
 * 7. Feedback widget appears
 *
 * KEY CONCEPTS:
 * - This file wraps the ENTIRE app
 * - All other screens are children of <Stack>
 * - Errors anywhere in app get caught by Sentry
 * - Fonts and auth MUST load before showing UI
 */
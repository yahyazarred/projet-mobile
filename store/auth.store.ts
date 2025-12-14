

import { create } from 'zustand';
import {User} from "@/type";
import {getCurrentUser} from "@/lib/appwrite";

type AuthState = {
    // =====================================================
    // STATE (Data)
    // =====================================================

    // Boolean flag indicating if user is logged in
    // true = logged in, false = not logged in
    isAuthenticated: boolean;

    // User profile data (name, email, role, etc.)
    // null if not logged in
    user: User | null;

    // Boolean flag indicating if we're currently checking authentication
    // true = checking, false = done checking
    // Useful for showing loading spinner during initial app load
    isLoading: boolean;

    // =====================================================
    // ACTIONS (Functions to modify state)
    // =====================================================


    setIsAuthenticated: (value: boolean) => void;


    setUser: (user: User | null) => void;

    setLoading: (loading: boolean) => void;

    fetchAuthenticatedUser: () => Promise<void>;
}

const useAuthStore = create<AuthState>((set) => ({
    // =====================================================
    // INITIAL STATE
    // =====================================================
    // These are the default values when the store is first created

    isAuthenticated: false,  // Assume not logged in initially
    user: null,              // No user data initially
    isLoading: true,         // Start as loading (will check auth on app start)

    // =====================================================
    // SIMPLE SETTER ACTIONS
    // =====================================================
    // These are simple functions that directly update state


    setIsAuthenticated: (value) => set({ isAuthenticated: value }),

    setUser: (user) => set({ user }),


    setLoading: (value) => set({isLoading: value}),

    // =====================================================
    // ASYNC ACTION - FETCH USER
    // =====================================================


    fetchAuthenticatedUser: async () => {
        // Step 1: Set loading state
        // This triggers loading spinners/skeletons in the UI
        set({isLoading: true});

        try {
            // Step 2: Attempt to get current user from backend
            // getCurrentUser() will throw an error if:
            // - No session exists (user not logged in)
            // - Session expired
            // - Network error
            const user = await getCurrentUser();

            // Step 3: Update state based on result
            if(user) {
                // Success: User is logged in
                // Update both isAuthenticated flag and user data
                set({
                    isAuthenticated: true,
                    user: user as User  // Cast to User type for type safety
                });
            } else {
                // User is null: Not logged in
                // Clear authentication state
                set({
                    isAuthenticated: false,
                    user: null
                });
            }

        } catch (e) {
            // Step 4: Handle errors (user not logged in, network issues, etc.)

            // =====================================================
            // SAFE ERROR LOGGING
            // =====================================================
            // Problem: Some error objects cause crashes when logged directly
            // Solution: Extract safe properties or convert to string

            // Basic error message logging
            console.log(
                'fetchAuthenticatedUser error',
                // Check if error is Error instance, otherwise convert to string
                e instanceof Error ? e.message : String(e)
            );

            // Additional detailed logging if error is an object
            // This helps debug Appwrite-specific errors
            if (e && typeof e === 'object') {
                console.log('Error details:', {
                    message: (e as any).message,  // Error description
                    code: (e as any).code,        // Error code (e.g., 401)
                    type: (e as any).type,        // Error type classification
                });
            }

            // Clear authentication state on error
            // This ensures user is logged out if session is invalid
            set({
                isAuthenticated: false,
                user: null
            });

        } finally {
            // Step 5: Always set loading to false when done
            // finally block runs regardless of success or error
            // This ensures loading spinner stops in all cases
            set({ isLoading: false });
        }
    }
}));

// Export the store hook so it can be used throughout the app
export default useAuthStore;
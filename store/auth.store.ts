import { create } from 'zustand';
import {User} from "@/type";
import {getCurrentUser} from "@/lib/appwrite";

type AuthState = {
    isAuthenticated: boolean;
    user: User | null;
    isLoading: boolean;

    setIsAuthenticated: (value: boolean) => void;
    setUser: (user: User | null) => void;
    setLoading: (loading: boolean) => void;

    fetchAuthenticatedUser: () => Promise<void>;
}

const useAuthStore = create<AuthState>((set) => ({
    isAuthenticated: false,
    user: null,
    isLoading: true,

    setIsAuthenticated: (value) => set({ isAuthenticated: value }),
    setUser: (user) => set({ user }),
    setLoading: (value) => set({isLoading: value}),

    fetchAuthenticatedUser: async () => {
        set({isLoading: true});

        try {
            const user = await getCurrentUser();

            if(user) set({ isAuthenticated: true, user: user as User })
            else set( { isAuthenticated: false, user: null } );
        } catch (e) {
            // ✅ FIX: Safely log the error without causing _toString issues
            console.log('fetchAuthenticatedUser error', e instanceof Error ? e.message : String(e));

            // Optional: Log more details if available
            if (e && typeof e === 'object') {
                console.log('Error details:', {
                    message: (e as any).message,
                    code: (e as any).code,
                    type: (e as any).type,
                });
            }

            set({ isAuthenticated: false, user: null })
        } finally {
            set({ isLoading: false });
        }
    }
}))

export default useAuthStore;
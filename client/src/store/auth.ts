import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import * as api from '../lib/api';

interface User {
    id: string;
    email: string;
    firstName?: string;
    role: string;
    isPremium: boolean;
    avatar?: string;
}

interface AuthState {
    user: User | null;
    token: string | null;
    isAuthenticated: boolean;
    login: (token: string, user: User) => void;
    logout: () => void;
    updateUser: (updates: Partial<User>) => void;
}

export const useAuthStore = create<AuthState>()(
    persist(
        (set) => ({
            user: null,
            token: null,
            isAuthenticated: false,
            login: (token, user) => {
                // Set token for axios requests
                api.setAuthToken(token);
                set({ token, user, isAuthenticated: true });
            },
            logout: () => {
                api.setAuthToken(null);
                set({ token: null, user: null, isAuthenticated: false });
            },
            updateUser: (updates) => {
                set((state) => ({
                    user: state.user ? { ...state.user, ...updates } : null
                }));
            }
        }),
        {
            name: 'cv-maker-auth',
            onRehydrateStorage: () => (state, error) => {
                if (error) return;

                // Ensure axios has Authorization header after a page refresh.
                api.setAuthToken(state?.token ?? null);
            },
        }
    )
);

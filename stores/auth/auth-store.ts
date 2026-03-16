// ============================================================
// AUTH STORE (ZUSTAND)
// Manages: login, logout, authenticated user state, session restoration
// ============================================================

import { create } from 'zustand';
import { AuthService } from 'services/auth-service';
import { User } from 'types/auth-types';
import { getToken, removeToken } from 'utils/tokenStorage';
import { extractErrorMessage } from 'utils/error-utils';

type AuthState = {
  // Authenticated user
  user: User | null;
  isAuthenticated: boolean;

  // UI state
  loading: boolean;
  error: string | null;

  // Actions
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => Promise<void>;
  restoreSession: () => Promise<void>;
  clearError: () => void;
};

export const useAuthStore = create<AuthState>((set) => ({
  // -------- State --------
  user: null,
  isAuthenticated: false,
  loading: false,
  error: null,

  // -------- Actions --------

  // Clear any error
  clearError: () => set({ error: null }),

  // Restore session from secure storage and token
  restoreSession: async () => {
    try {
      const token = await getToken();
      if (token) {
        console.log('Token found - user session valid');
        set({
          isAuthenticated: true,
        });
      } else {
        console.log('No token found - user needs to login');
        set({
          isAuthenticated: false,
        });
      }
    } catch (error) {
      console.error('Failed to restore session:', error);
      set({ isAuthenticated: false });
    }
  },

  // -------- LOGIN --------
  login: async (email, password) => {
    set({ loading: true, error: null });
    try {
      const response = await AuthService.login({ email, password });
      if (!response.success || !response.user) {
        set({ loading: false, error: response.message ?? 'Login failed' });
        return false;
      }

      set({
        user: response.user,
        isAuthenticated: true,
        loading: false,
        error: null,
      });
      return true;
    } catch (err: any) {
      console.log('Login error:', extractErrorMessage(err));
      set({
        loading: false,
        error: extractErrorMessage(err),
      });
      return false;
    }
  },

  // -------- LOGOUT --------
  logout: async () => {
    await removeToken();
    set({
      user: null,
      isAuthenticated: false,
      error: null,
    });
    console.log('User logged out');
  },
}));

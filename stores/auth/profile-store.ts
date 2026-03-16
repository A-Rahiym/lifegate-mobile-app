// ============================================================
// PROFILE STORE (ZUSTAND)
// Manages: profile operations (fetch profile, change password)
// Note: Profile data is stored in auth-store.user
// ============================================================

import { create } from 'zustand';
import { AuthService } from 'services/auth-service';
import { extractErrorMessage } from 'utils/error-utils';

type ProfileState = {
  // UI state
  loading: boolean;
  error: string | null;

  // Actions
  clearError: () => void;
  getProfile: () => Promise<boolean>;
  changePassword: (
    currentPassword: string,
    newPassword: string,
    confirmPassword: string
  ) => Promise<boolean>;
};

export const useProfileStore = create<ProfileState>((set) => ({
  // -------- State --------
  loading: false,
  error: null,

  // -------- Actions --------

  // Clear any error
  clearError: () => set({ error: null }),

  // -------- PROFILE: GET PROFILE --------
  getProfile: async () => {
    set({ loading: true, error: null });
    try {
      const response = await AuthService.getProfile();
      if (!response.success || !response.user) {
        set({ loading: false, error: response.message ?? 'Failed to fetch profile' });
        return false;
      }
      set({ loading: false, error: null });
      console.log('Profile fetched successfully');
      return true;
    } catch (err: any) {
      set({ loading: false, error: extractErrorMessage(err) });
      return false;
    }
  },

  // -------- PROFILE: CHANGE PASSWORD --------
  changePassword: async (currentPassword: string, newPassword: string, confirmPassword: string) => {
    set({ loading: true, error: null });
    try {
      const response = await AuthService.changePassword(currentPassword, newPassword, confirmPassword);
      if (!response.success) {
        set({ loading: false, error: response.message ?? 'Failed to change password' });
        return false;
      }
      set({ loading: false, error: null });
      console.log('Password changed successfully');
      return true;
    } catch (err: any) {
      set({ loading: false, error: extractErrorMessage(err) });
      return false;
    }
  },
}));

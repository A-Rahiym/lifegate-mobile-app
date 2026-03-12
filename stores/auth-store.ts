// ============================================================
// AUTH STORE (ZUSTAND)
// Handles authentication state with a single centralized user.
// Screens only call store actions.
// ============================================================

import { create } from 'zustand';
import { AuthService } from 'services/auth-service';
import { User, UserDraft } from 'types/auth-types';
import { getToken, removeToken } from 'utils/tokenStorage';
import { validateRegistration, hasErrors } from 'utils/validation';
import { Alert } from 'react-native';

/**
 * Extract error message from various error formats
 * Handles axios errors, string errors, and error objects
 */
const extractErrorMessage = (error: any): any => {
  // Axios response errors
  if (error.response?.data?.message) {
    return error.response.data.message;
  }
  if (error.response?.data?.error) {
    return error.response.data.error;
  }
  if (error.response?.data?.details) {
    return error.response.data.details;
  }
  // Direct error message
  if (typeof error === 'string') {
    return error;
  }
  if (error?.message) {
    return error.message;
  }
  return 'An error occurred. Please try again.';
};

// ---------------------------
// What the store exposes
// ---------------------------
type AuthState = {
  // Form state - single centralized draft
  userDraft: UserDraft;

  // Authenticated user (single field - role is in user.role)
  user: User | null;
  isAuthenticated: boolean;

  // UI state
  loading: boolean;
  error: string | null;

  // Password Recovery state
  passwordRecoveryEmail: string | null;
  resetToken: string | null;
  signupOtpEmail: string | null;

  // New Registration Flow state
  pendingRegistrationEmail: string | null; // Email awaiting OTP verification
  otpExpiresIn: number | null; // Expiration time in seconds

  // Actions
  setUserField: (field: keyof UserDraft, value: string) => void;
  resetForm: () => void;
  login: (email: string, password: string) => Promise<boolean>;
  register: (role: 'user' | 'professional') => Promise<void>;
  logout: () => Promise<void>;
  clearError: () => void;
  restoreSession: () => Promise<void>;
  setPasswordRecoveryEmail: (email: string) => void;
  clearPasswordRecoveryState: () => void;
  setSignupOtpEmail: (email: string | null) => void;
  // New Registration Flow Actions
  startRegistration: (role: 'user' | 'professional') => Promise<boolean>;
  verifyRegistration: (email: string, otp: string) => Promise<boolean>;
  resendRegistrationOTP: (email: string) => Promise<boolean>;
  // Password recovery actions
  sendOtpForPasswordRecovery: (email: string) => Promise<boolean>;
  verifyOtpForPasswordRecovery: (email: string, code: string) => Promise<boolean>;
  resetPassword: (token: string, newPassword: string) => Promise<boolean>;
  // Signup OTP actions
  sendOtpForSignup: (email: string) => Promise<boolean>;
  verifyOtpForSignup: (email: string, otp: string) => Promise<boolean>;
  resendOtp: (email: string, type: 'password-reset' | 'signup') => Promise<boolean>;
  // Profile actions
  getProfile: () => Promise<boolean>;
  changePassword: (currentPassword: string, newPassword: string, confirmPassword: string) => Promise<boolean>;
};

// ---------------------------
// Initial empty form values
// ---------------------------
const emptyDraft: UserDraft = {
  name: '',
  email: '',
  password: '',
  confirmPassword: '',
  phone: '',
  dob: '',
  gender: '',
  language: '',
  healthHistory: '',
  role: undefined,
  specialization: '',
  licenseNumber: '',
  certificateName: '',
  certificateId: '',
  certificateIssueDate: '',
  yearsOfExperience: '',
};

// ---------------------------
// Creating the store
// ---------------------------
export const useAuthStore = create<AuthState>((set, get) => ({
  // -------- State --------
  userDraft: emptyDraft,
  user: null,
  isAuthenticated: false,
  loading: false,
  error: null,
  passwordRecoveryEmail: null,
  resetToken: null,
  signupOtpEmail: null,
  pendingRegistrationEmail: null,
  otpExpiresIn: null,

  // -------- Actions --------

  // Update any field in the form
  setUserField: (field, value) =>
    set((state) => ({
      userDraft: { ...state.userDraft, [field]: value },
    })),

  // Reset form to initial state
  resetForm: () => set({ userDraft: emptyDraft }),

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
      console.log('Login error=========================================:', extractErrorMessage(err));
      set({
        loading: false,
        error: extractErrorMessage(err),
      });
      return false;
    }
  },

  // -------- REGISTER --------
  register: async (role: 'user' | 'professional') => {
    set({ loading: true, error: null });
    const formData = get().userDraft;

    // Comprehensive validation
    const validationErrors = validateRegistration(formData, role);
    if (hasErrors(validationErrors)) {
      const errorMessages = validationErrors.map((err) => err.message).join('\n');
      set({ loading: false, error: errorMessages });
      Alert.alert('Validation Error', errorMessages);
      return;
    }

    const {
      name,
      email,
      password,
      confirmPassword,
      phone,
      dob,
      gender,
      language,
      healthHistory,
      specialization,
      licenseNumber,
      certificateName,
      certificateId,
      certificateIssueDate,
      yearsOfExperience,
    } = formData;

    try {
      const registerPayload = {
        name,
        email,
        password,
        confirmPassword,
        phone,
        dob,
        gender: gender.toLowerCase(),
        language: language.toLowerCase(),
        healthHistory,
        role,
        ...(role === 'professional' && {
          specialization,
          licenseNumber,
          certificateName,
          certificateId,
          certificateIssueDate,
          yearsOfExperience,
        }),
      };
      console.log('Registering with payload:', registerPayload);
      const response = await AuthService.register(registerPayload);
      
      if (!response.success || !response.user) {
        set({ loading: false, error: response.message ?? 'Registration failed' });
        return;
      }

      set({
        user: response.user,
        isAuthenticated: true,
        loading: false,
        error: null,
      });

      // Reset form after successful registration
      get().resetForm();
      // router.push('/(auth)/login');
    } catch (err: any) {
      set({
        loading: false,
        error: extractErrorMessage(err),
      });
    }
  },

  // -------- LOGOUT --------
  logout: async () => {
    await removeToken();
    set({
      user: null,
      isAuthenticated: false,
      error: null,
      userDraft: emptyDraft,
      passwordRecoveryEmail: null,
      resetToken: null,
      signupOtpEmail: null,
      pendingRegistrationEmail: null,
      otpExpiresIn: null,
    });
    console.log('User logged out');
  },

  // -------- PASSWORD RECOVERY --------
  setPasswordRecoveryEmail: (email: string) =>
    set({ passwordRecoveryEmail: email }),

  clearPasswordRecoveryState: () =>
    set({ passwordRecoveryEmail: null, error: null }),

  // -------- SIGNUP OTP --------
  setSignupOtpEmail: (email: string | null) =>
    set({ signupOtpEmail: email }),

  // -------- PASSWORD RECOVERY: SEND OTP --------
  sendOtpForPasswordRecovery: async (email: string) => {
    set({ loading: true, error: null });
    try {
      const response = await AuthService.sendOtpForPasswordRecovery(email);
      if (!response.success) {
        set({ loading: false, error: response.message });
        return false;
      }
      set({ 
        passwordRecoveryEmail: email, 
        loading: false, 
        error: null 
      });
      console.log('OTP sent for password recovery');
      return true;
    } catch (err: any) {
      set({ loading: false, error: extractErrorMessage(err) });
      return false;
    }
  },

  // -------- PASSWORD RECOVERY: VERIFY RESET CODE --------
  verifyOtpForPasswordRecovery: async (email: string, code: string) => {
    set({ loading: true, error: null });
    try {
      const response = await AuthService.verifyOtpForPasswordRecovery(email, code);
      if (!response.success) {
        set({ loading: false, error: response.message });
        return false;
      }

      // Store the resetToken from the response
      set({
        resetToken: response.data.resetToken,
        loading: false,
        error: null,
      });
      console.log('Reset code verified - token stored');
      return true;
    } catch (err: any) {
      set({ loading: false, error: extractErrorMessage(err) });
      return false;
    }
  },

  // -------- PASSWORD RECOVERY: RESET PASSWORD --------
  resetPassword: async (token: string, newPassword: string) => {
    set({ loading: true, error: null });
    try {
      const response = await AuthService.resetPassword(token, newPassword);
      if (!response.success) {
        set({ loading: false, error: response.message });
        return false;
      }

      // Clear resetToken and passwordRecoveryEmail on successful password reset
      set({
        loading: false,
        error: null,
        resetToken: null,
        passwordRecoveryEmail: null,
      });
      console.log('Password reset successfully - token cleared');
      return true;
    } catch (err: any) {
      set({ loading: false, error: extractErrorMessage(err) });
      return false;
    }
  },

  // -------- SIGNUP: SEND OTP --------
  sendOtpForSignup: async (email: string) => {
    set({ loading: true, error: null });
    try {
      const response = await AuthService.sendOtpForSignup(email);
      if (!response.success) {
        set({ loading: false, error: response.message });
        return false;
      }
      set({ 
        signupOtpEmail: email, 
        loading: false, 
        error: null 
      });
      console.log('OTP sent for signup');
      return true;
    } catch (err: any) {
      set({ loading: false, error: extractErrorMessage(err) });
      return false;
    }
  },

  // -------- SIGNUP: VERIFY OTP --------
  verifyOtpForSignup: async (email: string, otp: string) => {
    set({ loading: true, error: null });
    try {
      const response = await AuthService.verifyOtpForSignup(email, otp);
      if (!response.success) {
        set({ loading: false, error: response.message });
        return false;
      }
      set({ loading: false, error: null });
      console.log('OTP verified for signup');
      return true;
    } catch (err: any) {
      set({ loading: false, error: extractErrorMessage(err) });
      return false;
    }
  },

  // -------- OTP: RESEND --------
  resendOtp: async (email: string, type: 'password-reset' | 'signup') => {
    set({ loading: true, error: null });
    try {
      const response = await AuthService.resendOtp(email, type);
      if (!response.success) {
        set({ loading: false, error: response.message });
        return false;
      }
      set({ loading: false, error: null });
      console.log(`Code resent for ${type}`);
      return true;
    } catch (err: any) {
      set({ loading: false, error: extractErrorMessage(err) });
      return false;
    }
  },

  // -------- NEW REGISTRATION FLOW: STAGE 1 --------
  startRegistration: async (role: 'user' | 'professional') => {
    set({ loading: true, error: null });
    const formData = get().userDraft;

    // Comprehensive validation
    const validationErrors = validateRegistration(formData, role);
    if (hasErrors(validationErrors)) {
      const errorMessages = validationErrors.map((err) => err.message).join('\n');
      set({ loading: false, error: errorMessages });
      Alert.alert('Validation Error', errorMessages);
      return false;
    }

    const {
      name,
      email,
      password,
      phone,
      dob,
      gender,
      language,
      healthHistory,
      specialization,
      licenseNumber,
      certificateName,
      certificateId,
      certificateIssueDate,
      yearsOfExperience,
    } = formData;

    try {
      const registrationPayload = {
        name,
        email,
        password,
        role,
        phone,
        dob,
        gender: gender.toLowerCase(),
        language: language.toLowerCase(),
        healthHistory,
        ...(role === 'professional' && {
          specialization,
          licenseNumber,
          certificateName,
          certificateId,
          certificateIssueDate,
          yearsOfExperience,
        }),
      };

      console.log('Starting registration with payload:', registrationPayload);
      const response = await AuthService.startRegistration(registrationPayload);

      if (!response.success || !response.data) {
        set({ loading: false, error: response.message ?? 'Failed to start registration' });
        console.error('Registration start failed:', response.message);
        return false;
      }

      // Store email and OTP expiration, clear password from memory
      set({
        pendingRegistrationEmail: email,
        otpExpiresIn: response.data.otpExpiresIn,
        userDraft: { ...formData, password: '', confirmPassword: '' }, // Clear password
        loading: false,
        error: null,
      });

      console.log('Registration started - OTP sent to email, password cleared from state');
      return true;
    } catch (err: any) {
      set({ loading: false, error: extractErrorMessage(err) });
      return false;
    }
  },

  // -------- NEW REGISTRATION FLOW: STAGE 2 - VERIFY OTP --------
  verifyRegistration: async (email: string, otp: string) => {
    set({ loading: true, error: null });
    try {
      const response = await AuthService.verifyRegistration({ email, otp });

      if (!response.success || !response.data) {
        // Handle specific error cases
        const errorMessage = response.message;
        
        if (errorMessage?.includes('expired')) {
          set({ loading: false, error: 'OTP expired. Please request a new code.' });
        } else if (errorMessage?.includes('Invalid')) {
          set({ loading: false, error: 'Invalid verification code' });
        } else if (errorMessage?.includes('already')) {
          set({ loading: false, error: 'Email already registered' });
        } else {
          set({ loading: false, error: errorMessage ?? 'Verification failed' });
        }
        return false;
      }

      const { user } = response.data;

      // User is now logged in with JWT
      set({
        user,
        isAuthenticated: true,
        pendingRegistrationEmail: null,
        otpExpiresIn: null,
        userDraft: emptyDraft, // Clear form after successful registration
        loading: false,
        error: null,
      });

      console.log('Registration verified - user logged in successfully');
      return true;
    } catch (err: any) {
      set({ loading: false, error: extractErrorMessage(err) });
      return false;
    }
  },

  // -------- NEW REGISTRATION FLOW: RESEND OTP --------
  resendRegistrationOTP: async (email: string) => {
    set({ loading: true, error: null });
    try {
      const response = await AuthService.resendRegistrationOTP(email);

      if (!response.success || !response.data) {
        set({ loading: false, error: response.message ?? 'Failed to resend code' });
        return false;
      }

      // Update OTP expiration timer
      set({
        otpExpiresIn: response.data.otpExpiresIn,
        loading: false,
        error: null,
      });

      console.log('Registration OTP resent successfully');
      return true;
    } catch (err: any) {
      set({ loading: false, error: extractErrorMessage(err) });
      return false;
    }
  },

  // -------- PROFILE: GET PROFILE --------
  getProfile: async () => {
    set({ loading: true, error: null });
    try {
      const response = await AuthService.getProfile();
      if (!response.success || !response.user) {
        set({ loading: false, error: response.message ?? 'Failed to fetch profile' });
        return false;
      }
      set({ user: response.user, loading: false, error: null });
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

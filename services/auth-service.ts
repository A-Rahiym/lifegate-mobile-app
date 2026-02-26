import api from './api';
import { saveToken } from '../utils/tokenStorage';
import { BackendLoginResponse, LoginPayload, RegisterPayload, AuthResponse } from '../types/auth-types';

export const AuthService = {

  /**
   * Login user with email and password
   * Calls POST /auth/login
   * Saves token to secure storage
   * Returns user data
   */
  async login(payload: LoginPayload): Promise<AuthResponse> {
    try {
      console.log('Sending login request to backend...');

      const response = await api.post<BackendLoginResponse>('/auth/login', payload);

      if (!response.data.success || !response.data.data) {
        console.log('Login failed:', response.data.message);
        return {
          success: false,
          message: response.data.message || 'Login failed',
        };
      }

      const { token, user } = response.data.data;

      // Save token to secure storage
      await saveToken(token);

      console.log('Login successful - token saved');

      return {
        success: true,
        user,
      };
    } catch (error: any) {
      console.error('Login error:', error.message);
      const message = error.response?.data?.message || 'Network error. Please try again.';
      return {
        success: false,
        message,
      };
    }
  },

  /**
   * Register new user with unified payload
   * Calls POST /auth/register
   * Saves token to secure storage
   * Returns user data
   * 
   * Works for both regular users and health professionals
   * Role is explicitly set in the payload
   */
  async register(payload: RegisterPayload): Promise<AuthResponse> {
    try {
      console.log('Sending registration request to backend...', payload);

      const response = await api.post<BackendLoginResponse>('/auth/register', payload);

      if (!response.data.success || !response.data.data) {
        console.log('Registration failed:', response.data.message);
        return {
          success: false,
          message: response.data.message || 'Registration failed',
        };
      }

      const { token, user } = response.data.data;

      // Save token to secure storage
      await saveToken(token);

      console.log('Registration successful - token saved');

      return {
        success: true,
        user,
      };
    } catch (error: any) {
      console.error('Registration error:', error.message);
      const message = error.response?.data?.message || 'Network error. Please try again.';
      return {
        success: false,
        message,
      };
    }
  },
};
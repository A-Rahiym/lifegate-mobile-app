// Centralized User Type - Single user with role-based data
export type User = {
  id: string;
  name: string;
  email: string;
  phone?: string;
  dob?: string;
  gender?: string;
  language?: string;
  healthHistory?: string;
  role: 'user' | 'professional'; // Required role field
  // Health professional specific fields
  specialization?: string;
  licenseNumber?: string;
  certificateName?: string;
  certificateId?: string;
  certificateIssueDate?: string;
  yearsOfExperience?: string;
};

// Form draft for registration - contains all possible fields
export type UserDraft = {
  // Required fields
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
  // Common profile fields
  phone: string;
  dob: string;
  gender: string;
  language: string;
  healthHistory: string;
  role?: 'user' | 'professional'; // Set based on registration choice
  // Health professional specific fields
  specialization?: string;
  licenseNumber?: string;
  certificateName?: string;
  certificateId?: string;
  certificateIssueDate?: string;
  yearsOfExperience?: string;
};

// Login payload
export type LoginPayload = {
  email: string;
  password: string;
};

// Registration payload - contains all fields for both user and health professional
export type RegisterPayload = {
  // Required fields
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
  // Common profile fields
  phone: string;
  dob: string;
  gender: string;
  language: string;
  healthHistory: string;
  role: 'user' | 'professional';
  // Health professional specific fields (optional)
  specialization?: string;
  licenseNumber?: string;
  certificateName?: string;
  certificateId?: string;
  certificateIssueDate?: string;
  yearsOfExperience?: string;
};

// Standard API response - Backend format with token
export type BackendLoginResponse = {
  success: boolean;
  message: string;
  data?: {
    token: string;
    user: User;
  };
};

// Auth response for client
export type AuthResponse = {
  success: boolean;
  user?: User;
  message?: string;
};

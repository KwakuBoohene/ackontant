export interface User {
  id: string;
  email: string;
  isEmailVerified: boolean;
  socialAccounts: SocialAccount[];
  createdAt: string;
  updatedAt: string;
}

export interface SocialAccount {
  provider: SocialProvider;
  providerUserId: string;
  email: string;
  picture?: string;
  isConnected: boolean;
}

export type SocialProvider = 'GOOGLE' | 'FACEBOOK' | 'GITHUB' | 'APPLE';

export interface AuthError {
  code: string;
  message: string;
  field?: string;
  details?: any;
  provider?: string;
}

export interface LoginFormData {
  email: string;
  password: string;
}

export interface RegisterFormData {
  email: string;
  password: string;
  confirmPassword: string;
  acceptTerms: boolean;
}

export interface PasswordResetData {
  email: string;
  password?: string;
  token?: string;
} 
export interface User {
  id: string;
  email: string;
  isEmailVerified: boolean;
  createdAt: string;
  updatedAt: string;
}

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
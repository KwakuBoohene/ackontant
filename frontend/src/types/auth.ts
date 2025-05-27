export interface User {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  is_email_verified: boolean;
  base_currency: {
    id: string;
    code: string;
    name: string;
  } | null;
  created_at: string;
  updated_at: string;
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
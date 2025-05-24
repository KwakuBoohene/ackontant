import { useMutation } from '@tanstack/react-query';
import { useNavigate } from '@tanstack/react-router';
import api from '../services/api';
import { useAuthStore } from '../stores/authStore';

interface LoginCredentials {
  email: string;
  password: string;
}

interface RegisterCredentials extends LoginCredentials {
  first_name: string;
  last_name: string;
}

export const useLogin = () => {
  const navigate = useNavigate();
  const login = useAuthStore((state) => state.login);

  return useMutation({
    mutationFn: async (credentials: LoginCredentials) => {
      console.log('Attempting login with:', { email: credentials.email });
      const response = await api.post('/auth/login/', credentials);
      console.log('Login response:', response.data);
      return response.data;
    },
    onSuccess: (response) => {
      console.log('Login successful, updating store...');
      login(response.user, response.access, response.refresh);
      // Small delay to ensure store is updated
      setTimeout(() => {
        console.log('Navigating to dashboard...');
        navigate({ to: '/dashboard' });
      }, 100);
    },
    onError: (error: any) => {
      console.error('Login mutation error:', {
        status: error.response?.status,
        data: error.response?.data,
        message: error.message
      });
    }
  });
};

export const useRegister = () => {
  const navigate = useNavigate();
  const login = useAuthStore((state) => state.login);

  return useMutation({
    mutationFn: async (credentials: RegisterCredentials) => {
      console.log('Attempting registration with:', { email: credentials.email });
      const response = await api.post('/auth/register/', credentials);
      console.log('Registration response:', response.data);
      return response.data;
    },
    onSuccess: (response) => {
      console.log('Registration successful, updating store...');
      login(response.user, response.access, response.refresh);
      // Small delay to ensure store is updated
      setTimeout(() => {
        console.log('Navigating to dashboard...');
        navigate({ to: '/dashboard' });
      }, 100);
    },
    onError: (error: any) => {
      console.error('Registration mutation error:', {
        status: error.response?.status,
        data: error.response?.data,
        message: error.message
      });
    }
  });
}; 
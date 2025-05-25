import { useMutation } from '@tanstack/react-query';
import { useNavigate } from '@tanstack/react-router';
import { authApi } from '../api/auth';
import { useAuthStore } from '../stores/authStore';
import type { LoginFormData, RegisterFormData } from '../types/auth';

export const useLogin = () => {
  const navigate = useNavigate();
  const login = useAuthStore((state) => state.login);

  return useMutation({
    mutationFn: authApi.login,
    onSuccess: (response) => {
      login(response.user, response.access, response.refresh);
      // Small delay to ensure store is updated
      setTimeout(() => {
        navigate({ to: '/dashboard' });
      }, 100);
    },
  });
};

export const useRegister = () => {
  const navigate = useNavigate();
  const login = useAuthStore((state) => state.login);

  return useMutation({
    mutationFn: authApi.register,
    onSuccess: (response) => {
      login(response.user, response.access, response.refresh);
      // Small delay to ensure store is updated
      setTimeout(() => {
        navigate({ to: '/dashboard' });
      }, 100);
    },
  });
};

export const useLogout = () => {
  const navigate = useNavigate();
  const logout = useAuthStore((state) => state.logout);

  return useMutation({
    mutationFn: (refreshToken: string) => authApi.logout(refreshToken),
    onSuccess: () => {
      logout();
      navigate({ to: '/auth/login' });
    },
  });
};

export const useVerifyEmail = () => {
  return useMutation({
    mutationFn: (token: string) => authApi.verifyEmail(token),
  });
};

export const useRequestPasswordReset = () => {
  return useMutation({
    mutationFn: (email: string) => authApi.requestPasswordReset(email),
  });
};

export const useResetPassword = () => {
  return useMutation({
    mutationFn: ({ token, password }: { token: string; password: string }) =>
      authApi.resetPassword(token, password),
  });
}; 
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import api from '../services/api';

interface User {
  id: number;
  email: string;
  first_name: string;
  last_name: string;
}

interface AuthState {
  user: User | null;
  accessToken: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  setAuth: (user: User, access: string, refresh: string) => void;
  logout: () => Promise<void>;
  login: (user: User, access: string, refresh: string) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      accessToken: null,
      refreshToken: null,
      isAuthenticated: false,
      setAuth: (user, access, refresh) => {
        set({
          user,
          accessToken: access,
          refreshToken: refresh,
          isAuthenticated: true,
        });
      },
      logout: async () => {
        try {
          const state = useAuthStore.getState();
          const refreshToken = state.refreshToken;
          const accessToken = state.accessToken;
          
          if (refreshToken && accessToken) {
            await api.post('/auth/logout/', 
              { refresh: refreshToken },
              { headers: { Authorization: `Bearer ${accessToken}` } }
            );
          }
        } catch (error) {
          console.error('Logout error:', error);
        } finally {
          set({
            user: null,
            accessToken: null,
            refreshToken: null,
            isAuthenticated: false,
          });
        }
      },
      login: (user, access, refresh) => {
        set({
          user,
          accessToken: access,
          refreshToken: refresh,
          isAuthenticated: true,
        });
      },
    }),
    {
      name: 'auth-storage',
    }
  )
); 
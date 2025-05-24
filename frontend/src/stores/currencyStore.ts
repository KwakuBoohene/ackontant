import { create } from 'zustand';
import api from '../services/api';

export interface Currency {
  id: string;
  code: string;
  name: string;
  symbol: string;
  decimal_places: number;
  is_active: boolean;
}

interface CurrencyState {
  currencies: Currency[];
  isLoading: boolean;
  error: string | null;
  
  // Actions
  fetchCurrencies: () => Promise<void>;
  clearError: () => void;
}

export const useCurrencyStore = create<CurrencyState>((set) => ({
  currencies: [],
  isLoading: false,
  error: null,

  fetchCurrencies: async () => {
    try {
      set({ isLoading: true, error: null });
      const response = await api.get('/currencies/');
      const currencies = Array.isArray(response.data) ? response.data : response.data.results || [];
      set({ currencies, isLoading: false });
    } catch (error) {
      console.error('Error fetching currencies:', error);
      set({ error: 'Failed to fetch currencies', isLoading: false });
    }
  },

  clearError: () => set({ error: null }),
})); 
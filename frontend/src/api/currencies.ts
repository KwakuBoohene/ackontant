import api from '../services/api';
import type { Currency } from '../types/currency';

const API_URL = '/currencies';

export const currencyApi = {
  // Get all currencies
  getCurrencies: async (): Promise<Currency[]> => {
    const { data } = await api.get(API_URL);
    return Array.isArray(data) ? data : data.results || [];
  },

  // Get currency by ID
  getCurrency: async (id: string): Promise<Currency> => {
    const { data } = await api.get(`${API_URL}/${id}/`);
    return data;
  },
}; 
import api from '../services/api';
import type { Category, CategoryFormData } from '../types/category';

const API_URL = '/transactions/categories';

export const categoryApi = {
  getCategories: async (params?: { search?: string }) => {
    const { data } = await api.get(API_URL, { params });
    return Array.isArray(data) ? data : data.results || [];
  },
  createCategory: async (categoryData: CategoryFormData): Promise<Category> => {
    const { data } = await api.post(API_URL, categoryData);
    return data;
  },
  getCategory: async (id: string): Promise<Category> => {
    const { data } = await api.get(`${API_URL}/${id}/`);
    return data;
  },
  updateCategory: async (id: string, categoryData: Partial<CategoryFormData>): Promise<Category> => {
    const { data } = await api.put(`${API_URL}/${id}/`, categoryData);
    return data;
  },
  deleteCategory: async (id: string): Promise<void> => {
    await api.delete(`${API_URL}/${id}/`);
  },
}; 
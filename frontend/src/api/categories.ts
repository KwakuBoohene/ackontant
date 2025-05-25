import axios from 'axios';
import type { Category, CategoryFormData } from '../types/category';

const API_URL = '/categories';

export const categoryApi = {
  getCategories: async (params?: { search?: string }) => {
    const { data } = await axios.get(API_URL, { params });
    return Array.isArray(data) ? data : data.results || [];
  },
  createCategory: async (categoryData: CategoryFormData): Promise<Category> => {
    const { data } = await axios.post(API_URL, categoryData);
    return data;
  },
  getCategory: async (id: string): Promise<Category> => {
    const { data } = await axios.get(`${API_URL}/${id}/`);
    return data;
  },
  updateCategory: async (id: string, categoryData: Partial<CategoryFormData>): Promise<Category> => {
    const { data } = await axios.put(`${API_URL}/${id}/`, categoryData);
    return data;
  },
  deleteCategory: async (id: string): Promise<void> => {
    await axios.delete(`${API_URL}/${id}/`);
  },
}; 
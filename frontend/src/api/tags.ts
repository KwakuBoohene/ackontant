
import type { Tag, TagFormData } from '../types/tag';
import api from '../services/api';

const API_URL = '/transactions/tags';

export const tagApi = {
  getTags: async (params?: { search?: string }) => {
    const { data } = await api.get(API_URL, { params });
    return Array.isArray(data) ? data : data.results || [];
  },
  createTag: async (tagData: TagFormData): Promise<Tag> => {
    const { data } = await api.post(API_URL, tagData);
    return data;
  },
  getTag: async (id: string): Promise<Tag> => {
    const { data } = await api.get(`${API_URL}/${id}/`);
    return data;
  },
  updateTag: async (id: string, tagData: Partial<TagFormData>): Promise<Tag> => {
    const { data } = await api.put(`${API_URL}/${id}/`, tagData);
    return data;
  },
  deleteTag: async (id: string): Promise<void> => {
    await api.delete(`${API_URL}/${id}/`);
  },
}; 
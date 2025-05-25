import axios from 'axios';
import type { Tag, TagFormData } from '../types/tag';

const API_URL = '/tags';

export const tagApi = {
  getTags: async (params?: { search?: string }) => {
    const { data } = await axios.get(API_URL, { params });
    return Array.isArray(data) ? data : data.results || [];
  },
  createTag: async (tagData: TagFormData): Promise<Tag> => {
    const { data } = await axios.post(API_URL, tagData);
    return data;
  },
  getTag: async (id: string): Promise<Tag> => {
    const { data } = await axios.get(`${API_URL}/${id}/`);
    return data;
  },
  updateTag: async (id: string, tagData: Partial<TagFormData>): Promise<Tag> => {
    const { data } = await axios.put(`${API_URL}/${id}/`, tagData);
    return data;
  },
  deleteTag: async (id: string): Promise<void> => {
    await axios.delete(`${API_URL}/${id}/`);
  },
}; 
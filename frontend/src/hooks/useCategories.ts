import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { categoryApi } from '../api/categories';
import type { Category, CategoryFormData } from '../types/category';

export const useCategories = (search?: string) => {
  return useQuery({
    queryKey: ['categories', search],
    queryFn: () => categoryApi.getCategories(search ? { search } : undefined),
  });
};

export const useCategory = (id: string) => {
  return useQuery({
    queryKey: ['categories', id],
    queryFn: () => categoryApi.getCategory(id),
    enabled: !!id,
  });
};

export const useCreateCategory = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: categoryApi.createCategory,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] });
    },
  });
}; 
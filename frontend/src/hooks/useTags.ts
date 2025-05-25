import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { tagApi } from '../api/tags';
import type { Tag, TagFormData } from '../types/tag';

export const useTags = (search?: string) => {
  return useQuery({
    queryKey: ['tags', search],
    queryFn: () => tagApi.getTags(search ? { search } : undefined),
  });
};

export const useTag = (id: string) => {
  return useQuery({
    queryKey: ['tags', id],
    queryFn: () => tagApi.getTag(id),
    enabled: !!id,
  });
};

export const useCreateTag = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: tagApi.createTag,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tags'] });
    },
  });
}; 
import { useQuery } from '@tanstack/react-query';
import { currencyApi } from '../api/currencies';

export const useCurrencies = () => {
  return useQuery({
    queryKey: ['currencies'],
    queryFn: currencyApi.getCurrencies,
  });
};

export const useCurrency = (id: string) => {
  return useQuery({
    queryKey: ['currencies', id],
    queryFn: () => currencyApi.getCurrency(id),
    enabled: !!id,
  });
}; 
export interface Currency {
  id: string;
  code: string;
  name: string;
  symbol: string;
  decimal_places: number;
  is_base_currency: boolean;
  exchange_rate: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface CurrencyFormData {
  code: string;
  name: string;
  symbol: string;
  decimal_places: number;
  is_base_currency: boolean;
  exchange_rate: number;
} 
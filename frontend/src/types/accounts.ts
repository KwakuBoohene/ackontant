import  type { Currency } from './currency';

export interface AccountType {
  CHECKING: 'Checking';
  SAVINGS: 'Savings';
  BANK: 'Bank';
  CREDIT_CARD: 'Credit Card';
  INVESTMENT: 'Investment';
  CASH: 'Cash';
}

export interface Account {
  id: string;
  user: string;
  name: string;
  type: keyof AccountType;
  currency: Currency;
  initial_balance: number;
  current_balance: number;
  base_currency_balance: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface AccountFormData {
  name: string;
  type: keyof AccountType;
  currency_id: string;
  initial_balance: number;
}

export interface AccountFilters {
  type?: keyof AccountType;
  search?: string;
  is_active?: boolean;
} 
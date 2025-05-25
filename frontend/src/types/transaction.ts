import type { Account } from './accounts';
import type { Category } from './category';
import type { Currency } from './currency';
import type { Tag } from './tag';

export interface TransactionType {
  INCOME: 'Income';
  EXPENSE: 'Expense';
  TRANSFER: 'Transfer';
}

export interface Transaction {
  id: string;
  user: string;
  account: {
    id: string;
    name: string;
  };
  type: keyof TransactionType;
  amount: number;
  currency: Currency;
  base_currency_amount: number;
  exchange_rate: number | null;
  description: string;
  date: string;
  category: Category | null;
  tags: Tag[];
  is_recurring: boolean;
  recurring_rule: any | null;
  is_archived: boolean;
  created_at: string;
  updated_at: string;
}

export interface TransactionFormData {
  account_id: string;
  type: keyof TransactionType;
  amount: number;
  currency_id: string;
  description: string;
  date: string;
  category_id?: string | null;
  tag_ids?: string[];
  is_recurring?: boolean;
  recurring_rule?: any;
  is_archived?: boolean;
}

export interface TransactionFilters {
  account_id?: string;
  type?: keyof TransactionType;
  category?: string;
  start_date?: string;
  end_date?: string;
} 
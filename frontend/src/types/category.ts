export type CategoryType = 'INCOME' | 'EXPENSE' | 'TRANSFER';

export interface Category {
  id: string;
  name: string;
  type: CategoryType;
  parent_id: string | null;
  color: string;
  icon: string;
  is_default: boolean;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface CategoryFormData {
  name: string;
  type: CategoryType;
  parent_id?: string | null;
  color: string;
  icon: string;
  is_default: boolean;
}

export interface CategoryFilters {
  type?: CategoryType;
  is_active?: boolean;
  search?: string;
} 
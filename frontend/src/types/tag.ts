export interface Tag {
  id: string;
  name: string;
  color: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface TagFormData {
  name: string;
  color: string;
  is_active: boolean;
}

export interface TagFilters {
  is_active?: boolean;
  search?: string;
  parent_id?: string | null;
}

export interface TagRule {
  id: string;
  tag_id: string;
  field: string;
  match_type: 'CONTAINS' | 'STARTS_WITH' | 'ENDS_WITH' | 'REGEX';
  pattern: string;
  priority: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface TagRuleFormData {
  tag_id: string;
  field: string;
  match_type: 'CONTAINS' | 'STARTS_WITH' | 'ENDS_WITH' | 'REGEX';
  pattern: string;
  priority: number;
} 
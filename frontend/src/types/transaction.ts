import type { AccountSummary } from './account';

export interface Category {
  id: string;
  name: string;
  description?: string;
  is_predefined: boolean;
  created_at: string;
  updated_at: string;
}

export interface TransactionBase {
  amount: number;
  payee: string;
  notes?: string;
  transaction_date: string;
  is_income: boolean;
  account_id: string;
  category_id: string;
}

export interface TransactionCreate extends TransactionBase {}

export interface TransactionUpdate {
  amount?: number;
  payee?: string;
  notes?: string;
  transaction_date?: string;
  is_income?: boolean;
  account_id?: string;
  category_id?: string;
}

export interface Transaction extends TransactionBase {
  id: string;
  created_at: string;
  updated_at: string;
  account?: AccountSummary;
  category?: Category;
}

export interface TransactionFilter {
  account_id?: string;
  category_id?: string;
  start_date?: string;
  end_date?: string;
  is_income?: boolean;
  min_amount?: number;
  max_amount?: number;
  search?: string;
}

export interface TransactionSummary {
  total_income: number;
  total_expenses: number;
  net_amount: number;
  transaction_count: number;
  average_transaction: number;
}

export interface CategorySummary {
  category_id: string;
  category_name: string;
  total_amount: number;
  transaction_count: number;
  percentage: number;
} 
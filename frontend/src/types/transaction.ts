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

// CSV Upload Related Types
export interface CSVUploadRequest {
  account_id: string;
  default_category_id: string;
  skip_header: boolean;
  date_format: string;
  transaction_categories?: Record<number, string>;
}

export interface CSVTransactionError {
  row_number: number;
  error_message: string;
  raw_data?: string;
}

export interface CSVUploadResponse {
  success: boolean;
  total_rows: number;
  successful_imports: number;
  failed_imports: number;
  errors: CSVTransactionError[];
  imported_transaction_ids: string[];
  message: string;
}

export interface CSVPreviewRow {
  row_number: number;
  transaction_date: string;
  payee: string;
  amount: number | string;
  parsed_date?: string;
  is_valid: boolean;
  errors: string[];
}

export interface CSVPreviewResponse {
  total_rows: number;
  preview_rows: CSVPreviewRow[];
  has_header: boolean;
  detected_format: string;
  estimated_valid_rows: number;
  validation_errors: string[];
} 
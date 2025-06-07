// Authentication types
export interface LoginRequest {
  username: string;
  password: string;
}

export interface LoginResponse {
  access_token: string;
  token_type: string;
}

export interface User {
  id: string;
  username: string;
  name: string;
  created_at: string;
}

// Account types
export enum AccountType {
  CHECKING = 'checking',
  SAVINGS = 'savings',
  INVESTMENT = 'investment',
}

export interface Account {
  id: string;
  user_id?: string;
  name: string;
  type: AccountType;
  balance?: number;
  created_at: string;
}

// Category types
export interface Category {
  id: string;
  user_id?: string;
  name: string;
  is_predefined: boolean;
  created_at: string;
}

// Transaction types
export interface Transaction {
  id: string;
  user_id?: string;
  account_id: string;
  category_id: string;
  amount: number;
  date: string;
  notes?: string;
  payment_method?: string;
  merchant?: string;
  tags?: string[];
  created_at: string;
}

export interface CreateTransactionRequest {
  account_id: string;
  category_id: string;
  amount: number;
  date: string;
  notes?: string;
  payment_method?: string;
  merchant?: string;
  tags?: string[];
}

// Recurring Transaction types
export enum Frequency {
  DAILY = 'daily',
  WEEKLY = 'weekly',
  MONTHLY = 'monthly',
  YEARLY = 'yearly',
}

export interface RecurringTransaction {
  id: string;
  user_id?: string;
  account_id: string;
  category_id: string;
  amount: number;
  start_date: string;
  frequency: Frequency;
  notes?: string;
  payment_method?: string;
  merchant?: string;
  tags?: string[];
  last_generated?: string;
  active: boolean;
  created_at: string;
}

// Budget types
export interface Budget {
  id: string;
  user_id?: string;
  category_id?: string;
  month: string;
  amount: number;
  created_at: string;
}

// API Response types
export interface ApiResponse<T> {
  data: T;
  message?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  page_size: number;
}

// Filter types
export interface TransactionFilters {
  start_date?: string;
  end_date?: string;
  account_id?: string;
  category_id?: string;
  merchant?: string;
  tags?: string[];
  payment_method?: string;
}

// Dashboard data types
export interface DashboardData {
  totalIncome: number;
  totalExpenses: number;
  totalSavings: number;
  accountBalances: {
    checking: number;
    savings: number;
    investment: number;
  };
  spendingByCategory: {
    category: string;
    amount: number;
  }[];
  monthlyTrends: {
    month: string;
    income: number;
    expenses: number;
  }[];
} 
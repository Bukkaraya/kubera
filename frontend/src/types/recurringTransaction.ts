import type { AccountSummary } from './account';
import type { Category } from './transaction';

export enum FrequencyType {
  DAILY = 'daily',
  WEEKLY = 'weekly',
  BIWEEKLY = 'biweekly',
  MONTHLY = 'monthly',
  QUARTERLY = 'quarterly',
  YEARLY = 'yearly'
}

export interface RecurringTransactionBase {
  amount: number;
  payee: string;
  notes?: string;
  frequency: FrequencyType;
  start_date: string;
  end_date?: string;
  is_income: boolean;
  account_id: string;
  category_id: string;
}

export interface RecurringTransactionCreate extends RecurringTransactionBase {}

export interface RecurringTransactionUpdate {
  amount?: number;
  payee?: string;
  notes?: string;
  frequency?: FrequencyType;
  start_date?: string;
  end_date?: string;
  is_income?: boolean;
  account_id?: string;
  category_id?: string;
  is_active?: boolean;
}

export interface RecurringTransaction extends RecurringTransactionBase {
  id: string;
  next_execution_date: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  account?: AccountSummary;
  category?: Category;
}

export interface RecurringTransactionSummary {
  id: string;
  payee: string;
  amount: number;
  frequency: FrequencyType;
  next_execution_date: string;
  is_active: boolean;
  account_name: string;
  category_name: string;
}

export const FREQUENCY_LABELS: Record<FrequencyType, string> = {
  [FrequencyType.DAILY]: 'Daily',
  [FrequencyType.WEEKLY]: 'Weekly',
  [FrequencyType.BIWEEKLY]: 'Bi-weekly',
  [FrequencyType.MONTHLY]: 'Monthly',
  [FrequencyType.QUARTERLY]: 'Quarterly',
  [FrequencyType.YEARLY]: 'Yearly'
}; 
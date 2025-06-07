export enum AccountType {
  CHECKING = 'checking',
  SAVINGS = 'savings',
  INVESTMENT = 'investment',
  CREDIT_CARD = 'credit_card',
  CASH = 'cash',
}

export interface AccountBase {
  name: string;
  account_type: AccountType;
  initial_balance: number;
  description?: string;
}

export interface AccountCreate extends AccountBase {}

export interface AccountUpdate {
  name?: string;
  account_type?: AccountType;
  description?: string;
  is_active?: boolean;
}

export interface Account extends AccountBase {
  id: string;
  current_balance: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface AccountSummary {
  id: string;
  name: string;
  account_type: AccountType;
  current_balance: number;
  is_active: boolean;
} 
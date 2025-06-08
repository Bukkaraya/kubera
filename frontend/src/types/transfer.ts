export interface TransferCreate {
  from_account_id: string;
  to_account_id: string;
  amount: number;
  description?: string;
  transfer_date: string; // ISO date string
}

export interface Transfer extends TransferCreate {
  id: string;
  from_transaction_id: string;
  to_transaction_id: string;
  created_at: string;
} 
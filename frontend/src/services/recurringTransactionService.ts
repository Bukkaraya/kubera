import api from './api';
import type { 
  RecurringTransaction, 
  RecurringTransactionCreate, 
  RecurringTransactionUpdate 
} from '../types/recurringTransaction';

export const recurringTransactionService = {
  // Get all recurring transactions with optional filtering
  async getRecurringTransactions(params?: {
    skip?: number;
    limit?: number;
    is_active?: boolean;
    account_id?: string;
    category_id?: string;
  }): Promise<RecurringTransaction[]> {
    const queryParams = new URLSearchParams();
    if (params?.skip) queryParams.append('skip', params.skip.toString());
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    if (params?.is_active !== undefined) queryParams.append('is_active', params.is_active.toString());
    if (params?.account_id) queryParams.append('account_id', params.account_id);
    if (params?.category_id) queryParams.append('category_id', params.category_id);

    const response = await api.get(`/api/recurring-transactions?${queryParams.toString()}`);
    return response.data;
  },

  // Get a specific recurring transaction by ID
  async getRecurringTransaction(recurringTransactionId: string): Promise<RecurringTransaction> {
    const response = await api.get(`/api/recurring-transactions/${recurringTransactionId}`);
    return response.data;
  },

  // Create a new recurring transaction
  async createRecurringTransaction(recurringTransactionData: RecurringTransactionCreate): Promise<RecurringTransaction> {
    const response = await api.post('/api/recurring-transactions', recurringTransactionData);
    return response.data;
  },

  // Update an existing recurring transaction
  async updateRecurringTransaction(recurringTransactionId: string, recurringTransactionData: RecurringTransactionUpdate): Promise<RecurringTransaction> {
    const response = await api.put(`/api/recurring-transactions/${recurringTransactionId}`, recurringTransactionData);
    return response.data;
  },

  // Delete a recurring transaction
  async deleteRecurringTransaction(recurringTransactionId: string): Promise<void> {
    await api.delete(`/api/recurring-transactions/${recurringTransactionId}`);
  },

  // Manually generate a transaction from a recurring transaction
  async generateTransaction(recurringTransactionId: string): Promise<{ message: string; transaction_id: string }> {
    const response = await api.post(`/api/recurring-transactions/${recurringTransactionId}/generate`);
    return response.data;
  },

  // Process all due recurring transactions
  async processDueRecurringTransactions(): Promise<{ message: string; count: number }> {
    const response = await api.post('/api/recurring-transactions/process-due');
    return response.data;
  },
}; 
import axios from 'axios';
import type { Transaction, TransactionCreate, TransactionFilter, TransactionSummary, CategorySummary, CSVUploadRequest, CSVUploadResponse, CSVPreviewResponse } from '../types/transaction';
import { authService } from './authService';
import { API_CONFIG } from '../config/api';

// Create axios instance with auth interceptor
const api = axios.create({
  baseURL: API_CONFIG.BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add auth token to requests
api.interceptors.request.use((config) => {
  const token = authService.getToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const transactionService = {
  // Get all transactions with optional filtering
  getTransactions: async (
    skip = 0,
    limit = 100,
    filters?: TransactionFilter
  ): Promise<Transaction[]> => {
    try {
      const params = new URLSearchParams();
      params.append('skip', skip.toString());
      params.append('limit', limit.toString());
      
      if (filters) {
        if (filters.account_id) params.append('account_id', filters.account_id);
        if (filters.category_id) params.append('category_id', filters.category_id);
        if (filters.start_date) params.append('start_date', filters.start_date);
        if (filters.end_date) params.append('end_date', filters.end_date);
        if (filters.is_income !== undefined) params.append('is_income', filters.is_income.toString());
        if (filters.min_amount !== undefined) params.append('min_amount', filters.min_amount.toString());
        if (filters.max_amount !== undefined) params.append('max_amount', filters.max_amount.toString());
        if (filters.search) params.append('search', filters.search);
      }

      const response = await api.get(`/api/transactions?${params.toString()}`);
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        throw new Error(error.response?.data?.detail || 'Failed to fetch transactions');
      }
      throw new Error('Network error');
    }
  },

  // Get single transaction
  getTransaction: async (transactionId: string): Promise<Transaction> => {
    try {
      const response = await api.get(`/api/transactions/${transactionId}`);
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        throw new Error(error.response?.data?.detail || 'Failed to fetch transaction');
      }
      throw new Error('Network error');
    }
  },

  // Create new transaction
  createTransaction: async (transactionData: TransactionCreate): Promise<Transaction> => {
    try {
      const response = await api.post('/api/transactions', transactionData);
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        throw new Error(error.response?.data?.detail || 'Failed to create transaction');
      }
      throw new Error('Network error');
    }
  },

  // Get monthly summary
  getMonthlySummary: async (
    year: number,
    month: number,
    accountId?: string
  ): Promise<TransactionSummary> => {
    try {
      const params = new URLSearchParams();
      params.append('year', year.toString());
      params.append('month', month.toString());
      if (accountId) params.append('account_id', accountId);

      const response = await api.get(`/api/transactions/summary/monthly?${params.toString()}`);
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        throw new Error(error.response?.data?.detail || 'Failed to fetch monthly summary');
      }
      throw new Error('Network error');
    }
  },

  // Get category summary
  getCategorySummary: async (
    startDate?: string,
    endDate?: string,
    accountId?: string
  ): Promise<CategorySummary[]> => {
    try {
      const params = new URLSearchParams();
      if (startDate) params.append('start_date', startDate);
      if (endDate) params.append('end_date', endDate);
      if (accountId) params.append('account_id', accountId);

      const response = await api.get(`/api/transactions/summary/category?${params.toString()}`);
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        throw new Error(error.response?.data?.detail || 'Failed to fetch category summary');
      }
      throw new Error('Network error');
    }
  },

  // Upload CSV file
  uploadCSV: async (
    file: File,
    uploadRequest: CSVUploadRequest
  ): Promise<CSVUploadResponse> => {
    try {
      const formData = new FormData();
      formData.append('csv_file', file);
      formData.append('account_id', uploadRequest.account_id);
      formData.append('default_category_id', uploadRequest.default_category_id);
      formData.append('skip_header', uploadRequest.skip_header.toString());
      formData.append('date_format', uploadRequest.date_format);
      
      // Add transaction categories as JSON string if provided
      if (uploadRequest.transaction_categories) {
        formData.append('transaction_categories', JSON.stringify(uploadRequest.transaction_categories));
      }

      const response = await api.post('/api/transactions/upload-csv', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        throw new Error(error.response?.data?.detail || 'Failed to upload CSV file');
      }
      throw new Error('Network error');
    }
  },

  // Preview CSV file
  previewCSV: async (
    file: File,
    skipHeader: boolean = false,
    dateFormat: string = '%Y-%m-%d'
  ): Promise<CSVPreviewResponse> => {
    try {
      const formData = new FormData();
      formData.append('csv_file', file);
      formData.append('skip_header', skipHeader.toString());
      formData.append('date_format', dateFormat);

      const response = await api.post('/api/transactions/preview-csv', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        throw new Error(error.response?.data?.detail || 'Failed to preview CSV file');
      }
      throw new Error('Network error');
    }
  },
}; 
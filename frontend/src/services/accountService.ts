import axios from 'axios';
import type { Account, AccountCreate, AccountUpdate } from '../types/account';
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

export const accountService = {
  // Get all accounts
  getAccounts: async (skip = 0, limit = 100): Promise<Account[]> => {
    try {
      const response = await api.get(`/api/accounts?skip=${skip}&limit=${limit}`);
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        throw new Error(error.response?.data?.detail || 'Failed to fetch accounts');
      }
      throw new Error('Network error');
    }
  },

  // Get single account
  getAccount: async (accountId: string): Promise<Account> => {
    try {
      const response = await api.get(`/api/accounts/${accountId}`);
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        throw new Error(error.response?.data?.detail || 'Failed to fetch account');
      }
      throw new Error('Network error');
    }
  },

  // Create new account
  createAccount: async (accountData: AccountCreate): Promise<Account> => {
    try {
      const response = await api.post('/api/accounts', accountData);
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        throw new Error(error.response?.data?.detail || 'Failed to create account');
      }
      throw new Error('Network error');
    }
  },

  // Update account
  updateAccount: async (accountId: string, accountData: AccountUpdate): Promise<Account> => {
    try {
      const response = await api.put(`/api/accounts/${accountId}`, accountData);
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        throw new Error(error.response?.data?.detail || 'Failed to update account');
      }
      throw new Error('Network error');
    }
  },

  // Delete account
  deleteAccount: async (accountId: string): Promise<void> => {
    try {
      await api.delete(`/api/accounts/${accountId}`);
    } catch (error) {
      if (axios.isAxiosError(error)) {
        throw new Error(error.response?.data?.detail || 'Failed to delete account');
      }
      throw new Error('Network error');
    }
  },

  // Get account balance
  getAccountBalance: async (accountId: string): Promise<{ account_id: string; balance: number }> => {
    try {
      const response = await api.get(`/api/accounts/${accountId}/balance`);
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        throw new Error(error.response?.data?.detail || 'Failed to fetch account balance');
      }
      throw new Error('Network error');
    }
  },
}; 
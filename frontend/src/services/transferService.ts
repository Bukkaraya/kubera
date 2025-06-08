import axios from 'axios';
import type { Transfer, TransferCreate } from '../types/transfer';
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

export const transferService = {
  // Create new transfer
  createTransfer: async (transferData: TransferCreate): Promise<Transfer> => {
    try {
      const response = await api.post('/api/transfers', transferData);
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        throw new Error(error.response?.data?.detail || 'Failed to create transfer');
      }
      throw new Error('Network error');
    }
  },

  // Get all transfers
  getTransfers: async (skip = 0, limit = 100): Promise<Transfer[]> => {
    try {
      const response = await api.get(`/api/transfers?skip=${skip}&limit=${limit}`);
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        throw new Error(error.response?.data?.detail || 'Failed to fetch transfers');
      }
      throw new Error('Network error');
    }
  },

  // Get single transfer
  getTransfer: async (transferId: string): Promise<Transfer> => {
    try {
      const response = await api.get(`/api/transfers/${transferId}`);
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        throw new Error(error.response?.data?.detail || 'Failed to fetch transfer');
      }
      throw new Error('Network error');
    }
  },
}; 
import axios from 'axios';
import type { Category } from '../types/transaction';
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

export const categoryService = {
  // Get all categories
  getCategories: async (skip = 0, limit = 100): Promise<Category[]> => {
    try {
      const response = await api.get(`/api/categories?skip=${skip}&limit=${limit}`);
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        throw new Error(error.response?.data?.detail || 'Failed to fetch categories');
      }
      throw new Error('Network error');
    }
  },

  // Create a new category
  createCategory: async (categoryData: { name: string; description?: string }): Promise<Category> => {
    try {
      const response = await api.post('/api/categories', categoryData);
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        throw new Error(error.response?.data?.detail || 'Failed to create category');
      }
      throw new Error('Network error');
    }
  },

  // Seed predefined categories (useful for first-time setup)
  seedCategories: async (): Promise<void> => {
    try {
      await api.post('/api/categories/seed');
    } catch (error) {
      if (axios.isAxiosError(error)) {
        throw new Error(error.response?.data?.detail || 'Failed to seed categories');
      }
      throw new Error('Network error');
    }
  },
}; 
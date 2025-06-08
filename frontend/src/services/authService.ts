import axios from 'axios';
import { API_CONFIG } from '../config/api';

// Types for authentication
export interface LoginRequest {
  username: string;
  password: string;
}

export interface LoginResponse {
  access_token: string;
  token_type: string;
}

// Authentication service
export const authService = {
  login: async (credentials: LoginRequest): Promise<LoginResponse> => {
    try {
      const response = await axios.post(`${API_CONFIG.BASE_URL}/api/auth/login`, credentials);
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        throw new Error(error.response?.data?.detail || 'Login failed');
      }
      throw new Error('Network error');
    }
  },

  // Store token in localStorage
  saveToken: (token: string) => {
    localStorage.setItem('access_token', token);
  },

  // Get token from localStorage
  getToken: (): string | null => {
    return localStorage.getItem('access_token');
  },

  // Remove token from localStorage
  removeToken: () => {
    localStorage.removeItem('access_token');
  },

  // Check if user is authenticated
  isAuthenticated: (): boolean => {
    return !!localStorage.getItem('access_token');
  },
}; 
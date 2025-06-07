import axios, { AxiosInstance, AxiosResponse } from 'axios';
import {
  LoginRequest,
  LoginResponse,
  // Account,
  Category,
  Transaction,
  CreateTransactionRequest,
  RecurringTransaction,
  Budget,
  TransactionFilters,
  ApiResponse,
  PaginatedResponse,
} from '../types';

class ApiService {
  private api: AxiosInstance;
  private baseURL: string;

  constructor() {
    this.baseURL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';
    
    this.api = axios.create({
      baseURL: this.baseURL,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Request interceptor to add auth token
    this.api.interceptors.request.use(
      (config) => {
        const token = this.getToken();
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => {
        return Promise.reject(error);
      }
    );

    // Response interceptor for error handling
    this.api.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response?.status === 401) {
          this.removeToken();
          window.location.href = '/login';
        }
        return Promise.reject(error);
      }
    );
  }

  // Token management
  private getToken(): string | null {
    return localStorage.getItem('auth_token');
  }

  private setToken(token: string): void {
    localStorage.setItem('auth_token', token);
  }

  private removeToken(): void {
    localStorage.removeItem('auth_token');
  }

  // Authentication endpoints
  async login(credentials: LoginRequest): Promise<LoginResponse> {
    const response: AxiosResponse<LoginResponse> = await this.api.post('/login', credentials);
    this.setToken(response.data.access_token);
    return response.data;
  }

  logout(): void {
    this.removeToken();
  }

  isAuthenticated(): boolean {
    return this.getToken() !== null;
  }

  // Categories endpoints
  async getCategories(): Promise<Category[]> {
    const response: AxiosResponse<Category[]> = await this.api.get('/categories');
    return response.data;
  }

  async createCategory(category: Omit<Category, 'id' | 'created_at'>): Promise<Category> {
    const response: AxiosResponse<Category> = await this.api.post('/categories', category);
    return response.data;
  }

  async updateCategory(id: string, category: Partial<Category>): Promise<Category> {
    const response: AxiosResponse<Category> = await this.api.put(`/categories/${id}`, category);
    return response.data;
  }

  async deleteCategory(id: string): Promise<void> {
    await this.api.delete(`/categories/${id}`);
  }

  // Accounts endpoints
  async getAccounts(): Promise<Account[]> {
    const response: AxiosResponse<Account[]> = await this.api.get('/accounts');
    return response.data;
  }

  async createAccount(account: Omit<Account, 'id' | 'created_at' | 'balance'>): Promise<Account> {
    const response: AxiosResponse<Account> = await this.api.post('/accounts', account);
    return response.data;
  }

  async updateAccount(id: string, account: Partial<Account>): Promise<Account> {
    const response: AxiosResponse<Account> = await this.api.put(`/accounts/${id}`, account);
    return response.data;
  }

  async deleteAccount(id: string): Promise<void> {
    await this.api.delete(`/accounts/${id}`);
  }

  // Transactions endpoints
  async getTransactions(filters?: TransactionFilters): Promise<Transaction[]> {
    const params = new URLSearchParams();
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          if (Array.isArray(value)) {
            value.forEach(v => params.append(key, v));
          } else {
            params.append(key, value.toString());
          }
        }
      });
    }
    
    const response: AxiosResponse<Transaction[]> = await this.api.get(`/transactions?${params}`);
    return response.data;
  }

  async createTransaction(transaction: CreateTransactionRequest): Promise<Transaction> {
    const response: AxiosResponse<Transaction> = await this.api.post('/transactions', transaction);
    return response.data;
  }

  async updateTransaction(id: string, transaction: Partial<CreateTransactionRequest>): Promise<Transaction> {
    const response: AxiosResponse<Transaction> = await this.api.put(`/transactions/${id}`, transaction);
    return response.data;
  }

  async deleteTransaction(id: string): Promise<void> {
    await this.api.delete(`/transactions/${id}`);
  }

  // Recurring Transactions endpoints
  async getRecurringTransactions(): Promise<RecurringTransaction[]> {
    const response: AxiosResponse<RecurringTransaction[]> = await this.api.get('/recurring-transactions');
    return response.data;
  }

  async createRecurringTransaction(transaction: Omit<RecurringTransaction, 'id' | 'created_at' | 'last_generated'>): Promise<RecurringTransaction> {
    const response: AxiosResponse<RecurringTransaction> = await this.api.post('/recurring-transactions', transaction);
    return response.data;
  }

  async updateRecurringTransaction(id: string, transaction: Partial<RecurringTransaction>): Promise<RecurringTransaction> {
    const response: AxiosResponse<RecurringTransaction> = await this.api.put(`/recurring-transactions/${id}`, transaction);
    return response.data;
  }

  async deleteRecurringTransaction(id: string): Promise<void> {
    await this.api.delete(`/recurring-transactions/${id}`);
  }

  // Budgets endpoints
  async getBudgets(): Promise<Budget[]> {
    const response: AxiosResponse<Budget[]> = await this.api.get('/budgets');
    return response.data;
  }

  async createBudget(budget: Omit<Budget, 'id' | 'created_at'>): Promise<Budget> {
    const response: AxiosResponse<Budget> = await this.api.post('/budgets', budget);
    return response.data;
  }

  async updateBudget(id: string, budget: Partial<Budget>): Promise<Budget> {
    const response: AxiosResponse<Budget> = await this.api.put(`/budgets/${id}`, budget);
    return response.data;
  }

  async deleteBudget(id: string): Promise<void> {
    await this.api.delete(`/budgets/${id}`);
  }

  // Import endpoint
  async importSpreadsheet(file: File): Promise<{ message: string; imported_count: number }> {
    const formData = new FormData();
    formData.append('file', file);
    
    const response: AxiosResponse<{ message: string; imported_count: number }> = await this.api.post(
      '/import/spreadsheet',
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      }
    );
    return response.data;
  }
}

export const apiService = new ApiService(); 
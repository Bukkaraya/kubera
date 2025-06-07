import api from './api';
import type { Budget, BudgetCreate, BudgetUpdate, BudgetAnalysis } from '../types/budget';

export const budgetService = {
  // Get all budgets with optional filtering
  async getBudgets(params?: {
    skip?: number;
    limit?: number;
    year?: number;
    month?: number;
    category_id?: string;
  }): Promise<Budget[]> {
    const queryParams = new URLSearchParams();
    if (params?.skip) queryParams.append('skip', params.skip.toString());
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    if (params?.year) queryParams.append('year', params.year.toString());
    if (params?.month) queryParams.append('month', params.month.toString());
    if (params?.category_id) queryParams.append('category_id', params.category_id);

    const response = await api.get(`/api/budgets?${queryParams.toString()}`);
    return response.data;
  },

  // Get a specific budget by ID
  async getBudget(budgetId: string): Promise<Budget> {
    const response = await api.get(`/api/budgets/${budgetId}`);
    return response.data;
  },

  // Create a new budget
  async createBudget(budgetData: BudgetCreate): Promise<Budget> {
    const response = await api.post('/api/budgets', budgetData);
    return response.data;
  },

  // Update an existing budget
  async updateBudget(budgetId: string, budgetData: BudgetUpdate): Promise<Budget> {
    const response = await api.put(`/api/budgets/${budgetId}`, budgetData);
    return response.data;
  },

  // Delete a budget
  async deleteBudget(budgetId: string): Promise<void> {
    await api.delete(`/api/budgets/${budgetId}`);
  },

  // Get budget analysis for a specific month/year
  async getBudgetAnalysis(year: number, month: number): Promise<BudgetAnalysis> {
    const response = await api.get(`/api/budgets/analysis/${year}/${month}`);
    return response.data;
  },

  // Get current month budget summary
  async getCurrentMonthSummary(): Promise<BudgetAnalysis> {
    const response = await api.get('/api/budgets/current/summary');
    return response.data;
  },

  // Refresh spent amounts by recalculating from transactions
  async refreshSpentAmounts(year?: number, month?: number): Promise<{ message: string; count: number }> {
    const queryParams = new URLSearchParams();
    if (year) queryParams.append('year', year.toString());
    if (month) queryParams.append('month', month.toString());

    const response = await api.post(`/api/budgets/refresh-spent-amounts?${queryParams.toString()}`);
    return response.data;
  },
}; 
export interface Budget {
  id: string;
  name: string;
  amount: number;
  spent_amount: number;
  remaining_amount: number;
  percentage_used: number;
  period_year: number;
  period_month: number;
  category_id: string;
  created_at: string;
  updated_at: string;
  category?: {
    id: string;
    name: string;
    type: string;
  };
}

export interface BudgetCreate {
  name: string;
  amount: number;
  period_year: number;
  period_month: number;
  category_id: string;
}

export interface BudgetUpdate {
  name?: string;
  amount?: number;
  period_year?: number;
  period_month?: number;
  category_id?: string;
}

export interface BudgetSummary {
  id: string;
  name: string;
  amount: number;
  spent_amount: number;
  remaining_amount: number;
  percentage_used: number;
  category_name: string;
  is_over_budget: boolean;
}

export interface BudgetAnalysis {
  year: number;
  month: number;
  total_budgeted: number;
  total_spent: number;
  total_remaining: number;
  overall_percentage_used: number;
  budgets_count: number;
  over_budget_count: number;
  budgets: BudgetSummary[];
}

export interface BudgetPerformance {
  budget_id: string;
  budget_name: string;
  category_name: string;
  budgeted_amount: number;
  spent_amount: number;
  variance: number;
  variance_percentage: number;
  days_remaining: number;
  projected_spending?: number;
} 
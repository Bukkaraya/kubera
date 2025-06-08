export enum GoalType {
  AMOUNT = 'amount',
  AMOUNT_DATE = 'amount_date',
}

export enum GoalStatus {
  ACTIVE = 'active',
  COMPLETED = 'completed',
  PAUSED = 'paused',
  CANCELLED = 'cancelled',
}

export interface GoalBase {
  name: string;
  description?: string;
  goal_type: GoalType;
  target_amount: number;
  target_date?: string;
  account_id: string;
}

export interface GoalCreate extends GoalBase {}

export interface GoalUpdate {
  name?: string;
  description?: string;
  target_amount?: number;
  target_date?: string;
  status?: GoalStatus;
  current_amount?: number;
  is_active?: boolean;
}

export interface GoalProgressUpdate {
  current_amount: number;
}

export interface Goal extends GoalBase {
  id: string;
  status: GoalStatus;
  current_amount: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  completed_at?: string;
  progress_percentage: number;
  remaining_amount: number;
  days_remaining?: number;
  is_completed: boolean;
}

export interface GoalSummary {
  id: string;
  name: string;
  goal_type: GoalType;
  status: GoalStatus;
  target_amount: number;
  target_date?: string;
  current_amount: number;
  progress_percentage: number;
  is_completed: boolean;
  account_name: string;
}

export interface GoalStats {
  total_goals: number;
  active_goals: number;
  completed_goals: number;
  total_target_amount: number;
  total_current_amount: number;
  overall_progress_percentage: number;
}

export interface GoalFilters {
  account_id?: string;
  status?: GoalStatus;
  is_active?: boolean;
} 
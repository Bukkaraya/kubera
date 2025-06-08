import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  Box,
  Typography,
  FormHelperText,
} from '@mui/material';
import { AmountInput } from './AmountInput';
import { DateTimePicker } from '@mui/x-date-pickers/DateTimePicker';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import type { Account } from '../types/account';
import type { Goal, GoalCreate, GoalUpdate, GoalType } from '../types/goal';
import { accountService } from '../services/accountService';

interface GoalFormProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (goalData: GoalCreate | GoalUpdate) => Promise<void>;
  goal?: Goal | null; // For editing existing goals
}

export const GoalForm: React.FC<GoalFormProps> = ({
  open,
  onClose,
  onSubmit,
  goal,
}) => {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [formData, setFormData] = useState<GoalCreate>({
    name: '',
    description: '',
    goal_type: 'amount' as GoalType,
    target_amount: 0,
    target_date: undefined,
    account_id: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const isEditing = !!goal;

  // Initialize form data when goal changes or dialog opens
  useEffect(() => {
    if (open) {
      if (goal) {
        setFormData({
          name: goal.name,
          description: goal.description || '',
          goal_type: goal.goal_type,
          target_amount: goal.target_amount,
          target_date: goal.target_date,
          account_id: goal.account_id,
        });
      } else {
        setFormData({
          name: '',
          description: '',
          goal_type: 'amount' as GoalType,
          target_amount: 0,
          target_date: undefined,
          account_id: '',
        });
      }
      loadAccounts();
    }
  }, [open, goal]);

  const loadAccounts = async () => {
    try {
      const accountsData = await accountService.getAccounts();
      setAccounts(accountsData);
    } catch (err) {
      setError('Failed to load accounts');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    // Validation
    if (!formData.name.trim()) {
      setError('Goal name is required');
      setLoading(false);
      return;
    }

    if (!formData.account_id) {
      setError('Please select an account');
      setLoading(false);
      return;
    }

    // Amount validation (required for all goals now)
    if (!formData.target_amount || formData.target_amount <= 0) {
      setError('Target amount is required and must be greater than 0');
      setLoading(false);
      return;
    }

    // Date validation for amount_date goals
    if (formData.goal_type === 'amount_date') {
      if (!formData.target_date) {
        setError('Target date is required for amount+date goals');
        setLoading(false);
        return;
      }

      const targetDate = new Date(formData.target_date);
      if (targetDate <= new Date()) {
        setError('Target date must be in the future');
        setLoading(false);
        return;
      }
    }

    try {
      await onSubmit(formData);
      handleClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save goal');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setFormData({
      name: '',
      description: '',
      goal_type: 'amount' as GoalType,
      target_amount: 0,
      target_date: undefined,
      account_id: '',
    });
    setError('');
    onClose();
  };

  const handleGoalTypeChange = (goalType: GoalType) => {
    setFormData({
      ...formData,
      goal_type: goalType,
      target_date: goalType === 'amount' ? undefined : formData.target_date,
    });
  };

  const getGoalTypeDescription = (type: GoalType): string => {
    switch (type) {
      case 'amount':
        return 'Save a specific amount (no deadline)';
      case 'amount_date':
        return 'Save a specific amount by a specific date';
      default:
        return '';
    }
  };

  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns}>
      <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
        <DialogTitle>
          {isEditing ? 'Edit Goal' : 'Create New Goal'}
        </DialogTitle>
        <form onSubmit={handleSubmit}>
          <DialogContent>
            {error && (
              <Alert severity="error" sx={{ mb: 2 }}>
                {error}
              </Alert>
            )}

            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <TextField
                fullWidth
                required
                label="Goal Name"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                disabled={loading}
                placeholder="e.g., Emergency Fund, Vacation, New Car"
              />

              <TextField
                fullWidth
                label="Description (optional)"
                multiline
                rows={2}
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
                disabled={loading}
                placeholder="Add details about your goal..."
              />

              <FormControl fullWidth required>
                <InputLabel>Account</InputLabel>
                <Select
                  value={formData.account_id}
                  label="Account"
                  onChange={(e) =>
                    setFormData({ ...formData, account_id: e.target.value })
                  }
                  disabled={loading}
                >
                  {accounts.map((account) => (
                    <MenuItem key={account.id} value={account.id}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', width: '100%' }}>
                        <span>{account.name}</span>
                        <span>{formatCurrency(account.current_balance)}</span>
                      </Box>
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              <FormControl fullWidth required>
                <InputLabel>Goal Type</InputLabel>
                <Select
                  value={formData.goal_type}
                  label="Goal Type"
                  onChange={(e) =>
                    handleGoalTypeChange(e.target.value as GoalType)
                  }
                  disabled={loading}
                >
                  <MenuItem value="amount">Amount Goal</MenuItem>
                  <MenuItem value="amount_date">Amount + Date Goal</MenuItem>
                </Select>
                <FormHelperText>
                  {getGoalTypeDescription(formData.goal_type)}
                </FormHelperText>
              </FormControl>

              <AmountInput
                value={formData.target_amount || 0}
                onChange={(value) => setFormData({ ...formData, target_amount: value })}
                disabled={loading}
                required
                label="Target Amount"
              />

              {formData.goal_type === 'amount_date' && (
                <DateTimePicker
                  label="Target Date"
                  value={formData.target_date ? new Date(formData.target_date) : null}
                  onChange={(date) =>
                    setFormData({
                      ...formData,
                      target_date: date?.toISOString(),
                    })
                  }
                  disabled={loading}
                  slotProps={{
                    textField: {
                      fullWidth: true,
                      required: true,
                    },
                  }}
                />
              )}

              {/* Preview section */}
              {formData.name && formData.account_id && (
                <Box sx={{ 
                  p: 2, 
                  bgcolor: 'background.paper',
                  border: 1,
                  borderColor: 'divider',
                  borderRadius: 1,
                  mt: 1
                }}>
                  <Typography variant="subtitle2" gutterBottom>
                    Goal Preview
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    <strong>{formData.name}</strong> - {getGoalTypeDescription(formData.goal_type)}
                  </Typography>
                  {formData.target_amount && (
                    <Typography variant="body2" color="text.secondary">
                      Target: {formatCurrency(formData.target_amount)}
                    </Typography>
                  )}
                  {formData.target_date && (
                    <Typography variant="body2" color="text.secondary">
                      Due: {new Date(formData.target_date).toLocaleDateString()}
                    </Typography>
                  )}
                </Box>
              )}
            </Box>
          </DialogContent>

          <DialogActions>
            <Button onClick={handleClose} disabled={loading}>
              Cancel
            </Button>
            <Button 
              type="submit" 
              variant="contained" 
              disabled={loading}
            >
              {loading ? 'Saving...' : (isEditing ? 'Update Goal' : 'Create Goal')}
            </Button>
          </DialogActions>
        </form>
      </Dialog>
    </LocalizationProvider>
  );
}; 
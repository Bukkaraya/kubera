import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Box,
  Alert,
  Switch,
  FormControlLabel,
  Typography,
} from '@mui/material';
import { DateTimePicker } from '@mui/x-date-pickers/DateTimePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import type { RecurringTransaction, RecurringTransactionUpdate, FrequencyType } from '../types/recurringTransaction';
import { FREQUENCY_LABELS } from '../types/recurringTransaction';
import type { Account } from '../types/account';
import type { Category } from '../types/transaction';
import { accountService } from '../services/accountService';
import { categoryService } from '../services/categoryService';

interface EditRecurringTransactionDialogProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (recurringTransactionData: RecurringTransactionUpdate) => Promise<void>;
  recurringTransaction: RecurringTransaction | null;
}

export const EditRecurringTransactionDialog: React.FC<EditRecurringTransactionDialogProps> = ({
  open,
  onClose,
  onSubmit,
  recurringTransaction,
}) => {
  const [formData, setFormData] = useState<RecurringTransactionUpdate>({
    payee: '',
    amount: 0,
    account_id: '',
    category_id: '',
    frequency: 'monthly' as FrequencyType,
    start_date: new Date().toISOString(),
    is_income: false,
    notes: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loadingData, setLoadingData] = useState(false);

  // Load data and populate form when dialog opens or recurring transaction changes
  useEffect(() => {
    if (open && recurringTransaction) {
      loadData();
      setFormData({
        payee: recurringTransaction.payee,
        amount: recurringTransaction.amount,
        account_id: recurringTransaction.account_id,
        category_id: recurringTransaction.category_id,
        frequency: recurringTransaction.frequency,
        start_date: recurringTransaction.start_date,
        end_date: recurringTransaction.end_date,
        is_income: recurringTransaction.is_income,
        notes: recurringTransaction.notes || '',
        is_active: recurringTransaction.is_active,
      });
    }
  }, [open, recurringTransaction]);

  const loadData = async () => {
    try {
      setLoadingData(true);
      const [accountsData, categoriesData] = await Promise.all([
        accountService.getAccounts(),
        categoryService.getCategories(),
      ]);
      setAccounts(accountsData);
      setCategories(categoriesData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load data');
    } finally {
      setLoadingData(false);
    }
  };

  const handleInputChange = (field: keyof RecurringTransactionUpdate) => (
    event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement> | { target: { value: unknown } }
  ) => {
    const value = event.target.value;
    setFormData(prev => ({
      ...prev,
      [field]: field === 'amount' ? Number(value) || 0 : value,
    }));
    // Clear error when user starts typing
    if (error) setError('');
  };

  const handleDateChange = (field: 'start_date' | 'end_date') => (date: Date | null) => {
    setFormData(prev => ({
      ...prev,
      [field]: date ? date.toISOString() : undefined,
    }));
  };

  const handleSwitchChange = (field: 'is_income' | 'is_active') => (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    setFormData(prev => ({
      ...prev,
      [field]: event.target.checked,
    }));
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    
    // Validation
    if (!formData.payee?.trim()) {
      setError('Payee is required');
      return;
    }
    if (!formData.amount || formData.amount === 0) {
      setError('Amount must be greater than 0');
      return;
    }
    if (!formData.account_id) {
      setError('Account is required');
      return;
    }
    if (!formData.category_id) {
      setError('Category is required');
      return;
    }

    try {
      setLoading(true);
      setError('');
      await onSubmit(formData);
      handleClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update recurring transaction');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (!loading) {
      setError('');
      onClose();
    }
  };

  if (!recurringTransaction) return null;

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns}>
      <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
        <form onSubmit={handleSubmit}>
          <DialogTitle>Edit Recurring Transaction</DialogTitle>
          
          <DialogContent>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5, pt: 2 }}>
              {error && (
                <Alert severity="error">
                  {error}
                </Alert>
              )}

              {loadingData && (
                <Alert severity="info">
                  Loading accounts and categories...
                </Alert>
              )}

              {/* Payee */}
              <TextField
                label="Payee"
                value={formData.payee || ''}
                onChange={handleInputChange('payee')}
                fullWidth
                required
                disabled={loading || loadingData}
                placeholder="Who is this transaction with?"
              />

              {/* Amount and Income/Expense Toggle */}
              <Box sx={{ 
                display: 'flex', 
                flexDirection: 'column',
                alignItems: 'center',
                p: 3, 
                bgcolor: 'grey.50', 
                borderRadius: 2,
                border: '2px solid',
                borderColor: 'grey.300'
              }}>
                <Typography variant="h6" sx={{ mb: 2, color: 'text.secondary' }}>
                  Amount
                </Typography>
                <TextField
                  type="number"
                  value={formData.amount || ''}
                  onChange={handleInputChange('amount')}
                  disabled={loading || loadingData}
                  inputProps={{ 
                    min: 0.01, 
                    step: 0.01,
                    style: { 
                      fontSize: '2rem', 
                      textAlign: 'center',
                      fontWeight: 600
                    }
                  }}
                  sx={{ 
                    '& .MuiOutlinedInput-root': {
                      '& fieldset': { border: 'none' },
                    },
                    '& .MuiInputBase-input': {
                      color: formData.is_income ? 'success.main' : 'error.main'
                    }
                  }}
                  required
                />
                <FormControlLabel
                  control={
                    <Switch
                      checked={formData.is_income || false}
                      onChange={handleSwitchChange('is_income')}
                      color="success"
                      disabled={loading || loadingData}
                    />
                  }
                  label={
                    <Typography variant="body2" sx={{ fontWeight: 500 }}>
                      {formData.is_income ? 'Income' : 'Expense'}
                    </Typography>
                  }
                  sx={{ mt: 1 }}
                />
              </Box>

              {/* Account and Category */}
              <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 2 }}>
                <FormControl fullWidth required>
                  <InputLabel>Account</InputLabel>
                  <Select
                    value={formData.account_id || ''}
                    label="Account"
                    onChange={(e) => setFormData(prev => ({ ...prev, account_id: e.target.value }))}
                    disabled={loading || loadingData}
                  >
                    {accounts.map((account) => (
                      <MenuItem key={account.id} value={account.id}>
                        {account.name}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>

                <FormControl fullWidth required>
                  <InputLabel>Category</InputLabel>
                  <Select
                    value={formData.category_id || ''}
                    label="Category"
                    onChange={(e) => setFormData(prev => ({ ...prev, category_id: e.target.value }))}
                    disabled={loading || loadingData}
                  >
                    {categories.map((category) => (
                      <MenuItem key={category.id} value={category.id}>
                        {category.name}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Box>

              {/* Frequency */}
              <FormControl fullWidth required>
                <InputLabel>Frequency</InputLabel>
                <Select
                  value={formData.frequency || 'monthly'}
                  label="Frequency"
                  onChange={(e) => setFormData(prev => ({ ...prev, frequency: e.target.value as FrequencyType }))}
                  disabled={loading || loadingData}
                >
                  {Object.entries(FREQUENCY_LABELS).map(([value, label]) => (
                    <MenuItem key={value} value={value}>
                      {label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              {/* Start Date and End Date */}
              <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 2 }}>
                <DateTimePicker
                  label="Start Date"
                  value={formData.start_date ? new Date(formData.start_date) : new Date()}
                  onChange={handleDateChange('start_date')}
                  disabled={loading || loadingData}
                  slotProps={{
                    textField: {
                      fullWidth: true,
                      required: true,
                    },
                  }}
                />

                <DateTimePicker
                  label="End Date (Optional)"
                  value={formData.end_date ? new Date(formData.end_date) : null}
                  onChange={handleDateChange('end_date')}
                  disabled={loading || loadingData}
                  slotProps={{
                    textField: {
                      fullWidth: true,
                    },
                  }}
                />
              </Box>

              {/* Active Status */}
              <FormControlLabel
                control={
                  <Switch
                    checked={formData.is_active || false}
                    onChange={handleSwitchChange('is_active')}
                    color="primary"
                    disabled={loading || loadingData}
                  />
                }
                label={
                  <Typography variant="body2">
                    {formData.is_active ? 'Active' : 'Inactive'}
                  </Typography>
                }
              />

              {/* Notes */}
              <TextField
                label="Notes (Optional)"
                value={formData.notes || ''}
                onChange={handleInputChange('notes')}
                fullWidth
                multiline
                rows={2}
                disabled={loading || loadingData}
                placeholder="Optional additional details..."
                inputProps={{ maxLength: 500 }}
              />
            </Box>
          </DialogContent>

          <DialogActions sx={{ px: 3, pb: 3 }}>
            <Button onClick={handleClose} disabled={loading}>
              Cancel
            </Button>
            <Button 
              type="submit" 
              variant="contained" 
              disabled={loading || loadingData}
              size="large"
            >
              {loading ? 'Updating...' : 'Update Recurring Transaction'}
            </Button>
          </DialogActions>
        </form>
      </Dialog>
    </LocalizationProvider>
  );
}; 
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
  InputAdornment,
  Typography,
} from '@mui/material';
import { AmountInput } from './AmountInput';
import { DateTimePicker } from '@mui/x-date-pickers/DateTimePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import type { TransactionCreate, Category } from '../types/transaction';
import type { Account } from '../types/account';
import { accountService } from '../services/accountService';
import { categoryService } from '../services/categoryService';

interface CreateTransactionDialogProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (transactionData: TransactionCreate) => Promise<void>;
}

export const CreateTransactionDialog: React.FC<CreateTransactionDialogProps> = ({
  open,
  onClose,
  onSubmit,
}) => {
  const [formData, setFormData] = useState<TransactionCreate>({
    payee: '',
    amount: 0,
    account_id: '',
    category_id: '',
    transaction_date: new Date().toISOString(),
    is_income: false,
    notes: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loadingData, setLoadingData] = useState(false);

  // Load accounts and categories when dialog opens
  useEffect(() => {
    if (open) {
      loadData();
    }
  }, [open]);

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

  const handleInputChange = (field: keyof TransactionCreate) => (
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



  const handleDateChange = (date: Date | null) => {
    if (date) {
      setFormData(prev => ({
        ...prev,
        transaction_date: date.toISOString(),
      }));
    }
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    
    // Validation
    if (!formData.account_id) {
      setError('Please select an account');
      return;
    }

    if (!formData.category_id) {
      setError('Please select a category');
      return;
    }

    if (formData.amount === 0) {
      setError('Amount cannot be zero');
      return;
    }

    try {
      setLoading(true);
      setError('');
      
      // Prepare data for backend - determine is_income based on amount sign
      const transactionData: TransactionCreate = {
        ...formData,
        amount: formData.amount,
        is_income: formData.amount > 0,
      };
      
      await onSubmit(transactionData);
      handleClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create transaction');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (!loading) {
      setFormData({
        payee: '',
        amount: 0,
        account_id: '',
        category_id: '',
        transaction_date: new Date().toISOString(),
        is_income: false,
        notes: '',
      });
      setError('');
      onClose();
    }
  };

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns}>
      <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
        <form onSubmit={handleSubmit}>
          <DialogTitle>Add New Transaction</DialogTitle>
          
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

              {/* Amount - First and Prominent */}
              <AmountInput
                value={formData.amount || 0}
                onChange={(value) => setFormData(prev => ({ ...prev, amount: value }))}
                disabled={loading || loadingData}
                required
              />

              {/* Payee */}
              <TextField
                label="Payee"
                value={formData.payee}
                onChange={handleInputChange('payee')}
                fullWidth
                required
                disabled={loading || loadingData}
                placeholder="e.g., Starbucks, Amazon, John Doe"
                inputProps={{ maxLength: 255 }}
              />

              {/* Account and Category - side by side */}
              <Box sx={{ display: 'flex', gap: 2 }}>
                <FormControl fullWidth required disabled={loading || loadingData}>
                  <InputLabel>Account</InputLabel>
                  <Select
                    value={formData.account_id}
                    label="Account"
                    onChange={handleInputChange('account_id')}
                  >
                    {accounts.map((account) => (
                      <MenuItem key={account.id} value={account.id}>
                        {account.name}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>

                <FormControl fullWidth required disabled={loading || loadingData}>
                  <InputLabel>Category</InputLabel>
                  <Select
                    value={formData.category_id}
                    label="Category"
                    onChange={handleInputChange('category_id')}
                  >
                    {categories.map((category) => (
                      <MenuItem key={category.id} value={category.id}>
                        {category.name}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Box>

              {/* Date */}
              <DateTimePicker
                label="Transaction Date"
                value={new Date(formData.transaction_date)}
                onChange={handleDateChange}
                disabled={loading || loadingData}
                slotProps={{
                  textField: {
                    fullWidth: true,
                    required: true,
                  },
                }}
              />

              {/* Notes */}
              <TextField
                label="Notes (Optional)"
                value={formData.notes}
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
              {loading ? 'Adding...' : 'Add Transaction'}
            </Button>
          </DialogActions>
        </form>
      </Dialog>
    </LocalizationProvider>
  );
}; 
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
} from '@mui/material';
import { AmountInput } from './AmountInput';
import { DateTimePicker } from '@mui/x-date-pickers/DateTimePicker';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import type { Account } from '../types/account';
import type { TransferCreate } from '../types/transfer';
import { accountService } from '../services/accountService';

interface TransferFormProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (transferData: TransferCreate) => Promise<void>;
}

export const TransferForm: React.FC<TransferFormProps> = ({
  open,
  onClose,
  onSubmit,
}) => {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [formData, setFormData] = useState<TransferCreate>({
    from_account_id: '',
    to_account_id: '',
    amount: 0,
    description: '',
    transfer_date: new Date().toISOString(),
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Load accounts when component mounts
  useEffect(() => {
    if (open) {
      loadAccounts();
    }
  }, [open]);

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
    if (!formData.from_account_id || !formData.to_account_id) {
      setError('Please select both source and destination accounts');
      setLoading(false);
      return;
    }

    if (formData.from_account_id === formData.to_account_id) {
      setError('Source and destination accounts must be different');
      setLoading(false);
      return;
    }

    if (formData.amount <= 0) {
      setError('Transfer amount must be greater than 0');
      setLoading(false);
      return;
    }

    try {
      await onSubmit(formData);
      handleClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create transfer');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setFormData({
      from_account_id: '',
      to_account_id: '',
      amount: 0,
      description: '',
      transfer_date: new Date().toISOString(),
    });
    setError('');
    onClose();
  };

  const getAccountBalance = (accountId: string): number => {
    const account = accounts.find(acc => acc.id === accountId);
    return account?.current_balance || 0;
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
        <DialogTitle>Transfer Money Between Accounts</DialogTitle>
        <form onSubmit={handleSubmit}>
          <DialogContent>
            {error && (
              <Alert severity="error" sx={{ mb: 2 }}>
                {error}
              </Alert>
            )}

            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <FormControl fullWidth required>
                <InputLabel>From Account</InputLabel>
                <Select
                  value={formData.from_account_id}
                  label="From Account"
                  onChange={(e) =>
                    setFormData({ ...formData, from_account_id: e.target.value })
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
                {formData.from_account_id && (
                  <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5 }}>
                    Available: {formatCurrency(getAccountBalance(formData.from_account_id))}
                  </Typography>
                )}
              </FormControl>

              <FormControl fullWidth required>
                <InputLabel>To Account</InputLabel>
                <Select
                  value={formData.to_account_id}
                  label="To Account"
                  onChange={(e) =>
                    setFormData({ ...formData, to_account_id: e.target.value })
                  }
                  disabled={loading}
                >
                  {accounts
                    .filter(account => account.id !== formData.from_account_id)
                    .map((account) => (
                      <MenuItem key={account.id} value={account.id}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', width: '100%' }}>
                          <span>{account.name}</span>
                          <span>{formatCurrency(account.current_balance)}</span>
                        </Box>
                      </MenuItem>
                    ))}
                </Select>
              </FormControl>

              <AmountInput
                value={formData.amount || 0}
                onChange={(value) => setFormData({ ...formData, amount: value })}
                disabled={loading}
                required
                label="Transfer Amount"
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
              />

              <DateTimePicker
                label="Transfer Date"
                value={new Date(formData.transfer_date)}
                onChange={(date) =>
                  setFormData({
                    ...formData,
                    transfer_date: date ? date.toISOString() : new Date().toISOString(),
                  })
                }
                disabled={loading}
              />
            </Box>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleClose} disabled={loading}>
              Cancel
            </Button>
            <Button type="submit" variant="contained" disabled={loading}>
              {loading ? 'Processing...' : 'Transfer'}
            </Button>
          </DialogActions>
        </form>
      </Dialog>
    </LocalizationProvider>
  );
}; 
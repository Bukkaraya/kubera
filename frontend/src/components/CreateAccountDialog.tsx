import React, { useState } from 'react';
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
} from '@mui/material';
import { AccountType } from '../types/account';
import type { AccountCreate } from '../types/account';

interface CreateAccountDialogProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (accountData: AccountCreate) => Promise<void>;
}

export const CreateAccountDialog: React.FC<CreateAccountDialogProps> = ({
  open,
  onClose,
  onSubmit,
}) => {
  const [formData, setFormData] = useState<AccountCreate>({
    name: '',
    account_type: AccountType.CHECKING,
    initial_balance: 0,
    description: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleInputChange = (field: keyof AccountCreate) => (
    event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement> | { target: { value: unknown } }
  ) => {
    const value = event.target.value;
    setFormData(prev => ({
      ...prev,
      [field]: field === 'initial_balance' ? Number(value) || 0 : value,
    }));
    // Clear error when user starts typing
    if (error) setError('');
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    
    // Validation
    if (!formData.name.trim()) {
      setError('Account name is required');
      return;
    }

    if (formData.name.length > 100) {
      setError('Account name must be 100 characters or less');
      return;
    }

    try {
      setLoading(true);
      setError('');
      await onSubmit(formData);
      handleClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create account');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (!loading) {
      setFormData({
        name: '',
        account_type: AccountType.CHECKING,
        initial_balance: 0,
        description: '',
      });
      setError('');
      onClose();
    }
  };

  const formatAccountTypeLabel = (accountType: AccountType) => {
    return accountType.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <form onSubmit={handleSubmit}>
        <DialogTitle>Create New Account</DialogTitle>
        
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, pt: 1 }}>
            {error && (
              <Alert severity="error">
                {error}
              </Alert>
            )}

            <TextField
              label="Account Name"
              value={formData.name}
              onChange={handleInputChange('name')}
              required
              fullWidth
              disabled={loading}
              helperText="e.g., Chase Checking, Emergency Savings"
              inputProps={{ maxLength: 100 }}
            />

            <FormControl fullWidth required disabled={loading}>
              <InputLabel>Account Type</InputLabel>
              <Select
                value={formData.account_type}
                label="Account Type"
                onChange={handleInputChange('account_type')}
              >
                {Object.values(AccountType).map((type) => (
                  <MenuItem key={type} value={type}>
                    {formatAccountTypeLabel(type)}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <TextField
              label="Initial Balance"
              type="number"
              value={formData.initial_balance}
              onChange={handleInputChange('initial_balance')}
              fullWidth
              disabled={loading}
              inputProps={{ 
                min: 0, 
                step: 0.01,
              }}
              InputProps={{
                startAdornment: <InputAdornment position="start">$</InputAdornment>,
              }}
              helperText="Enter the current balance of this account"
            />

            <TextField
              label="Description (Optional)"
              value={formData.description}
              onChange={handleInputChange('description')}
              fullWidth
              multiline
              rows={3}
              disabled={loading}
              inputProps={{ maxLength: 255 }}
              helperText="Optional notes about this account"
            />
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
            {loading ? 'Creating...' : 'Create Account'}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
}; 
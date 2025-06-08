import React, { useState, useEffect } from 'react';
import {
  Container,
  Typography,
  Box,
  Button,
  Card,
  CardContent,
  IconButton,
  Alert,
  CircularProgress,
  Chip,
  Fab,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Divider,
} from '@mui/material';
import {
  Add as AddIcon,
  Repeat as RecurringIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  PlayArrow as GenerateIcon,
  Schedule as ScheduleIcon,
  Refresh as RefreshIcon,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { DateTimePicker } from '@mui/x-date-pickers/DateTimePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { recurringTransactionService } from '../services/recurringTransactionService';
import { accountService } from '../services/accountService';
import { categoryService } from '../services/categoryService';
import type { 
  RecurringTransaction, 
  RecurringTransactionCreate, 
  FrequencyType
} from '../types/recurringTransaction';
import { FREQUENCY_LABELS } from '../types/recurringTransaction';
import type { Account } from '../types/account';
import type { Category } from '../types/transaction';
import { Layout } from '../components/Layout';
import { AmountInput } from '../components/AmountInput';

export const RecurringTransactionsPage: React.FC = () => {
  const navigate = useNavigate();
  const [recurringTransactions, setRecurringTransactions] = useState<RecurringTransaction[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Dialog states
  const [openDialog, setOpenDialog] = useState(false);
  const [editingRecurring, setEditingRecurring] = useState<RecurringTransaction | null>(null);
  const [formData, setFormData] = useState<RecurringTransactionCreate>({
    payee: '',
    amount: 0,
    account_id: '',
    category_id: '',
    frequency: 'monthly' as FrequencyType,
    start_date: new Date().toISOString(),
    is_income: false,
    notes: '',
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [recurringData, accountsData, categoriesData] = await Promise.all([
        recurringTransactionService.getRecurringTransactions(),
        accountService.getAccounts(),
        categoryService.getCategories(),
      ]);
      setRecurringTransactions(recurringData);
      setAccounts(accountsData);
      setCategories(categoriesData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateRecurring = () => {
    setEditingRecurring(null);
    setFormData({
      payee: '',
      amount: 0,
      account_id: '',
      category_id: '',
      frequency: 'monthly' as FrequencyType,
      start_date: new Date().toISOString(),
      is_income: false,
      notes: '',
    });
    setOpenDialog(true);
  };

  const handleEditRecurring = (recurring: RecurringTransaction) => {
    setEditingRecurring(recurring);
    setFormData({
      payee: recurring.payee,
      amount: recurring.amount,
      account_id: recurring.account_id,
      category_id: recurring.category_id,
      frequency: recurring.frequency,
      start_date: recurring.start_date,
      end_date: recurring.end_date,
      is_income: recurring.is_income,
      notes: recurring.notes || '',
    });
    setOpenDialog(true);
  };

  const handleDeleteRecurring = async (recurring: RecurringTransaction) => {
    if (confirm(`Are you sure you want to delete the recurring transaction "${recurring.payee}"?`)) {
      try {
        await recurringTransactionService.deleteRecurringTransaction(recurring.id);
        await loadData();
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to delete recurring transaction');
      }
    }
  };

  const handleGenerateTransaction = async (recurring: RecurringTransaction) => {
    try {
      await recurringTransactionService.generateTransaction(recurring.id);
      await loadData();
      setError('');
      // Show success message (you could add a snackbar here)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate transaction');
    }
  };

  const handleProcessDue = async () => {
    try {
      const result = await recurringTransactionService.processDueRecurringTransactions();
      await loadData();
      setError('');
      // Show success message with count
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to process due transactions');
    }
  };

  const handleSubmit = async () => {
    try {
      setError('');
      if (editingRecurring) {
        await recurringTransactionService.updateRecurringTransaction(editingRecurring.id, formData);
      } else {
        await recurringTransactionService.createRecurringTransaction(formData);
      }
      setOpenDialog(false);
      await loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save recurring transaction');
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(Math.abs(amount));
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  const getStatusChip = (recurring: RecurringTransaction) => {
    if (!recurring.is_active) {
      return <Chip label="Inactive" color="default" size="small" />;
    }
    
    const nextDate = new Date(recurring.next_execution_date);
    const now = new Date();
    const daysUntil = Math.ceil((nextDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    
    if (daysUntil <= 0) {
      return <Chip label="Due Now" color="error" size="small" />;
    } else if (daysUntil <= 7) {
      return <Chip label="Due Soon" color="warning" size="small" />;
    } else {
      return <Chip label="Active" color="success" size="small" />;
    }
  };

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns}>
      <Layout>
        <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
            <Typography variant="h4" component="h1">
              Recurring Transactions
            </Typography>
            <Box>
              <Button
                variant="outlined"
                startIcon={<RefreshIcon />}
                onClick={handleProcessDue}
                sx={{ mr: 1 }}
              >
                Process Due
              </Button>
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                onClick={handleCreateRecurring}
              >
                Add Recurring
              </Button>
            </Box>
          </Box>

          {error && (
            <Alert severity="error" sx={{ mb: 3 }}>
              {error}
            </Alert>
          )}

          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
              <CircularProgress />
            </Box>
          ) : (
            <>
              {/* Recurring Transactions List */}
              {recurringTransactions.length === 0 ? (
                <Card>
                  <CardContent sx={{ textAlign: 'center', py: 6 }}>
                    <RecurringIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
                    <Typography variant="h6" gutterBottom>
                      No recurring transactions found
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                      Set up recurring transactions to automate your regular income and expenses.
                    </Typography>
                    <Button variant="contained" startIcon={<AddIcon />} onClick={handleCreateRecurring}>
                      Add Your First Recurring Transaction
                    </Button>
                  </CardContent>
                </Card>
              ) : (
                <Card>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      All Recurring Transactions
                    </Typography>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                      {recurringTransactions.map((recurring, index) => (
                        <Box key={recurring.id}>
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              <Typography variant="subtitle1" fontWeight={600}>
                                {recurring.payee}
                              </Typography>
                              <Typography variant="body2" color="text.secondary">
                                ({recurring.category?.name || 'Unknown Category'})
                              </Typography>
                              {getStatusChip(recurring)}
                            </Box>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              <IconButton
                                size="small"
                                onClick={() => handleGenerateTransaction(recurring)}
                                color="primary"
                                title="Generate transaction now"
                              >
                                <GenerateIcon />
                              </IconButton>
                              <IconButton
                                size="small"
                                onClick={() => handleEditRecurring(recurring)}
                                color="primary"
                              >
                                <EditIcon />
                              </IconButton>
                              <IconButton
                                size="small"
                                onClick={() => handleDeleteRecurring(recurring)}
                                color="error"
                              >
                                <DeleteIcon />
                              </IconButton>
                            </Box>
                          </Box>
                          
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                            <Typography variant="body2">
                              Amount: <span style={{ color: recurring.is_income ? 'green' : 'red' }}>
                                {recurring.is_income ? '+' : '-'}{formatCurrency(recurring.amount)}
                              </span>
                            </Typography>
                            <Typography variant="body2">
                              Frequency: {FREQUENCY_LABELS[recurring.frequency]}
                            </Typography>
                          </Box>
                          
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                            <Typography variant="body2" color="text.secondary">
                              Account: {recurring.account?.name || 'Unknown Account'}
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                              Next: {formatDate(recurring.next_execution_date)}
                            </Typography>
                          </Box>
                          
                          {recurring.notes && (
                            <Typography variant="caption" color="text.secondary">
                              Notes: {recurring.notes}
                            </Typography>
                          )}
                          
                          {index < recurringTransactions.length - 1 && <Divider sx={{ mt: 2 }} />}
                        </Box>
                      ))}
                    </Box>
                  </CardContent>
                </Card>
              )}
            </>
          )}

          {/* Floating Action Button for Mobile */}
          <Fab
            color="primary"
            aria-label="add recurring transaction"
            sx={{ position: 'fixed', bottom: 16, right: 16, display: { xs: 'flex', md: 'none' } }}
            onClick={handleCreateRecurring}
          >
            <AddIcon />
          </Fab>
        </Container>

        {/* Create/Edit Dialog */}
        <Dialog open={openDialog} onClose={() => setOpenDialog(false)} maxWidth="sm" fullWidth>
          <DialogTitle>
            {editingRecurring ? 'Edit Recurring Transaction' : 'Create Recurring Transaction'}
          </DialogTitle>
          <DialogContent>
            <Box sx={{ pt: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
              <TextField
                fullWidth
                label="Payee"
                value={formData.payee}
                onChange={(e) => setFormData({ ...formData, payee: e.target.value })}
                required
              />
              
              <AmountInput
                value={formData.amount || 0}
                onChange={(value) => setFormData({ ...formData, amount: value })}
                required
                label="Amount"
              />
              
              <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 2 }}>
                <FormControl fullWidth required>
                  <InputLabel>Account</InputLabel>
                  <Select
                    value={formData.account_id}
                    label="Account"
                    onChange={(e) => setFormData({ ...formData, account_id: e.target.value })}
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
                    value={formData.category_id}
                    label="Category"
                    onChange={(e) => setFormData({ ...formData, category_id: e.target.value })}
                  >
                    {categories.map((category) => (
                      <MenuItem key={category.id} value={category.id}>
                        {category.name}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Box>
              
              <FormControl fullWidth required>
                <InputLabel>Frequency</InputLabel>
                <Select
                  value={formData.frequency}
                  label="Frequency"
                  onChange={(e) => setFormData({ ...formData, frequency: e.target.value as FrequencyType })}
                >
                  {Object.entries(FREQUENCY_LABELS).map(([value, label]) => (
                    <MenuItem key={value} value={value}>
                      {label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
              
              <DateTimePicker
                label="Start Date"
                value={new Date(formData.start_date)}
                onChange={(date) => setFormData({ ...formData, start_date: date?.toISOString() || new Date().toISOString() })}
                slotProps={{
                  textField: {
                    fullWidth: true,
                    required: true,
                  },
                }}
              />
              
              {editingRecurring && (
                <DateTimePicker
                  label="End Date (Optional)"
                  value={formData.end_date ? new Date(formData.end_date) : null}
                  onChange={(date) => setFormData({ ...formData, end_date: date?.toISOString() || undefined })}
                  slotProps={{
                    textField: {
                      fullWidth: true,
                    },
                  }}
                />
              )}
              
              <TextField
                fullWidth
                label="Notes (Optional)"
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                multiline
                rows={2}
              />
            </Box>
          </DialogContent>
          <DialogActions sx={{ px: 3, pb: 3 }}>
            <Button onClick={() => setOpenDialog(false)}>
              Cancel
            </Button>
            <Button variant="contained" onClick={handleSubmit}>
              {editingRecurring ? 'Update' : 'Create'}
            </Button>
          </DialogActions>
        </Dialog>
      </Layout>
    </LocalizationProvider>
  );
}; 
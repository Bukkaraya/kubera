import React, { useState, useEffect } from 'react';
import {
  Container,
  Typography,
  Box,
  Card,
  CardContent,
  Alert,
  CircularProgress,
  AppBar,
  Toolbar,
  Menu,
  MenuItem,
  IconButton,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  TextField,
  InputAdornment,
  FormControl,
  InputLabel,
  Select,
  Tabs,
  Tab,
  Divider,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from '@mui/material';
import {
  Menu as MenuIcon,
  Dashboard as DashboardIcon,
  AccountBalance as AccountIcon,
  Receipt as TransactionIcon,
  Logout as LogoutIcon,
  Search as SearchIcon,
  TrendingUp as IncomeIcon,
  TrendingDown as ExpenseIcon,
  Add as AddIcon,
  FilterList as FilterIcon,
  Clear as ClearIcon,
  TrendingUp as TrendingUpIcon,
  Repeat as RecurringIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  PlayArrow as GenerateIcon,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { transactionService } from '../services/transactionService';
import { authService } from '../services/authService';
import { accountService } from '../services/accountService';
import { categoryService } from '../services/categoryService';
import { recurringTransactionService } from '../services/recurringTransactionService';
import type { Transaction, TransactionFilter, TransactionCreate, Category } from '../types/transaction';
import type { Account } from '../types/account';
import type { RecurringTransaction } from '../types/recurringTransaction';
import { FREQUENCY_LABELS } from '../types/recurringTransaction';
import { CreateTransactionDialog } from '../components/CreateTransactionDialog';

export const TransactionsPage: React.FC = () => {
  const navigate = useNavigate();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [recurringTransactions, setRecurringTransactions] = useState<RecurringTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [currentTab, setCurrentTab] = useState(0);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [recurringToDelete, setRecurringToDelete] = useState<RecurringTransaction | null>(null);
  const [filters, setFilters] = useState<TransactionFilter>({
    account_id: '',
    category_id: '',
    start_date: '',
    end_date: '',
    search: '',
  });

  // Navigation handlers
  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleLogout = () => {
    authService.removeToken();
    navigate('/login');
  };

  // Load transactions and filter data on component mount
  useEffect(() => {
    const initializeData = async () => {
      await processDueRecurringTransactions(); // Process due recurring transactions first
      loadFilterData();
      loadTransactions();
      loadRecurringTransactions();
    };
    
    initializeData();
  }, []);

  const loadFilterData = async () => {
    try {
      const [accountsData, categoriesData] = await Promise.all([
        accountService.getAccounts(),
        categoryService.getCategories(),
      ]);
      setAccounts(accountsData);
      setCategories(categoriesData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load filter data');
    }
  };

  const loadTransactions = async (filters?: TransactionFilter) => {
    try {
      setLoading(true);
      setError('');
      const transactionsData = await transactionService.getTransactions(0, 100, filters);
      setTransactions(transactionsData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load transactions');
    } finally {
      setLoading(false);
    }
  };

  const loadRecurringTransactions = async () => {
    try {
      const recurringData = await recurringTransactionService.getRecurringTransactions({
        is_active: true // Only fetch active recurring transactions
      });
      setRecurringTransactions(recurringData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load recurring transactions');
    }
  };

  const processDueRecurringTransactions = async () => {
    try {
      await recurringTransactionService.processDueRecurringTransactions();
    } catch (err) {
      // Silently handle errors - don't show to user as this is background processing
      console.error('Failed to process due recurring transactions:', err);
    }
  };

  // Handle search
  const handleSearch = (event: React.ChangeEvent<HTMLInputElement>) => {
    const value = event.target.value;
    setSearchTerm(value);
    
    const newFilters = { ...filters, search: value.trim() };
    setFilters(newFilters);
    
    // Debounce search
    setTimeout(() => {
      loadTransactions(newFilters);
    }, 500);
  };

  // Handle filter changes
  const handleFilterChange = (filterType: keyof TransactionFilter, value: string) => {
    const newFilters = { ...filters, [filterType]: value || undefined };
    setFilters(newFilters);
    loadTransactions(newFilters);
  };

  // Clear all filters
  const clearFilters = () => {
    const clearedFilters = {
      account_id: '',
      category_id: '',
      start_date: '',
      end_date: '',
      search: '',
    };
    setFilters(clearedFilters);
    setSearchTerm('');
    loadTransactions();
  };

  // Check if any filters are active
  const hasActiveFilters = () => {
    return !!(
      filters.account_id ||
      filters.category_id ||
      filters.start_date ||
      filters.end_date ||
      searchTerm.trim()
    );
  };

  const handleCreateTransaction = async (transactionData: TransactionCreate) => {
    try {
      const newTransaction = await transactionService.createTransaction(transactionData);
      setTransactions(prev => [newTransaction, ...prev]);
      setCreateDialogOpen(false);
    } catch (err) {
      throw err; // Let the dialog handle the error display
    }
  };

  // Tab handlers
  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setCurrentTab(newValue);
  };

  // Recurring transaction handlers
  const handleDeleteRecurring = (recurring: RecurringTransaction) => {
    setRecurringToDelete(recurring);
    setDeleteConfirmOpen(true);
  };

  const confirmDeleteRecurring = async () => {
    if (!recurringToDelete) return;
    
    try {
      await recurringTransactionService.deleteRecurringTransaction(recurringToDelete.id);
      await loadRecurringTransactions();
      setDeleteConfirmOpen(false);
      setRecurringToDelete(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete recurring transaction');
    }
  };



  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(Math.abs(amount));
  };

  // Format date
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  // Format time
  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  // Recurring transaction helpers
  const getRecurringStatusChip = (recurring: RecurringTransaction) => {
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
    <>
      {/* Navigation Bar */}
      <AppBar position="sticky">
        <Toolbar>
          <Typography variant="h5" component="div" sx={{ flexGrow: 1, fontWeight: 600 }}>
            Kubera
          </Typography>
          
          {/* Desktop Navigation */}
          <Box sx={{ display: { xs: 'none', md: 'flex' } }}>
            <Button 
              color="inherit" 
              startIcon={<DashboardIcon />} 
              sx={{ fontSize: '1rem' }}
              onClick={() => navigate('/dashboard')}
            >
              Dashboard
            </Button>
            <Button 
              color="inherit" 
              startIcon={<AccountIcon />} 
              sx={{ fontSize: '1rem' }}
              onClick={() => navigate('/accounts')}
            >
              Accounts
            </Button>
            <Button 
              color="inherit" 
              startIcon={<TransactionIcon />} 
              sx={{ fontSize: '1rem', bgcolor: 'rgba(255,255,255,0.1)' }}
            >
              Transactions
            </Button>
            <Button 
              color="inherit" 
              startIcon={<TrendingUpIcon />} 
              sx={{ fontSize: '1rem' }}
              onClick={() => navigate('/budgets')}
            >
              Budgets
            </Button>
            <Button 
              color="inherit" 
              startIcon={<LogoutIcon />} 
              sx={{ fontSize: '1rem', ml: 2 }}
              onClick={handleLogout}
            >
              Logout
            </Button>
          </Box>
          
          {/* Mobile Navigation */}
          <Box sx={{ display: { xs: 'flex', md: 'none' } }}>
            <IconButton
              color="inherit"
              aria-label="menu"
              onClick={handleMenuOpen}
            >
              <MenuIcon />
            </IconButton>
            <Menu
              anchorEl={anchorEl}
              open={Boolean(anchorEl)}
              onClose={handleMenuClose}
            >
              <MenuItem onClick={() => { handleMenuClose(); navigate('/dashboard'); }}>
                <DashboardIcon sx={{ mr: 1 }} />
                Dashboard
              </MenuItem>
              <MenuItem onClick={() => { handleMenuClose(); navigate('/accounts'); }}>
                <AccountIcon sx={{ mr: 1 }} />
                Accounts
              </MenuItem>
              <MenuItem onClick={handleMenuClose}>
                <TransactionIcon sx={{ mr: 1 }} />
                Transactions
              </MenuItem>
              <MenuItem onClick={() => { handleMenuClose(); navigate('/budgets'); }}>
                <TrendingUpIcon sx={{ mr: 1 }} />
                Budgets
              </MenuItem>
              <MenuItem onClick={() => { handleMenuClose(); handleLogout(); }}>
                <LogoutIcon sx={{ mr: 1 }} />
                Logout
              </MenuItem>
            </Menu>
          </Box>
        </Toolbar>
      </AppBar>

      {/* Main Content */}
      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
          <Typography variant="h4" component="h1">
            Transactions
          </Typography>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => setCreateDialogOpen(true)}
          >
            {currentTab === 0 ? 'Add Transaction' : 'Add Recurring Transaction'}
          </Button>
        </Box>

        {/* Tabs */}
        <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
          <Tabs value={currentTab} onChange={handleTabChange}>
            <Tab label="Transactions" icon={<TransactionIcon />} />
            <Tab label="Recurring" icon={<RecurringIcon />} />
          </Tabs>
        </Box>

        {/* Search and Filters - Only show for regular transactions */}
        {currentTab === 0 && (
          <Box sx={{ mb: 3 }}>
            <Box sx={{ 
              display: 'grid', 
              gridTemplateColumns: { 
                xs: '1fr', 
                md: 'repeat(2, 1fr)', 
                lg: hasActiveFilters() ? '2fr 1fr 1fr 1fr 1fr auto' : '2fr 1fr 1fr 1fr 1fr'
              },
              gap: 2,
              mb: 2
            }}>
              <TextField
                label="Search transactions"
                placeholder="Search by payee or notes..."
                value={searchTerm}
                onChange={handleSearch}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon />
                    </InputAdornment>
                  ),
                }}
              />
              
              <FormControl>
                <InputLabel>Account</InputLabel>
                <Select
                  value={filters.account_id || ''}
                  label="Account"
                  onChange={(e) => handleFilterChange('account_id', e.target.value)}
                >
                  <MenuItem value="">All Accounts</MenuItem>
                  {accounts.map((account) => (
                    <MenuItem key={account.id} value={account.id.toString()}>
                      {account.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              <FormControl>
                <InputLabel>Category</InputLabel>
                <Select
                  value={filters.category_id || ''}
                  label="Category"
                  onChange={(e) => handleFilterChange('category_id', e.target.value)}
                >
                  <MenuItem value="">All Categories</MenuItem>
                  {categories.map((category) => (
                    <MenuItem key={category.id} value={category.id.toString()}>
                      {category.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              <TextField
                type="date"
                label="Start Date"
                value={filters.start_date || ''}
                onChange={(e) => handleFilterChange('start_date', e.target.value)}
                InputLabelProps={{ shrink: true }}
              />

              <TextField
                type="date"
                label="End Date"
                value={filters.end_date || ''}
                onChange={(e) => handleFilterChange('end_date', e.target.value)}
                InputLabelProps={{ shrink: true }}
              />

              {hasActiveFilters() && (
                <Button
                  variant="outlined"
                  onClick={clearFilters}
                  startIcon={<ClearIcon />}
                  sx={{ height: '56px', whiteSpace: 'nowrap' }}
                >
                  Clear Filters
                </Button>
              )}
            </Box>
          </Box>
        )}

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
            {/* Regular Transactions Tab */}
            {currentTab === 0 && (
              <Card>
                <CardContent sx={{ p: 0 }}>
                  {transactions.length === 0 ? (
                    <Box sx={{ textAlign: 'center', py: 6 }}>
                      <TransactionIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
                      <Typography variant="h6" gutterBottom>
                        No transactions found
                      </Typography>
                      <Typography variant="body2" color="text.secondary" paragraph>
                        {searchTerm ? 'Try adjusting your search terms.' : 'Start by creating some accounts and adding transactions.'}
                      </Typography>
                      {!searchTerm && (
                        <Button
                          variant="contained"
                          startIcon={<AddIcon />}
                          onClick={() => setCreateDialogOpen(true)}
                        >
                          Add Your First Transaction
                        </Button>
                      )}
                    </Box>
                  ) : (
                    <TableContainer component={Paper}>
                      <Table>
                        <TableHead>
                          <TableRow>
                            <TableCell>Date</TableCell>
                            <TableCell>Payee</TableCell>
                            <TableCell>Account</TableCell>
                            <TableCell>Category</TableCell>
                            <TableCell>Type</TableCell>
                            <TableCell align="right">Amount</TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {transactions.map((transaction) => (
                            <TableRow key={transaction.id} hover>
                              <TableCell>
                                <Typography variant="body2">
                                  {formatDate(transaction.transaction_date)}
                                </Typography>
                              </TableCell>
                              <TableCell>
                                <Typography variant="body2" sx={{ fontWeight: 500 }}>
                                  {transaction.payee}
                                </Typography>
                                {transaction.notes && (
                                  <Typography variant="caption" color="text.secondary">
                                    {transaction.notes}
                                  </Typography>
                                )}
                              </TableCell>
                              <TableCell>
                                <Typography variant="body2">
                                  {transaction.account?.name || 'Unknown Account'}
                                </Typography>
                              </TableCell>
                              <TableCell>
                                <Typography variant="body2">
                                  {transaction.category?.name || 'Unknown Category'}
                                </Typography>
                              </TableCell>
                              <TableCell>
                                <Chip
                                  icon={transaction.is_income ? <IncomeIcon /> : <ExpenseIcon />}
                                  label={transaction.is_income ? 'Income' : 'Expense'}
                                  color={transaction.is_income ? 'success' : 'error'}
                                  size="small"
                                />
                              </TableCell>
                              <TableCell align="right">
                                <Typography 
                                  variant="body2" 
                                  sx={{ 
                                    fontWeight: 600,
                                    color: transaction.is_income ? 'success.main' : 'error.main'
                                  }}
                                >
                                  {transaction.is_income ? '+' : '-'}{formatCurrency(transaction.amount)}
                                </Typography>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </TableContainer>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Recurring Transactions Tab */}
            {currentTab === 1 && (
              <Card>
                <CardContent>
                  {recurringTransactions.length === 0 ? (
                    <Box sx={{ textAlign: 'center', py: 6 }}>
                      <RecurringIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
                      <Typography variant="h6" gutterBottom>
                        No recurring transactions found
                      </Typography>
                      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                        Set up recurring transactions to automate your regular income and expenses.
                      </Typography>
                      <Button variant="contained" startIcon={<AddIcon />}>
                        Add Your First Recurring Transaction
                      </Button>
                    </Box>
                  ) : (
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
                              {getRecurringStatusChip(recurring)}
                            </Box>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              <IconButton size="small" color="primary">
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
                  )}
                </CardContent>
              </Card>
            )}
          </>
        )}

        {/* Create Transaction Dialog */}
        <CreateTransactionDialog
          open={createDialogOpen}
          onClose={() => setCreateDialogOpen(false)}
          onSubmit={handleCreateTransaction}
        />

        {/* Delete Recurring Transaction Confirmation Dialog */}
        <Dialog open={deleteConfirmOpen} onClose={() => setDeleteConfirmOpen(false)}>
          <DialogTitle>Delete Recurring Transaction</DialogTitle>
          <DialogContent>
            <Typography>
              Are you sure you want to delete the recurring transaction "{recurringToDelete?.payee}"? 
              This will permanently remove the scheduled transaction and cannot be undone.
            </Typography>
            {recurringToDelete && (
              <Box sx={{ mt: 2, p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
                <Typography variant="body2" color="text.secondary">
                  <strong>Transaction Details:</strong>
                </Typography>
                <Typography variant="body2">
                  • Payee: {recurringToDelete.payee}
                </Typography>
                <Typography variant="body2">
                  • Amount: {recurringToDelete.is_income ? '+' : '-'}{formatCurrency(recurringToDelete.amount)}
                </Typography>
                <Typography variant="body2">
                  • Frequency: {FREQUENCY_LABELS[recurringToDelete.frequency]}
                </Typography>
                <Typography variant="body2">
                  • Account: {recurringToDelete.account?.name}
                </Typography>
                <Typography variant="body2">
                  • Category: {recurringToDelete.category?.name}
                </Typography>
              </Box>
            )}
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setDeleteConfirmOpen(false)}>Cancel</Button>
            <Button onClick={confirmDeleteRecurring} color="error" variant="contained">
              Delete
            </Button>
          </DialogActions>
        </Dialog>
      </Container>
    </>
  );
}; 
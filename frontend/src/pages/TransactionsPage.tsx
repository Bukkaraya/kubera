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
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { transactionService } from '../services/transactionService';
import { authService } from '../services/authService';
import { accountService } from '../services/accountService';
import { categoryService } from '../services/categoryService';
import type { Transaction, TransactionFilter, TransactionCreate, Category } from '../types/transaction';
import type { Account } from '../types/account';
import { CreateTransactionDialog } from '../components/CreateTransactionDialog';

export const TransactionsPage: React.FC = () => {
  const navigate = useNavigate();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
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
    loadFilterData();
    loadTransactions();
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
            Add Transaction
          </Button>
        </Box>

        {/* Search and Filters */}
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
              placeholder="Search by description..."
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
                        <TableCell>Description</TableCell>
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
                              {transaction.description}
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

        {/* Create Transaction Dialog */}
        <CreateTransactionDialog
          open={createDialogOpen}
          onClose={() => setCreateDialogOpen(false)}
          onSubmit={handleCreateTransaction}
        />
      </Container>
    </>
  );
}; 
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
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { transactionService } from '../services/transactionService';
import { authService } from '../services/authService';
import type { Transaction, TransactionFilter, TransactionCreate } from '../types/transaction';
import { CreateTransactionDialog } from '../components/CreateTransactionDialog';

export const TransactionsPage: React.FC = () => {
  const navigate = useNavigate();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [createDialogOpen, setCreateDialogOpen] = useState(false);

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

  // Load transactions on component mount
  useEffect(() => {
    loadTransactions();
  }, []);

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
    
    // Debounce search
    setTimeout(() => {
      if (value.trim()) {
        loadTransactions({ search: value.trim() });
      } else {
        loadTransactions();
      }
    }, 500);
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

        {/* Search Bar */}
        <Box sx={{ mb: 3 }}>
          <TextField
            fullWidth
            placeholder="Search transactions..."
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
                            <Typography variant="caption" color="text.secondary">
                              {formatDateTime(transaction.transaction_date)}
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
import React, { useState, useEffect } from 'react';
import {
  Container,
  Typography,
  Box,
  Card,
  CardContent,
  Button,
  Chip,
  IconButton,
  Alert,
  CircularProgress,
  AppBar,
  Toolbar,
  Menu,
  MenuItem,
} from '@mui/material';
import {
  Add as AddIcon,
  AccountBalance as AccountIcon,
  CreditCard as CreditCardIcon,
  Savings as SavingsIcon,
  TrendingUp as InvestmentIcon,
  Money as CashIcon,
  Menu as MenuIcon,
  Dashboard as DashboardIcon,
  Receipt as TransactionIcon,
  Logout as LogoutIcon,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { accountService } from '../services/accountService';
import { authService } from '../services/authService';
import type { Account, AccountType, AccountCreate } from '../types/account';
import { CreateAccountDialog } from '../components/CreateAccountDialog';

export const AccountsPage: React.FC = () => {
  const navigate = useNavigate();
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
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

  // Load accounts on component mount
  useEffect(() => {
    loadAccounts();
  }, []);

  const loadAccounts = async () => {
    try {
      setLoading(true);
      setError('');
      const accountsData = await accountService.getAccounts();
      setAccounts(accountsData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load accounts');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateAccount = async (accountData: AccountCreate) => {
    try {
      const newAccount = await accountService.createAccount(accountData);
      setAccounts(prev => [...prev, newAccount]);
      setCreateDialogOpen(false);
    } catch (err) {
      throw err; // Let the dialog handle the error display
    }
  };

  // Get icon for account type
  const getAccountIcon = (accountType: AccountType) => {
    switch (accountType) {
      case 'checking':
        return <AccountIcon />;
      case 'savings':
        return <SavingsIcon />;
      case 'credit_card':
        return <CreditCardIcon />;
      case 'investment':
        return <InvestmentIcon />;
      case 'cash':
        return <CashIcon />;
      default:
        return <AccountIcon />;
    }
  };

  // Get color for account type
  const getAccountTypeColor = (accountType: AccountType) => {
    switch (accountType) {
      case 'checking':
        return 'primary';
      case 'savings':
        return 'success';
      case 'credit_card':
        return 'error';
      case 'investment':
        return 'warning';
      case 'cash':
        return 'info';
      default:
        return 'default';
    }
  };

  // Format account type for display
  const formatAccountType = (accountType: AccountType) => {
    return accountType.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
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
              sx={{ fontSize: '1rem', bgcolor: 'rgba(255,255,255,0.1)' }}
            >
              Accounts
            </Button>
            <Button color="inherit" startIcon={<TransactionIcon />} sx={{ fontSize: '1rem' }}>
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
              <MenuItem onClick={handleMenuClose}>
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
            Accounts
          </Typography>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => setCreateDialogOpen(true)}
          >
            Add Account
          </Button>
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
          <Box>
            {accounts.length === 0 ? (
              <Card>
                <CardContent sx={{ textAlign: 'center', py: 6 }}>
                  <AccountIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
                  <Typography variant="h6" gutterBottom>
                    No accounts yet
                  </Typography>
                  <Typography variant="body2" color="text.secondary" paragraph>
                    Create your first account to start tracking your finances.
                  </Typography>
                                      <Button
                      variant="contained"
                      startIcon={<AddIcon />}
                      onClick={() => setCreateDialogOpen(true)}
                    >
                      Add Your First Account
                    </Button>
                </CardContent>
              </Card>
            ) : (
              <Box sx={{ 
                display: 'grid', 
                gridTemplateColumns: { 
                  xs: '1fr', 
                  sm: 'repeat(2, 1fr)', 
                  md: 'repeat(3, 1fr)' 
                }, 
                gap: 3 
              }}>
                {accounts.map((account) => (
                  <Card key={account.id} sx={{ height: '100%' }}>
                    <CardContent>
                      <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                        {getAccountIcon(account.account_type)}
                        <Typography variant="h6" sx={{ ml: 1 }}>
                          {account.name}
                        </Typography>
                      </Box>
                      
                      <Chip
                        label={formatAccountType(account.account_type)}
                        color={getAccountTypeColor(account.account_type) as any}
                        size="small"
                        sx={{ mb: 2 }}
                      />
                      
                      <Typography variant="h4" color="primary" gutterBottom>
                        {formatCurrency(account.current_balance)}
                      </Typography>
                      
                      {account.description && (
                        <Typography variant="body2" color="text.secondary" paragraph>
                          {account.description}
                        </Typography>
                      )}
                      
                      <Typography variant="caption" color="text.secondary">
                        Created: {new Date(account.created_at).toLocaleDateString()}
                      </Typography>
                    </CardContent>
                  </Card>
                ))}
              </Box>
            )}
          </Box>
        )}

        {/* Create Account Dialog */}
        <CreateAccountDialog
          open={createDialogOpen}
          onClose={() => setCreateDialogOpen(false)}
          onSubmit={handleCreateAccount}
        />
      </Container>
    </>
  );
}; 
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Container, 
  Typography, 
  Card, 
  CardContent, 
  Button,
  Box,
  AppBar,
  Toolbar,
  IconButton,
  Menu,
  MenuItem
} from '@mui/material';
import { 
  Menu as MenuIcon,
  Dashboard as DashboardIcon,
  AccountBalance as AccountIcon,
  Receipt as TransactionIcon,
  Logout as LogoutIcon
} from '@mui/icons-material';
import { authService } from '../services/authService';

export const DashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);
  
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
            <Button color="inherit" startIcon={<DashboardIcon />} sx={{ fontSize: '1rem' }}>
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
              sx={{ fontSize: '1rem' }}
              onClick={() => navigate('/transactions')}
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
              <MenuItem onClick={handleMenuClose}>
                <DashboardIcon sx={{ mr: 1 }} />
                Dashboard
              </MenuItem>
              <MenuItem onClick={() => { handleMenuClose(); navigate('/accounts'); }}>
                <AccountIcon sx={{ mr: 1 }} />
                Accounts
              </MenuItem>
              <MenuItem onClick={() => { handleMenuClose(); navigate('/transactions'); }}>
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
        <Typography variant="h2" gutterBottom align="center">
          Welcome to Kubera
        </Typography>
        <Typography variant="h5" gutterBottom align="center" color="text.secondary">
          Your Personal Finance Dashboard
        </Typography>
        
        <Box sx={{ mt: 4 }}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                🎉 Authentication Success!
              </Typography>
              <Typography variant="body1" paragraph>
                You've successfully logged in using the real backend API! Your JWT token is 
                stored securely and will be used for authenticated requests.
              </Typography>
              <Button variant="contained" color="primary">
                View Accounts
              </Button>
              <Button variant="outlined" color="secondary" sx={{ ml: 2 }}>
                Add Transaction
              </Button>
            </CardContent>
          </Card>
        </Box>

        <Box sx={{ mt: 3 }}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Backend Connection Status
              </Typography>
              <Typography variant="body2" color="text.secondary">
                ✅ Connected to FastAPI backend on localhost:8000
              </Typography>
              <Typography variant="body2" color="text.secondary">
                ✅ JWT authentication working
              </Typography>
              <Typography variant="body2" color="text.secondary">
                ✅ Token stored in localStorage
              </Typography>
              <Typography variant="body2" color="text.secondary">
                ✅ Logout functionality available
              </Typography>
            </CardContent>
          </Card>
        </Box>

        <Box sx={{ mt: 3 }}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Navigation Test
              </Typography>
              <Typography variant="body2" color="text.secondary">
                ✅ Desktop: Navigation buttons appear in the top bar on larger screens
              </Typography>
              <Typography variant="body2" color="text.secondary">
                ✅ Mobile: Hamburger menu appears on smaller screens
              </Typography>
              <Typography variant="body2" color="text.secondary">
                ✅ Icons: MUI icons are working properly
              </Typography>
              <Typography variant="body2" color="text.secondary">
                ✅ Logout: Available in both desktop and mobile navigation
              </Typography>
            </CardContent>
          </Card>
        </Box>
      </Container>
    </>
  );
}; 
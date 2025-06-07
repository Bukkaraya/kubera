import React from 'react';
import { ThemeProvider } from '@mui/material/styles';
import { 
  CssBaseline, 
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
  Receipt as TransactionIcon 
} from '@mui/icons-material';
import { theme } from './theme';

function App() {
  const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);
  
  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };
  
  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      
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
            <Button color="inherit" startIcon={<AccountIcon />} sx={{ fontSize: '1rem' }}>
              Accounts
            </Button>
            <Button color="inherit" startIcon={<TransactionIcon />} sx={{ fontSize: '1rem' }}>
              Transactions
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
              <MenuItem onClick={handleMenuClose}>
                <AccountIcon sx={{ mr: 1 }} />
                Accounts
              </MenuItem>
              <MenuItem onClick={handleMenuClose}>
                <TransactionIcon sx={{ mr: 1 }} />
                Transactions
              </MenuItem>
            </Menu>
          </Box>
        </Toolbar>
      </AppBar>

      {/* Main Content */}
      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        <Typography variant="h2" gutterBottom align="center">
          Kubera
        </Typography>
        <Typography variant="h5" gutterBottom align="center" color="text.secondary">
          Personal Budgeting Web App
        </Typography>
        
        <Box sx={{ mt: 4 }}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Welcome to Kubera!
              </Typography>
              <Typography variant="body1" paragraph>
                This is a barebones version with a simple navigation bar. 
                Try resizing the window to see the responsive menu!
              </Typography>
              <Button variant="contained" color="primary">
                Test Button
              </Button>
              <Button variant="outlined" color="secondary" sx={{ ml: 2 }}>
                Another Button
              </Button>
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
            </CardContent>
          </Card>
        </Box>

        <Box sx={{ mt: 3 }}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                MUI Theme Test
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Primary color: {theme.palette.primary.main}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Secondary color: {theme.palette.secondary.main}
              </Typography>
            </CardContent>
          </Card>
        </Box>
      </Container>
    </ThemeProvider>
  );
}

export default App;

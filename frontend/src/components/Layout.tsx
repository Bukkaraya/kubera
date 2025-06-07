import React, { useState } from 'react';
import {
  Box,
  AppBar,
  Toolbar,
  IconButton,
  Typography,
  useTheme,
  useMediaQuery,
} from '@mui/material';
import {
  Menu as MenuIcon,
} from '@mui/icons-material';
import Sidebar from './Sidebar';

const DRAWER_WIDTH = 280;

interface LayoutProps {
  children: React.ReactNode;
}

export const Layout: React.FC<LayoutProps> = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  const handleSidebarToggle = () => {
    setSidebarOpen(!sidebarOpen);
  };

  // On desktop, sidebar should be open by default
  React.useEffect(() => {
    if (!isMobile) {
      setSidebarOpen(true);
    } else {
      setSidebarOpen(false);
    }
  }, [isMobile]);

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh' }}>
      {/* Mobile AppBar - only show on mobile when sidebar is closed */}
      {isMobile && !sidebarOpen && (
        <AppBar
          position="fixed"
          sx={{
            zIndex: theme.zIndex.drawer + 1,
            backgroundColor: 'white',
            color: 'text.primary',
            boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
          }}
        >
          <Toolbar>
            <IconButton
              color="inherit"
              aria-label="open drawer"
              edge="start"
              onClick={handleSidebarToggle}
              sx={{ mr: 2 }}
            >
              <MenuIcon />
            </IconButton>
            <Typography variant="h6" noWrap component="div">
              Kubera
            </Typography>
          </Toolbar>
        </AppBar>
      )}

      {/* Sidebar */}
      <Sidebar open={sidebarOpen} onToggle={handleSidebarToggle} />

      {/* Main Content Area */}
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          width: '100%',
          ml: 0,
          mt: {
            xs: (isMobile && !sidebarOpen) ? '64px' : 0,
            md: 0,
          },
          transition: theme.transitions.create(['margin', 'width'], {
            easing: theme.transitions.easing.sharp,
            duration: theme.transitions.duration.leavingScreen,
          }),
          backgroundColor: theme.palette.grey[50],
          minHeight: (isMobile && !sidebarOpen) ? 'calc(100vh - 64px)' : '100vh',
        }}
      >
        {/* Desktop Toggle Button - only show when sidebar is closed on desktop */}
        {!isMobile && !sidebarOpen && (
          <Box
            sx={{
              position: 'fixed',
              top: 20,
              left: 20,
              zIndex: theme.zIndex.appBar,
            }}
          >
            <IconButton
              onClick={handleSidebarToggle}
              sx={{
                backgroundColor: 'white',
                boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
                '&:hover': {
                  backgroundColor: theme.palette.grey[50],
                },
              }}
            >
              <MenuIcon />
            </IconButton>
          </Box>
        )}

        {/* Page Content */}
        <Box sx={{ p: { xs: 2, md: 3 } }}>
          {children}
        </Box>
      </Box>
    </Box>
  );
};

export default Layout; 
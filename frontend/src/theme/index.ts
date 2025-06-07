import { createTheme } from '@mui/material/styles';

const baseTheme = {
  typography: {
    fontFamily: '"Fira Sans", "Roboto", "Helvetica", "Arial", sans-serif',
    h1: {
      fontSize: '2.125rem',
      fontWeight: 500,
    },
    h2: {
      fontSize: '1.75rem',
      fontWeight: 500,
    },
    h3: {
      fontSize: '1.5rem',
      fontWeight: 500,
    },
    h4: {
      fontSize: '1.25rem',
      fontWeight: 500,
    },
    h5: {
      fontSize: '1.125rem',
      fontWeight: 500,
    },
    h6: {
      fontSize: '1rem',
      fontWeight: 500,
    },
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: 'none' as const,
          borderRadius: 8,
          fontFamily: '"Fira Sans", sans-serif',
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 12,
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
        },
      },
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-root': {
            borderRadius: 8,
          },
        },
      },
    },
  },
};

const lightTheme = createTheme({
  ...baseTheme,
  palette: {
    mode: 'light',
    primary: {
      main: '#047857', // Emerald green
      light: '#10b981', // Light emerald
      dark: '#065f46', // Dark emerald
    },
    secondary: {
      main: '#f59e0b', // Warm amber accent
      light: '#fbbf24', // Light amber
      dark: '#d97706', // Dark amber
    },
    error: {
      main: '#ef4444',
    },
    warning: {
      main: '#f59e0b',
    },
    info: {
      main: '#06b6d4',
    },
    success: {
      main: '#047857',
    },
    background: {
      default: '#fafafa',
      paper: '#ffffff',
    },
  },
});

const darkTheme = createTheme({
  ...baseTheme,
  palette: {
    mode: 'dark',
    primary: {
      main: '#10b981', // Brighter emerald for dark mode
      light: '#34d399', // Light emerald
      dark: '#047857', // Dark emerald
    },
    secondary: {
      main: '#fbbf24', // Brighter amber for dark mode
      light: '#fde047', // Light amber
      dark: '#f59e0b', // Dark amber
    },
    error: {
      main: '#f87171',
    },
    warning: {
      main: '#fbbf24',
    },
    info: {
      main: '#22d3ee',
    },
    success: {
      main: '#10b981',
    },
    background: {
      default: '#0f172a', // Much darker blue-gray
      paper: '#1a202c', // Even darker blue-gray for cards
    },
    text: {
      primary: '#f8fafc',
      secondary: '#cbd5e1',
    },
  },
});

export const getTheme = (mode: 'light' | 'dark') => {
  return mode === 'dark' ? darkTheme : lightTheme;
};

// For backward compatibility
export const theme = lightTheme; 
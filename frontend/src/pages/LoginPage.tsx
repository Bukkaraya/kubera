import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Container,
  Paper,
  Box,
  Typography,
  TextField,
  Button,
  Alert,
} from '@mui/material';
import { authService } from '../services/authService';

export const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Redirect if already logged in
  useEffect(() => {
    if (authService.isAuthenticated()) {
      const from = (location.state as { from?: string })?.from || '/dashboard';
      navigate(from, { replace: true });
    }
  }, [navigate, location]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    // Simple validation
    if (!username || !password) {
      setError('Please fill in all fields');
      setIsLoading(false);
      return;
    }

    try {
      // Call the real backend API
      const response = await authService.login({ username, password });
      
      // Save the token
      authService.saveToken(response.access_token);
      
      // Navigate to the page they were trying to access, or dashboard as default
      const from = (location.state as { from?: string })?.from || '/dashboard';
      navigate(from, { replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Container component="main" maxWidth="sm">
      <Box
        sx={{
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
        }}
      >
        <Paper
          elevation={3}
          sx={{
            padding: 4,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            width: '100%',
          }}
        >
          <Typography component="h1" variant="h3" gutterBottom color="primary" sx={{ fontWeight: 600 }}>
            Kubera
          </Typography>
          <Typography variant="h5" gutterBottom color="text.secondary">
            Sign in to your account
          </Typography>

          {error && (
            <Alert severity="error" sx={{ width: '100%', mb: 2 }}>
              {error}
            </Alert>
          )}

          <Box component="form" onSubmit={handleLogin} sx={{ mt: 1, width: '100%' }}>
            <TextField
              margin="normal"
              required
              fullWidth
              id="username"
              label="Username"
              name="username"
              autoComplete="username"
              autoFocus
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              disabled={isLoading}
              helperText="Use 'admin' for demo"
            />
            <TextField
              margin="normal"
              required
              fullWidth
              name="password"
              label="Password"
              type="password"
              id="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={isLoading}
              helperText="Use 'admin123' for demo"
            />
            <Button
              type="submit"
              fullWidth
              variant="contained"
              sx={{ mt: 3, mb: 2 }}
              disabled={isLoading}
            >
              {isLoading ? 'Signing In...' : 'Sign In'}
            </Button>
          </Box>

          <Box sx={{ mt: 2, textAlign: 'center' }}>
            <Typography variant="body2" color="text.secondary">
              Demo credentials: admin / admin123
            </Typography>
          </Box>
        </Paper>
      </Box>
    </Container>
  );
}; 
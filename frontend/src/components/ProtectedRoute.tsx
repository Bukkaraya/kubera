import React, { useEffect } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { authService } from '../services/authService';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const location = useLocation();
  const isAuthenticated = authService.isAuthenticated();

  useEffect(() => {
    // Clear any expired tokens
    if (!isAuthenticated) {
      authService.removeToken();
    }
  }, [isAuthenticated]);

  if (!isAuthenticated) {
    // Save the attempted URL for redirect after login
    const redirectTo = location.pathname !== '/login' ? location.pathname : '/dashboard';
    return <Navigate to="/login" state={{ from: redirectTo }} replace />;
  }

  return <>{children}</>;
}; 
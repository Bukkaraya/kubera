import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { apiService } from '../services/api';
import { LoginRequest, LoginResponse, User } from '../types';

interface AuthContextType {
  isAuthenticated: boolean;
  user: User | null;
  login: (credentials: LoginRequest) => Promise<void>;
  logout: () => void;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    // Check if user is already authenticated on app load
    const checkAuth = () => {
      const authenticated = apiService.isAuthenticated();
      setIsAuthenticated(authenticated);
      setLoading(false);
      
      // TODO: Fetch user profile if authenticated
      // For now, we'll just set a dummy user if authenticated
      if (authenticated) {
        setUser({
          id: '1',
          username: 'user',
          name: 'User',
          created_at: new Date().toISOString(),
        });
      }
    };

    checkAuth();
  }, []);

  const login = async (credentials: LoginRequest): Promise<void> => {
    try {
      setLoading(true);
      const response: LoginResponse = await apiService.login(credentials);
      
      setIsAuthenticated(true);
      // TODO: Fetch and set actual user data
      setUser({
        id: '1',
        username: credentials.username,
        name: credentials.username,
        created_at: new Date().toISOString(),
      });
      
      setLoading(false);
    } catch (error) {
      setLoading(false);
      throw error;
    }
  };

  const logout = (): void => {
    apiService.logout();
    setIsAuthenticated(false);
    setUser(null);
  };

  const value: AuthContextType = {
    isAuthenticated,
    user,
    login,
    logout,
    loading,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}; 
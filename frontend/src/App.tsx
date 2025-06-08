import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider } from './contexts/ThemeContext';
import { LoginPage } from './pages/LoginPage';
import { DashboardPage } from './pages/DashboardPage';
import { AccountsPage } from './pages/AccountsPage';
import { TransactionsPage } from './pages/TransactionsPage';
import { BudgetsPage } from './pages/BudgetsPage';
import { ProtectedRoute } from './components/ProtectedRoute';
import { authService } from './services/authService';

// Component to handle root redirect
const RootRedirect: React.FC = () => {
  const isAuthenticated = authService.isAuthenticated();
  return <Navigate to={isAuthenticated ? "/dashboard" : "/login"} replace />;
};

function App() {
  return (
    <ThemeProvider>
      <Router>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/auth" element={<Navigate to="/login" replace />} />
          <Route 
            path="/dashboard" 
            element={
              <ProtectedRoute>
                <DashboardPage />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/accounts" 
            element={
              <ProtectedRoute>
                <AccountsPage />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/transactions" 
            element={
              <ProtectedRoute>
                <TransactionsPage />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/budgets" 
            element={
              <ProtectedRoute>
                <BudgetsPage />
              </ProtectedRoute>
            } 
          />
          <Route path="/" element={<RootRedirect />} />
        </Routes>
      </Router>
    </ThemeProvider>
  );
}

export default App;

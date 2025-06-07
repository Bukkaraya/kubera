import React, { useState, useEffect } from 'react';
import {
  Container,
  Typography,
  Box,
  Card,
  CardContent,
  Button,
  Alert,
  CircularProgress,
  Grid,
  LinearProgress,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  MenuItem,
  FormControl,
  InputLabel,
  Select,
  IconButton,
  Fab,
  Paper,
  Divider,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  TrendingUp as BudgetIcon,
  Refresh as RefreshIcon,
  Analytics as AnalyticsIcon,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { budgetService } from '../services/budgetService';
import { categoryService } from '../services/categoryService';
import type { Budget, BudgetCreate, BudgetUpdate, BudgetAnalysis } from '../types/budget';
import type { Category } from '../types';
import { Layout } from '../components/Layout';

export const BudgetsPage: React.FC = () => {
  const navigate = useNavigate();
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [budgetAnalysis, setBudgetAnalysis] = useState<BudgetAnalysis | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Dialog states
  const [openDialog, setOpenDialog] = useState(false);
  const [editingBudget, setEditingBudget] = useState<Budget | null>(null);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [budgetToDelete, setBudgetToDelete] = useState<Budget | null>(null);
  
  // Form states
  const [formData, setFormData] = useState<BudgetCreate>({
    name: '',
    amount: 0,
    period_year: new Date().getFullYear(),
    period_month: new Date().getMonth() + 1,
    category_id: '',
  });

  // Filter states
  const [filterYear, setFilterYear] = useState(new Date().getFullYear());
  const [filterMonth, setFilterMonth] = useState(new Date().getMonth() + 1);

  useEffect(() => {
    loadData();
  }, [filterYear, filterMonth]);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Load budgets with current filters
      const [budgetsData, categoriesData, analysisData] = await Promise.all([
        budgetService.getBudgets({ year: filterYear, month: filterMonth }),
        categoryService.getCategories(),
        budgetService.getBudgetAnalysis(filterYear, filterMonth)
      ]);

      setBudgets(budgetsData);
      setCategories(categoriesData);
      setBudgetAnalysis(analysisData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load budgets');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateBudget = () => {
    setEditingBudget(null);
    setFormData({
      name: '',
      amount: 0,
      period_year: filterYear,
      period_month: filterMonth,
      category_id: '',
    });
    setOpenDialog(true);
  };

  const handleEditBudget = (budget: Budget) => {
    setEditingBudget(budget);
    setFormData({
      name: budget.name,
      amount: budget.amount,
      period_year: budget.period_year,
      period_month: budget.period_month,
      category_id: budget.category_id,
    });
    setOpenDialog(true);
  };

  const handleDeleteBudget = (budget: Budget) => {
    setBudgetToDelete(budget);
    setDeleteConfirmOpen(true);
  };

  const confirmDelete = async () => {
    if (!budgetToDelete) return;
    
    try {
      await budgetService.deleteBudget(budgetToDelete.id);
      await loadData();
      setDeleteConfirmOpen(false);
      setBudgetToDelete(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete budget');
    }
  };

  const handleSubmit = async () => {
    try {
      if (editingBudget) {
        await budgetService.updateBudget(editingBudget.id, formData);
      } else {
        await budgetService.createBudget(formData);
      }
      await loadData();
      setOpenDialog(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save budget');
    }
  };

  const handleRefreshSpentAmounts = async () => {
    try {
      await budgetService.refreshSpentAmounts(filterYear, filterMonth);
      await loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to refresh spent amounts');
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  const getProgressColor = (percentage: number) => {
    if (percentage > 100) return 'error';
    if (percentage > 80) return 'warning';
    return 'success';
  };

  const getBudgetStatusChip = (budget: Budget) => {
    if (budget.percentage_used > 100) {
      return <Chip label="Over Budget" color="error" size="small" />;
    } else if (budget.percentage_used > 80) {
      return <Chip label="Nearly Spent" color="warning" size="small" />;
    } else {
      return <Chip label="On Track" color="success" size="small" />;
    }
  };

  const months = [
    { value: 1, label: 'January' },
    { value: 2, label: 'February' },
    { value: 3, label: 'March' },
    { value: 4, label: 'April' },
    { value: 5, label: 'May' },
    { value: 6, label: 'June' },
    { value: 7, label: 'July' },
    { value: 8, label: 'August' },
    { value: 9, label: 'September' },
    { value: 10, label: 'October' },
    { value: 11, label: 'November' },
    { value: 12, label: 'December' },
  ];

  return (
    <Layout>
      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
          <Typography variant="h4" component="h1">
            Budget Management
          </Typography>
          <Box>
            <Button
              variant="outlined"
              startIcon={<RefreshIcon />}
              onClick={handleRefreshSpentAmounts}
              sx={{ mr: 1 }}
            >
              Refresh
            </Button>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={handleCreateBudget}
            >
              Add Budget
            </Button>
          </Box>
        </Box>

        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}

        {/* Filter Controls */}
        <Paper sx={{ p: 3, mb: 3 }}>
          <Typography variant="h6" gutterBottom>
            Filter Budgets
          </Typography>
          <Box sx={{ 
            display: 'grid', 
            gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)' },
            gap: 2,
            alignItems: 'center' 
          }}>
            <TextField
              select
              fullWidth
              label="Year"
              value={filterYear}
              onChange={(e) => setFilterYear(parseInt(e.target.value))}
            >
              {Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - 2 + i).map((year) => (
                <MenuItem key={year} value={year}>
                  {year}
                </MenuItem>
              ))}
            </TextField>
            <TextField
              select
              fullWidth
              label="Month"
              value={filterMonth}
              onChange={(e) => setFilterMonth(parseInt(e.target.value))}
            >
              {months.map((month) => (
                <MenuItem key={month.value} value={month.value}>
                  {month.label}
                </MenuItem>
              ))}
            </TextField>
          </Box>
        </Paper>

        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
            <CircularProgress />
          </Box>
        ) : (
          <>
            {/* Budget Analysis Summary */}
            {budgetAnalysis && (
              <Paper sx={{ p: 3, mb: 3 }}>
                <Typography variant="h6" gutterBottom>
                  Budget Overview - {months.find(m => m.value === filterMonth)?.label} {filterYear}
                </Typography>
                <Box sx={{ 
                  display: 'grid', 
                  gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', md: 'repeat(4, 1fr)' },
                  gap: 3 
                }}>
                  <Box>
                    <Typography variant="body2" color="text.secondary">
                      Total Budgeted
                    </Typography>
                    <Typography variant="h6" color="primary">
                      {formatCurrency(budgetAnalysis.total_budgeted)}
                    </Typography>
                  </Box>
                  <Box>
                    <Typography variant="body2" color="text.secondary">
                      Total Spent
                    </Typography>
                    <Typography variant="h6" color={budgetAnalysis.total_spent > budgetAnalysis.total_budgeted ? 'error' : 'success'}>
                      {formatCurrency(budgetAnalysis.total_spent)}
                    </Typography>
                  </Box>
                  <Box>
                    <Typography variant="body2" color="text.secondary">
                      Remaining
                    </Typography>
                    <Typography variant="h6" color={budgetAnalysis.total_remaining < 0 ? 'error' : 'success'}>
                      {formatCurrency(budgetAnalysis.total_remaining)}
                    </Typography>
                  </Box>
                  <Box>
                    <Typography variant="body2" color="text.secondary">
                      Overall Progress
                    </Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <LinearProgress
                        variant="determinate"
                        value={Math.min(budgetAnalysis.overall_percentage_used, 100)}
                        color={getProgressColor(budgetAnalysis.overall_percentage_used)}
                        sx={{ flexGrow: 1, height: 8, borderRadius: 4 }}
                      />
                      <Typography variant="body2">
                        {budgetAnalysis.overall_percentage_used.toFixed(1)}%
                      </Typography>
                    </Box>
                  </Box>
                </Box>
                <Divider sx={{ my: 2 }} />
                <Box sx={{ display: 'flex', gap: 2 }}>
                  <Chip 
                    label={`${budgetAnalysis.budgets_count} Budgets`} 
                    color="primary" 
                    variant="outlined" 
                  />
                  {budgetAnalysis.over_budget_count > 0 && (
                    <Chip 
                      label={`${budgetAnalysis.over_budget_count} Over Budget`} 
                      color="error" 
                    />
                  )}
                </Box>
              </Paper>
            )}

            {/* Budget List */}
            {budgets.length === 0 ? (
              <Paper sx={{ p: 4, textAlign: 'center' }}>
                <BudgetIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
                <Typography variant="h6" color="text.secondary" gutterBottom>
                  No budgets found
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                  Create your first budget to start tracking your spending goals.
                </Typography>
                <Button variant="contained" startIcon={<AddIcon />} onClick={handleCreateBudget}>
                  Create Budget
                </Button>
              </Paper>
            ) : (
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    All Budgets
                  </Typography>
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                    {budgets.map((budget, index) => (
                      <Box key={budget.id}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Typography variant="subtitle1" fontWeight={600}>
                              {budget.name}
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                              ({budget.category?.name || 'Unknown Category'})
                            </Typography>
                            {getBudgetStatusChip(budget)}
                          </Box>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <IconButton
                              size="small"
                              onClick={() => handleEditBudget(budget)}
                              color="primary"
                            >
                              <EditIcon />
                            </IconButton>
                            <IconButton
                              size="small"
                              onClick={() => handleDeleteBudget(budget)}
                              color="error"
                            >
                              <DeleteIcon />
                            </IconButton>
                          </Box>
                        </Box>
                        
                        <Box sx={{ mb: 1 }}>
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                            <Typography variant="body2">
                              Spent: {formatCurrency(budget.spent_amount)}
                            </Typography>
                            <Typography variant="body2">
                              Budget: {formatCurrency(budget.amount)}
                            </Typography>
                          </Box>
                          <LinearProgress
                            variant="determinate"
                            value={Math.min(budget.percentage_used, 100)}
                            color={getProgressColor(budget.percentage_used)}
                            sx={{ height: 8, borderRadius: 4, mb: 1 }}
                          />
                          <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                            <Typography variant="body2" color={budget.remaining_amount < 0 ? 'error' : 'text.secondary'}>
                              Remaining: {formatCurrency(budget.remaining_amount)}
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                              {budget.percentage_used.toFixed(1)}%
                            </Typography>
                          </Box>
                        </Box>
                        
                        {index < budgets.length - 1 && <Divider sx={{ mt: 2 }} />}
                      </Box>
                    ))}
                  </Box>
                </CardContent>
              </Card>
            )}
          </>
        )}

        {/* Floating Action Button for Mobile */}
        <Fab
          color="primary"
          aria-label="add budget"
          sx={{ position: 'fixed', bottom: 16, right: 16, display: { xs: 'flex', md: 'none' } }}
          onClick={handleCreateBudget}
        >
          <AddIcon />
        </Fab>
      </Container>

      {/* Create/Edit Budget Dialog */}
      <Dialog open={openDialog} onClose={() => setOpenDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>
          {editingBudget ? 'Edit Budget' : 'Create Budget'}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
            <TextField
              fullWidth
              label="Budget Name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
            />
            <TextField
              fullWidth
              label="Amount"
              type="number"
              value={formData.amount}
              onChange={(e) => setFormData({ ...formData, amount: parseFloat(e.target.value) || 0 })}
              inputProps={{ min: 0, step: 0.01 }}
              required
            />
            <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 2 }}>
              <TextField
                select
                fullWidth
                label="Year"
                value={formData.period_year}
                onChange={(e) => setFormData({ ...formData, period_year: parseInt(e.target.value) })}
              >
                {Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - 2 + i).map((year) => (
                  <MenuItem key={year} value={year}>
                    {year}
                  </MenuItem>
                ))}
              </TextField>
              <TextField
                select
                fullWidth
                label="Month"
                value={formData.period_month}
                onChange={(e) => setFormData({ ...formData, period_month: parseInt(e.target.value) })}
              >
                {months.map((month) => (
                  <MenuItem key={month.value} value={month.value}>
                    {month.label}
                  </MenuItem>
                ))}
              </TextField>
            </Box>
            <FormControl fullWidth>
              <InputLabel>Category</InputLabel>
              <Select
                value={formData.category_id}
                label="Category"
                onChange={(e) => setFormData({ ...formData, category_id: e.target.value })}
              >
                {categories.map((category) => (
                  <MenuItem key={category.id} value={category.id}>
                    {category.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDialog(false)}>Cancel</Button>
          <Button onClick={handleSubmit} variant="contained">
            {editingBudget ? 'Update' : 'Create'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteConfirmOpen} onClose={() => setDeleteConfirmOpen(false)}>
        <DialogTitle>Delete Budget</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete the budget "{budgetToDelete?.name}"? This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteConfirmOpen(false)}>Cancel</Button>
          <Button onClick={confirmDelete} color="error" variant="contained">
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </Layout>
  );
}; 
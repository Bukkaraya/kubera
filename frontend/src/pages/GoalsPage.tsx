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
  Tabs,
  Tab,
  Chip,
} from '@mui/material';
import {
  Add as AddIcon,
  Flag as GoalIcon,
  TrendingUp as ProgressIcon,
  CheckCircle as CompletedIcon,
  Warning as OverdueIcon,
} from '@mui/icons-material';
import { apiService } from '../services/api';
import type { Goal, GoalCreate, GoalUpdate, GoalProgressUpdate, GoalStats } from '../types/goal';
import { GoalForm } from '../components/GoalForm';
import { GoalCard } from '../components/GoalCard';
import { Layout } from '../components/Layout';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

const TabPanel: React.FC<TabPanelProps> = ({ children, value, index, ...other }) => {
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`goals-tabpanel-${index}`}
      aria-labelledby={`goals-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ py: 3 }}>{children}</Box>}
    </div>
  );
};

export const GoalsPage: React.FC = () => {
  const [goals, setGoals] = useState<Goal[]>([]);
  const [goalStats, setGoalStats] = useState<GoalStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [formOpen, setFormOpen] = useState(false);
  const [editingGoal, setEditingGoal] = useState<Goal | null>(null);
  const [activeTab, setActiveTab] = useState(0);

  // Load goals and stats on component mount
  useEffect(() => {
    loadGoals();
    loadGoalStats();
  }, []);

  const loadGoals = async () => {
    try {
      setLoading(true);
      setError('');
      const goalsData = await apiService.getGoals();
      setGoals(goalsData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load goals');
    } finally {
      setLoading(false);
    }
  };

  const loadGoalStats = async () => {
    try {
      const stats = await apiService.getGoalStats();
      setGoalStats(stats);
    } catch (err) {
      console.error('Failed to load goal stats:', err);
    }
  };

  const handleCreateGoal = async (goalData: GoalCreate) => {
    try {
      const newGoal = await apiService.createGoal(goalData);
      setGoals(prev => [...prev, newGoal]);
      setFormOpen(false);
      loadGoalStats();
    } catch (err) {
      throw err; // Let the form handle the error display
    }
  };

  const handleUpdateGoal = async (goalData: GoalUpdate) => {
    if (!editingGoal) return;
    
    try {
      const updatedGoal = await apiService.updateGoal(editingGoal.id, goalData);
      setGoals(prev => prev.map(g => g.id === editingGoal.id ? updatedGoal : g));
      setEditingGoal(null);
      setFormOpen(false);
      loadGoalStats();
    } catch (err) {
      throw err; // Let the form handle the error display
    }
  };

  const handleUpdateProgress = async (goalId: string, progress: GoalProgressUpdate) => {
    try {
      const updatedGoal = await apiService.updateGoalProgress(goalId, progress);
      setGoals(prev => prev.map(g => g.id === goalId ? updatedGoal : g));
      loadGoalStats();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update progress');
    }
  };

  const handleCompleteGoal = async (goalId: string) => {
    try {
      const completedGoal = await apiService.completeGoal(goalId);
      setGoals(prev => prev.map(g => g.id === goalId ? completedGoal : g));
      loadGoalStats();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to complete goal');
    }
  };

  const handleDeleteGoal = async (goalId: string) => {
    if (!window.confirm('Are you sure you want to delete this goal?')) {
      return;
    }

    try {
      await apiService.deleteGoal(goalId);
      setGoals(prev => prev.filter(g => g.id !== goalId));
      loadGoalStats();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete goal');
    }
  };

  const handleEditGoal = (goal: Goal) => {
    setEditingGoal(goal);
    setFormOpen(true);
  };

  const handleFormClose = () => {
    setFormOpen(false);
    setEditingGoal(null);
  };

  const filterGoals = (filterType: string) => {
    switch (filterType) {
      case 'active':
        return goals.filter(g => g.status === 'active');
      case 'completed':
        return goals.filter(g => g.status === 'completed');
      case 'overdue':
        return goals.filter(g => {
          if (!g.target_date || g.status === 'completed') return false;
          return new Date(g.target_date) < new Date();
        });
      default:
        return goals;
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  const getTabContent = (tabIndex: number) => {
    let filteredGoals: Goal[] = [];
    switch (tabIndex) {
      case 0: // All Goals
        filteredGoals = goals;
        break;
      case 1: // Active
        filteredGoals = filterGoals('active');
        break;
      case 2: // Completed
        filteredGoals = filterGoals('completed');
        break;
      case 3: // Overdue
        filteredGoals = filterGoals('overdue');
        break;
    }

    if (filteredGoals.length === 0) {
      const emptyMessages = [
        'No goals yet. Create your first goal to start saving!',
        'No active goals. All your goals are either completed or paused.',
        'No completed goals yet. Keep working towards your goals!',
        'No overdue goals. Great job staying on track!',
      ];

      return (
        <Card>
          <CardContent sx={{ textAlign: 'center', py: 6 }}>
            <GoalIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
            <Typography variant="h6" gutterBottom>
              {tabIndex === 0 ? 'No goals yet' : emptyMessages[tabIndex]}
            </Typography>
            {tabIndex === 0 && (
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                onClick={() => setFormOpen(true)}
                sx={{ mt: 2 }}
              >
                Create Your First Goal
              </Button>
            )}
          </CardContent>
        </Card>
      );
    }

    return (
      <Box sx={{ 
        display: 'grid', 
        gridTemplateColumns: { 
          xs: '1fr !important', 
          sm: 'repeat(2, 1fr)', 
          md: 'repeat(3, 1fr)' 
        }, 
        gap: { xs: 2, sm: 3 },
        '@media (max-width: 600px)': {
          gridTemplateColumns: '1fr',
        }
      }}>
        {filteredGoals.map((goal) => (
          <GoalCard
            key={goal.id}
            goal={goal}
            onEdit={handleEditGoal}
            onDelete={handleDeleteGoal}
            onUpdateProgress={handleUpdateProgress}
            onComplete={handleCompleteGoal}
          />
        ))}
      </Box>
    );
  };

  return (
    <Layout>
      <Container maxWidth="lg" sx={{ mt: { xs: 2, sm: 4 }, mb: 4, px: { xs: 2, sm: 3 } }}>
        {/* Header */}
        <Box sx={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: { xs: 'flex-start', sm: 'center' },
          flexDirection: { xs: 'column', sm: 'row' },
          gap: { xs: 2, sm: 0 },
          mb: 4 
        }}>
          <Typography variant="h4" component="h1" sx={{ fontSize: { xs: '1.75rem', sm: '2.125rem' } }}>
            Savings Goals
          </Typography>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => setFormOpen(true)}
            sx={{ 
              width: { xs: '100%', sm: 'auto' },
              py: { xs: 1.5, sm: 1 }
            }}
          >
            Add Goal
          </Button>
        </Box>

        {/* Stats Cards */}
        {goalStats && (
          <Box sx={{ 
            display: 'grid', 
            gridTemplateColumns: { 
              xs: '1fr !important', 
              sm: 'repeat(2, 1fr)', 
              md: 'repeat(4, 1fr)' 
            }, 
            gap: { xs: 2, sm: 3 },
            mb: 4,
            '@media (max-width: 600px)': {
              gridTemplateColumns: '1fr',
            }
          }}>
            <Card>
              <CardContent sx={{ textAlign: 'center', py: { xs: 1.5, sm: 2 } }}>
                <Typography variant="h4" color="primary.main" sx={{ fontSize: { xs: '1.5rem', sm: '2.125rem' } }}>
                  {goalStats.total_goals}
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}>
                  Total Goals
                </Typography>
              </CardContent>
            </Card>
            <Card>
              <CardContent sx={{ textAlign: 'center', py: { xs: 1.5, sm: 2 } }}>
                <Typography variant="h4" color="success.main" sx={{ fontSize: { xs: '1.5rem', sm: '2.125rem' } }}>
                  {goalStats.active_goals}
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}>
                  Active Goals
                </Typography>
              </CardContent>
            </Card>
            <Card>
              <CardContent sx={{ textAlign: 'center', py: { xs: 1.5, sm: 2 } }}>
                <Typography variant="h4" color="warning.main" sx={{ fontSize: { xs: '1.5rem', sm: '2.125rem' } }}>
                  {goalStats.completed_goals}
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}>
                  Completed
                </Typography>
              </CardContent>
            </Card>
            <Card>
              <CardContent sx={{ textAlign: 'center', py: { xs: 1.5, sm: 2 } }}>
                <Typography variant="h4" color="info.main" sx={{ fontSize: { xs: '1.5rem', sm: '2.125rem' } }}>
                  {goalStats.overall_progress_percentage.toFixed(1)}%
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}>
                  Overall Progress
                </Typography>
              </CardContent>
            </Card>
          </Box>
        )}

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
          <>
            {/* Tabs */}
            <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
              <Tabs 
                value={activeTab} 
                onChange={(_, newValue) => setActiveTab(newValue)}
                variant="scrollable"
                scrollButtons="auto"
                allowScrollButtonsMobile
                sx={{
                  '& .MuiTab-root': {
                    minWidth: { xs: 60, sm: 120 },
                    fontSize: { xs: '0.75rem', sm: '0.9375rem' },
                    px: { xs: 0.5, sm: 2 },
                    py: { xs: 1, sm: 1.5 },
                    minHeight: { xs: 48, sm: 64 }
                  },
                  '& .MuiTabs-scrollButtons': {
                    '&.Mui-disabled': { opacity: 0.3 }
                  }
                }}
              >
                <Tab 
                  label={
                    <Box sx={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      gap: { xs: 0.25, sm: 1 }, 
                      flexDirection: { xs: 'column', sm: 'row' },
                      px: { xs: 0, sm: 0.5 }
                    }}>
                      <Box sx={{ display: { xs: 'none', sm: 'block' } }}>All Goals</Box>
                      <Box sx={{ display: { xs: 'block', sm: 'none' }, fontSize: '0.7rem', fontWeight: 500 }}>ALL</Box>
                      <Chip 
                        label={goals.length} 
                        size="small" 
                        sx={{ 
                          height: { xs: 16, sm: 24 }, 
                          fontSize: { xs: '0.6rem', sm: '0.75rem' },
                          '& .MuiChip-label': { px: { xs: 0.5, sm: 1 } }
                        }} 
                      />
                    </Box>
                  } 
                />
                <Tab 
                  label={
                    <Box sx={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      gap: { xs: 0.25, sm: 1 }, 
                      flexDirection: { xs: 'column', sm: 'row' },
                      px: { xs: 0, sm: 0.5 }
                    }}>
                      <ProgressIcon sx={{ fontSize: { xs: 14, sm: 20 } }} />
                      <Box sx={{ display: { xs: 'none', sm: 'block' } }}>Active</Box>
                      <Chip 
                        label={filterGoals('active').length} 
                        size="small" 
                        color="primary" 
                        sx={{ 
                          height: { xs: 16, sm: 24 }, 
                          fontSize: { xs: '0.6rem', sm: '0.75rem' },
                          '& .MuiChip-label': { px: { xs: 0.5, sm: 1 } }
                        }} 
                      />
                    </Box>
                  } 
                />
                <Tab 
                  label={
                    <Box sx={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      gap: { xs: 0.25, sm: 1 }, 
                      flexDirection: { xs: 'column', sm: 'row' },
                      px: { xs: 0, sm: 0.5 }
                    }}>
                      <CompletedIcon sx={{ fontSize: { xs: 14, sm: 20 } }} />
                      <Box sx={{ display: { xs: 'none', sm: 'block' } }}>Completed</Box>
                      <Chip 
                        label={filterGoals('completed').length} 
                        size="small" 
                        color="success" 
                        sx={{ 
                          height: { xs: 16, sm: 24 }, 
                          fontSize: { xs: '0.6rem', sm: '0.75rem' },
                          '& .MuiChip-label': { px: { xs: 0.5, sm: 1 } }
                        }} 
                      />
                    </Box>
                  } 
                />
                <Tab 
                  label={
                    <Box sx={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      gap: { xs: 0.25, sm: 1 }, 
                      flexDirection: { xs: 'column', sm: 'row' },
                      px: { xs: 0, sm: 0.5 }
                    }}>
                      <OverdueIcon sx={{ fontSize: { xs: 14, sm: 20 } }} />
                      <Box sx={{ display: { xs: 'none', sm: 'block' } }}>Overdue</Box>
                      <Chip 
                        label={filterGoals('overdue').length} 
                        size="small" 
                        color="error" 
                        sx={{ 
                          height: { xs: 16, sm: 24 }, 
                          fontSize: { xs: '0.6rem', sm: '0.75rem' },
                          '& .MuiChip-label': { px: { xs: 0.5, sm: 1 } }
                        }} 
                      />
                    </Box>
                  } 
                />
              </Tabs>
            </Box>

            {/* Tab Content */}
            <TabPanel value={activeTab} index={0}>
              {getTabContent(0)}
            </TabPanel>
            <TabPanel value={activeTab} index={1}>
              {getTabContent(1)}
            </TabPanel>
            <TabPanel value={activeTab} index={2}>
              {getTabContent(2)}
            </TabPanel>
            <TabPanel value={activeTab} index={3}>
              {getTabContent(3)}
            </TabPanel>
          </>
        )}

        {/* Goal Form Dialog */}
        <GoalForm
          open={formOpen}
          onClose={handleFormClose}
          onSubmit={(goalData) => editingGoal ? handleUpdateGoal(goalData as GoalUpdate) : handleCreateGoal(goalData as GoalCreate)}
          goal={editingGoal}
        />
      </Container>
    </Layout>
  );
}; 
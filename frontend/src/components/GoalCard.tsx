import React, { useState } from 'react';
import {
  Card,
  CardContent,
  Typography,
  Box,
  LinearProgress,
  Button,
  Chip,
  IconButton,
  Menu,
  MenuItem,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Tooltip,
  Avatar,
  Stack,
  Divider,
} from '@mui/material';
import {
  MoreVert as MoreVertIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  CheckCircle as CheckCircleIcon,
  Schedule as ScheduleIcon,
  AttachMoney as AttachMoneyIcon,
  CalendarToday as CalendarTodayIcon,
  Flag as FlagIcon,
  TrendingUp as TrendingUpIcon,
  Update as UpdateIcon,
} from '@mui/icons-material';
import type { Goal, GoalProgressUpdate } from '../types/goal';

interface GoalCardProps {
  goal: Goal;
  onEdit: (goal: Goal) => void;
  onDelete: (goalId: string) => void;
  onUpdateProgress: (goalId: string, progress: GoalProgressUpdate) => void;
  onComplete: (goalId: string) => void;
}

export const GoalCard: React.FC<GoalCardProps> = ({
  goal,
  onEdit,
  onDelete,
  onUpdateProgress,
  onComplete,
}) => {
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [showProgressDialog, setShowProgressDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [newProgress, setNewProgress] = useState(goal.current_amount);

  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleDateString();
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'success';
      case 'active':
        return 'primary';
      case 'paused':
        return 'warning';
      case 'cancelled':
        return 'error';
      default:
        return 'default';
    }
  };

  const getGoalTypeIcon = (goalType: string) => {
    switch (goalType) {
      case 'amount':
        return <AttachMoneyIcon fontSize="small" />;
      case 'amount_date':
        return <ScheduleIcon fontSize="small" />;
      default:
        return null;
    }
  };

  const getGoalTypeLabel = (goalType: string) => {
    switch (goalType) {
      case 'amount':
        return 'Amount Goal';
      case 'amount_date':
        return 'Amount + Date';
      default:
        return goalType;
    }
  };

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleProgressUpdate = () => {
    onUpdateProgress(goal.id, { current_amount: newProgress });
    setShowProgressDialog(false);
  };

  const handleDeleteConfirm = () => {
    onDelete(goal.id);
    setShowDeleteDialog(false);
  };

  const isOverdue = () => {
    if (!goal.target_date) return false;
    return new Date(goal.target_date) < new Date() && goal.status !== 'completed';
  };

  const getDaysRemaining = () => {
    if (!goal.target_date) return null;
    const days = goal.days_remaining || 0;
    if (days < 0) return 'Overdue';
    if (days === 0) return 'Due today';
    if (days === 1) return '1 day left';
    return `${days} days left`;
  };

    return (
    <>
      <Card 
        sx={{ 
          height: '100%',
          borderRadius: 3,
          border: goal.is_completed ? '2px solid' : '1px solid',
          borderColor: goal.is_completed ? 'success.main' : 'divider',
          opacity: goal.status === 'cancelled' ? 0.7 : 1,
          transition: 'all 0.2s ease-in-out',
          display: 'flex',
          flexDirection: 'column',
          '&:hover': {
            transform: 'translateY(-2px)',
            boxShadow: 4,
          },
        }}
      >
        <CardContent sx={{ 
          p: { xs: 1.5, sm: 3 }, 
          flexGrow: 1, 
          display: 'flex', 
          flexDirection: 'column',
          height: '100%' 
        }}>
          {/* Header Section */}
          <Box sx={{ display: 'flex', alignItems: 'flex-start', mb: { xs: 1.5, sm: 3 } }}>
            <Avatar
              sx={{
                bgcolor: goal.is_completed ? 'success.main' : 'primary.main',
                width: { xs: 40, sm: 48 },
                height: { xs: 40, sm: 48 },
                mr: { xs: 1.5, sm: 2 },
              }}
            >
              {goal.is_completed ? (
                <CheckCircleIcon sx={{ fontSize: { xs: 20, sm: 24 } }} />
              ) : (
                <FlagIcon sx={{ fontSize: { xs: 20, sm: 24 } }} />
              )}
            </Avatar>
            
            <Box sx={{ flexGrow: 1, minWidth: 0 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Typography 
                  variant="h6" 
                  component="h3" 
                  sx={{ 
                    fontWeight: 600,
                    fontSize: { xs: '1rem', sm: '1.1rem' },
                    lineHeight: 1.3,
                    mb: 0.5,
                    wordBreak: 'break-word',
                    display: '-webkit-box',
                    WebkitLineClamp: { xs: 2, sm: 1 },
                    WebkitBoxOrient: 'vertical',
                    overflow: 'hidden',
                  }}
                >
                  {goal.name}
                </Typography>
                <IconButton size="small" onClick={handleMenuOpen} sx={{ ml: 1 }}>
                  <MoreVertIcon fontSize="small" />
                </IconButton>
              </Box>
              
              {/* Status and Type Chips */}
              <Stack 
                direction={{ xs: 'column', sm: 'row' }} 
                spacing={{ xs: 0.5, sm: 1 }} 
                sx={{ mb: 1 }}
              >
                <Chip
                  icon={getGoalTypeIcon(goal.goal_type) || undefined}
                  label={getGoalTypeLabel(goal.goal_type)}
                  size="small"
                  variant="outlined"
                  sx={{ fontSize: '0.75rem', height: 24, alignSelf: 'flex-start' }}
                />
                <Chip
                  label={goal.status.charAt(0).toUpperCase() + goal.status.slice(1)}
                  size="small"
                  color={getStatusColor(goal.status) as any}
                  sx={{ fontSize: '0.75rem', height: 24, alignSelf: 'flex-start' }}
                />
              </Stack>
            </Box>
          </Box>

          {/* Description */}
          <Box sx={{ mb: { xs: 1.5, sm: 2 }, minHeight: { xs: '32px', sm: '40px' }, display: 'flex', alignItems: 'flex-start' }}>
            {goal.description ? (
              <Typography 
                variant="body2" 
                color="text.secondary" 
                sx={{ 
                  lineHeight: 1.5,
                  fontSize: { xs: '0.8rem', sm: '0.875rem' },
                  display: '-webkit-box',
                  WebkitLineClamp: { xs: 1, sm: 2 },
                  WebkitBoxOrient: 'vertical',
                  overflow: 'hidden',
                }}
              >
                {goal.description}
              </Typography>
            ) : (
              <Typography 
                variant="body2" 
                color="text.disabled" 
                sx={{ 
                  fontStyle: 'italic',
                  fontSize: { xs: '0.8rem', sm: '0.875rem' }
                }}
              >
                No description
              </Typography>
            )}
          </Box>

          {/* Progress Section - Fixed Height */}
          <Box sx={{ mb: { xs: 1.5, sm: 2 }, minHeight: goal.target_amount ? { xs: '70px', sm: '90px' } : '20px' }}>
            {goal.target_amount && (
              <Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                  <Typography variant="body2" fontWeight={500} sx={{ fontSize: { xs: '0.8rem', sm: '0.875rem' } }}>
                    Progress
                  </Typography>
                  <Typography 
                    variant="h6" 
                    fontWeight="bold" 
                    color="primary.main"
                    sx={{ fontSize: { xs: '1rem', sm: '1.25rem' } }}
                  >
                    {goal.progress_percentage.toFixed(0)}%
                  </Typography>
                </Box>
                
                <LinearProgress 
                  variant="determinate" 
                  value={Math.min(goal.progress_percentage || 0, 100)}
                  sx={{ 
                    height: 10, 
                    borderRadius: 5,
                    bgcolor: 'grey.200',
                    '& .MuiLinearProgress-bar': {
                      borderRadius: 5,
                      bgcolor: goal.is_completed ? 'success.main' : 'primary.main',
                    }
                  }}
                />
                
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 1 }}>
                  <Typography variant="caption" color="text.secondary">
                    {formatCurrency(goal.current_amount)}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {formatCurrency(goal.target_amount)}
                  </Typography>
                </Box>
                
                {goal.remaining_amount && goal.remaining_amount > 0 && (
                  <Typography variant="body2" color="text.secondary" sx={{ mt: 1, textAlign: 'center' }}>
                    {formatCurrency(goal.remaining_amount)} remaining
                  </Typography>
                )}
              </Box>
            )}
          </Box>

          {/* Date Information - Fixed Height */}
          <Box sx={{ mb: { xs: 1.5, sm: 2 }, minHeight: goal.target_date ? { xs: '50px', sm: '60px' } : '20px' }}>
            {goal.target_date && (
              <Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                  <CalendarTodayIcon fontSize="small" color="action" />
                  <Typography variant="body2" fontWeight={500} sx={{ fontSize: { xs: '0.8rem', sm: '0.875rem' } }}>
                    Target Date
                  </Typography>
                </Box>
                <Typography 
                  variant="body2" 
                  color="text.primary"
                  sx={{ fontSize: { xs: '0.8rem', sm: '0.875rem' } }}
                >
                  {formatDate(goal.target_date)}
                </Typography>
                {getDaysRemaining() && (
                  <Chip
                    label={getDaysRemaining()}
                    size="small"
                    color={isOverdue() ? 'error' : 'info'}
                    variant="filled"
                    sx={{ mt: 1, fontSize: '0.75rem' }}
                  />
                )}
              </Box>
            )}
          </Box>

          {/* Spacer to push content to bottom */}
          <Box sx={{ flexGrow: 1 }} />

          <Divider sx={{ mb: { xs: 1.5, sm: 2 } }} />

          {/* Action Buttons - Fixed at bottom */}
          <Stack 
            direction={{ xs: 'column', sm: 'row' }} 
            spacing={1} 
            justifyContent="flex-end" 
            sx={{ mb: { xs: 1, sm: 1.5 } }}
          >
            <Button
              variant="outlined"
              size="small"
              startIcon={<UpdateIcon />}
              onClick={() => setShowProgressDialog(true)}
              disabled={goal.status === 'completed' || goal.status === 'cancelled'}
              sx={{ 
                borderRadius: 2,
                textTransform: 'none',
                fontWeight: 500,
                fontSize: { xs: '0.8rem', sm: '0.875rem' },
                py: { xs: 1, sm: 0.5 },
                width: { xs: '100%', sm: 'auto' }
              }}
            >
              Update
            </Button>
            
            {!goal.is_completed && goal.status === 'active' && goal.target_amount && 
             goal.current_amount >= goal.target_amount && (
              <Button
                variant="contained"
                size="small"
                startIcon={<CheckCircleIcon />}
                onClick={() => onComplete(goal.id)}
                color="success"
                sx={{ 
                  borderRadius: 2,
                  textTransform: 'none',
                  fontWeight: 500,
                  fontSize: { xs: '0.8rem', sm: '0.875rem' },
                  py: { xs: 1, sm: 0.5 },
                  width: { xs: '100%', sm: 'auto' }
                }}
              >
                Complete
              </Button>
            )}
          </Stack>

          {/* Created Date - Fixed at bottom */}
          <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
            Created {formatDate(goal.created_at)}
            {goal.completed_at && (
              <> • Completed {formatDate(goal.completed_at)}</>
            )}
          </Typography>
        </CardContent>
      </Card>

      {/* Actions Menu */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
      >
        <MenuItem onClick={() => { onEdit(goal); handleMenuClose(); }}>
          <EditIcon fontSize="small" sx={{ mr: 1 }} />
          Edit Goal
        </MenuItem>
        <MenuItem 
          onClick={() => { setShowDeleteDialog(true); handleMenuClose(); }}
          sx={{ color: 'error.main' }}
        >
          <DeleteIcon fontSize="small" sx={{ mr: 1 }} />
          Delete Goal
        </MenuItem>
      </Menu>

      {/* Progress Update Dialog */}
      <Dialog open={showProgressDialog} onClose={() => setShowProgressDialog(false)}>
        <DialogTitle>Update Goal Progress</DialogTitle>
        <DialogContent>
          <Typography variant="body2" sx={{ mb: 2 }}>
            Update the current amount saved for "{goal.name}"
          </Typography>
          <TextField
            fullWidth
            label="Current Amount"
            type="number"
            inputProps={{ 
              min: 0, 
              step: 0.01,
              style: { 
                MozAppearance: 'textfield', // Firefox
              }
            }}
            value={newProgress === 0 ? '' : newProgress}
            onChange={(e) => setNewProgress(parseFloat(e.target.value) || 0)}
            sx={{ 
              mt: 1,
              '& input[type=number]': {
                MozAppearance: 'textfield', // Firefox
              },
              '& input[type=number]::-webkit-outer-spin-button': {
                WebkitAppearance: 'none', // Chrome, Safari, Edge
                margin: 0,
              },
              '& input[type=number]::-webkit-inner-spin-button': {
                WebkitAppearance: 'none', // Chrome, Safari, Edge
                margin: 0,
              },
            }}
          />
          {goal.target_amount && (
            <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
              Target: {formatCurrency(goal.target_amount)}
            </Typography>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowProgressDialog(false)}>Cancel</Button>
          <Button 
            onClick={handleProgressUpdate} 
            variant="contained"
            disabled={newProgress < 0}
          >
            Update
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={showDeleteDialog} onClose={() => setShowDeleteDialog(false)}>
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <DeleteIcon color="error" />
          Delete Goal
        </DialogTitle>
        <DialogContent>
          <Typography variant="body1" sx={{ mb: 2 }}>
            Are you sure you want to delete the goal <strong>"{goal.name}"</strong>?
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
            This action cannot be undone. You will lose:
          </Typography>
          <Box component="ul" sx={{ pl: 2, mt: 1 }}>
            <Typography component="li" variant="body2" color="text.secondary">
              All progress data ({formatCurrency(goal.current_amount)} saved)
            </Typography>
            <Typography component="li" variant="body2" color="text.secondary">
              Goal history and tracking information
            </Typography>
            {goal.target_date && (
              <Typography component="li" variant="body2" color="text.secondary">
                Target date and timeline data
              </Typography>
            )}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowDeleteDialog(false)}>
            Cancel
          </Button>
          <Button 
            onClick={handleDeleteConfirm} 
            color="error"
            variant="contained"
            startIcon={<DeleteIcon />}
          >
            Delete Goal
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}; 
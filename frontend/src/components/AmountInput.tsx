import React from 'react';
import {
  Box,
  TextField,
  Typography,
  Switch,
  FormControlLabel,
} from '@mui/material';
import { useTheme } from '@mui/material/styles';

interface AmountInputProps {
  value: number | string;
  onChange: (value: number) => void;
  isIncome?: boolean;
  onIncomeChange?: (isIncome: boolean) => void;
  disabled?: boolean;
  required?: boolean;
  showIncomeToggle?: boolean;
  label?: string;
}

export const AmountInput: React.FC<AmountInputProps> = ({
  value,
  onChange,
  isIncome = false,
  onIncomeChange,
  disabled = false,
  required = false,
  showIncomeToggle = false,
  label = "Amount"
}) => {
  const theme = useTheme();

  const handleAmountChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const numValue = Number(event.target.value) || 0;
    onChange(numValue);
  };

  const handleIncomeToggle = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (onIncomeChange) {
      onIncomeChange(event.target.checked);
    }
  };

  return (
    <Box sx={{ 
      display: 'flex', 
      flexDirection: 'column',
      alignItems: 'center',
      p: 3, 
      bgcolor: theme.palette.mode === 'dark' ? 'grey.800' : 'grey.50',
      borderRadius: 2,
      border: '2px solid',
      borderColor: theme.palette.mode === 'dark' ? 'grey.600' : 'grey.300',
    }}>
      <Typography variant="h6" sx={{ 
        mb: 2, 
        color: 'text.secondary'
      }}>
        {label}
      </Typography>
      
      <TextField
        type="number"
        value={value || ''}
        onChange={handleAmountChange}
        disabled={disabled}
        required={required}
        inputProps={{ 
          min: 0.01, 
          step: 0.01,
          style: { 
            fontSize: '2rem', 
            textAlign: 'center',
            fontWeight: 600
          }
        }}
        sx={{ 
          '& .MuiOutlinedInput-root': {
            backgroundColor: theme.palette.mode === 'dark' 
              ? theme.palette.background.paper 
              : 'white',
            borderRadius: 1,
            minWidth: '200px',
            '& fieldset': { 
              border: 'none',
            },
          },
          '& .MuiInputBase-input': {
            color: showIncomeToggle 
              ? (isIncome 
                  ? theme.palette.success.main 
                  : theme.palette.error.main)
              : (Number(value) > 0 
                  ? theme.palette.success.main 
                  : Number(value) < 0 
                    ? theme.palette.error.main 
                    : 'text.primary')
          }
        }}
        placeholder="0.00"
      />
      
      {showIncomeToggle && onIncomeChange && (
        <FormControlLabel
          control={
            <Switch
              checked={isIncome}
              onChange={handleIncomeToggle}
              color="success"
              disabled={disabled}
            />
          }
          label={
            <Typography variant="body2" sx={{ fontWeight: 500 }}>
              {isIncome ? 'Income' : 'Expense'}
            </Typography>
          }
          sx={{ mt: 1 }}
        />
      )}
      
      {!showIncomeToggle && (
        <Typography variant="caption" sx={{ 
          mt: 1, 
          color: 'text.secondary', 
          textAlign: 'center' 
        }}>
          Positive for income • Negative for expense
        </Typography>
      )}
    </Box>
  );
}; 
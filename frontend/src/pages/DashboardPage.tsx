import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Container, 
  Typography, 
  Card, 
  CardContent, 
  Button,
  Box,
  Chip,
  Alert,
  CircularProgress,
  Divider,
  Avatar,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  LinearProgress,
  useTheme
} from '@mui/material';
import { 
  Add as AddIcon,
  TrendingUp as IncomeIcon,
  TrendingDown as ExpenseIcon,
  Savings as SavingsIcon,
  CreditCard as CreditIcon,
  AccountBalanceWallet as WalletIcon,
  BusinessCenter as InvestmentIcon,
  AccountBalance as AccountIcon
} from '@mui/icons-material';
import { authService } from '../services/authService';
import { accountService } from '../services/accountService';
import { transactionService } from '../services/transactionService';
import type { Account } from '../types/account';
import type { Transaction } from '../types/transaction';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip, LineChart, Line, XAxis, YAxis, CartesianGrid, BarChart, Bar, ReferenceLine, ComposedChart } from 'recharts';
import { Layout } from '../components/Layout';

export const DashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const theme = useTheme();
  
  // Dashboard data state
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [recentTransactions, setRecentTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [monthlyStats, setMonthlyStats] = useState({
    totalIncome: 0,
    totalExpenses: 0,
    netIncome: 0,
  });
  const [categoryExpenses, setCategoryExpenses] = useState<Array<{
    name: string;
    value: number;
    color: string;
  }>>([]);
  const [spendingTrend, setSpendingTrend] = useState<Array<{
    day: number;
    currentMonth: number | null;
    previousMonth: number | null;
  }>>([]);
  const [monthlyComparison, setMonthlyComparison] = useState<Array<{
    month: string;
    netCashFlow: number;
    income: number;
    expenses: number;
  }>>([]);

  // Theme-aware chart styling
  const getTooltipStyle = () => ({
    backgroundColor: theme.palette.background.paper,
    border: `1px solid ${theme.palette.divider}`,
    borderRadius: '8px',
    boxShadow: theme.palette.mode === 'dark' 
      ? '0 4px 6px -1px rgba(0, 0, 0, 0.3)' 
      : '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
    color: theme.palette.text.primary,
  });

  const getAxisColor = () => theme.palette.text.secondary;
  const getGridColor = () => theme.palette.divider;

  // Load dashboard data
  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Load accounts and recent transactions in parallel
      const [accountsData, transactionsData] = await Promise.all([
        accountService.getAccounts(),
        transactionService.getTransactions(0, 5),
      ]);
      
      setAccounts(accountsData);
      setRecentTransactions(transactionsData);
      
      // Calculate monthly stats (current month)
      const currentMonth = new Date().getMonth();
      const currentYear = new Date().getFullYear();
      const startOfMonth = new Date(currentYear, currentMonth, 1).toISOString().split('T')[0];
      const endOfMonth = new Date(currentYear, currentMonth + 1, 0).toISOString().split('T')[0];
      
      const monthlyTransactions = await transactionService.getTransactions(0, 1000, {
        start_date: startOfMonth,
        end_date: endOfMonth,
      });
      
      const income = monthlyTransactions
        .filter(t => t.is_income)
        .reduce((sum, t) => sum + t.amount, 0);
      
      const expenses = monthlyTransactions
        .filter(t => !t.is_income)
        .reduce((sum, t) => sum + Math.abs(t.amount), 0); // Use absolute value for expenses
      
      setMonthlyStats({
        totalIncome: income,
        totalExpenses: expenses,
        netIncome: income - expenses,
      });

      // Calculate category expenses for pie chart
      const expenseTransactions = monthlyTransactions.filter(t => !t.is_income);
      const categoryExpenseMap = new Map<string, number>();
      
      expenseTransactions.forEach(transaction => {
        const categoryName = transaction.category?.name || 'Unknown';
        const currentTotal = categoryExpenseMap.get(categoryName) || 0;
        categoryExpenseMap.set(categoryName, currentTotal + Math.abs(transaction.amount));
      });

      // Convert to chart data with solid, professional colors
      const colors = [
        '#2563eb', // Blue
        '#dc2626', // Red
        '#16a34a', // Green
        '#ea580c', // Orange
        '#9333ea', // Purple
        '#0891b2', // Cyan
        '#be185d', // Pink
        '#65a30d', // Lime
        '#4338ca', // Indigo
        '#c2410c', // Orange-red
      ];
      const chartData = Array.from(categoryExpenseMap.entries()).map(([name, value], index) => ({
        name,
        value,
        color: colors[index % colors.length],
      }));

      setCategoryExpenses(chartData);

      // Calculate spending trend data
      const currentDate = new Date();
      const trendCurrentMonth = currentDate.getMonth();
      const trendCurrentYear = currentDate.getFullYear();
      const currentDay = currentDate.getDate();
      
      // Previous month dates
      const prevMonthDate = new Date(trendCurrentYear, trendCurrentMonth - 1, 1);
      const prevMonth = prevMonthDate.getMonth();
      const prevYear = prevMonthDate.getFullYear();
      const prevMonthLastDay = new Date(prevYear, prevMonth + 1, 0).getDate();
      
      // Get previous month transactions
      const prevMonthStart = new Date(prevYear, prevMonth, 1).toISOString().split('T')[0];
      const prevMonthEnd = new Date(prevYear, prevMonth + 1, 0).toISOString().split('T')[0];
      
      const prevMonthTransactions = await transactionService.getTransactions(0, 1000, {
        start_date: prevMonthStart,
        end_date: prevMonthEnd,
      });

      // Build daily cumulative spending data
      const maxDays = Math.max(currentDay, prevMonthLastDay);
      const trendData = [];

      for (let day = 1; day <= maxDays; day++) {
        // Current month cumulative spending up to this day
        const currentMonthSpending = monthlyTransactions
          .filter(t => !t.is_income && new Date(t.transaction_date).getDate() <= day)
          .reduce((sum, t) => sum + Math.abs(t.amount), 0);

        // Previous month cumulative spending up to this day
        const prevMonthSpending = prevMonthTransactions
          .filter(t => !t.is_income && new Date(t.transaction_date).getDate() <= day)
          .reduce((sum, t) => sum + Math.abs(t.amount), 0);

        trendData.push({
          day,
          currentMonth: day <= currentDay ? currentMonthSpending : null,
          previousMonth: day <= prevMonthLastDay ? prevMonthSpending : null,
        });
      }

      setSpendingTrend(trendData);

      // Calculate monthly comparison data for last 6 months
      const monthlyData = [];
      const comparisonDate = new Date();
      
      for (let i = 5; i >= 0; i--) {
        const monthDate = new Date(comparisonDate.getFullYear(), comparisonDate.getMonth() - i, 1);
        const year = monthDate.getFullYear();
        const month = monthDate.getMonth();
        
        const monthStart = new Date(year, month, 1).toISOString().split('T')[0];
        const monthEnd = new Date(year, month + 1, 0).toISOString().split('T')[0];
        
        // Get transactions for this month
        const monthTransactions = await transactionService.getTransactions(0, 1000, {
          start_date: monthStart,
          end_date: monthEnd,
        });
        
        const monthIncome = monthTransactions
          .filter(t => t.is_income)
          .reduce((sum, t) => sum + t.amount, 0);
          
        const monthExpenses = monthTransactions
          .filter(t => !t.is_income)
          .reduce((sum, t) => sum + Math.abs(t.amount), 0);
        
        monthlyData.push({
          month: monthDate.toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
          netCashFlow: monthIncome - monthExpenses, // Net cash flow (positive = surplus, negative = deficit)
          income: monthIncome,
          expenses: -monthExpenses, // Negative for below-axis display
        });
      }
      
      setMonthlyComparison(monthlyData);
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  // Helper functions
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  const getAccountIcon = (type: string) => {
    switch (type) {
      case 'checking': return <AccountIcon />;
      case 'savings': return <SavingsIcon />;
      case 'investment': return <InvestmentIcon />;
      case 'credit_card': return <CreditIcon />;
      case 'cash': return <WalletIcon />;
      default: return <AccountIcon />;
    }
  };

  const getAccountTotal = (type: string) => {
    return accounts
      .filter(account => account.account_type === type)
      .reduce((sum, account) => sum + account.current_balance, 0);
  };

  const getTotalNetWorth = () => {
    return accounts.reduce((sum, account) => {
      // Credit cards subtract from net worth
      if (account.account_type === 'credit_card') {
        return sum - account.current_balance;
      }
      return sum + account.current_balance;
    }, 0);
  };

  return (
    <Layout>
      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
          <Typography variant="h4" component="h1">
            Financial Dashboard
          </Typography>
          <Box>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => navigate('/transactions')}
              sx={{ mr: 1 }}
            >
              Add Transaction
            </Button>
            <Button
              variant="outlined"
              startIcon={<AccountIcon />}
              onClick={() => navigate('/accounts')}
            >
              Add Account
            </Button>
          </Box>
        </Box>

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
          <Box>
            {/* Stats Overview */}
            <Box sx={{ 
              display: 'grid', 
              gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', lg: 'repeat(4, 1fr)' },
              gap: 3,
              mb: 3
            }}>
              {/* Net Worth Overview */}
              <Card>
                <CardContent>
                  <Typography color="text.secondary" gutterBottom>
                    Total Net Worth
                  </Typography>
                  <Typography variant="h4" component="div" sx={{ color: getTotalNetWorth() >= 0 ? 'success.main' : 'error.main' }}>
                    {formatCurrency(getTotalNetWorth())}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Across {accounts.length} accounts
                  </Typography>
                </CardContent>
              </Card>

              {/* Monthly Income */}
              <Card>
                <CardContent>
                  <Typography color="text.secondary" gutterBottom>
                    This Month's Income
                  </Typography>
                  <Typography variant="h4" component="div" sx={{ color: 'success.main' }}>
                    {formatCurrency(monthlyStats.totalIncome)}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    <IncomeIcon sx={{ fontSize: 16, mr: 0.5 }} />
                    Income this month
                  </Typography>
                </CardContent>
              </Card>

              {/* Monthly Expenses */}
              <Card>
                <CardContent>
                  <Typography color="text.secondary" gutterBottom>
                    This Month's Expenses
                  </Typography>
                  <Typography variant="h4" component="div" sx={{ color: 'error.main' }}>
                    {formatCurrency(monthlyStats.totalExpenses)}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    <ExpenseIcon sx={{ fontSize: 16, mr: 0.5 }} />
                    Expenses this month
                  </Typography>
                </CardContent>
              </Card>

              {/* Net Income */}
              <Card>
                <CardContent>
                  <Typography color="text.secondary" gutterBottom>
                    Monthly Net Income
                  </Typography>
                  <Typography variant="h4" component="div" sx={{ color: monthlyStats.netIncome >= 0 ? 'success.main' : 'error.main' }}>
                    {formatCurrency(monthlyStats.netIncome)}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {monthlyStats.netIncome >= 0 ? 'Surplus' : 'Deficit'} this month
                  </Typography>
                </CardContent>
              </Card>
            </Box>

            {/* Charts Section */}
            <Box sx={{ 
              display: 'grid', 
              gridTemplateColumns: { xs: '1fr', lg: '1fr 1fr' },
              gap: 3,
              mb: 3
            }}>
              {/* Monthly Expenses Pie Chart */}
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Monthly Expenses by Category
                  </Typography>
                  {categoryExpenses.length === 0 ? (
                    <Box sx={{ textAlign: 'center', py: 4 }}>
                      <Typography variant="body2" color="text.secondary">
                        No expense data available for this month
                      </Typography>
                    </Box>
                  ) : (
                    <Box sx={{ height: 400 }}>
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={categoryExpenses}
                            cx="50%"
                            cy="50%"
                            labelLine={false}
                            label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                            outerRadius={120}
                            fill="#8884d8"
                            dataKey="value"
                          >
                            {categoryExpenses.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={entry.color} />
                            ))}
                          </Pie>
                          <Tooltip 
                            formatter={(value) => formatCurrency(value as number)}
                            contentStyle={getTooltipStyle()}
                          />
                          <Legend 
                            wrapperStyle={{
                              paddingTop: '30px',
                              textAlign: 'center',
                            }}
                          />
                        </PieChart>
                      </ResponsiveContainer>
                    </Box>
                  )}
                </CardContent>
              </Card>

              {/* Monthly Spending Trend */}
              <Card>
                <CardContent sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
                  <Typography variant="h6" gutterBottom>
                    Monthly Spending Trend
                  </Typography>
                  {spendingTrend.length === 0 ? (
                    <Box sx={{ textAlign: 'center', py: 4, display: 'flex', alignItems: 'center', justifyContent: 'center', flex: 1 }}>
                      <Typography variant="body2" color="text.secondary">
                        No spending data available
                      </Typography>
                    </Box>
                  ) : (
                    <Box sx={{ height: 400, display: 'flex', alignItems: 'center' }}>
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={spendingTrend} margin={{ top: 20, right: 30, left: 60, bottom: 60 }}>
                          <CartesianGrid strokeDasharray="3 3" stroke={getGridColor()} />
                          <XAxis 
                            dataKey="day" 
                            stroke={getAxisColor()}
                            fontSize={12}
                            tick={{ fontSize: 12 }}
                            ticks={[1, 31]}
                            label={{ 
                              value: 'Day of Month', 
                              position: 'insideBottomLeft', 
                              offset: -5,
                              style: { textAnchor: 'middle' }
                            }}
                          />
                          <YAxis 
                            stroke={getAxisColor()}
                            fontSize={12}
                            tick={{ fontSize: 12 }}
                            tickFormatter={(value) => {
                              if (value >= 1000) {
                                return `$${(value / 1000).toFixed(1)}k`;
                              }
                              return `$${value.toFixed(0)}`;
                            }}
                            label={{ 
                              value: 'Cumulative Spending', 
                              angle: -90, 
                              position: 'insideLeft',
                              style: { textAnchor: 'middle' }
                            }}
                          />
                          <Tooltip 
                            formatter={(value, name) => [
                              formatCurrency(value as number), 
                              name === 'currentMonth' ? 'This Month' : 'Previous Month'
                            ]}
                            labelFormatter={(day) => `Day ${day}`}
                            contentStyle={getTooltipStyle()}
                          />
                          <Line 
                            type="monotone" 
                            dataKey="currentMonth" 
                            stroke="#2563eb" 
                            strokeWidth={5}
                            dot={false}
                            name="This Month"
                            connectNulls={false}
                          />
                          <Line 
                            type="monotone" 
                            dataKey="previousMonth" 
                            stroke="#9333ea" 
                            strokeWidth={4}
                            strokeDasharray="8 4"
                            strokeOpacity={0.6}
                            dot={false}
                            name="Previous Month"
                            connectNulls={false}
                          />
                          <Legend 
                            wrapperStyle={{
                              paddingTop: '30px',
                              fontSize: '16px',
                              textAlign: 'center',
                            }}
                          />
                        </LineChart>
                      </ResponsiveContainer>
                    </Box>
                  )}
                </CardContent>
              </Card>
            </Box>

            {/* Monthly Income vs Expenses */}
            <Box sx={{ mb: 3 }}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Cash Flow - Last 6 Months
                  </Typography>
                  {monthlyComparison.length === 0 ? (
                    <Box sx={{ textAlign: 'center', py: 4 }}>
                      <Typography variant="body2" color="text.secondary">
                        No monthly data available
                      </Typography>
                    </Box>
                  ) : (
                    <Box sx={{ height: 350 }}>
                      <ResponsiveContainer width="100%" height="100%">
                        <ComposedChart
                          data={monthlyComparison}
                          margin={{ top: 20, right: 30, left: 20, bottom: 60 }}
                        >
                          <CartesianGrid strokeDasharray="3 3" stroke={getGridColor()} />
                          <XAxis 
                            dataKey="month" 
                            stroke={getAxisColor()}
                            fontSize={12}
                            tick={{ fontSize: 12 }}
                            angle={-45}
                            textAnchor="end"
                            height={60}
                          />
                          <YAxis 
                            stroke={getAxisColor()}
                            fontSize={12}
                            tick={{ fontSize: 12 }}
                            tickFormatter={(value) => {
                              if (Math.abs(value) >= 1000) {
                                return `$${(Math.abs(value) / 1000).toFixed(1)}k`;
                              }
                              return `$${Math.abs(value).toFixed(0)}`;
                            }}
                          />
                          <Tooltip 
                            formatter={(value, name) => [
                              formatCurrency(Math.abs(value as number)), 
                              name
                            ]}
                            labelFormatter={(month) => month}
                            contentStyle={getTooltipStyle()}
                          />
                          <ReferenceLine y={0} stroke={getAxisColor()} strokeDasharray="2 2" />
                          <Bar 
                            dataKey="income" 
                            fill="#16a34a" 
                            name="Income"
                          />
                          <Bar 
                            dataKey="expenses" 
                            fill="#dc2626" 
                            name="Expenses"
                          />
                        </ComposedChart>
                      </ResponsiveContainer>
                    </Box>
                  )}
                </CardContent>
              </Card>
            </Box>

            {/* Account Summary and Recent Transactions */}
            <Box sx={{ 
              display: 'grid', 
              gridTemplateColumns: { xs: '1fr', md: '2fr 1fr' },
              gap: 3
            }}>
              {/* Account Breakdown */}
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Account Summary
                  </Typography>
                  <Box sx={{ mt: 2 }}>
                    {['checking', 'savings', 'investment', 'credit_card', 'cash'].map((type) => {
                      const total = getAccountTotal(type);
                      const accountsOfType = accounts.filter(a => a.account_type === type);
                      
                      if (accountsOfType.length === 0) return null;

                      return (
                        <Box key={type} sx={{ mb: 2 }}>
                          <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                            <Avatar sx={{ bgcolor: 'primary.main', mr: 2, width: 32, height: 32 }}>
                              {getAccountIcon(type)}
                            </Avatar>
                            <Box sx={{ flexGrow: 1 }}>
                              <Typography variant="body1" sx={{ textTransform: 'capitalize' }}>
                                {accountsOfType.length} {type.replace('_', ' ')} {accountsOfType.length === 1 ? 'Account' : 'Accounts'}
                              </Typography>
                              <Typography variant="h6" sx={{ color: type === 'credit_card' ? 'error.main' : 'inherit' }}>
                                {formatCurrency(total)}
                              </Typography>
                            </Box>
                          </Box>
                        </Box>
                      );
                    })}
                  </Box>
                </CardContent>
              </Card>

              {/* Recent Transactions */}
              <Card>
                <CardContent>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                    <Typography variant="h6">
                      Recent Transactions
                    </Typography>
                    <Button size="small" onClick={() => navigate('/transactions')}>
                      View All
                    </Button>
                  </Box>
                  
                  {recentTransactions.length === 0 ? (
                    <Typography variant="body2" color="text.secondary">
                      No transactions yet
                    </Typography>
                  ) : (
                    <List dense>
                      {recentTransactions.map((transaction) => (
                        <ListItem key={transaction.id} sx={{ px: 0 }}>
                          <ListItemAvatar>
                            <Avatar sx={{ 
                              bgcolor: transaction.is_income ? 'success.main' : 'error.main',
                              width: 32,
                              height: 32
                            }}>
                              {transaction.is_income ? <IncomeIcon /> : <ExpenseIcon />}
                            </Avatar>
                          </ListItemAvatar>
                          <ListItemText
                            primary={transaction.payee}
                            secondary={
                              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                                <Typography variant="caption" color="text.secondary">
                                  {transaction.account?.name} • {transaction.category?.name}
                                </Typography>
                                <Typography variant="caption" color="text.secondary">
                                  {new Date(transaction.transaction_date).toLocaleDateString()}
                                </Typography>
                              </Box>
                            }
                          />
                          <Typography 
                            variant="body2" 
                            sx={{ 
                              color: transaction.is_income ? 'success.main' : 'error.main',
                              fontWeight: 600
                            }}
                          >
                            {transaction.is_income ? '+' : '-'}{formatCurrency(Math.abs(transaction.amount))}
                          </Typography>
                        </ListItem>
                      ))}
                    </List>
                  )}
                </CardContent>
              </Card>
            </Box>
          </Box>
        )}
      </Container>
    </Layout>
  );
}; 
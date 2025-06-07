import React from 'react';
import {
  Container,
  Typography,
  Grid,
  Card,
  CardContent,
  Box,
} from '@mui/material';

export const DashboardPage: React.FC = () => {
  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Typography variant="h4" gutterBottom>
        Dashboard
      </Typography>
      <Typography variant="subtitle1" color="text.secondary" gutterBottom>
        Welcome to your personal budget tracker
      </Typography>

      <Grid container spacing={3} sx={{ mt: 2 }}>
        {/* Summary Cards */}
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="text.secondary" gutterBottom>
                Total Income
              </Typography>
              <Typography variant="h5" component="div">
                $0.00
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="text.secondary" gutterBottom>
                Total Expenses
              </Typography>
              <Typography variant="h5" component="div">
                $0.00
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="text.secondary" gutterBottom>
                Total Savings
              </Typography>
              <Typography variant="h5" component="div">
                $0.00
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="text.secondary" gutterBottom>
                Investments
              </Typography>
              <Typography variant="h5" component="div">
                $0.00
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        {/* Charts Placeholder */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Spending by Category
              </Typography>
              <Box 
                sx={{ 
                  height: 300, 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center',
                  bgcolor: 'grey.100',
                  borderRadius: 1,
                }}
              >
                <Typography color="text.secondary">
                  Chart will be displayed here
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Monthly Trends
              </Typography>
              <Box 
                sx={{ 
                  height: 300, 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center',
                  bgcolor: 'grey.100',
                  borderRadius: 1,
                }}
              >
                <Typography color="text.secondary">
                  Chart will be displayed here
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Recent Transactions */}
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Recent Transactions
              </Typography>
              <Box 
                sx={{ 
                  height: 200, 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center',
                  bgcolor: 'grey.100',
                  borderRadius: 1,
                }}
              >
                <Typography color="text.secondary">
                  Recent transactions will be displayed here
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Container>
  );
}; 
'use client';

import React from 'react';
import { Box, Grid, Typography, Paper, useTheme } from '@mui/material';
import { useRouter } from 'next/navigation';
import KPICard from 'components/dashboard/KPICard';
import { getDashboardData } from 'data/dashboard';
import DemandForecastChart from '../components/DemandForecastChart';
import PotentialLossChart from '../components/PotentialLossChart';
import SalesVisualization from '../components/SalesVisualization';
import RegionOOSTable from '../components/RegionOOSTable';
import ForecastOOSTable from '../components/ForecastOOSTable';
import TopRevenueOOSTable from '../components/TopRevenueOOSTable';
import NewsSection from '../components/NewsSection';

// ==============================|| DASHBOARD PAGE ||============================== //

export default function DashboardView() {
  const router = useRouter();
  const dashboardData = getDashboardData(router);
  const theme = useTheme();

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h3" sx={{ mb: 4 }}>
        Dashboard Overview
      </Typography>
      <Grid container spacing={3}>
        <Grid item xs={12} sm={6} md={3}>
          <KPICard {...dashboardData.forecastedSales} />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <KPICard {...dashboardData.outOfStock} />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <KPICard {...dashboardData.overstocked} />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <KPICard {...dashboardData.salesLoss} />
        </Grid>
        <Grid item xs={12}>
          <Paper 
            elevation={3} 
            sx={{ 
              p: 3,
              background: theme.palette.background.paper,
              borderRadius: 2
            }}
          >
            <DemandForecastChart />
          </Paper>
        </Grid>
        <Grid item xs={12}>
          <Paper 
            elevation={3} 
            sx={{ 
              p: 3,
              background: theme.palette.background.paper,
              borderRadius: 2
            }}
          >
            <PotentialLossChart />
          </Paper>
        </Grid>
        <Grid item xs={12} md={6}>
          <SalesVisualization />
        </Grid>
        <Grid item xs={12} md={6}>
          <RegionOOSTable />
        </Grid>
        <Grid item xs={12} lg={6}>
          <Box sx={{ height: '100%' }}>
            <ForecastOOSTable />
          </Box>
        </Grid>
        <Grid item xs={12} lg={6}>
          <Box sx={{ height: '100%' }}>
            <TopRevenueOOSTable />
          </Box>
        </Grid>
        <Grid item xs={12}>
          <NewsSection />
        </Grid>
      </Grid>
    </Box>
  );
} 
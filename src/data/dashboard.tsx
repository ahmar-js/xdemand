import React from 'react';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import WarningIcon from '@mui/icons-material/Warning';
import InventoryIcon from '@mui/icons-material/Inventory';
import TrendingDownIcon from '@mui/icons-material/TrendingDown';
import { DashboardData } from '../types/dashboard';

// Generate dates for the last 30 days
const generateDates = (days: number) => {
  const dates = [];
  for (let i = days - 1; i >= 0; i--) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    dates.push(date.toISOString().split('T')[0]);
  }
  return dates;
};

// Generate monthly dates for the last 6 months
const generateMonthlyDates = (months: number) => {
  const dates = [];
  for (let i = months - 1; i >= 0; i--) {
    const date = new Date();
    date.setMonth(date.getMonth() - i);
    dates.push(date.toISOString().split('T')[0]);
  }
  return dates;
};

// Sample data - Replace with real data from your API
const dates = generateDates(30);
const monthlyDates = generateMonthlyDates(6);

const forecastedSalesData = dates.map((date, index) => ({
  date,
  sales: Math.floor(12000 + Math.random() * 5000 + Math.sin(index / 5) * 2000)
}));

const outOfStockData = monthlyDates.map((date, index) => ({
  date,
  count: Math.floor(10 + Math.random() * 8 + Math.sin(index / 2) * 3)
}));

const overstockedData = monthlyDates.map((date, index) => ({
  date,
  count: Math.floor(5 + Math.random() * 6 + Math.sin(index / 2) * 2)
}));

const salesLossData = dates.map((date, index) => ({
  date,
  loss: Math.floor(3000 + Math.random() * 2000 + Math.sin(index / 5) * 1000)
}));

export const getDashboardData = (router: any): DashboardData => ({
  forecastedSales: {
    title: "Forecasted Sales",
    value: `$${forecastedSalesData[forecastedSalesData.length - 1].sales.toLocaleString()}`,
    icon: <TrendingUpIcon />,
    color: "#2196f3",
    data: forecastedSalesData,
    onClick: () => router.push('/demand-forcasting'),
    dataKey: 'sales'
  },
  outOfStock: {
    title: "Out of Stock Items",
    value: `${outOfStockData[outOfStockData.length - 1].count} SKUs`,
    icon: <WarningIcon />,
    color: "#f44336",
    data: outOfStockData,
    onClick: () => router.push('/oos-stock'),
    dataKey: 'count',
    xAxisKey: 'date'
  },
  overstocked: {
    title: "Overstocked Items",
    value: `${overstockedData[overstockedData.length - 1].count} SKUs`,
    icon: <InventoryIcon />,
    color: "#ff9800",
    data: overstockedData,
    onClick: () => router.push('/overstock'),
    dataKey: 'count',
    xAxisKey: 'date'
  },
  salesLoss: {
    title: "Expected Sales Loss",
    value: `$${salesLossData[salesLossData.length - 1].loss.toLocaleString()}`,
    icon: <TrendingDownIcon />,
    color: "#e91e63",
    data: salesLossData,
    onClick: () => router.push('/sales-loss'),
    dataKey: 'loss'
  }
}); 
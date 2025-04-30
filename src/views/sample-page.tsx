'use client';
import { Box, Grid, MenuItem, Select, Typography } from '@mui/material';
// material-ui

// project imports
import MainCard from 'components/MainCard';
import { useState, useMemo } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import PotentialLossGraph from './potentialLossGraph';
import SalesDataVisualization from './salesDataVisualizationGraph';
import OOSStockTable from './oosStockTable';

// ==============================|| SAMPLE PAGE ||============================== //

const generateData = (type: "daily" | "weekly" | "monthly") => {
  const data = [];
  const startDate = new Date();

  for (let i = 0; i < 180; i++) {
    const date = new Date(startDate);
    if (type === "daily") {
      date.setDate(startDate.getDate() + i);
    } else if (type === "weekly") {
      date.setDate(startDate.getDate() + i * 7);
    } else {
      date.setMonth(startDate.getMonth() + i);
    }

    data.push({
      date: date.toISOString().split("T")[0], // Format as YYYY-MM-DD
      demand: Math.floor(Math.random() * 10000) + 200, // Random demand between 200-1200
    });
  }

  return data;
};

const data = [
  { date: 'Mar 1', inventory: 100, sales: 30 },
  { date: 'Mar 2', inventory: 90, sales: 20 },
  { date: 'Mar 3', inventory: 70, sales: 40 },
  { date: 'Mar 4', inventory: 50, sales: 50 },
  { date: 'Mar 5', inventory: 40, sales: 30 },
  { date: 'Mar 6', inventory: 30, sales: 20 },
  { date: 'Mar 7', inventory: 20, sales: 10 }
];

export default function SamplePage() {
  const [view, setView] = useState<"daily" | "weekly" | "monthly">("daily");

  const forecastData = useMemo(() => generateData(view), [view]);

  return (
    <>
      <Grid container spacing={3}>
        {/* KPIs */}
        <Grid item xs={12} sm={3}>
          <MainCard title="KPI 1"></MainCard>
        </Grid>
        <Grid item xs={12} sm={3}>
          <MainCard title="KPI 2"></MainCard>
        </Grid>
        <Grid item xs={12} sm={3}>
          <MainCard title="KPI 3"></MainCard>
        </Grid>
        <Grid item xs={12} sm={3}>
          <MainCard title="KPI 4"></MainCard>
        </Grid>
      </Grid>
      <Grid container spacing={3} paddingTop={10}>
        <Grid item xs={12} sm={6}>
          <MainCard title="Demand Forecast Graphs (Quantity Wise)">
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
              <Typography variant="h6">Predictions for the next 180 days</Typography>
              <Select value={view} onChange={(e) => setView(e.target.value as 'daily' | 'weekly' | 'monthly')}>
                <MenuItem value="daily">Daily</MenuItem>
                <MenuItem value="weekly">Weekly</MenuItem>
                <MenuItem value="monthly">Monthly</MenuItem>
              </Select>
            </Box>

            <ResponsiveContainer width="100%" height={400}>
              <LineChart data={forecastData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" tickFormatter={(tick) => tick.substring(5)} />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="demand" stroke="#000000" strokeWidth={1} dot={{ fill: "#000000", r: 1.5 }} />
              </LineChart>
            </ResponsiveContainer>
          </MainCard>
        </Grid>

        {/* Second Card */}
        <Grid item xs={12} sm={6}>
          <PotentialLossGraph/>
        </Grid>
      </Grid>
      <Grid container spacing={3} paddingTop={10}>
        <Grid item xs={12} sm={6}>
          <SalesDataVisualization/>
        </Grid>

        {/* Second Card */}
        <Grid item xs={12} sm={6}>
          <OOSStockTable/>
        </Grid>
      </Grid>

      <Grid container spacing={3} paddingTop={10}>
        <Grid item xs={12} sm={6}>
          <MainCard
            title="
SKU's OOS data in a table regarding according to the forecast "
          >
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={data}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="inventory" stroke="#8884d8" />
              </LineChart>
            </ResponsiveContainer>
          </MainCard>
        </Grid>

        {/* Second Card */}
        <Grid item xs={12} sm={6}>
          <MainCard title=" Display Top 20 or 50 Out of Stock SKU’s by Sales/Revenue.">
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={data}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="sales" stroke="#82ca9d" />
              </LineChart>
            </ResponsiveContainer>
          </MainCard>
        </Grid>
      </Grid>

      <Grid container spacing={3} paddingTop={10}>
        <Grid item xs={12} sm={12}>
          <MainCard xs={12} title="News"></MainCard>
        </Grid>
      </Grid>
    </>
  );
}

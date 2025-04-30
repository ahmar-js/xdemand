'use client';

import { Box, Paper, Typography, IconButton } from '@mui/material';
import { ReactNode } from 'react';
import { ChartData } from '../../types/dashboard';
import { LineChart, Line, ResponsiveContainer, Tooltip } from 'recharts';

interface KPICardProps {
  title: string;
  value: string;
  icon: ReactNode;
  color: string;
  data: ChartData[];
  onClick?: () => void;
  dataKey?: string;
  xAxisKey?: string;
}

// ==============================|| KPI CARD ||============================== //

export default function KPICard({ 
  title, 
  value, 
  icon, 
  color, 
  data, 
  onClick,
  dataKey,
  xAxisKey = 'date'
}: KPICardProps) {
  // Get the first data key that isn't the xAxisKey
  const defaultDataKey = dataKey || Object.keys(data[0] || {}).find(key => key !== xAxisKey);
  
  // Calculate trend with safety checks
  let trend = 0;
  if (defaultDataKey && data.length >= 2) {
    const lastItem = data[data.length - 1];
    const previousItem = data[data.length - 2];
    
    if (lastItem && previousItem && 
        typeof lastItem[defaultDataKey] === 'number' && 
        typeof previousItem[defaultDataKey] === 'number' && 
        previousItem[defaultDataKey] !== 0) {
      trend = ((lastItem[defaultDataKey] - previousItem[defaultDataKey]) / previousItem[defaultDataKey]) * 100;
    }
  }

  const formatValue = (value: number) => {
    if (title.includes('Sales') || title.includes('Loss')) {
      return `$${value.toLocaleString()}`;
    }
    return value.toLocaleString();
  };

  return (
    <Paper
      sx={{
        p: 2,
        display: 'flex',
        flexDirection: 'column',
        height: 240,
        cursor: onClick ? 'pointer' : 'default',
        '&:hover': {
          boxShadow: 6,
        },
      }}
      onClick={onClick}
    >
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h6" color="textSecondary">
          {title}
        </Typography>
        <Box>
          <IconButton sx={{ color: color }}>
            {icon}
          </IconButton>
        </Box>
      </Box>
      <Typography variant="h4" sx={{ mb: 2 }}>
        {value}
      </Typography>
      <Box sx={{ flexGrow: 1, height: 60, mt: 1 }}>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart 
            data={data} 
            margin={{ top: 5, right: 5, bottom: 5, left: 5 }}
          >
            <Line 
              type="monotone" 
              dataKey={defaultDataKey} 
              stroke={color}
              strokeWidth={2}
              dot={{
                r: 3,
                strokeWidth: 2,
                stroke: color,
                fill: '#fff',
                strokeOpacity: 0.8,
                fillOpacity: 0.8,
              }}
            />
            <Tooltip
              position={{ y: 60 }}
              contentStyle={{
                backgroundColor: 'rgba(255, 255, 255, 0.9)',
                border: 'none',
                borderRadius: '4px',
                boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                padding: '8px 12px',
                transform: 'translateY(10px)',
              }}
              formatter={(value: number) => [formatValue(value), title]}
              labelFormatter={(label) => {
                const date = new Date(label);
                return date.toLocaleDateString('en-US', { 
                  month: 'short', 
                  day: 'numeric',
                  year: 'numeric'
                });
              }}
            />
          </LineChart>
        </ResponsiveContainer>
      </Box>
      <Typography 
        variant="caption" 
        sx={{ 
          mt: 1,
          color: trend >= 0 ? 'success.main' : 'error.main',
          fontWeight: 'bold'
        }}
      >
        {trend >= 0 ? '+' : ''}{trend.toFixed(1)}%
      </Typography>
    </Paper>
  );
} 
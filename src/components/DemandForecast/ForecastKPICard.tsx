import React from 'react';
import { Box, Paper, Typography, Grid, Tooltip as MuiTooltip, Divider, CircularProgress, Card, CardHeader, CardContent } from '@mui/material';
import { TrendingUp, TrendingDown, AccessTime, DateRange, Event, CalendarViewMonth, CalendarToday, Info } from '@mui/icons-material';
import { ChartDataPoint } from '../../services/demandForecastService';
import { KPIDataResponse } from '../../hooks/useKPIData';

interface ForecastKPIProps {
  data: ChartDataPoint[];
  metric: 'quantity' | 'revenue';
  apiData?: KPIDataResponse | null;
  isLoadingApiData?: boolean;
  selectedDataPoint?: ChartDataPoint | null;
}

const calculateAverages = (data: ChartDataPoint[], metric: 'quantity' | 'revenue') => {
  if (!data || data.length === 0) return { daily: 0, weekly: 0, monthly: 0, quarterly: 0, yearly: 0 };

  // Sort data by date
  const sortedData = [...data].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  
  // Get the actual values based on the metric
  const dataPoints = sortedData.map(item => {
    const date = new Date(item.date);
    return {
      date,
      value: metric === 'quantity' ? item.demand || 0 : item.revenue || 0
    };
  }).filter(item => item.value !== null && Number(item.value) > 0);

  if (dataPoints.length === 0) return { daily: 0, weekly: 0, monthly: 0, quarterly: 0, yearly: 0 };

  // Calculate daily average (from all data points)
  const dailyAverage = dataPoints.reduce((sum, item) => sum + Number(item.value), 0) / dataPoints.length;

  // Group data by week
  const weekMap = new Map();
  dataPoints.forEach(item => {
    const date = item.date;
    const weekStart = new Date(date);
    weekStart.setDate(date.getDate() - date.getDay()); // Set to start of week (Sunday)
    const weekKey = weekStart.toISOString().split('T')[0];
    
    if (!weekMap.has(weekKey)) {
      weekMap.set(weekKey, []);
    }
    weekMap.get(weekKey).push(item.value);
  });
  
  // Calculate weekly average
  const weeklyAverages = Array.from(weekMap.values()).map(values => 
    values.reduce((sum: number, v: number) => sum + Number(v), 0) / values.length
  );
  const weeklyAverage = weeklyAverages.length > 0 
    ? weeklyAverages.reduce((sum: number, avg: number) => sum + avg, 0) / weeklyAverages.length 
    : 0;

  // Group data by month
  const monthMap = new Map();
  dataPoints.forEach(item => {
    const date = item.date;
    const monthKey = `${date.getFullYear()}-${date.getMonth() + 1}`;
    
    if (!monthMap.has(monthKey)) {
      monthMap.set(monthKey, []);
    }
    monthMap.get(monthKey).push(item.value);
  });
  
  // Calculate monthly average
  const monthlyAverages = Array.from(monthMap.values()).map(values => 
    values.reduce((sum: number, v: number) => sum + Number(v), 0) / values.length
  );
  const monthlyAverage = monthlyAverages.length > 0 
    ? monthlyAverages.reduce((sum: number, avg: number) => sum + avg, 0) / monthlyAverages.length 
    : 0;

  // Group data by quarter
  const quarterMap = new Map();
  dataPoints.forEach(item => {
    const date = item.date;
    const quarter = Math.floor(date.getMonth() / 3) + 1;
    const quarterKey = `${date.getFullYear()}-Q${quarter}`;
    
    if (!quarterMap.has(quarterKey)) {
      quarterMap.set(quarterKey, []);
    }
    quarterMap.get(quarterKey).push(item.value);
  });
  
  // Calculate quarterly average
  const quarterlyAverages = Array.from(quarterMap.values()).map(values => 
    values.reduce((sum: number, v: number) => sum + Number(v), 0) / values.length
  );
  const quarterlyAverage = quarterlyAverages.length > 0 
    ? quarterlyAverages.reduce((sum: number, avg: number) => sum + avg, 0) / quarterlyAverages.length 
    : 0;

  // Group data by year
  const yearMap = new Map();
  dataPoints.forEach(item => {
    const date = item.date;
    const yearKey = `${date.getFullYear()}`;
    
    if (!yearMap.has(yearKey)) {
      yearMap.set(yearKey, []);
    }
    yearMap.get(yearKey).push(item.value);
  });
  
  // Calculate yearly average
  const yearlyAverages = Array.from(yearMap.values()).map(values => 
    values.reduce((sum: number, v: number) => sum + Number(v), 0) / values.length
  );
  const yearlyAverage = yearlyAverages.length > 0 
    ? yearlyAverages.reduce((sum: number, avg: number) => sum + avg, 0) / yearlyAverages.length 
    : 0;

  return {
    daily: dailyAverage,
    weekly: weeklyAverage,
    monthly: monthlyAverage,
    quarterly: quarterlyAverage,
    yearly: yearlyAverage
  };
};

// Calculate trend percentage based on current value vs average
const calculateTrend = (currentValue: number, averageValue: number) => {
  if (averageValue === 0) return 0;
  return ((currentValue - averageValue) / averageValue) * 100;
};

const ForecastKPICard: React.FC<ForecastKPIProps> = ({ 
  data, 
  metric, 
  apiData, 
  isLoadingApiData = false,
  selectedDataPoint = null 
}) => {
  // Get averages either from API or calculate locally
  const averages = React.useMemo(() => {
    // If we have API data, use it
    if (apiData) {
      return {
        daily: Math.abs(apiData.daily.kpi_pct),
        weekly: Math.abs(apiData.weekly.kpi_pct),
        monthly: Math.abs(apiData.monthly.kpi_pct),
        quarterly: Math.abs(apiData.quarterly.kpi_pct),
        yearly: 0 // API doesn't provide yearly data
      };
    }
    
    // Otherwise use local calculation as fallback
    return calculateAverages(data, metric);
  }, [data, metric, apiData]);
  
  // Get trends from API or calculate locally
  const trends = React.useMemo(() => {
    if (apiData) {
      return {
        daily: apiData.daily && typeof apiData.daily.kpi_pct === 'number' ? apiData.daily.kpi_pct : 0,
        weekly: apiData.weekly && typeof apiData.weekly.kpi_pct === 'number' ? apiData.weekly.kpi_pct : 0,
        monthly: apiData.monthly && typeof apiData.monthly.kpi_pct === 'number' ? apiData.monthly.kpi_pct : 0,
        quarterly: apiData.quarterly && typeof apiData.quarterly.kpi_pct === 'number' ? apiData.quarterly.kpi_pct : 0,
        yearly: 0 // API doesn't provide yearly data
      };
    }
    
    // Get the most recent data point value
    let latestValue = 0;
    if (selectedDataPoint) {
      latestValue = Number(metric === 'quantity' 
        ? selectedDataPoint.demand || 0 
        : selectedDataPoint.revenue || 0);
    } else if (data && data.length > 0) {
      const sortedData = [...data].sort((a, b) => 
        new Date(b.date).getTime() - new Date(a.date).getTime()
      );
      
      latestValue = Number(metric === 'quantity' 
        ? sortedData[0].demand || 0 
        : sortedData[0].revenue || 0);
    }
    
    return {
      daily: calculateTrend(latestValue, averages.daily),
      weekly: calculateTrend(latestValue, averages.weekly), 
      monthly: calculateTrend(latestValue, averages.monthly), 
      quarterly: calculateTrend(latestValue, averages.quarterly), 
      yearly: calculateTrend(latestValue, averages.yearly)
    };
  }, [data, metric, averages, apiData, selectedDataPoint]);
  
  // Format value based on metric
  const formatValue = (value: number) => {
    if (metric === 'revenue') {
      return `$${value.toLocaleString(undefined, { 
        minimumFractionDigits: 2, 
        maximumFractionDigits: 2 
      })}`;
    }
    return value.toLocaleString(undefined, { 
      minimumFractionDigits: 0, 
      maximumFractionDigits: 2 
    });
  };

  // Format percentage with % symbol
  const formatPercentage = (value: number) => {
    return `${value.toFixed(1)}%`;
  };
  
  // Define KPI cards data
  const kpiCards = [
    {
      title: 'Daily Average',
      value: apiData && apiData.daily && typeof apiData.daily.kpi_pct === 'number' 
        ? formatPercentage(apiData.daily.kpi_pct) 
        : '0.0%',
      icon: <CalendarToday />,
      color: '#1677ff',
      trend: trends.daily,
      tooltip: 'Current value compared to daily average'
    },
    {
      title: 'Weekly Average',
      value: apiData && apiData.weekly && typeof apiData.weekly.kpi_pct === 'number'
        ? formatPercentage(apiData.weekly.kpi_pct) 
        : '0.0%', 
      icon: <Event />,
      color: '#52c41a',
      trend: trends.weekly,
      tooltip: 'Current value compared to weekly average'
    },
    {
      title: 'Monthly Average',
      value: apiData && apiData.monthly && typeof apiData.monthly.kpi_pct === 'number'
        ? formatPercentage(apiData.monthly.kpi_pct) 
        : '0.0%', 
      icon: <CalendarViewMonth />,
      color: '#fa8c16',
      trend: trends.monthly,
      tooltip: 'Current value compared to monthly average'
    },
    {
      title: 'Quarterly Average',
      value: apiData && apiData.quarterly && typeof apiData.quarterly.kpi_pct === 'number'
        ? formatPercentage(apiData.quarterly.kpi_pct) 
        : '0.0%', 
      icon: <DateRange />,
      color: '#722ed1',
      trend: trends.quarterly,
      tooltip: 'Current value compared to quarterly average'
    }
  ];
  
  // Generate insights based on trends
  const generateInsights = () => {
    const insights = [];
    
    // If no data yet, return a default message
    if (!apiData && (!selectedDataPoint || !data || data.length === 0)) {
      return ['Select a data point on the chart to view specific performance insights.'];
    }
    
    if (apiData) {
      // Verify we have valid data before generating insights
      const hasValidData = apiData.daily && 
                           apiData.weekly && 
                           apiData.monthly && 
                           apiData.quarterly && 
                           typeof apiData.daily.kpi_pct === 'number' && 
                           typeof apiData.weekly.kpi_pct === 'number' && 
                           typeof apiData.monthly.kpi_pct === 'number' && 
                           typeof apiData.quarterly.kpi_pct === 'number';
                           
      if (!hasValidData) {
        return ['Insufficient data to generate insights. Try selecting a different data point.'];
      }
      
      // Insights for API data
      if (apiData.daily.kpi_pct < -15) {
        insights.push(`Current ${metric} is ${Math.abs(apiData.daily.kpi_pct).toFixed(1)}% below the daily average.`);
      } else if (apiData.daily.kpi_pct > 15) {
        insights.push(`Current ${metric} is ${apiData.daily.kpi_pct.toFixed(1)}% above the daily average.`);
      }
      
      // Compare weekly vs monthly
      const weeklyVsMonthly = apiData.weekly.kpi_pct - apiData.monthly.kpi_pct;
      if (Math.abs(weeklyVsMonthly) > 10) {
        const direction = weeklyVsMonthly > 0 ? 'better' : 'worse';
        insights.push(`Weekly performance is ${direction} than monthly by ${Math.abs(weeklyVsMonthly).toFixed(1)}%.`);
      }
      
      // Compare with quarterly 
      if (apiData.quarterly.kpi_pct < -10 && apiData.monthly.kpi_pct < -10) {
        insights.push(`Performance is below both quarterly and monthly averages, indicating a potential downward trend.`);
      } else if (apiData.quarterly.kpi_pct > 10 && apiData.monthly.kpi_pct > 10) {
        insights.push(`Performance is above both quarterly and monthly averages, suggesting strong momentum.`);
      }
      
    } else {
      // Original insights logic for calculated data
      const latestValue = selectedDataPoint 
        ? (metric === 'quantity' ? selectedDataPoint.demand || 0 : selectedDataPoint.revenue || 0)
        : 0;
        
      // Check if current value is higher than all averages
      if (latestValue > averages.daily && 
          latestValue > averages.weekly && 
          latestValue > averages.monthly &&
          latestValue > averages.quarterly) {
        insights.push(`Current ${metric} is performing above historical averages across all time periods, indicating strong growth.`);
      }
      
      // Compare against quarterly average (seasonal pattern)
      if (latestValue < averages.quarterly && latestValue < averages.monthly) {
        insights.push(`Current ${metric} is below both quarterly and monthly averages, which may indicate a seasonal dip or downward trend.`);
      } else if (latestValue > averages.quarterly) {
        insights.push(`Current ${metric} is outperforming quarterly averages, suggesting positive momentum.`);
      }
      
      // Compare weekly vs monthly for short-term changes
      const weeklyVsMonthly = ((averages.weekly - averages.monthly) / averages.monthly) * 100;
      if (weeklyVsMonthly > 10) {
        insights.push(`Weekly averages are exceeding monthly averages by ${weeklyVsMonthly.toFixed(1)}%, indicating recent improvement.`);
      } else if (weeklyVsMonthly < -10) {
        insights.push(`Weekly averages are ${Math.abs(weeklyVsMonthly).toFixed(1)}% below monthly averages, possibly showing a recent decline.`);
      }
    }
    
    // If no significant insights, add a generic one
    if (insights.length === 0) {
      insights.push(`Current ${metric} performance is within normal historical ranges based on available data.`);
    }
    
    return insights;
  };
  
  const insights = generateInsights();

  // Updated getTitle to format the date and provide a clearer fallback
  const getTitle = () => {
    if (selectedDataPoint) {
      const date = new Date(selectedDataPoint.date).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      });
      return `Demand Performance Insights for ${date}`;
    }
    // Fallback title if no specific point is selected
    return `Overall ${metric === 'quantity' ? 'Demand' : 'Revenue'} Performance Trends`;
  };

  const title = getTitle();

  return (
    // Replaced outer Box with Card
    <Card sx={{ mt: 4, mb: 2 }}>
      <CardHeader
        title={title}
        titleTypographyProps={{ variant: 'h6', fontWeight: 'bold' }}
        action={
          isLoadingApiData ? <CircularProgress size={24} sx={{ mr: 1 }} /> : null // Added margin to spinner
        }
        sx={{ borderBottom: '1px solid', borderColor: 'divider', pb: 1 }} // Added bottom border
      />
      <CardContent>
        {/* KPI Cards Grid - removed outer Typography title */}
        <Grid container spacing={2} sx={{ mb: 3 }}> {/* Added margin bottom */}
          {kpiCards.map((card, index) => (
            <Grid item xs={12} sm={6} md={3} key={index}>
              <MuiTooltip title={card.tooltip} arrow>
                {/* Replaced Paper with Box, added border and hover */}
                <Box
                  sx={{
                    p: 2,
                    display: 'flex',
                    flexDirection: 'column',
                    height: 140, // Keep height
                    border: '1px solid',
                    borderColor: 'divider',
                    borderRadius: 1,
                    transition: 'border-color 0.2s, box-shadow 0.2s', // Added transition
                    position: 'relative',
                     '&:hover': {
                       borderColor: 'primary.main',
                       boxShadow: 1,
                     },
                  }}
                >
                  {isLoadingApiData && (
                    <Box 
                      sx={{ 
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        backgroundColor: 'rgba(255, 255, 255, 0.7)',
                        borderRadius: 1, // Match border radius
                      }}
                    >
                      <CircularProgress size={24} />
                    </Box>
                  )}
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                    <Typography variant="subtitle2" color="textSecondary" noWrap>
                      {card.title}
                    </Typography>
                    <Box sx={{ 
                      color: card.color,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      width: 32,
                      height: 32,
                      borderRadius: '50%',
                      backgroundColor: `${card.color}20`, // Using alpha for background
                    }}>
                      {React.cloneElement(card.icon, { fontSize: 'small' })} {/* Ensure icon size consistency */}
                    </Box>
                  </Box>
                  <Typography variant="h5" sx={{ mb: 1 }}>
                    {card.value}
                  </Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', mt: 'auto' }}> {/* Push trend to bottom */}
                    {card.trend >= 0 ? 
                      <TrendingUp color="success" fontSize="small" /> : 
                      <TrendingDown color="error" fontSize="small" />
                    }
                    <Typography 
                      variant="body2" 
                      sx={{ 
                        ml: 0.5,
                        color: card.trend >= 0 ? 'success.main' : 'error.main',
                        fontWeight: 'medium' 
                      }}
                    >
                      {card.trend.toFixed(1)}%
                    </Typography>
                  </Box>
                </Box>
              </MuiTooltip>
            </Grid>
          ))}
        </Grid>
        
        {/* Storytelling Insights - removed outer Paper */}
        <Box sx={{ mt: 2 }}> {/* Used Box */}
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
            <Info sx={{ mr: 1, color: 'primary.main' }} />
            <Typography variant="subtitle1" sx={{ fontWeight: 'medium' }}>Key Insights</Typography> {/* Made title slightly bolder */}
          </Box>
          <Divider sx={{ mb: 2 }} />
          {/* Display loading/no data message directly if insights array is empty */}
          {insights.length === 0 && !isLoadingApiData ? (
             <Typography variant="body2" color="textSecondary" sx={{ pl: 2 }}>
                {generateInsights()[0]} {/* Show the default message */}
             </Typography>
          ) : (
            <Grid container spacing={1}> {/* Reduced spacing */}
              {insights.map((insight, index) => (
                <Grid item xs={12} md={6} key={index}>
                  <Box sx={{ display: 'flex', alignItems: 'flex-start', mb: 1 }}>
                    <Typography 
                      variant="body2" 
                      color="textSecondary" 
                      sx={{ 
                        '&::before': {
                          content: '"•"',
                          color: 'primary.main',
                          display: 'inline-block',
                          width: '1em',
                          marginLeft: '-1em',
                          fontWeight: 'bold'
                        },
                        pl: 2
                      }}
                    >
                      {insight}
                    </Typography>
                  </Box>
                </Grid>
              ))}
            </Grid>
          )}
        </Box>
      </CardContent>
    </Card>
  );
};

export default ForecastKPICard; 
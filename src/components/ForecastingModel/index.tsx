import React, { useMemo, useRef } from 'react';
import { Card, CardHeader, CardContent, Typography, Box, useTheme, Skeleton, Chip, Popover, List, ListItem, ListItemText, IconButton, Tooltip as MuiTooltip } from '@mui/material';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, Legend } from 'recharts';
import { ChartDataPoint } from '../../services/demandForecastService';
import FilterAltIcon from '@mui/icons-material/FilterAlt';
import DownloadButton from './DownloadButton';
import InfoIcon from '@mui/icons-material/InfoOutlined';

// Import the filter category type
type FilterCategory = 'Linn_Category' | 'Linn_Title' | 'Channel' | 'im_sku' | 'warehouse_code' | 'Company' | 'Region';

// Display names for filter categories
const displayNames: Record<FilterCategory, string> = {
  'Linn_Category': 'Category',
  'Linn_Title': 'Title',
  'Channel': 'Channel',
  'im_sku': 'SKU',
  'warehouse_code': 'Warehouse',
  'Company': 'Company',
  'Region': 'Region'
};

interface ForecastingModelProps {
  data: ChartDataPoint[];
  interval?: 'daily' | 'weekly' | 'monthly';
  metric?: 'quantity' | 'revenue';
  isLoading?: boolean;
  selectedSkus?: string[]; // For backward compatibility
  appliedFilters?: Record<FilterCategory, string[]>; // All applied filters
}

const ForecastingModel: React.FC<ForecastingModelProps> = ({
  data = [],
  interval = 'daily',
  metric = 'quantity',
  isLoading = false,
  selectedSkus = [],
  appliedFilters = {}
}) => {
  const theme = useTheme();
  
  // Create refs for charts for the download functionality
  const trendChartRef = useRef<HTMLDivElement>(null);
  const seasonalityChartRef = useRef<HTMLDivElement>(null);
  
  // Track which series are visible
  const [visibleSeries, setVisibleSeries] = React.useState({
    periodSeasonality: true, // daily/weekly/monthly seasonality
    yearlySeasonality: true  // yearly seasonality
  });

  // State for SKU details Popover
  const [skuPopoverAnchorEl, setSkuPopoverAnchorEl] = React.useState<null | HTMLElement>(null);

  const handleOpenSkuPopover = (event: React.MouseEvent<HTMLElement>) => {
    setSkuPopoverAnchorEl(event.currentTarget);
  };

  const handleCloseSkuPopover = () => {
    setSkuPopoverAnchorEl(null);
  };

  const isSkuPopoverOpen = Boolean(skuPopoverAnchorEl);
  const skuPopoverId = isSkuPopoverOpen ? 'forecasting-model-sku-popover' : undefined;

  // Handle toggling series visibility when legend is clicked
  const handleLegendClick = (dataKey: string) => {
    setVisibleSeries(prev => {
      // Map data keys to state properties
      const stateKey = dataKey.includes('Yearly') ? 'yearlySeasonality' : 'periodSeasonality';
      
      return {
        ...prev,
        [stateKey]: !prev[stateKey]
      };
    });
  };

  // Format date for x-axis
  const formatXAxis = (date: string) => {
    const d = new Date(date);
    // Always display month and year for all aggregation levels
    return d.toLocaleDateString('en-US', { 
      month: 'short', 
      year: 'numeric'
    });
  };

  // Helper function to aggregate data based on interval
  const aggregateData = (data: any[], intervalType: 'daily' | 'weekly' | 'monthly', keys: string[]) => {
    if (!data || data.length === 0) return [];
    
    // For daily aggregation, just return the sorted data
    if (intervalType === 'daily') {
      return [...data].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    }
    
    // For weekly or monthly aggregation
    const aggregatedMap = new Map();
    
    data.forEach(item => {
      const date = new Date(item.date);
      let key;
      
      if (intervalType === 'weekly') {
        // Get the first day of the week (Sunday)
        const dayOfWeek = date.getDay(); // 0 is Sunday
        const diff = date.getDate() - dayOfWeek;
        const firstDayOfWeek = new Date(date);
        firstDayOfWeek.setDate(diff);
        key = firstDayOfWeek.toISOString().split('T')[0];
      } else if (intervalType === 'monthly') {
        // Get the first day of the month
        key = `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}-01`;
      }
      
      if (!aggregatedMap.has(key)) {
        aggregatedMap.set(key, {
          date: key,
          count: 0,
          // Initialize all keys with 0
          ...keys.reduce((acc, k) => ({ ...acc, [k]: 0 }), {})
        });
      }
      
      const entry = aggregatedMap.get(key);
      entry.count += 1;
      
      // Sum up the values for each key
      keys.forEach(k => {
        if (item[k] !== null && item[k] !== undefined) {
          entry[k] += Number(item[k]);
        }
      });
    });
    
    // Calculate averages
    const result = Array.from(aggregatedMap.values()).map(entry => {
      const averages = { date: entry.date };
      keys.forEach(k => {
        (averages as Record<string, number>)[k] = entry[k] / entry.count;
      });
      
      return averages;
    });
    
    return result.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  };

  // Process data for the charts
  const { trendData, seasonalityData } = useMemo(() => {
    if (!data || data.length === 0) {
      return { trendData: [], seasonalityData: [] };
    }

    const attrPrefix = metric === 'quantity' ? 'for_qty' : 'for_rev';
    
    // Sort data by date for proper display
    const sortedData = [...data].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    
    // Prepare raw data for aggregation
    const rawTrendData = sortedData.map(item => ({
      date: item.date,
      trend: item[`${attrPrefix}_trend`] || 0
    }));
    
    // Prepare raw seasonality data
    const rawSeasonalityData = sortedData.map(item => {
      return {
        date: item.date,
        weekly: item[`${attrPrefix}_weekly`] || 0,
        yearly: item[`${attrPrefix}_yearly`] || 0
      };
    });
    
    // Aggregate trend data based on selected interval
    const trendData = aggregateData(rawTrendData, interval, ['trend']);
    
    // Aggregate seasonality data
    // For the weekly seasonality, we aggregate based on the selected interval
    const aggregatedSeasonalityData = aggregateData(rawSeasonalityData, interval, ['weekly', 'yearly']);
    
    // Rename keys based on the interval for better UI
    const seasonalityData = aggregatedSeasonalityData.map(item => ({
      date: item.date,
      [interval === 'daily' ? 'Daily Seasonality' : 
      interval === 'weekly' ? 'Weekly Seasonality' : 
      'Monthly Seasonality']: item.weekly,
      'Yearly Seasonality': item.yearly
    }));
    
    return { trendData, seasonalityData };
  }, [data, metric, interval]);

  // Memoize a Map for quick SKU to Title lookup from the original data
  const skuTitleMap = useMemo(() => {
    const map = new Map<string, string>();
    data.forEach(item => {
      if (item.sku && item.title && !map.has(item.sku)) {
        map.set(item.sku, item.title);
      }
    });
    return map;
  }, [data]);

  // Format Y-axis value based on metric
  const formatYAxis = (value: number) => {
    if (metric === 'revenue') {
      // Format revenue with dollar sign
      return value >= 1000 
        ? `$${(value / 1000).toFixed(1)}k` 
        : `$${value.toFixed(0)}`;
    }
    // Format quantity (just numbers)
    return value >= 1000 
      ? `${(value / 1000).toFixed(1)}k` 
      : value.toFixed(0);
  };

  // Format tooltip values
  const formatTooltipValue = (value: number, name: string) => {
    if (metric === 'revenue') {
      return [`$${value.toFixed(2)}`, name];
    }
    return [value.toFixed(2), name];
  };
  
  // Get chart subheader text based on metric
  const getSubheaderText = (component: 'trend' | 'seasonality') => {
    const metricText = metric === 'quantity' ? 'Quantity' : 'Revenue';
    return component === 'trend' 
      ? `${metricText} Trend Component` 
      : `${metricText} Seasonality Components`;
  };

  // Get a title based on selected filters
  const getTitle = () => {
    // Check if SKUs are selected
    const selectedSkuFilters = (appliedFilters as Record<string, string[]>)?.["im_sku"] || [];
    
    // If SKUs are selected, look for corresponding titles
    if (selectedSkuFilters.length === 1) {
      // For a single SKU, try to find its title from the data
      const skuData = data.find(item => item.sku === selectedSkuFilters[0]);
      if (skuData && skuData.title) {
        return `Forecasting Model Components for "${skuData.title}"`;
      }
    } else if (selectedSkuFilters.length > 1) {
      // For multiple SKUs, show first one plus count of others
      const firstSkuData = data.find(item => item.sku === selectedSkuFilters[0]);
      const displayName = firstSkuData?.title || `SKU ${selectedSkuFilters[0]}`;
      return `Forecasting Model Components for "${displayName} + ${selectedSkuFilters.length - 1} more..."`;
    }
    
    // Default title if no SKUs selected or no title found
    return "Forecasting Model Components";
  };

  // Get total number of applied filters
  const getTotalFilterCount = (): number => {
    if (appliedFilters && Object.keys(appliedFilters).length > 0) {
      return Object.values(appliedFilters).reduce<number>((total, filters) => {
        if (Array.isArray(filters)) {
          return total + filters.length;
        }
        return total;
      }, 0);
    }
    return selectedSkus.length; // Fallback to just SKUs
  };

  return (
    <Card sx={{ mt: 4, mb: 4 }}>
      <CardHeader
        title={getTitle()}
        titleTypographyProps={{ fontWeight: 'bold' }}
        subheader={`${metric === 'quantity' ? 'Quantity' : 'Revenue'} wise model components`}
        action={
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            {/* Conditionally render Info icon for multiple SKUs */} 
            {(appliedFilters as Record<string, string[]>)?.["im_sku"]?.length > 1 && (
              <MuiTooltip title="View Selected SKUs">
                <IconButton 
                  size="small" 
                  onClick={handleOpenSkuPopover} 
                  aria-describedby={skuPopoverId}
                  aria-label="view selected skus"
                >
                  <InfoIcon fontSize="small" />
                </IconButton>
              </MuiTooltip>
            )}
            {/* Add Download Button */}
            {!isLoading && trendData.length > 0 && (
              <DownloadButton
                trendData={trendData}
                seasonalityData={seasonalityData}
                trendChartRef={trendChartRef}
                seasonalityChartRef={seasonalityChartRef}
                metric={metric}
                interval={interval}
              />
            )}
          </Box>
        }
        sx={{
          '& .MuiCardHeader-action': {
            marginTop: 0,
            marginRight: 0,
            alignSelf: 'center'
          },
          '& .MuiCardHeader-content': {
            paddingRight: 1,
            paddingLeft: 1
          },
          borderBottom: '1px solid',
          borderColor: 'divider',
          pb: 1
        }}
      />
      {/* Popover to display SKU details */} 
      <Popover
        id={skuPopoverId}
        open={isSkuPopoverOpen}
        anchorEl={skuPopoverAnchorEl}
        onClose={handleCloseSkuPopover}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'right',
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'right',
        }}
        slotProps={{
          paper: {
            sx: { p: 1.5, maxWidth: 350, maxHeight: 300, overflowY: 'auto' } 
          }
        }}
      >
        <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 'medium' }}>Selected SKUs & Titles</Typography>
        <List dense disablePadding>
          {(appliedFilters as Record<string, string[]>)?.["im_sku"]?.map(sku => (
            <ListItem key={sku} disableGutters>
              <ListItemText 
                primary={skuTitleMap.get(sku) || 'Title not found'} 
                secondary={`SKU: ${sku}`}
                primaryTypographyProps={{ fontSize: '0.8rem', fontWeight: 'medium' }} 
                secondaryTypographyProps={{ fontSize: '0.7rem' }} 
              />
            </ListItem>
          ))}
          {!(appliedFilters as Record<string, string[]>)?.["im_sku"]?.length && (
             <ListItem><ListItemText secondary="No SKUs selected" /></ListItem> 
          )}
        </List>
      </Popover>
      <CardContent>
        {isLoading ? (
          <Box>
            <Skeleton variant="rectangular" height={200} sx={{ mb: 4, borderRadius: 1 }} />
            <Skeleton variant="rectangular" height={200} sx={{ borderRadius: 1 }} />
          </Box>
        ) : data.length === 0 ? (
          <Typography variant="body1" color="textSecondary">
            No model data available. Please select a data point on the chart.
          </Typography>
        ) : (
          <Box>
            {/* Display selected SKUs as chips if any */}
            {selectedSkus.length > 0 && !getTotalFilterCount() && (
              <Box 
                sx={{ 
                  display: 'flex', 
                  flexWrap: 'wrap', 
                  gap: 1, 
                  mb: 2, 
                  p: 1, 
                  borderRadius: 1,
                  bgcolor: 'rgba(0, 0, 0, 0.02)'
                }}
              >
                <Typography variant="caption" sx={{ alignSelf: 'center', mr: 1, fontWeight: 'medium' }}>
                  Analysis for:
                </Typography>
                {selectedSkus.slice(0, 5).map((sku) => (
                  <Chip 
                    key={sku}
                    label={`SKU: ${sku}`}
                    size="small"
                    color="primary"
                    variant="outlined"
                    sx={{ 
                      '& .MuiChip-label': { 
                        fontSize: '0.7rem',
                        fontWeight: 'medium'
                      }
                    }}
                  />
                ))}
                {selectedSkus.length > 5 && (
                  <Chip 
                    label={`+${selectedSkus.length - 5} more`}
                    size="small"
                    color="default"
                    variant="outlined"
                    sx={{ 
                      '& .MuiChip-label': { 
                        fontSize: '0.7rem' 
                      }
                    }}
                  />
                )}
              </Box>
            )}
            
            {/* Display all applied filters as chips */}
            {getTotalFilterCount() > 0 && Object.keys(appliedFilters).length > 0 && (
              <Box 
                sx={{ 
                  display: 'flex', 
                  flexWrap: 'wrap', 
                  gap: 1, 
                  mb: 2, 
                  p: 1, 
                  borderRadius: 1,
                  bgcolor: 'rgba(0, 0, 0, 0.02)'
                }}
              >
                <Typography variant="caption" sx={{ alignSelf: 'center', mr: 1, fontWeight: 'medium' }}>
                  Analysis for:
                </Typography>
                {Object.entries(appliedFilters).map(([category, values]) => {
                  if (!Array.isArray(values) || values.length === 0) return null;
                  
                  const displayName = displayNames[category as FilterCategory];
                  
                  return values.slice(0, 2).map((value, index) => (
                    <Chip 
                      key={`${category}-${value}-${index}`}
                      label={`${displayName}: ${value}`}
                      size="small"
                      color="primary"
                      variant="outlined"
                      sx={{ 
                        '& .MuiChip-label': { 
                          fontSize: '0.7rem',
                          fontWeight: 'medium'
                        }
                      }}
                    />
                  ));
                })}
                
                {/* Show +X more if there are many filters */}
                {getTotalFilterCount() > 4 && (
                  <Chip 
                    label={`+${getTotalFilterCount() - 4} more`}
                    size="small"
                    color="default"
                    variant="outlined"
                    sx={{ 
                      '& .MuiChip-label': { 
                        fontSize: '0.7rem' 
                      }
                    }}
                  />
                )}
              </Box>
            )}
            
            {getTotalFilterCount() === 0 && (
              <Box sx={{ mb: 2, p: 1, borderRadius: 1, bgcolor: 'rgba(0, 0, 0, 0.02)' }}>
                <Typography variant="caption" color="textSecondary" sx={{ display: 'flex', alignItems: 'center' }}>
                  <FilterAltIcon sx={{ fontSize: 16, mr: 0.5, color: theme.palette.text.secondary }} />
                  Showing forecasting model components for all available data. Add filters above for specific analysis.
                </Typography>
              </Box>
            )}
            
            {/* Trend Chart */}
            <Box sx={{ mb: 4 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
                <Typography variant="subtitle1" fontWeight="medium" gutterBottom>
                  {getSubheaderText('trend')}
                </Typography>
                <Typography variant="body2" color="textSecondary" sx={{ maxWidth: '60%', textAlign: 'right' }}>
                  {metric === 'quantity' ? 
                    `Long-term direction showing the underlying pattern of quantity demand over time (${interval} aggregation).` :
                    `Long-term direction showing the underlying pattern of revenue over time (${interval} aggregation).`}
                </Typography>
              </Box>
              <Box sx={{ height: 200, width: '100%' }} ref={trendChartRef}>
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart
                    data={trendData}
                    margin={{ top: 10, right: 30, left: 10, bottom: 10 }}
                  >
                    <style>
                      {`
                        .recharts-legend-item {
                          cursor: pointer;
                          transition: opacity 0.3s ease;
                        }
                        
                        .recharts-legend-item.inactive {
                          opacity: 0.5;
                        }
                        
                        .recharts-legend-item:hover {
                          opacity: 0.7;
                        }
                        
                        .recharts-legend-item-text {
                          transition: color 0.3s ease;
                        }
                      `}
                    </style>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={theme.palette.divider} />
                    <XAxis 
                      dataKey="date" 
                      tickFormatter={formatXAxis}
                      tick={{ fontSize: 12, fill: theme.palette.text.secondary }}
                      height={40}
                      interval="preserveStartEnd"
                      minTickGap={30}
                    />
                    <YAxis 
                      tickFormatter={formatYAxis}
                      tick={{ fontSize: 12, fill: theme.palette.text.secondary }}
                      width={60}
                    />
                    <RechartsTooltip
                      contentStyle={{ border: `1px solid ${theme.palette.divider}`, borderRadius: '4px' }}
                    />
                    <Legend 
                      verticalAlign="bottom" 
                      align="center"
                      height={36}
                      wrapperStyle={{
                        paddingTop: '10px'
                      }}
                      payload={[
                        { 
                          value: `${metric === 'quantity' ? 'Quantity' : 'Revenue'} Trend`, 
                          type: 'line', 
                          color: theme.palette.primary.main, 
                          dataKey: 'trend'
                        }
                      ]}
                    />
                    <Line
                      type="monotone"
                      dataKey="trend"
                      stroke={theme.palette.primary.main}
                      dot={false}
                      strokeWidth={2}
                      name={`${metric === 'quantity' ? 'Quantity' : 'Revenue'} Trend`}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </Box>
            </Box>

            {/* Seasonality Chart */}
            <Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
                <Typography variant="subtitle1" fontWeight="medium" gutterBottom>
                  {getSubheaderText('seasonality')}
                </Typography>
                <Typography variant="body2" color="textSecondary" sx={{ maxWidth: '60%', textAlign: 'right' }}>
                  {`Regular ${interval} patterns (purple, ${interval} aggregation) and yearly cycles (orange) that repeat in the ${metric} data.`}
                </Typography>
              </Box>
              <Box sx={{ height: 200, width: '100%' }} ref={seasonalityChartRef}>
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart
                    data={seasonalityData}
                    margin={{ top: 10, right: 30, left: 10, bottom: 10 }}
                  >
                    <style>
                      {`
                        .recharts-legend-item {
                          cursor: pointer;
                          transition: opacity 0.3s ease;
                        }
                        
                        .recharts-legend-item.inactive {
                          opacity: 0.5;
                        }
                        
                        .recharts-legend-item:hover {
                          opacity: 0.7;
                        }
                        
                        .recharts-legend-item-text {
                          transition: color 0.3s ease;
                        }
                      `}
                    </style>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={theme.palette.divider} />
                    <XAxis 
                      dataKey="date" 
                      tickFormatter={formatXAxis}
                      tick={{ fontSize: 12, fill: theme.palette.text.secondary }}
                      height={40}
                      interval="preserveStartEnd"
                      minTickGap={30}
                    />
                    <YAxis 
                      tickFormatter={formatYAxis}
                      tick={{ fontSize: 12, fill: theme.palette.text.secondary }}
                      width={60}
                    />
                    <RechartsTooltip
                      contentStyle={{ border: `1px solid ${theme.palette.divider}`, borderRadius: '4px' }}
                    />
                    <Legend 
                      verticalAlign="bottom" 
                      align="center"
                      height={36}
                      wrapperStyle={{
                        paddingTop: '10px'
                      }}
                      onClick={(data) => handleLegendClick(data.dataKey as string)}
                      payload={[
                        { 
                          value: interval === 'daily' ? 'Daily Seasonality' : 
                                 interval === 'weekly' ? 'Weekly Seasonality' : 
                                 'Monthly Seasonality', 
                          type: 'line', 
                          color: '#8884d8', 
                          dataKey: interval === 'daily' ? 'Daily Seasonality' : 
                                   interval === 'weekly' ? 'Weekly Seasonality' : 
                                   'Monthly Seasonality',
                          inactive: !visibleSeries.periodSeasonality
                        },
                        { 
                          value: 'Yearly Seasonality', 
                          type: 'line', 
                          color: '#ff7300', 
                          dataKey: 'Yearly Seasonality',
                          inactive: !visibleSeries.yearlySeasonality
                        }
                      ]}
                    />
                    {visibleSeries.periodSeasonality && (
                      <Line
                        type="monotone"
                        dataKey={interval === 'daily' ? 'Daily Seasonality' : 
                                interval === 'weekly' ? 'Weekly Seasonality' : 
                                'Monthly Seasonality'}
                        stroke="#8884d8"
                        dot={false}
                        strokeWidth={2}
                        name={interval === 'daily' ? 'Daily Seasonality' : 
                              interval === 'weekly' ? 'Weekly Seasonality' : 
                              'Monthly Seasonality'}
                      />
                    )}
                    {visibleSeries.yearlySeasonality && (
                      <Line
                        type="monotone"
                        dataKey="Yearly Seasonality"
                        stroke="#ff7300"
                        dot={false}
                        strokeWidth={2}
                        name="Yearly Seasonality"
                      />
                    )}
                  </LineChart>
                </ResponsiveContainer>
              </Box>
            </Box>
          </Box>
        )}
      </CardContent>
    </Card>
  );
};

export default ForecastingModel; 
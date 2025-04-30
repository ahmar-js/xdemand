import React, { FC, useRef, useMemo } from 'react';
import { ResponsiveContainer, LineChart, Line, CartesianGrid, XAxis, YAxis, Tooltip as RechartsTooltip, Legend, ReferenceLine, Brush } from 'recharts';
import { Card, CardHeader, CardContent, useTheme, CircularProgress, Typography, Box, Chip, Popover, List, ListItem, ListItemText, IconButton, Tooltip as MuiTooltip } from '@mui/material';
import { ChartDataPoint } from '../../services/demandForecastService';
import DownloadButton from './DownloadButton';
import FilterAltIcon from '@mui/icons-material/FilterAlt';
import InfoIcon from '@mui/icons-material/InfoOutlined';

// Filter category type
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

interface DemandForecastChartProps {
  data: ChartDataPoint[];
  interval?: 'daily' | 'weekly' | 'monthly';
  metric?: 'quantity' | 'revenue';
  endDate?: string;
  isLoading?: boolean;
  error?: Error | null;
  title?: string;
  selectedSkus?: string[];
  appliedFilters?: Record<FilterCategory, string[]>;
  onDataPointClick?: (dataPoint: ChartDataPoint) => void;
  onBrushChange?: (range: [string, string] | null) => void;
}

const aggregateData = (data: ChartDataPoint[], days: number): ChartDataPoint[] => {
  
  if (!data || data.length === 0) return [];
  
  // Sort data by date
  const sortedData = [...data].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  
  // For monthly aggregation, we need to group by month
  if (days === 30) {
    const monthGroups: Record<string, ChartDataPoint[]> = {};
    
    // Group data by month
    sortedData.forEach(item => {
      const date = new Date(item.date);
      const monthKey = `${date.getFullYear()}-${date.getMonth()}`;
      
      if (!monthGroups[monthKey]) {
        monthGroups[monthKey] = [];
      }
      
      monthGroups[monthKey].push(item);
    });
    
    // Aggregate each month
    return Object.entries(monthGroups).map(([monthKey, items]) => {
      const validForecastCount = items.filter(item => item.forecast !== null).length;
      const avgForecast = validForecastCount > 0
        ? items.reduce((sum, item) => sum + (item.forecast || 0), 0) / validForecastCount
        : null;
      
      const validDemandCount = items.filter(item => item.demand !== null).length;
      const avgDemand = validDemandCount > 0
        ? items.reduce((sum, item) => sum + (item.demand || 0), 0) / validDemandCount
        : null;
      
      const validRevenueCount = items.filter(item => item.revenue !== null).length;
      const avgRevenue = validRevenueCount > 0
        ? items.reduce((sum, item) => sum + (item.revenue || 0), 0) / validRevenueCount
        : null;
      
      const avgLowerBound = items.reduce((sum, item) => sum + item.lowerBound, 0) / items.length;
      const avgUpperBound = items.reduce((sum, item) => sum + item.upperBound, 0) / items.length;
      
      // Determine if this group is mostly forecast data
      const isMostlyForecast = items.filter(item => item.isForecast).length > items.length / 2;
      
      // Use the first date of the month for display
      const firstItem = items[0];
      
      return {
        date: firstItem.date,
        demand: isMostlyForecast ? null : avgDemand,
        forecast: avgForecast,
        lowerBound: avgLowerBound,
        upperBound: avgUpperBound,
        revenue: isMostlyForecast ? null : avgRevenue,
        category: firstItem.category,
        title: firstItem.title,
        sku: firstItem.sku,
        warehouse: firstItem.warehouse,
        channel: firstItem.channel,
        isForecast: isMostlyForecast
      };
    });
  }
  
  // For weekly aggregation, we need to group by week
  if (days === 7) {
    const weekGroups: Record<string, ChartDataPoint[]> = {};
    
    // Group data by week
    sortedData.forEach(item => {
      const date = new Date(item.date);
      const startOfYear = new Date(date.getFullYear(), 0, 1);
      const days = Math.floor((date.getTime() - startOfYear.getTime()) / (24 * 60 * 60 * 1000));
      const weekNumber = Math.ceil((days + startOfYear.getDay() + 1) / 7);
      const weekKey = `${date.getFullYear()}-W${weekNumber}`;
      
      if (!weekGroups[weekKey]) {
        weekGroups[weekKey] = [];
      }
      
      weekGroups[weekKey].push(item);
    });
    
    // Aggregate each week
    return Object.entries(weekGroups).map(([weekKey, items]) => {
      const validForecastCount = items.filter(item => item.forecast !== null).length;
      const avgForecast = validForecastCount > 0
        ? items.reduce((sum, item) => sum + (item.forecast || 0), 0) / validForecastCount
        : null;
      
      const validDemandCount = items.filter(item => item.demand !== null).length;
      const avgDemand = validDemandCount > 0
        ? items.reduce((sum, item) => sum + (item.demand || 0), 0) / validDemandCount
        : null;
      
      const validRevenueCount = items.filter(item => item.revenue !== null).length;
      const avgRevenue = validRevenueCount > 0
        ? items.reduce((sum, item) => sum + (item.revenue || 0), 0) / validRevenueCount
        : null;
      
      const avgLowerBound = items.reduce((sum, item) => sum + item.lowerBound, 0) / items.length;
      const avgUpperBound = items.reduce((sum, item) => sum + item.upperBound, 0) / items.length;
      
      // Determine if this group is mostly forecast data
      const isMostlyForecast = items.filter(item => item.isForecast).length > items.length / 2;
      
      // Use the first date of the week for display
      const firstItem = items[0];
      
      return {
        date: firstItem.date,
        demand: isMostlyForecast ? null : avgDemand,
        forecast: avgForecast,
        lowerBound: avgLowerBound,
        upperBound: avgUpperBound,
        revenue: isMostlyForecast ? null : avgRevenue,
        category: firstItem.category,
        title: firstItem.title,
        sku: firstItem.sku,
        warehouse: firstItem.warehouse,
        channel: firstItem.channel,
        isForecast: isMostlyForecast
      };
    });
  }
  
  // For daily or any other interval, aggregate by the specified number of days
  const aggregated: ChartDataPoint[] = [];
  for (let i = 0; i < sortedData.length; i += days) {
    const chunk = sortedData.slice(i, Math.min(i + days, sortedData.length));
    
    // Count how many non-null forecast values we have
    const validForecastCount = chunk.filter(item => item.forecast !== null).length;
    
    // Only calculate average forecast if we have valid forecast values
    const avgForecast = validForecastCount > 0
      ? chunk.reduce((sum, item) => sum + (item.forecast || 0), 0) / validForecastCount
      : null;
    
    const validDemandCount = chunk.filter(item => item.demand !== null).length;
    const avgDemand = validDemandCount > 0
      ? chunk.reduce((sum, item) => sum + (item.demand || 0), 0) / validDemandCount
      : null;
    
    const validRevenueCount = chunk.filter(item => item.revenue !== null).length;
    const avgRevenue = validRevenueCount > 0
      ? chunk.reduce((sum, item) => sum + (item.revenue || 0), 0) / validRevenueCount
      : null;
    
    const avgLowerBound = chunk.reduce((sum, item) => sum + item.lowerBound, 0) / chunk.length;
    const avgUpperBound = chunk.reduce((sum, item) => sum + item.upperBound, 0) / chunk.length;
    
    // Determine if this chunk is mostly forecast data
    const isMostlyForecast = chunk.filter(item => item.isForecast).length > chunk.length / 2;

    aggregated.push({
      date: chunk[0].date,
      demand: isMostlyForecast ? null : avgDemand,
      forecast: avgForecast,
      lowerBound: avgLowerBound,
      upperBound: avgUpperBound,
      revenue: isMostlyForecast ? null : avgRevenue,
      category: chunk[0].category,
      title: chunk[0].title,
      sku: chunk[0].sku,
      warehouse: chunk[0].warehouse,
      channel: chunk[0].channel,
      isForecast: isMostlyForecast
    });
  }
  return aggregated;
};

const DemandForecastChart: FC<DemandForecastChartProps> = ({ 
  data, 
  interval = 'daily', 
  metric = 'quantity',
  endDate,
  isLoading = false,
  error = null,
  title = 'Demand Forecast',
  selectedSkus = [],
  appliedFilters = {},
  onDataPointClick = () => {},
  onBrushChange = () => {}
}) => {
  const chartRef = useRef<HTMLDivElement>(null);
  const theme = useTheme();
  
  // Track which series are visible
  const [visibleSeries, setVisibleSeries] = React.useState({
    lowerBound: true,
    upperBound: true,
    actual: true,
    forecast: true
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
  const skuPopoverId = isSkuPopoverOpen ? 'sku-details-popover' : undefined;

  // Handle toggling series visibility when legend is clicked
  const handleLegendClick = (dataKey: string) => {
    setVisibleSeries(prev => {
      // Map data keys to state properties
      const stateKey = dataKey === 'demand' || dataKey === 'revenue' 
        ? 'actual'
        : dataKey === 'lowerBound' 
          ? 'lowerBound'
          : dataKey === 'upperBound'
            ? 'upperBound'
            : 'forecast';
      
      return {
        ...prev,
        [stateKey]: !prev[stateKey]
      };
    });
  };

  // Add pulse animation styles
  React.useEffect(() => {
    // Create style element
    const style = document.createElement('style');
    style.id = 'recharts-pulse-effect';
    style.innerHTML = `
      @keyframes pulse {
        0% {
          r: 6;
          opacity: 1;
        }
        70% {
          r: 8;
          opacity: 0.7;
        }
        100% {
          r: 6;
          opacity: 1;
        }
      }
      .pulse-effect {
        animation: pulse 1.5s ease-in-out infinite;
      }
    `;
    
    // Add the style element if it doesn't exist yet
    if (!document.getElementById('recharts-pulse-effect')) {
      document.head.appendChild(style);
    }
    
    // Cleanup on unmount
    return () => {
      const existingStyle = document.getElementById('recharts-pulse-effect');
      if (existingStyle && existingStyle.parentNode) {
        existingStyle.parentNode.removeChild(existingStyle);
      }
    };
  }, []);

  // Get dynamic title based on selected SKUs
  const dynamicTitle = useMemo(() => {
    // Check for SKUs in appliedFilters
    const selectedSkuFilters = (appliedFilters as Record<FilterCategory, string[]>)["im_sku"] || [];
    
    if (selectedSkuFilters.length === 0) {
      // Default title if no SKUs selected
      return title;
    } else if (selectedSkuFilters.length === 1) {
      // For a single SKU, try to find its product title
      const skuData = data.find(item => item.sku === selectedSkuFilters[0]);
      if (skuData?.title) {
        return `Demand Forecast for "${skuData.title}"`;
      }
      return `Demand Forecast for SKU ${selectedSkuFilters[0]}`;
    } else {
      // For multiple SKUs, show first one plus count of others
      const firstSkuData = data.find(item => item.sku === selectedSkuFilters[0]);
      const displayName = firstSkuData?.title || `SKU ${selectedSkuFilters[0]}`;
      return `Demand Forecast for "${displayName} + ${selectedSkuFilters.length - 1} more..."`;
    }
  }, [title, appliedFilters, data]);

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

  // Process data based on end date and interval
  const processedData = useMemo(() => {
    if (!data || data.length === 0) return [];
    
    // Step 1: Split the data into actual and forecast based on the end date
    let actualData: ChartDataPoint[] = [];
    let forecastData: ChartDataPoint[] = [];
    
    if (endDate) {
      const endDateObj = new Date(endDate);
      endDateObj.setHours(0, 0, 0, 0); // Normalize to start of day
      
      // Calculate the forecast start date (1 month before end date)
      const forecastStartDate = new Date(endDateObj);
      forecastStartDate.setMonth(forecastStartDate.getMonth() - 1);
      forecastStartDate.setHours(0, 0, 0, 0);
      
      // Calculate the forecast cutoff date (180 days after end date)
      const forecastCutoffDate = new Date(endDateObj);
      forecastCutoffDate.setDate(forecastCutoffDate.getDate() + 180);
      forecastCutoffDate.setHours(0, 0, 0, 0);
      
      // Get all data points up to the end date as actual data
      actualData = data.filter(item => {
          const itemDate = new Date(item.date);
          itemDate.setHours(0, 0, 0, 0);
          return itemDate <= endDateObj;
        });
      
      // Get all data points from forecast start date to forecast cutoff date as forecast data
      forecastData = data.filter(item => {
          const itemDate = new Date(item.date);
          itemDate.setHours(0, 0, 0, 0);
        return itemDate >= forecastStartDate && itemDate <= forecastCutoffDate;
      });
      
      // For actual data points, only show forecast line during the overlap period
      actualData = actualData.map(item => {
        const itemDate = new Date(item.date);
        const isInOverlapPeriod = itemDate >= forecastStartDate && itemDate <= endDateObj;
        
        return {
          ...item,
          // Only keep forecast values for the overlap period, set to null otherwise
          forecast: isInOverlapPeriod ? item.forecast : null,
          isForecast: false
        };
      });
      
      // For forecast data points, handle differently based on whether they're before or after end date
      forecastData = forecastData.map(item => {
          const itemDate = new Date(item.date);
        const isAfterEndDate = itemDate > endDateObj;
        
        return {
          ...item,
          // Only clear actual demand/revenue values for points after the end date
          demand: isAfterEndDate ? null : item.demand,
          revenue: isAfterEndDate ? null : item.revenue,
          isForecast: true
        };
      });
    } else {
      // If no end date is provided, treat all data as actual
      actualData = data.map(item => ({
        ...item,
        isForecast: false
      }));
    }
    
    // Combine actual and forecast data
    let combinedData = [...actualData, ...forecastData];
    
    // Apply aggregation based on the selected interval
    if (interval === 'weekly') {
      return aggregateData(combinedData, 7);
    } else if (interval === 'monthly') {
      return aggregateData(combinedData, 30);
    }
    
    // For daily interval, return data as is
    return combinedData;
  }, [data, endDate, interval]);

  // Calculate average based on selected metric
  const averageValue = useMemo(() => {
    if (!processedData || processedData.length === 0) return 0;

    return (
      processedData.reduce((acc, point) => {
        const value = metric === 'quantity' ? point.demand || 0 : point.revenue || 0;
      return acc + value;
      }, 0) / processedData.length
    );
  }, [processedData, metric]);

  // Calculate the forecast end date for reference line (180 days after endDate)
  const forecastEndDate = useMemo(() => {
    if (!endDate) return null;
    
    const endDateObj = new Date(endDate);
    const forecastEndDateObj = new Date(endDateObj);
    forecastEndDateObj.setDate(forecastEndDateObj.getDate() + 180);
    
    return forecastEndDateObj.toISOString().split('T')[0];
  }, [endDate]);

  // Calculate the forecast start date (1 month before end date)
  const forecastStartDate = useMemo(() => {
    if (!endDate) return null;
    
    const endDateObj = new Date(endDate);
    const forecastStartDateObj = new Date(endDateObj);
    forecastStartDateObj.setMonth(forecastStartDateObj.getMonth() - 1);
    
    return forecastStartDateObj.toISOString().split('T')[0];
  }, [endDate]);

  const formatXAxis = (date: string) => {
    const d = new Date(date);
    // Format date to show month and year only, for consistent month-based bins
    return d.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short'
    });
  };

  const formatYAxis = (value: number) => {
    if (metric === 'revenue') {
      return `$${value.toLocaleString()}`;
    }
    return value.toLocaleString();
  };

  // Get total number of applied filters
  const getTotalFilterCount = (): number => {
    if (appliedFilters && Object.keys(appliedFilters).length > 0) {
      // Use a more explicit approach to handle types safely
      let total = 0;
      Object.values(appliedFilters).forEach((filters) => {
        if (Array.isArray(filters)) {
          total += filters.length;
        }
      });
      return total;
    }
    return selectedSkus.length; // Fallback to just SKUs
  };

  // Handle brush change event
  const handleBrushChange = (brushData: any) => {
    if (brushData && brushData.startIndex !== undefined && brushData.endIndex !== undefined) {
      // Get the date range from the processed data
      const startDate = processedData[brushData.startIndex]?.date;
      const endDate = processedData[brushData.endIndex]?.date;
      
      if (startDate && endDate && onBrushChange) {
        onBrushChange([startDate, endDate]);
      }
    } else if (onBrushChange) {
      // Reset brush selection
      onBrushChange(null);
    }
  };

  // Render loading state
  if (isLoading) {
    return (
      <Card>
        <CardHeader title={dynamicTitle} subheader="Loading data..." />
        <CardContent sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 400 }}>
          <CircularProgress />
        </CardContent>
      </Card>
    );
  }

  // Render error state
  if (error) {
    return (
      <Card>
        <CardHeader title={dynamicTitle} subheader="Error loading data" />
        <CardContent sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 400, flexDirection: 'column' }}>
          <Typography color="error" variant="h6">
            Failed to load forecast data
          </Typography>
          <Typography color="error" variant="body2">
            {error.message}
          </Typography>
        </CardContent>
      </Card>
    );
  }

  // Render empty state
  if (!processedData || processedData.length === 0) {
    return (
      <Card>
        <CardHeader title={dynamicTitle} subheader="No data available" />
        <CardContent sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 400 }}>
          <Typography variant="body1">No forecast data available for the selected filters.</Typography>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader
        title={dynamicTitle}
        subheader={`${metric === 'quantity' ? 'Quantity' : 'Revenue'} wise forecast`}
        action={
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}> {/* Container for actions */}
            {/* Conditionally render Info icon for multiple SKUs */} 
            {(appliedFilters as Record<FilterCategory, string[]>)?.[ "im_sku"]?.length > 1 && (
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
            {/* Existing Download Button */}
            <DownloadButton data={processedData} chartRef={chartRef} />
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
            sx: { p: 1.5, maxWidth: 350, maxHeight: 300, overflowY: 'auto' } // Add padding and constraints
          }
        }}
      >
        <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 'medium' }}>Selected SKUs & Titles</Typography>
        <List dense disablePadding>
          {(appliedFilters as Record<FilterCategory, string[]>)?.["im_sku"]?.map(sku => (
            <ListItem key={sku} disableGutters>
              <ListItemText 
                primary={skuTitleMap.get(sku) || 'Title not found'} 
                secondary={`SKU: ${sku}`}
                primaryTypographyProps={{ fontSize: '0.8rem', fontWeight: 'medium' }} 
                secondaryTypographyProps={{ fontSize: '0.7rem' }} 
              />
            </ListItem>
          ))}
          {!(appliedFilters as Record<FilterCategory, string[]>)?.["im_sku"]?.length && (
             <ListItem><ListItemText secondary="No SKUs selected" /></ListItem> 
          )}
        </List>
      </Popover>
      <CardContent>
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
                    fontWeight: 'medium',
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
              
              const displayName = displayNames[category as FilterCategory] || category;
              
              return values.slice(0, 2).map((value, index) => (
                <Chip 
                  key={`${category}-${value}-${index}`}
                  label={`${displayName}: ${value}`}
                  size="small"
                  color="primary"
                  variant="outlined"
                  sx={{ 
                    '& .MuiChip-label': { 
                      fontSize: { xs: '0.65rem', sm: '0.7rem' },
                      fontWeight: 'medium',
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
                    fontSize: { xs: '0.65rem', sm: '0.7rem' }
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
              Showing forecast data for all available data. Add filters above for specific analysis.
            </Typography>
          </Box>
        )}

        <div 
          ref={chartRef} 
          style={{ 
            height: '450px', 
            width: '100%', 
            transition: 'all 0.3s ease',
            borderRadius: '8px',
            padding: '8px',
            // boxShadow: 'inset 0 0 0 1px rgba(0,0,0,0.05)'
          }}
          className="chart-container"
        >
          <style>
            {`

              
              .pulse-effect {
                animation: pulse 1.5s infinite;
                transform-origin: center center;
              }
              
              @keyframes pulse {
                0% {
                  r: 6;
                  opacity: 1;
                  filter: drop-shadow(0 0 1px rgba(0,0,0,0.3));
                }
                50% {
                  r: 8;
                  opacity: 0.8;
                  filter: drop-shadow(0 0 3px rgba(0,0,0,0.5));
                }
                100% {
                  r: 6;
                  opacity: 1;
                  filter: drop-shadow(0 0 1px rgba(0,0,0,0.3));
                }
              }
              
              .chart-dot:hover {
                cursor: pointer !important;
                filter: brightness(1.2) drop-shadow(0 0 2px rgba(0,0,0,0.3));
              }
              
              .recharts-curve.recharts-line-curve:hover {
                stroke-width: 3px;
                transition: stroke-width 0.2s ease;
              }
              
              .recharts-line:hover {
                filter: drop-shadow(0 0 3px rgba(0,0,0,0.2));
              }
              
              .recharts-tooltip-wrapper {
                transition: transform 0.3s ease !important;
                z-index: 1000 !important;
              }
              
              .recharts-active-dot {
                transition: r 0.2s ease, stroke-width 0.2s ease, filter 0.2s ease !important;
              }
              
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
              
              .recharts-legend-item.inactive .recharts-legend-item-text {
                color: #aaa !important;
              }
            `}
          </style>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart 
              data={processedData} 
              margin={{ top: 0, right: 30, left: 30, bottom: 30 }}
              onClick={(data) => {
                if (data && data.activePayload && data.activePayload.length > 0) {
                  const clickedPoint = data.activePayload[0].payload;
                  onDataPointClick(clickedPoint);
                }
              }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke={theme.palette.divider} vertical={false} />
              <XAxis
                dataKey="date"
                tick={{ fontSize: 12, fill: theme.palette.text.secondary }}
                tickMargin={8}
                height={60}
                tickFormatter={formatXAxis}
                interval="preserveStartEnd"
                minTickGap={30}
                label={{
                  value: '',
                  position: 'bottom',
                  offset: -10,
                  style: {
                    textAnchor: 'middle',
                    fill: theme.palette.text.secondary,
                    fontWeight: 500
                  }
                }}
              />
              <YAxis
                tick={{ fontSize: 12, fill: theme.palette.text.secondary }}
                tickMargin={8}
                width={30}
                tickFormatter={formatYAxis}
                label={{
                  // value: `Forecast (${metric === 'quantity' ? 'Quantity' : 'Revenue'})`,
                  angle: -90,
                  position: 'insideLeft',
                  style: {
                    textAnchor: 'middle',
                    fill: theme.palette.text.secondary,
                    fontWeight: 500
                  },
                  dx: -12
                }}
              />
              <RechartsTooltip
                content={({ active, payload, label }: { active?: boolean, payload?: any[], label?: any }) => {
                  if (active && payload && payload.length) {
                    const dataPoint = payload[0]?.payload;
                    const actualValue = metric === 'quantity'
                      ? dataPoint.demand
                      : dataPoint.revenue;
                    const forecast = dataPoint.forecast;
                    const difference = (Number(actualValue) || 0) - (Number(forecast) || 0);
                    const percentageDiff = actualValue && forecast ? ((difference / Number(actualValue)) * 100).toFixed(2) : 0;
                    const lowerBound = dataPoint.lowerBound;
                    const upperBound = dataPoint.upperBound;

                    return (
                      <div
                        style={{
                          backgroundColor: 'rgba(255, 255, 255, 0.95)',
                          border: '1px solid #f0f0f0',
                          padding: '12px',
                          borderRadius: '8px',
                          boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                          transition: 'all 0.3s ease',
                          // maxWidth: '280px',
                          fontSize: '12px',
                          animation: 'fadeIn 0.2s ease-in-out'
                        }}
                      >
                        <style>
                          {`
                            @keyframes fadeIn {
                              from { opacity: 0; transform: translateY(10px); }
                              to { opacity: 1; transform: translateY(0); }
                            }
                          `}
                        </style>
                        <p style={{ margin: '0 0 8px 0', fontWeight: 'bold', fontSize: '14px', borderBottom: '1px solid #f0f0f0', paddingBottom: '5px' }}>
                          Date: {new Date(label).toLocaleDateString('en-US', {year: 'numeric', month: 'short', day: 'numeric'})}
                        </p>
                        {dataPoint?.category && (
                          <p style={{ margin: '0 0 5px 0', color: '#666', display: 'flex', justifyContent: 'space-between' }}>
                            <span style={{ fontWeight: '500' }}>Category:</span> <span>{dataPoint.category}</span>
                          </p>
                        )}
                        {dataPoint?.channel && (
                          <p style={{ margin: '0 0 5px 0', color: '#666', display: 'flex', justifyContent: 'space-between' }}>
                            <span style={{ fontWeight: '500' }}>Channel:</span> <span>{dataPoint.channel}</span>
                          </p>
                        )}
                        {dataPoint?.title && (
                          <p style={{ margin: '0 0 5px 0', color: '#666', display: 'flex', justifyContent: 'space-between' }}>
                            <span style={{ fontWeight: '500' }}>Title:</span> <span>{dataPoint.title}</span>
                          </p>
                        )}
                        {dataPoint?.sku && (
                          <p style={{ margin: '0 0 5px 0', color: '#666', display: 'flex', justifyContent: 'space-between' }}>
                            <span style={{ fontWeight: '500' }}>SKU:</span> <span>{dataPoint.sku}</span>
                          </p>
                        )}
                        {dataPoint?.warehouse && (
                          <p style={{ margin: '0 0 5px 0', color: '#666', display: 'flex', justifyContent: 'space-between' }}>
                            <span style={{ fontWeight: '500' }}>Warehouse:</span> <span>{dataPoint.warehouse}</span>
                          </p>
                        )}
                        <div style={{ marginTop: '10px', paddingTop: '8px', borderTop: '1px solid #f0f0f0' }}>
                          <p style={{ margin: '0 0 5px 0', color: '#1677ff', display: 'flex', justifyContent: 'space-between' }}>
                            <span style={{ fontWeight: '500' }}>Actual {metric === 'quantity' ? 'Demand' : 'Revenue'}:</span> 
                            <span style={{ fontWeight: 'bold' }}>{metric === 'revenue' ? `$${actualValue}` : actualValue}</span>
                          </p>
                          <p style={{ margin: '0 0 5px 0', color: '#ff4d4f', display: 'flex', justifyContent: 'space-between' }}>
                            <span style={{ fontWeight: '500' }}>Forecast:</span> 
                            <span style={{ fontWeight: 'bold' }}>{metric === 'revenue' ? `$${forecast}` : forecast}</span>
                          </p>
                          <p style={{ margin: '0 0 5px 0', color: difference >= 0 ? '#52c41a' : '#912a2a', display: 'flex', justifyContent: 'space-between' }}>
                            <span style={{ fontWeight: '500' }}>Difference:</span>
                            <span style={{ fontWeight: 'bold' }}>{metric === 'revenue' ? `$${difference}` : difference} ({percentageDiff}%)</span>
                          </p>
                          <p style={{ margin: '0 0 5px 0', color: '#8884d8', display: 'flex', justifyContent: 'space-between' }}>
                            <span style={{ fontWeight: '500' }}>Lower Bound:</span>
                            <span style={{ fontWeight: 'bold' }}>{metric === 'revenue' ? `$${lowerBound}` : lowerBound}</span>
                          </p>
                          <p style={{ margin: '0 0 5px 0', color: '#8884d8', display: 'flex', justifyContent: 'space-between' }}>
                            <span style={{ fontWeight: '500' }}>Upper Bound:</span>
                            <span style={{ fontWeight: 'bold' }}>{metric === 'revenue' ? `$${upperBound}` : upperBound}</span>
                          </p>
                        </div>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Legend
                verticalAlign="bottom"
                align="center"
                height={36}
                wrapperStyle={{
                  paddingTop: '20px'
                }}
                onClick={(data) => handleLegendClick(data.dataKey as string)}
                payload={[
                  { value: 'Lower Bound', type: 'line', color: '#8884d8', dataKey: 'lowerBound', inactive: !visibleSeries.lowerBound },
                  { value: 'Upper Bound', type: 'line', color: '#8884d8', dataKey: 'upperBound', inactive: !visibleSeries.upperBound },
                  { value: `Actual ${metric === 'quantity' ? 'Demand' : 'Revenue'}`, type: 'line', color: '#1677ff', dataKey: metric === 'quantity' ? 'demand' : 'revenue', inactive: !visibleSeries.actual },
                  { value: 'Forecast', type: 'line', color: '#ff4d4f', dataKey: 'forecast', inactive: !visibleSeries.forecast }
                ]}
                formatter={(value, entry: { inactive?: boolean; color?: string }) => {
                  return <span style={{ color: entry.inactive ? '#aaa' : entry.color }}>{value}</span>;
                }}
              />
              {forecastStartDate && (
                <ReferenceLine 
                  x={forecastStartDate} 
                  stroke="#ff4d4f" 
                  strokeWidth={2}
                  strokeDasharray="3 3" 
                  label={{ 
                    value: 'Forecast Start', 
                    position: 'top',
                    fill: '#ff4d4f',
                    fontSize: 12,
                    fontWeight: 'bold' 
                  }} 
                />
              )}
              {forecastEndDate && (
                <ReferenceLine 
                  x={forecastEndDate} 
                  stroke="#ff9c6e" 
                  strokeWidth={1}
                  strokeDasharray="3 3" 
                  label={{ 
                    value: 'Forecast End', 
                    position: 'top',
                    fill: '#ff9c6e',
                    fontSize: 11
                  }} 
                />
              )}
              <ReferenceLine y={averageValue} stroke="gray" strokeDasharray="3 3" label="Avg" />
              <Brush
                dataKey="date"
                height={40}
                stroke={theme.palette.primary.main}
                tickFormatter={formatXAxis}
                onChange={handleBrushChange}
              />
              {visibleSeries.lowerBound && (
                <Line 
                  type="monotone" 
                  dataKey="lowerBound" 
                  stroke="#8884d8" 
                  opacity={0.5} 
                  dot={false} 
                  name="Lower Bound" 
                  animationDuration={300}
                />
              )}
              {visibleSeries.upperBound && (
                <Line 
                  type="monotone" 
                  dataKey="upperBound" 
                  stroke="#8884d8" 
                  opacity={0.5} 
                  dot={false} 
                  name="Upper Bound" 
                  animationDuration={300}
                />
              )}
              {visibleSeries.actual && (
                <Line 
                  type="monotone" 
                  dataKey={metric === 'quantity' ? 'demand' : 'revenue'} 
                  stroke="#1677ff" 
                  dot={interval === 'daily' ? false : {
                    r: 3,
                    fill: "#1677ff",
                    stroke: "#fff",
                    strokeWidth: 1,
                    cursor: 'pointer',
                    className: 'chart-dot'
                  }}
                  activeDot={{
                    r: 6,
                    fill: "#1677ff",
                    stroke: "#fff",
                    strokeWidth: 2,
                    cursor: 'pointer',
                    strokeOpacity: 0.9,
                    className: 'pulse-effect',
                    onMouseOver: (props: any) => {
                      document.body.style.cursor = 'pointer';
                      if (props.node) {
                        props.node.style.filter = 'drop-shadow(0 0 3px rgba(22, 119, 255, 0.7))';
                      }
                    },
                    onMouseOut: (props: any) => {
                      document.body.style.cursor = 'default';
                      if (props.node) {
                        props.node.style.filter = 'none';
                      }
                    }
                  }}
                  connectNulls={false} 
                  name={`Actual ${metric === 'quantity' ? 'Demand' : 'Revenue'}`}
                  strokeWidth={2}
                  animationDuration={300}
                />
              )}
              {visibleSeries.forecast && (
                <Line 
                  type="monotone" 
                  dataKey="forecast" 
                  stroke="#ff4d4f" 
                  dot={interval === 'daily' ? false : {
                    r: 3,
                    fill: "#ff4d4f",
                    stroke: "#fff", 
                    strokeWidth: 1,
                    cursor: 'pointer',
                    className: 'chart-dot'
                  }}
                  activeDot={{
                    r: 6, 
                    fill: "#ff4d4f",
                    stroke: "#fff",
                    strokeWidth: 2,
                    cursor: 'pointer',
                    strokeOpacity: 0.9,
                    className: 'pulse-effect',
                    onMouseOver: (props: any) => {
                      document.body.style.cursor = 'pointer';
                      if (props.node) {
                        props.node.style.filter = 'drop-shadow(0 0 3px rgba(255, 77, 79, 0.7))';
                      }
                    },
                    onMouseOut: (props: any) => {
                      document.body.style.cursor = 'default';
                      if (props.node) {
                        props.node.style.filter = 'none';
                      }
                    }
                  }}
                  connectNulls={false}
                  name="Forecast"
                  strokeWidth={2}
                  animationDuration={300}
                />
              )}
            </LineChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
};

export default DemandForecastChart;

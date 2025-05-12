import React, { FC, useRef, useMemo } from 'react';
import { ResponsiveContainer, LineChart, Line, CartesianGrid, XAxis, YAxis, Tooltip as RechartsTooltip, Legend, ReferenceLine, Brush, Label } from 'recharts';
import { Card, CardHeader, CardContent, useTheme, CircularProgress, Typography, Box, Chip, Popover, List, ListItem, ListItemText, IconButton, Tooltip as MuiTooltip, Button } from '@mui/material';
import { ChartDataPoint } from '../../services/demandForecastService';
import DownloadButton from './DownloadButton';
import FilterAltIcon from '@mui/icons-material/FilterAlt';
import InfoIcon from '@mui/icons-material/InfoOutlined';

// Helper function to normalize date format for comparisons
const normalizeDate = (dateStr: string): string => {
  try {
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) {
      console.warn(`Invalid date string: ${dateStr}`);
      return dateStr; // Return original if invalid
    }
    return date.toISOString().split('T')[0]; // YYYY-MM-DD format
  } catch (e) {
    console.error(`Error normalizing date: ${dateStr}`, e);
    return dateStr;
  }
};

// Define props for the custom OOS dot
interface CustomOOSDotProps {
  cx?: number;
  cy?: number;
  stroke?: string;
  payload?: ChartDataPoint & { [key: string]: any }; // Ensure payload is ChartDataPoint
  value?: number | string | (number | string)[];
  chartHeight?: number; // Pass chart height explicitly if possible
  height?: number; // Added height prop
  // Add any other props that Recharts might pass to a dot renderer
  [key: string]: any; 
}

// Custom dot component for OOS markers
const CustomOOSDot: FC<CustomOOSDotProps> = (props) => {
  const { cx, cy, payload, chartHeight, height: propHeight } = props; 
  const theme = useTheme(); 

  // console.log('CustomOOSDot props:', props); 

  // Ensure cx is a defined number and payload indicates OOS
  if (typeof cx !== 'number' || isNaN(cx) || payload?.out_of_stock !== 1) {
    if (typeof cx !== 'number' || isNaN(cx)) {
      console.warn('CustomOOSDot: cx is undefined, NaN, or invalid. Skipping render. cx:', cx, 'Payload:', payload);
    }
    return null;
  }

  // Use height from Recharts props if available, otherwise fallback to chartRef height or default
  const actualChartHeight = propHeight || chartHeight || 370; 
  
  const lineTopMargin = 5; 
  const lineBottomMargin = 5; 

  const lineY1 = lineTopMargin;
  const lineY2 = actualChartHeight - lineBottomMargin;

  if (lineY2 <= lineY1) {
      console.warn('CustomOOSDot: Calculated lineY2 is less than or equal to lineY1. Skipping render.', {lineY1, lineY2, actualChartHeight});
      return null;
  }

  return (
    <g>
      {/* Vertical marker line */}
      <line 
        x1={cx} 
        y1={lineY1}
        x2={cx} 
        y2={lineY2}
        stroke={theme.palette.secondary.main}
        strokeWidth={1.5}
        strokeDasharray="4 2"
      />
      {/* OOS label at top */}
      <g transform={`translate(${cx - 12}, ${lineY1 + 5})`}> 
        <rect
          width={24}
          height={16}
          fill={theme.palette.secondary.main}
          rx={4}
          ry={4}
        />
        <text
          x={12}
          y={12}
          textAnchor="middle"
          fill="#fff"
          fontSize={10}
          fontWeight="bold"
        >
          OOS
        </text>
      </g>
      {/* Dot at bottom */}
      <circle
        cx={cx}
        cy={lineY2} 
        r={4}
        fill={theme.palette.secondary.main}
      />
    </g>
  );
};

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
    
    // Group data by month+SKU
    sortedData.forEach(item => {
      const date = new Date(item.date);
      // Include SKU in the group key to maintain separation between different SKUs
      const monthKey = `${date.getFullYear()}-${date.getMonth()}_${item.sku || "default"}`;
      
      if (!monthGroups[monthKey]) {
        monthGroups[monthKey] = [];
      }
      
      monthGroups[monthKey].push(item);
    });
    
    // Aggregate each month+SKU group
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
      
      // Calculate average out_of_stock value (only for non-null values)
      const validOutOfStockCount = items.filter(item => item.out_of_stock !== null && item.out_of_stock !== undefined).length;
      const avgOutOfStock = validOutOfStockCount > 0
        ? items.reduce((sum, item) => sum + (item.out_of_stock || 0), 0) / validOutOfStockCount
        : null;
      
      // Collect actual OOS dates within this period
      const oosItems = items.filter(item => item.out_of_stock === 1);
      const oosDates = oosItems.map(item => item.date);
      
      // If any item in this period is out of stock, mark the whole period as out of stock
      const hasOutOfStock = items.some(item => item.out_of_stock === 1);
      const outOfStockValue = hasOutOfStock ? 1 : 0;
      
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
        isForecast: isMostlyForecast,
        out_of_stock: outOfStockValue,
        oos_dates: oosDates.length > 0 ? oosDates : undefined,
        for_qty_trend: firstItem.for_qty_trend,
        for_qty_weekly: firstItem.for_qty_weekly,
        for_qty_yearly: firstItem.for_qty_yearly,
        for_rev_trend: firstItem.for_rev_trend,
        for_rev_weekly: firstItem.for_rev_weekly,
        for_rev_yearly: firstItem.for_rev_yearly
      };
    });
  }
  
  // For weekly aggregation, we need to group by week
  if (days === 7) {
    const weekGroups: Record<string, ChartDataPoint[]> = {};
    
    // Group data by week+SKU
    sortedData.forEach(item => {
      const date = new Date(item.date);
      const startOfYear = new Date(date.getFullYear(), 0, 1);
      const days = Math.floor((date.getTime() - startOfYear.getTime()) / (24 * 60 * 60 * 1000));
      const weekNumber = Math.ceil((days + startOfYear.getDay() + 1) / 7);
      // Include SKU in the group key to maintain separation between different SKUs
      const weekKey = `${date.getFullYear()}-W${weekNumber}_${item.sku || "default"}`;
      
      if (!weekGroups[weekKey]) {
        weekGroups[weekKey] = [];
      }
      
      weekGroups[weekKey].push(item);
    });
    
    // Aggregate each week+SKU group
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
      
      // Calculate average out_of_stock value (only for non-null values)
      const validOutOfStockCount = items.filter(item => item.out_of_stock !== null && item.out_of_stock !== undefined).length;
      const avgOutOfStock = validOutOfStockCount > 0
        ? items.reduce((sum, item) => sum + (item.out_of_stock || 0), 0) / validOutOfStockCount
        : null;
      
      // Collect actual OOS dates within this period
      const oosItems = items.filter(item => item.out_of_stock === 1);
      const oosDates = oosItems.map(item => item.date);
      
      // If any item in this period is out of stock, mark the whole period as out of stock
      const hasOutOfStock = items.some(item => item.out_of_stock === 1);
      const outOfStockValue = hasOutOfStock ? 1 : 0;
      
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
        isForecast: isMostlyForecast,
        out_of_stock: outOfStockValue,
        oos_dates: oosDates.length > 0 ? oosDates : undefined,
        for_qty_trend: firstItem.for_qty_trend,
        for_qty_weekly: firstItem.for_qty_weekly,
        for_qty_yearly: firstItem.for_qty_yearly,
        for_rev_trend: firstItem.for_rev_trend,
        for_rev_weekly: firstItem.for_rev_weekly,
        for_rev_yearly: firstItem.for_rev_yearly
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
    
    // Calculate average out_of_stock value (only for non-null values)
    const validOutOfStockCount = chunk.filter(item => item.out_of_stock !== null && item.out_of_stock !== undefined).length;
    const avgOutOfStock = validOutOfStockCount > 0
      ? chunk.reduce((sum, item) => sum + (item.out_of_stock || 0), 0) / validOutOfStockCount
      : null;
    
    // Collect actual OOS dates within this period
    const oosItems = chunk.filter(item => item.out_of_stock === 1);
    const oosDates = oosItems.map(item => item.date);
    
    // If any item in this period is out of stock, mark the whole period as out of stock
    const hasOutOfStock = chunk.some(item => item.out_of_stock === 1);
    const outOfStockValue = hasOutOfStock ? 1 : 0;
    
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
      isForecast: isMostlyForecast,
      out_of_stock: outOfStockValue,
      oos_dates: oosDates.length > 0 ? oosDates : undefined,
      for_qty_trend: chunk[0].for_qty_trend,
      for_qty_weekly: chunk[0].for_qty_weekly,
      for_qty_yearly: chunk[0].for_qty_yearly,
      for_rev_trend: chunk[0].for_rev_trend,
      for_rev_weekly: chunk[0].for_rev_weekly,
      for_rev_yearly: chunk[0].for_rev_yearly
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
  
  // Log incoming raw data once
  // console.log('DemandForecastChart: Raw Data Prop', data);
  
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

  const handleLegendClick = (dataKey: string) => {
    setVisibleSeries(prev => {
      const stateKey = dataKey === 'demand' || dataKey === 'revenue' 
        ? 'actual'
        : dataKey === 'lowerBound' 
          ? 'lowerBound'
          : dataKey === 'upperBound'
            ? 'upperBound'
            : 'forecast';
      return { ...prev, [stateKey]: !prev[stateKey] };
    });
  };

  React.useEffect(() => {
    const style = document.createElement('style');
    style.id = 'recharts-pulse-effect';
    style.innerHTML = ` @keyframes pulse { /* ... pulse animation ... */ } .pulse-effect { animation: pulse 1.5s ease-in-out infinite; } `;
    if (!document.getElementById('recharts-pulse-effect')) {
      document.head.appendChild(style);
    }
    return () => {
      const existingStyle = document.getElementById('recharts-pulse-effect');
      if (existingStyle?.parentNode) {
        existingStyle.parentNode.removeChild(existingStyle);
      }
    };
  }, []);

  const dynamicTitle = useMemo(() => {
    const selectedSkuFilters = (appliedFilters as Record<FilterCategory, string[]>)["im_sku"] || [];
    if (selectedSkuFilters.length === 0) {
      return title;
    } else if (selectedSkuFilters.length === 1) {
      const skuData = data.find(item => item.sku === selectedSkuFilters[0]);
      return skuData?.title ? `Demand Forecast for "${skuData.title}"` : `Demand Forecast for SKU ${selectedSkuFilters[0]}`;
    } else {
      const firstSkuData = data.find(item => item.sku === selectedSkuFilters[0]);
      const displayName = firstSkuData?.title || `SKU ${selectedSkuFilters[0]}`;
      return `Demand Forecast for "${displayName} + ${selectedSkuFilters.length - 1} more..."`;
    }
  }, [title, appliedFilters, data]);

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
    const targetSkuForLog = "3PBR-F6MB-5FT";
    const oosDatesForLog = ["2024-08-20", "2024-12-17", "2025-01-03"];

    const logOOSStatus = (stage: string, dataSet: ChartDataPoint[], checkDates: string[] = oosDatesForLog) => {
      const relevantPoints = dataSet
        .filter(p => p.sku === targetSkuForLog && checkDates.includes(p.date))
        .map(p => ({ date: p.date, sku: p.sku, oos: p.out_of_stock, isForecast: p.isForecast, demand: p.demand, forecast: p.forecast }));
      if (relevantPoints.length > 0) {
        console.log(`DemandForecastChart (${stage}): OOS status for ${targetSkuForLog}`, relevantPoints);
      } else {
        // console.log(`DemandForecastChart (${stage}): No specific OOS date points found for ${targetSkuForLog} among ${checkDates.join(', ')}`);
      }
    };
    
    console.log('--- DemandForecastChart: processedData START ---');
    logOOSStatus('Initial data prop', data);
    console.log('Interval:', interval, 'EndDate:', endDate);

    if (!data || data.length === 0) {
      console.log('DemandForecastChart: data is empty, returning []');
      console.log('--- DemandForecastChart: processedData END ---');
      return [];
    }

    let localActualData: ChartDataPoint[] = [];
    let localForecastData: ChartDataPoint[] = [];
    
    if (endDate) {
      const endDateObj = new Date(endDate);
      endDateObj.setHours(0, 0, 0, 0); 
      const forecastStartDateObj = new Date(endDateObj);
      forecastStartDateObj.setMonth(forecastStartDateObj.getMonth() - 1);
      forecastStartDateObj.setHours(0, 0, 0, 0);
      const forecastCutoffDate = new Date(endDateObj);
      forecastCutoffDate.setDate(forecastCutoffDate.getDate() + 180);
      forecastCutoffDate.setHours(0, 0, 0, 0);
      
      // Corrected: Process actual data part
      localActualData = data.filter(item => {
          const itemDate = new Date(item.date);
          itemDate.setHours(0, 0, 0, 0);
          return itemDate <= endDateObj;
      }).map(item => ({
        ...item,
        // Forecast should be null for actual data part unless it's within the 1-month overlap pre-endDate
        forecast: new Date(item.date) >= forecastStartDateObj && new Date(item.date) <= endDateObj ? item.forecast : null,
        isForecast: false
      }));
      logOOSStatus('localActualData (after endDate filter)', localActualData);

      // Corrected: Process forecast data part
      localForecastData = data.filter(item => {
          const itemDate = new Date(item.date);
          itemDate.setHours(0, 0, 0, 0);
        return itemDate > endDateObj && itemDate <= forecastCutoffDate; // Forecast strictly AFTER endDate
      }).map(item => ({
        ...item,
        demand: null, // Demand is null for forecast part
        revenue: null, // Revenue is null for forecast part
        isForecast: true
      }));
      logOOSStatus('localForecastData (after endDate filter)', localForecastData);
      
      // Add overlapping forecast data for the month before endDate (if not already covered)
      const overlapForecastData = data.filter(item => {
        const itemDate = new Date(item.date);
          itemDate.setHours(0,0,0,0);
          // Data from forecast start up to and including end date, intended for forecast series
          return itemDate >= forecastStartDateObj && itemDate <= endDateObj;
      }).map(item => ({
          ...item, // Keep demand/revenue if it exists from raw data for this period
          isForecast: true // Mark as forecast to distinguish if it gets plotted on forecast line
      }));
      logOOSStatus('overlapForecastData (before endDate filter)', overlapForecastData);
      // Combine localForecastData and overlapForecastData, then add to localActualData later
      localForecastData = [...localForecastData, ...overlapForecastData];

    } else {
      localActualData = data.map(item => ({ ...item, isForecast: false }));
      logOOSStatus('localActualData (no endDate)', localActualData);
    }

    let combinedData = [...localActualData, ...localForecastData];
    const uniqueDataMap = new Map<string, ChartDataPoint>();
    combinedData.forEach(item => {
      const compositeKey = `${normalizeDate(item.date)}_${item.sku || "default"}`;
      const existingEntry = uniqueDataMap.get(compositeKey);
      
      if (!existingEntry) {
        uniqueDataMap.set(compositeKey, item);
      } else {
        // Prioritize actual data (isForecast: false)
        // If new item is actual and existing is forecast, replace.
        if (!item.isForecast && existingEntry.isForecast) {
          uniqueDataMap.set(compositeKey, item);
        } 
        // If both are actual or both are forecast, we need to merge if one has more info for OOS.
        // This part is tricky and might be where OOS gets lost. For now, the above handles distinct actual/forecast.
        // If item is forecast and existing is actual, do nothing (keep actual).
      }
    });
    combinedData = Array.from(uniqueDataMap.values());
    logOOSStatus('combinedData (post-dedupe)', combinedData);

    // Sort combinedData by date, then by SKU
    combinedData.sort((a, b) => {
      const dateComparison = new Date(a.date).getTime() - new Date(b.date).getTime();
      if (dateComparison !== 0) {
        return dateComparison;
      }
      // If dates are the same, sort by SKU (use "default" if SKU is undefined)
      const skuA = a.sku || "default";
      const skuB = b.sku || "default";
      return skuA.localeCompare(skuB);
    });

    let result;
    if (interval === 'weekly' || interval === 'monthly') {
      result = aggregateData(combinedData, interval === 'weekly' ? 7 : 30);
      const aggregatedOOSCheckDates = result.map(r => r.date); // For aggregated, check the resulting dates
      logOOSStatus(`Aggregated result (${interval})`, result.filter(r => r.out_of_stock === 1), aggregatedOOSCheckDates );
       // More specific log for aggregated data focusing on the payload
      const aggTargetSkuPoints = result.filter(p => p.sku === targetSkuForLog && p.out_of_stock === 1);
      if(aggTargetSkuPoints.length > 0) {
        console.log(`DemandForecastChart (Aggregated result (${interval}) PAYLOAD): OOS for ${targetSkuForLog}`, 
        aggTargetSkuPoints.map(p => ({ date: p.date, sku: p.sku, oos: p.out_of_stock, actual_oos_dates_in_payload: p.oos_dates })) );
      }

    } else { // Daily
      result = combinedData.map(item => ({ ...item, out_of_stock: item.out_of_stock === 1 ? 1 : 0 }));
      result.sort((a, b) => {
        const dateComparison = new Date(a.date).getTime() - new Date(b.date).getTime();
        if (dateComparison !== 0) {
          return dateComparison;
        }
        const skuA = a.sku || "default";
        const skuB = b.sku || "default";
        return skuA.localeCompare(skuB);
      });
      logOOSStatus('Daily result', result.filter(r => r.out_of_stock ===1));
    }
    
    if ((interval === 'weekly' || interval === 'monthly') && result) {
      result.sort((a, b) => {
        const dateComparison = new Date(a.date).getTime() - new Date(b.date).getTime();
        if (dateComparison !== 0) {
          return dateComparison;
        }
        const skuA = a.sku || "default";
        const skuB = b.sku || "default";
        return skuA.localeCompare(skuB);
      });
    }

    // Final check on the result being returned
    const finalOOSPoints = result.filter(p => p.sku === targetSkuForLog && p.out_of_stock === 1);
    if (finalOOSPoints.length > 0) {
      console.log(`DemandForecastChart (FINAL RESULT): OOS for ${targetSkuForLog}`, 
        finalOOSPoints.map(p => ({ date: p.date, sku: p.sku, oos: p.out_of_stock, actual_oos_dates: p.oos_dates }))
      );
    }
    const allFinalOOS = result.filter(p => p.out_of_stock ===1).map(p=> ({date: p.date, sku: p.sku, oos:p.out_of_stock}));
    if(allFinalOOS.length > 0) {
      console.log(`DemandForecastChart (FINAL RESULT): ALL OOS points`, allFinalOOS);
    }

    console.log('--- DemandForecastChart: processedData END ---');
    return result;
  }, [data, endDate, interval, normalizeDate]); // Added normalizeDate to dependencies

  // Calculate average based on selected metric
  const averageValue = useMemo(() => {
    if (!processedData || processedData.length === 0) return 0;
    // Ensure processedData is not undefined and has ChartDataPoint structure
    const relevantData = processedData.filter(p => p && (metric === 'quantity' ? p.demand : p.revenue) !== null);
    if (relevantData.length === 0) return 0;
    return relevantData.reduce((acc, point) => { 
      // `point` here is ChartDataPoint. Ensure no `im_sku` access.
        const value = metric === 'quantity' ? point.demand || 0 : point.revenue || 0;
      return acc + value;
    }, 0) / relevantData.length;
  }, [processedData, metric]);

  const forecastEndDate = useMemo(() => {
    if (!endDate) return null;
    const endDateObj = new Date(endDate);
    const forecastEndDateObj = new Date(endDateObj);
    forecastEndDateObj.setDate(forecastEndDateObj.getDate() + 180);
    return forecastEndDateObj.toISOString().split('T')[0];
  }, [endDate]);

  const forecastStartDate = useMemo(() => {
    if (!endDate) return null;
    const endDateObj = new Date(endDate);
    const forecastStartDateObj = new Date(endDateObj);
    forecastStartDateObj.setMonth(forecastStartDateObj.getMonth() - 1);
    return forecastStartDateObj.toISOString().split('T')[0];
  }, [endDate]);

  // Identify unique dates where out_of_stock is 1
  const outOfStockDates = useMemo(() => {
    if (!processedData || processedData.length === 0) {
       console.log('DemandForecastChart: outOfStockDates - processedData is empty, returning []');
       return [];
    }
    
    // Debug logging for processedData
    console.log('DemandForecastChart: First few processedData dates:', 
      processedData.slice(0, 5).map(d => d.date)
    );
    
    const oosDates = processedData
      .filter(point => {
          // Explicitly check if out_of_stock is exactly 1
          const isOOS = point.out_of_stock === 1;
          return isOOS;
      })
      .map(point => point.date);
    
    // Filter out any invalid dates
    const validOosDates = oosDates.filter(dateStr => {
      const date = new Date(dateStr);
      const isValid = !isNaN(date.getTime()); // Check if date is valid
      if (!isValid) {
        console.warn(`Invalid OOS date found: ${dateStr}`);
      }
      return isValid;
    });
    
    const uniqueOosDates = [...new Set(validOosDates)];
    console.log('DemandForecastChart: outOfStockDates derived:', uniqueOosDates);
    
    return uniqueOosDates;
  }, [processedData]);

  const formatXAxis = (date: string) => {
    const d = new Date(date);
    return d.toLocaleDateString('en-US', { year: 'numeric', month: 'short' });
  };

  const formatYAxis = (value: number) => {
    if (metric === 'revenue') {
      return `$${value.toLocaleString()}`;
    }
    return value.toLocaleString();
  };

  const getTotalFilterCount = (): number => {
    if (appliedFilters && Object.keys(appliedFilters).length > 0) {
      let total = 0;
      Object.values(appliedFilters).forEach((filters) => {
        if (Array.isArray(filters)) { total += filters.length; }
      });
      return total;
    }
    return selectedSkus.length;
  };

  const handleBrushChangeInternal = (brushData: any) => {
    if (brushData && brushData.startIndex !== undefined && brushData.endIndex !== undefined) {
      const startDate = processedData[brushData.startIndex]?.date;
      const endDate = processedData[brushData.endIndex]?.date;
      if (startDate && endDate && onBrushChange) {
        onBrushChange([startDate, endDate]);
      }
    } else if (onBrushChange) {
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
                    // Debug log to check data in tooltip
                    console.log('Tooltip dataPoint:', dataPoint);
                    
                    const actualValue = metric === 'quantity'
                      ? dataPoint.demand
                      : dataPoint.revenue;
                    const forecast = dataPoint.forecast;
                    const difference = (Number(actualValue) || 0) - (Number(forecast) || 0);
                    const percentageDiff = actualValue && forecast ? ((difference / Number(actualValue)) * 100).toFixed(2) : 0;
                    const lowerBound = dataPoint.lowerBound;
                    const upperBound = dataPoint.upperBound;
                    const outOfStock = dataPoint.out_of_stock !== null && dataPoint.out_of_stock !== undefined 
                      ? dataPoint.out_of_stock 
                      : null;
                    const oosDates = dataPoint.oos_dates;

                    // Round values to 5 decimal places if they are numeric
                    const formatValue = (val: any) => {
                      if (val === null || val === undefined) return '0';
                      return typeof val === 'number' ? Number(val).toFixed(4) : val;
                    };

                    return (
                      <div
                        style={{
                          backgroundColor: 'rgba(255, 255, 255, 0.95)',
                          border: '1px solid #f0f0f0',
                          padding: '12px',
                          borderRadius: '8px',
                          boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                          transition: 'all 0.3s ease',
                          minWidth: '280px',
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
                        {/* Always show category with default value when not available */}
                          <p style={{ margin: '0 0 5px 0', color: '#666', display: 'flex', justifyContent: 'space-between' }}>
                          <span style={{ fontWeight: '500' }}>Category:</span> 
                          <span>{dataPoint?.category || "All categories"}</span>
                          </p>
                        {/* Always show channel with default value when not available */}
                          <p style={{ margin: '0 0 5px 0', color: '#666', display: 'flex', justifyContent: 'space-between' }}>
                          <span style={{ fontWeight: '500' }}>Channel:</span> 
                          <span>{dataPoint?.channel || "All channels"}</span>
                          </p>
                        {/* Always show title with default value when not available */}
                          <p style={{ margin: '0 0 5px 0', color: '#666', display: 'flex', justifyContent: 'space-between' }}>
                          <span style={{ fontWeight: '500' }}>Title:</span> 
                          <span>{dataPoint?.title || "All titles"}</span>
                          </p>
                        {/* Always show SKU with default value when not available */}
                          <p style={{ margin: '0 0 5px 0', color: '#666', display: 'flex', justifyContent: 'space-between' }}>
                          <span style={{ fontWeight: '500' }}>SKU:</span> 
                          <span>{dataPoint?.sku || "All SKUs"}</span>
                          </p>
                        {/* Always show warehouse with default value when not available */}
                          <p style={{ margin: '0 0 5px 0', color: '#666', display: 'flex', justifyContent: 'space-between' }}>
                          <span style={{ fontWeight: '500' }}>Warehouse:</span> 
                          <span>{dataPoint?.warehouse || "All warehouses"}</span>
                          </p>
                        <div style={{ marginTop: '10px', paddingTop: '8px', borderTop: '1px solid #f0f0f0' }}>
                          <p style={{ margin: '0 0 5px 0', color: '#1677ff', display: 'flex', justifyContent: 'space-between' }}>
                            <span style={{ fontWeight: '500' }}>Actual {metric === 'quantity' ? 'Demand' : 'Revenue'}:</span> 
                            <span style={{ fontWeight: 'bold' }}>{metric === 'revenue' ? `$${formatValue(actualValue)}` : formatValue(actualValue)}</span>
                          </p>
                          <p style={{ margin: '0 0 5px 0', color: '#ff4d4f', display: 'flex', justifyContent: 'space-between' }}>
                            <span style={{ fontWeight: '500' }}>Forecast:</span> 
                            <span style={{ fontWeight: 'bold' }}>{metric === 'revenue' ? `$${formatValue(forecast)}` : formatValue(forecast)}</span>
                          </p>
                          <p style={{ margin: '0 0 5px 0', color: difference >= 0 ? '#52c41a' : '#912a2a', display: 'flex', justifyContent: 'space-between' }}>
                            <span style={{ fontWeight: '500' }}>Difference:</span>
                            <span style={{ fontWeight: 'bold' }}>{metric === 'revenue' ? `$${formatValue(difference)}` : formatValue(difference)} ({percentageDiff}%)</span>
                          </p>
                          <p style={{ margin: '0 0 5px 0', color: '#8884d8', display: 'flex', justifyContent: 'space-between' }}>
                            <span style={{ fontWeight: '500' }}>Lower Bound:</span>
                            <span style={{ fontWeight: 'bold' }}>{metric === 'revenue' ? `$${formatValue(lowerBound)}` : formatValue(lowerBound)}</span>
                          </p>
                          <p style={{ margin: '0 0 5px 0', color: '#8884d8', display: 'flex', justifyContent: 'space-between' }}>
                            <span style={{ fontWeight: '500' }}>Upper Bound:</span>
                            <span style={{ fontWeight: 'bold' }}>{metric === 'revenue' ? `$${formatValue(upperBound)}` : formatValue(upperBound)}</span>
                          </p>
                          {outOfStock !== null && (
                            <p style={{ margin: '0 0 5px 0', color: outOfStock > 0 ? '#262626' : '#434343', display: 'flex', justifyContent: 'space-between' }}>
                              <span style={{ fontWeight: '500' }}>Out of Stock:</span>
                              <span style={{ fontWeight: 'bold' }}>{outOfStock > 0 ? 'Yes' : 'No'}</span>
                            </p>
                          )}
                          {outOfStock > 0 && (
                            <p style={{ margin: '0 0 5px 0', color: '#262626', display: 'flex', justifyContent: 'space-between' }}>
                              <span style={{ fontWeight: '500' }}>OOS Date{interval !== 'daily' && oosDates && oosDates.length > 1 ? 's' : ''}:</span>
                              <span style={{ fontWeight: 'bold' }}>
                              {interval === 'daily' ? (
                                <p style={{ margin: '0 0 0 4px', fontSize: '11px', color: '#262626' }}>
                                  {new Date(label).toLocaleDateString('en-US', {year: 'numeric', month: 'short', day: 'numeric'})}
                                </p>
                              ) : oosDates && oosDates.length > 0 ? (
                                oosDates.map((oosDate: string, index: number) => (
                                  <p key={index} style={{ margin: '0 0 0 4px', fontSize: '11px', color: '#262626' }}>
                                    {new Date(oosDate).toLocaleDateString('en-US', {year: 'numeric', month: 'short', day: 'numeric'})}
                                  </p>
                                ))
                              ) : null}
                              </span>
                            </p>
                          )}
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
                onChange={handleBrushChangeInternal} // Use internal handler
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
              
              {/* New approach: Add a special OOS marker series */}
              <Line
                dataKey="out_of_stock"
                name="Out of Stock"
                stroke="transparent"
                dot={(props) => <CustomOOSDot {...props} chartHeight={chartRef.current?.clientHeight} />}
                isAnimationActive={false}
                // Ensure this line doesn't affect y-axis domain if values are only 0 or 1
                yAxisId={0} // Assuming your primary Y-axis has id 0 or is the default
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
};

export default DemandForecastChart;

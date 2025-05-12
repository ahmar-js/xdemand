'use client';

import * as React from 'react';
import Box from '@mui/material/Box';
import InputLabel from '@mui/material/InputLabel';
import Card from '@mui/material/Card';
import MenuItem from '@mui/material/MenuItem';
import FormControl from '@mui/material/FormControl';
import Select, { SelectChangeEvent } from '@mui/material/Select';
import { Chip, Stack, useTheme } from '@mui/material';
import Button from '@mui/material/Button';
import AdvanceFilterDialog from '../components/DemandForecast';
import TuneIcon from '@mui/icons-material/Tune';
import Typography from '@mui/material/Typography';
import CloseIcon from '@mui/icons-material/Close';
import TimeseriesChart from '../components/TimeSeriesForecast/index';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { useDemandForecastData } from '../hooks/useDemandForecast';
import { DemandDataPoint, ChartDataPoint } from '../services/demandForecastService';
import ForecastKPICard from '../components/DemandForecast/ForecastKPICard';
import { useKPIData, KPIDataParams } from '../hooks/useKPIData';
import ForecastingModel from '../components/ForecastingModel';

// Filter category types - should match with AdvanceFilterDialog component
type FilterCategory = 'Linn_Category' | 'Linn_Title' | 'Channel' | 'im_sku' | 'warehouse_code' | 'Company' | 'Region';

// Display names for the filter categories
const displayNames: Record<FilterCategory, string> = {
  'Linn_Category': 'Category',
  'Linn_Title': 'Title',
  'Channel': 'Channel',
  'im_sku': 'SKU',
  'warehouse_code': 'Warehouse',
  'Company': 'Company',
  'Region': 'Region'
};

// Disabled categories
const disabledCategories: FilterCategory[] = ['Linn_Title'];

export default function DemandForecastingView() {
  const theme = useTheme();
  const [metric, setMetric] = React.useState<string>('Quantity');
  const [aggregate, setAggregate] = React.useState<string>('Weekly');
  const [endDate, setEndDate] = React.useState<Date | null>(new Date('2025-02-15'));
  const [open, setOpen] = React.useState(false);
  // State to store applied filters
  const [appliedFilters, setAppliedFilters] = React.useState<Record<FilterCategory, string[]>>({
    Linn_Category: [],
    Linn_Title: [],
    Channel: [],
    im_sku: [],
    warehouse_code: [],
    Company: [],
    Region: []
  });

  // Add brush range state to store the selected date range
  const [brushRange, setBrushRange] = React.useState<[string, string] | null>(null);

  // Fetch forecast data using React Query with the selected metric
  const { data: forecastData, isLoading, error } = useDemandForecastData(
    metric.toLowerCase() as 'quantity' | 'revenue'
  );
  
  // State for filtered data
  const [filteredData, setFilteredData] = React.useState<any[]>([]);

  // State for filtered data by brush
  const [brushFilteredData, setBrushFilteredData] = React.useState<any[]>([]);

  // State for selected data point
  const [selectedDataPoint, setSelectedDataPoint] = React.useState<ChartDataPoint | null>(null);
  
  // Create API params state for KPI data
  const [kpiParams, setKpiParams] = React.useState<KPIDataParams | null>(null);
  
  // Use the KPI data hook
  const { 
    data: kpiData, 
    isLoading: isLoadingKpiData 
  } = useKPIData(kpiParams);

  // Handle brush change event from TimeSeriesChart
  const handleBrushChange = (range: [string, string] | null) => {
    setBrushRange(range);
    
    if (range && filteredData.length > 0) {
      // Filter data based on brush range
      const [startDate, endDate] = range;
      const startTimestamp = new Date(startDate).getTime();
      const endTimestamp = new Date(endDate).getTime();
      
      const brushData = filteredData.filter(item => {
        const itemTimestamp = new Date(item.date).getTime();
        return itemTimestamp >= startTimestamp && itemTimestamp <= endTimestamp;
      });
      
      setBrushFilteredData(brushData);
    } else {
      // If no range selected, use all filtered data
      setBrushFilteredData(filteredData);
    }
  };

  // When working with filter data, make sure we keep the original date fields intact
  React.useEffect(() => {
    if (!forecastData || forecastData.length === 0) {
      setFilteredData([]);
      return;
    }

    // If no filters are applied, show aggregated data by date
    const hasActiveFilters = Object.values(appliedFilters).some(filters => filters.length > 0);
    
    if (!hasActiveFilters) {
      // Aggregate data by date
      const aggregatedData = aggregateDataByDate(forecastData);
      setFilteredData(aggregatedData);
      return;
    }
    const apiUrl = process.env.NEXT_PUBLIC_BACKEND_URL;

    // Otherwise, fetch filtered data from the backend
    fetch(`${apiUrl}/csv-to-json`)
      .then(response => {
        if (!response.ok) {
          throw new Error('Failed to fetch data');
        }
        return response.json();
      })
      .then((rawData: DemandDataPoint[]) => {
        // Filter the raw data based on applied filters
        const filtered = rawData.filter(item => {
          // Check if item matches all applied filters
          return Object.entries(appliedFilters).every(([category, values]) => {
            // Skip categories with no filters
            if (values.length === 0) return true;
            
            // For each category, check if the item matches any of the filter values
            const categoryKey = category as keyof DemandDataPoint;
            const itemValue = String(item[categoryKey] || '');
            return values.some(value => itemValue === value);
          });
        });
        
        // Transform filtered raw data to chart format based on the current metric
        const processedData = filtered.map(item => {
          // First check and standardize out_of_stock to ensure it's truly binary
          // If it's any non-zero value, set it to 1, otherwise 0
          const outOfStockValue = item.out_of_stock ? 1 : 0;
          
          if (metric.toLowerCase() === 'revenue') {
            return {
              date: item.Date,
              demand: null, // Not used for revenue chart
              revenue: item.revenue,
              forecast: item.for_rev_yhat,
              lowerBound: item.for_rev_yhat_lower ?? 0,
              upperBound: item.for_rev_yhat_upper ?? 0,
              category: item.Linn_Category,
              title: item.Linn_Title,
              sku: item.im_sku,
              warehouse: item.warehouse_code,
              channel: item.Channel,
              for_rev_trend: item.for_rev_trend ?? 0,
              for_rev_weekly: item.for_rev_weekly ?? 0,
              for_rev_yearly: item.for_rev_yearly ?? 0,
              out_of_stock: outOfStockValue
            };
          } else {
            return {
              date: item.Date,
              demand: item.Quantity,
              forecast: item.for_qty_yhat,
              lowerBound: item.for_qty_yhat_lower ?? 0,
              upperBound: item.for_qty_yhat_upper ?? 0,
              revenue: item.revenue,
              category: item.Linn_Category,
              title: item.Linn_Title,
              sku: item.im_sku,
              warehouse: item.warehouse_code,
              channel: item.Channel,
              for_qty_trend: item.for_qty_trend ?? 0,
              for_qty_weekly: item.for_qty_weekly ?? 0,
              for_qty_yearly: item.for_qty_yearly ?? 0,
              out_of_stock: outOfStockValue
            };
          }
        });
        
        // Log to verify the data has the correct out_of_stock values
        console.log('Processed data before setting to state:', 
          processedData.filter(item => item.date === '2024-06-02')
        );
        
        setFilteredData(processedData);
      })
      .catch(error => {
        console.error('Error filtering data:', error);
      });
  }, [forecastData, appliedFilters, metric]);

  // Function to aggregate data by date
  const aggregateDataByDate = (data: ChartDataPoint[]): ChartDataPoint[] => {
    // Create a map to store aggregated data by date
    const dateMap: Record<string, any> = {};
    
    // First pass: create entries and collect out_of_stock information
    // We'll use a separate structure to track which dates have out_of_stock=1
    const datesWithOutOfStock = new Set<string>();
    
    // Group data by date and aggregate values
    data.forEach(item => {
      const date = item.date;
      
      // Check for out_of_stock and add to our tracking set if it's true (1)
      if (item.out_of_stock) {
        datesWithOutOfStock.add(date);
      }
      
      if (!dateMap[date]) {
        // Initialize aggregated item with zeros
        dateMap[date] = {
          date,
          demand: 0,
          revenue: 0,
          forecast: 0,
          lowerBound: 0,
          upperBound: 0,
          for_qty_trend: 0,
          for_qty_weekly: 0,
          for_qty_yearly: 0,
          for_rev_trend: 0,
          for_rev_weekly: 0,
          for_rev_yearly: 0,
          count: 0 // Counter for averaging
        };
      }
      
      // Sum up all numeric values
      if (item.demand !== null) dateMap[date].demand += Number(item.demand);
      if (item.revenue !== null) dateMap[date].revenue += Number(item.revenue);
      if (item.forecast !== null) dateMap[date].forecast += Number(item.forecast);
      if (item.lowerBound !== null) dateMap[date].lowerBound += Number(item.lowerBound);
      if (item.upperBound !== null) dateMap[date].upperBound += Number(item.upperBound);
      
      // Sum up model components
      if (item.for_qty_trend !== undefined) dateMap[date].for_qty_trend += Number(item.for_qty_trend || 0);
      if (item.for_qty_weekly !== undefined) dateMap[date].for_qty_weekly += Number(item.for_qty_weekly || 0);
      if (item.for_qty_yearly !== undefined) dateMap[date].for_qty_yearly += Number(item.for_qty_yearly || 0);
      if (item.for_rev_trend !== undefined) dateMap[date].for_rev_trend += Number(item.for_rev_trend || 0);
      if (item.for_rev_weekly !== undefined) dateMap[date].for_rev_weekly += Number(item.for_rev_weekly || 0);
      if (item.for_rev_yearly !== undefined) dateMap[date].for_rev_yearly += Number(item.for_rev_yearly || 0);
      
      // Increment counter
      dateMap[date].count++;
    });
    
    // Calculate averages and convert back to array
    return Object.entries(dateMap).map(([date, item]) => {
      const count = item.count;
      return {
        date,
        demand: item.demand / count,
        revenue: item.revenue / count,
        forecast: item.forecast / count,
        lowerBound: item.lowerBound / count,
        upperBound: item.upperBound / count,
        for_qty_trend: item.for_qty_trend / count,
        for_qty_weekly: item.for_qty_weekly / count,
        for_qty_yearly: item.for_qty_yearly / count,
        for_rev_trend: item.for_rev_trend / count,
        for_rev_weekly: item.for_rev_weekly / count,
        for_rev_yearly: item.for_rev_yearly / count,
        // Set out_of_stock to 1 if this date is in our tracking set, otherwise 0
        out_of_stock: datesWithOutOfStock.has(date) ? 1 : 0
      };
    }).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  };

  // Update brush filtered data when filtered data changes
  React.useEffect(() => {
    if (brushRange && filteredData.length > 0) {
      // Apply brush filter
      const [startDate, endDate] = brushRange;
      const startTimestamp = new Date(startDate).getTime();
      const endTimestamp = new Date(endDate).getTime();
      
      const brushData = filteredData.filter(item => {
        const itemTimestamp = new Date(item.date).getTime();
        return itemTimestamp >= startTimestamp && itemTimestamp <= endTimestamp;
      });
      
      setBrushFilteredData(brushData);
    } else {
      // If no brush range, use all filtered data
      setBrushFilteredData(filteredData);
    }
  }, [filteredData, brushRange]);

  const handleClickOpen = () => {
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
  };

  // Handle applying filters from dialog
  const handleApplyFilters = (selectedFilters: Record<FilterCategory, string[]>) => {
    // Ensure disabled categories are not applied
    const sanitizedFilters = { ...selectedFilters };
    disabledCategories.forEach(category => {
      sanitizedFilters[category] = [];
    });
    
    setAppliedFilters(sanitizedFilters);
  };

  // Handle removing a single filter
  const handleRemoveFilter = (category: FilterCategory, value: string) => {
    setAppliedFilters((prev) => ({
      ...prev,
      [category]: prev[category].filter((item) => item !== value)
    }));
  };

  // Handle clearing all filters
  const handleClearAllFilters = () => {
    setAppliedFilters({
      Linn_Category: [],
      Linn_Title: [],
      Channel: [],
      im_sku: [],
      warehouse_code: [],
      Company: [],
      Region: []
    });
  };

  // Get total number of applied filters
  const getTotalFilterCount = (): number => {
    return Object.values(appliedFilters).reduce((total, filters) => total + filters.length, 0);
  };

  const handleMetricChange = (event: SelectChangeEvent) => {
    setMetric(event.target.value as string);
  };

  const handleAggregateChange = (event: SelectChangeEvent) => {
    setAggregate(event.target.value as string);
  };

  const handleEndDateChange = (date: Date | null) => {
    setEndDate(date);
  };

  // Get a dynamic chart title based on selected filters
  const getChartTitle = (): string => {
    const selectedSkus = appliedFilters["im_sku"];
    
    // If no SKUs are selected, return the default title
    if (!selectedSkus || selectedSkus.length === 0) {
      return "Demand Forecast";
    }
    
    // If one SKU is selected, show it in the title
    if (selectedSkus.length === 1) {
      return `Demand Forecast for SKU ${selectedSkus[0]}`;
    }
    
    // If two SKUs are selected, show both
    if (selectedSkus.length === 2) {
      return `Demand Forecast for SKUs ${selectedSkus[0]} & ${selectedSkus[1]}`;
    }
    
    // If more than two are selected, show the first one and the count
    return `Demand Forecast for SKU ${selectedSkus[0]} & ${selectedSkus.length - 1} more`;
  };

  // Handle data point click in the chart
  const handleDataPointClick = (dataPoint: ChartDataPoint) => {
    setSelectedDataPoint(dataPoint);
    
    // NEW VALIDATION LOGIC:
    // For Quantity: If forecast value exists, but demand is 0/null, still update KPI
    // For Revenue: If forecast value exists, but revenue is 0/null, still update KPI
    const isForecastValid = metric === 'Quantity' 
      ? dataPoint.forecast !== null && dataPoint.forecast !== 0
      : dataPoint.forecast !== null && dataPoint.forecast !== 0;
      
    // If forecast data is invalid, don't update KPI
    if (!isForecastValid) {
      console.log('Invalid forecast data, not updating KPI:', dataPoint);
      return;
    }
    
    // Prepare params for API call
    const params: KPIDataParams = {
      metric: metric === 'Quantity' ? 'Quantity' : 'revenue',
      // Format the date as YYYY-MM-DD to ensure consistency
      end_date: new Date(dataPoint.date).toISOString().split('T')[0],
      aggregation: aggregate.toLowerCase(),
      // Always provide these fields, even if empty
      im_sku: appliedFilters.im_sku.length > 0 ? appliedFilters.im_sku : [],
      warehouse_code: appliedFilters.warehouse_code.length > 0 ? appliedFilters.warehouse_code[0] : '',
      // Initialize all required fields with default values
      Quantity: 0,
      revenue: 0,
      for_qty_yhat: 0,
      for_rev_yhat: 0
    };
    
    // Update with actual values if they exist
    if (metric === 'Quantity') {
      params.Quantity = dataPoint.demand !== null ? Number(dataPoint.demand) : 0;
      params.for_qty_yhat = dataPoint.forecast !== null ? Number(dataPoint.forecast) : 0;
    } else {
      params.revenue = dataPoint.revenue !== null ? Number(dataPoint.revenue) : 0;
      params.for_rev_yhat = dataPoint.forecast !== null ? Number(dataPoint.forecast) : 0;
    }
    
    console.log('KPI API params:', params);
    
    // Update API params to trigger the query
    setKpiParams(params);
  };

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns}>
      <Box sx={{ display: 'flex', flexDirection: 'row', alignItems: 'center', gap: 2 }}>
        <Card sx={{ px: 2, py: 0.5 }}>
          <FormControl variant="standard" sx={{ m: 1, minWidth: 120 }}>
            <InputLabel id="metric-label-id">Metric</InputLabel>
            <Select labelId="metric-label-id" id="metric-select-menu" value={metric} onChange={handleMetricChange} label="Metric">
              <MenuItem value="Quantity">Quantity</MenuItem>
              <MenuItem value="Revenue">Revenue</MenuItem>
            </Select>
          </FormControl>
        </Card>
        {/* Metric Select */}

        {/* Aggregate Level Select */}
        <Card sx={{ px: 2, py: 0.5 }}>
          <FormControl variant="standard" sx={{ m: 1, minWidth: 170 }}>
            <InputLabel id="aggregate-label-id">Aggregate Level</InputLabel>
            <Select
              labelId="aggregate-label-id"
              id="aggregate-select-menu"
              value={aggregate}
              onChange={handleAggregateChange}
              label="Aggregate Level"
            >
              <MenuItem value="Daily">Daily</MenuItem>
              <MenuItem value="Weekly">Weekly</MenuItem>
              <MenuItem value="Monthly">Monthly</MenuItem>
            </Select>
          </FormControl>
        </Card>

        {/* End Date Select */}
        <Card sx={{ px: 2, py: 0.5 }}>
          <FormControl variant="standard" sx={{ m: 1, minWidth: 170 }}>
            <DatePicker
              label="End Date"
              value={endDate}
              onChange={handleEndDateChange}
              slotProps={{
                textField: {
                  variant: 'standard',
                  fullWidth: true
                }
              }}
            />
          </FormControl>
        </Card>
      </Box>

      <Box>
        <Card sx={{ maxWidth: '100%', mt: 4, p: 1 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <TuneIcon />
            <Typography variant="body1" sx={{ fontWeight: 'bold' }}>
              Filter by
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', ml: 2, gap: 1 }}>
              <Button
                variant="outlined"
                onClick={handleClickOpen}
                size="small"
                sx={{
                  border: '.5px dotted #b3b3b3',
                  color: '#b3b3b3',
                  fontSize: '.7rem'
                }}
              >
                {getTotalFilterCount() > 0 ? 'Change filters' : 'Add filters'}
              </Button>

              {/* Display applied filters as chips */}
              {getTotalFilterCount() > 0 && (
                <Stack direction="row" spacing={1} sx={{ ml: 2, flexWrap: 'wrap', gap: 1, alignItems: 'center' }}>
                  {Object.entries(appliedFilters).map(([category, values]) => {
                    // Only render categories with selected values
                    if (values.length === 0) return null;

                    // Get the display name for this category
                    const displayName = displayNames[category as FilterCategory];

                    // Display format: "Category: item1, item2 ... +X more"
                    const MAX_DISPLAY_ITEMS = 2;
                    let chipLabel = '';

                    if (values.length <= MAX_DISPLAY_ITEMS) {
                      // Show all items if there are few enough
                      chipLabel = `<strong>${displayName}</strong>: ${values.join(', ')}`;
                    } else {
                      // Show first few items + count of remaining
                      const displayItems = values.slice(0, MAX_DISPLAY_ITEMS);
                      const remainingCount = values.length - MAX_DISPLAY_ITEMS;
                      chipLabel = `<strong>${displayName}</strong>: ${displayItems.join(', ')} ... +${remainingCount} more`;
                    }

                    return (
                      <Chip
                        key={`${category}-chip`}
                        label={<span dangerouslySetInnerHTML={{ __html: chipLabel }} />}
                        size="small"
                        onDelete={() => {
                          // Clear all items in this category
                          setAppliedFilters((prev) => ({
                            ...prev,
                            [category]: []
                          }));
                        }}
                        deleteIcon={<CloseIcon fontSize="small" />}
                        sx={{
                          borderRadius: '4px',
                          backgroundColor: theme.palette.primary.light + '20',
                          color: theme.palette.primary.main,
                          '& .MuiChip-deleteIcon': {
                            color: theme.palette.primary.main
                          },
                          maxWidth: '300px',
                          '& .MuiChip-label': {
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap'
                          }
                        }}
                      />
                    );
                  })}

                  {/* Clear all filters button */}
                  {getTotalFilterCount() > 0 && (
                    <Button size="small" variant="text" onClick={handleClearAllFilters} sx={{ ml: 1, fontSize: '0.75rem' }}>
                      Clear all
                    </Button>
                  )}
                </Stack>
              )}
            </Box>
          </Box>
        </Card>
      </Box>

      <AdvanceFilterDialog handleClose={handleClose} open={open} title={'Add Filters'} onApplyFilters={handleApplyFilters} />

      {/* Show KPI cards for all intervals */}
      <ForecastKPICard 
        data={brushFilteredData.length > 0 ? brushFilteredData : filteredData} 
        metric={metric.toLowerCase() as 'quantity' | 'revenue'}
        apiData={kpiData}
        isLoadingApiData={isLoadingKpiData}
        selectedDataPoint={selectedDataPoint}
      />

      <div style={{ marginTop: '20px' }}>
        <TimeseriesChart
          data={filteredData || []}
          interval={aggregate.toLowerCase() as 'daily' | 'weekly' | 'monthly'}
          metric={metric.toLowerCase() as 'quantity' | 'revenue'}
          endDate={endDate?.toISOString().split('T')[0]}
          isLoading={isLoading || (filteredData.length === 0 && Object.values(appliedFilters).some(f => f.length > 0))}
          error={error as Error}
          selectedSkus={appliedFilters["im_sku"]}
          appliedFilters={appliedFilters}
          onDataPointClick={handleDataPointClick}
          onBrushChange={handleBrushChange}
        />
      </div>

      {/* Render the ForecastingModel component with props */}
      <ForecastingModel 
        data={brushFilteredData.length > 0 ? brushFilteredData : filteredData}
        interval={aggregate.toLowerCase() as 'daily' | 'weekly' | 'monthly'}
        metric={metric.toLowerCase() as 'quantity' | 'revenue'}
        isLoading={isLoading || (filteredData.length === 0 && Object.values(appliedFilters).some(f => f.length > 0))}
        selectedSkus={appliedFilters["im_sku"]}
        appliedFilters={appliedFilters}
      />

    </LocalizationProvider>
  );
}

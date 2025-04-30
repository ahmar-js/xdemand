import axios from 'axios';

// Define interface for the data points from the API
export interface DemandDataPoint {
  Date: string;
  im_sku: string;
  warehouse_code: string;
  Linn_Category: string;
  Linn_Title: string;
  Channel: string;
  Quantity: number | null;
  revenue: number | null;
  for_rev_yhat: number | null;
  for_rev_yhat_lower: number | null;
  for_rev_yhat_upper: number | null;
  for_rev_trend: number | null;
  for_rev_weekly: number | null;
  for_rev_yearly: number | null;
  for_qty_yhat: number | null;
  for_qty_yhat_lower: number | null;
  for_qty_yhat_upper: number | null;
  for_qty_trend: number | null;
  for_qty_weekly: number | null;
  for_qty_yearly: number | null;
  out_of_stock: number | null;
  Company: string | null;
  Region: string | null;
}

// Interface for processed data to be used in the chart
export interface ChartDataPoint {
  date: string;
  demand: number | null; // Actual quantity
  forecast: number | null; // Forecasted quantity or revenue
  lowerBound: number; // Lower bound of forecast
  upperBound: number; // Upper bound of forecast
  revenue: number | null; // Actual revenue
  category?: string; // Category (Linn_Category)
  title?: string; // Title (Linn_Title)
  sku?: string; // SKU (im_sku)
  warehouse?: string; // Warehouse (warehouse_code)
  channel?: string; // Sales channel
  isForecast?: boolean; // Flag to identify if this is a forecast data point
  for_qty_trend?: number | null;
  for_qty_weekly?: number | null;
  for_qty_yearly?: number | null;
  for_rev_trend?: number | null;
  for_rev_weekly?: number | null;
  for_rev_yearly?: number | null;
}

// Helper to convert API data to chart format
export const processApiData = (data: DemandDataPoint[]): ChartDataPoint[] => {
  return data.map(item => ({
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
    for_qty_trend: item.for_qty_trend,
    for_qty_weekly: item.for_qty_weekly,
    for_qty_yearly: item.for_qty_yearly
  }));
};

// Helper to process data for revenue chart
export const processApiDataForRevenue = (data: DemandDataPoint[]): ChartDataPoint[] => {
  return data.map(item => ({
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
    for_rev_trend: item.for_rev_trend,
    for_rev_weekly: item.for_rev_weekly,
    for_rev_yearly: item.for_rev_yearly
  }));
};

// Helper to get unique values for a field (for filtering)
export const getUniqueValues = (data: DemandDataPoint[], field: keyof DemandDataPoint): string[] => {
  const uniqueValues = new Set<string>();
  
  data.forEach(item => {
    const value = item[field];
    if (value !== undefined && value !== null && value !== 'NaN' && !Number.isNaN(value)) {
      uniqueValues.add(String(value));
    }
  });
  
  return Array.from(uniqueValues).sort();
};

// Fetch data from the API
export const fetchDemandForecastData = async (metric: 'quantity' | 'revenue'): Promise<ChartDataPoint[]> => {
  try {
    // tell axios to expect JSON
    const response = await axios.get<DemandDataPoint[]>(
      'http://127.0.0.1:5000/csv-to-json',
      { responseType: 'json' }
    )

    // If for some reason you still get a string, parse it
    const raw = response.data
    const arr: any[] = typeof raw === 'string'
      ? JSON.parse(raw)
      : raw

    console.log("raw", raw);
    if (!Array.isArray(arr)) {
      console.error('API response is not an array:', arr)
      throw new Error('Invalid data format from API')
    }

    // Process data based on the metric
    return metric === 'quantity' 
      ? processApiData(arr)
      : processApiDataForRevenue(arr);
  } catch (err) {
    console.error('Error fetching demand forecast data:', err)
    throw err
  }
}
import { useQuery } from '@tanstack/react-query';
import { fetchDemandForecastData, ChartDataPoint } from '../services/demandForecastService';

// Define the query key for demand forecast data
export const DEMAND_FORECAST_QUERY_KEY = ['demandForecast'];

// Hook to fetch demand forecast data
export const useDemandForecastData = (metric: 'quantity' | 'revenue' = 'quantity') => {
  return useQuery<ChartDataPoint[], Error>({
    queryKey: [...DEMAND_FORECAST_QUERY_KEY, metric],
    queryFn: () => fetchDemandForecastData(metric),
    retry: 2,
    refetchOnWindowFocus: false,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  });
}; 
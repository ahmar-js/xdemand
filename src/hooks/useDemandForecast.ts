import { useQuery } from '@tanstack/react-query';
import { fetchDemandForecastData, ChartDataPoint } from '../services/demandForecastService';

// Define the query key for demand forecast data
export const DEMAND_FORECAST_QUERY_KEY = ['demandForecast'];

// Hook to fetch demand forecast data
export const useDemandForecastData = (metric: 'quantity' | 'revenue' = 'quantity') => {
  return useQuery<ChartDataPoint[], Error>({
    queryKey: [...DEMAND_FORECAST_QUERY_KEY, metric],
    queryFn: async () => {
      const data = await fetchDemandForecastData(metric);
      
      // Log data to check if out_of_stock is present
      console.log('Raw data from fetchDemandForecastData:', data.slice(0, 3));
      
      // Check if any items have out_of_stock === 1
      const hasOutOfStock = data.some(item => item.out_of_stock === 1);
      console.log('Do any items have out_of_stock === 1?', hasOutOfStock);
      
      // If we find any June 2 data, log it specifically
      const june2Data = data.filter(item => item.date === '2024-06-02');
      if (june2Data.length > 0) {
        console.log('useDemandForecastData: June 2, 2024 data', june2Data);
      }
      
      return data;
    },
    retry: 2,
    refetchOnWindowFocus: false,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  });
}; 
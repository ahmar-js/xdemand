import { useQuery } from '@tanstack/react-query';
import axios from 'axios';

// Define the query key for KPI data
export const KPI_DATA_QUERY_KEY = 'kpiData';

// Define the parameters type
export interface KPIDataParams {
  metric: 'Quantity' | 'revenue';
  end_date: string;
  im_sku: string[];
  aggregation: string;
  revenue: number;
  Quantity: number;
  for_qty_yhat: number;
  for_rev_yhat: number;
  warehouse_code: string;
}

// Define the KPI data response type
export interface KPIDataResponse {
  daily: { kpi_pct: number };
  weekly: { kpi_pct: number };
  monthly: { kpi_pct: number };
  quarterly: { kpi_pct: number };
  end_date: string;
}

// Function to fetch KPI data
export const fetchKPIData = async (params: KPIDataParams): Promise<KPIDataResponse> => {
  try {
    const apiUrl = process.env.NEXT_PUBLIC_BACKEND_URL;
    const response = await axios.post(`${apiUrl}/kpi-cards`, params);
    return response.data;
  } catch (error) {
    console.error('Error fetching KPI data:', error);
    throw error;
  }
};

// Hook to fetch KPI data
export const useKPIData = (params: KPIDataParams | null) => {
  return useQuery<KPIDataResponse, Error>({
    queryKey: [KPI_DATA_QUERY_KEY, params],
    queryFn: () => fetchKPIData(params!),
    enabled: !!params, // Only fetch when params are available
    refetchOnWindowFocus: false,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}; 
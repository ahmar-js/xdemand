export interface ChartData {
  date?: string;
  month?: string;
  [key: string]: any;
}

export interface KPICardData {
  title: string;
  value: string;
  icon: React.ReactNode;
  color: string;
  data: ChartData[];
  onClick?: () => void;
  dataKey?: string;
  xAxisKey?: string;
}

export interface DashboardData {
  forecastedSales: KPICardData;
  outOfStock: KPICardData;
  overstocked: KPICardData;
  salesLoss: KPICardData;
} 
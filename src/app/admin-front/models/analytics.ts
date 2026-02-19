export interface DateRange {
  from: Date;
  to: Date;
}

export interface MetricCard {
  value: number;
  change: number;
  isPositive: boolean;
  comparisonText: string;
}

export interface AnalyticsCardsData {
  dailySales: MetricCard;
  totalOrders: MetricCard;
  avgTicket: MetricCard;
  avgTableTime: MetricCard;
}

export interface LiveMetricsData {
  activeOrders: number;
  occupiedTables: number;
  totalTables: number;
  ordersInKitchen: number;
  readyToServe: number;
  lastHourSales: number;
}

export interface SalesTrendDataPoint {
  date: string;
  amount: number;
}

export interface SalesTrendData {
  data: SalesTrendDataPoint[];
  changePercentage: number;
  comparisonText: string;
}

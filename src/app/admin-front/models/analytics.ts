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

export interface DateRange {
  from: Date;
  to: Date;
}

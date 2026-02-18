import { Component, signal } from '@angular/core';
import { DateRange } from '../../models/analytics';
import { getDefaultDateRange } from '../../../utils/date-range';
import { MetricsHeader } from './metrics-header/metrics-header';
import { LiveMetricsBar } from './live-metrics-bar/live-metrics-bar';
import { MetricsCard } from './metrics-card/metrics-card';
import { SalesTrendChart } from './sales-trend-chart/sales-trend-chart';

@Component({
  selector: 'app-analytics',
  imports: [MetricsHeader, LiveMetricsBar, MetricsCard, SalesTrendChart],
  templateUrl: './analytics-page.html',
})
export class AnalyticsPage {

  private defaultDateRange = getDefaultDateRange();

  currentDateRange = signal<DateRange>(this.defaultDateRange);

  onDateRangeChange(range: DateRange) {
    this.currentDateRange.set(range);
  }

  onRefresh() {
    console.log('Refrescando datos para:', this.currentDateRange());
    // rxResource recargará automáticamente
  }

  onExport() {
    console.log('Exportando datos para:', this.currentDateRange());
    // Implementar exportación
  }
}

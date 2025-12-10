import { Component, signal } from '@angular/core';
import { DateRange } from '../../models/analytics';
import { getDefaultDateRange } from '../../../utils/date-range';
import { MetricsHeader } from './metrics-header/metrics-header';
import { LiveMetricsBar } from './live-metrics-bar/live-metrics-bar';
import { MetricsCard } from './metrics-card/metrics-card';

@Component({
  selector: 'app-analytics',
  standalone: true,
  imports: [MetricsHeader, LiveMetricsBar, MetricsCard],
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

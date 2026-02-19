import { Component, output, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { LucideAngularModule } from 'lucide-angular';
import {
  ChartColumnIncreasing,
  RefreshCcw,
  Download
} from 'lucide-angular';
import { DateRange } from '../../../models/analytics';

@Component({
  selector: 'app-metrics-header',
  standalone: true,
  imports: [LucideAngularModule, CommonModule, FormsModule],
  templateUrl: './metrics-header.html',
})
export class MetricsHeader {

  readonly chartColumnIncreasingIcon = ChartColumnIncreasing;
  readonly refreshIcon = RefreshCcw;
  readonly downloadIcon = Download;

  // Outputs
  dateRangeChange = output<DateRange>();
  refresh = output<void>();
  export = output<void>();

  // Signal para trackear el filtro activo
  activeFilter = signal<string>('30d'); // Por defecto 30 días

  // Valores por defecto: últimos 30 días
  fromDate: string = this.getDefaultFromDate();
  toDate: string = this.getTodayDate();

  onDateChange() {
    // Cuando el usuario cambia manualmente las fechas, marcar como "custom"
    this.activeFilter.set('custom');

    if (this.fromDate && this.toDate) {
      const from = new Date(this.fromDate);
      const to = new Date(this.toDate);

      // Asegurarse de que 'from' sea inicio del día y 'to' sea fin del día
      from.setHours(0, 0, 0, 0);
      to.setHours(23, 59, 59, 999);

      this.dateRangeChange.emit({ from, to });
    }
  }

  onRefresh() {
    this.refresh.emit();
  }

  onExport() {
    this.export.emit();
  }

  // Shortcuts para rangos comunes
  setToday() {
    this.activeFilter.set('today');
    this.toDate = this.getTodayDate();
    this.fromDate = this.getTodayDate();
    this.emitDateRange();
  }

  setLast7Days() {
    this.activeFilter.set('7d');
    this.toDate = this.getTodayDate();
    this.fromDate = this.getDateDaysAgo(7);
    this.emitDateRange();
  }

  setLast30Days() {
    this.activeFilter.set('30d');
    this.toDate = this.getTodayDate();
    this.fromDate = this.getDateDaysAgo(30);
    this.emitDateRange();
  }

  setLast90Days() {
    this.activeFilter.set('90d');
    this.toDate = this.getTodayDate();
    this.fromDate = this.getDateDaysAgo(90);
    this.emitDateRange();
  }

  setThisMonth() {
    this.activeFilter.set('thisMonth');
    const now = new Date();
    const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
    this.fromDate = firstDay.toISOString().split('T')[0];
    this.toDate = this.getTodayDate();
    this.emitDateRange();
  }

  setLastMonth() {
    this.activeFilter.set('lastMonth');
    const now = new Date();
    const firstDayLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const lastDayLastMonth = new Date(now.getFullYear(), now.getMonth(), 0);

    this.fromDate = firstDayLastMonth.toISOString().split('T')[0];
    this.toDate = lastDayLastMonth.toISOString().split('T')[0];
    this.emitDateRange();
  }

  // Método privado para emitir el rango de fechas
  private emitDateRange() {
    if (this.fromDate && this.toDate) {
      const from = new Date(this.fromDate);
      const to = new Date(this.toDate);
      from.setHours(0, 0, 0, 0);
      to.setHours(23, 59, 59, 999);
      this.dateRangeChange.emit({ from, to });
    }
  }

  // Helpers
  private getTodayDate(): string {
    return new Date().toISOString().split('T')[0];
  }

  private getDefaultFromDate(): string {
    return this.getDateDaysAgo(30);
  }

  private getDateDaysAgo(days: number): string {
    const date = new Date();
    date.setDate(date.getDate() - days);
    return date.toISOString().split('T')[0];
  }
}

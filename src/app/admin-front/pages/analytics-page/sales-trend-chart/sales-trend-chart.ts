import { Component, input, computed, inject, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { rxResource } from '@angular/core/rxjs-interop';
import { LucideAngularModule, TrendingUp, TrendingDown } from 'lucide-angular';
import {
  NgApexchartsModule,
  ChartComponent,
  ApexAxisChartSeries,
  ApexChart,
  ApexXAxis,
  ApexYAxis,
  ApexDataLabels,
  ApexTooltip,
  ApexStroke,
  ApexGrid,
  ApexFill
} from 'ng-apexcharts';
import { DateRange } from '../../../models/analytics';
import { AnalyticsService } from '../../../services/analytics-service';

export type ChartOptions = {
  series: ApexAxisChartSeries;
  chart: ApexChart;
  xaxis: ApexXAxis;
  yaxis: ApexYAxis;
  dataLabels: ApexDataLabels;
  tooltip: ApexTooltip;
  stroke: ApexStroke;
  grid: ApexGrid;
  fill: ApexFill;
  colors: string[];
};

@Component({
  selector: 'app-sales-trend-chart',
  standalone: true,
  imports: [CommonModule, LucideAngularModule, NgApexchartsModule],
  templateUrl: './sales-trend-chart.html',
})
export class SalesTrendChart {

  @ViewChild("chart") chart!: ChartComponent;

  private analyticsService = inject(AnalyticsService);

  dateRange = input.required<DateRange>();

  readonly trendingUpIcon = TrendingUp;
  readonly trendingDownIcon = TrendingDown;

  salesTrendData = rxResource({
    params: () => this.dateRange(),
    stream: ({ params }) => {
      return this.analyticsService.getSalesTrend(params);
    }
  });

  // Chart options
  chartOptions = computed<ChartOptions>(() => {
    const data = this.salesTrendData.value();

    if (!data || data.data.length === 0) {
      return this.getDefaultChartOptions();
    }

    const categories = data.data.map(d => this.formatDate(d.date));
    const seriesData = data.data.map(d => d.amount);

    return {
      series: [{
        name: 'Ventas',
        data: seriesData
      }],
      chart: {
        type: 'area',
        height: 350,
        fontFamily: 'Inter, sans-serif',
        toolbar: {
          show: false
        },
        zoom: {
          enabled: false
        },
        animations: {
          enabled: true,
          easing: 'easeinout',
          speed: 800,
          animateGradually: {
            enabled: true,
            delay: 150
          },
          dynamicAnimation: {
            enabled: true,
            speed: 350
          }
        }
      },
      colors: ['#3b82f6'],
      stroke: {
        curve: 'smooth',
        width: 3
      },
      fill: {
        type: 'gradient',
        gradient: {
          shadeIntensity: 1,
          opacityFrom: 0.6,
          opacityTo: 0.1,
          stops: [0, 90, 100]
        }
      },
      dataLabels: {
        enabled: false
      },
      xaxis: {
        categories: categories,
        labels: {
          style: {
            colors: '#6b7280',
            fontSize: '12px'
          },
          rotate: -45,
          rotateAlways: false
        },
        axisBorder: {
          show: false
        },
        axisTicks: {
          show: false
        }
      },
      yaxis: {
        labels: {
          style: {
            colors: '#6b7280',
            fontSize: '12px'
          },
          formatter: (value) => {
            if (value >= 1000) {
              return `$${(value / 1000).toFixed(1)}k`;
            }
            return `$${value.toFixed(0)}`;
          }
        }
      },
      grid: {
        borderColor: '#e5e7eb',
        strokeDashArray: 5,
        xaxis: {
          lines: {
            show: false
          }
        },
        yaxis: {
          lines: {
            show: true
          }
        },
        padding: {
          top: 0,
          right: 20,
          bottom: 0,
          left: 10
        }
      },
      tooltip: {
        enabled: true,
        theme: 'light',
        y: {
          formatter: (value) => `$${value.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
        },
        style: {
          fontSize: '14px',
          fontFamily: 'Inter, sans-serif'
        }
      }
    };
  });

  private getDefaultChartOptions(): ChartOptions {
    return {
      series: [{ name: 'Ventas', data: [] }],
      chart: {
        type: 'area',
        height: 350,
        toolbar: { show: false }
      },
      colors: ['#3b82f6'],
      stroke: { curve: 'smooth', width: 3 },
      fill: {
        type: 'gradient',
        gradient: {
          shadeIntensity: 1,
          opacityFrom: 0.6,
          opacityTo: 0.1
        }
      },
      dataLabels: { enabled: false },
      xaxis: { categories: [] },
      yaxis: {},
      grid: {},
      tooltip: {}
    };
  }

  // Formatear fecha para mostrar (15 Nov)
  formatDate(dateStr: string): string {
    const date = new Date(dateStr + 'T00:00:00');
    const day = date.getDate();
    const months = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
    return `${day} ${months[date.getMonth()]}`;
  }
}

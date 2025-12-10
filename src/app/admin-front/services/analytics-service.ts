import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { AnalyticsCardsData, DateRange, LiveMetricsData } from '../models/analytics';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class AnalyticsService {

  private http = inject(HttpClient);
  private readonly baseUrl = environment.baseUrl;

  getLiveMetrics(): Observable<LiveMetricsData> {
    return this.http.get<LiveMetricsData>(`${this.baseUrl}/metrics/live`);
  }

  getAnalyticsCards(dateRange: DateRange): Observable<AnalyticsCardsData> {
    return this.http.get<AnalyticsCardsData>(
      `${this.baseUrl}/metrics/analytics-cards`,
      {
        params: {
          from: dateRange.from.toISOString(),
          to: dateRange.to.toISOString()
        }
      }
    );
  }

  exportData(dateRange: DateRange): Observable<Blob> {
    console.log('Exportando datos desde:', dateRange.from, 'hasta:', dateRange.to);

    return this.http.get(`${this.baseUrl}/metrics/export`, {
      params: {
        from: dateRange.from.toISOString(),
        to: dateRange.to.toISOString()
      },
      responseType: 'blob'
    });
  }
}

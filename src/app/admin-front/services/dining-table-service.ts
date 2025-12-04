import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { DiningTableRequest, DiningTableResponse } from '../models/dining-table';
import { environment } from '../../../environments/environment';


@Injectable({
  providedIn: 'root'
})
export class DiningTableService {
  private apiUrl = `${environment.baseUrl}/tables`;

  constructor(private http: HttpClient) {}

  createTable(request: DiningTableRequest): Observable<DiningTableResponse> {
    return this.http.post<DiningTableResponse>(this.apiUrl, request);
  }

  getAllTables(page: number = 0, size: number = 20): Observable<any> {
    const params = new HttpParams()
      .set('page', page.toString())
      .set('size', size.toString());

    return this.http.get<any>(this.apiUrl, { params });
  }

  getTableById(id: string): Observable<DiningTableResponse> {
    return this.http.get<DiningTableResponse>(`${this.apiUrl}/${id}`);
  }

  getTableByNumber(number: number): Observable<DiningTableResponse> {
    return this.http.get<DiningTableResponse>(`${this.apiUrl}/number/${number}`);
  }

  getFilteredTables(status?: string, capacity?: number, page: number = 0, size: number = 20): Observable<any> {
    let params = new HttpParams()
      .set('page', page.toString())
      .set('size', size.toString());

    if (status) {
      params = params.set('status', status);
    }
    if (capacity !== undefined) {
      params = params.set('capacity', capacity.toString());
    }

    return this.http.get<any>(`${this.apiUrl}/filter`, { params });
  }

  updateTableStatus(id: string, status: string): Observable<void> {
    const params = new HttpParams().set('status', status);
    return this.http.patch<void>(`${this.apiUrl}/status/${id}`, null, { params });
  }

  updateTable(id: string, request: DiningTableRequest): Observable<DiningTableResponse> {
    return this.http.patch<DiningTableResponse>(`${this.apiUrl}/${id}`, request);
  }

  deleteTable(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }

  generateQrCode(baseUrl: string, tableNumber: number): Observable<{ qrCodeUrl: string }> {
  return this.http.post<{ qrCodeUrl: string }>(`${this.apiUrl}/generate-qr-code`, {
    baseUrl,
    tableNumber
  });
}
}

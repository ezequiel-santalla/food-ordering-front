import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment.development';
import { LoungeRequest, LoungeResponse, TablePosition, TablePositionResponse } from '../models/loung';
@Injectable({
  providedIn: 'root'
})
export class LoungeService {
  private apiUrl = `${environment.baseUrl}/lounges`;

  constructor(private http: HttpClient) {}

  // Lounge CRUD
  createLounge(request: LoungeRequest): Observable<LoungeResponse> {
    return this.http.post<LoungeResponse>(this.apiUrl, request);
  }

  getAllLounges(): Observable<LoungeResponse[]> {
    return this.http.get<LoungeResponse[]>(this.apiUrl);
  }

  getLoungeById(id: string): Observable<LoungeResponse> {
    return this.http.get<LoungeResponse>(`${this.apiUrl}/${id}`);
  }

  updateLounge(id: string, request: LoungeRequest): Observable<LoungeResponse> {
    return this.http.patch<LoungeResponse>(`${this.apiUrl}/${id}`, request);
  }

  deleteLounge(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }

  // Table Position Management
  addTablePosition(loungeId: string, tablePosition: TablePosition): Observable<TablePositionResponse> {
    return this.http.post<TablePositionResponse>(
      `${this.apiUrl}/${loungeId}/tables`,
      tablePosition
    );
  }

  removeTablePosition(loungeId: string, diningTableId: string): Observable<void> {
    return this.http.delete<void>(
      `${this.apiUrl}/${loungeId}/tables/${diningTableId}`
    );
  }

  updateTablePosition(
    loungeId: string,
    diningTableId: string,
    tablePosition: TablePosition
  ): Observable<TablePositionResponse> {
    return this.http.patch<TablePositionResponse>(
      `${this.apiUrl}/${loungeId}/tables/${diningTableId}`,
      tablePosition
    );
  }

  getTablePositions(loungeId: string): Observable<TablePositionResponse[]> {
    return this.http.get<TablePositionResponse[]>(
      `${this.apiUrl}/${loungeId}/tables`
    );
  }
}

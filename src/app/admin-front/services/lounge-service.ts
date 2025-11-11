import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

import {LoungeResponse, SectorResponse, TablePosition, TablePositionResponse } from '../models/lounge';
import { environment } from '../../../environments/environment.development';

@Injectable({
  providedIn: 'root'
})
export class LoungeService {

  private apiUrl = `${environment.baseUrl}/lounges`;

  constructor(private http: HttpClient) {}

  // Obtiene o crea el lounge automáticamente
  getOrCreateLounge(): Observable<LoungeResponse> {
    return this.http.get<LoungeResponse>(this.apiUrl);
  }

  // Actualiza dimensiones del grid
  updateGridDimensions(width: number, height: number): Observable<LoungeResponse> {
    return this.http.patch<LoungeResponse>(
      `${this.apiUrl}/dimensions?width=${width}&height=${height}`,
      {}
    );
  }

  // Table Position Management (SIN loungeId)
  addTablePosition(tablePosition: TablePosition): Observable<TablePositionResponse> {
    return this.http.post<TablePositionResponse>(
      `${this.apiUrl}/tables`,
      tablePosition
    );
  }

  saveAllTablePositions(positions: TablePosition[]): Observable<TablePositionResponse[]> {
  // ⚠️ NOTA: Asumimos que el endpoint /lounges/tables/batch (o similar) acepta un array de TablePosition
  return this.http.patch<TablePositionResponse[]>(
    `${this.apiUrl}/tables/batch`, // <--- Endpoint sugerido: PATCH /lounges/tables/batch
    positions
  ); }

  removeTablePosition(diningTableId: string): Observable<void> {
    return this.http.delete<void>(
      `${this.apiUrl}/tables/${diningTableId}`
    );
  }

  updateTablePosition(
    diningTableId: string,
    tablePosition: TablePosition
  ): Observable<TablePositionResponse> {
    return this.http.patch<TablePositionResponse>(
      `${this.apiUrl}/tables/${diningTableId}`,
      tablePosition
    );
  }

  getTablePositions(): Observable<TablePositionResponse[]> {
    return this.http.get<TablePositionResponse[]>(
      `${this.apiUrl}/tables`
    );
  }

    getSectors(): Observable<SectorResponse> {
    return this.http.get<SectorResponse>(`${this.apiUrl}/sectors`);
  }
}

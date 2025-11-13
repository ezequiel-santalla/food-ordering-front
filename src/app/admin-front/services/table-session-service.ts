import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, signal } from '@angular/core';
import { PaginatedResponse } from '../../shared/components/pagination/pagination.interface';
import { TableSessionResponse } from '../../shared/models/table-session';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { OrderResponse, OrderStatus } from '../models/order';

@Injectable({
  providedIn: 'root'
})
export class TableSessionService {
readonly API_URL = `${environment.baseUrl}/table-sessions`

  // Estado local
  activeSessions = signal<TableSessionResponse[]>([]);
  currentSession = signal<TableSessionResponse | null>(null);

  constructor(private http: HttpClient) {}

  /**
   * Obtener todas las sesiones activas
   * Endpoint: GET /api/table-sessions/active
   */
  getActiveSessions(page = 0, size = 50): Observable<PaginatedResponse<TableSessionResponse>> {
    const params = new HttpParams()
      .set('page', page.toString())
      .set('size', size.toString());

    return this.http.get<PaginatedResponse<TableSessionResponse>>(`${this.API_URL}/active`, { params });
  }

  /**
   * Obtener una sesión específica por ID
   * Endpoint: GET /api/table-sessions/{id}
   */
  getSessionById(sessionId: string): Observable<TableSessionResponse> {
    return this.http.get<TableSessionResponse>(`${this.API_URL}/${sessionId}`);
  }

  /**
   * Finalizar una sesión (solo staff)
   * Endpoint: PATCH /api/table-sessions/end/{tableId}
   */
  endSession(tableId: string): Observable<void> {
    return this.http.patch<void>(`${this.API_URL}/end/${tableId}`, null);
  }

  /**
   * Obtener sesiones de una mesa específica
   * Endpoint: GET /api/table-sessions/table/{tableNumber}
   */
  getSessionsByTable(tableNumber: number, page = 0, size = 10): Observable<PaginatedResponse<TableSessionResponse>> {
    const params = new HttpParams()
      .set('page', page.toString())
      .set('size', size.toString());

    return this.http.get<PaginatedResponse<TableSessionResponse>>(
      `${this.API_URL}/table/${tableNumber}`,
      { params }
    );
  }

    getOrdersByTableSession(sessionId: string, status?: OrderStatus, page = 0, size = 50): Observable<PaginatedResponse<OrderResponse>> {
 let params = new HttpParams()
 .set('page', page.toString())
 .set('size', size.toString());
 if (status) {
 params = params.set('status', status.toString());
 }

 return this.http.get<PaginatedResponse<OrderResponse>>(`${this.API_URL}/${sessionId}/orders`, { params });
 }

  /**
     * Obtener la ÚLTIMA SESIÓN por ID de MESA
     * Endpoint: GET /api/table-sessions/latest/{tableId}
     * Esto es útil para obtener la sesión activa de una mesa sin buscar entre todas las activas.
     */
 getLatestSessionByTableId(tableId: string): Observable<TableSessionResponse> {
return this.http.get<TableSessionResponse>(`${this.API_URL}/latest/${tableId}`);
}
}

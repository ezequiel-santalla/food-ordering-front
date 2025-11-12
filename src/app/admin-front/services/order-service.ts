import { Injectable, signal } from '@angular/core';
import { Observable, tap } from 'rxjs';
import { HttpClient, HttpParams } from '@angular/common/http';
import { PaginatedResponse } from '../../shared/components/pagination/pagination.interface';
import { environment } from '../../../environments/environment.development';
import { OrderRequest, OrderResponse, OrderStatus } from '../models/order';

@Injectable({
  providedIn: 'root'
})
export class OrderService {
  readonly API_URL = `${environment.baseUrl}/orders`

  // Signals para mantener el estado local
  myOrders = signal<OrderResponse[]>([]);
  tableOrders = signal<OrderResponse[]>([]);
  isLoading = signal(false);
  error = signal<string | null>(null);

  constructor(private http: HttpClient) {}

  // ===================================
  // Métodos de Creación
  // ===================================

  createOrder(orderRequest: OrderRequest): Observable<OrderResponse> {
    return this.http.post<OrderResponse>(this.API_URL, orderRequest);
  }


  getTodayOrders(status?: OrderStatus, page = 0, size = 20): Observable<PaginatedResponse<OrderResponse>> {
    let params = new HttpParams()
      .set('page', page.toString())
      .set('size', size.toString());

    if (status) {
      params = params.set('status', status);
    }

    return this.http.get<PaginatedResponse<OrderResponse>>(`${this.API_URL}/today`, { params });
  }

  getOrdersByTableSession(
    sessionId: string,
    status?: OrderStatus,
    page = 0,
    size = 50
  ): Observable<PaginatedResponse<OrderResponse>> {
    let params = new HttpParams()
      .set('page', page.toString())
      .set('size', size.toString());

    if (status) {
      params = params.set('status', status);
    }

    return this.http.get<PaginatedResponse<OrderResponse>>(
      `/api/table-sessions/${sessionId}/orders`,
      { params }
    ).pipe(
      tap(response => this.tableOrders.set(response.content || []))
    );
  }

  // ===================================
  // Actualización de Estados
  // ===================================

  /**
   * Actualizar el estado de una orden
   * Endpoint: PATCH /api/orders/{id}/status?status={status}
   */
  updateOrderStatus(orderId: string, newStatus: OrderStatus): Observable<OrderResponse> {
    const params = new HttpParams().set('status', newStatus);
    return this.http.patch<OrderResponse>(`${this.API_URL}/${orderId}/status`, null, { params });
  }

  /**
   * Cancelar una orden
   * Endpoint: PATCH /api/orders/{id}/cancel
   */
  cancelOrder(orderId: string): Observable<OrderResponse> {
    return this.http.patch<OrderResponse>(`${this.API_URL}/${orderId}/cancel`, null);
  }

  // ===================================
  // Métodos para Clientes (ya existentes)
  // ===================================

  getMyOrders(): Observable<OrderResponse[]> {
    // Implementación existente
    return this.http.get<OrderResponse[]>(`${this.API_URL}/my-orders`);
  }

  // ===================================
  // Helper: Obtener información de sesión desde una orden
  // ===================================

  /**
   * Dado un conjunto de órdenes, obtener la información de las sesiones
   * para mostrar el número de mesa
   */
  enrichOrdersWithTableInfo(orders: OrderResponse[]): Observable<OrderResponse[]> {
    // Aquí podrías hacer llamadas adicionales para enriquecer los datos
    // Por ahora, devuelve las órdenes tal cual
    return new Observable(observer => {
      observer.next(orders);
      observer.complete();
    });
  }
}

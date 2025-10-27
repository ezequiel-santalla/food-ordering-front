import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { OrderRequest, OrderResponse } from '../models/order.interface';
import { PaginatedResponse } from '../../shared/components/pagination/pagination.interface';
import { environment } from '../../../environments/environment.development';

@Injectable({ providedIn: 'root' })
export class OrderService {

  private http = inject(HttpClient);

  createOrder(orderRequest: OrderRequest): Observable<OrderResponse> {
    return this.http.post<OrderResponse>(`${environment.baseUrl}/orders`, orderRequest);
  }

  getCurrentParticipantOrders(): Observable<PaginatedResponse<OrderResponse>> {
    return this.http.get<PaginatedResponse<OrderResponse>>(`${environment.baseUrl}/participants/orders`);
  }

  getCurrentSessionOrders(): Observable<PaginatedResponse<OrderResponse>> {
    return this.http.get<PaginatedResponse<OrderResponse>>(`${environment.baseUrl}/participants/table-sessions/orders`);
  }
}

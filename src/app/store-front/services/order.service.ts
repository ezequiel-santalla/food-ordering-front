import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { OrderRequest, OrderResponse } from '../models/order.interface';
import { environment } from '../../../environments/environment.development';

@Injectable({ providedIn: 'root' })
export class OrderService {

  private http = inject(HttpClient);

  createOrder(orderRequest: OrderRequest): Observable<OrderResponse> {
    return this.http.post<OrderResponse>(`${environment.baseUrl}/orders`, orderRequest);
  }
}

import { Injectable, signal } from '@angular/core';
import { environment } from '../../../environments/environment';
import {  PaymentPageResponse, PaymentStatus } from '../models/payments';
import { HttpClient, HttpParams } from '@angular/common/http';
import { PaginatedResponse } from '../models/response/employee';
import { Observable, tap } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class PaymentService {

   readonly API_URL = `${environment.baseUrl}/payments`;

  // Signals para mantener el estado local
  payments = signal<PaymentResponse[]>([]);
  isLoading = signal(false);
  error = signal<string | null>(null);

  constructor(private http: HttpClient) {}

  // ===================================
  // Métodos de Creación
  // ===================================

  createPayment(paymentRequest: PaymentRequest): Observable<PaymentResponse> {
    return this.http.post<PaymentResponse>(this.API_URL, paymentRequest);
  }

  // ===================================
  // Métodos de Consulta
  // ===================================

  getTodayPayments(
    status?: PaymentStatus,
    page: number = 0,
    size: number = 20
  ): Observable<PaymentPageResponse> {
    let params = new HttpParams()
      .set('page', page.toString())
      .set('size', size.toString());

    if (status) {
      params = params.set('status', status);
    }

    return this.http.get<PaymentPageResponse>(`${this.API_URL}/today`, { params });
  }

  getPaymentsByContextAndDateRange(
    status: PaymentStatus,
    from: string,
    to: string,
    page: number = 0,
    size: number = 20
  ): Observable<PaymentPageResponse> {
    let params = new HttpParams()
      .set('status', status)
      .set('from', from)
      .set('to', to)
      .set('page', page.toString())
      .set('size', size.toString());

    return this.http.get<PaymentPageResponse>(`${this.API_URL}/context`, { params });
  }

  getPaymentsByTableSession(
    tableSessionId: string,
    status?: PaymentStatus,
    page: number = 0,
    size: number = 20
  ): Observable<PaymentPageResponse> {
    let params = new HttpParams()
      .set('page', page.toString())
      .set('size', size.toString());

    if (status) {
      params = params.set('status', status);
    }

    return this.http.get<PaymentPageResponse>(
      `${this.API_URL}/table-session/${tableSessionId}`,
      { params }
    );
  }

  getPaymentsByOrders(
    orderIds: string[],
    status?: PaymentStatus,
    page: number = 0,
    size: number = 20
  ): Observable<PaymentPageResponse> {
    let params = new HttpParams()
      .set('page', page.toString())
      .set('size', size.toString());

    orderIds.forEach(id => {
      params = params.append('orderIds', id);
    });

    if (status) {
      params = params.set('status', status);
    }

    return this.http.get<PaymentPageResponse>(`${this.API_URL}/orders`, { params });
  }

  getPaymentById(paymentId: string): Observable<PaymentResponse> {
    return this.http.get<PaymentResponse>(`${this.API_URL}/${paymentId}`);
  }

  // ===================================
  // Métodos de Actualización
  // ===================================

  updatePayment(paymentId: string, paymentRequest: PaymentRequest): Observable<PaymentResponse> {
    return this.http.put<PaymentResponse>(`${this.API_URL}/${paymentId}`, paymentRequest);
  }

  completePayment(paymentId: string): Observable<PaymentResponse> {
    return this.http.patch<PaymentResponse>(`${this.API_URL}/${paymentId}/complete`, null);
  }

  cancelPayment(paymentId: string): Observable<PaymentResponse> {
    return this.http.patch<PaymentResponse>(`${this.API_URL}/${paymentId}/cancel`, null);
  }

}

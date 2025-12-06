import { Injectable, inject, signal, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, catchError, tap } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  CheckoutProResponse,
  PaymentProcessRequest,
  PaymentProcessResponse,
  PaymentRequest,
  PaymentResponseDto,
} from '../models/payment.interface';
import { v4 as uuidv4 } from 'uuid';

@Injectable({ providedIn: 'root' })
export class PaymentService {
  private http = inject(HttpClient);

  private _lastPayment = signal<PaymentResponseDto | null>(null);
  private _error = signal<string | null>(null);

  public lastPayment = computed(() => this._lastPayment());
  public error = computed(() => this._error());

  createPayment(
    paymentRequest: PaymentRequest
  ): Observable<PaymentResponseDto> {
    this._error.set(null);

    paymentRequest.idempotencyKey = uuidv4();

    return this.http
      .post<PaymentResponseDto>(
        `${environment.baseUrl}/payments`,
        paymentRequest
      )
      .pipe(
        tap((response) => {
          this._lastPayment.set(response);
        }),
        catchError((error) => {
          const msg =
            error.error?.message || error.message || 'Error al crear el pago';
          this._error.set(msg);
          throw error;
        })
      );
  }

  createCheckoutProPreference(
    paymentId: string
  ): Observable<CheckoutProResponse> {
    return this.http
      .post<CheckoutProResponse>(
        `${environment.baseUrl}/payments/${paymentId}/checkout-pro`,
        {}
      )
      .pipe(
        tap((resp) => console.log('Preference created:', resp)),
        catchError((error) => {
          console.error('Error creating preference:', error);
          throw error;
        })
      );
  }

  processPayment(paymentId: string, req: PaymentProcessRequest) {
    return this.http
      .post<PaymentProcessResponse>(
        `${environment.baseUrl}/payments/${paymentId}/process`,
        req
      )
      .pipe(
        catchError((error) => {
          console.error('Error processing payment:', error);
          throw error;
        })
      );
  }

  getPaymentStatus(paymentId: string) {
    return this.http.get<PaymentProcessResponse>(
      `${environment.baseUrl}/payments/${paymentId}/status`
    );
  }

  clearError() {
    this._error.set(null);
  }

  clearLastPayment() {
    this._lastPayment.set(null);
  }
}

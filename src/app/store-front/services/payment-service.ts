// payment.service.ts
import { Injectable, inject, signal, computed, WritableSignal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, catchError, tap } from 'rxjs';
import { environment } from '../../../environments/environment';
import { PaymentRequest, PaymentResponseDto } from '../models/payment.interface';

@Injectable({ providedIn: 'root' })
export class PaymentService {
  private http = inject(HttpClient);

  private _isProcessing: WritableSignal<boolean> = signal(false);
  private _lastPayment: WritableSignal<PaymentResponseDto | null> = signal(null);
  private _error: WritableSignal<string | null> = signal(null);

  public isProcessing = computed(() => this._isProcessing());
  public lastPayment = computed(() => this._lastPayment());
  public error = computed(() => this._error());

  createPayment(paymentRequest: PaymentRequest): Observable<PaymentResponseDto> {
    
    this._isProcessing.set(true);
    this._error.set(null);

    return this.http
      .post<PaymentResponseDto>(
        `${environment.baseUrl}/payments`,
        paymentRequest
      )
      .pipe(
        tap((response) => {
          console.log('✅ Pago creado exitosamente:', response);
          this._lastPayment.set(response);
          this._isProcessing.set(false);
        }),
        catchError((error) => {
          console.error('❌ Error creando el pago:', error);

          const errorMessage = 
            error.error?.message || 
            error.message || 
            'Error al procesar el pago';
          
          this._error.set(errorMessage);
          this._isProcessing.set(false);
          
          throw error;
        })
      );
  }

  // getMyPayments(): Observable<PaymentResponse[]> {
  //   return this.http
  //     .get<PaymentResponse[]>(`${environment.baseUrl}/participants/payments`)
  //     .pipe(
  //       tap((payments) => console.log('📜 Historial de pagos:', payments)),
  //       catchError((error) => {
  //         console.error('❌ Error obteniendo pagos:', error);
  //         this._error.set('Error al cargar el historial de pagos');
  //         throw error;
  //       })
  //     );
  // }

  // getPaymentById(paymentId: string): Observable<PaymentResponse> {
  //   return this.http
  //     .get<PaymentResponse>(`${environment.baseUrl}/payments/${paymentId}`)
  //     .pipe(
  //       tap((payment) => console.log('💳 Detalles del pago:', payment)),
  //       catchError((error) => {
  //         console.error('❌ Error obteniendo detalles del pago:', error);
  //         this._error.set('Error al cargar los detalles del pago');
  //         throw error;
  //       })
  //     );
  // }

  clearError(): void {
    this._error.set(null);
  }

  clearLastPayment(): void {
    this._lastPayment.set(null);
  }
}
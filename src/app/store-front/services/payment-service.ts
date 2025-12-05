import {
  Injectable,
  inject,
  signal,
  computed,
  WritableSignal,
} from '@angular/core';
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

  private _isProcessing: WritableSignal<boolean> = signal(false);
  private _lastPayment: WritableSignal<PaymentResponseDto | null> =
    signal(null);
  private _error: WritableSignal<string | null> = signal(null);

  public isProcessing = computed(() => this._isProcessing());
  public lastPayment = computed(() => this._lastPayment());
  public error = computed(() => this._error());

  createPayment(
    paymentRequest: PaymentRequest
  ): Observable<PaymentResponseDto> {
    this._isProcessing.set(true);
    this._error.set(null);

    const idempotencyKey = uuidv4();
    console.log('🔑 Generated idempotency key:', idempotencyKey);
    paymentRequest.idempotencyKey = idempotencyKey;

    console.log('📤 Creating payment:', paymentRequest);

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

  processPayment(
    paymentId: string,
    processRequest: PaymentProcessRequest
  ): Observable<PaymentProcessResponse> {
    console.log('⚙️ Processing payment:', paymentId, processRequest);

    return this.http
      .post<PaymentProcessResponse>(
        `${environment.baseUrl}/payments/${paymentId}/process`,
        processRequest
      )
      .pipe(
        tap((response) => {
          console.log('✅ Payment processed:', response);
        }),
        catchError((error) => {
          console.error('❌ Error processing payment:', error);
          const errorMessage =
            error.error?.message ||
            error.message ||
            'Error al procesar el pago';
          this._error.set(errorMessage);
          throw error;
        })
      );
  }

  createCheckoutProPreference(
    paymentId: string
  ): Observable<CheckoutProResponse> {
    console.log('🔧 Creating Checkout Pro preference for:', paymentId);

    return this.http
      .post<CheckoutProResponse>(
        `${environment.baseUrl}/payments/${paymentId}/checkout-pro`,
        {}
      )
      .pipe(
        tap((response) => console.log('✅ Preference created:', response)),
        catchError((error) => {
          console.error('❌ Error creating preference:', error);
          throw error;
        })
      );
  }
  getPaymentStatus(paymentId: string): Observable<PaymentProcessResponse> {
    return this.http
      .get<PaymentProcessResponse>(
        `${environment.baseUrl}/payments/${paymentId}/status`
      )
      .pipe(
        tap((response) => console.log('📊 Payment status:', response)),
        catchError((error) => {
          console.error('❌ Error getting payment status:', error);
          throw error;
        })
      );
  }

  cancelPayment(paymentId: string): Observable<PaymentProcessResponse> {
    return this.http
      .post<PaymentProcessResponse>(
        `${environment.baseUrl}/payments/${paymentId}/cancel`,
        {}
      )
      .pipe(
        tap((response) => console.log('🚫 Payment cancelled:', response)),
        catchError((error) => {
          console.error('❌ Error cancelling payment:', error);
          throw error;
        })
      );
  }

  clearError(): void {
    this._error.set(null);
  }

  clearLastPayment(): void {
    this._lastPayment.set(null);
  }
}

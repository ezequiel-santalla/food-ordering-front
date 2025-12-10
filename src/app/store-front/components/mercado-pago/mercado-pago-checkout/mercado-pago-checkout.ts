import { CommonModule, CurrencyPipe } from '@angular/common';
import {
  Component,
  ElementRef,
  EventEmitter,
  Input,
  Output,
  ViewChild,
  AfterViewInit,
  OnDestroy,
  signal
} from '@angular/core';

declare global {
  interface Window {
    MercadoPago: any;
  }
}

@Component({
  selector: 'app-mercado-pago-checkout',
  standalone: true,
  imports: [CommonModule, CurrencyPipe],
  templateUrl: './mercado-pago-checkout.html',
  styleUrl: './mercado-pago-checkout.css'
})
export class MercadoPagoCheckout implements AfterViewInit, OnDestroy {

  @ViewChild('dialog') dialog?: ElementRef<HTMLDialogElement>;
  @ViewChild('bricksContainer') bricksContainer?: ElementRef;

  @Input() amount = 0;
  @Input() publicKey = '';
  @Input() payerEmail = '';

  @Output() onSuccess = new EventEmitter<any>();
  @Output() onError = new EventEmitter<string>();
  @Output() onCancel = new EventEmitter<void>();

  isLoading = signal(false);
  error = signal<string | null>(null);

  private mpInstance: any = null;
  private bricksBuilder: any = null;
  private cardPaymentBrick: any = null;
  private sdkLoaded = false;

  ngAfterViewInit() {
    this.loadMercadoPagoScript().catch(() =>
      console.warn('No se pudo precargar el SDK de MercadoPago')
    );
  }

  open() {
    this.dialog?.nativeElement.showModal();
    this.initializeMercadoPago();
  }

  close() {
    this.cleanup();
    this.dialog?.nativeElement.close();
    this.onCancel.emit();
  }

  async initializeMercadoPago() {
    try {
      this.isLoading.set(true);
      this.error.set(null);

      await this.loadMercadoPagoScript();

      if (!window.MercadoPago) {
        throw new Error('SDK no disponible');
      }

      this.mpInstance = new window.MercadoPago(this.publicKey);
      this.bricksBuilder = this.mpInstance.bricks();

      const config = {
        initialization: {
          amount: this.amount,
          payer: { email: this.payerEmail || 'test_user@test.com' },
        },
        callbacks: {
          onReady: () => this.isLoading.set(false),
          onSubmit: (formData: any) => {
            this.onSuccess.emit(formData);
          },
          onError: (err: any) => {
            this.error.set('Error en el formulario');
            this.onError.emit('Error en MercadoPago');
          },
        },
      };

      this.cardPaymentBrick = await this.bricksBuilder.create(
        'cardPayment',
        'mp-bricks-container',
        config
      );

    } catch (error: any) {
      console.error(error);

      const msg = error.message?.includes('SDK')
        ? 'No se pudo cargar MercadoPago. Verificá tu conexión.'
        : 'Error inicializando MercadoPago.';

      this.error.set(msg);
    }
  }

  private loadMercadoPagoScript(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (this.sdkLoaded || window.MercadoPago) {
        this.sdkLoaded = true;
        resolve();
        return;
      }

      const existing = document.getElementById('mp-sdk');
      if (existing) {
        existing.addEventListener('load', () => resolve());
        return;
      }

      const script = document.createElement('script');
      script.id = 'mp-sdk';
      script.src = 'https://sdk.mercadopago.com/js/v2';
      script.async = true;

      script.onload = () => {
        this.sdkLoaded = true;
        resolve();
      };

      script.onerror = () => reject('No se pudo cargar el SDK');

      document.head.appendChild(script);
    });
  }

  private cleanup() {
    try {
      if (this.cardPaymentBrick) {
        this.cardPaymentBrick.unmount();
      }
    } catch {}
    this.cardPaymentBrick = null;
    this.bricksBuilder = null;
    this.mpInstance = null;
  }

  ngOnDestroy() {
    this.cleanup();
  }
}

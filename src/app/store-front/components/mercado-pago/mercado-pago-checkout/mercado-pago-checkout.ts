import {
  Component,
  ElementRef,
  EventEmitter,
  Input,
  OnDestroy,
  Output,
  ViewChild,
  AfterViewInit,
  signal
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { MPCheckoutData } from '../../../models/mercado-pago';

declare global {
  interface Window {
    MercadoPago: any;
  }
}
declare const mp: any;

@Component({
  selector: 'app-mercado-pago-checkout',
  imports: [],
  templateUrl: './mercado-pago-checkout.html',
  styleUrl: './mercado-pago-checkout.css'
})
export class MercadoPagoCheckout  implements AfterViewInit, OnDestroy {

  @ViewChild('dialog') dialog?: ElementRef<HTMLDialogElement>;
  @ViewChild('bricksContainer') bricksContainer?: ElementRef;

  @Input() amount: number = 0;
  @Input() publicKey: string = '';
  @Input() payerEmail: string = '';

  @Output() onSuccess = new EventEmitter<MPCheckoutData>();
  @Output() onError = new EventEmitter<string>();
  @Output() onCancel = new EventEmitter<void>();

  isLoading = signal(false);
  isProcessing = signal(false);
  error = signal<string | null>(null);

  private mpInstance: any = null;
  private bricksBuilder: any = null;
  private cardPaymentBrick: any = null;
  private sdkLoaded = false;

  ngAfterViewInit() {
    // Precargar el SDK en background (opcional)
    this.loadMercadoPagoScript().catch(err => {
      console.warn('⚠️ Could not preload MP SDK:', err);
    });
  }

  /**
   * Formatear monto sin usar pipe
   */
  formatAmount(amount: number): string {
    return amount.toLocaleString('es-AR', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
  }

  async open() {
    this.dialog?.nativeElement.showModal();
    this.error.set(null);

    // Esperar un tick para que el modal se renderice
    await new Promise(resolve => setTimeout(resolve, 100));

    await this.initializeMercadoPago();
  }

  close() {
    this.cleanup();
    this.dialog?.nativeElement.close();
    this.onCancel.emit();
  }

  private async initializeMercadoPago() {
    try {
      this.isLoading.set(true);
      this.error.set(null);

      console.log('🔧 Initializing MercadoPago with key:', this.publicKey);

      // ⭐ PASO 1: Asegurar que el SDK esté cargado
      if (!this.sdkLoaded) {
        console.log('📦 Loading MercadoPago SDK...');
        await this.loadMercadoPagoScript();
      }

      // ⭐ PASO 2: Verificar que window.MercadoPago existe
      if (typeof window.MercadoPago === 'undefined') {
        throw new Error('MercadoPago SDK no se cargó correctamente');
      }

      console.log('✅ MercadoPago SDK loaded');

      // ⭐ PASO 3: Crear instancia de MP
      this.mpInstance = new window.MercadoPago(this.publicKey);

      // ⭐ PASO 4: Crear Bricks Builder
      this.bricksBuilder = this.mpInstance.bricks();

      // ⭐ PASO 5: Configuración de Card Payment Brick
      const bricksConfig = {
        initialization: {
          amount: this.amount,
          payer: {
            email: this.payerEmail || 'test_user@test.com'
          }
        },
        customization: {
          visual: {
            style: {
              theme: 'default'
            }
          },
          paymentMethods: {
            maxInstallments: 12,
            minInstallments: 1
          }
        },
        callbacks: {
          onReady: () => {
            console.log('✅ MercadoPago Brick ready');
            this.isLoading.set(false);
          },
          onSubmit: async (formData: any) => {
            console.log('📤 Form submitted:', formData);
            this.isProcessing.set(true);
            this.error.set(null);

            try {
              // Emitir datos al componente padre
              this.onSuccess.emit(formData);

            } catch (error: any) {
              console.error('❌ Error processing payment:', error);
              this.error.set(error.message || 'Error al procesar el pago');
              this.isProcessing.set(false);
              this.onError.emit(error.message);
            }
          },
          onError: (error: any) => {
            console.error('❌ Brick error:', error);
            this.error.set('Error en el formulario de pago');
            this.isLoading.set(false);
          }
        }
      };

      // ⭐ PASO 6: Renderizar el brick
      console.log('🎨 Rendering Card Payment Brick...');
      this.cardPaymentBrick = await this.bricksBuilder.create(
        'cardPayment',
        'mp-bricks-container',
        bricksConfig
      );

      console.log('✅ Card Payment Brick created successfully');

    } catch (error: any) {
      console.error('❌ Error initializing MercadoPago:', error);

      // Mensaje de error más específico
      let errorMessage = 'Error al cargar MercadoPago. ';

      if (error.message?.includes('SDK')) {
        errorMessage += 'No se pudo cargar el SDK de MercadoPago. Verifica tu conexión a internet.';
      } else if (this.publicKey === '' || this.publicKey === 'TEST-tu-public-key-aqui') {
        errorMessage += 'Public Key de MercadoPago no configurada.';
      } else {
        errorMessage += 'Por favor intenta nuevamente.';
      }

      this.error.set(errorMessage);
      this.isLoading.set(false);
    }
  }

  private loadMercadoPagoScript(): Promise<void> {
    return new Promise((resolve, reject) => {
      // Ya está cargado
      if (this.sdkLoaded || typeof window.MercadoPago !== 'undefined') {
        this.sdkLoaded = true;
        resolve();
        return;
      }

      // Ya existe el script en el DOM
      const existingScript = document.getElementById('mercadopago-script');
      if (existingScript) {
        // Esperar a que termine de cargar
        existingScript.addEventListener('load', () => {
          this.sdkLoaded = true;
          resolve();
        });
        return;
      }

      // Crear nuevo script
      console.log('📥 Loading MercadoPago SDK script...');
      const script = document.createElement('script');
      script.id = 'mercadopago-script';
      script.src = 'https://sdk.mercadopago.com/js/v2';
      script.async = true;

      script.onload = () => {
        console.log('✅ MercadoPago script loaded');
        this.sdkLoaded = true;

        // Esperar un poco más para asegurar que window.MercadoPago esté disponible
        setTimeout(() => {
          if (typeof window.MercadoPago !== 'undefined') {
            resolve();
          } else {
            reject(new Error('MercadoPago SDK loaded but not available'));
          }
        }, 500);
      };

      script.onerror = () => {
        console.error('❌ Error loading MercadoPago script');
        reject(new Error('Error loading MercadoPago SDK'));
      };

      document.head.appendChild(script);
    });
  }

  private cleanup() {
    try {
      if (this.cardPaymentBrick) {
        this.cardPaymentBrick.unmount();
        this.cardPaymentBrick = null;
      }
      this.bricksBuilder = null;
      this.mpInstance = null;
    } catch (error) {
      console.error('Error cleaning up MercadoPago:', error);
    }
  }

  ngOnDestroy() {
    this.cleanup();
  }

  // Método público para indicar que el procesamiento terminó
  finishProcessing() {
    this.isProcessing.set(false);
  }

  // Método público para cerrar después de éxito
  closeAfterSuccess() {
    this.cleanup();
    this.dialog?.nativeElement.close();
  }
}

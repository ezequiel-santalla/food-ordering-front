import { Component, inject, signal, computed, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  LucideAngularModule,
  Package,
  CreditCard,
  Banknote,
  Smartphone,
} from 'lucide-angular';

import { OrderService } from '../../../services/order-service';
import { PaymentService } from '../../../services/payment-service';
import { OrderCardComponent } from '../Order-card/order-card';
import {
  PaymentMethod,
  PaymentOrderView,
  PaymentStatus,
  PaymentRequest,  // ⭐ AGREGAR
} from '../../../models/payment.interface';
import { PaymentModalComponent } from '../../payment/payment-modal';
import { SweetAlertService } from '../../../../shared/services/sweet-alert.service';
import { MercadoPagoCheckout } from '../../mercado-pago/mercado-pago-checkout/mercado-pago-checkout';
import { MPCheckoutData } from '../../../models/mercado-pago';

@Component({
  selector: 'app-my-orders',
  standalone: true,
  imports: [
    CommonModule,
    LucideAngularModule,
    OrderCardComponent,
    PaymentModalComponent,
    MercadoPagoCheckout,
  ],
  templateUrl: './my-orders.html',
})
export class MyOrders {
  readonly Package = Package;
  readonly CreditCard = CreditCard;
  readonly Banknote = Banknote;
  readonly Smartphone = Smartphone;

  // Configuración de MercadoPago
  private readonly MP_PUBLIC_KEY = 'TEST-3621b8b6-a838-446f-a23e-38bbe2898210';

  private orderService = inject(OrderService);
  private paymentService = inject(PaymentService);
  private sweetAlertService = inject(SweetAlertService);

  @ViewChild('payModalCmp') payModalCmp?: PaymentModalComponent;
  @ViewChild('mpCheckoutCmp') mpCheckoutCmp?: MercadoPagoCheckout;

  orders = this.orderService.myOrders;
  isLoadingOrders = this.orderService.isLoading;
  orderError = this.orderService.error;

  isProcessingPayment = this.paymentService.isProcessing;
  paymentError = this.paymentService.error;

  private selectedOrderIds = signal<Set<string>>(new Set());
  selectedPaymentMethod = signal<PaymentMethod>(PaymentMethod.CASH);

  // Para tracking del payment creado
  private currentPaymentId = signal<string | null>(null);
  private currentPaymentAmount = signal<number>(0);  // ⭐ AGREGAR para pasar a MP modal

  selectedOrders = computed(() =>
    this.orders().filter((o) => this.selectedOrderIds().has(o.publicId))
  );

  totalToPay = computed(() =>
    this.selectedOrders().reduce((sum, order) => sum + order.totalPrice, 0)
  );

  hasSelectedOrders = computed(() => this.selectedOrderIds().size > 0);

  paymentOrdersView = computed<PaymentOrderView[]>(() =>
    this.selectedOrders().map((o) => ({
      publicId: o.publicId,
      orderNumber: o.orderNumber,
      items: o.orderDetails.map((d) => ({
        quantity: d.quantity,
        productName: d.productName,
        subtotal: d.subtotal,
      })),
    }))
  );

  paymentMethods = [
    { value: PaymentMethod.CASH, label: 'Efectivo', icon: this.Banknote },
    {
      value: PaymentMethod.CREDIT_CARD,
      label: 'Tarjeta de Crédito',
      icon: this.CreditCard,
    },
    {
      value: PaymentMethod.DEBIT_CARD,
      label: 'Tarjeta de Débito',
      icon: this.CreditCard,
    },
  ];



  onOrderSelected(event: { orderId: string; isSelected: boolean }) {
    this.selectedOrderIds.update((ids) => {
      const newIds = new Set(ids);
      event.isSelected
        ? newIds.add(event.orderId)
        : newIds.delete(event.orderId);
      return newIds;
    });
  }

  /**
   * ⭐ MODIFICADO: Ahora usa PaymentRequest completo
   */
  confirmPayment() {
    if (!this.hasSelectedOrders()) return;

    // Evitar órdenes ya pagadas
    const selectableIds = Array.from(this.selectedOrderIds()).filter((id) => {
      const order = this.orders().find((o) => o.publicId === id);
      return (
        !order?.payment || order.payment.status !== PaymentStatus.COMPLETED
      );
    });

    if (selectableIds.length === 0) {
      this.sweetAlertService.showError(
        'Nada para pagar',
        'Las órdenes seleccionadas ya fueron pagadas.'
      );
      this.selectedOrderIds.set(new Set());
      this.payModalCmp?.close();
      return;
    }

    const paymentMethod = this.selectedPaymentMethod();

    // ⭐ CONSTRUIR PaymentRequest (sin idempotencyKey, se genera en service)
    const paymentRequest: PaymentRequest = {
      idempotencyKey: '',  // Se genera automáticamente en el service
      paymentMethod: paymentMethod,
      orderIds: selectableIds
    };

    console.log('📝 Creating payment:', paymentRequest);

    // ⭐ Crear Payment con el objeto completo
    this.paymentService.createPayment(paymentRequest).subscribe({
      next: (payment) => {
        console.log('✅ Payment created:', payment);
        this.currentPaymentId.set(payment.publicId);
        this.currentPaymentAmount.set(payment.amount);  // ⭐ Guardar amount

        // Según el método, procesar diferente
        if (paymentMethod === PaymentMethod.CASH) {
          this.processCashPayment(payment.publicId);
        } else {
          // CREDIT_CARD o DEBIT_CARD → Abrir MercadoPago
          this.openMercadoPagoCheckout(payment.publicId, payment.amount);
        }
      },
      error: (error) => {
        console.error('❌ Error creating payment:', error);
        const errorMessage = this.paymentError() || 'Error al crear el pago';
        this.payModalCmp?.close();
        this.selectedOrderIds.set(new Set());
        this.sweetAlertService.showError('Error', errorMessage);
      },
    });
  }

  /**
   * Procesar pago en efectivo
   */
  private processCashPayment(paymentId: string) {
    this.paymentService
      .processPayment(paymentId, {
        paymentMethod: PaymentMethod.CASH,
        payerEmail: 'cliente@test.com',  // TODO: obtener del usuario actual
      })
      .subscribe({
        next: (response) => {
          console.log('✅ Cash payment processed:', response);
          this.payModalCmp?.close();

          this.sweetAlertService.showConfirmableSuccess(
            '¡Pago registrado!',
            'El personal confirmará tu pago en efectivo.'
          );

          this.orderService.reloadMyOrders?.();
          this.selectedOrderIds.set(new Set());
          this.selectedPaymentMethod.set(PaymentMethod.CASH);
        },
        error: (error) => {
          console.error('❌ Error processing cash payment:', error);
          this.payModalCmp?.close();
          this.selectedOrderIds.set(new Set());
          this.sweetAlertService.showError(
            'Error',
            'Error al procesar el pago en efectivo'
          );
        },
      });
  }

  /**
   * Abrir modal de MercadoPago
   */
  private openMercadoPagoCheckout(paymentId: string, amount: number) {
    // Cerrar modal de confirmación
    this.payModalCmp?.close();

    // Abrir modal de MercadoPago
    setTimeout(() => {
      if (this.mpCheckoutCmp) {
        this.mpCheckoutCmp.amount = amount;
        this.mpCheckoutCmp.publicKey = this.MP_PUBLIC_KEY;
        this.mpCheckoutCmp.payerEmail = 'test_user@test.com';  // TODO: usuario actual

        this.mpCheckoutCmp.open();
      }
    }, 300);
  }

  /**
   * Callback cuando MercadoPago genera el token
   */
  onMPCheckoutSuccess(formData: MPCheckoutData) {
    const paymentId = this.currentPaymentId();
    if (!paymentId) {
      console.error('❌ No payment ID available');
      return;
    }

    console.log('💳 Processing card payment with token:', formData);

    this.paymentService
      .processPayment(paymentId, {
        paymentMethod: this.selectedPaymentMethod(),
        payerEmail: formData.payer.email,
        cardToken: formData.token,
        providerMetadata: {
          payment_method_id: formData.payment_method_id,
          installments: formData.installments,
          issuer_id: formData.issuer_id,
        },
      })
      .subscribe({
        next: (response) => {
          console.log('✅ Card payment processed:', response);

          this.mpCheckoutCmp?.closeAfterSuccess();

          if (response.paymentStatus === PaymentStatus.COMPLETED) {
            this.sweetAlertService.showConfirmableSuccess(
              '¡Pago exitoso!',
              response.message || 'Tu pago fue procesado correctamente.'
            );
          } else if (response.paymentStatus === PaymentStatus.PENDING) {
            this.sweetAlertService.showInfo(
              'Pago pendiente',
              response.message || 'Tu pago está siendo procesado.'
            );
          } else {
            this.sweetAlertService.showError(
              'Pago rechazado',
              response.message || 'No se pudo procesar el pago.'
            );
          }

          this.orderService.reloadMyOrders?.();
          this.selectedOrderIds.set(new Set());
          this.selectedPaymentMethod.set(PaymentMethod.CASH);
          this.currentPaymentId.set(null);
        },
        error: (error) => {
          console.error('❌ Error processing card payment:', error);

          this.mpCheckoutCmp?.finishProcessing();

          this.sweetAlertService.showError(
            'Error al procesar el pago',
            error.error?.message || 'Por favor intenta nuevamente.'
          );
        },
      });
  }

  /**
   * Callback cuando hay error en MercadoPago
   */
  onMPCheckoutError(error: string) {
    console.error('❌ MercadoPago error:', error);
    this.sweetAlertService.showError('Error', error);
  }

  /**
   * Callback cuando usuario cancela
   */
  onMPCheckoutCancel() {
    console.log('ℹ️ MercadoPago checkout cancelled');
    const paymentId = this.currentPaymentId();
    if (paymentId) {
      this.paymentService.cancelPayment(paymentId).subscribe({
        next: () => console.log('✅ Payment cancelled'),
        error: (err) => console.error('❌ Error cancelling payment:', err),
      });
    }

    this.currentPaymentId.set(null);
    this.selectedOrderIds.set(new Set());
  }
}

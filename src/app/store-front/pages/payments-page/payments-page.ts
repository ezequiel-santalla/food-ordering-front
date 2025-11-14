// payments-page.component.ts
import { Component, inject, signal, computed, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  LucideAngularModule,
  CreditCard,
  Banknote,
  Smartphone,
  Receipt,
  Clock,
  CheckCircle,
  XCircle,
  ChevronDown,
  Calendar,
  DollarSign,
} from 'lucide-angular';
import { OrderService } from '../../services/order-service';
import { PaymentService } from '../../services/payment-service';
import { PaymentMethod } from '../../models/payment.interface';
import { OrderCardComponent } from '../../components/order-tabs/Order-card/order-card';
import { SweetAlertService } from '../../../shared/services/sweet-alert.service';
import { PaymentModalComponent } from '../../components/payment/payment-modal';

@Component({
  selector: 'app-payments-page',
  standalone: true,
  imports: [CommonModule, LucideAngularModule, OrderCardComponent],
  templateUrl: './payments-page.html',
})
export class PaymentsPage implements OnInit {
  // Servicios
  private orderService = inject(OrderService);
  private paymentService = inject(PaymentService);
  private sweetAlertService = inject(SweetAlertService);

  // Iconos
  readonly CreditCard = CreditCard;
  readonly Banknote = Banknote;
  readonly Smartphone = Smartphone;
  readonly Receipt = Receipt;
  readonly Clock = Clock;
  readonly CheckCircle = CheckCircle;
  readonly XCircle = XCircle;
  readonly ChevronDown = ChevronDown;
  readonly Calendar = Calendar;
  readonly DollarSign = DollarSign;

    @ViewChild('payModalCmp') payModalCmp?: PaymentModalComponent;

    // Estado de la página
  activeTab = signal<'pay' | 'history'>('pay');

  // Estado de órdenes y pagos
  orders = this.orderService.myOrders;
  isLoadingOrders = this.orderService.isLoading;

  // Historial de pagos
  paymentsHistory = signal<any[]>([]);
  isLoadingPayments = signal(false);

  // Selección de órdenes para pagar
  selectedOrderIds = signal<Set<string>>(new Set());
  selectedPaymentMethod = signal<PaymentMethod>(PaymentMethod.CASH);

  // Estado de procesamiento
  isProcessingPayment = this.paymentService.isProcessing;
  paymentError = this.paymentService.error;

  // Computed properties
  unpaidOrders = computed(() => {
    // Filtrar solo órdenes que pueden ser pagadas (SERVED o COMPLETED)
    return this.orders().filter(
      (order) => order.status === 'SERVED' || order.status === 'COMPLETED'
    );
  });

  selectedOrders = computed(() => {
    const ids = this.selectedOrderIds();
    return this.unpaidOrders().filter((order) => ids.has(order.publicId));
  });

  totalToPay = computed(() => {
    return this.selectedOrders().reduce(
      (sum, order) => sum + order.totalPrice,
      0
    );
  });

  hasSelectedOrders = computed(() => this.selectedOrderIds().size > 0);

  // Métodos de pago
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

  ngOnInit() {
    // Cargar historial de pagos al iniciar
    this.loadPaymentHistory();
  }

  switchTab(tab: 'pay' | 'history') {
    this.activeTab.set(tab);
    if (tab === 'history') {
      this.loadPaymentHistory();
    }
  }

  onOrderSelected(event: { orderId: string; isSelected: boolean }) {
    this.selectedOrderIds.update((ids) => {
      const newIds = new Set(ids);
      if (event.isSelected) {
        newIds.add(event.orderId);
      } else {
        newIds.delete(event.orderId);
      }
      return newIds;
    });
  }

  onPaymentMethodChange(method: PaymentMethod) {
    this.selectedPaymentMethod.set(method);
  }

  selectAllOrders() {
    const allIds = this.unpaidOrders().map((order) => order.publicId);
    this.selectedOrderIds.set(new Set(allIds));
  }

  clearSelection() {
    this.selectedOrderIds.set(new Set());
  }

  processPayment() {
    if (!this.hasSelectedOrders()) {
      this.sweetAlertService.showError(
        'No hay Pedido',
        'Debes seleccionar al menos una orden'
      );
      return;
    }

    const orderIds = Array.from(this.selectedOrderIds());
    const total = this.totalToPay();
    const paymentMethod = this.selectedPaymentMethod();

    console.log('💳 Procesando pago:', { orderIds, total, paymentMethod });

    this.paymentService
      .createPayment({
        paymentMethod,
        orderIds,
      })
      .subscribe({
        next: (response) => {
          console.log('✅ Pago exitoso:', response);
this.payModalCmp?.close(); 
          this.sweetAlertService.showConfirmableSuccess(
            '¡Pago exitoso!',
            `Pagaste $${total.toFixed(2)}`
          );

          this.selectedOrderIds.set(new Set());
          this.selectedPaymentMethod.set(PaymentMethod.CASH);

          this.loadPaymentHistory();
        },
        error: (error) => {
          console.error('❌ Error en el pago:', error);
          const errorMessage = this.paymentError() || 'Error desconocido';
          this.payModalCmp?.close(); 
          this.sweetAlertService.showError(
            'Error al procesar el pago',
            errorMessage
          );
        },
      });
  }

  loadPaymentHistory() {
    // this.isLoadingPayments.set(true);
    // this.paymentService.getMyPayments().subscribe({
    //   next: (payments) => {
    //     this.paymentsHistory.set(payments);
    //     this.isLoadingPayments.set(false);
    //   },
    //   error: (error) => {
    //     console.error('Error cargando historial:', error);
    //     this.isLoadingPayments.set(false);
    //   }
    // });
  }

  getPaymentMethodLabel(method: PaymentMethod): string {
    const found = this.paymentMethods.find((pm) => pm.value === method);
    return found?.label || method;
  }

  getPaymentMethodIcon(method: PaymentMethod) {
    const found = this.paymentMethods.find((pm) => pm.value === method);
    return found?.icon || this.CreditCard;
  }

  formatDate(date: string): string {
    const d = new Date(date);
    return d.toLocaleDateString('es-AR', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  }
}

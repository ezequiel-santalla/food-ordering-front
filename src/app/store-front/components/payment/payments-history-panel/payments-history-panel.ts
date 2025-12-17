import { Component, inject, computed, signal } from '@angular/core';
import { CommonModule, CurrencyPipe } from '@angular/common';
import { PaymentsStore } from '../../../services/payment-store';
import {
  LucideAngularModule,
  WalletCards,
  Clock,
  ChevronDown,
  ChevronUp,
  Trash2,
} from 'lucide-angular';
import { SweetAlertService } from '../../../../shared/services/sweet-alert.service';
import Swal from 'sweetalert2';
import { getPaymentStatusUi, toneToTextClass } from '../../../../shared/models/status-ui';

@Component({
  selector: 'app-payment-history-panel',
  standalone: true,
  imports: [CommonModule, CurrencyPipe, LucideAngularModule],
  templateUrl: './payments-history-panel.html',
})
export class PaymentHistoryPanelComponent {
  private paymentsStore = inject(PaymentsStore);
  private sweet = inject(SweetAlertService);

  readonly Trash2 = Trash2;
  expanded = signal<string | null>(null);

  payments = computed(() => this.paymentsStore.payments());
  isLoading = computed(() => this.paymentsStore.isLoading());

  toggle(id: string) {
    this.expanded.set(this.expanded() === id ? null : id);
  }

  async onCancelPayment(id: string) {
    const confirmed = await this.sweet.confirmCancelPayment();
    if (!confirmed) return;

    this.sweet.showLoading('Cancelando pago…', 'Por favor esperá');

    try {
      await this.paymentsStore.cancelPayment(id);

      Swal.close();

      this.sweet.showPaymentCancelled();
    } catch (e) {
      Swal.close();
      this.sweet.showError('Error', 'No se pudo cancelar el pago.');
    }
  }

  readonly WalletCards = WalletCards;
  readonly Clock = Clock;
  readonly ChevronDown = ChevronDown;
  readonly ChevronUp = ChevronUp;

  paymentUi(status: string) {
    return getPaymentStatusUi(status);
  }

  paymentStatusClass(status: string) {
    return toneToTextClass(this.paymentUi(status).tone);
  }

  paymentMethodLabel(method: string): string {
    return (
      {
        CASH: 'Efectivo',
        CREDIT_CARD: 'Tarjeta de crédito',
        DEBIT_CARD: 'Débito',
        MOBILE_PAYMENT: 'Mercado Pago',
        OTHER: 'Otro',
      }[method] ?? method
    );
  }
}

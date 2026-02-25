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

  private nowMs = signal(Date.now());
  expanded = signal<string | null>(null);
  timer = setInterval(() => this.nowMs.set(Date.now()), 1000);

  readonly Trash2 = Trash2;
  readonly WalletCards = WalletCards;
  readonly Clock = Clock;
  readonly ChevronDown = ChevronDown;
  readonly ChevronUp = ChevronUp;

  payments = computed(() => this.paymentsStore.payments());
  isLoading = computed(() => this.paymentsStore.isLoading());

  ngOnDestroy() {
    clearInterval(this.timer);
  }

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

  remainingSeconds(p: any) {
    this.nowMs();

    if (!p.expiresAt) return null;

    const diff = new Date(p.expiresAt).getTime() - Date.now();
    return Math.max(0, Math.ceil(diff / 1000));
  }

  remainingLabel(p: any) {
    const s = this.remainingSeconds(p);
    if (s == null) return null;

    if (s >= 60) {
      const m = Math.ceil(s / 60);
      return `Quedan ${m} min`;
    }

    if (s <= 5) return `${s}`;

    return `Quedan ${s} s`;
  }
}
